import express from "express";
import swapController from "../controllers/swapController.js";

const router = express.Router();

// Add the swap endpoint
router.post("/swap", swapController.createSwapTransaction);

export default router;
