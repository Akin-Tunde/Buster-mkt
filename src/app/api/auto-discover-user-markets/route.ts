import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { V2contractAddress, V2contractAbi } from "@/constants/contract";

const publicClient = createPublicClient({
  chain: base,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://mainnet.base.org"
  ),
});
//
interface UserWinnings {
  marketId: number;
  amount: bigint;
  hasWinnings: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    console.log("Auto-discovering markets for user:", userAddress);

    // Step 1: Discover markets where user participated
    const participatedMarkets = await discoverUserMarkets(userAddress);

    console.log(
      `Found ${participatedMarkets.length} markets user participated in:`,
      participatedMarkets
    );

    // Step 2: Check winnings eligibility for each market
    const winningsData: UserWinnings[] = [];

    for (const marketId of participatedMarkets) {
      try {
        const result = (await (publicClient.readContract as any)({
          address: V2contractAddress,
          abi: V2contractAbi,
          functionName: "getUserWinnings",
          args: [BigInt(marketId), userAddress as `0x${string}`],
        })) as unknown;

        const r = result as readonly any[];
        const hasWinnings = Boolean(r[0]);
        const amount = BigInt(r[1] ?? 0n);

        if (hasWinnings && amount > 0n) {
          winningsData.push({
            marketId,
            amount,
            hasWinnings: true,
          });
        }
      } catch (error) {
        console.error(`Error checking winnings for market ${marketId}:`, error);
        // Continue with other markets
      }
    }

    console.log(`Found ${winningsData.length} markets with claimable winnings`);

    return NextResponse.json({
      participatedMarkets,
      winningsData,
      totalMarkets: participatedMarkets.length,
      claimableMarkets: winningsData.length,
    });
  } catch (error) {
    console.error("Auto-discover user markets error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to auto-discover user markets: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Discover all markets where user participated
async function discoverUserMarkets(userAddress: string): Promise<number[]> {
  const participatedMarkets: Set<number> = new Set();

  try {
    // Method 1: Try to read userTradeHistory directly (most efficient)
    console.log("Trying Method 1: userTradeHistory");
    const tradeHistory = await readUserTradeHistory(userAddress);

    if (tradeHistory && tradeHistory.length > 0) {
      console.log(`Found ${tradeHistory.length} trades in userTradeHistory`);

      // Extract unique market IDs from trades
      tradeHistory.forEach((trade: any) => {
        if (trade && typeof trade.marketId !== "undefined") {
          participatedMarkets.add(Number(trade.marketId));
        }
      });

      console.log(
        `Extracted ${participatedMarkets.size} unique markets from trade history`
      );
      return Array.from(participatedMarkets).sort((a, b) => a - b);
    }
  } catch (error) {
    console.warn("Method 1 failed, falling back to Method 2:", error);
  }

  // Method 2: Batch check markets using getUserShares (fallback)
  console.log("Using Method 2: Batch market checking");
  const batchSize = 10; // Check 10 markets at a time
  const maxMarketId = 200; // Check up to market ID 200 (configurable)

  for (let startId = 0; startId < maxMarketId; startId += batchSize) {
    const endId = Math.min(startId + batchSize, maxMarketId);

    try {
      const batchMarkets = await checkMarketBatch(userAddress, startId, endId);
      batchMarkets.forEach((marketId) => participatedMarkets.add(marketId));

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error checking markets ${startId}-${endId}:`, error);
      // Continue with next batch
    }
  }

  console.log(`Found ${participatedMarkets.size} markets via batch checking`);
  return Array.from(participatedMarkets).sort((a, b) => a - b);
}

// Try to read user's trade history directly from contract
async function readUserTradeHistory(userAddress: string): Promise<any[]> {
  try {
    const trades: any[] = [];
    let index = 0;
    const maxAttempts = 100; // Prevent infinite loops

    while (index < maxAttempts) {
      try {
        const trade = (await (publicClient.readContract as any)({
          address: V2contractAddress,
          abi: V2contractAbi,
          functionName: "userTradeHistory",
          args: [userAddress as `0x${string}`, BigInt(index)],
        })) as unknown;

        if (trade) {
          trades.push(trade);
          index++;
        } else {
          // No more trades
          break;
        }
      } catch (error) {
        // If we get a contract revert, it likely means we've reached the end
        console.log(`Reached end of trade history at index ${index}`);
        break;
      }
    }

    console.log(
      `Successfully read ${trades.length} trades from userTradeHistory`
    );
    return trades;
  } catch (error) {
    console.error("Failed to read user trade history:", error);
    throw error;
  }
}

// Check a batch of markets for user participation
async function checkMarketBatch(
  userAddress: string,
  startId: number,
  endId: number
): Promise<number[]> {
  const participatedMarkets: number[] = [];

  for (let marketId = startId; marketId < endId; marketId++) {
    try {
      // Check if user has shares in this market
      const shares = (await (publicClient.readContract as any)({
        address: V2contractAddress,
        abi: V2contractAbi,
        functionName: "getUserShares",
        args: [BigInt(marketId), userAddress as `0x${string}`],
      })) as unknown;

      // If user has any shares in any option, they participated
      const sharesArr = (shares as readonly any[]).map((s) => BigInt(s ?? 0n));
      const hasParticipation = sharesArr.some((share) => share > 0n);

      if (hasParticipation) {
        participatedMarkets.push(marketId);
      }
    } catch (error) {
      // Market might not exist or other error, continue
      console.debug(`Market ${marketId} check failed:`, error);
    }
  }

  return participatedMarkets;
}
