import { createPublicClient, http } from "viem";
import {
  contract,
  contractAbi,
  V2contractAddress,
  V2contractAbi,
} from "@/constants/contract";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { MarketDetailsClient } from "@/components/MarketDetailsClient";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MarketSharesDisplay } from "@/components/market-shares-display";
import { customBase } from "@/constants/chains";

// V1 Market Info Contract Return
type MarketInfoV1ContractReturn = readonly [
  string, // question
  string, // optionA
  string, // optionB
  bigint, // endTime
  number, // outcome
  bigint, // totalOptionAShares
  bigint, // totalOptionBShares
  boolean // resolved
];

// V2 Market Info Contract Return
type MarketInfoV2ContractReturn = readonly [
  string, // question
  string, // description
  bigint, // endTime
  number, // category
  bigint, // optionCount
  boolean, // resolved
  boolean, // disputed
  bigint, // winningOptionId
  string // creator
];

interface Props {
  params: Promise<{ marketId: string }>;
}

// Helper function to determine market version and fetch data
async function fetchMarketData(marketId: string, publicClient: any) {
  const marketIdBigInt = BigInt(marketId);

  // Try V1 first (V1 markets have lower IDs)
  try {
    const v1MarketData = (await publicClient.readContract({
      address: contract.address,
      abi: contractAbi,
      functionName: "getMarketInfo",
      args: [marketIdBigInt],
    })) as MarketInfoV1ContractReturn;

    // If successful and market exists, return V1 data
    if (v1MarketData[0]) {
      // question exists
      return {
        version: "v1" as const,
        data: v1MarketData,
      };
    }
  } catch (error) {
    // V1 market doesn't exist, try V2
    console.log(`Market ${marketId} not found in V1, trying V2...`);
  }

  // Try V2
  try {
    const v2MarketData = (await publicClient.readContract({
      address: V2contractAddress,
      abi: V2contractAbi,
      functionName: "getMarketInfo",
      args: [marketIdBigInt],
    })) as MarketInfoV2ContractReturn;

    // If successful and market exists, return V2 data
    if (v2MarketData[0]) {
      // question exists
      return {
        version: "v2" as const,
        data: v2MarketData,
      };
    }
  } catch (error) {
    console.log(`Market ${marketId} not found in V2 either`);
  }

  throw new Error(`Market ${marketId} not found in either V1 or V2 contracts`);
}

export async function generateMetadata(
  { params }: { params: Promise<{ marketId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { marketId } = await params;

  console.log("generateMetadata: Processing marketId:", marketId);

  if (!marketId || isNaN(Number(marketId))) {
    console.error("generateMetadata: Invalid marketId", marketId);
    return {
      title: "Market Not Found",
      description: "Unable to load market data for metadata",
    };
  }

  try {
    const publicClient = createPublicClient({
      chain: customBase,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
    });

    const marketResult = await fetchMarketData(marketId, publicClient);

    let market: any;
    let yesPercent = "0.0";

    if (marketResult.version === "v1") {
      const marketData = marketResult.data as MarketInfoV1ContractReturn;
      market = {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAShares: marketData[5],
        totalOptionBShares: marketData[6],
        resolved: marketData[7],
        version: "v1",
      };

      const total = market.totalOptionAShares + market.totalOptionBShares;
      yesPercent =
        total > 0n
          ? (Number((market.totalOptionAShares * 1000n) / total) / 10).toFixed(
              1
            )
          : "0.0";
    } else {
      const marketData = marketResult.data as MarketInfoV2ContractReturn;
      market = {
        question: marketData[0],
        description: marketData[1],
        endTime: marketData[2],
        category: marketData[3],
        optionCount: Number(marketData[4]), // Convert bigint to number
        resolved: marketData[5],
        disputed: marketData[6],
        winningOptionId: Number(marketData[7]), // Convert bigint to number
        creator: marketData[8],
        version: "v2",
      };

      // For V2, we'll need to get market options and shares separately
      // For now, use a generic description
      yesPercent = "Multi-option";
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://buster-mkt.vercel.app";
    const imageUrl = `${baseUrl}/api/market-image?marketId=${marketId}`;

    const marketUrl = `${baseUrl}/market/${marketId}/details`;

    const description =
      market.version === "v1"
        ? `View market: ${market.question} - ${market.optionA}: ${yesPercent}%`
        : `View market: ${market.question} - ${market.optionCount} options available`;

    const miniAppEmbed = {
      version: "1" as const,
      imageUrl: imageUrl,
      button: {
        title: "View Market Details",
        action: {
          type: "launch_miniapp" as const,
          name: market.question.substring(0, 30),
          url: marketUrl,
          iconUrl: "https://buster-mkt.vercel.app/icon.png",
          splashImageUrl: "https://buster-mkt.vercel.app/icon.jpg",
          splashBackgroundColor: "#131E2A",
        },
      },
    };

    const resolvedParent = await parent;
    const otherParentData = resolvedParent.other || {};

    // Ensure fc:miniapp is explicitly a string key
    const fcFrameKey = "fc:miniapp" as string;
    return {
      title: market.question,
      description,
      other: {
        ...otherParentData, // Spread parent's other metadata first
        [fcFrameKey]: JSON.stringify(miniAppEmbed),
      },
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: market.question,
        description,
        images: [
          { url: imageUrl, width: 1200, height: 630, alt: market.question },
        ],
        url: marketUrl,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: market.question,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("generateMetadata: Error processing market metadata:", error);
    return {
      title: "Market Not Found",
      description: "Unable to load market data for metadata",
    };
  }
}

export default async function MarketDetailsPage({ params }: Props) {
  const { marketId } = await params;

  if (!marketId || isNaN(Number(marketId))) {
    notFound();
  }

  try {
    const publicClient = createPublicClient({
      chain: customBase,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
    });

    const marketResult = await fetchMarketData(marketId, publicClient);

    let market: any;

    if (marketResult.version === "v1") {
      const marketData = marketResult.data as MarketInfoV1ContractReturn;
      market = {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAShares: marketData[5],
        totalOptionBShares: marketData[6],
        resolved: marketData[7],
        version: "v1",
      };
    } else {
      const marketData = marketResult.data as MarketInfoV2ContractReturn;
      market = {
        question: marketData[0],
        description: marketData[1],
        endTime: marketData[2],
        category: marketData[3],
        optionCount: Number(marketData[4]), // Convert bigint to number
        resolved: marketData[5],
        disputed: marketData[6],
        winningOptionId: Number(marketData[7]), // Convert bigint to number
        creator: marketData[8],
        version: "v2",
      };
    }

    return <MarketDetailsClient marketId={marketId} market={market} />;
  } catch (error) {
    console.error(`Failed to fetch market ${marketId}:`, error);
    notFound();
  }
}
