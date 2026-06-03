import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { initUserModels } from "./models/User.js";
import "./models/TeamRegistry.js";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

async function start() {
  await connectDB();
  initUserModels();
  logSmtpStatus();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
