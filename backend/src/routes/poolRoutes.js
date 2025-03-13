import express from "express";
import {
  getAllPools,
  getPoolById,
  getUserLpPositions,
  getPoolStats,
  getBatchPoolStats,
  depositLiquidity,
  withdrawLiquidity,
  createPool,
} from "../controllers/poolController.js";

const router = express.Router();

// Get all pools
router.get("/", getAllPools);

// Batch stats
router.post("/batch-stats", getBatchPoolStats);

// Deposit liquidity
router.post("/deposit", depositLiquidity);

// Withdraw liquidity
router.post("/withdraw", withdrawLiquidity);

// Create pool
router.post("/create", createPool);

// Get user's LP positions
router.get("/user/:address", getUserLpPositions);

// Get pool by ID
router.get("/:id", getPoolById);

// Get pool statistics
router.get("/:id/stats", getPoolStats);

export default router;
