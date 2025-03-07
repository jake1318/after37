import cacheManager from "../utils/cacheManager.js";
import { getSDK } from "../services/aftermath.js";
import logger from "../utils/logger.js";

// Define TTL constants
const TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Cache for tokens
let cachedTokens = [];
let cachedAllCoins = [];

/**
 * Build a token list from pools like in the example server
 */
async function buildTokenListFromPools(poolArray) {
  const tokenSet = new Set();

  for (const poolObj of poolArray) {
    try {
      if (!poolObj || !poolObj.coins) continue;

      // Extract coins from the pool object
      Object.keys(poolObj.coins).forEach((coinType) => {
        if (coinType && typeof coinType === "string") {
          tokenSet.add(coinType);
        }
      });
    } catch (error) {
      // Skip errors from individual pools
      logger.warn(`Error extracting coins from pool: ${error.message}`);
    }
  }

  return Array.from(tokenSet);
}

/**
 * Parse the ticker/symbol from a coin type
 */
function parseTicker(addr) {
  try {
    const parts = addr.split("::");
    return parts[parts.length - 1] || "UNKNOWN";
  } catch (error) {
    return "UNKNOWN";
  }
}

/**
 * Initialize the cached token lists
 */
export async function initCoinLists() {
  try {
    const sdk = getSDK();
    const pools = sdk.Pools();
    const router = sdk.Router();

    // Try to get all supported coins from router first
    try {
      const supportedCoins = await router.getSupportedCoins();
      if (Array.isArray(supportedCoins) && supportedCoins.length > 0) {
        logger.info(
          `Fetched ${supportedCoins.length} supported coins from router`
        );
        cachedTokens = supportedCoins.filter(
          (coin) => coin && typeof coin.type === "string"
        );

        // Create searchable coin list
        cachedAllCoins = cachedTokens.map((coin) => ({
          address: coin.type,
          ticker:
            coin.symbol?.toLowerCase() || parseTicker(coin.type).toLowerCase(),
          name: coin.name || "",
        }));

        logger.info(`Processed ${cachedAllCoins.length} coins for search`);
        return;
      }
    } catch (error) {
      logger.error(
        `Failed to get supported coins from router: ${error.message}`
      );
    }

    // If router approach fails, extract from pools
    logger.info(`Falling back to extracting tokens from pools`);

    try {
      const allPools = await pools.getAllPools();
      logger.info(`Fetched ${allPools.length} pools for token extraction`);

      // Get token list from pools
      const limitedPools = allPools.slice(0, 100); // Limit to first 100 pools for performance
      const partialTokens = await buildTokenListFromPools(limitedPools);
      logger.info(
        `Extracted ${partialTokens.length} tokens from first 100 pools`
      );

      // Process these tokens into the cached format
      cachedTokens = partialTokens.map((type) => {
        const symbol = parseTicker(type);
        return {
          type,
          symbol,
          name: symbol,
          decimals: 9, // Default decimals
          price: 0,
          isVerified: false,
        };
      });

      // Create the search index
      cachedAllCoins = partialTokens.map((address) => ({
        address,
        ticker: parseTicker(address).toLowerCase(),
        name: parseTicker(address),
      }));

      logger.info(
        `Processed ${cachedAllCoins.length} coins for search from pools`
      );
    } catch (error) {
      logger.error(`Failed to extract tokens from pools: ${error.message}`);
    }
  } catch (error) {
    logger.error(`Error initializing coin lists: ${error.message}`);
  }
}

