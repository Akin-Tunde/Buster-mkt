export interface Market {
  question: string;
  optionA: string;
  optionB: string;
  endTime: string;
  outcome: string;
  totalOptionAShares: number;
  totalOptionBShares: number;
  resolved: boolean;
}

export interface PriceHistoryData {
  date: string;
  timestamp: number;
  optionA: number;
  optionB: number;
  volume: number;
  trades?: number;
}

export interface VolumeHistoryData {
  date: string;
  timestamp: number;
  volume: number;
  trades: number;
}

export interface MarketAnalytics {
  priceHistory: PriceHistoryData[];
  volumeHistory: VolumeHistoryData[];
  totalVolume: number;
  totalTrades: number;
  priceChange24h: number;
  volumeChange24h: number;
  lastUpdated: string;
}

export interface MarketStats {
  marketId: string;
  currentPriceA: number;
  currentPriceB: number;
  totalShares: number;
  totalVolume: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}
