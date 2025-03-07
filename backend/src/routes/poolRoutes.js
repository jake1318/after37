import express from "express";
import {
  getAllPools,
  getPoolById,
  getUserLpPositions,
  getPoolStats,
  getBatchPoolStats,
} from "../controllers/poolController.js";

const router = express.Router();

// Get all pools
router.get("/", getAllPools);

// NOTE: The route order is important - more specific routes must come before /:id
// Get batch statistics for multiple pools
router.post("/batch-stats", getBatchPoolStats);

// Get user's LP positions
router.get("/user/:address", getUserLpPositions);

// Get pool by ID
router.get("/:id", getPoolById);

// Get pool statistics
router.get("/:id/stats", getPoolStats);

export default router;
