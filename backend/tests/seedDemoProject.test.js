import fs from "node:fs";
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
const LibraryDocument = require("../../src/models/libraryDocument.model");
const { samplePdf } = require("../../scripts/lib/samplePdf");

const script = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/seed-demo-project.js"
);
const DEMO_TITLE = "[DEMO] Al-Salam Water Network Rehabilitation";
const DEMO_LIBRARY_TITLE = "[DEMO] Sample guidance";

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
    // A previous demo library document (row + file) and a real one.
    const libraryDir = path.join(process.env.UPLOADS_DIR, "library");
    fs.mkdirSync(libraryDir, { recursive: true });
    const oldStored = "00000000-0000-4000-8000-000000000001.pdf";
    fs.writeFileSync(path.join(libraryDir, oldStored), "%PDF-1.4\n");
    const libraryRow = (title, stored_name) => ({
      title,
      places: ["mitigation"],
      original_name: "a.pdf",
      stored_name,
      mime_type: "application/pdf",
      size: 9,
      uploaded_by: user._id,
    });
    const oldDemoDoc = await LibraryDocument.create(libraryRow(DEMO_LIBRARY_TITLE, oldStored));
    await LibraryDocument.create(libraryRow("Annex 1", "00000000-0000-4000-8000-000000000002.pdf"));

    const result = await run({ API_URL: apiUrl, SEED_EMAIL: user.email, SEED_PASSWORD: password });

    expect(result.status, result.output).toBe(0);
    const demos = await Project.find({ title: DEMO_TITLE });
    expect(demos).toHaveLength(1);
    expect([oldLive._id.toString(), oldArchived._id.toString()]).not.toContain(
      demos[0]._id.toString()
    );
    expect(await Screening.exists({ project: oldLive._id })).toBeNull();
    expect(await Screening.exists({ project: other._id })).not.toBeNull();
    // A dev-script cleanup is not an admin purge or delete: no project entry in the audit log.
    // (The demo users go through the admin endpoints, so their user.* entries are logged.)
    expect(await AuditLog.countDocuments({ action: /^(project|library)\./ })).toBe(0);

    // One generated sample PDF linked to Tool 4 replaces the previous demo copy (D64).
    const demoDocs = await LibraryDocument.find({ title: DEMO_LIBRARY_TITLE });
    expect(demoDocs).toHaveLength(1);
    expect(demoDocs[0]._id.toString()).not.toBe(oldDemoDoc._id.toString());
    expect(demoDocs[0]).toMatchObject({ places: ["mitigation"], mime_type: "application/pdf" });
    expect(await LibraryDocument.exists({ title: "Annex 1" })).not.toBeNull();
    expect(fs.existsSync(path.join(libraryDir, oldStored))).toBe(false);
    const sample = fs.readFileSync(path.join(libraryDir, demoDocs[0].stored_name));
    expect(sample.subarray(0, 5).toString()).toBe("%PDF-");
    expect(await AuditLog.countDocuments({ action: "user.create" })).toBeGreaterThan(0);
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

  it("the sample PDF is well-formed: xref offsets point at each object", () => {
    const pdf = samplePdf("Title (demo)", ["Line one", "Back\\slash"]).toString("latin1");
    const xref = Number(/startxref\n(\d+)/.exec(pdf)[1]);
    expect(pdf.slice(xref, xref + 4)).toBe("xref");
    const offsets = [...pdf.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    expect(offsets).toHaveLength(5);
    offsets.forEach((offset, i) =>
      expect(pdf.slice(offset)).toMatch(new RegExp(`^${i + 1} 0 obj`))
    );
    expect(pdf).toContain("(Title \\(demo\\)) Tj");
    expect(pdf.endsWith("%%EOF\n")).toBe(true);
  });

  it("refuses a seed account that is not an admin", async () => {
    const { user, password } = await createUser("environmental_specialist");

    const result = await run({ API_URL: apiUrl, SEED_EMAIL: user.email, SEED_PASSWORD: password });

    expect(result.status).toBe(1);
    expect(result.output).toMatch(/must be an admin/);
    expect(await User.countDocuments()).toBe(1);
  });
});
