import { Aftermath } from "aftermath-ts-sdk";

// Initialize Aftermath SDK with singleton pattern for reuse
let afSdkInstance: Aftermath | null = null;

export const getAfSdk = async (): Promise<Aftermath> => {
  if (!afSdkInstance) {
    afSdkInstance = new Aftermath("MAINNET");
    await afSdkInstance.init();
  }
  return afSdkInstance;
};

// Service functions to replace API calls
export const aftermathService = {
  // Get DEX trading volume for 24h (replaces /api/swap/volume24h)
  async getVolume24h(): Promise<number> {
    try {
      const af = await getAfSdk();
      const router = af.Router();
      const volume = await router.getVolume24hrs();
      return volume || 0;
    } catch (error) {
      console.error("Failed to get 24h volume from Aftermath SDK:", error);
      return 0;
    }
  },

  // Get supported tokens (replaces /api/supported-tokens)
  async getSupportedTokens(): Promise<string[]> {
    try {
      const af = await getAfSdk();
      const router = af.Router();
      const tokens = await router.getSupportedCoins();
      return tokens;
    } catch (error) {
      console.error(
        "Failed to get supported tokens from Aftermath SDK:",
        error
      );
      return [];
    }
  },

  // Get token prices (replaces /api/coins/price/:coinType)
  async getTokenPrice(coinType: string): Promise<number> {
    try {
      const af = await getAfSdk();
      const prices = af.Prices();
      const price = await prices.getCoinPrice({
        coin: coinType,
      });
      return price || 0;
    } catch (error) {
      console.error(
        `Failed to get price for ${coinType} from Aftermath SDK:`,
        error
      );
      return 0;
    }
  },

  // Get multiple token prices (replaces /api/coins/prices)
  async getTokenPrices(coinTypes: string[]): Promise<Record<string, number>> {
    try {
      const af = await getAfSdk();
      const prices = af.Prices();
      const priceInfo = await prices.getCoinsToPrice({
        coins: coinTypes,
      });
      return priceInfo;
    } catch (error) {
      console.error("Failed to get prices from Aftermath SDK:", error);
      return {};
    }
  },

  // Get protocol info (replaces /api/info/dex)
  async getProtocolInfo(): Promise<{
    totalPools: number;
    supportedDEXs: string[];
  }> {
    try {
      const af = await getAfSdk();
      const pools = af.Pools();
      const allPools = await pools.getAllPools();

      return {
        totalPools: allPools.length,
        supportedDEXs: ["Aftermath Finance"], // SDK mainly supports Aftermath
      };
    } catch (error) {
      console.error("Failed to get protocol info from Aftermath SDK:", error);
      return {
        totalPools: 0,
        supportedDEXs: ["Aftermath Finance"],
      };
    }
  },

  // Get token stats (replaces /api/info/tokens)
  async getTokenStats(): Promise<{
    totalTokens: number;
    popularTokens: string[];
  }> {
    try {
      const af = await getAfSdk();
      const router = af.Router();
      const supportedCoins = await router.getSupportedCoins();

      // For popular tokens, we can use a hard-coded list of well-known coins
      const popularSymbols = ["SUI", "USDC", "WETH", "USDT"];

      return {
        totalTokens: supportedCoins.length,
        popularTokens: popularSymbols,
      };
    } catch (error) {
      console.error("Failed to get token stats from Aftermath SDK:", error);
      return {
        totalTokens: 0,
        popularTokens: ["SUI", "USDC", "WETH", "USDT"],
      };
    }
  },

  // Search for tokens (replaces /api/search-tokens)
  async searchTokens(query: string): Promise<string[]> {
    try {
      const af = await getAfSdk();
      const router = af.Router();
      const allCoins = await router.getSupportedCoins();

      if (!query) return allCoins;

      // Filter coins by name/symbol/address
      const normalizedQuery = query.toLowerCase();
      const filteredCoins = allCoins.filter((coin) => {
        const symbol = coin.split("::").pop()?.toLowerCase() || "";
        return (
          coin.toLowerCase().includes(normalizedQuery) ||
          symbol.includes(normalizedQuery)
        );
      });

      return filteredCoins;
    } catch (error) {
      console.error("Failed to search tokens from Aftermath SDK:", error);
      return [];
    }
  },

  // Get all pools (replaces /api/pools)
  async getAllPools() {
    try {
      const af = await getAfSdk();
      const poolsApi = af.Pools();
      const pools = await poolsApi.getAllPools();

      // Transform to the format expected by the frontend
      return pools.map((pool, index) => {
        const tokenSymbols = Object.keys(pool.coins).map((coinType) => {
          return {
            type: coinType,
            symbol: coinType.split("::").pop() || "UNKNOWN",
            weight: Number(pool.coins[coinType].weight) / 1e9,
          };
        });

        // Calculate values for the pool
        return {
          id: pool.objectId || `pool-${index}`,
          name: pool.name || `Pool ${index}`,
          tokens: tokenSymbols,
          tvl: 100000 + Math.random() * 1000000, // Mock value - would need price calculations
          volume24h: 50000 + Math.random() * 100000, // Mock value
          fees24h: 500 + Math.random() * 5000, // Mock value
          apr: 0.05 + Math.random() * 0.3, // 5-35% APR
          created_at: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error("Failed to get pools from Aftermath SDK:", error);
      return [];
    }
  },
};
