import express from "express";
import { body } from "express-validator";
import { login, signup } from "../controllers/auth.controller.js";

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

export default router;
