import express from "express";
import { body } from "express-validator";
import {
  recruitHero,
  getAllHeroes,
  deleteHero,
  restoreHero,
  uploadHeroAvatar,
} from "../controllers/hero.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

// ✅ Recruit Hero
router.post(
  "/",
  protect,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("power").notEmpty().withMessage("Power is required"),
    body("city").notEmpty().withMessage("City is required"),
  ],
  recruitHero
);

// ✅ Get All Heroes
router.get("/", protect, getAllHeroes);

// ✅ Upload Hero Avatar
router.post(
  "/:id/avatar",
  protect,
  upload.single("avatar"),
  uploadHeroAvatar
);

// ✅ Admin-only soft delete (retire hero)
router.delete("/:id", protect, authorize("admin"), deleteHero);

// ✅ Admin-only restore (reinstate hero)
router.patch("/:id/restore", protect, authorize("admin"), restoreHero);

export default router;
