import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import {
  V2contractAddress,
  V2contractAbi,
  PolicastViews,
  PolicastViewsAbi,
} from "@/constants/contract";

const publicClient = createPublicClient({
  chain: base,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://mainnet.base.org"
  ),
});
//
interface AdminWithdrawal {
  marketId: number;
  amount: bigint;
  type: "adminLiquidity" | "prizePool" | "lpRewards";
  description: string;
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

    console.log("Auto-discovering admin withdrawals for user:", userAddress);

    // Discover all admin withdrawals available to user
    const adminWithdrawals = await discoverAdminWithdrawals(userAddress);

    console.log(`Found ${adminWithdrawals.length} admin withdrawals available`);

    // Group by type for easier frontend handling
    const groupedWithdrawals = {
      adminLiquidity: adminWithdrawals.filter(
        (w) => w.type === "adminLiquidity"
      ),
      prizePool: adminWithdrawals.filter((w) => w.type === "prizePool"),
      lpRewards: adminWithdrawals.filter((w) => w.type === "lpRewards"),
    };

    // Calculate totals
    const totals = {
      adminLiquidity: groupedWithdrawals.adminLiquidity.reduce(
        (sum, w) => sum + w.amount,
        0n
      ),
      prizePool: groupedWithdrawals.prizePool.reduce(
        (sum, w) => sum + w.amount,
        0n
      ),
      lpRewards: groupedWithdrawals.lpRewards.reduce(
        (sum, w) => sum + w.amount,
        0n
      ),
      total: adminWithdrawals.reduce((sum, w) => sum + w.amount, 0n),
    };

    // Convert BigInt values to strings for JSON serialization
    const serializedWithdrawals = {
      adminLiquidity: groupedWithdrawals.adminLiquidity.map((w) => ({
        ...w,
        amount: w.amount.toString(),
      })),
      prizePool: groupedWithdrawals.prizePool.map((w) => ({
        ...w,
        amount: w.amount.toString(),
      })),
      lpRewards: groupedWithdrawals.lpRewards.map((w) => ({
        ...w,
        amount: w.amount.toString(),
      })),
    };

    const serializedTotals = {
      adminLiquidity: totals.adminLiquidity.toString(),
      prizePool: totals.prizePool.toString(),
      lpRewards: totals.lpRewards.toString(),
      total: totals.total.toString(),
    };

