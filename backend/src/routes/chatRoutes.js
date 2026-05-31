import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { listMessages, postMessage, toggleLike } from "../controllers/chatController.js";
import { requireAuth, requireCrew } from "../middleware/auth.js";

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

router.use(requireAuth, requireCrew);

router.get("/", listMessages);
router.post("/", upload.fields([{ name: "image", maxCount: 1 }, { name: "voice", maxCount: 1 }]), postMessage);
router.post("/:id/like", toggleLike);

export default router;
