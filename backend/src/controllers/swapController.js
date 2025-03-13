import { getSDK } from "../services/aftermath.js";
import logger from "../utils/logger.js";

export const createSwapTransaction = async (req, res) => {
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
    const sdk = getSDK();
    const router = sdk.Router();

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
    logger.error(`Error preparing swap transaction: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: "Failed to prepare swap transaction",
      details: error.message,
    });
  }
};

// Add stub functions for the other routes that are imported in swapRoutes.js

// Stub function for getting a swap quote
export const getQuote = async (req, res) => {
  const { coinInType, coinOutType, amountIn } = req.query;

  logger.info(
    `Quote request: ${coinInType} -> ${coinOutType}, amount: ${amountIn}`
  );

  if (!coinInType || !coinOutType || !amountIn) {
    return res.status(400).json({
      success: false,
      error: "Missing required quote parameters",
    });
  }

  try {
    // Basic implementation for now
    res.json({
      success: true,
      data: {
        coinInType,
        coinOutType,
        amountIn,
        amountOut: "0", // Placeholder
        price: "0",
        priceImpact: "0",
        route: [],
      },
    });
  } catch (error) {
    logger.error(`Error getting quote: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to get quote",
    });
  }
};

// Stub function for supported protocols
export const getSupportedProtocols = async (req, res) => {
  logger.info("Request for supported protocols");

  try {
    res.json({
      success: true,
      data: ["Aftermath"],
    });
  } catch (error) {
    logger.error(`Error getting supported protocols: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to get supported protocols",
    });
  }
};

// Stub function for 24h volume
export const getRouter24hVolume = async (req, res) => {
  logger.info("Request for 24h volume");

  try {
    res.json({
      success: true,
      data: {
        volume: "0",
        volumeUsd: "0",
      },
    });
  } catch (error) {
    logger.error(`Error getting 24h volume: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to get 24h volume",
    });
  }
};

// Stub function for supported tokens
export const getSupportedTokens = async (req, res) => {
  logger.info("Request for supported tokens");

  try {
    const sdk = getSDK();

    // Try to get tokens from the cached tokens in the index.js
    // For now just return empty array as placeholder
    const tokens = [];

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    logger.error(`Error getting supported tokens: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to get supported tokens",
    });
  }
};

// Stub function for token search
export const searchTokens = async (req, res) => {
  const { query } = req.query;
  logger.info(`Token search request: ${query}`);

  try {
    // For now just return empty array as placeholder
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    logger.error(`Error searching tokens: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to search tokens",
    });
  }
};

// Export all functions
export default {
  createSwapTransaction,
  getQuote,
  getSupportedProtocols,
  getRouter24hVolume,
  getSupportedTokens,
  searchTokens,
};
