"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { useEffect, useState, createContext, useContext } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Constants with proper error handling
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const APP_NAME: string = "Policast";
const APP_URL: string = process.env.NEXT_PUBLIC_URL || "";
const APP_ICON_URL: string = APP_URL ? `${APP_URL}/icon.png` : "/icon.png";

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

// Safely create WagmiAdapter only if projectId exists
let wagmiAdapter: any = null;
if (projectId) {
  wagmiAdapter = new WagmiAdapter({
    networks: [base],
    projectId,
  });
}

// Create AppKit instance only if we have a valid adapter
export let appKit: any = null;
if (wagmiAdapter && projectId) {
  try {
    appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: [base],
      projectId,
      metadata: {
        name: "Policast",
        description: "Policast - Social podcasting on Farcaster",
        url: typeof window !== "undefined" ? window.location.origin : APP_URL,
        icons: [APP_ICON_URL],
      },
      features: {
        email: true,
        socials: ["farcaster"],
        emailShowWallets: true,
      },
      allWallets: "SHOW",
    });
  } catch (error) {
    console.warn("Failed to initialize AppKit:", error);
  }
}

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
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      const isInCoinbaseWallet =
        window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser;
      setIsCoinbaseWallet(!!isInCoinbaseWallet);
    };

    checkCoinbaseWallet();
    window.addEventListener("ethereum#initialized", checkCoinbaseWallet);

    return () => {
      window.removeEventListener("ethereum#initialized", checkCoinbaseWallet);
    };
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected) {
      connect({ connector: connectors[1] }); // Coinbase Wallet connector
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
        appName: APP_NAME,
        appLogoUrl: APP_ICON_URL,
        preference: "all",
      })
    );
  } catch (error) {
    console.warn("Failed to initialize Coinbase Wallet connector:", error);
  }

  // Only add WalletConnect if projectId is available
  if (projectId) {
    try {
      connectors.push(
        walletConnect({
          projectId,
        })
      );
    } catch (error) {
      console.warn("Failed to initialize WalletConnect connector:", error);
    }
  }

  return connectors;
}

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || `https://mainnet.base.org`
    ),
  },
  connectors: createConnectors(),
});

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
