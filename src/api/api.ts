import axios from "axios";
import {
  ApiResponse,
  Pool,
  PoolStats,
  LpPosition,
  Coin,
  CoinMetadata,
  CoinPriceInfo,
  QuoteResult,
  DcaOrder,
} from "../types/api";

// Base API configuration with increased timeout
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Increase timeout to prevent hanging requests
  timeout: 30000, // Increased from 15000ms to 30000ms
});

// Helper function to convert a token address string to a Coin object
const addressToCoin = (address: string): Coin => {
  const symbol = address.split("::").pop() || "UNKNOWN";
  return {
    type: address,
    symbol,
    name: symbol,
    decimals: 9,
    price: 0,
  };
};

// API endpoints for pools
export const poolsApi = {
  getAllPools: async (): Promise<Pool[]> => {
    try {
      const response = await api.get<ApiResponse<Pool[]>>("/pools");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching pools:", error);
      return []; // Return empty array instead of mocks
    }
  },

  getPool: async (id: string): Promise<Pool | null> => {
    try {
      const response = await api.get<ApiResponse<Pool>>(`/pools/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching pool ${id}:`, error);
      return null;
    }
  },

  getPoolStats: async (id: string): Promise<PoolStats | null> => {
    try {
      const response = await api.get<ApiResponse<PoolStats>>(
        `/pools/${id}/stats`
      );
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching pool stats for ${id}:`, error);
      return null;
    }
  },

  getUserPositions: async (address: string): Promise<LpPosition[]> => {
    try {
      const response = await api.get<ApiResponse<LpPosition[]>>(
        `/pools/user/${address}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching positions for ${address}:`, error);
      return [];
    }
  },
};

// API endpoints for coins with support for both new and old endpoints
export const coinsApi = {
  getSupportedCoins: async (): Promise<Coin[]> => {
    try {
      // Try the new endpoint from the working example first
      try {
        const newResponse = await api.get<string[]>("/supported-tokens");
        if (Array.isArray(newResponse.data) && newResponse.data.length > 0) {
          // Convert token addresses to Coin objects
          return newResponse.data.map(addressToCoin);
        }
      } catch (err) {
        // Silently fail and try the original endpoint
        console.log("Falling back to original supported coins endpoint");
      }

      // Fall back to the original endpoint
      const response = await api.get<ApiResponse<Coin[]>>("/coins/supported");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching supported coins:", error);
      return [];
    }
  },

  getCoinMetadata: async (coinType: string): Promise<CoinMetadata | null> => {
    try {
      const response = await api.get<ApiResponse<CoinMetadata>>(
        `/coins/metadata/${coinType}`
      );
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching metadata for ${coinType}:`, error);
      return null;
    }
  },

  getCoinPrice: async (coinType: string): Promise<CoinPriceInfo | null> => {
    try {
      const response = await api.get<ApiResponse<CoinPriceInfo>>(
        `/coins/price/${coinType}`
      );
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching price for ${coinType}:`, error);
      return null;
    }
  },

  getMultipleCoinPrices: async (
    coinTypes: string[]
  ): Promise<Record<string, CoinPriceInfo> | null> => {
    try {
      const response = await api.post<
        ApiResponse<Record<string, CoinPriceInfo>>
      >("/coins/prices", { coins: coinTypes });
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching prices for multiple coins:`, error);
      return null;
    }
  },

  // New function to search for tokens (supports both new and old endpoints)
  searchCoins: async (query: string): Promise<Coin[]> => {
    if (!query.trim()) return [];

    try {
      // Try the new endpoint first (from the working example)
      try {
        const newResponse = await api.get<string[]>(
          `/search-tokens?query=${encodeURIComponent(query)}`
        );
        if (Array.isArray(newResponse.data)) {
          return newResponse.data.map(addressToCoin);
        }
      } catch (err) {
        // Silently fail and try the original endpoint
        console.log("Falling back to original search coins endpoint");
      }

      // Try the original endpoint
      const response = await api.get<ApiResponse<Coin[]>>(
        `/coins/search?query=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error searching coins:", error);
      return [];
    }
  },
};

// API endpoints for swaps
export const swapApi = {
  getQuote: async (
    coinInType: string,
    coinOutType: string,
    coinInAmount?: string,
    coinOutAmount?: string,
    slippage?: number
  ): Promise<QuoteResult | null> => {
    try {
      const params: any = {
        coinInType,
        coinOutType,
      };

      if (coinInAmount) {
        params.coinInAmount = coinInAmount;
      } else if (coinOutAmount) {
        params.coinOutAmount = coinOutAmount;
      }

      if (slippage !== undefined) {
        params.slippage = slippage;
      }

      const response = await api.get<ApiResponse<QuoteResult>>("/swap/quote", {
        params,
      });
      return response.data.data || null;
    } catch (error) {
      console.error("Error getting swap quote:", error);
      return null;
    }
  },

  // Function to create swap transaction (based on the working example)
  createSwapTransaction: async (params: {
    coinInType: string;
    coinOutType: string;
    coinInAmount: string;
    slippage: number;
    walletAddress: string;
  }) => {
    try {
      const response = await api.post("/swap", {
        coinInType: params.coinInType,
        coinOutType: params.coinOutType,
        amountIn: params.coinInAmount,
        slippage: params.slippage,
        walletAddress: params.walletAddress,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating swap transaction:", error);
      throw error; // Re-throw to be handled by the UI
    }
  },

  // Function to execute a transaction (based on the working example)
  executeTransaction: async (txBytes: string, signature: string) => {
    try {
      const response = await api.post("/execute", {
        txBytes,
        signature,
      });

      return response.data;
    } catch (error) {
      console.error("Error executing transaction:", error);
      throw error;
    }
  },

  getSupportedProtocols: async (): Promise<string[]> => {
    try {
      const response = await api.get<ApiResponse<string[]>>("/swap/protocols");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching protocols:", error);
      return [];
    }
  },

  getVolume24h: async (): Promise<number> => {
    try {
      const response = await api.get<ApiResponse<{ volume: number }>>(
        "/swap/volume24h"
      );
      return response.data.data?.volume || 0;
    } catch (error) {
      console.error("Error fetching 24h volume:", error);
      return 0;
    }
  },
};

// API endpoints for DCA
export const dcaApi = {
  getUserOrders: async (address: string): Promise<DcaOrder[]> => {
    try {
      const response = await api.get<ApiResponse<DcaOrder[]>>(
        `/dca/user/${address}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching DCA orders for ${address}:`, error);
      return [];
    }
  },

  getActiveOrders: async (address: string): Promise<DcaOrder[]> => {
    try {
      const response = await api.get<ApiResponse<DcaOrder[]>>(
        `/dca/user/${address}/active`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching active DCA orders for ${address}:`, error);
      return [];
    }
  },

  getPastOrders: async (address: string): Promise<DcaOrder[]> => {
    try {
      const response = await api.get<ApiResponse<DcaOrder[]>>(
        `/dca/user/${address}/past`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching past DCA orders for ${address}:`, error);
      return [];
    }
  },
};

export default {
  pools: poolsApi,
  coins: coinsApi,
  swap: swapApi,
  dca: dcaApi,
};
