import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Check if user still exists in DB
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Attach full user object
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid or Expired token" });
  }
};
