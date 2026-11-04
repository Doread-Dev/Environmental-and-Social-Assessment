import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { require } from "./helpers/app.js";
import { ROLES } from "./helpers/fixtures.js";
import { listRoutes } from "./helpers/routes.js";

const {
  PERMISSIONS,
  ACTION_PERMISSIONS,
  can,
  permissionsFor,
} = require("../../src/config/permissions");
const { requirePermission } = require("../../src/middlewares/auth");
const { allowedActions, computeWorkflow } = require("../../src/services/workflow.service");

const routes = listRoutes();
const permissionOf = (route) => route.handlers.find((h) => h.permission)?.permission;

// Open to every signed-in user (reads) or handled by the auth router itself.
const OPEN = new Set(["post /auth/login", "put /auth/password"]);

describe("routes name a permission (D66b)", () => {
  it("every write route checks one", () => {
    const writes = routes.filter((r) => r.method !== "get" && !OPEN.has(r.key));
    expect(writes.length).toBeGreaterThan(25);
    expect(writes.filter((r) => !permissionOf(r)).map((r) => r.key)).toEqual([]);
  });

  it("reads are open to every signed-in role, except the audit log", () => {
    const checkedReads = routes.filter((r) => r.method === "get" && permissionOf(r));
    expect(checkedReads.map((r) => [r.key, permissionOf(r)])).toEqual([
      ["get /audit-logs", "read_audit_log"],
    ]);
  });

  it("the route permissions match what the frontend's allowed actions call them", () => {
    const named = Object.fromEntries(routes.map((r) => [r.key, permissionOf(r)]));
    expect(named).toMatchObject({
      "patch /screenings/:id/approve": "screening.approve",
      "patch /assessments/:id/submit": "assessment.submit",
      "put /projects/:id/management": "semp.edit",
      "put /projects/:id/monitoring": "monitoring.edit",
      "post /projects/:id/files": "files.edit",
      "delete /projects/:id/purge": "project.purge",
      "post /users": "manage_users",
    });
  });

  it("no module outside config lists roles", () => {
    const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
    const walk = (dir) =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
          entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
        );
    const importers = walk(src)
      .filter((file) =>
        /require\(["'][./]*(config\/)?roles["']\)/.test(fs.readFileSync(file, "utf8"))
      )
      .map((file) => path.relative(src, file).replace(/\\/g, "/"))
      .sort();
    // The permission map, plus the role enum of the user model and its validator.
    expect(importers).toEqual([
      "config/permissions.js",
      "models/user.model.js",
      "validators/user.validator.js",
    ]);
    // Only config/ mentions the role groups or the old role check.
    const outsideConfig = walk(src)
      .filter((file) => !file.includes(`${path.sep}config${path.sep}`))
      .filter((file) =>
        /requireRole|(EDITOR|SPECIALIST|ADMIN)_ROLES/.test(fs.readFileSync(file, "utf8"))
      )
      .map((file) => path.relative(src, file));
    expect(outsideConfig).toEqual([]);
  });
});

describe("requirePermission (D66b)", () => {
  const run = (middleware, user) => {
    const next = vi.fn();
    middleware({ user }, { locals: {} }, next);
    return next.mock.calls[0][0];
  };

  it("lets a user with the permission through", () => {
    expect(
      run(requirePermission("screening.approve"), { role: "environmental_specialist" })
    ).toBeUndefined();
  });

  it("answers 403 Forbidden without it, 401 without a user", () => {
    expect(run(requirePermission("screening.approve"), { role: "project_manager" })).toMatchObject({
      statusCode: 403,
      message: "Forbidden",
    });
    expect(run(requirePermission("edit"), undefined)).toMatchObject({ statusCode: 401 });
  });

  it("fails at load time for an unknown name", () => {
    expect(() => requirePermission("screening.aprove")).toThrow(/unknown permission/);
    expect(() => can({ role: "admin" }, "nope")).toThrow(/Unknown permission/);
  });
});

describe("the role → permission map (D66b)", () => {
  it("every action permission is granted by a general one", () => {
    Object.values(ACTION_PERMISSIONS).forEach((general) =>
      expect(Object.keys(PERMISSIONS)).toContain(general)
    );
  });

  it("every allowed action has a permission of the same name", () => {
    const steps = { status: "approved" };
    const workflow = computeWorkflow({
      screening: steps,
      assessment: steps,
      activities: [{ activity_description: "x" }],
      plans: [{ output_description: "x" }],
    });
    const actions = new Set([
      ...allowedActions({ role: "admin" }, { archived: false }, workflow),
      ...allowedActions({ role: "admin" }, { archived: true }, workflow),
    ]);
    actions.forEach((name) => expect(() => can({ role: "admin" }, name)).not.toThrow());
  });

  it("permissionsFor takes the user; unknown roles or no user get nothing", () => {
    ROLES.forEach((role) =>
      expect(permissionsFor({ role })).toEqual(
        Object.keys(PERMISSIONS).filter((name) => PERMISSIONS[name].includes(role))
      )
    );
    expect(permissionsFor({ role: "guest" })).toEqual([]);
    expect(permissionsFor(null)).toEqual([]);
    expect(can(null, "edit")).toBe(false);
  });
});
