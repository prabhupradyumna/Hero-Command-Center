import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";

const Hero = sequelize.define(
  "Hero",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    power: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    paranoid: true,
    timestamps: true,
  }
);

// 🔥 Association
Hero.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Hero, { foreignKey: "userId" });

export default Hero;
