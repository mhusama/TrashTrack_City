import { Router } from "express";
import { getHeatmapStatistics } from "../controllers/statisticsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/heatmap", getHeatmapStatistics);

export default router;
