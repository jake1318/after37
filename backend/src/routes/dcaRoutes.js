import express from "express";
import {
  getUserDcaOrders,
  getActiveDcaOrders,
  getPastDcaOrders,
} from "../controllers/dcaController.js";

const router = express.Router();

// Get all DCA orders for user
router.get("/user/:address", getUserDcaOrders);

// Get active DCA orders for user
router.get("/user/:address/active", getActiveDcaOrders);

// Get past DCA orders for user
router.get("/user/:address/past", getPastDcaOrders);

export default router;
