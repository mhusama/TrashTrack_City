import { Router } from "express";
import {
  getMyTeam,
  getTeamReport,
  listTeamReports,
  listVehiclesWithAvailability,
  markDisposalInProgress,
  setReportTransport,
  submitUpdatedTaskReport,
  unsubmitUpdatedTaskReport,
} from "../controllers/crewController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/reports", listTeamReports);
router.get("/reports/:id", getTeamReport);
router.get("/vehicles", listVehiclesWithAvailability);
router.get("/team", getMyTeam);
router.patch("/reports/:id/transport", setReportTransport);
router.patch("/reports/:id/disposal", markDisposalInProgress);
router.post("/reports/:id/updated-task", upload.single("image"), submitUpdatedTaskReport);
router.post("/reports/:id/updated-task/unsubmit", unsubmitUpdatedTaskReport);

export default router;
