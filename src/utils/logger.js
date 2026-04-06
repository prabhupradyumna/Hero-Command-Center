import winston from "winston";

const { combine, timestamp, json, colorize, printf } = winston.format;

// Console format (human readable for development)
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Access logger — every incoming request
export const accessLogger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: "logs/access.log" }),
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "HH:mm:ss" }),
        consoleFormat
      ),
    }),
  ],
});

// Error logger — application errors with stack traces
export const errorLogger = winston.createLogger({
  level: "error",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: "logs/error.log" }),
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "HH:mm:ss" }),
        consoleFormat
      ),
    }),
  ],
});

// Mission logger — hero recruitment, assignments, status changes
export const missionLogger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: "logs/mission.log" }),
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "HH:mm:ss" }),
        consoleFormat
      ),
    }),
  ],
});
