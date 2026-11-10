import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

// Phase 8 finding: with UPLOADS_DIR under a folder whose name starts with a dot (a worktree in
// ".claude/", a server path like "/home/esms/.data/uploads"), every download answered 500
// "Forbidden": sendFile checked the dot rule on the whole absolute path.
describe("downloads work when UPLOADS_DIR sits under a dot folder", () => {
  let saved;
  let base;

  beforeEach(() => {
    saved = process.env.UPLOADS_DIR;
    base = fs.mkdtempSync(path.join(os.tmpdir(), "esms-dot-"));
    process.env.UPLOADS_DIR = path.join(base, ".hidden-parent", "uploads");
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
    process.env.UPLOADS_DIR = saved;
  });

  it("project document download answers 200 with the file", async () => {
    const { token } = await loginAs("environmental_focal_point");
    const project = await createProject();
    const uploaded = await request(app)
      .post(`/api/v1/projects/${project._id}/files`)
      .set(auth(token))
      .field("area", "documents")
      .field("category", "screening")
      .attach("file", PDF, "report.pdf");
    expect(uploaded.status).toBe(201);

    const res = await request(app)
      .get(`/api/v1/files/${uploaded.body.data._id}/download`)
      .set(auth(token))
      .buffer(true)
      .parse((r, done) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => done(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    expect(res.body).toEqual(PDF);
  });

  it("library document download answers 200 with the file", async () => {
    const { token } = await loginAs("environmental_specialist");
    const created = await request(app)
      .post("/api/v1/library")
      .set(auth(token))
      .field("title", "Guide")
      .attach("file", PDF, "guide.pdf");
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/v1/library/${created.body.data._id}/file`)
      .set(auth(token))
      .buffer(true)
      .parse((r, done) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => done(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(PDF);
  });
});
