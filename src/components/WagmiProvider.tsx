"use client";

import { createConfig, WagmiProvider } from "wagmi";
import { cookieStorage, createStorage, http } from "@wagmi/core";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet } from "wagmi/connectors";
import { useEffect, useState, createContext, useContext } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [base];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;

// Set up metadata
const metadata = {
  name: "Policast",
  description: "Policast - Social podcasting on Farcaster",
  url: "https://buster-mkt.vercel.app", // origin must match your domain & subdomain
  icons: ["https://buster-mkt.vercel.app/icon.png"],
};

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base],
  defaultNetwork: base,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: true,
    socials: ["farcaster"],
    emailShowWallets: true,
  },
  allWallets: "SHOW",
});

// Wallet context and types
interface WalletContextType {
  connect: (connectorId?: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | undefined;
  connectors: readonly any[];
  primaryConnector: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Custom hook for centralized wallet management
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WagmiProvider");
  }
  return context;
}

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect() {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    const checkCoinbaseWallet = () => {
      try {
        const ethereum = (window as any).ethereum;
        const isInCoinbaseWallet =
          ethereum?.isCoinbaseWallet ||
          ethereum?.isCoinbaseWalletExtension ||
          ethereum?.isCoinbaseWalletBrowser;
        setIsCoinbaseWallet(!!isInCoinbaseWallet);
      } catch (error) {
        console.warn("Error checking Coinbase Wallet:", error);
        setIsCoinbaseWallet(false);
      }
    };

    checkCoinbaseWallet();
    window.addEventListener("ethereum#initialized", checkCoinbaseWallet);

    return () => {
      window.removeEventListener("ethereum#initialized", checkCoinbaseWallet);
    };
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected && connectors.length > 1) {
      try {
        const coinbaseConnector = connectors.find((c) =>
          c.id.includes("coinbase")
        );
        if (coinbaseConnector) {
          connect({ connector: coinbaseConnector });
        }
      } catch (error) {
        console.warn("Auto-connect failed:", error);
      }
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return isCoinbaseWallet;
}

// Create connectors with proper error handling
function createConnectors() {
  const connectors = [];

  try {
    connectors.push(miniAppConnector());
  } catch (error) {
    console.warn("Failed to initialize miniApp connector:", error);
  }

  try {
    connectors.push(
      coinbaseWallet({
        appName: "Policast",
        appLogoUrl: "https://buster-mkt.vercel.app/icon.png",
        preference: "all",
      })
    );
  } catch (error) {
    console.warn("Failed to initialize Coinbase Wallet connector:", error);
  }

  return connectors;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Wrapper component that provides Coinbase Wallet auto-connection and wallet context
function WalletProvider({ children }: { children: React.ReactNode }) {
  const { connect: wagmiConnect, connectors: wagmiConnectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const {
    address,
    isConnected: wagmiIsConnected,
    isConnecting: wagmiIsConnecting,
  } = useAccount();

  // Auto-connect logic
  useCoinbaseWalletAutoConnect();

  // Determine primary connector
  const primaryConnector =
    wagmiConnectors.find((c) => c.id === "miniAppConnector") ||
    wagmiConnectors.find((c) => c.id === "coinbaseWalletSDK") ||
    wagmiConnectors.find((c) => c.id === "metaMask") ||
    (wagmiConnectors.length > 0 ? wagmiConnectors[0] : undefined);

  const walletValue: WalletContextType = {
    connect: (connectorId?: string) => {
      try {
        if (connectorId) {
          const connector = wagmiConnectors.find((c) => c.id === connectorId);
          if (connector) {
            wagmiConnect({ connector });
          } else {
            console.warn(`Connector with id "${connectorId}" not found`);
          }
        } else if (primaryConnector) {
          wagmiConnect({ connector: primaryConnector });
        } else {
          console.warn("No connectors available");
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    },
    disconnect: () => {
      try {
        wagmiDisconnect();
      } catch (error) {
        console.error("Failed to disconnect wallet:", error);
      }
    },
    isConnected: wagmiIsConnected,
    isConnecting: wagmiIsConnecting,
    address,
    connectors: wagmiConnectors,
    primaryConnector,
  };

  return (
    <WalletContext.Provider value={walletValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
