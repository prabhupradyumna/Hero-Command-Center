import express from "express";
import heroRoutes from "./routes/hero.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json());

app.use("/heroes", heroRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Hero Command Center is alive 🚀" });
});
app.use(errorHandler);

export default app;
