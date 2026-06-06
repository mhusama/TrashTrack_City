import { Router } from "express";
import {
  listContactMessagesForAdmin,
  listMyContactMessages,
  replyToContactMessage,
  submitContactMessage,
} from "../controllers/contactController.js";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", optionalAuth, submitContactMessage);
router.get("/mine", requireAuth, listMyContactMessages);
router.get("/admin", requireAuth, requireAdmin, listContactMessagesForAdmin);
router.patch("/admin/:id/reply", requireAuth, requireAdmin, replyToContactMessage);

export default router;
