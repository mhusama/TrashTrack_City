import { Router } from "express";
import { adminEnrollTeam, previewRegisterIds, register, login, me, forgotPassword, resetPassword, validateResetToken, updateProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadProfilePicture, uploadUserFiles } from "../middleware/uploadUser.js";

const router = Router();

router.get("/register-id-preview", previewRegisterIds);
router.post("/admin-enroll-team", adminEnrollTeam);
router.post("/register", uploadUserFiles, register);
router.post("/login", login);
router.patch("/profile", requireAuth, uploadProfilePicture, updateProfile);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/validate", validateResetToken);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, me);

export default router;
