import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../../app.js";

vi.mock("../../../../controllers/auth.controller.js", () => ({
  signup: vi.fn((req, res) =>
    res.status(201).json("User created successfully!"),
  ),
  signin: vi.fn(),
  google: vi.fn(),
  signOut: vi.fn(),
}));

import { signup } from "../../../../controllers/auth.controller.js";

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signup.mockImplementation((req, res) =>
      res.status(201).json("User created successfully!"),
    );
  });

  it("should return 201 on successful signup", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toBe("User created successfully!");
  });

  it("should call signup controller once", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(signup).toHaveBeenCalledTimes(1);
  });

  it("should accept JSON body", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Content-Type", "application/json")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
  });

  it("should return 500 when controller throws an error", async () => {
    signup.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: "DB error", status: 500 }),
    );

    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(res.status).toBe(500);
  });

  it("should return 409 when user already exists", async () => {
    signup.mockImplementation((req, res, next) =>
      next({ statusCode: 409, message: "User already exists", status: 409 }),
    );

    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });

    expect(res.status).toBe(409);
  });

  it("should not be reachable with GET method", async () => {
    const res = await request(app).get("/api/auth/signup");
    expect(res.status).toBe(404);
  });
});
