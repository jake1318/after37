import express from "express";
import swapController from "../controllers/swapController.js";

const router = express.Router();

// Create swap transaction - this is the only one you've implemented
router.post("/swap", swapController.createSwapTransaction);

export default router;
