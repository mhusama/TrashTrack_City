import { findUserByIdForAuth } from "../models/User.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const decoded = verifyToken(token);
  if (!decoded?.sub) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await findUserByIdForAuth(decoded.sub, decoded.role);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function requireStaff(req, res, next) {
  if (req.user?.role !== "admin" && req.user?.role !== "cleaning_crew") {
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
}

export function requireCrew(req, res, next) {
  if (req.user?.role !== "cleaning_crew") {
    return res.status(403).json({ message: "Cleaning crew access required" });
  }
  next();
}
