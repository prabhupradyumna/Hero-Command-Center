import app from "./app.js";
import sequelize from "./config/db.js";
import "./models/Hero.js"; // 👈 model MUST be imported

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // 1️⃣ Check DB connection
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully ✅");

    // 2️⃣ Sync models → creates/updates tables
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully 🗄️");

    // 3️⃣ Start server
    app.listen(PORT, () => {
      console.log(`Hero Command Center backend is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed ❌", error);
  }
})();
