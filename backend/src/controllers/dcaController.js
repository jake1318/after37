import cacheManager from "../utils/cacheManager.js";
import { getSDK, formatDcaOrder } from "../services/aftermath.js";
import logger from "../utils/logger.js";

export const getUserDcaOrders = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res
        .status(400)
        .json({ success: false, error: "Wallet address is required" });
    }

    const orders = await cacheManager.getOrSet(
      `dca_orders_${address}`,
      async () => {
        const sdk = getSDK();
        const dca = sdk.Dca();

        const allOrders = await dca.getAllDcaOrders({ walletAddress: address });

        // Format orders
        return allOrders.map((order) => formatDcaOrder(order));
      },
      cacheManager.TTL.SHORT
    ); // Short cache since orders can change frequently

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error(`Error getting DCA orders for ${req.params.address}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveDcaOrders = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res
        .status(400)
        .json({ success: false, error: "Wallet address is required" });
    }

    const orders = await cacheManager.getOrSet(
      `dca_active_orders_${address}`,
      async () => {
        const sdk = getSDK();
        const dca = sdk.Dca();

        const activeOrders = await dca.getActiveDcaOrders({
          walletAddress: address,
        });

        // Format orders
        return activeOrders.map((order) => formatDcaOrder(order));
      },
      cacheManager.TTL.SHORT
    );

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error(
      `Error getting active DCA orders for ${req.params.address}:`,
      error
    );
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPastDcaOrders = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res
        .status(400)
        .json({ success: false, error: "Wallet address is required" });
    }

    const orders = await cacheManager.getOrSet(
      `dca_past_orders_${address}`,
      async () => {
        const sdk = getSDK();
        const dca = sdk.Dca();

        const pastOrders = await dca.getPastDcaOrders({
          walletAddress: address,
        });

        // Format orders
        return pastOrders.map((order) => formatDcaOrder(order));
      },
      cacheManager.TTL.MEDIUM
    ); // Medium cache since past orders don't change

    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error(
      `Error getting past DCA orders for ${req.params.address}:`,
      error
    );
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getUserDcaOrders,
  getActiveDcaOrders,
  getPastDcaOrders,
};
