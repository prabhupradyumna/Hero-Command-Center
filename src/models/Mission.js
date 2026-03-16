import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const Mission = sequelize.define(
  "Mission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    threatLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    status: {
      type: DataTypes.ENUM("planned", "active", "completed", "failed"),
      defaultValue: "planned",
    },
    document: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Mission;