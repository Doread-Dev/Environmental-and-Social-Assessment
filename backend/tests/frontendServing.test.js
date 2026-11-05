import { describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const createApp = require("../../src/createApp");
const { serveFrontend, LONG_CACHE, NO_CACHE } = require("../../src/middlewares/frontend");

// tests/setup/env.js points FRONTEND_DIST at tests/fixtures/frontend-dist (a stand-in build).
describe("Express serves the built frontend (D38)", () => {
  it.each(["/", "/projects", "/projects/65f0c0ffee0000000000abcd/screening", "/login"])(
    "GET %s → index.html, never cached",
    async (url) => {
      const res = await request(app).get(url);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.text).toContain("ESMS test build");
      expect(res.headers["cache-control"]).toBe(NO_CACHE);
    }
  );

  it("hashed assets get the long cache header", async () => {
    const res = await request(app).get("/assets/index-abc123.js");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/javascript/);
    expect(res.headers["cache-control"]).toBe(LONG_CACHE);
    expect(LONG_CACHE).toBe("public, max-age=31536000, immutable");
  });

  it("other files of the build (theme-init.js) are revalidated, not long-cached", async () => {
    const res = await request(app).get("/theme-init.js");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe(NO_CACHE);
  });

  it("a missing file is a 404, never index.html", async () => {
    for (const url of ["/assets/missing-000.js", "/favicon.ico", "/robots.txt"]) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(404);
      expect(res.body).toEqual({ success: false, error: "Route not found" });
    }
  });

  it("a non-GET request to an app path is not answered with index.html", async () => {
    const res = await request(app).post("/projects");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Route not found" });
  });

  it("/health is unchanged", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Server is running" });
  });

  it("an unknown /api/v1 path is still 401 without a token and 404 with one, never index.html", async () => {
    const anonymous = await request(app).get("/api/v1/does-not-exist");
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers["content-type"]).toMatch(/json/);

    const { token } = await loginAs("viewer");
    const signedIn = await request(app)
      .get("/api/v1/does-not-exist")
      .set("Authorization", `Bearer ${token}`);
    expect(signedIn.status).toBe(404);
    expect(signedIn.body).toEqual({ success: false, error: "Route not found" });

    for (const url of ["/api", "/api/", "/api/v2/projects"]) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(404);
      expect(res.text, url).not.toContain("ESMS test build");
    }
  });

  it("/api/v1 routes still answer JSON", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("serves nothing when the folder has no build (development, Vercel)", async () => {
    expect(serveFrontend(path.join(os.tmpdir(), "esms-no-build-here"))).toBeNull();
    const noBuild = createApp({
      ...process.env,
      FRONTEND_DIST: path.join(os.tmpdir(), "esms-no-build-here"),
    });
    const res = await request(noBuild).get("/projects");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Route not found" });
  });
});
