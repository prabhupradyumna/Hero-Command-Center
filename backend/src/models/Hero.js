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

    squad: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    clearanceLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
  },
 
  {
    paranoid: true,
    timestamps: true,
  },
);

Hero.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Hero, { foreignKey: "userId" });

export default Hero;

