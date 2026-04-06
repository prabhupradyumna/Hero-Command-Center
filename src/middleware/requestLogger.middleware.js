import { accessLogger } from "../utils/logger.js";

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    accessLogger.info("Incoming request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
};

export default requestLogger;
