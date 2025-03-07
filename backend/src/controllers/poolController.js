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

        // For large numbers of pools, we might need to batch the stats retrieval
        const BATCH_SIZE = 50;
        const formattedPools = [];

        // Process pools in batches to avoid overwhelming the API
        for (let i = 0; i < allPools.length; i += BATCH_SIZE) {
          const batch = allPools.slice(i, i + BATCH_SIZE);
          const poolIds = batch.map((pool) => pool.objectId);

          let batchStats = [];
          try {
            // Get stats for current batch with retry
            batchStats = await retryOperation(() =>
              pools.getPoolsStats({ poolIds })
            );
            logger.info(
              `Successfully fetched stats for batch ${i / BATCH_SIZE + 1}`
            );
          } catch (error) {
            logger.error(
              `Failed to get pool stats for batch ${i / BATCH_SIZE + 1}: ${
                error.message
              }`
            );
            // Continue with empty stats rather than failing
            batchStats = Array(batch.length).fill({});
          }

          // Format each pool in the current batch
          batch.forEach((pool, index) => {
            try {
              const formattedPool = formatPoolData(pool);
              const stats = batchStats[index] || {};
              const tokens = extractTokensFromPool(pool);

              formattedPools.push({
                ...formattedPool,
                id: formattedPool.objectId, // Add id field for frontend compatibility
                tvl: stats.tvl || 0,
                volume24h: stats.volume || 0,
                apr: stats.apr || 0,
                fees24h: stats.fees || 0,
                tokens,
              });
            } catch (error) {
              logger.error(
                `Error formatting pool at index ${i + index}: ${error.message}`
              );
              // Skip this pool if it fails to format
            }
          });

          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < allPools.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

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

export default {
  getAllPools,
  getPoolById,
  getPoolStats,
  getUserLpPositions,
};
