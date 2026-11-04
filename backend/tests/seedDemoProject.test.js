import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { ROLES, createProject, createUser, seedLookups } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const AuditLog = require("../../src/models/auditLog.model");
const User = require("../../src/models/user.model");

const script = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/seed-demo-project.js"
);
const DEMO_TITLE = "[DEMO] Al-Salam Water Network Rehabilitation";

// Async spawn: the script calls this test's own server, which spawnSync would block.
function run(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { env: { ...process.env, ...env } });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (status) => resolve({ status, output }));
  });
}

describe("scripts/seed-demo-project.js", () => {
  let server;
  let apiUrl;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    apiUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  it("refuses to run when NODE_ENV=production and touches nothing", async () => {
    await createProject({ title: DEMO_TITLE, stage: "screening_approved" });

    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, NODE_ENV: "production" },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/refuses to run with NODE_ENV=production/);
    expect(await Project.countDocuments({ title: DEMO_TITLE })).toBe(1);
  });

  it("replaces every previous demo copy, archived ones included, and keeps other projects", async () => {
    await seedLookups();
    const { user, password } = await createUser("admin");
    const oldLive = await createProject({ title: DEMO_TITLE, stage: "assessment_approved" });
    const oldArchived = await createProject({ title: DEMO_TITLE, stage: "screening_approved" });
    await Project.updateOne({ _id: oldArchived._id }, { archived: true });
    const other = await createProject({ title: "Real project", stage: "screening_approved" });

    const result = await run({ API_URL: apiUrl, SEED_EMAIL: user.email, SEED_PASSWORD: password });

    expect(result.status, result.output).toBe(0);
    const demos = await Project.find({ title: DEMO_TITLE });
    expect(demos).toHaveLength(1);
    expect([oldLive._id.toString(), oldArchived._id.toString()]).not.toContain(
      demos[0]._id.toString()
    );
    expect(await Screening.exists({ project: oldLive._id })).toBeNull();
    expect(await Screening.exists({ project: other._id })).not.toBeNull();
    // A dev-script cleanup is not an admin purge: nothing in the audit log.
    expect(await AuditLog.countDocuments()).toBe(0);
  }, 60000);

  it("creates an admin and one user per role who can sign in with DEMO_PASSWORD", async () => {
    await seedLookups();
    const { user, password } = await createUser("admin");
    // An earlier run's user, since deactivated and demoted: brought back to its role and active.
    await createUser("viewer", {
      email: "demo.environmental_specialist@example.com",
      is_active: false,
    });
    const DEMO_PASSWORD = "demo-password-1";

    const result = await run({
      API_URL: apiUrl,
      SEED_EMAIL: user.email,
      SEED_PASSWORD: password,
      DEMO_PASSWORD,
    });

    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain(DEMO_PASSWORD);
    for (const role of ROLES) {
      const email = `demo.${role}@example.com`;
      const demo = await User.findOne({ email });
      expect(demo, email).toMatchObject({ role, is_active: true, must_change_password: false });
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: DEMO_PASSWORD });
      expect(res.status, email).toBe(200);
    }
  }, 60000);

  it("refuses a seed account that is not an admin", async () => {
    const { user, password } = await createUser("environmental_specialist");

    const result = await run({ API_URL: apiUrl, SEED_EMAIL: user.email, SEED_PASSWORD: password });

    expect(result.status).toBe(1);
    expect(result.output).toMatch(/must be an admin/);
    expect(await User.countDocuments()).toBe(1);
  });
});
