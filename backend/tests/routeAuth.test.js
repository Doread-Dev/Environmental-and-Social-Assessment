import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app, mongoose, require } from "./helpers/app.js";
import { createUser, loginAs } from "./helpers/fixtures.js";

const apiRouter = require("../../src/routes");
const User = require("../../src/models/user.model");

// Turns Express 4's mount regexp (e.g. /^\/projects\/?(?=\/|$)/i) back into "/projects".
const mountPath = (layer) =>
  layer.regexp.source.replace(/^\^/, "").replace("\\/?(?=\\/|$)", "").replace(/\\\//g, "/");

// Every route registered under /api/v1, read from the real routers.
function listRoutes() {
  const routes = [];
  for (const layer of apiRouter.stack) {
    if (!layer.handle.stack) continue; // router-level middleware such as auth
    const prefix = mountPath(layer);
    for (const sub of layer.handle.stack) {
      if (!sub.route) continue;
      for (const method of Object.keys(sub.route.methods)) {
        routes.push({ method, path: `/api/v1${prefix}${sub.route.path}` });
      }
    }
  }
  return routes;
}

const PUBLIC = new Set(["post /api/v1/auth/login"]);
const someId = new mongoose.Types.ObjectId().toString();
const concrete = (path) => path.replace(":q", "Q1").replace(/:\w+/g, someId);

const routes = listRoutes();
const protectedRoutes = routes.filter((r) => !PUBLIC.has(`${r.method} ${r.path}`));

const send = (route, token) => {
  const req = request(app)[route.method](concrete(route.path));
  if (token) req.set("Authorization", token);
  return req.send({});
};

describe("authentication on every route (D3)", () => {
  it("finds the routers' routes", () => {
    // Guards the walker itself: if it silently found nothing, the tests below would pass.
    expect(routes.length).toBeGreaterThan(40);
    expect(routes).toContainEqual({ method: "patch", path: "/api/v1/screenings/:id/submit" });
    expect(routes).toContainEqual({ method: "put", path: "/api/v1/projects/:id/monitoring" });
  });

  it.each(protectedRoutes.map((r) => [r.method.toUpperCase(), r.path, r]))(
    "%s %s without a token → 401",
    async (_method, _path, route) => {
      const res = await send(route);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ success: false, error: "Unauthorized" });
    }
  );

  it("GET /health stays public", async () => {
    expect((await request(app).get("/health")).status).toBe(200);
  });
});

// Any protected GET works for the token checks below.
const route = { method: "get", path: "/api/v1/projects" };

describe("token checks", () => {
  it("accepts a valid token of an active user", async () => {
    const { token } = await loginAs("viewer");
    expect((await send(route, `Bearer ${token}`)).status).toBe(200);
  });

  it.each([
    ["no Bearer prefix", (t) => t],
    ["malformed token", () => "Bearer not-a-jwt"],
    ["extra parts", (t) => `Bearer ${t} extra`],
  ])("rejects %s with 401", async (_name, header) => {
    const { token } = await loginAs("viewer");
    const res = await send(route, header(token));
    expect(res.status).toBe(401);
  });

  it("rejects an expired token with 401", async () => {
    const { user } = await createUser("viewer");
    const expired = jwt.sign(
      { sub: user._id, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    expect((await send(route, `Bearer ${expired}`)).status).toBe(401);
  });

  it("rejects a token signed with another secret with 401", async () => {
    const { user } = await createUser("viewer");
    const forged = jwt.sign({ sub: user._id }, "some-other-secret-that-is-long-enough!!");
    expect((await send(route, `Bearer ${forged}`)).status).toBe(401);
  });

  it("rejects a token of a user that no longer exists with 401", async () => {
    const { user, token } = await loginAs("viewer");
    await User.deleteOne({ _id: user._id });
    expect((await send(route, `Bearer ${token}`)).status).toBe(401);
  });

  it("returns a bare 500 (no message details, no stack) for unexpected verify errors", async () => {
    const { token } = await loginAs("viewer");
    const { JWT_SECRET, NODE_ENV } = process.env;
    // A missing server key is a server fault, not bad credentials.
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";
    try {
      const res = await send(route, `Bearer ${token}`);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, error: "Server Error" });
    } finally {
      process.env.JWT_SECRET = JWT_SECRET;
      process.env.NODE_ENV = NODE_ENV;
    }
  });
});

describe("deactivated users (D4)", () => {
  it("cannot log in", async () => {
    const { user, password } = await createUser("program_manager", { is_active: false });
    const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, error: "Account is deactivated" });
  });

  it("still get the generic 401 for a wrong password", async () => {
    const { user } = await createUser("program_manager", { is_active: false });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("lose access immediately: an existing token stops working", async () => {
    const { user, token } = await loginAs("program_manager");
    expect((await send(route, `Bearer ${token}`)).status).toBe(200);

    await User.updateOne({ _id: user._id }, { is_active: false });

    expect((await send(route, `Bearer ${token}`)).status).toBe(401);
  });
});
