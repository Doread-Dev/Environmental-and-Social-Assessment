import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { ROLES, createUser, loginAs, seedLookups } from "./helpers/fixtures.js";

describe("POST /api/v1/auth/login", () => {
  it("returns the user and a token for valid credentials", async () => {
    const { user, password } = await createUser("program_manager");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email.toUpperCase(), password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.role).toBe("program_manager");
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("returns 401 for a wrong password", async () => {
    const { user } = await createUser();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: "Invalid credentials" });
  });

  it("returns 401 for an unknown email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: "Invalid credentials" });
  });

  it("returns 400 when the body fails validation", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("protected routes", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/v1/projects").send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: "Unauthorized" });
  });

  it("accepts a token from loginAs for every role", async () => {
    for (const role of ROLES) {
      const { token } = await loginAs(role);
      const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
      expect(res.status, role).not.toBe(401);
    }
  });
});

describe("test helpers", () => {
  it("seedLookups fills the lookup collections", async () => {
    await seedLookups();
    const { token } = await loginAs("viewer");

    const res = await request(app).get("/api/v1/lookups").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.impact_categories.length).toBeGreaterThan(0);
  });
});
