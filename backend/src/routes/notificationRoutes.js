import { Router } from "express";
import {
  listNotifications,
  markAllRead,
  unreadCount,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.post("/mark-read", markAllRead);

export default router;
