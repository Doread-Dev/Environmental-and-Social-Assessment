import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const { version } = createRequire(import.meta.url)("../package.json");

describe("GET /health", () => {
  it("returns 200 with a success payload and the release version (D77)", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Server is running", version });
    expect(version).toBe("2.0.0");
  });
});

describe("unknown routes", () => {
  it("returns 401 without a token, so anonymous callers cannot probe for routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    expect(res.status).toBe(401);
  });

  it("returns 404 with the standard error shape when authenticated", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app)
      .get("/api/v1/does-not-exist")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Route not found" });
  });
});
