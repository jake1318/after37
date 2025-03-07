import express from "express";
import coinController from "../controllers/coinController.js";

const router = express.Router();

router.get("/supported", coinController.getSupportedCoins);
router.get("/search", coinController.searchCoins);
router.get("/metadata/:coinType", coinController.getCoinMetadata);
router.get("/price/:coinType", coinController.getCoinPrice);
router.post("/prices", coinController.getMultipleCoinPrices);

export default router;
