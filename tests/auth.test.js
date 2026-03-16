import { jest } from "@jest/globals";

// Set test environment variables
process.env.JWT_SECRET = "test-jwt-secret";

// Mock DB
jest.unstable_mockModule("../src/config/db.js", () => ({
  default: {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    define: jest.fn().mockReturnValue({}),
  },
}));

// Mock User model
const mockUser = {
  id: 1,
  name: "Tony Stark",
  email: "tony@shield.com",
  password: "$2b$10$hashedpassword",
  role: "admin",
};

jest.unstable_mockModule("../src/models/user.model.js", () => ({
  default: {
    hasMany: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Hero.js", () => ({
  default: {
    belongsTo: jest.fn(),
    belongsToMany: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Mission.js", () => ({
  default: { belongsToMany: jest.fn() },
}));

jest.unstable_mockModule("../src/models/index.js", () => ({
  Hero: { belongsToMany: jest.fn() },
  Mission: { belongsToMany: jest.fn() },
  User: {},
}));

// Mock bcrypt
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn().mockResolvedValue("$2b$10$hashedpassword"),
    compare: jest.fn(),
  },
}));

const { default: app } = await import("../src/app.js");
const { default: request } = await import("supertest");
const { default: UserModel } = await import("../src/models/user.model.js");
const { default: bcrypt } = await import("bcrypt");

describe("POST /api/auth/signup", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@test.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 when user already exists", async () => {
    UserModel.findOne.mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/signup").send({
      name: "Tony Stark",
      email: "tony@shield.com",
      password: "ironman123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

  it("returns 201 on successful signup", async () => {
    UserModel.findOne.mockResolvedValue(null);
    UserModel.create.mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/signup").send({
      name: "Tony Stark",
      email: "tony@shield.com",
      password: "ironman123",
      role: "admin",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe("tony@shield.com");
  });
});

describe("POST /api/auth/login", () => {
  it("returns 400 when user is not found", async () => {
    UserModel.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@test.com", password: "wrong" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns 400 when password is incorrect", async () => {
    UserModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "tony@shield.com", password: "wrongpassword" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns 200 with token on successful login", async () => {
    UserModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "tony@shield.com", password: "ironman123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
