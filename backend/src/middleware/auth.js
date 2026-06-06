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

  if (user.role === "resident" && user.blocked) {
    return res.status(403).json({
      message: "Your account has been blocked. Contact support for help.",
    });
  }

  next();
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded?.sub) {
    return next();
  }

  const user = await findUserByIdForAuth(decoded.sub, decoded.role);
  if (user) {
    req.user = user;
  }
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

export function requireAdminOrTeamLeader(req, res, next) {
  if (req.user?.role === "admin") {
    return next();
  }
  if (req.user?.role === "cleaning_crew" && req.user?.crewSubRole === "team_leader") {
    return next();
  }
  return res.status(403).json({ message: "Admin or team leader access required" });
}

export function requireTeamAssignment(req, res, next) {
  if (!req.user?.teamName?.trim()) {
    return res.status(403).json({ message: "Team assignment required" });
  }
  next();
}
