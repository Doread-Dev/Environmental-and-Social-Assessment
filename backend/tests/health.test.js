import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";

describe("GET /health", () => {
  it("returns 200 with a success payload", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Server is running" });
  });
});

describe("unknown routes", () => {
  it("returns 404 with the standard error shape", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Route not found" });
  });
});
