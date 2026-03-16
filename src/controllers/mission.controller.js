import { Op } from "sequelize";
import { validationResult } from "express-validator";
import { missionLogger } from "../utils/logger.js";
import { Mission, Hero } from "../models/index.js";

// ✅ Create Mission
export const createMission = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, threatLevel } = req.body;

    const mission = await Mission.create({
      title,
      description,
      threatLevel,
    });

    res.status(201).json({
      message: "Mission created successfully",
      mission,
    });

    missionLogger.info("Mission created", {
      missionId: mission.id,
      title: mission.title,
      threatLevel: mission.threatLevel,
      createdBy: req.user.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// ✅ Get All Missions (Pagination + Filtering + Search + Include Heroes)
export const getAllMissions = async (req, res) => {
  try {
    const { page = 1, limit = 5, status, search, sort = "createdAt" } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereCondition = {};

    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition.title = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const { count, rows } = await Mission.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Hero,
          through: { attributes: [] },
        },
      ],
      limit: parsedLimit,
      offset: offset,
      order: [[sort, "DESC"]],
    });

    res.status(200).json({
      totalMissions: count,
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      missions: rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// ✅ Assign Hero to Mission
export const assignHeroToMission = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { heroId } = req.body;

    const mission = await Mission.findByPk(id);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    const hero = await Hero.findByPk(heroId);
    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    if (!hero.isActive) {
      return res.status(400).json({
        message: "Inactive hero cannot be assigned",
      });
    }

    if (hero.clearanceLevel < mission.threatLevel) {
      return res.status(403).json({
        message: "Insufficient clearance level",
      });
    }

    const alreadyAssigned = await mission.hasHero(hero);
    if (alreadyAssigned) {
      return res.status(400).json({
        message: "Hero already assigned to this mission",
      });
    }

    await mission.addHero(hero);

    missionLogger.info("Hero assigned to mission", {
      missionId: mission.id,
      missionTitle: mission.title,
      heroId: hero.id,
      heroName: hero.name,
      assignedBy: req.user.id,
    });

    res.status(200).json({
      message: "Hero assigned to mission successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// ✅ Remove Hero From Mission
export const removeHeroFromMission = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { heroId } = req.body;

    const mission = await Mission.findByPk(id);
    const hero = await Hero.findByPk(heroId);

    if (!mission || !hero) {
      return res.status(404).json({
        message: "Mission or Hero not found",
      });
    }

    await mission.removeHero(hero);

    res.status(200).json({
      message: "Hero removed from mission successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// ✅ Update Mission Status
export const updateMissionStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    const mission = await Mission.findByPk(id);

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    mission.status = status;
    await mission.save();

    missionLogger.info("Mission status updated", {
      missionId: mission.id,
      missionTitle: mission.title,
      newStatus: status,
      updatedBy: req.user.id,
    });

    res.status(200).json({
      message: "Mission status updated successfully",
      mission,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// ✅ Upload Mission Document
export const uploadMissionDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.findByPk(id);

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    mission.document = req.file.path;
    await mission.save();

    res.status(200).json({
      message: "Mission document uploaded successfully",
      mission,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};