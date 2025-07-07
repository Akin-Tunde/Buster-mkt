# Real Market Analytics Implementation Guide

This guide explains how the Buster Market app has been upgraded to use real market data instead of mock data for charts and analytics.

## 🎯 Overview

The market analytics system now includes:

- **Real blockchain data** from smart contract events
- **Automatic fallback** to realistic mock data when blockchain data is unavailable
- **Real-time price updates** with polling
- **Cached analytics** for performance
- **Multiple time ranges** (24h, 7d, 30d, all)
- **Visual indicators** for data source status

## 📁 New Files

### API Endpoints

1. **`/src/app/api/market/analytics/route.ts`**

   - Fetches historical market data from blockchain events
   - Calculates price history, volume, and trading statistics
   - Includes caching and fallback logic
   - Supports time range filtering

2. **`/src/app/api/market/current-price/route.ts`**
   - Provides real-time current market prices
   - Gets latest trading activity from blockchain
   - Used for live price updates

### Custom Hooks

3. **`/src/hooks/useMarketAnalytics.ts`**
   - React hook for fetching market analytics data
   - Includes automatic refresh, error handling, and loading states
   - Supports real-time updates and cache invalidation

### Updated Components

4. **`/src/components/market-chart.tsx`** (Updated)

   - Now uses real data from the custom hooks
   - Shows visual indicators for data source (real vs fallback)
   - Includes refresh functionality and status displays

5. **`/src/types/types.ts`** (Updated)
   - Added new TypeScript interfaces for analytics data

## 🔧 How It Works

### Data Flow

```
Smart Contract Events → API Endpoints → Custom Hooks → React Components
                                    ↓
                              Automatic Fallback
                                    ↓
                               Mock Data (if needed)
```

### 1. Blockchain Data Collection

The analytics API:

- Fetches `BetPlaced` events from the smart contract
- Groups events by date for historical analysis
- Calculates running totals for price percentages
- Tracks volume and trade counts

### 2. Real-time Updates

The hooks:

- Poll for current prices every 30 seconds
- Refresh analytics data every 5 minutes
- Show loading states and connection status
- Handle errors gracefully with fallbacks

### 3. Visual Indicators

The UI shows:

- 🟢 **Green WiFi icon**: Real blockchain data connected
- 🔴 **Red WiFi-off icon**: Using fallback mock data
- ⚡ **Refresh button**: Manual data refresh (with loading spinner)
- 📊 **Status text**: Last update times and data sources

## 🚀 Usage

### Basic Usage

The `MarketChart` component automatically uses real data:

```tsx
<MarketChart
  marketId="1"
  optionA="Yes"
  optionB="No"
  optionAPercentage={65}
  optionBPercentage={35}
  totalShares={10000}
/>
```

### Custom Hook Usage

```tsx
import { useMarketAnalytics } from "@/hooks/useMarketAnalytics";

function MyComponent() {
  const { data, loading, error, refresh } = useMarketAnalytics({
    marketId: "1",
    timeRange: "7d",
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Market Analytics</h3>
      <p>Total Volume: {data?.totalVolume}</p>
      <p>Total Trades: {data?.totalTrades}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Manual Cache Invalidation

```tsx
import { useInvalidateMarketAnalytics } from "@/hooks/useMarketAnalytics";

function AdminPanel() {
  const { invalidateCache } = useInvalidateMarketAnalytics();

  const handleInvalidate = async () => {
    const success = await invalidateCache("1");
    if (success) {
      console.log("Cache invalidated successfully");
    }
  };

  return <button onClick={handleInvalidate}>Clear Cache</button>;
}
```

## ⚙️ Configuration

### Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_ALCHEMY_RPC_URL=your_alchemy_rpc_url
# Other blockchain connection variables
```

### Caching Settings

The system uses in-memory caching with these defaults:

- **Analytics cache**: 5 minutes
- **Current price cache**: 30 seconds
- **Refresh intervals**: Configurable per component

### Fallback Behavior

When blockchain data is unavailable:

1. API returns realistic mock data
2. Components show "fallback" indicators
3. Users can still interact with charts
4. System continues trying to connect to real data

## 🎨 User Experience Features

### Visual Status Indicators

- **Real-time connection status** with WiFi icons
- **Loading spinners** during data fetches
- **Error messages** with fallback notifications
- **Last updated timestamps** for transparency

### Interactive Features

- **Manual refresh button** for immediate updates
- **Time range selection** (24h, 7d, 30d, all)
- **Chart type switching** (price, volume, sentiment)
- **Responsive tooltips** with detailed information

### Data Visualization

- **Price history charts** showing market sentiment over time
- **Volume charts** displaying trading activity
- **Sentiment pie charts** with current market breakdown
- **Confidence metrics** calculated from price variance

## 🔮 Future Enhancements

### Real-time WebSocket Integration

Replace polling with WebSocket connections:

```tsx
// Future implementation example
const { data } = useRealTimeMarketData({
  marketId: "1",
  transport: "websocket", // Instead of polling
});
```

### Advanced Analytics

Add more sophisticated metrics:

- Price volatility indicators
- Market momentum analysis
- Liquidity depth charts
- Social sentiment integration

### Performance Optimizations

- Redis caching for production
- GraphQL for efficient data fetching
- Database indexing for faster queries
- CDN for static chart data

## 🐛 Troubleshooting

### Common Issues

1. **"Using fallback data" message**

   - Check blockchain connection
   - Verify contract address and ABI
   - Ensure RPC URL is working

2. **Charts not updating**

   - Check refresh intervals
   - Verify API endpoints are responding
   - Look for console errors

3. **Performance issues**
   - Increase cache duration
   - Reduce refresh frequency
   - Consider pagination for large datasets

### Debug Mode

Enable debug logging by adding to your component:

```tsx
const { data, error } = useMarketAnalytics({
  marketId: "1",
  timeRange: "7d",
  // Add this for debugging
  onError: (err) => console.error("Analytics error:", err),
  onSuccess: (data) => console.log("Analytics data:", data),
});
```

## 📚 API Reference

### GET `/api/market/analytics`

**Query Parameters:**

- `marketId` (required): Market identifier
- `timeRange` (optional): "24h" | "7d" | "30d" | "all"

**Response:**

```typescript
{
  priceHistory: PriceHistoryData[];
  volumeHistory: VolumeHistoryData[];
  totalVolume: number;
  totalTrades: number;
  priceChange24h: number;
  volumeChange24h: number;
  lastUpdated: string;
}
```

### GET `/api/market/current-price`

**Query Parameters:**

- `marketId` (required): Market identifier

**Response:**

```typescript
{
  currentPriceA: number;
  currentPriceB: number;
  totalShares: number;
  lastTrade: {
    timestamp: number;
    option: 'A' | 'B';
    amount: number;
    price: number;
  } | null;
  timestamp: number;
}
```

### POST `/api/market/analytics` (Cache Invalidation)

**Body:**

```json
{
  "marketId": "1"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cache cleared"
}
```

---

This implementation provides a robust foundation for real-time market analytics while maintaining excellent user experience through intelligent fallbacks and clear status indicators.
