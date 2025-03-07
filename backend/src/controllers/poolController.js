import cacheManager from "../utils/cacheManager.js";
import {
  getSDK,
  formatPoolData,
  formatPoolStats,
} from "../services/aftermath.js";
import logger from "../utils/logger.js";

// Define TTL constants directly to avoid the error
const TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Helper function to retry API calls
async function retryOperation(operation, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(
        `Operation failed (attempt ${attempt + 1}/${maxRetries}): ${
          error.message
        }`
      );

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        logger.info(`Waiting ${delay}ms before next attempt`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we're here, all attempts failed
  throw lastError;
}

/**
 * Extract basic token information from a pool
 */
function extractTokensFromPool(pool) {
  if (!pool || !pool.coins) return [];

  try {
    return Object.entries(pool.coins).map(([coinType, coinData]) => {
      // Extract symbol from coin type (last part after ::)
      const parts = coinType.split("::");
      const symbol = parts[parts.length - 1] || "UNKNOWN";

      return {
        type: coinType,
        symbol,
        decimals: coinData?.decimals || 9,
      };
    });
  } catch (err) {
    logger.warn(`Could not extract token info from pool: ${err.message}`);
    return [];
  }
}

export const getAllPools = async (req, res) => {
  try {
    const poolsData = await cacheManager.getOrSet(
      "all_pools",
      async () => {
        const sdk = getSDK();
        const pools = sdk.Pools();
        let allPools;

        try {
          // Get all pools with retry
          allPools = await retryOperation(() => pools.getAllPools());
          logger.info(`Successfully fetched ${allPools.length} pools`);
        } catch (error) {
          logger.error(`Failed to fetch pools: ${error.message}`);
          return [];
        }

        // Format pools WITHOUT stats to avoid timeouts
        const formattedPools = allPools
          .map((pool) => {
            try {
              const formattedPool = formatPoolData(pool);
              const tokens = extractTokensFromPool(pool);

              return {
                ...formattedPool,
                id: formattedPool.objectId, // Add id field for frontend compatibility
                tvl: 0, // Default values - stats will be loaded separately
                volume24h: 0,
                apr: 0,
                fees24h: 0,
                tokens,
              };
            } catch (error) {
              logger.error(
                `Error formatting pool ${pool.objectId}: ${error.message}`
              );
              return null;
            }
          })
          .filter((p) => p !== null); // Remove any null entries from formatting failures

        return formattedPools;
      },
      TTL.MEDIUM // Use local TTL constant
    );

    res.json({ success: true, data: poolsData || [] });
  } catch (error) {
    logger.error("Error fetching all pools:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [], // Return empty array to prevent frontend errors
    });
  }
};

export const getPoolById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Pool ID is required" });
    }

    const poolData = await cacheManager.getOrSet(
      `pool_${id}`,
      async () => {
        const sdk = getSDK();
        const pools = sdk.Pools();

        try {
          // Get pool with retry
          const pool = await retryOperation(() =>
            pools.getPool({ objectId: id })
          );
          if (!pool) {
            return null;
          }

          // Get spot prices for each token pair for informational purposes
          const formattedPool = formatPoolData(pool);
          const tokens = extractTokensFromPool(pool);

          // Get volume (fire and forget, don't block response)
          let volume24h = 0;
          try {
            const poolInstance = pools.Pool(pool);
            volume24h = await poolInstance.getVolume24hrs();
          } catch (volError) {
            logger.warn(
              `Failed to get 24h volume for pool ${id}: ${volError.message}`
            );
          }

          return {
            ...formattedPool,
            id: formattedPool.objectId,
            tokens,
            volume24h,
          };
        } catch (error) {
          logger.error(`Failed to get pool ${id}: ${error.message}`);
          return null;
        }
      },
      TTL.MEDIUM // Use local TTL constant
    );

    if (!poolData) {
      return res.status(404).json({ success: false, error: "Pool not found" });
    }

    res.json({ success: true, data: poolData });
  } catch (error) {
    logger.error(`Error fetching pool by ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    });
  }
};

export const getPoolStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Pool ID is required" });
    }

    const poolStats = await cacheManager.getOrSet(
      `pool_stats_${id}`,
      async () => {
        const sdk = getSDK();
        const pools = sdk.Pools();

        try {
          // Get pool with retry
          const pool = await retryOperation(() =>
            pools.getPool({ objectId: id })
          );
          if (!pool) {
            return null;
          }

          // Create Pool instance for stats methods
          const poolInstance = pools.Pool(pool);

          // Get stats with retries (run in parallel for speed)
          const [stats, volumeData, feeData] = await Promise.all([
            retryOperation(() => poolInstance.getStats()).catch((err) => {
              logger.error(
                `Failed to get stats for pool ${id}: ${err.message}`
              );
              return {};
            }),

            retryOperation(() =>
              poolInstance.getVolumeData({ timeframe: "1D" })
            ).catch((err) => {
              logger.error(
                `Failed to get volume data for pool ${id}: ${err.message}`
              );
              return [];
            }),

            retryOperation(() =>
              poolInstance.getFeeData({ timeframe: "1D" })
            ).catch((err) => {
              logger.error(
                `Failed to get fee data for pool ${id}: ${err.message}`
              );
              return [];
            }),
          ]);

          return {
            stats: formatPoolStats(stats),
            volumeData,
            feeData,
          };
        } catch (error) {
          logger.error(
            `Failed to get pool or stats for ${id}: ${error.message}`
          );
          return null;
        }
      },
      TTL.SHORT // Use local TTL constant
    );

    if (!poolStats) {
      return res.status(404).json({ success: false, error: "Pool not found" });
    }

    res.json({ success: true, data: poolStats });
  } catch (error) {
    logger.error(`Error fetching pool stats for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    });
  }
};

