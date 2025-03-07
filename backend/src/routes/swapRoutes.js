import express from "express";
import {
  getQuote,
  getSupportedProtocols,
  getRouter24hVolume,
  getSupportedTokens,
  searchTokens,
  createSwapTransaction,
} from "../controllers/swapController.js";

const router = express.Router();

// Get quote for a swap
router.get("/quote", getQuote);

// Get supported protocols
router.get("/protocols", getSupportedProtocols);

// Get 24h volume of router
router.get("/volume24h", getRouter24hVolume);

// Get supported tokens
router.get("/tokens", getSupportedTokens);

// Search tokens
router.get("/search", searchTokens);

// Create swap transaction
router.post("/transaction", createSwapTransaction);

export default router;
