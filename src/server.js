import http from "http";
import https from "https";
import fs from "fs";
import path from "path";

import app from "./app.js";
import sequelize from "./config/db.js";
import env from "./config/env.js";
import "./models/index.js";
import { accessLogger } from "./utils/logger.js";

// ── HTTPS (if certs exist) or HTTP fallback ───────────────────────────────────
const certPath = path.join("certs", "server.cert");
const keyPath = path.join("certs", "server.key");

const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = useHttps
  ? https.createServer(
      {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      },
      app
    )
  : http.createServer(app);

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  accessLogger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await sequelize.close();
      accessLogger.info("Database connection closed.");
      accessLogger.info("Server shut down.");
      process.exit(0);
    } catch (error) {
      accessLogger.error("Error during shutdown", { error: error.message });
      process.exit(1);
    }
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    accessLogger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Startup ───────────────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    accessLogger.info("PostgreSQL connected successfully");

    await sequelize.sync({ alter: true });
    accessLogger.info("Database synced successfully");

    server.listen(env.port, () => {
      const protocol = useHttps ? "https" : "http";
      accessLogger.info(
        `Hero Command Center running on ${protocol}://localhost:${env.port} [${env.nodeEnv}]`
      );
    });
  } catch (error) {
    accessLogger.error("Startup failed", { error: error.message });
    process.exit(1);
  }
})();
