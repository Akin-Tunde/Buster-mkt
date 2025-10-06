// src/app/page.tsx
import { EnhancedPredictionMarketDashboard } from "@/components/enhanced-prediction-market-dashboard";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policast - Political Prediction Markets | Trade on Politics",
  description: "Join the decentralized political prediction market. Bet on election outcomes, policy decisions, and political events with crypto. Secure, transparent, and community-driven.",
  keywords: ["political prediction markets", "election betting", "political trading", "crypto betting", "decentralized markets", "blockchain predictions"],
  openGraph: {
    title: "Policast - Political Prediction Markets",
    description: "Join the decentralized political prediction market. Bet on election outcomes, policy decisions, and political events with crypto.",
    images: [
      {
        url: "/icon.jpg",
        width: 1200,
        height: 630,
        alt: "Policast - Political Prediction Markets",
      },
    ],
    type: "website",
    url: "https://buster-mkt.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Policast - Political Prediction Markets",
    description: "Join the decentralized political prediction market. Bet on election outcomes, policy decisions, and political events with crypto.",
    images: ["/icon.jpg"],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://buster-mkt.vercel.app/icon.jpg",
      button: {
        title: "Explore Markets🏪",
        action: {
          type: "launch_miniapp",
          name: "Policast",
          iconUrl: "https://buster-mkt.vercel.app/icon.png",
          url: "https://buster-mkt.vercel.app",
          splashImageUrl: "https://buster-mkt.vercel.app/icon.jpg",
          splashBackgroundColor: "#131E2A",
          state: "marketId",
        },
      },
    }),
  },
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center">
          {/* You can put a more sophisticated loading skeleton here if you like */}
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading Dashboard...
          </p>
        </div>
      }
    >
      <EnhancedPredictionMarketDashboard />
      <OnboardingModal /> {/* <-- 2b. Render the modal */}
    </Suspense>
  );
}