export const getSupportedCoins = async (req, res) => {
  try {
    // If we have cached tokens, return them immediately
    if (cachedTokens.length > 0) {
      return res.json({ success: true, data: cachedTokens });
    }

    // Otherwise, get them from cache or initialize
    const coins = await cacheManager.getOrSet(
      "supported_coins",
      async () => {
        if (cachedTokens.length === 0) {
          await initCoinLists();
        }
        return cachedTokens;
      },
      TTL.MEDIUM
    );

    res.json({ success: true, data: coins || [] });
  } catch (error) {
    logger.error("Error fetching supported coins:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
};

export const searchCoins = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ success: true, data: [] });
    }

    // If we haven't loaded coins yet, initialize
    if (cachedAllCoins.length === 0) {
      await initCoinLists();
    }

    // Filter coins based on the query
    const searchQuery = query.toLowerCase();
    const results = cachedAllCoins
      .filter(
        (coin) =>
          coin.address.toLowerCase().includes(searchQuery) ||
          coin.ticker.includes(searchQuery) ||
          (coin.name && coin.name.toLowerCase().includes(searchQuery))
      )
      .map((coin) => coin.address)
      .slice(0, 100); // Limit results to prevent overwhelming the UI

    logger.info(`Search query="${query}" => found ${results.length} tokens`);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error(`Error searching coins: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
};

export const getCoinMetadata = async (req, res) => {
  try {
    const { coinType } = req.params;

    if (!coinType) {
      return res.status(400).json({
        success: false,
        error: "Coin type is required",
      });
    }

    // Fix any encoding issues in the coin type
    const decodedCoinType = decodeURIComponent(coinType);

    const metadata = await cacheManager.getOrSet(
      `metadata_${decodedCoinType}`,
      async () => {
        try {
          const sdk = getSDK();
          const router = sdk.Router();

          const metadata = await router.getCoinMetadata({
            coinType: decodedCoinType,
          });
          return metadata;
        } catch (error) {
          logger.error(
            `Error fetching coin metadata for ${decodedCoinType}: ${error.message}`
          );

          // Extract basic info from the coin type
          const parts = decodedCoinType.split("::");
          const symbol = parts[parts.length - 1] || "UNKNOWN";

          return {
            symbol,
            name: symbol,
            decimals: 9,
            iconUrl: null,
          };
        }
      },
      TTL.LONG
    );

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: "Coin metadata not found",
      });
    }

    res.json({ success: true, data: metadata });
  } catch (error) {
    logger.error(`Error in getCoinMetadata: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getCoinPrice = async (req, res) => {
  try {
    const { coinType } = req.params;

    if (!coinType) {
      return res.status(400).json({
        success: false,
        error: "Coin type is required",
      });
    }

    // Validate the coin type parameter
    if (coinType === "undefined" || !coinType.includes("::")) {
      return res.status(400).json({
        success: false,
        error: "Invalid coin type format",
      });
    }

    // Fix any encoding issues in the coin type
    const decodedCoinType = decodeURIComponent(coinType);

    const priceData = await cacheManager.getOrSet(
      `price_${decodedCoinType}`,
      async () => {
        try {
          const sdk = getSDK();
          const router = sdk.Router();

          const price = await router.getCoinPrice({
            coinType: decodedCoinType,
          });

          return {
            price: price || 0,
            priceChange24HoursPercentage: 0, // Default value if not available
          };
        } catch (error) {
          logger.error(
            `Failed to get price for ${decodedCoinType}: ${error.message}`
          );
          return { price: 0, priceChange24HoursPercentage: 0 };
        }
      },
      TTL.SHORT
    );

    res.json({ success: true, data: priceData });
  } catch (error) {
    logger.error(`Error in getCoinPrice: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      data: { price: 0, priceChange24HoursPercentage: 0 },
    });
  }
};

export const getMultipleCoinPrices = async (req, res) => {
  // (Keeping your existing implementation for this method)
  try {
    const { coins } = req.body;

    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Coin types array is required",
      });
    }

    // Filter out any invalid coin types
    const validCoins = coins.filter((coinType) => {
      if (!coinType || coinType === "undefined" || !coinType.includes("::")) {
        logger.warn(`Skipping invalid coin type: ${coinType}`);
        return false;
      }
      return true;
    });

    if (validCoins.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const prices = {};

    // Get prices for each coin in parallel
    await Promise.all(
      validCoins.map(async (coinType) => {
        try {
          const decodedCoinType = decodeURIComponent(coinType);
          const priceData = await cacheManager.getOrSet(
            `price_${decodedCoinType}`,
            async () => {
              try {
                const sdk = getSDK();
                const router = sdk.Router();

                const price = await router.getCoinPrice({
                  coinType: decodedCoinType,
                });
                return {
                  price: price || 0,
                  priceChange24HoursPercentage: 0,
                };
              } catch (error) {
                logger.error(
                  `Failed to get price for ${decodedCoinType}: ${error.message}`
                );
                return { price: 0, priceChange24HoursPercentage: 0 };
              }
            },
            TTL.SHORT
          );
          prices[coinType] = priceData;
        } catch (error) {
          logger.error(`Error getting price for ${coinType}: ${error.message}`);
          prices[coinType] = { price: 0, priceChange24HoursPercentage: 0 };
        }
      })
    );

    res.json({ success: true, data: prices });
  } catch (error) {
    logger.error(`Error in getMultipleCoinPrices: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {},
    });
  }
};

export default {
  getSupportedCoins,
  searchCoins,
  getCoinMetadata,
  getCoinPrice,
  getMultipleCoinPrices,
  initCoinLists,
};
