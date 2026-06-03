import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  listTeamMessages,
  postTeamMessage,
  toggleTeamLike,
} from "../controllers/teamChatController.js";
import { requireAuth, requireCrew, requireTeamAssignment } from "../middleware/auth.js";

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

router.use(requireAuth, requireCrew, requireTeamAssignment);

router.get("/", listTeamMessages);
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  postTeamMessage
);
router.post("/:id/like", toggleTeamLike);

export default router;
