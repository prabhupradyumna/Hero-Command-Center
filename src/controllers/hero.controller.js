import Hero from "../models/Hero.js";
import { Op } from "sequelize";
import { validationResult } from "express-validator";
import { missionLogger } from "../utils/logger.js";

// 🟢 Recruit Hero
export const recruitHero = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, power, city } = req.body;

    const hero = await Hero.create({
      name,
      power,
      city,
      userId: req.user.id,
    });

    missionLogger.info("Hero recruited", {
      heroId: hero.id,
      name: hero.name,
      recruitedBy: req.user.id,
    });

    return res.status(201).json(hero);

  } catch (error) {
    console.error("Recruit Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// 🟢 Get All Heroes (Pagination + Filtering + Search)
export const getAllHeroes = async (req, res) => {
  try {
    const {
      squad,
      minClearance,
      active,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereCondition = {};

    if (squad) {
      whereCondition.squad = squad;
    }

    if (minClearance) {
      whereCondition.clearanceLevel = {
        [Op.gte]: parseInt(minClearance),
      };
    }

    if (active !== undefined) {
      whereCondition.isActive = active === "true";
    }

    if (search) {
      whereCondition.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { count, rows } = await Hero.findAndCountAll({
      where: whereCondition,
      limit: parsedLimit,
      offset,
    });

    res.status(200).json({
      totalHeroes: count,
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      heroes: rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 Soft Delete Hero — Hero is "retired" (Admin Only)
export const deleteHero = async (req, res) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByPk(id);

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    await hero.destroy();

    missionLogger.info("Hero retired", {
      heroId: hero.id,
      name: hero.name,
      retiredBy: req.user.id,
    });

    return res.status(200).json({ message: "Hero retired successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// 🟢 Restore Retired Hero (Admin Only)
export const restoreHero = async (req, res) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findOne({
      where: { id },
      paranoid: false,
    });

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    if (!hero.deletedAt) {
      return res.status(400).json({ message: "Hero is already active" });
    }

    await hero.restore();

    missionLogger.info("Hero restored", {
      heroId: hero.id,
      name: hero.name,
      restoredBy: req.user.id,
    });

    return res.status(200).json({ message: "Hero restored successfully" });

  } catch (error) {
    console.error("Restore Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// 🟢 Upload Hero Avatar
export const uploadHeroAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByPk(id);

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    hero.avatar = req.file.filename;
    await hero.save();

    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatar: hero.avatar,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
