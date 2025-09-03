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

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    const { marketId } = body;

    console.log("Received request:", { marketId, body });

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Validate marketId is a valid number
    const marketIdNum = parseInt(marketId.toString());
    if (isNaN(marketIdNum) || marketIdNum < 0) {
      console.log("Invalid marketId:", marketId, "parsed as:", marketIdNum);
      return NextResponse.json({ error: "Invalid market ID" }, { status: 400 });
    }

    console.log("Processing marketId:", marketId, "as number:", marketIdNum);

    // First check if the market exists and is resolved
    const marketInfo = await publicClient.readContract({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getMarketInfo",
      args: [BigInt(marketIdNum)],
    });

    const marketInfoArray = marketInfo as readonly [
      string,
      string,
      bigint,
      number,
      bigint,
      boolean,
      boolean,
      number,
      boolean,
      bigint,
      string
    ];
    const [, , , , , resolved, disputed] = marketInfoArray;

    if (!resolved) {
      return NextResponse.json({
        recipients: [],
        amounts: [],
        totalParticipants: 0,
        eligibleCount: 0,
        message: "Market is not resolved yet. Cannot distribute winnings.",
      });
    }

    if (disputed) {
      return NextResponse.json({
        recipients: [],
        amounts: [],
        totalParticipants: 0,
        eligibleCount: 0,
        message: "Market is disputed. Cannot distribute winnings.",
      });
    }

    // Get all TradeExecuted events for this market to find participants
    const tradeEvents = await publicClient.getLogs({
      address: V2contractAddress,
      event: {
        type: "event",
        name: "TradeExecuted",
        inputs: [
          { name: "marketId", type: "uint256", indexed: true },
          { name: "optionId", type: "uint256", indexed: true },
          { name: "buyer", type: "address", indexed: true }, // This was wrong - buyer IS indexed
          { name: "seller", type: "address", indexed: false },
          { name: "price", type: "uint256", indexed: false },
          { name: "quantity", type: "uint256", indexed: false },
          { name: "tradeId", type: "uint256", indexed: false },
        ],
      } as any,
      args: {
        marketId: BigInt(marketIdNum),
      },
      fromBlock: 0n,
      toBlock: "latest",
    });

    // Also get FreeTokensClaimed events for free markets
    const freeTokenEvents = await publicClient.getLogs({
      address: V2contractAddress,
      event: {
        type: "event",
        name: "FreeTokensClaimed",
        inputs: [
          { name: "marketId", type: "uint256", indexed: true },
          { name: "user", type: "address", indexed: true },
          { name: "tokens", type: "uint256", indexed: false },
        ],
      } as any,
      args: {
        marketId: BigInt(marketIdNum),
      },
      fromBlock: 0n,
      toBlock: "latest",
    });

    if (tradeEvents.length === 0 && freeTokenEvents.length === 0) {
      return NextResponse.json({
        recipients: [],
        amounts: [],
        totalParticipants: 0,
        eligibleCount: 0,
        message:
          "No trade or free token events found for this market. This could mean the market has no participants yet.",
      });
    }

    // Extract unique participant addresses from events
    const participantSet = new Set<string>();

    // Process trade events
    for (const event of tradeEvents) {
      const buyer = (event as any).args?.buyer;
      const seller = (event as any).args?.seller;

      if (buyer && buyer !== "0x0000000000000000000000000000000000000000") {
        participantSet.add(buyer.toLowerCase());
      }
      if (seller && seller !== "0x0000000000000000000000000000000000000000") {
        participantSet.add(seller.toLowerCase());
      }
    }

    // Process free token events
    for (const event of freeTokenEvents) {
      const user = (event as any).args?.user;

      if (user && user !== "0x0000000000000000000000000000000000000000") {
        participantSet.add(user.toLowerCase());
      }
    }

    const participants = Array.from(participantSet);

    if (participants.length === 0) {
      return NextResponse.json({
        recipients: [],
        amounts: [],
        totalParticipants: 0,
        message: "No participants found for this market",
      });
    }

    // Now get eligible winners from the contract
    const result = await publicClient.readContract({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getEligibleWinners",
      args: [BigInt(marketIdNum), participants as `0x${string}`[]],
    });

    const [recipients, amounts] = result as [string[], bigint[]];

    // Convert amounts from wei to readable format
    const formattedAmounts = amounts.map((amount) =>
      (Number(amount) / 1e18).toString()
    );

    return NextResponse.json({
      recipients,
      amounts: formattedAmounts,
      totalParticipants: participants.length,
      eligibleCount: recipients.length,
    });
  } catch (error) {
    console.error("Auto-preview batch distribution error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", {
      message: errorMessage,
      marketId: body?.marketId,
    });
    return NextResponse.json(
      { error: `Failed to auto-preview distribution: ${errorMessage}` },
      { status: 500 }
    );
  }
}
