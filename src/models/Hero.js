import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Hero = sequelize.define(
  "Hero",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.STRING
    },
    clearanceLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    squad: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: "heroes",
    timestamps: true,
    paranoid: true
  }
);

export default Hero;
