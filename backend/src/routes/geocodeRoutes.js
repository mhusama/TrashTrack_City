import { Router } from "express";
import { reverseGeocode } from "../controllers/geocodeController.js";

const router = Router();

router.get("/reverse", reverseGeocode);

export default router;
