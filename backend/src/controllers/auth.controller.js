import bcrypt from "bcrypt";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { validationResult } from "express-validator";
import User from "../models/user.model.js";
import env from "../config/env.js";

const REFRESH_COOKIE_NAME = "hero_refresh_token";

const createAccessToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const createRefreshToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role, type: "refresh" }, env.jwtRefreshSecret || env.jwtSecret, {
    expiresIn: "7d",
  });

const setRefreshTokenCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    path: "/api/auth",
  });
};

const getRefreshTokenFromCookie = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${REFRESH_COOKIE_NAME}=`))
    ?.split("=")[1];
};

// ✅ Signup
export const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ Login
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ Refresh Access Token
export const refreshToken = async (req, res) => {
  try {
    const rawCookie = req.headers.cookie || "";
    const token = getRefreshTokenFromCookie(rawCookie);

    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(token, env.jwtRefreshSecret || env.jwtSecret);

    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      message: "Token refreshed",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// ✅ Get current user from access token
export const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar image is required" });
    }

    if (!req.file.mimetype?.startsWith("image/")) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Only image files are allowed for avatars" });
    }

    const previousAvatar = req.user.avatar;

    const avatarPath = `/uploads/${req.file.filename}`;
    await req.user.update({ avatar: avatarPath });

    if (previousAvatar?.startsWith("/uploads/")) {
      const oldFile = path.join("src/public", previousAvatar.replace(/^\//, ""));
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatar: avatarPath,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: avatarPath,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload avatar" });
  }
};

export const removeMyAvatar = async (req, res) => {
  try {
    const previousAvatar = req.user.avatar;

    await req.user.update({ avatar: null });

    if (previousAvatar?.startsWith("/uploads/")) {
      const oldFile = path.join("src/public", previousAvatar.replace(/^\//, ""));
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }

    return res.status(200).json({
      message: "Avatar removed successfully",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove avatar" });
  }
};

// ✅ Logout
export const logout = async (req, res) => {
  clearRefreshTokenCookie(res);
  return res.status(200).json({ message: "Logged out successfully" });
};
