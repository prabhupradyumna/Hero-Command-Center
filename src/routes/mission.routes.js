import express from "express";
import { body } from "express-validator";
import {
  createMission,
  getAllMissions,
  assignHeroToMission,
  removeHeroFromMission,
  updateMissionStatus,
  uploadMissionDocument,
} from "../controllers/mission.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

// Create Mission
router.post(
  "/",
  protect,
  authorize("Commander", "admin"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("threatLevel")
      .notEmpty().withMessage("Threat level is required")
      .isInt({ min: 1, max: 5 }).withMessage("Threat level must be an integer between 1 and 5"),
  ],
  createMission
);

// Get Missions
router.get("/", protect, getAllMissions);

// Assign Hero
router.post(
  "/:id/assign",
  protect,
  authorize("Commander", "admin"),
  [
    body("heroId").notEmpty().withMessage("heroId is required"),
  ],
  assignHeroToMission
);

// Remove Hero
router.post(
  "/:id/remove",
  protect,
  authorize("Commander", "admin"),
  [
    body("heroId").notEmpty().withMessage("heroId is required"),
  ],
  removeHeroFromMission
);

// Update Status
router.patch(
  "/:id/status",
  protect,
  authorize("Commander", "admin"),
  [
    body("status")
      .notEmpty().withMessage("Status is required")
      .isIn(["planned", "active", "completed", "failed"])
      .withMessage("Status must be one of: planned, active, completed, failed"),
  ],
  updateMissionStatus
);

// Upload Document
router.post(
  "/:id/document",
  protect,
  authorize("Commander", "admin"),
  upload.single("document"),
  uploadMissionDocument
);

export default router;
