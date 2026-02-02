import express from "express";
import { recruitHero, getHeroes, getHeroById, updateHero, deleteHero } from "../controllers/hero.controller.js";

const router = express.Router();

router.post("/recruit", recruitHero);
router.get("/", getHeroes);
router.get("/:id", getHeroById);
router.put("/:id", updateHero);
router.delete("/:id", deleteHero);


export default router;
