import { Aftermath } from "aftermath-ts-sdk";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

let sdk = null;
let initialized = false;
let initializationPromise = null;

/**
 * Initialize the Aftermath SDK with retry logic
 */
export const initSDK = async () => {
  // Return existing promise if initialization is already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const network = process.env.SUI_NETWORK || "mainnet";

        logger.info(
          `Initializing Aftermath SDK on ${network} network (attempt ${
            retryCount + 1
          })`
        );
        sdk = new Aftermath(network.toUpperCase());
        await sdk.init();

        initialized = true;
        logger.info("Aftermath SDK initialized successfully");
        return sdk;
      } catch (error) {
        retryCount++;
        logger.error(
          `Failed to initialize Aftermath SDK (attempt ${retryCount}): ${error.message}`
        );

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Wait before next retry (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        logger.info(`Waiting ${waitTime}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  })();

  return initializationPromise;
};

/**
 * Get the initialized Aftermath SDK
 */
export const getSDK = () => {
  if (!initialized) {
    throw new Error("Aftermath SDK not initialized");
  }
  return sdk;
};

/**
 * Get the Sui provider from the initialized SDK
 */
export const getSuiProvider = () => {
  if (!initialized) {
    throw new Error("Aftermath SDK not initialized");
  }
  return sdk.getSuiProvider();
};

/**
 * Format pool data for API responses with extensive null checking
 */
export const formatPoolData = (pool) => {
  if (!pool) return null;

  try {
    return {
      objectId: pool.objectId || "",
      name: pool.name || "",
      lpCoinType: pool.lpCoinType || "",
      lpCoinSupply: pool.lpCoinSupply ? pool.lpCoinSupply.toString() : "0",
      illiquidLpCoinSupply: pool.illiquidLpCoinSupply
        ? pool.illiquidLpCoinSupply.toString()
        : "0",
      flatness: pool.flatness ? pool.flatness.toString() : "0",
      lpCoinDecimals: pool.lpCoinDecimals || 9,
      coins: Object.entries(pool.coins || {}).reduce(
        (acc, [coinType, coin]) => {
          if (!coin) {
            // Skip if coin is null or undefined
            return acc;
          }

          try {
            acc[coinType] = {
              weight: coin.weight ? coin.weight.toString() : "0",
              balance: coin.balance ? coin.balance.toString() : "0",
              normalizedBalance: coin.normalizedBalance
                ? coin.normalizedBalance.toString()
                : "0",
              tradeFeeIn: coin.tradeFeeIn ? coin.tradeFeeIn.toString() : "0",
              tradeFeeOut: coin.tradeFeeOut ? coin.tradeFeeOut.toString() : "0",
              depositFee: coin.depositFee ? coin.depositFee.toString() : "0",
              withdrawFee: coin.withdrawFee ? coin.withdrawFee.toString() : "0",
              decimals: coin.decimals || 9,
            };
          } catch (err) {
            logger.warn(`Error formatting coin ${coinType}: ${err.message}`);
            // Provide default values if formatting fails
            acc[coinType] = {
              weight: "0",
              balance: "0",
              normalizedBalance: "0",
              tradeFeeIn: "0",
              tradeFeeOut: "0",
              depositFee: "0",
              withdrawFee: "0",
              decimals: 9,
            };
          }
          return acc;
        },
        {}
      ),
    };
  } catch (error) {
    logger.error(`Error formatting pool data: ${error.message}`);
    // Return basic pool data if formatting fails
    return {
      objectId: pool.objectId || "",
      name: pool.name || "",
      lpCoinType: pool.lpCoinType || "",
      lpCoinSupply: "0",
      lpCoinDecimals: 9,
      coins: {},
    };
  }
};

/**
 * Format pool statistics for API responses
 */
export const formatPoolStats = (stats) => {
  if (!stats) return null;

  try {
    return {
      volume: stats.volume || 0,
      tvl: stats.tvl || 0,
      lpPrice: stats.lpPrice || 0,
      apr: stats.apr || 0,
      fees: stats.fees || 0,
      supplyPerLps: stats.supplyPerLps || {},
    };
  } catch (error) {
    logger.error(`Error formatting pool stats: ${error.message}`);
    return {
      volume: 0,
      tvl: 0,
      lpPrice: 0,
      apr: 0,
      fees: 0,
      supplyPerLps: {},
    };
  }
};

/**
 * Format trade route for API responses
 */
export const formatTradeRoute = (route) => {
  if (!route) return null;

  try {
    return {
      routes: route.routes || [],
      netTradeFeePercentage: route.netTradeFeePercentage || 0,
      referrer: route.referrer || null,
      externalFee: route.externalFee || 0,
      slippage: route.slippage || 0,
      coinIn: {
        type: route.coinIn?.type || "",
        amount: route.coinIn?.amount ? route.coinIn.amount.toString() : "0",
        tradeFee: route.coinIn?.tradeFee
          ? route.coinIn.tradeFee.toString()
          : "0",
      },
      coinOut: {
        type: route.coinOut?.type || "",
        amount: route.coinOut?.amount ? route.coinOut.amount.toString() : "0",
        tradeFee: route.coinOut?.tradeFee
          ? route.coinOut.tradeFee.toString()
          : "0",
      },
      spotPrice: route.spotPrice || 0,
    };
  } catch (error) {
    logger.error(`Error formatting trade route: ${error.message}`);
    return {
      routes: [],
      netTradeFeePercentage: 0,
      coinIn: { type: "", amount: "0", tradeFee: "0" },
      coinOut: { type: "", amount: "0", tradeFee: "0" },
      spotPrice: 0,
    };
  }
};

/**
 * Format DCA orders for API responses
 */
export const formatDcaOrder = (order) => {
  if (!order) return null;

  try {
    return {
      objectId: order.objectId || "",
      overview: {
        allocatedCoin: {
          coin: order.overview?.allocatedCoin?.coin || "",
          amount: order.overview?.allocatedCoin?.amount
            ? order.overview.allocatedCoin.amount.toString()
            : "0",
        },
        buyCoin: {
          coin: order.overview?.buyCoin?.coin || "",
          amount: order.overview?.buyCoin?.amount
            ? order.overview.buyCoin.amount.toString()
            : "0",
        },
        totalSpent: order.overview?.totalSpent
          ? order.overview.totalSpent.toString()
          : "0",
        intervalMs: order.overview?.intervalMs || 0,
        totalTrades: order.overview?.totalTrades || 0,
        tradesRemaining: order.overview?.tradesRemaining || 0,
        maxSlippageBps: order.overview?.maxSlippageBps || 0,
        progress: order.overview?.progress || 0,
        recipient: order.overview?.recipient || "",
        strategy: order.overview?.strategy
          ? {
              minPrice: order.overview.strategy.minPrice
                ? order.overview.strategy.minPrice.toString()
                : "0",
              maxPrice: order.overview.strategy.maxPrice
                ? order.overview.strategy.maxPrice.toString()
                : "0",
            }
          : undefined,
        integratorFee: order.overview?.integratorFee || 0,
      },
      trades: (order.trades || []).map((trade) => {
        try {
          return {
            allocatedCoin: {
              coin: trade.allocatedCoin?.coin || "",
              amount: trade.allocatedCoin?.amount
                ? trade.allocatedCoin.amount.toString()
                : "0",
            },
            buyCoin: {
              coin: trade.buyCoin?.coin || "",
              amount: trade.buyCoin?.amount
                ? trade.buyCoin.amount.toString()
                : "0",
            },
            tnxDigest: trade.tnxDigest || "",
            tnxDate: trade.tnxDate || "",
            rate: trade.rate || 0,
          };
        } catch (err) {
          logger.warn(`Error formatting trade in DCA order: ${err.message}`);
          return {
            allocatedCoin: { coin: "", amount: "0" },
            buyCoin: { coin: "", amount: "0" },
            tnxDigest: "",
            tnxDate: "",
            rate: 0,
          };
        }
      }),
      failed: order.failed || false,
    };
  } catch (error) {
    logger.error(`Error formatting DCA order: ${error.message}`);
    return {
      objectId: order.objectId || "",
      overview: {
        allocatedCoin: { coin: "", amount: "0" },
        buyCoin: { coin: "", amount: "0" },
        totalSpent: "0",
        intervalMs: 0,
        totalTrades: 0,
        tradesRemaining: 0,
        maxSlippageBps: 0,
        progress: 0,
        recipient: "",
      },
      trades: [],
      failed: false,
    };
  }
};

export default {
  initSDK,
  getSDK,
  getSuiProvider,
  formatPoolData,
  formatPoolStats,
  formatTradeRoute,
  formatDcaOrder,
};
