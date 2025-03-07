// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

// Coin related types
export interface Coin {
  type: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  isVerified?: boolean;
}

export interface CoinMetadata {
  type: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_url?: string;
  project_url?: string;
  description?: string;
}

export interface CoinPriceInfo {
  price: number;
  price_24h_change: number;
  last_updated_at: string;
  market_data?: {
    market_cap: number;
    volume_24h: number;
  };
}

// Pool related types
export interface Pool {
  id: string;
  name: string;
  tokens: {
    type: string;
    symbol: string;
    weight?: number;
    balance?: string;
  }[];
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  created_at: string;
}

export interface PoolStats {
  tvl: number;
  volume: {
    "24h": number;
    "7d": number;
    "30d": number;
    total: number;
  };
  fees: {
    "24h": number;
    "7d": number;
    "30d": number;
    total: number;
  };
  apr: number;
  price_range?: {
    min: number;
    max: number;
  };
  token_distribution: {
    type: string;
    symbol: string;
    amount: string;
    percentage: number;
  }[];
  transactions: {
    "24h": number;
    "7d": number;
  };
}

export interface LpPosition {
  pool_id: string;
  pool_name: string;
  tokens: {
    type: string;
    symbol: string;
    amount: string;
  }[];
  share_percentage: number;
  value_usd: number;
  unclaimed_fees_usd: number;
}

// Swap related types
export interface QuoteResult {
  route: {
    coinIn: {
      type: string;
      symbol: string;
      amount: string;
    };
    coinOut: {
      type: string;
      symbol: string;
      amount: string;
    };
    price: string;
    priceImpact: string;
    path: string[];
    minimumReceived: string;
    protocol: string;
  };
  alternativeRoutes?: {
    protocol: string;
    price: string;
    priceImpact: string;
  }[];
}

// DCA (Dollar Cost Averaging) related types
export interface DcaOrder {
  id: string;
  user_address: string;
  token_in: {
    type: string;
    symbol: string;
    amount_per_execution: string;
    total_amount: string;
    remaining_amount: string;
  };
  token_out: {
    type: string;
    symbol: string;
    amount_acquired: string;
  };
  frequency: "hourly" | "daily" | "weekly";
  next_execution: string;
  executions_count: number;
  total_executions: number;
  start_time: string;
  end_time?: string;
  status: "active" | "completed" | "cancelled" | "failed";
  created_at: string;
  updated_at: string;
}
