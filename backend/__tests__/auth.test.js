import request from "supertest";

process.env.JWT_SECRET = "test-secret";

const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  name: "Test User",
  email: "test@example.com",
  comparePassword: jest.fn().mockResolvedValue(true),
};

jest.mock("../models/User.js", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import app from "../app.js";
import { User } from "../models/User.js";

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/signup", () => {
    it("returns 400 when name, email or password is missing", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "a@b.com", password: "123456" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("required");
    });

    it("returns 201 and token when signup succeeds", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: mockUser._id,
        name: "New User",
        email: "new@example.com",
      });
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "New User", email: "new@example.com", password: "secret123" });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toMatchObject({ name: "New User", email: "new@example.com" });
    });

    it("returns 409 when email already registered", async () => {
      User.findOne.mockResolvedValue({ email: "existing@example.com" });
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "User", email: "existing@example.com", password: "secret123" });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 when email or password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("required");
    });

    it("returns 401 when user not found", async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: "secret123" });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("returns 200 and token when login succeeds", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(true),
        }),
      });
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "secret123" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toMatchObject({ name: "Test User", email: "test@example.com" });
    });
  });
});
