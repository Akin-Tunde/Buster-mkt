"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMarketAnalytics } from "@/hooks/useMarketAnalytics";

interface MarketChartProps {
  marketId: string;
  market?: {
    optionA: string;
    optionB: string;
  };
}

export function MarketChart({ marketId, market }: MarketChartProps) {
  const {
    data: analyticsData,
    loading,
    error,
  } = useMarketAnalytics({
    marketId,
    timeRange: "7d",
    enabled: true,
  });

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-destructive">Error loading chart data</div>
      </div>
    );
  }

  if (
    !analyticsData ||
    !analyticsData.priceHistory ||
    analyticsData.priceHistory.length === 0
  ) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  // Convert decimal values to percentages for display
  const chartData = analyticsData.priceHistory.map((item) => ({
    ...item,
    optionA: Math.round(item.optionA * 100),
    optionB: Math.round(item.optionB * 100),
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Market Sentiment Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted-foreground/20"
            />
            <XAxis
              dataKey="timestamp"
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                color: "hsl(var(--foreground))",
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleString();
              }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="optionA"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name={market?.optionA || "Option A"}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="optionB"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              name={market?.optionB || "Option B"}
              dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MarketChart;
