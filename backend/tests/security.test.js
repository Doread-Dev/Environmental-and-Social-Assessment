import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";

const createApp = require("../../src/createApp");

const appWith = (env) => createApp({ ...process.env, ...env });

describe("CORS only when FRONTEND_URL is set (D38)", () => {
  it("with FRONTEND_URL: that origin is allowed, preflight included", async () => {
    const withCors = appWith({ FRONTEND_URL: "https://esms.example.com" });

    const res = await request(withCors).get("/health").set("Origin", "https://esms.example.com");
    expect(res.headers["access-control-allow-origin"]).toBe("https://esms.example.com");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");

    const preflight = await request(withCors)
      .options("/api/v1/projects")
      .set("Origin", "https://esms.example.com")
      .set("Access-Control-Request-Method", "PUT");
    expect(preflight.status).toBe(204);
    expect(preflight.headers["access-control-allow-methods"]).toContain("PUT");
  });

  it("without FRONTEND_URL: no CORS headers at all (same origin on the server)", async () => {
    const noCors = appWith({ FRONTEND_URL: "" });

    const res = await request(noCors).get("/health").set("Origin", "https://evil.example.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();

    const preflight = await request(noCors)
      .options("/api/v1/projects")
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "PUT");
    expect(preflight.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("an unset FRONTEND_URL behaves like an empty one", async () => {
    const env = { ...process.env };
    delete env.FRONTEND_URL;
    const res = await request(createApp(env)).get("/health").set("Origin", "http://x.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

const directives = (header) =>
  Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...values]) => [name, values])
  );

describe("Content-Security-Policy (phase 11)", () => {
  it.each(["/", "/health", "/api/v1/auth/me"])("is sent on %s", async (url) => {
    const res = await request(app).get(url);
    expect(res.headers["content-security-policy"]).toBeDefined();
  });

  it("allows the PDF viewer's blob: iframe and nothing wider", async () => {
    const res = await request(app).get("/");
    const csp = directives(res.headers["content-security-policy"]);

    expect(csp["frame-src"]).toEqual(["blob:"]);
    // Plugins stay off (the viewer uses an iframe, not <object>).
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["script-src"]).toEqual(["'self'"]);
    expect(csp["frame-ancestors"]).toEqual(["'self'"]);
  });

  it("loads nothing from the internet: no https:, no wildcard, no CDN anywhere", async () => {
    const res = await request(app).get("/");
    const header = res.headers["content-security-policy"];

    expect(header).not.toMatch(/https:|http:|\*|googleapis|gstatic/);
    expect(directives(header)["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directives(header)["font-src"]).toEqual(["'self'", "data:"]);
    expect(header).not.toContain("upgrade-insecure-requests");
  });
});
