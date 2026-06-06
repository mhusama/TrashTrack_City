import "dotenv/config";
import express from "express";
import cors from "cors";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { initUserModels } from "./models/User.js";
import { purgeExcludedTeamsFromRegistry } from "./services/teamRegistryService.js";
import "./models/TeamRegistry.js";
import "./models/TeamLocation.js";
import "./models/Vehicle.js";
import { logSmtpStatus } from "./utils/mailer.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import geocodeRoutes from "./routes/geocodeRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import crewRoutes from "./routes/crewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import leadershipChatRoutes from "./routes/leadershipChatRoutes.js";
import teamChatRoutes from "./routes/teamChatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import communityFeedRoutes from "./routes/communityFeedRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import "./models/ResidentMessage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/$/, ""));

function isPrivateNetworkHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

function isNgrokHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return (
    host.endsWith(".ngrok-free.app") ||
    host.endsWith(".ngrok-free.dev") ||
    host.endsWith(".ngrok.io") ||
    host.endsWith(".ngrok.app")
  );
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, "");
  if (allowedOrigins.includes(normalized)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return isPrivateNetworkHost(hostname) || isNgrokHost(hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TrashTrack City API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/crew", crewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/leadership-chat", leadershipChatRoutes);
app.use("/api/team-chat", teamChatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/community-feed", communityFeedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

async function start() {
  await connectDB();
  initUserModels();
  await purgeExcludedTeamsFromRegistry();
  logSmtpStatus();
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const lanIp = Object.values(os.networkInterfaces())
      .flat()
      .find((net) => net?.family === "IPv4" && !net.internal)?.address;
    if (lanIp) {
      console.log(`  Network: http://${lanIp}:${PORT}`);
    }
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
