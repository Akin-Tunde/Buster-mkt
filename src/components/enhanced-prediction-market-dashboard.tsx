"use client";

import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "./footer";
import { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { UserStats } from "./UserStats";
import { useRouter, usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { UnifiedMarketList } from "./unified-market-list";
import { ValidatedMarketList } from "./ValidatedMarketList";
import { useUserRoles } from "@/hooks/useUserRoles";
// import { MarketValidationBanner } from "./ValidationNotice";//
import {
  BarChart3,
  TrendingUp,
  ArrowRight,
  User as UserIcon,
  Wallet,
  Activity,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { VoteHistory } from "./VoteHistory";
import { useFarcasterUser } from "@/hooks/useFarcasterUser";
import { Badge } from "./ui/badge";
import { ModernAdminDashboard } from "./ModernAdminDashboard";

import { LeaderboardEntry } from "@/types/leaderboard";

import LeaderboardComponent from "./LeaderboardComponent";

export function EnhancedPredictionMarketDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const currentPathname = usePathname();
  const farcasterUser = useFarcasterUser();
  const { hasCreatorAccess, hasResolverAccess, isAdmin } = useUserRoles();

  // Initialize with a fixed default. Will be updated from URL after client mount.
  const [activeTab, setActiveTab] = useState("active");
  const [isClient, setIsClient] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render
    setIsClient(true);
    // Safely get search params on client side
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab") || "active";
    setActiveTab(tabFromUrl);

    // Listen for custom tab change events from footer
    const handleTabChangeEvent = (event: CustomEvent) => {
      const newTab = event.detail.tab;
      setActiveTab(newTab);
    };

    window.addEventListener("tabChange", handleTabChangeEvent as EventListener);

    return () => {
      window.removeEventListener(
        "tabChange",
        handleTabChangeEvent as EventListener
      );
    };
  }, []); // Only run once on mount

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without full page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", value);
    window.history.replaceState(null, "", newUrl.toString());
  };

  const hasFetchedInitially = useRef(false);

  const fetchLeaderboardData = async (setLoading = false) => {
    if (setLoading) {
      setIsLoadingLeaderboard(true);
      setLeaderboardError(null);
    }
    try {
      const res = await fetch("/api/leaderboard");

      if (!res.ok) {
        let errorDetails = `HTTP error! status: ${res.status}`;
        try {
          const errorText = await res.text();
          if (
            errorText &&
            !errorText.toLowerCase().includes("<html") &&
            !errorText.toLowerCase().includes("<!doctype html")
          ) {
            errorDetails =
              errorText.length > 150
                ? errorText.substring(0, 147) + "..."
                : errorText;
          }
        } catch {
          // Ignore if reading text fails
        }
        throw new Error(errorDetails);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        const transformedData: LeaderboardEntry[] = data.map(
          (entry, index) => ({
            rank: index + 1,
            username: entry.username || "",
            fid: entry.fid,
            pfp_url: entry.pfp_url,
            winnings: entry.winnings || 0,
            voteCount: entry.voteCount,
            accuracy: entry.winnings ? Math.round(entry.winnings * 100) : 0,
            trend: "none", // You can implement trend logic here if needed
            address: entry.address,
          })
        );
        setLeaderboard(transformedData);
      } else {
        throw new Error(
          "Received non-array data for leaderboard. Expected an array."
        );
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      let displayError =
        (err as Error).message ||
        "Failed to load leaderboard. Please try again later.";

      if (displayError.includes("NEYNAR_API_KEY")) {
        displayError = "Server configuration error. Please try again later.";
      } else if (displayError.includes("eth_getLogs")) {
        displayError =
          "Unable to fetch leaderboard data due to blockchain query limits. Please try again later.";
      } else if (err instanceof SyntaxError) {
        displayError =
          "Received malformed data from the server. Please try again later.";
      }
      setLeaderboardError(displayError);
      setLeaderboard([]);
    } finally {
      if (setLoading) {
        setIsLoadingLeaderboard(false);
      }
    }
  };

  useEffect(() => {
    if (!hasFetchedInitially.current) {
      fetchLeaderboardData(true);
      hasFetchedInitially.current = true;
    }
  }, []);

  useEffect(() => {
    const refreshInterval = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      fetchLeaderboardData(false);
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    sdk.actions.ready();
    (async () => {
      await sdk.actions.addFrame();
    })();
  }, []);

  const emptyState = (title: string, subtitle: string) => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="mt-2 text-sm font-medium text-gray-400">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  // Determine showVoteHistory based on isClient and address
  const actualShowVoteHistory = isClient && !!address;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-[#352c3f]">
      <Navbar />
      <div className="flex-grow container mx-auto p-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList
            className={`grid w-full ${
              actualShowVoteHistory ? "grid-cols-5" : "grid-cols-4"
            } overflow-x-auto whitespace-nowrap hidden md:grid bg-[#433952]/50 border border-[#544863]`}
          >
            <TabsTrigger 
              value="active" 
              className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Active
            </TabsTrigger>
            <TabsTrigger 
              value="ended" 
              className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Ended
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Leaderboard
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Profile
            </TabsTrigger>
            {actualShowVoteHistory && (
              <TabsTrigger 
                value="myvotes" 
                className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                My Shares
              </TabsTrigger>
            )}
            {(hasCreatorAccess || hasResolverAccess || isAdmin) && (
              <TabsTrigger 
                value="admin" 
                className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Market Validation Info Banner */}
          {/* <MarketValidationBanner /> */}

          <TabsContent value="active" className="mt-6">
            <ValidatedMarketList filter="active" showOnlyValidated={true} />
          </TabsContent>

          <TabsContent value="ended" className="mt-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#433952]/50 border border-[#544863]">
                <TabsTrigger 
                  value="pending" 
                  className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="text-xs px-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Results
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <ValidatedMarketList
                  filter="pending"
                  showOnlyValidated={true}
                />
              </TabsContent>
              <TabsContent value="resolved" className="mt-4">
                <ValidatedMarketList
                  filter="resolved"
                  showOnlyValidated={true}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <div className="bg-[#433952]/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-[#544863]">
              <LeaderboardComponent
                onTabChange={handleTabChange}
                leaderboard={leaderboard}
                isLoading={isLoadingLeaderboard}
                error={leaderboardError}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            {isConnected ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Section */}
                <div className="lg:col-span-1 space-y-6">
                  <UserStats />
                </div>

                {/* Vote History Section */}
                <div className="lg:col-span-2">
                  <VoteHistory />
                </div>
              </div>
            ) : (
              <Card className="bg-[#433952]/50 backdrop-blur-sm border-[#544863]">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-purple-600/20 rounded-full">
                      <Wallet className="h-12 w-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-300 max-w-md">
                      Connect your wallet to view your profile, track your
                      predictions, and see your performance statistics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {actualShowVoteHistory && (
            <TabsContent value="myvotes" className="mt-6">
              <UserStats />
            </TabsContent>
          )}

          {/* Admin Tab Content */}
          {(hasCreatorAccess || hasResolverAccess || isAdmin) && (
            <TabsContent value="admin" className="mt-6">
              <ModernAdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}