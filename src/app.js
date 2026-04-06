import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";

import heroRoutes from "./routes/hero.routes.js";
import authRoutes from "./routes/auth.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import { protect } from "./middleware/auth.middleware.js";
import env from "./config/env.js";

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate Limiting on auth endpoints ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window per IP
  message: { message: "Too many requests, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // reject oversized payloads

// ── Request Logger ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/heroes", heroRoutes);
app.use("/api/missions", missionRoutes);
app.use(
  "/files",
  protect,
  express.static(path.join("src/public/uploads"))
);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Hero Command Center is alive",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
