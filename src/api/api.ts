import axios from "axios";
import { aftermathService } from "../services/aftermath";
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
      // Use Aftermath SDK service instead of API call
      return await aftermathService.getAllPools();
    } catch (error) {
      console.error("Error fetching pools:", error);
      return []; // Return empty array instead of mocks
    }
  },

  // Other functions from the original file remain unchanged
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

// API endpoints for coins with SDK integration
export const coinsApi = {
  getSupportedCoins: async (): Promise<Coin[]> => {
    try {
      // Use Aftermath SDK service
      const supportedTokens = await aftermathService.getSupportedTokens();
      return supportedTokens.map(addressToCoin);
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
      // Use the SDK for price info
      const price = await aftermathService.getTokenPrice(coinType);

      return {
        price,
        price_24h_change: 0, // SDK doesn't provide 24h change yet
        last_updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching price for ${coinType}:`, error);
      return null;
    }
  },

  getMultipleCoinPrices: async (
    coinTypes: string[]
  ): Promise<Record<string, CoinPriceInfo> | null> => {
    try {
      // Use the SDK for prices
      const prices = await aftermathService.getTokenPrices(coinTypes);

      // Convert to the expected format
      const result: Record<string, CoinPriceInfo> = {};
      Object.entries(prices).forEach(([coinType, price]) => {
        result[coinType] = {
          price,
          price_24h_change: 0, // SDK doesn't provide 24h change yet
          last_updated_at: new Date().toISOString(),
        };
      });

      return result;
    } catch (error) {
      console.error(`Error fetching prices for multiple coins:`, error);
      return null;
    }
  },

  // Updated function to search for tokens using the SDK
  searchCoins: async (query: string): Promise<Coin[]> => {
    if (!query.trim()) return [];

    try {
      const tokens = await aftermathService.searchTokens(query);
      return tokens.map(addressToCoin);
    } catch (error) {
      console.error("Error searching coins:", error);
      return [];
    }
  },
};

// API endpoints for swaps
export const swapApi = {
  // Updated to use the SDK for getting quotes
  getQuote: async (
    coinInType: string,
    coinOutType: string,
    coinInAmount?: string,
    coinOutAmount?: string,
    slippage?: number
  ): Promise<QuoteResult | null> => {
    try {
      // For now, we'll maintain the original structure but use the SDK in the future
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

  // Other swap functions remain unchanged
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

  // Execute transaction function remains unchanged
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
      return ["Aftermath"]; // Default to just Aftermath protocol
    }
  },

  // Updated to use the SDK for getting 24h volume
  getVolume24h: async (): Promise<number> => {
    try {
      return await aftermathService.getVolume24h();
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
