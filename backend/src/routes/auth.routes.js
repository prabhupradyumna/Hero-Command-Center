import express from "express";
import { body } from "express-validator";
import { login, logout, me, refreshToken, removeMyAvatar, signup, uploadMyAvatar } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("name")
      .notEmpty().withMessage("Name is required")
      .trim(),
    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  signup
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", me);
router.post("/avatar", protect, upload.single("avatar"), uploadMyAvatar);
router.delete("/avatar", protect, removeMyAvatar);

export default router;
