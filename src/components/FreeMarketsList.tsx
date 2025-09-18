"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { V2contractAddress, V2contractAbi } from "@/constants/contract";
// import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FreeTokenClaimButton } from "./FreeTokenClaimButton";
import { Gift, Users, Clock, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";

interface FreeMarket {
  id: number;
  maxParticipants: bigint;
  tokensPerParticipant: bigint;
  currentParticipants: bigint;
  slotsRemaining: bigint;
  hasUserClaimed: boolean;
  tokensReceived: bigint;
}

// Format price with proper decimals//
function formatPrice(price: bigint, decimals: number = 18): string {
  const formatted = Number(price) / Math.pow(10, decimals);
  if (formatted < 0.01) return formatted.toFixed(4);
  if (formatted < 1) return formatted.toFixed(3);
  return formatted.toFixed(2);
}

export function FreeMarketsList() {
  const { address, isConnected } = useAccount();
  const [freeMarkets, setFreeMarkets] = useState<FreeMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedMarkets, setCheckedMarkets] = useState(0);

  // Get total market count to iterate through
  const { data: marketCount } = useReadContract({
    address: V2contractAddress,
    abi: V2contractAbi,
    functionName: "marketCount",
  });

  // Function to check if a market is free entry
  const checkMarket = async (marketId: number) => {
    if (!address) return null;

    try {
      // This is a simplified approach - in a real implementation you'd want to
      // batch these calls or use a subgraph/indexer

      // For now, we'll just return a placeholder since we can't easily
      // iterate through all markets synchronously with wagmi hooks

      return null;
    } catch (error) {
      console.error(`Error checking market ${marketId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    // For demonstration, we'll show a placeholder implementation
    // In a real app, you'd want to use a subgraph, indexer, or backend API
    // to efficiently find all free markets

    setTimeout(() => {
      setIsLoading(false);
      // Placeholder data - in reality this would come from an indexer/API
      setFreeMarkets([]);
    }, 1000);
  }, [isConnected, address, marketCount]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">
            Connect your wallet to view and claim free tokens from free entry
            markets.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Free Entry Markets
            </CardTitle>
          </CardHeader>
        </Card>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Gift className="h-5 w-5" />
            Free Entry Markets
          </CardTitle>
          <p className="text-green-700 mb-4">
            Claim free tokens to participate in prediction markets without
            spending your own tokens.
          </p>

          {/* Instructions */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">
              How to Find Free Markets:
            </h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                <span>
                  Look for markets with the{" "}
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    Free Entry
                  </Badge>{" "}
                  badge
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                <span>
                  Free token claim buttons will appear automatically for
                  eligible markets
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                <span>
                  Each user can claim free tokens once per market (while slots
                  last)
                </span>
              </div>
            </div>
          </div>

          {/* Browse Markets Button */}
          <div className="pt-4">
            <Link href="/">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <ExternalLink className="h-4 w-4" />
                Browse All Markets
              </button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Individual Market Demo - You can add specific market IDs here if you know them */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Demo: Check Market for Free Tokens
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter a market ID below to check if it offers free tokens:
          </p>
        </CardHeader>
        <CardContent>
          <DemoMarketChecker />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Gift className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Pro Tip</h3>
              <p className="text-sm text-amber-700">
                Free entry markets are sponsored by market creators who provide
                the prize pool. You can participate without risking your own
                tokens, but slots are limited!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Demo component to check individual markets
function DemoMarketChecker() {
  const [marketId, setMarketId] = useState("");
  const [checkedId, setCheckedId] = useState<number | null>(null);

  const handleCheck = () => {
    const id = parseInt(marketId);
    if (!isNaN(id) && id >= 0) {
      setCheckedId(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Enter market ID (e.g., 0, 1, 2...)"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
        <button
          onClick={handleCheck}
          disabled={!marketId || isNaN(parseInt(marketId))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      </div>

      {checkedId !== null && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-2">Market #{checkedId}</h4>
          <FreeTokenClaimButton
            marketId={checkedId}
            onClaimComplete={() => {
              // Optionally reset or show success message
            }}
          />
        </div>
      )}
    </div>
  );
}
