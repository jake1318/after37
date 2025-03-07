import cacheManager from "../utils/cacheManager.js";
import { getSDK, formatTradeRoute } from "../services/aftermath.js";
import logger from "../utils/logger.js";

export const getQuote = async (req, res) => {
  try {
    const { coinInType, coinOutType, coinInAmount, coinOutAmount, slippage } =
      req.query;

    // Validate parameters based on query type
    if (coinInAmount) {
      // Quote for exact input
      if (!coinInType || !coinOutType || !coinInAmount) {
        return res.status(400).json({
          success: false,
          error:
            "coinInType, coinOutType, and coinInAmount are required for exact input quotes",
        });
      }
    } else if (coinOutAmount) {
      // Quote for exact output
      if (!coinInType || !coinOutType || !coinOutAmount || !slippage) {
        return res.status(400).json({
          success: false,
          error:
            "coinInType, coinOutType, coinOutAmount, and slippage are required for exact output quotes",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Either coinInAmount or coinOutAmount must be provided",
      });
    }

    // Don't cache quotes as they change frequently and are sensitive to price
    const sdk = getSDK();
    const router = sdk.Router();

    let tradeRoute;

    if (coinInAmount) {
      // Exact input quote
      tradeRoute = await router.getCompleteTradeRouteGivenAmountIn({
        coinInType,
        coinOutType,
        coinInAmount: BigInt(coinInAmount),
      });
    } else {
      // Exact output quote
      tradeRoute = await router.getCompleteTradeRouteGivenAmountOut({
        coinInType,
        coinOutType,
        coinOutAmount: BigInt(coinOutAmount),
        slippage: parseFloat(slippage),
      });
    }

    if (!tradeRoute) {
      return res.status(404).json({
        success: false,
        error: "No valid trade route found for the specified parameters",
      });
    }

    // Calculate additional trade information
    const formattedRoute = formatTradeRoute(tradeRoute);

    // Calculate price impact
    const priceImpact = Math.abs(
      1 -
        Number(tradeRoute.coinOut.amount) /
          (Number(tradeRoute.coinIn.amount) * tradeRoute.spotPrice)
    );

    res.json({
      success: true,
      data: {
        route: formattedRoute,
        priceImpact,
      },
    });
  } catch (error) {
    logger.error("Error getting swap quote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSupportedProtocols = async (req, res) => {
  try {
    const protocols = await cacheManager.getOrSet(
      "supported_protocols",
      () => {
        // Extract protocol names from RouterProtocolName type
        // This is a static list since the protocols don't change frequently
        return [
          "Aftermath",
          "BlueMove",
          "Cetus",
          "DeepBook",
          "DeepBookV3",
          "DoubleUpPump",
          "FlowX",
          "FlowXClmm",
          "HopFun",
          "Kriya",
          "KriyaClmm",
          "Metastable",
          "MovePump",
          "Obric",
          "SuiSwap",
          "Turbos",
          "SpringSui",
          "Bluefin",
          "TurbosFun",
        ];
      },
      3600 // 1 hour cache - fallback if TTL object not available
    ); // Long cache since protocols rarely change

    res.json({ success: true, data: protocols });
  } catch (error) {
    logger.error("Error getting supported protocols:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRouter24hVolume = async (req, res) => {
  try {
    const volume = await cacheManager.getOrSet(
      "router_volume_24h",
      async () => {
        const sdk = getSDK();
        const router = sdk.Router();

        return await router.getVolume24hrs();
      },
      60 // 1 minute cache - fallback if TTL object not available
    ); // Short cache since volume changes frequently

    res.json({ success: true, data: { volume } });
  } catch (error) {
    logger.error("Error getting 24h router volume:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get supported tokens for swapping
 * @route GET /api/swap/tokens
 */
export const getSupportedTokens = async (req, res) => {
  try {
    const tokens = await cacheManager.getOrSet(
      "supported_tokens",
      async () => {
        const sdk = getSDK();
        const router = sdk.Router();

        // Get supported coins
        const supportedCoins = await router.getSupportedCoins();

        // Return just the token types (addresses)
        return supportedCoins.map((coin) => coin.type);
      },
      300 // 5 minute cache - fallback if TTL object not available
    );

    logger.info(`Returning ${tokens.length} supported tokens`);
    res.json({ success: true, data: tokens });
  } catch (error) {
    logger.error("Error fetching supported tokens:", error);
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
};

/**
 * Search for tokens by query
 * @route GET /api/swap/search
 */
export const searchTokens = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const sdk = getSDK();
    const router = sdk.Router();

    // Get all supported coins
    const supportedCoins = await router.getSupportedCoins();

    // Filter coins by query (search in type and symbol)
    const results = supportedCoins
      .filter((coin) => {
        const lowerQuery = query.toLowerCase();
        const parts = coin.type.split("::");
        const symbol = parts[parts.length - 1].toLowerCase();

        return (
          coin.type.toLowerCase().includes(lowerQuery) ||
          symbol.includes(lowerQuery)
        );
      })
      .map((coin) => coin.type);

    logger.info(`Search query="${query}" => found ${results.length} tokens`);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error(
      `Error searching tokens with query '${req.query.query}':`,
      error
    );
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
};

/**
 * Create a swap transaction
 * @route POST /api/swap/transaction
 */
export const createSwapTransaction = async (req, res) => {
  try {
    const {
      fromToken,
      toToken,
      amount,
      slippage = 0.01,
      walletAddress,
    } = req.body;

    if (!fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: fromToken, toToken, amount, walletAddress",
      });
    }

    const sdk = getSDK();
    const router = sdk.Router();

    // Convert amount to BigInt (assumes 9 decimal places for SUI tokens)
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount value",
      });
    }

    const coinInAmount = BigInt(Math.floor(amountFloat * 1e9));

    logger.info(
      `Creating swap transaction: ${amount} ${fromToken} -> ${toToken}`
    );

    // Get trade route
    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType: fromToken,
      coinOutType: toToken,
      coinInAmount,
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: "No valid trade route found for these tokens and amount",
      });
    }

    // Create transaction
    const tx = await router.getTransactionForCompleteTradeRoute({
      walletAddress,
      completeRoute: route,
      slippage: parseFloat(slippage),
    });

    // Serialize transaction
    const txBytes = tx.serialize();

    res.json({
      success: true,
      data: {
        txBytes,
        route: formatTradeRoute(route),
      },
    });
  } catch (error) {
    logger.error("Error creating swap transaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getQuote,
  getSupportedProtocols,
  getRouter24hVolume,
  getSupportedTokens,
  searchTokens,
  createSwapTransaction,
};
