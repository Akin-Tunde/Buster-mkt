import { NextRequest, NextResponse } from "next/server";
import { subgraphAnalytics } from "@/lib/subgraph-analytics";
import { MarketAnalytics } from "@/types/types";

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

    // Get analytics from subgraph////
    const analytics = await subgraphAnalytics.getMarketAnalytics(marketId);

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

    return NextResponse.json(filteredAnalytics);
  } catch (error) {
    console.error("Error fetching market analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    subgraphAnalytics.clearCache(marketId);

    return NextResponse.json({ success: true, message: "Cache cleared" });
  } catch (error) {
    console.error("Error clearing analytics cache:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
