"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { V2contractAddress, V2contractAbi } from "@/constants/contract";
import { Loader2, Trophy } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ClaimWinningsButtonProps {
  marketId: number;
  className?: string;
  onClaimComplete?: () => void;
}

export function ClaimWinningsButton({
  marketId,
  className = "",
  onClaimComplete,
}: ClaimWinningsButtonProps) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Get user's position in the market
  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: V2contractAddress,
    abi: V2contractAbi,
    functionName: "getUserShares",
    args: [BigInt(marketId), address as `0x${string}`],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Get market info to check if it's resolved and which option won
  const { data: marketInfo } = useReadContract({
    address: V2contractAddress,
    abi: V2contractAbi,
    functionName: "getMarketInfo",
    args: [BigInt(marketId)],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // We'll use a local state to track claimed status
  const [hasAlreadyClaimed, setHasAlreadyClaimed] = useState(false);

  // Contract interaction hooks
  const {
    writeContract,
    data: txHash,
    isPending: isClaimPending,
  } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if market is resolved and user has shares
  // V2 getMarketInfo returns: [question, description, endTime, category, optionCount, resolved, disputed, invalidated, winningOptionId, creator]
  const isMarketResolved = marketInfo ? (marketInfo[5] as boolean) : false;
  const isMarketDisputed = marketInfo ? (marketInfo[6] as boolean) : false;
  const isMarketInvalidated = marketInfo ? (marketInfo[7] as boolean) : false;
  const winningOptionId = marketInfo ? (marketInfo[8] as bigint) : 0n;

  // Check if user has winning shares
  const hasWinningShares = () => {
    if (!userShares || !isMarketResolved || winningOptionId === undefined)
      return false;

    // Additional validation: make sure winningOptionId is valid
    const winningOptionIndex = Number(winningOptionId);
    if (winningOptionIndex < 0 || winningOptionIndex >= userShares.length) {
      console.log("Invalid winning option ID:", {
        winningOptionId: winningOptionIndex,
        userSharesLength: userShares.length,
      });
      return false;
    }

    console.log("Checking winning shares:", {
      userShares,
      winningOptionId: winningOptionIndex,
      userSharesForWinningOption: userShares[winningOptionIndex],
      isMarketResolved,
    });

    return userShares[winningOptionIndex] > 0n;
  };

  // Handle claiming winnings
  const handleClaimWinnings = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to claim winnings.",
        variant: "destructive",
      });
      return;
    }

    if (!isMarketResolved) {
      toast({
        title: "Market Not Resolved",
        description: "This market hasn't been resolved yet.",
        variant: "destructive",
      });
      return;
    }

    if (isMarketDisputed) {
      toast({
        title: "Market Disputed",
        description:
          "This market is currently under dispute and cannot process claims.",
        variant: "destructive",
      });
      return;
    }

    if (isMarketInvalidated) {
      toast({
        title: "Market Invalidated",
        description:
          "This market has been invalidated and cannot process claims.",
        variant: "destructive",
      });
      return;
    }

    if (hasAlreadyClaimed) {
      toast({
        title: "Already Claimed",
        description: "You have already claimed winnings for this market.",
        variant: "destructive",
      });
      return;
    }

    if (!hasWinningShares()) {
      console.log("No winning shares detected:", {
        userShares,
        winningOptionId: Number(winningOptionId),
        isMarketResolved,
      });

      toast({
        title: "No Winning Shares",
        description: "You don't have any winning shares in this market.",
        variant: "destructive",
      });
      return;
    }

    console.log("Attempting to claim winnings:", {
      marketId,
      userShares,
      winningOptionId: Number(winningOptionId),
      userSharesForWinningOption: userShares?.[Number(winningOptionId)],
    });

    try {
      await writeContract({
        address: V2contractAddress,
        abi: V2contractAbi,
        functionName: "claimWinnings",
        args: [BigInt(marketId)],
      });

      // Success toast will be shown by the useEffect below
    } catch (error: any) {
      console.error("Error claiming winnings:", error);

      // Check for various "already claimed" error patterns
      const errorMessage = error?.message || error?.shortMessage || "";
      const isAlreadyClaimed =
        errorMessage.includes("AlreadyClaimed") ||
        errorMessage.includes("already claimed") ||
        errorMessage.includes("claimed") ||
        error?.code === "CALL_EXCEPTION" ||
        error?.reason === "AlreadyClaimed";

      if (isAlreadyClaimed) {
        setHasAlreadyClaimed(true);
        toast({
          title: "Already Claimed",
          description: "You have already claimed winnings for this market.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Claim Failed",
          description: error?.shortMessage || "Failed to claim winnings.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Winnings Claimed!",
        description: "Your winnings have been successfully claimed.",
      });

      // Update claimed status
      setHasAlreadyClaimed(true);

      // Refresh data
      refetchShares();
      if (onClaimComplete) onClaimComplete();
    }
  }, [isSuccess, toast, refetchShares, onClaimComplete]);

  // Don't show button if user hasn't connected wallet
  if (!isConnected) return null;

  // Don't show button if market is not resolved or has issues
  if (!isMarketResolved || isMarketDisputed || isMarketInvalidated) return null;

  // Don't show button if user has already claimed
  if (hasAlreadyClaimed) {
    return (
      <div
        className={`text-xs text-green-600 font-medium text-center ${className}`}
      >
        Winnings claimed
      </div>
    );
  }

  // Don't show button if user doesn't have winning shares
  if (!hasWinningShares()) return null;

  return (
    <Button
      onClick={handleClaimWinnings}
      disabled={isClaimPending || isConfirming}
      size="sm"
      className={`w-full ${className}`}
      variant="success"
    >
      {isClaimPending || isConfirming ? (
        <>
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          Claiming...
        </>
      ) : (
        <>
          <Trophy className="h-3 w-3 mr-2" />
          Claim Winnings
        </>
      )}
    </Button>
  );
}
