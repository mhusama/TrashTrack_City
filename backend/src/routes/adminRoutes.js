import { Router } from "express";
import { listResidentActivities, setResidentBlocked } from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/resident-activities", listResidentActivities);
router.patch("/residents/:id/block", setResidentBlocked);

export default router;
