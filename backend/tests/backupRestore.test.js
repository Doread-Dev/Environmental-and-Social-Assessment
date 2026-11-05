// Backup and restore (phase 11, D75 3), with the real MongoDB Database Tools: a backup of the test
// database and its uploads restores into an empty database with the same counts and the same
// files. Skipped when mongodump is not installed (MONGODB_TOOLS_DIR or the PATH); the replica-set
// CI job installs the tools, so it runs there. deploy/*/test-backup-restore.* run the same check
// on a server.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const ops = require("../../scripts/lib/ops");

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
const toolsInstalled =
  spawnSync(ops.toolPath("mongodump"), ["--version"], { encoding: "utf8" }).status === 0;

const RESTORE_DB = "esms_restore_check_test";
const restoreUri = () => ops.withDatabase(process.env.MONGODB_URI, RESTORE_DB);

const temp = [];
const tempDir = (name) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `esms-${name}-`));
  temp.push(dir);
  return dir;
};

const run = (script, args, env = {}) =>
  spawnSync(process.execPath, [path.join(backend, "scripts", script), ...args], {
    cwd: backend,
    env: { ...process.env, NODE_ENV: "test", ...env },
    encoding: "utf8",
    timeout: 120000,
  });

afterEach(async () => {
  for (const dir of temp.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  await mongoose.connection.useDb(RESTORE_DB).dropDatabase();
});

describe("scripts/backup.js and scripts/restore.js", () => {
  it("refuses to back up without BACKUP_DIR", () => {
    const result = run("backup.js", [], { BACKUP_DIR: "" });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/BACKUP_DIR is not set/);
  });

  it("refuses a BACKUP_DIR inside the uploads folder", () => {
    const result = run("backup.js", [], {
      BACKUP_DIR: path.join(process.env.UPLOADS_DIR, "backups"),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/must not be inside UPLOADS_DIR/);
  });

  it("restore refuses a folder that is not a finished backup", () => {
    const result = run("restore.js", ["--from", tempDir("not-a-backup"), "--yes"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not a finished backup/);
  });

  it.skipIf(!toolsInstalled)(
    "a backup restores into an empty database with the same counts and files",
    async () => {
      // Data in every kind of collection the app has, files on disk and an audit entry.
      const { token } = await loginAs("admin");
      const project = await createProject({ stage: "semp_complete", title: "مشروع المياه" });
      const upload = await request(app)
        .post(`/api/v1/projects/${project._id}/files`)
        .set("Authorization", `Bearer ${token}`)
        .field("area", "documents")
        .field("category", "screening")
        .attach("file", PDF, "تقرير.pdf");
      expect(upload.status).toBe(201);
      const library = await request(app)
        .post("/api/v1/library")
        .set("Authorization", `Bearer ${token}`)
        .field("title", "Annex 1")
        .attach("file", PDF, "annex.pdf");
      expect(library.status).toBe(201);
      await request(app)
        .patch(`/api/v1/projects/${project._id}/archive`)
        .set("Authorization", `Bearer ${token}`);

      const backupDir = tempDir("backups");
      const dumped = run("backup.js", ["--allow-same-disk"], { BACKUP_DIR: backupDir });
      expect(dumped.stderr).toBe("");
      expect(dumped.status).toBe(0);
      const [name] = fs.readdirSync(backupDir);
      expect(name).toMatch(/^esms-\d{8}-\d{6}Z$/);
      const folder = path.join(backupDir, name);
      const manifest = JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"), "utf8"));

      const source = await ops.countCollections(mongoose.connection.db);
      expect(manifest.collections).toEqual(source);
      expect(manifest.counts_exact).toBe(true);
      expect(source.auditlogs).toBe(1);
      expect(source.projectfiles).toBe(1);
      expect(source.librarydocuments).toBe(1);
      expect(manifest.uploads.files).toBe(2);

      const uploadsDir = path.join(tempDir("restored"), "uploads");
      const restored = run("restore.js", [
        "--from",
        folder,
        "--target-uri",
        restoreUri(),
        "--uploads-dir",
        uploadsDir,
        "--yes",
        "--strict",
      ]);
      expect(restored.stderr).toBe("");
      expect(restored.status).toBe(0);
      expect(restored.stdout).toMatch(/every count matches/);

      const target = mongoose.connection.useDb(RESTORE_DB, { useCache: false });
      expect(await ops.countCollections(target.db)).toEqual(source);
      expect(ops.listFiles(uploadsDir, { hash: true })).toEqual(
        ops.listFiles(process.env.UPLOADS_DIR, { hash: true })
      );
    }
  );
});
