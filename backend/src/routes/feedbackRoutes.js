import { Router } from "express";
import {
  listFeedbackReports,
  submitFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/", listFeedbackReports);
router.post("/:id", upload.single("photo"), submitFeedback);
router.patch("/:id", upload.single("photo"), updateFeedback);
router.delete("/:id", deleteFeedback);

export default router;
