import Hero from "../models/Hero.js";

// 🟢 Create Hero
export const recruitHero = async (req, res) => {
  try {
    const { name, power, city } = req.body;

    const hero = await Hero.create({
      name,
      power,
      city,
      userId: req.user.id, // attach logged-in user
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

// 🟢 Get Heroes (Pagination + Role Based)
export const getAllHeroes = async (req, res) => {
  try {
    const { page = 1, limit = 5, city } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereCondition = {};

    // 🔥 If NOT admin → restrict to their heroes
    if (req.user.role !== "admin") {
      whereCondition.userId = req.user.id;
    }

    // Optional city filter
    if (city) {
      whereCondition.city = city;
    }

    const { count, rows } = await Hero.findAndCountAll({
      where: whereCondition,
      limit: parsedLimit,
      offset: offset,
    });

    return res.status(200).json({
      totalHeroes: count,
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      heroes: rows,
    });

  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// 🟢 Delete Hero (Admin Only)
export const deleteHero = async (req, res) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByPk(id);

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    await hero.destroy();

    return res.status(200).json({ message: "Hero deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
