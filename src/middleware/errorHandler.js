import { errorLogger } from "../utils/logger.js";

export default (err, req, res, next) => {
  errorLogger.error(err.message, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
};