export const getUserLpPositions = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res
        .status(400)
        .json({ success: false, error: "Wallet address is required" });
    }

    const positions = await cacheManager.getOrSet(
      `lp_positions_${address}`,
      async () => {
        const sdk = getSDK();
        const pools = sdk.Pools();

        try {
          // Get user's LP positions with retry
          const lpCoins = await retryOperation(() =>
            pools.getOwnedLpCoins({ walletAddress: address })
          );

          // Get additional data for each position
          const enrichedPositions = await Promise.all(
            lpCoins.map(async (lpCoin) => {
              try {
                // Get pool ID for this LP coin type
                const poolId = await retryOperation(() =>
                  pools.getPoolObjectIdForLpCoinType({
                    lpCoinType: lpCoin.coinType,
                  })
                );

                if (!poolId) {
                  logger.warn(
                    `Could not find pool for LP coin type: ${lpCoin.coinType}`
                  );
                  return null;
                }

                // Get the pool
                const pool = await retryOperation(() =>
                  pools.getPool({ objectId: poolId })
                );

                if (!pool) {
                  logger.warn(`Could not find pool with ID: ${poolId}`);
                  return null;
                }

                // Create Pool instance for stats methods
                const poolInstance = pools.Pool(pool);

                // Get stats for the pool
                let stats;
                try {
                  stats = await retryOperation(() => poolInstance.getStats());
                } catch (error) {
                  logger.error(
                    `Failed to get stats for pool ${poolId}: ${error.message}`
                  );
                  stats = { lpPrice: 0, apr: 0 };
                }

                // Calculate USD value based on LP price and amount
                const lpDecimals = pool.lpCoinDecimals || 9;
                const lpAmount = lpCoin.amount || BigInt(0);
                const lpPrice = stats.lpPrice || 0;

                const usdValue =
                  (Number(lpAmount) * lpPrice) / Math.pow(10, lpDecimals);
                const totalLpSupply = Number(pool.lpCoinSupply || BigInt(1));
                const share = Number(lpAmount) / totalLpSupply;

                return {
                  poolId,
                  poolName: pool.name || "Unknown Pool",
                  lpCoinType: lpCoin.coinType,
                  lpAmount: lpAmount.toString(),
                  lpDecimals,
                  usdValue,
                  apr: stats.apr || 0,
                  share,
                  tokens: extractTokensFromPool(pool),
                };
              } catch (error) {
                logger.error(
                  `Error processing LP position for ${lpCoin.coinType}:`,
                  error
                );
                return null;
              }
            })
          );

          return enrichedPositions.filter((pos) => pos !== null);
        } catch (error) {
          logger.error(
            `Failed to get LP positions for ${address}: ${error.message}`
          );
          return [];
        }
      },
      TTL.SHORT // Use local TTL constant
    );

    res.json({ success: true, data: positions });
  } catch (error) {
    logger.error(
      `Error fetching user LP positions for ${req.params.address}:`,
      error
    );
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
};

/**
 * Get stats for multiple pools at once in a controlled batch
 */
export const getBatchPoolStats = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: "Pool IDs array is required in request body",
      });
    }

    // Limit the number of pools processed at once to avoid timeouts
    const poolIds = ids.slice(0, 10); // Process max 10 pools at a time

    const sdk = getSDK();
    const pools = sdk.Pools();

    // Get stats for each pool individually instead of in a batch
    const results = await Promise.all(
      poolIds.map(async (id) => {
        try {
          // Try to get from cache first
          const cachedStats = await cacheManager.get(`pool_stats_${id}`);
          if (cachedStats && cachedStats.stats) {
            const stats = cachedStats.stats;
            return {
              id,
              tvl: stats.tvl || 0,
              volume24h: stats.volume || 0,
              apr: stats.apr || 0,
              fees24h: stats.fees || 0,
            };
          }

          // Get pool with retry
          const pool = await retryOperation(() =>
            pools.getPool({ objectId: id })
          );

          if (!pool) {
            logger.warn(`Pool not found: ${id}`);
            return { id, error: "Pool not found" };
          }

          // Get stats for this individual pool
          const poolInstance = pools.Pool(pool);

          // Get stats with retry
          let stats = {};
          try {
            stats = await retryOperation(() => poolInstance.getStats());
          } catch (err) {
            logger.error(`Failed to get stats for pool ${id}: ${err.message}`);
            stats = {};
          }

          const formattedStats = formatPoolStats(stats);

          return {
            id,
            tvl: formattedStats?.tvl || 0,
            volume24h: formattedStats?.volume || 0,
            apr: formattedStats?.apr || 0,
            fees24h: formattedStats?.fees || 0,
          };
        } catch (error) {
          logger.error(
            `Error processing stats for pool ${id}: ${error.message}`
          );
          return { id, error: error.message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Error fetching batch pool stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
};

export default {
  getAllPools,
  getPoolById,
  getPoolStats,
  getUserLpPositions,
  getBatchPoolStats, // Add the new function to the exports
};
