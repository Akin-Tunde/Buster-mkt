import { NextRequest, NextResponse } from "next/server";
import {
  V2contractAddress,
  V2contractAbi,
  publicClient,
} from "@/constants/contract";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");
    const optionId = searchParams.get("optionId");

    if (!marketId || !optionId) {
      return NextResponse.json(
        { error: "Missing marketId or optionId parameter" },
        { status: 400 }
      );
    }

    // Read market option data from contract//
    const optionData = await publicClient.readContract({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getMarketOption",
      args: [BigInt(marketId), BigInt(optionId)],
    });

    const [
      name,
      description,
      totalShares,
      totalVolume,
      currentPrice,
      isActive,
    ] = optionData;

    return NextResponse.json({
      name,
      description,
      totalShares: totalShares.toString(),
      totalVolume: totalVolume.toString(),
      currentPrice: currentPrice.toString(),
      isActive,
    });
  } catch (error) {
    console.error("Error fetching market option:", error);
    return NextResponse.json(
      { error: "Failed to fetch market option data" },
      { status: 500 }
    );
  }
}
