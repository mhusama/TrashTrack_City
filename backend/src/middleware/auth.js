import { User } from "../models/User.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(userId).select("-password");
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
