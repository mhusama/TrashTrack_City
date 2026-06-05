import { Router } from "express";
import {
  createReport,
  deleteReport,
  getReport,
  listReports,
  updateReport,
  updateReportStatus,
} from "../controllers/reportController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/", listReports);
router.get("/:id", getReport);
router.post("/", upload.single("photo"), createReport);
router.patch("/:id/status", requireAdmin, updateReportStatus);
router.patch("/:id", upload.single("photo"), updateReport);
router.delete("/:id", deleteReport);

export default router;
