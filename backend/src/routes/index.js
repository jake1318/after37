import poolRoutes from "./poolRoutes.js";
import swapRoutes from "./swapRoutes.js";
import dcaRoutes from "./dcaRoutes.js";
import coinRoutes from "./coinRoutes.js";

export const setupRoutes = (app) => {
  app.use("/api/pools", poolRoutes);
  app.use("/api/swap", swapRoutes);
  app.use("/api/dca", dcaRoutes);
  app.use("/api/coins", coinRoutes);
};
