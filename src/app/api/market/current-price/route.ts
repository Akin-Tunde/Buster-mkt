import { NextRequest, NextResponse } from "next/server";
import {
  publicClient,
  contractAddress,
  contractAbi,
} from "@/constants/contract";

// Cache for current prices
const priceCache = new Map<
  string,
  {
    data: unknown;
    lastUpdated: number;
  }
>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function getCurrentMarketPrice(marketId: string) {
  try {
    // Get the current market info from the contract
    const marketData = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "getMarketInfo",
      args: [BigInt(marketId)],
    });

    // Extract current shares for each option
    const [
//       question,
//       optionA,
//       optionB,
//       endTime,
//       outcome,
      totalOptionAShares,
      totalOptionBShares,
//       resolved,
    ] = marketData as unknown as any[];

    const totalShares = Number(totalOptionAShares) + Number(totalOptionBShares);
    const currentPriceA =
      totalShares > 0 ? Number(totalOptionAShares) / totalShares : 0.5;
    const currentPriceB =
      totalShares > 0 ? Number(totalOptionBShares) / totalShares : 0.5;

    // Get recent trading activity
    const recentLogs = await publicClient.getLogs({
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
      fromBlock: "latest",
      toBlock: "latest",
    });

    let lastTrade = null;
    if (recentLogs.length > 0) {
      const latestLog = recentLogs[recentLogs.length - 1];
      if (latestLog.args) {
        const block = await publicClient.getBlock({
          blockNumber: latestLog.blockNumber,
        });
        lastTrade = {
          timestamp: Number(block.timestamp) * 1000,
          option: latestLog.args.isOptionA ? ("A" as const) : ("B" as const),
          amount: Number(latestLog.args.amount),
          price: latestLog.args.isOptionA ? currentPriceA : currentPriceB,
        };
      }
    }

    return {
      currentPriceA: Math.round(currentPriceA * 1000) / 1000,
      currentPriceB: Math.round(currentPriceB * 1000) / 1000,
      totalShares,
      lastTrade,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching current market price:", error);

    // Return mock data if blockchain call fails
    const priceA = 0.5 + (Math.random() - 0.5) * 0.4; // Random between 0.3-0.7
    const priceB = 1 - priceA;

    return {
      currentPriceA: Math.round(priceA * 1000) / 1000,
      currentPriceB: Math.round(priceB * 1000) / 1000,
      totalShares: Math.floor(Math.random() * 10000) + 1000,
      lastTrade: {
        timestamp: Date.now() - Math.random() * 60000, // Within last minute
        option: Math.random() > 0.5 ? ("A" as const) : ("B" as const),
        amount: Math.floor(Math.random() * 1000) + 100,
        price: Math.random() > 0.5 ? priceA : priceB,
      },
      timestamp: Date.now(),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = priceCache.get(marketId);
    if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch fresh data
    const priceData = await getCurrentMarketPrice(marketId);

    // Update cache
    priceCache.set(marketId, {
      data: priceData,
      lastUpdated: Date.now(),
    });

    return NextResponse.json(priceData);
  } catch (error) {
    console.error("Error in current price API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
