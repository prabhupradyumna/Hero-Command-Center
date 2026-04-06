import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-jwt-secret";

// Generate a valid token for protected route testing
const adminToken = jwt.sign({ userId: 1, role: "admin" }, "test-jwt-secret", {
  expiresIn: "1h",
});

// Mock DB
jest.unstable_mockModule("../src/config/db.js", () => ({
  default: {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    define: jest.fn().mockReturnValue({}),
  },
}));

const mockHero = {
  id: 1,
  name: "Steve Rogers",
  power: "Super Strength",
  city: "New York",
  userId: 1,
  clearanceLevel: 1,
  isActive: true,
  deletedAt: null,
  destroy: jest.fn().mockResolvedValue(),
  restore: jest.fn().mockResolvedValue(),
  save: jest.fn().mockResolvedValue(),
};

jest.unstable_mockModule("../src/models/Hero.js", () => ({
  default: {
    belongsTo: jest.fn(),
    belongsToMany: jest.fn(),
    create: jest.fn().mockResolvedValue(mockHero),
    findByPk: jest.fn().mockResolvedValue(mockHero),
    findOne: jest.fn().mockResolvedValue(mockHero),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [mockHero] }),
  },
}));

jest.unstable_mockModule("../src/models/user.model.js", () => ({
  default: {
    hasMany: jest.fn(),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      email: "tony@shield.com",
      role: "admin",
    }),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      email: "tony@shield.com",
      role: "admin",
    }),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Mission.js", () => ({
  default: { belongsToMany: jest.fn() },
}));

jest.unstable_mockModule("../src/models/index.js", () => ({
  Hero: {
    belongsToMany: jest.fn(),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [mockHero] }),
  },
  Mission: { belongsToMany: jest.fn() },
  User: {},
}));

const { default: app } = await import("../src/app.js");
const { default: request } = await import("supertest");
const { default: HeroModel } = await import("../src/models/Hero.js");

describe("GET /api/heroes", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/heroes");
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with paginated heroes for authenticated user", async () => {
    const res = await request(app)
      .get("/api/heroes?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.heroes).toBeDefined();
    expect(res.body.totalHeroes).toBeDefined();
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPages).toBeDefined();
  });
});

describe("POST /api/heroes", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app)
      .post("/api/heroes")
      .send({ name: "Bruce Wayne", power: "Wealth", city: "Gotham" });

    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/heroes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Bruce Wayne" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 201 when hero is recruited successfully", async () => {
    HeroModel.create.mockResolvedValue(mockHero);

    const res = await request(app)
      .post("/api/heroes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Steve Rogers", power: "Super Strength", city: "New York" });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Steve Rogers");
  });
});

describe("DELETE /api/heroes/:id", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).delete("/api/heroes/1");
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 when hero is retired successfully", async () => {
    HeroModel.findByPk.mockResolvedValue(mockHero);

    const res = await request(app)
      .delete("/api/heroes/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Hero retired successfully");
  });
});

describe("PATCH /api/heroes/:id/restore", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).patch("/api/heroes/1/restore");
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when hero is already active", async () => {
    HeroModel.findOne.mockResolvedValue({ ...mockHero, deletedAt: null });

    const res = await request(app)
      .patch("/api/heroes/1/restore")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Hero is already active");
  });
});
