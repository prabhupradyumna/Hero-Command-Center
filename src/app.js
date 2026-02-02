import express from "express";
import heroRoutes from "./routes/hero.routes.js";
import errorHandler from "./middleware/errorHandler.js";


const app = express();

app.use(express.json());

app.use("/heroes", heroRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Hero Command Center is alive 🚀" });
});
app.use(errorHandler);

export default app;
