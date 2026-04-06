import dotenv from "dotenv";
dotenv.config();

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

  // Database
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT || 5432,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,

  // CORS
  corsOrigin:
    process.env.CORS_ORIGIN ||
    "http://localhost:3001,http://localhost:5173",
};

// Fail fast if critical secrets are missing
const required = ["jwtSecret", "dbHost", "dbName", "dbUser", "dbPassword"];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export default env;
