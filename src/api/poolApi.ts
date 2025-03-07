import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // Increased timeout
});

export const poolsApi = {
  getAllPools: async () => {
    try {
      const response = await api.get("/pools");
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching pools:", error);
      return [];
    }
  },

  getPoolStats: async (id) => {
    try {
      const response = await api.get(`/pools/${id}/stats`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error(`Error fetching stats for pool ${id}:`, error);
      return null;
    }
  },

  // New function to fetch stats for multiple pools
  getBatchPoolStats: async (poolIds) => {
    try {
      // Split into smaller batches to avoid timeouts
      const BATCH_SIZE = 10;
      const results = [];

      // Process in batches of 10
      for (let i = 0; i < poolIds.length; i += BATCH_SIZE) {
        const batchIds = poolIds.slice(i, i + BATCH_SIZE);
        const response = await api.post("/pools/batch-stats", {
          ids: batchIds,
        });

        if (response.data.success && Array.isArray(response.data.data)) {
          results.push(...response.data.data);
        }

        // Small delay between batches
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

  // Add this function to update your pools with stats
  updatePoolsWithStats: async (pools) => {
    // Get only the first 10-20 pools to avoid overwhelming the API
    const poolsToUpdate = pools.slice(0, 20);
    const poolIds = poolsToUpdate.map((pool) => pool.id || pool.objectId);

    try {
      const statsResults = await poolsApi.getBatchPoolStats(poolIds);

      // Create a map of stats by pool ID for easy lookup
      const statsMap = {};
      statsResults.forEach((result) => {
        if (result && result.id) {
          statsMap[result.id] = result;
        }
      });

      // Update the pools with their stats
      return pools.map((pool) => {
        const stats = statsMap[pool.id || pool.objectId];
        if (stats) {
          return {
            ...pool,
            tvl: stats.tvl || pool.tvl || 0,
            volume24h: stats.volume24h || pool.volume24h || 0,
            apr: stats.apr || pool.apr || 0,
            fees24h: stats.fees24h || pool.fees24h || 0,
          };
        }
        return pool;
      });
    } catch (error) {
      console.error("Error updating pools with stats:", error);
      return pools; // Return original pools if update fails
    }
  },
};

export default poolsApi;
