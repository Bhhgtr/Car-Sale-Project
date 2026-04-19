import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../../app.js";

vi.mock("../../../../controllers/auth.controller.js", () => ({
  signup: vi.fn(),
  signin: vi.fn(),
  google: vi.fn(),
  signOut: vi.fn((req, res) =>
    res
      .clearCookie("access_token")
      .status(200)
      .json("User has been logged out!"),
  ),
}));

import { signOut } from "../../../../controllers/auth.controller.js";

describe("GET /api/auth/signout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.mockImplementation((req, res) =>
      res
        .clearCookie("access_token")
        .status(200)
        .json("User has been logged out!"),
    );
  });

  it("should return 200 on successful signout", async () => {
    const res = await request(app).get("/api/auth/signout");
    expect(res.status).toBe(200);
  });

  it("should return correct logout message", async () => {
    const res = await request(app).get("/api/auth/signout");
    expect(res.body).toBe("User has been logged out!");
  });

  it("should clear the access_token cookie", async () => {
    const res = await request(app).get("/api/auth/signout");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith("access_token=;"))).toBe(true);
  });

  it("should call signOut controller once", async () => {
    await request(app).get("/api/auth/signout");
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("should return 500 if controller throws", async () => {
    signOut.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: "Server error", status: 500 }),
    );

    const res = await request(app).get("/api/auth/signout");
    expect(res.status).toBe(500);
  });

  it("should not be reachable with POST method", async () => {
    const res = await request(app).post("/api/auth/signout");
    expect(res.status).toBe(404);
  });
});
