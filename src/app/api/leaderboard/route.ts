import { NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import NodeCache from "node-cache";
import {
  publicClient,
  contractAddress,
  contractAbi,
  tokenAddress as defaultTokenAddress,
  tokenAbi as defaultTokenAbi,
  V2contractAddress,
  V2contractAbi,
} from "@/constants/contract";
import { Address } from "viem";

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 }); // 1-hour TTL//
const CACHE_KEY = "leaderboard_v7"; // Updated version for V1+V2 combined
const NEYNAR_CACHE_KEY = "neynar_users_v7";
const PAGE_SIZE = 100; // Users per contract call

interface NeynarRawUser {
  username: string;
  fid: number;
  pfp_url?: string;
}

interface NeynarUser {
  username: string;
  fid: string;
  pfp_url: string | null;
}

interface LeaderboardEntry {
  username: string;
  fid: string;
  pfp_url: string | null;
  winnings: number;
  voteCount: number;
  address: string;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 2000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (i === retries - 1) throw error;
      let delay = baseDelay * Math.pow(2, i);
      if (error?.status === 429) {
        delay = Math.max(delay, 10000);
        console.warn(`Rate limit hit, waiting ${delay}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries reached");
}

async function batchFetchNeynarUsers(
  neynar: NeynarAPIClient,
  addresses: string[],
  batchSize = 25
): Promise<Record<string, NeynarUser[]>> {
  const result: Record<string, NeynarUser[]> = {};
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    try {
      const usersMap = await withRetry(() =>
        neynar.fetchBulkUsersByEthOrSolAddress({
          addresses: batch,
          addressTypes: ["custody_address", "verified_address"],
        })
      );
      for (const [address, users] of Object.entries(usersMap)) {
        result[address.toLowerCase()] = users.map((user: NeynarRawUser) => ({
          username: user.username,
          fid: user.fid.toString(),
          pfp_url: user.pfp_url || null,
        }));
      }
    } catch (error) {
      console.error(
        `Failed to fetch Neynar batch ${i / batchSize + 1}:`,
        error
      );
    }
  }
  return result;
}

export async function GET() {
  const cachedLeaderboard = cache.get<LeaderboardEntry[]>(CACHE_KEY);
  if (cachedLeaderboard) {
    console.log("✅ Serving from cache");
    // Ensure no BigInt values in cached data by re-serializing
    const safeLeaderboard = JSON.parse(
      JSON.stringify(cachedLeaderboard, (key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );
    return NextResponse.json(safeLeaderboard);
  }

  try {
    console.log("🚀 Starting leaderboard fetch...");

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      console.error("❌ NEYNAR_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing NEYNAR_API_KEY" },
        { status: 500 }
      );
    }

    const neynar = new NeynarAPIClient({ apiKey: neynarApiKey });
    console.log("✅ Neynar client initialized.");

    const [tokenDecimals] = await withRetry(() =>
      publicClient.multicall({
        contracts: [
          {
            address: defaultTokenAddress,
            abi: defaultTokenAbi,
            functionName: "decimals",
          },
        ],
      })
    ).then((results) => [Number(results[0].result)]);
    console.log(`💸 Token Decimals: ${tokenDecimals}`);

    console.log("📊 Fetching leaderboard from V1 and V2 contracts...");

    // Fetch V1 leaderboard
    const totalParticipantsV1 = (await withRetry(() =>
      publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "getAllParticipantsCount",
      })
    )) as bigint;

    const entriesV1: {
      user: Address;
      totalWinnings: bigint;
      voteCount: number;
    }[] = [];
    for (
      let start = 0;
      start < Number(totalParticipantsV1);
      start += PAGE_SIZE
    ) {
      const batch = (await withRetry(() =>
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getLeaderboard",
          args: [BigInt(start), BigInt(PAGE_SIZE)],
        })
      )) as unknown as {
        user: Address;
        totalWinnings: bigint;
        voteCount: number;
      }[];
      entriesV1.push(...batch);
    }

    // Fetch V2 leaderboard using allParticipants array and userPortfolios mapping
    console.log("📊 Fetching V2 participants and portfolios...");
    const entriesV2: {
      user: Address;
      totalWinnings: bigint;
      voteCount: number;
    }[] = [];

    try {
      // First, get the total number of participants in V2
      // allParticipants is a public array, so we can get its length
      let v2ParticipantIndex = 0;
      let hasMoreParticipants = true;

      // Fetch participants in batches to avoid timeout
      while (hasMoreParticipants && v2ParticipantIndex < 10000) {
        // Safety limit
        const batchPromises: Promise<any>[] = [];

        // Fetch up to PAGE_SIZE participants at once
        for (let i = 0; i < PAGE_SIZE; i++) {
          const currentIndex = v2ParticipantIndex + i;
          batchPromises.push(
            withRetry(() =>
              publicClient.readContract({
                address: V2contractAddress,
                abi: V2contractAbi,
                functionName: "allParticipants",
                args: [BigInt(currentIndex)],
              })
            ).catch(() => null) // Return null if index doesn't exist
          );
        }

        const batchResults = await Promise.all(batchPromises);

        // Process batch results
        for (const participantAddress of batchResults) {
          if (!participantAddress) {
            // No more participants
            hasMoreParticipants = false;
            break;
          }

          // Fetch user portfolio for this participant
          try {
            const portfolio = (await withRetry(() =>
              publicClient.readContract({
                address: V2contractAddress,
                abi: V2contractAbi,
                functionName: "userPortfolios",
                args: [participantAddress as Address],
              })
            )) as [bigint, bigint, bigint, bigint, bigint]; // [totalInvested, totalWinnings, unrealizedPnL, realizedPnL, tradeCount]

            const totalWinnings = portfolio[1]; // totalWinnings is at index 1
            const tradeCount = Number(portfolio[4]); // tradeCount is at index 4

            // Only add if user has winnings
            if (totalWinnings > 0n) {
              entriesV2.push({
                user: participantAddress as Address,
                totalWinnings,
                voteCount: tradeCount,
              });
            }
          } catch (portfolioError) {
            console.warn(
              `Failed to fetch V2 portfolio for ${participantAddress}:`,
              portfolioError
            );
          }
        }

        v2ParticipantIndex += PAGE_SIZE;

        // Stop if we didn't find any more participants in this batch
        if (!hasMoreParticipants) {
          break;
        }
      }

      console.log(`✅ Fetched ${entriesV2.length} V2 leaderboard entries`);
    } catch (v2Error) {
      console.error("❌ Failed to fetch V2 leaderboard:", v2Error);
      // Continue with V1 only if V2 fails
    }

    // Combine V1 and V2 entries by address
    const combinedEntries = new Map<
      string,
      {
        user: Address;
        totalWinnings: bigint;
        voteCount: number;
      }
    >();

    // Add V1 entries
    entriesV1.forEach((entry) => {
      const addr = entry.user.toLowerCase();
      combinedEntries.set(addr, {
        user: entry.user,
        totalWinnings: entry.totalWinnings,
        voteCount: entry.voteCount,
      });
    });

    // Add V2 entries (combine with existing V1 data if user exists)
    entriesV2.forEach((entry) => {
      const addr = entry.user.toLowerCase();
      const existing = combinedEntries.get(addr);
      if (existing) {
        combinedEntries.set(addr, {
          user: entry.user,
          totalWinnings: existing.totalWinnings + entry.totalWinnings,
          voteCount: existing.voteCount + entry.voteCount,
        });
      } else {
        combinedEntries.set(addr, {
          user: entry.user,
          totalWinnings: entry.totalWinnings,
          voteCount: entry.voteCount,
        });
      }
    });

    const winners = Array.from(combinedEntries.values())
      .filter((entry) => entry.totalWinnings > 0) // Only include users with winnings
      .map((entry) => ({
        address: entry.user.toLowerCase(),
        winnings: Number(entry.totalWinnings) / Math.pow(10, tokenDecimals),
        voteCount: Number(entry.voteCount), // Ensure voteCount is also a number
      }));

    console.log("📬 Fetching Farcaster users...");
    const neynarCache =
      cache.get<Record<string, NeynarUser[]>>(NEYNAR_CACHE_KEY) || {};
    const addressesToFetch = winners
      .map((w) => w.address)
      .filter((addr) => !neynarCache[addr]);
    let addressToUsersMap: Record<string, NeynarUser[]> = { ...neynarCache };

    if (addressesToFetch.length > 0) {
      console.log(
        `📬 Requesting Neynar for ${addressesToFetch.length} addresses`
      );
      const newUsersMap = await batchFetchNeynarUsers(neynar, addressesToFetch);
      addressToUsersMap = { ...addressToUsersMap, ...newUsersMap };
      cache.set(NEYNAR_CACHE_KEY, addressToUsersMap, 86400); // 1-day TTL
      console.log(
        `✅ Neynar responded. Found users for ${
          Object.keys(newUsersMap).length
        } addresses.`
      );
    }

    console.log("🧠 Building leaderboard...");
    const leaderboard: LeaderboardEntry[] = winners
      .map((winner) => {
        const usersForAddress = addressToUsersMap[winner.address];
        const user =
          usersForAddress && usersForAddress.length > 0
            ? usersForAddress[0]
            : undefined;
        return {
          username:
            user?.username ||
            `${winner.address.slice(0, 6)}...${winner.address.slice(-4)}`,
          fid: user?.fid || "nil",
          pfp_url: user?.pfp_url || null,
          winnings: winner.winnings,
          voteCount: winner.voteCount,
          address: winner.address,
        };
      })
      .sort((a, b) => b.winnings - a.winnings)
      .slice(0, 10);

    console.log("🏆 Final Leaderboard:", leaderboard);

    // Ensure no BigInt values before caching and returning
    const safeLeaderboard = JSON.parse(
      JSON.stringify(leaderboard, (key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );

    cache.set(CACHE_KEY, safeLeaderboard);
    console.log("✅ Cached leaderboard");

    return NextResponse.json(safeLeaderboard);
  } catch (error) {
    console.error("❌ Leaderboard fetch error:", error);

    const cachedLeaderboard = cache.get<LeaderboardEntry[]>(CACHE_KEY);
    if (cachedLeaderboard) {
      console.log("✅ Serving cached leaderboard due to error");
      // Ensure no BigInt values in cached data
      const safeLeaderboard = JSON.parse(
        JSON.stringify(cachedLeaderboard, (key, value) =>
          typeof value === "bigint" ? Number(value) : value
        )
      );
      return NextResponse.json(safeLeaderboard);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
        details: "Please try again later.",
      },
      { status: 500 }
    );
  }
}
