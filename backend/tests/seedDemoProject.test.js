import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, require } from "./helpers/app.js";
import { createProject, createUser, seedLookups } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const AuditLog = require("../../src/models/auditLog.model");

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
    const { user, password } = await createUser("environmental_specialist");
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
});
