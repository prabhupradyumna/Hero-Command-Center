import Hero from "../models/Hero.js";

export const createHero = (heroData) => {
  return Hero.create(heroData);
};

export const getAllHeroes = () => {
  return Hero.findAll();
};

export const getHeroById = (id) => {
  return Hero.findByPk(id);
};
export const updateHeroById = async (id, updateData) => {
  const hero = await Hero.findByPk(id);

  if (!hero) {
    return null;
  }

  return hero.update(updateData);
};
export const deleteHeroById = async (id) => {
  const hero = await Hero.findByPk(id);

  if (!hero) {
    return null;
  }

  await hero.destroy(); 
  return hero;
};