import express from "express";
import {
  getAllPools,
  getPoolById,
  getUserLpPositions,
  getPoolStats,
} from "../controllers/poolController.js";

const router = express.Router();

// Get all pools
router.get("/", getAllPools);

// Get pool by ID
router.get("/:id", getPoolById);

// Get user's LP positions
router.get("/user/:address", getUserLpPositions);

// Get pool statistics
router.get("/:id/stats", getPoolStats);

export default router;
