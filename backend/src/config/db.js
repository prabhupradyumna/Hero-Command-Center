import { Sequelize } from "sequelize";
import env from "./env.js";

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "postgres",
  logging: env.nodeEnv === "development" ? false : false,

  // Connection pooling — reuses DB connections instead of creating new ones
  pool: {
    max: 10,       // maximum number of connections in pool
    min: 2,        // minimum number of connections kept alive
    acquire: 30000, // max ms to wait before throwing error when getting connection
    idle: 10000,   // ms a connection can be idle before being released
  },
});

export default sequelize;
