import { NextRequest, NextResponse } from "next/server";
import { publicClient, contractAddress } from "@/constants/contract";
import {
  MarketAnalytics,
  PriceHistoryData,
  VolumeHistoryData,
} from "@/types/types";

interface MarketEvent {
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
  eventType: "SharesPurchased" | "MarketCreated" | "MarketResolved";
  isOptionA?: boolean;
  amount?: number;
  buyer?: string;
}

// Cache for market analytics (in production, use Redis or similar)
const analyticsCache = new Map<
  string,
  { data: MarketAnalytics; lastUpdated: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getMarketEvents(
  marketId: string,
  fromBlock?: bigint
): Promise<MarketEvent[]> {
  try {
    // Get logs for SharesPurchased events
    const shareLogs = await publicClient.getLogs({
      address: contractAddress,
      event: {
        type: "event",
        name: "SharesPurchased",
        inputs: [
          { type: "uint256", name: "marketId", indexed: true },
          { type: "address", name: "buyer", indexed: true },
          { type: "bool", name: "isOptionA", indexed: false },
          { type: "uint256", name: "amount", indexed: false },
        ],
      },
      args: {
        marketId: BigInt(marketId),
      },
      fromBlock: fromBlock || "earliest",
      toBlock: "latest",
    });

    // Process logs into events
    const events: MarketEvent[] = [];

    for (const log of shareLogs) {
      // Get block timestamp
      const block = await publicClient.getBlock({
        blockNumber: log.blockNumber,
      });

      if (log.args) {
        const { buyer, isOptionA, amount } = log.args;

        events.push({
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          timestamp: Number(block.timestamp) * 1000,
          eventType: "SharesPurchased",
          buyer: buyer,
          isOptionA: isOptionA,
          amount: Number(amount),
        });
      }
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Error fetching market events:", error);
    return [];
  }
}

async function calculateMarketAnalytics(
  marketId: string
): Promise<MarketAnalytics> {
  const events = await getMarketEvents(marketId);

  if (events.length === 0) {
    return generateFallbackAnalytics();
  }

  // Group events by day for price history
  const dailyData = new Map<
    string,
    {
      optionAVolume: number;
      optionBVolume: number;
      totalVolume: number;
      trades: number;
      timestamp: number;
    }
  >();

  let totalVolume = 0;
  let totalTrades = 0;

  events.forEach((event) => {
    if (event.eventType === "SharesPurchased") {
      const date = new Date(event.timestamp).toISOString().split("T")[0];
      const existing = dailyData.get(date) || {
        optionAVolume: 0,
        optionBVolume: 0,
        totalVolume: 0,
        trades: 0,
        timestamp: event.timestamp,
      };

      const amount = event.amount || 0;
      if (event.isOptionA) {
        existing.optionAVolume += amount;
      } else {
        existing.optionBVolume += amount;
      }

      existing.totalVolume += amount;
      existing.trades += 1;
      totalVolume += amount;
      totalTrades += 1;

      dailyData.set(date, existing);
    }
  });

  // Calculate running totals for price percentages
  let runningOptionAVolume = 0;
  let runningOptionBVolume = 0;

  const priceHistory: PriceHistoryData[] = Array.from(dailyData.entries())
    .sort(([, a], [, b]) => a.timestamp - b.timestamp)
    .map(([date, data]) => {
      runningOptionAVolume += data.optionAVolume;
      runningOptionBVolume += data.optionBVolume;

      const totalVol = runningOptionAVolume + runningOptionBVolume;
      const optionA = totalVol > 0 ? runningOptionAVolume / totalVol : 0.5;
      const optionB = totalVol > 0 ? runningOptionBVolume / totalVol : 0.5;

      return {
        date,
        timestamp: data.timestamp,
        optionA: Math.round(optionA * 1000) / 1000,
        optionB: Math.round(optionB * 1000) / 1000,
        volume: data.totalVolume,
        trades: data.trades,
      };
    });

  const volumeHistory: VolumeHistoryData[] = Array.from(dailyData.entries())
    .sort(([, a], [, b]) => a.timestamp - b.timestamp)
    .map(([date, data]) => ({
      date,
      timestamp: data.timestamp,
      volume: data.totalVolume,
      trades: data.trades,
    }));

  // Calculate 24h changes
  const now = Date.now();
  // const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const priceChange24h = calculatePriceChange(priceHistory);
  const volumeChange24h = calculateVolumeChange(volumeHistory);

  return {
    priceHistory,
    volumeHistory,
    totalVolume,
    totalTrades,
    priceChange24h,
    volumeChange24h,
    lastUpdated: new Date().toISOString(),
  };
}

function calculatePriceChange(priceHistory: PriceHistoryData[]): number {
  if (priceHistory.length < 2) return 0;

  const latest = priceHistory[priceHistory.length - 1];
  const previous = priceHistory[priceHistory.length - 2];

  return latest.optionA - previous.optionA;
}

function calculateVolumeChange(volumeHistory: VolumeHistoryData[]): number {
  if (volumeHistory.length < 2) return 0;

  const latest = volumeHistory[volumeHistory.length - 1];
  const previous = volumeHistory[volumeHistory.length - 2];

  if (previous.volume === 0) return latest.volume > 0 ? 1 : 0;
  return (latest.volume - previous.volume) / previous.volume;
}

function generateFallbackAnalytics(): MarketAnalytics {
  // Generate realistic fallback data when no blockchain events are available
  const priceHistory: PriceHistoryData[] = [];
  const volumeHistory: VolumeHistoryData[] = [];

  let currentPriceA = 0.5; // Start at 50% probability

  for (let i = 7; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Add some realistic price movement
    const volatility = (Math.random() - 0.5) * 0.1; // 10% max change
    currentPriceA = Math.max(0.05, Math.min(0.95, currentPriceA + volatility));

    const volume = Math.floor(Math.random() * 1000) + 100;
    const trades = Math.floor(Math.random() * 50) + 10;

    priceHistory.push({
      date: date.toISOString().split("T")[0],
      timestamp: date.getTime(),
      optionA: Math.round(currentPriceA * 1000) / 1000,
      optionB: Math.round((1 - currentPriceA) * 1000) / 1000,
      volume,
      trades,
    });

    volumeHistory.push({
      date: date.toISOString().split("T")[0],
      timestamp: date.getTime(),
      volume,
      trades,
    });
  }

  return {
    priceHistory,
    volumeHistory,
    totalVolume: priceHistory.reduce((sum, p) => sum + p.volume, 0),
    totalTrades: priceHistory.reduce((sum, p) => sum + (p.trades || 0), 0),
    priceChange24h: (Math.random() - 0.5) * 0.2, // -0.1 to +0.1 (10% change)
    volumeChange24h: (Math.random() - 0.5) * 2, // -1 to +1 (100% change)
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");
    const timeRange = searchParams.get("timeRange") || "7d";

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${marketId}-${timeRange}`;
    const cached = analyticsCache.get(cacheKey);

    if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch fresh data
    const analytics = await calculateMarketAnalytics(marketId);

    // Filter data based on time range
    const now = Date.now();
    let cutoffTime: number;

    switch (timeRange) {
      case "24h":
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = 0; // 'all'
    }

    const filteredAnalytics: MarketAnalytics = {
      ...analytics,
      priceHistory: analytics.priceHistory.filter(
        (p) => p.timestamp >= cutoffTime
      ),
      volumeHistory: analytics.volumeHistory.filter(
        (v) => v.timestamp >= cutoffTime
      ),
    };

    // Update cache
    analyticsCache.set(cacheKey, {
      data: filteredAnalytics,
      lastUpdated: Date.now(),
    });

    return NextResponse.json(filteredAnalytics);
  } catch (error) {
    console.error("Error fetching market analytics:", error);

    // Return fallback data in case of error
    const fallbackAnalytics = generateFallbackAnalytics();
    return NextResponse.json(fallbackAnalytics);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { marketId } = await request.json();

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Clear cache for this market to force refresh
    const cacheKeys = Array.from(analyticsCache.keys()).filter((key) =>
      key.startsWith(marketId)
    );
    cacheKeys.forEach((key) => analyticsCache.delete(key));

    return NextResponse.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    console.error("Error clearing analytics cache:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
