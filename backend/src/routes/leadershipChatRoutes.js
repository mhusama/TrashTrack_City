import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  listLeadershipMessages,
  postLeadershipMessage,
  toggleLeadershipLike,
} from "../controllers/leadershipChatController.js";
import { requireAuth, requireAdminOrTeamLeader } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.use(requireAuth, requireAdminOrTeamLeader);

router.get("/", listLeadershipMessages);
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  postLeadershipMessage
);
router.post("/:id/like", toggleLeadershipLike);

export default router;
