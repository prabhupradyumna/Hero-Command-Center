import express from "express";
import { recruitHero, getAllHeroes, deleteHero } from "../controllers/hero.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, recruitHero);
router.get("/", protect, getAllHeroes);

// Example admin-only delete
router.delete("/:id", protect, authorize("admin"), deleteHero);

export default router;
