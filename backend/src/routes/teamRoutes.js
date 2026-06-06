import { Router } from "express";
import {
  approveReport,
  assignReportToTeam,
  enrollTeamByAdmin,
  getAssignmentTable,
  getTeamMembers,
  getCrewUserCredentials,
  getTeamRegisterOptionsHandler,
  getTeamsOverview,
  listPendingApprovals,
} from "../controllers/teamController.js";
import {
  listTeamLocations,
  updateTeamLocation,
} from "../controllers/teamLocationController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/register-options", getTeamRegisterOptionsHandler);

router.use(requireAuth, requireAdmin);

router.get("/overview", getTeamsOverview);
router.get("/locations", listTeamLocations);
router.patch("/locations/:id", updateTeamLocation);
router.get("/assignment-table", getAssignmentTable);
router.get("/pending-approvals", listPendingApprovals);
router.post("/enroll", enrollTeamByAdmin);
router.get("/crew-user/:userId", getCrewUserCredentials);
router.get("/:teamName/members", getTeamMembers);
router.post("/reports/:id/assign", assignReportToTeam);
router.patch("/reports/:id/approval", approveReport);

export default router;
