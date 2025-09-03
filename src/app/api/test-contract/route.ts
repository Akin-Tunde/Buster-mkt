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

export async function GET() {
  try {
    // Simple test to check if we can connect to the contract
    const marketCount = await publicClient.readContract({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "marketCount",
    });

    return NextResponse.json({
      success: true,
      marketCount: Number(marketCount),
      contractAddress: V2contractAddress,
      rpcUrl:
        process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://mainnet.base.org",
    });
  } catch (error) {
    console.error("Test API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Test failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
