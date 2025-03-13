import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // 30-second timeout for production
});

export const poolsApi = {
  // Fetch all pools (with stats if available)
  getAllPools: async () => {
    try {
      const response = await api.get("/pools");
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching pools:", error);
      return [];
    }
  },

  // Fetch stats for one pool
  getPoolStats: async (id: string) => {
    try {
      const response = await api.get(`/pools/${id}/stats`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error(`Error fetching stats for pool ${id}:`, error);
      return null;
    }
  },

  // Fetch stats for multiple pools in batches
  getBatchPoolStats: async (poolIds: string[]) => {
    try {
      const BATCH_SIZE = 10;
      const results: any[] = [];
      for (let i = 0; i < poolIds.length; i += BATCH_SIZE) {
        const batchIds = poolIds.slice(i, i + BATCH_SIZE);
        const response = await api.post("/pools/batch-stats", {
          ids: batchIds,
        });
        if (response.data.success && Array.isArray(response.data.data)) {
          results.push(...response.data.data);
        }
        if (i + BATCH_SIZE < poolIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      return results;
    } catch (error) {
      console.error("Error fetching batch pool stats:", error);
      return [];
    }
  },

  // Fetch our fixed list of pools (static list) merged with stats
  getStaticPoolsData: async () => {
    const staticPools = [
      {
        name: "superSUI/mUSD",
        id: "0x24e36f68a85fb0ed114879fc683fcf8e108ce11c31db9a2ba3ae200bbb29be26",
      },
      {
        name: "SUI/mUSD",
        id: "0x98327d7d07581bf78dfe277d8a88de39b4766962e8859b2050a1ca03e9fa2a16",
      },
      {
        name: "SuperStake",
        id: "0x52ac89ee8c446638930f53129803f026a04028d2c0deef314321f71c69ab7f78",
      },
      {
        name: "SUI/USDC",
        id: "0xb0cc4ce941a6c6ac0ca6d8e6875ae5d86edbec392c3333d008ca88f377e5e181",
      },
      {
        name: "SUI/NS",
        id: "0xee7a281296e0a316eff84e7ea0d5f3eb19d1860c2d4ed598c086ceaa9bf78c75",
      },
      {
        name: "mETH/mUSD",
        id: "0x08d746631e6e2aaa8d88b087be11245106497fbbaf4d7f0f2facd0acc645abf9",
      },
      {
        name: "SUI/BUCK",
        id: "0xdeacf7ab460385d4bcb567f183f916367f7d43666a2c72323013822eb3c57026",
      },
      {
        name: "LBTC/suiWBTC",
        id: "0x0878a407034629dd96b71b8eb73216b78501aea2c5d4b062fceb92a4b1a2ecb9",
      },
    ];
    const poolIds = staticPools.map((pool) => pool.id);
    const statsResults = await poolsApi.getBatchPoolStats(poolIds);
    const statsMap: { [id: string]: any } = {};
    statsResults.forEach((result) => {
      if (result && result.id) {
        statsMap[result.id] = result;
      }
    });
    return staticPools.map((pool) => {
      const poolStats = statsMap[pool.id] || {};
      return {
        ...pool,
        tvl: poolStats.tvl || 0,
        volume24h: poolStats.volume24h || 0,
        apr: poolStats.apr || 0,
        fees24h: poolStats.fees24h || 0,
      };
    });
  },

  // Deposit liquidity endpoint call
  depositLiquidity: async (
    poolId: string,
    coinType: string,
    amount: string,
    walletAddress: string
  ) => {
    try {
      const response = await api.post("/pools/deposit", {
        poolId,
        coinType,
        amount,
        walletAddress,
      });
      return response.data;
    } catch (error) {
      console.error("Error depositing liquidity:", error);
      throw error;
    }
  },

  // Withdraw liquidity endpoint call
  withdrawLiquidity: async (
    poolId: string,
    coinType: string,
    lpAmount: string,
    walletAddress: string
  ) => {
    try {
      const response = await api.post("/pools/withdraw", {
        poolId,
        coinType,
        lpAmount,
        walletAddress,
      });
      return response.data;
    } catch (error) {
      console.error("Error withdrawing liquidity:", error);
      throw error;
    }
  },

  // Publish LP coin for new pool creation. (Production: returns a transaction payload.)
  publishLpCoin: async (walletAddress: string) => {
    try {
      const response = await api.post("/pools/publish", { walletAddress });
      return response.data;
    } catch (error) {
      console.error("Error publishing LP coin:", error);
      throw error;
    }
  },

  // Create a new pool (requires lpCoinType from a successful publish).
  createPool: async (poolDetails: {
    walletAddress: string;
    poolName: string;
    lpCoinType: string;
    assets: Array<{
      coinType: string;
      weight: number;
      decimals: number;
      tradeFeeIn: number;
      initialDeposit: string;
    }>;
  }) => {
    try {
      const response = await api.post("/pools/create", poolDetails);
      return response.data;
    } catch (error) {
      console.error("Error creating pool:", error);
      throw error;
    }
  },
};

export default poolsApi;
