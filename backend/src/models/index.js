import User from "./user.model.js";
import Hero from "./Hero.js";
import Mission from "./Mission.js";

// Existing relation
Hero.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Hero, { foreignKey: "userId" });

// Many-to-Many relation
Hero.belongsToMany(Mission, {
  through: "MissionAssignments",
  foreignKey: "heroId",
});

Mission.belongsToMany(Hero, {
  through: "MissionAssignments",
  foreignKey: "missionId",
});

export { User, Hero, Mission };