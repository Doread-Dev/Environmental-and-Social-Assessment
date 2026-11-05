// The file module's failure paths and the SEMP Plan §7 path that v3 will open (D47, D48).
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const fsPromises = require("fs/promises");
const ProjectFile = require("../../src/models/projectFile.model");
const files = require("../../src/config/files");
const fileService = require("../../src/services/projectFile.service");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const PDF = Buffer.from("%PDF-1.7\n%%EOF\n");
const pdfUpload = (name = "a.pdf") => ({
  originalname: name,
  size: PDF.length,
  buffer: PDF,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("upload parsing errors", () => {
  it("400 on a malformed multipart body", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject();
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/files`)
      .set(auth(token))
      .set("Content-Type", "multipart/form-data; boundary=xyz")
      .send('--xyz\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n\r\n%PDF');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid upload");
  });

  it("400 with too many fields", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject();
    const req = request(app).post(`/api/v1/projects/${project._id}/files`).set(auth(token));
    for (let i = 0; i < 11; i += 1) req.field(`f${i}`, "x");
    const res = await req.attach("file", PDF, "a.pdf");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/field/i);
  });
});

describe("config", () => {
  it("defaults to backend/uploads and 10 MB", () => {
    const saved = process.env.UPLOADS_DIR;
    delete process.env.UPLOADS_DIR;
    try {
      expect(files.uploadsDir()).toBe(path.resolve(import.meta.dirname, "..", "uploads"));
    } finally {
      process.env.UPLOADS_DIR = saved;
    }
    expect(files.maxUploadBytes()).toBe(10 * 1024 * 1024);
    expect(files.maxUploadLabel()).toBe("10 MB");
  });
});

describe("disk failures never leave a broken state", () => {
  it("removes the written file when the row cannot be saved", async () => {
    const { user } = await loginAs("admin");
    const project = await createProject();
    vi.spyOn(ProjectFile, "create").mockRejectedValueOnce(new Error("db down"));

    await expect(
      fileService.uploadFile(
        project._id,
        { area: "documents", category: "screening" },
        pdfUpload(),
        user._id
      )
    ).rejects.toThrow("db down");
    expect(fs.readdirSync(path.join(process.env.UPLOADS_DIR, String(project._id)))).toEqual([]);
  });

  it("a failed unlink on delete is logged; the row is still gone", async () => {
    const { user } = await loginAs("admin");
    const project = await createProject();
    const file = await fileService.uploadFile(
      project._id,
      { area: "documents", category: "screening" },
      pdfUpload(),
      user._id
    );
    vi.spyOn(fsPromises, "rm").mockRejectedValueOnce(new Error("busy"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await fileService.deleteFile(file._id, user);

    expect(await ProjectFile.exists({ _id: file._id })).toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Could not remove file"), "busy");
  });

  it("a failed folder removal after a project delete is logged, never thrown", async () => {
    const project = await createProject();
    vi.spyOn(fsPromises, "rm").mockRejectedValueOnce(new Error("busy"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(fileService.removeProjectFolder(project._id)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Could not remove files"), "busy");
  });

  it("a stored name that escapes the uploads folder is never served", async () => {
    const { user, token } = await loginAs("admin");
    const project = await createProject();
    // Written around the model's validation, as if the database had been tampered with.
    const { insertedId } = await ProjectFile.collection.insertOne({
      project: project._id,
      area: "documents",
      category: "screening",
      original_name: "x.pdf",
      stored_name: "../../../outside.pdf",
      mime_type: "application/pdf",
      size: 1,
      uploaded_by: user._id,
    });
    const res = await request(app).get(`/api/v1/files/${insertedId}/download`).set(auth(token));
    expect(res.status).toBe(404);
  });

  it("a stored path that cannot be sent is an error, not a 200", async () => {
    const { user, token } = await loginAs("admin");
    const project = await createProject();
    const file = await fileService.uploadFile(
      project._id,
      { area: "documents", category: "screening" },
      pdfUpload(),
      user._id
    );
    const stored = path.join(process.env.UPLOADS_DIR, String(project._id), file.stored_name);
    fs.rmSync(stored);
    fs.mkdirSync(stored);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).get(`/api/v1/files/${file._id}/download`).set(auth(token));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("SEMP Plan §7 records once v3 opens the area", () => {
  const open = () => files.OPEN_AREAS.push("semp_record");
  afterEach(() => {
    files.OPEN_AREAS.splice(files.OPEN_AREAS.indexOf("semp_record"), 1);
  });

  it("uploads uncategorised, lists by area and re-categorises", async () => {
    open();
    const { token } = await loginAs("admin");
    const project = await createProject();

    const created = await request(app)
      .post(`/api/v1/projects/${project._id}/files`)
      .set(auth(token))
      .field("area", "semp_record")
      .field("category", "")
      .attach("file", PDF, "register.pdf");
    expect(created.status).toBe(201);
    expect(created.body.data.category).toBeNull();

    const patched = await request(app)
      .patch(`/api/v1/files/${created.body.data._id}`)
      .set(auth(token))
      .send({ category: "legal_register" });
    expect(patched.status).toBe(200);
    expect(patched.body.data.category).toBe("legal_register");

    const list = await request(app)
      .get(`/api/v1/projects/${project._id}/files?area=semp_record`)
      .set(auth(token));
    expect(list.body.data.map((file) => file.category)).toEqual(["legal_register"]);
    const documents = await request(app)
      .get(`/api/v1/projects/${project._id}/files?area=documents`)
      .set(auth(token));
    expect(documents.body.data).toEqual([]);
  });

  it("PATCH validates the category and finds unknown files", async () => {
    open();
    const { token } = await loginAs("admin");
    const bad = await request(app)
      .patch("/api/v1/files/64b000000000000000000000")
      .set(auth(token))
      .send({ category: "annex_a" });
    expect(bad.status).toBe(400);
    const missing = await request(app)
      .patch("/api/v1/files/64b000000000000000000000")
      .set(auth(token))
      .send({ category: null });
    expect(missing.status).toBe(404);
  });
});
