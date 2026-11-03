import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createUser } from "./helpers/fixtures.js";

const User = require("../../src/models/user.model");

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts");

// Runs a script against esms_test (process.env.MONGODB_URI is the test DB here).
// stdin is not a TTY, so missing values fail instead of prompting.
function run(script, env, args = []) {
  const result = spawnSync(process.execPath, [path.join(scripts, script), ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    input: "",
  });
  return { ...result, output: result.stdout + result.stderr };
}

const login = (email, password) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

describe("scripts/create-admin.js (D7)", () => {
  const env = {
    ADMIN_NAME: "First Admin",
    ADMIN_EMAIL: "Admin@Example.com",
    ADMIN_PASSWORD: "very-secret-pass",
  };

  it("creates an active admin that can log in, without printing the password", async () => {
    const result = run("create-admin.js", env);

    expect(result.status, result.output).toBe(0);
    expect(result.stdout).toMatch(/Admin created: admin@example\.com/);
    expect(result.output).not.toContain(env.ADMIN_PASSWORD);

    const user = await User.findOne({ email: "admin@example.com" });
    expect(user.role).toBe("admin");
    expect(user.is_active).toBe(true);
    expect(user.password).not.toBe(env.ADMIN_PASSWORD);

    const res = await login("admin@example.com", env.ADMIN_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("refuses an email that is already in use", async () => {
    await createUser("viewer", { email: "admin@example.com" });

    const result = run("create-admin.js", env);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/already exists/);
    expect((await User.findOne({ email: "admin@example.com" })).role).toBe("viewer");
  });

  it("rejects a password that fails the register rules", async () => {
    const result = run("create-admin.js", { ...env, ADMIN_PASSWORD: "123" });

    expect(result.status).toBe(1);
    expect(result.output).not.toContain("Admin created");
    expect(await User.countDocuments()).toBe(0);
  });

  it("fails when a value is missing and there is no terminal to ask", async () => {
    const result = run("create-admin.js", { ...env, ADMIN_PASSWORD: "" });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/ADMIN_PASSWORD is not set/);
  });
});

describe("scripts/reset-password.js (D24)", () => {
  const NEW_PASSWORD = "brand-new-password";

  it("sets a new password without printing it; the old one stops working", async () => {
    const { user, password } = await createUser("admin");

    const result = run("reset-password.js", {
      RESET_EMAIL: user.email.toUpperCase(),
      RESET_PASSWORD: NEW_PASSWORD,
    });

    expect(result.status, result.output).toBe(0);
    expect(result.stdout).toMatch(`Password reset for ${user.email}`);
    expect(result.output).not.toContain(NEW_PASSWORD);
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
    expect((await login(user.email, password)).status).toBe(401);
  });

  it("warns about a deactivated account and leaves it deactivated", async () => {
    const { user } = await createUser("admin", { is_active: false });

    const result = run("reset-password.js", {
      RESET_EMAIL: user.email,
      RESET_PASSWORD: NEW_PASSWORD,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/deactivated/);
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(403);
  });

  it("--activate also reactivates the account", async () => {
    const { user } = await createUser("admin", { is_active: false });

    const result = run(
      "reset-password.js",
      { RESET_EMAIL: user.email, RESET_PASSWORD: NEW_PASSWORD },
      ["--activate"]
    );

    expect(result.status, result.output).toBe(0);
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
  });

  it("fails for an unknown email", async () => {
    const result = run("reset-password.js", {
      RESET_EMAIL: "nobody@example.com",
      RESET_PASSWORD: NEW_PASSWORD,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/No user with email/);
  });

  it("rejects a too-short password and keeps the old one", async () => {
    const { user, password } = await createUser("admin");

    const result = run("reset-password.js", { RESET_EMAIL: user.email, RESET_PASSWORD: "123" });

    expect(result.status).toBe(1);
    expect((await login(user.email, password)).status).toBe(200);
  });
});
