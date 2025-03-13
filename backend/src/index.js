import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupRoutes } from "./routes/index.js";
import { initSDK, getSDK } from "./services/aftermath.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// These will be accessible throughout the server
let sdk = null;
let cachedTokens = [];
let cachedAllCoins = [];

/**
 * Parse the ticker/symbol from a coin type
 */
function parseTicker(addr) {
  const parts = addr.split("::");
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Function to extract tokens from pools - similar to the working example
 */
async function buildTokenListFromPools(poolArray) {
  try {
    const tokenSet = new Set();

    for (const poolObj of poolArray) {
      try {
        // Try different methods to get coins from pool
        let coinInfos;

        if (poolObj.coins && typeof poolObj.coins === "function") {
          try {
            coinInfos = await poolObj.coins();
          } catch (e) {
            logger.warn(`Failed to get coins() from pool: ${e.message}`);
          }
        }

        // If that didn't work, try poolCoins method
        if (!coinInfos || coinInfos.length === 0) {
          if (poolObj.poolCoins && typeof poolObj.poolCoins === "function") {
            try {
              coinInfos = await poolObj.poolCoins();
            } catch (e) {
              logger.warn(`Failed to get poolCoins() from pool: ${e.message}`);
            }
          }
        }

        // Process the coins we found
        if (Array.isArray(coinInfos)) {
          for (const info of coinInfos) {
            if (typeof info === "string") {
              tokenSet.add(info);
            } else if (info?.coinType) {
              tokenSet.add(info.coinType);
            }
          }
        }

        // Direct access to pool.coins as object (not method)
        if (poolObj.coins && typeof poolObj.coins === "object") {
          Object.keys(poolObj.coins).forEach((coinType) => {
            tokenSet.add(coinType);
          });
        }
      } catch (err) {
        // Skip errors from individual pools
        logger.warn(`Error getting coins from pool: ${err.message}`);
      }
    }

    return Array.from(tokenSet);
  } catch (error) {
    logger.error(`Error in buildTokenListFromPools: ${error.message}`);
    return [];
  }
}

/**
 * Initialize token lists from pools
 */
async function initTokensFromPools() {
  try {
    if (!sdk) return [];

    const pools = sdk.Pools();
    const allPools = await pools.getAllPools();
    logger.info(`Fetched ${allPools.length} pools for token extraction`);

    // Get a subset for immediate display
    const limitedPools = allPools.slice(0, 50);
    cachedTokens = await buildTokenListFromPools(limitedPools);
    logger.info(`Extracted ${cachedTokens.length} tokens from first 50 pools`);

    // In background, build the full list
    setTimeout(async () => {
      try {
        const fullTokens = await buildTokenListFromPools(allPools);
        cachedAllCoins = fullTokens.map((address) => ({
          address,
          ticker: parseTicker(address),
        }));
        logger.info(
          `Built a full coin list for searching: ${cachedAllCoins.length} coins`
        );
      } catch (err) {
        logger.error(`Error building full token list: ${err.message}`);
      }
    }, 5000);

    return cachedTokens;
  } catch (error) {
    logger.error(`Failed to initialize tokens from pools: ${error.message}`);
    return [];
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add direct endpoints for token search
app.get("/api/supported-tokens", (req, res) => {
  res.json(cachedTokens);
});

app.get("/api/search-tokens", (req, res) => {
  const query = (req.query.query || "").toLowerCase();
  if (!query) return res.json([]);

  const results = cachedAllCoins
    .filter(
      (coin) =>
        coin.address.toLowerCase().includes(query) ||
        coin.ticker.includes(query)
    )
    .map((coin) => coin.address)
    .slice(0, 100); // Limit to 100 results for performance

  logger.info(`Search query="${query}" => found ${results.length} tokens`);
  res.json(results);
});

/**
 * Swap endpoint - creates transaction bytes for a token swap
 */
app.post("/api/swap", async (req, res) => {
  const {
    coinInType,
    coinOutType,
    amountIn,
    slippage = 0.01,
    walletAddress,
  } = req.body;

  logger.info(
    `Received swap request: ${coinInType} -> ${coinOutType} amount: ${amountIn} slippage: ${slippage}`
  );

  if (!coinInType || !coinOutType || !amountIn || !walletAddress) {
    logger.error("Missing required swap parameters");
    return res.status(400).json({
      success: false,
      error: "Missing required swap parameters",
    });
  }

  try {
    // Parse amount to BigInt with correct decimals
    const floatAmount = parseFloat(amountIn);
    if (isNaN(floatAmount) || floatAmount <= 0) {
      throw new Error(`Invalid amountIn="${amountIn}" (must be positive).`);
    }

    // Standard 9 decimals for Sui tokens
    const coinInAmount = BigInt(Math.floor(floatAmount * 1e9));
    logger.info(`Parsed coinInAmount => ${coinInAmount.toString()}`);

    // Get the SDK instance
    const currentSdk = getSDK();
    if (!currentSdk) {
      throw new Error("SDK not initialized");
    }

    const router = currentSdk.Router();

    // Get the trade route
    logger.info("Getting trade route...");
    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType,
      coinOutType,
      coinInAmount,
    });

    if (!route) {
      throw new Error("No valid trade route found for these parameters.");
    }

    logger.info("Route found, creating transaction...");
    const tx = await router.getTransactionForCompleteTradeRoute({
      walletAddress,
      completeRoute: route,
      slippage: slippage,
    });

    const txBytes = tx.serialize();
    logger.info("Transaction created successfully");

    // Return serialized transaction bytes to the frontend
    res.json({
      success: true,
      txBytes,
    });
  } catch (error) {
    logger.error(`Error preparing swap transaction: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to prepare swap transaction",
      details: error.message,
    });
  }
});

// Initialize the Aftermath SDK, then set up routes and start server
(async () => {
  try {
    // Initialize SDK first
    sdk = await initSDK();
    logger.info("Aftermath SDK initialized successfully");

    // Set up routes after SDK is initialized
    setupRoutes(app);

    // Initialize tokens from pools - this is the approach that works in the example
    await initTokensFromPools();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Refresh tokens periodically
    setInterval(async () => {
      try {
        await initTokensFromPools();
      } catch (error) {
        logger.error(`Failed to refresh token lists: ${error.message}`);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  } catch (error) {
    logger.error("Failed to initialize Aftermath SDK:", error);
    process.exit(1);
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