    return NextResponse.json({
      withdrawals: serializedWithdrawals,
      totals: serializedTotals,
      totalCount: adminWithdrawals.length,
    });
  } catch (error) {
    console.error("Admin auto-discover error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to auto-discover admin withdrawals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Discover all admin withdrawals available to user
async function discoverAdminWithdrawals(
  userAddress: string
): Promise<AdminWithdrawal[]> {
  const withdrawals: AdminWithdrawal[] = [];

  try {
    // First get the actual market count from the contract
    const marketCount = (await (publicClient.readContract as any)({
      address: V2contractAddress,
      abi: V2contractAbi,
      // prefer the canonical "marketCount" name from the V2 ABI; cast to any to avoid strict literal-union errors
      functionName: "marketCount",
      args: [],
    })) as bigint;

    const maxMarketId = Number(marketCount);
    console.log(
      `Contract has ${maxMarketId} markets, checking for admin withdrawals...`
    );

    if (maxMarketId === 0) {
      console.log("No markets found in contract");
      return [];
    }

    // Check markets in batches to avoid rate limits
    const batchSize = 10;

    for (let startId = 0; startId < maxMarketId; startId += batchSize) {
      const endId = Math.min(startId + batchSize, maxMarketId);

      try {
        const batchWithdrawals = await checkMarketBatchForAdmin(
          userAddress,
          startId,
          endId
        );
        withdrawals.push(...batchWithdrawals);

        // Increase delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error checking markets ${startId}-${endId}:`, error);
        // Continue with next batch
      }
    }

    console.log(
      `Found ${withdrawals.length} admin withdrawals via batch checking`
    );
    return withdrawals;
  } catch (error) {
    console.error("Failed to discover admin withdrawals:", error);
    return [];
  }
}

// Check a batch of markets for admin withdrawal opportunities
async function checkMarketBatchForAdmin(
  userAddress: string,
  startId: number,
  endId: number
): Promise<AdminWithdrawal[]> {
  const withdrawals: AdminWithdrawal[] = [];

  for (let marketId = startId; marketId < endId; marketId++) {
    try {
      // Get market info to check market status
      const marketInfo = (await (publicClient.readContract as any)({
        address: V2contractAddress,
        abi: V2contractAbi,
        functionName: "getMarketInfo",
        args: [BigInt(marketId)],
      })) as unknown;

      if (!marketInfo) {
        console.log(`Market ${marketId} returned no info, skipping...`);
        continue;
      }

      // Get market creator from Views contract
      const creator = (await (publicClient.readContract as any)({
        address: PolicastViews,
        abi: PolicastViewsAbi, // Use the correct Views contract ABI
        functionName: "getMarketCreator",
        args: [BigInt(marketId)],
      })) as string;

      // Parse the market info tuple (V3 contract structure)
      const mi = marketInfo as readonly any[];
      const question = String(mi[0] ?? "");
      const description = String(mi[1] ?? "");
      const endTime = BigInt(mi[2] ?? 0n);
      const category = Number(mi[3] ?? 0);
      const optionCount = BigInt(mi[4] ?? 0n);
      const resolved = Boolean(mi[5]);
      const resolvedOutcome = Boolean(mi[6]); // This is different from disputed
      const marketType = Number(mi[7] ?? 0);
      const invalidated = Boolean(mi[8]);
      const totalVolume = BigInt(mi[9] ?? 0n);

      // Check if user is the market creator
      const isCreator = creator.toLowerCase() === userAddress.toLowerCase();

      console.log(`Market ${marketId} analysis:`, {
        question: question.slice(0, 50),
        creator,
        userAddress,
        isCreator,
        resolved,
        resolvedOutcome,
        invalidated,
        marketType,
        totalVolume: totalVolume.toString(),
      });

      if (isCreator) {
        // 1. Check for admin liquidity withdrawal
        // We need to get market financials to check admin liquidity status
        try {
          const marketFinancials = (await (publicClient.readContract as any)({
            address: PolicastViews, // Use Views contract for financials too
            abi: PolicastViewsAbi, // Use Views ABI
            functionName: "getMarketFinancials",
            args: [BigInt(marketId)],
          })) as unknown;

          if (marketFinancials) {
            const mf = marketFinancials as readonly any[];
            const adminInitialLiquidity = BigInt(mf[0] ?? 0n);
            const userLiquidity = BigInt(mf[1] ?? 0n);
            const platformFeesCollected = BigInt(mf[2] ?? 0n);
            const adminLiquidityClaimed = Boolean(mf[3]);

            console.log(`Market ${marketId} financials:`, {
              adminInitialLiquidity: adminInitialLiquidity.toString(),
              userLiquidity: userLiquidity.toString(),
              platformFeesCollected: platformFeesCollected.toString(),
              adminLiquidityClaimed,
              resolved,
              resolvedOutcome,
              invalidated,
              isInvalidatedMarket: invalidated,
              marketType,
            });

            // For invalidated markets, check if there are any special withdrawal mechanisms
            if (invalidated && adminInitialLiquidity === 0n) {
              console.log(
                `Market ${marketId} is invalidated with 0 admin liquidity - this might be expected behavior for refunded markets`
              );
            }

            // Admin can withdraw initial liquidity if:
            // - There's admin liquidity to claim
            // - Admin hasn't claimed liquidity yet
            // - Market is resolved OR invalidated (invalidated markets also allow withdrawals)
            if (
              adminInitialLiquidity > 0n &&
              !adminLiquidityClaimed &&
              (resolved || invalidated)
            ) {
              const description = invalidated
                ? `Admin liquidity from invalidated market: ${question.slice(
                    0,
                    50
                  )}...`
                : `Admin liquidity from resolved market: ${question.slice(
                    0,
                    50
                  )}...`;

              withdrawals.push({
                marketId,
                amount: adminInitialLiquidity,
                type: "adminLiquidity",
                description,
              });
              console.log(
                `Found admin liquidity withdrawal for market ${marketId}: ${adminInitialLiquidity.toString()} (${
                  invalidated ? "invalidated" : "resolved"
                })`
              );
            } else {
              console.log(
                `No admin liquidity withdrawal for market ${marketId}: ` +
                  `amount=${adminInitialLiquidity.toString()}, ` +
                  `claimed=${adminLiquidityClaimed}, ` +
                  `resolved=${resolved}, ` +
                  `invalidated=${invalidated}`
              );
            }
          }
        } catch (error) {
          console.debug(
            `Could not get financials for market ${marketId}:`,
            error
          );
        }

        // 2. Check for unused prize pool withdrawal (free markets only)
        const isFreeMarket = await checkIfFreeMarket(marketId);
        if (isFreeMarket && resolved) {
          try {
            const unusedPrizePool = await getUnusedPrizePool(marketId);
            if (unusedPrizePool > 0n) {
              withdrawals.push({
                marketId,
                amount: unusedPrizePool,
                type: "prizePool",
                description: `Unused prize pool for free market "${question.slice(
                  0,
                  30
                )}..."`,
              });
            }
          } catch (error) {
            console.debug(
              `Could not get unused prize pool for market ${marketId}:`,
              error
            );
          }
        }
      }

      // 3. LP Rewards are not available in V3 LMSR contract
      // The V3 contract uses LMSR instead of traditional LP reward system
      console.log(
        `Market ${marketId}: LP rewards not available in V3 contract (uses LMSR)`
      );
    } catch (error: any) {
      // Handle specific error types
      if (
        error?.data?.errorName === "InvalidMarket" ||
        error?.message?.includes("InvalidMarket")
      ) {
        console.debug(`Market ${marketId} does not exist, skipping...`);
      } else {
        console.error(
          `Market ${marketId} check failed with unexpected error:`,
          {
            error: error?.message || "Unknown error",
            errorName: error?.data?.errorName,
            marketId,
          }
        );
      }
      // Continue with next market regardless of error type
    }
  }

  return withdrawals;
}

// Check if market is a free market
async function checkIfFreeMarket(marketId: number): Promise<boolean> {
  try {
    const freeMarketInfo = await (publicClient.readContract as any)({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getFreeMarketInfo",
      args: [BigInt(marketId)],
    });

    // If we get data back, it's a free market
    return !!freeMarketInfo;
  } catch (error) {
    // If call fails, it's not a free market
    return false;
  }
}

// Get unused prize pool for a free market
async function getUnusedPrizePool(marketId: number): Promise<bigint> {
  try {
    // Get free market info to understand the prize pool configuration
    const freeMarketInfo = (await (publicClient.readContract as any)({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getFreeMarketInfo",
      args: [BigInt(marketId)],
    })) as unknown;

    if (!freeMarketInfo) {
      return 0n;
    }

    const fm = freeMarketInfo as readonly any[];
    const maxParticipants = BigInt(fm[0] ?? 0n);
    const tokensPerParticipant = BigInt(fm[1] ?? 0n);
    const currentParticipants = BigInt(fm[2] ?? 0n);
    const totalPrizePool = BigInt(fm[3] ?? 0n);
    // prizePoolWithdrawn may be boolean or bigint depending on ABI shape
    const prizePoolWithdrawn = Boolean(fm[4]);

    // If prize pool already withdrawn, no unused amount
    if (prizePoolWithdrawn) {
      return 0n;
    }

    // Calculate unused prize pool based on participation
    const maxPossiblePrizePool = maxParticipants * tokensPerParticipant;
    const actualPrizePool = currentParticipants * tokensPerParticipant;
    const unusedPrizePool = maxPossiblePrizePool - actualPrizePool;

    console.debug(`Market ${marketId} prize pool analysis:`, {
      maxParticipants: maxParticipants.toString(),
      tokensPerParticipant: tokensPerParticipant.toString(),
      currentParticipants: currentParticipants.toString(),
      maxPossiblePrizePool: maxPossiblePrizePool.toString(),
      actualPrizePool: actualPrizePool.toString(),
      unusedPrizePool: unusedPrizePool.toString(),
    });

    return unusedPrizePool > 0n ? unusedPrizePool : 0n;
  } catch (error) {
    console.error(
      `Error getting unused prize pool for market ${marketId}:`,
      error
    );
    return 0n;
  }
}
