import { jest } from "@jest/globals";

// Mock all DB-touching modules before importing app
jest.unstable_mockModule("../src/config/db.js", () => ({
  default: {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    define: jest.fn().mockReturnValue({}),
  },
}));

jest.unstable_mockModule("../src/models/user.model.js", () => ({
  default: { hasMany: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));

jest.unstable_mockModule("../src/models/Hero.js", () => ({
  default: {
    belongsTo: jest.fn(),
    belongsToMany: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Mission.js", () => ({
  default: { belongsToMany: jest.fn() },
}));

jest.unstable_mockModule("../src/models/index.js", () => ({
  Hero: { belongsToMany: jest.fn(), findAndCountAll: jest.fn() },
  Mission: { belongsToMany: jest.fn(), findAndCountAll: jest.fn() },
  User: {},
}));

const { default: app } = await import("../src/app.js");
const { default: request } = await import("supertest");

describe("Health Check", () => {
  it("GET /health returns 200 and status message", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBeDefined();
  });
});
