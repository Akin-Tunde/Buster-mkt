import { GraphQLClient } from "graphql-request";

// Your deployed subgraph URL
const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/103701/bustermkt/v0.0.1";

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);

// GraphQL queries for market events
export const GET_MARKET_EVENTS = `
  query GetMarketEvents($marketId: String!, $first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
    sharesPurchaseds(
      where: { marketId: $marketId }
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      marketId
      buyer
      isOptionA
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_MARKET_ANALYTICS = `
  query GetMarketAnalytics($marketId: String!) {
    marketCreateds(
      where: { marketId: $marketId }
      first: 1
    ) {
      id
      marketId
      question
      optionA
      optionB
      endTime
      blockNumber
      blockTimestamp
    }
    sharesPurchaseds(
      where: { marketId: $marketId }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 1000
    ) {
      id
      marketId
      buyer
      isOptionA
      amount
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_MARKET_RESOLVED = `
  query GetMarketResolved($marketId: String!) {
    marketResolveds(
      where: { marketId: $marketId }
      first: 1
    ) {
      id
      marketId
      outcome
      blockNumber
      blockTimestamp
    }
  }
`;

export interface SharesPurchased {
  id: string;
  marketId: string;
  buyer: string;
  isOptionA: boolean;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface MarketCreated {
  id: string;
  marketId: string;
  question: string;
  optionA: string;
  optionB: string;
  endTime: string;
  blockNumber: string;
  blockTimestamp: string;
}

export interface MarketResolved {
  id: string;
  marketId: string;
  outcome: number;
  blockNumber: string;
  blockTimestamp: string;
}

export interface MarketAnalyticsData {
  marketCreateds: MarketCreated[];
  sharesPurchaseds: SharesPurchased[];
}
