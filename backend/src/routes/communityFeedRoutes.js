import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  addFeedComment,
  getReviewThread,
  listCommunityFeed,
  listFeedComments,
  toggleCommentLike,
  toggleReviewLike,
} from "../controllers/communityFeedController.js";
import { requireAuth } from "../middleware/auth.js";

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

router.use(requireAuth);

router.get("/", listCommunityFeed);
router.post("/comments/:commentId/like", toggleCommentLike);
router.get("/:reportId/thread", getReviewThread);
router.post("/:reportId/review/like", toggleReviewLike);
router.get("/:reportId/comments", listFeedComments);
router.post(
  "/:reportId/comments",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  addFeedComment
);

export default router;
