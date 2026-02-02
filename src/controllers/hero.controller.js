import * as heroRepository from "../repository/hero.repository.js";

export const recruitHero = async (req, res, next) => {
  try {
    const hero = await heroRepository.createHero(req.body);
    res.status(201).json({
      message: "Hero recruited successfully 🦸",
      data: hero
    });
  } catch (error) {
    next(error);
  }
};

export const getHeroes = async (req, res, next) => {
  try {
    const heroes = await heroRepository.getAllHeroes();
    res.status(200).json(heroes);
  } catch (error) {
    next(error);
  }
};
export const getHeroById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hero = await heroRepository.getHeroById(id);

    if (!hero) {
      return res.status(404).json({
        message: "Hero not found ❌"
      });
    }

    res.status(200).json(hero);
  } catch (error) {
    next(error);
  }
};
export const updateHero = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedHero = await heroRepository.updateHeroById(id, req.body);

    if (!updatedHero) {
      return res.status(404).json({
        message: "Hero not found ❌"
      });
    }

    res.status(200).json({
      message: "Hero updated successfully ✅",
      data: updatedHero
    });
  } catch (error) {
    next(error);
  }
};
export const deleteHero = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedHero = await heroRepository.deleteHeroById(id);

    if (!deletedHero) {
      return res.status(404).json({
        message: "Hero not found ❌"
      });
    }

    res.status(200).json({
      message: "Hero deactivated successfully 🗑️"
    });
  } catch (error) {
    next(error);
  }
};