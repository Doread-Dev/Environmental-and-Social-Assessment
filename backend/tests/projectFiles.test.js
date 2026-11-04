import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const ProjectFile = require("../../src/models/projectFile.model");
const AuditLog = require("../../src/models/auditLog.model");
const { cleanOriginalName } = require("../../src/services/fileStorage.service");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const uploads = () => process.env.UPLOADS_DIR;
const filesOnDisk = (projectId) => {
  const dir = path.join(uploads(), String(projectId));
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

// Minimal files with the right first bytes for their type.
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(60, 1)]);
const XLS = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.alloc(60, 2),
]);

const upload = (projectId, token, { name = "report.pdf", data = PDF, fields } = {}) => {
  const req = request(app).post(`/api/v1/projects/${projectId}/files`).set(auth(token));
  const sent = fields ?? { area: "documents", category: "screening" };
  Object.entries(sent).forEach(([key, value]) => req.field(key, value));
  return name === null ? req : req.attach("file", data, name);
};

async function setup(role = "environmental_focal_point") {
  const { user, token } = await loginAs(role);
  const project = await createProject();
  return { user, token, project };
}

afterEach(() => {
  delete process.env.MAX_UPLOAD_MB;
});

describe("POST /projects/:id/files (D47)", () => {
  it("stores a project document under a server-generated name and returns its row", async () => {
    const { user, token, project } = await setup();

    const res = await upload(project._id, token, { name: "Policy.pdf" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      project: project._id.toString(),
      area: "documents",
      category: "screening",
      original_name: "Policy.pdf",
      mime_type: "application/pdf",
      size: PDF.length,
      uploaded_by: { _id: user._id.toString(), name: user.name },
    });
    const stored = res.body.data.stored_name;
    expect(stored).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(filesOnDisk(project._id)).toEqual([stored]);
    expect(fs.readFileSync(path.join(uploads(), String(project._id), stored))).toEqual(PDF);
  });

  it.each([
    ["Plan.docx", DOCX, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["Budget.XLS", XLS, "application/vnd.ms-excel"],
  ])("accepts Office files (%s)", async (name, data, mime) => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { name, data });
    expect(res.status).toBe(201);
    expect(res.body.data.mime_type).toBe(mime);
    expect(res.body.data.stored_name).toMatch(
      new RegExp(`\\.${name.split(".")[1].toLowerCase()}$`)
    );
  });

  it("keeps an Arabic file name for display", async () => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { name: "تقرير الأثر البيئي.pdf" });
    expect(res.status).toBe(201);
    expect(res.body.data.original_name).toBe("تقرير الأثر البيئي.pdf");
  });

  it.each(["../../../evil.pdf", "..\\..\\evil.pdf", "/etc/evil.pdf", "C:\\Windows\\evil.pdf"])(
    "ignores path tricks in the name (%s)",
    async (name) => {
      const { token, project } = await setup();
      const res = await upload(project._id, token, { name });
      expect(res.status).toBe(201);
      expect(res.body.data.original_name).toBe("evil.pdf");
      expect(filesOnDisk(project._id)).toEqual([res.body.data.stored_name]);
      expect(fs.readdirSync(uploads())).toEqual([String(project._id)]);
    }
  );

  it("rejects a file over the size limit with 413 and writes nothing", async () => {
    process.env.MAX_UPLOAD_MB = String(100 / 1024 / 1024); // 100 bytes
    const { token, project } = await setup();

    const big = Buffer.concat([PDF, Buffer.alloc(100)]);
    const res = await upload(project._id, token, { data: big });

    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/too large/);
    expect(await ProjectFile.countDocuments()).toBe(0);
    expect(filesOnDisk(project._id)).toEqual([]);
  });

  it("accepts a file of exactly the size limit", async () => {
    process.env.MAX_UPLOAD_MB = String(PDF.length / 1024 / 1024);
    const { token, project } = await setup();
    expect((await upload(project._id, token)).status).toBe(201);
  });

  it.each([
    ["malware.exe", Buffer.from("MZ...")],
    ["drawing.svg", Buffer.from("<svg/>")],
    ["photo.png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ["archive.zip", DOCX],
    ["no-extension", PDF],
    ["report.pdf.exe", PDF],
  ])("rejects a type that is not allowed (%s)", async (name, data) => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { name, data });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/File type not allowed/);
    expect(filesOnDisk(project._id)).toEqual([]);
  });

  it.each([
    ["fake.pdf", Buffer.from("<html>not a pdf</html>")],
    ["fake.docx", PDF],
    ["fake.xls", DOCX],
  ])("rejects content that does not match the extension (%s)", async (name, data) => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { name, data });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not match/);
  });

  it("rejects an empty file", async () => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { data: Buffer.alloc(0) });
    expect(res.status).toBe(400);
  });

  it.each(["screening", "assessment", "management", "mitigation", "monitoring", "other"])(
    "accepts the project-workflow place %s as category (D64 d)",
    async (category) => {
      const { token, project } = await setup();
      const res = await upload(project._id, token, { fields: { area: "documents", category } });
      expect(res.status).toBe(201);
      expect(res.body.data.category).toBe(category);
    }
  );

  it.each([
    ["missing category", { area: "documents" }, /category/],
    ["unknown category", { area: "documents", category: "photos" }, /category/],
    ["old annex category", { area: "documents", category: "annex_a" }, /category/],
    ["v3 place", { area: "documents", category: "semp_plan" }, /category/],
    ["organization place", { area: "documents", category: "ghg_emissions" }, /category/],
    ["SEMP category on a document", { area: "documents", category: "legal_register" }, /category/],
    ["missing area", { category: "screening" }, /area/],
    ["old annex area", { area: "annex", category: "annex_a" }, /area/],
    ["unknown area", { area: "photos", category: "screening" }, /area/],
  ])("400 on %s", async (_label, fields, message) => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { fields });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(filesOnDisk(project._id)).toEqual([]);
  });

  it("400 without a file", async () => {
    const { token, project } = await setup();
    const res = await upload(project._id, token, { name: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No file/);
  });

  it("400 with two files", async () => {
    const { token, project } = await setup();
    const res = await upload(project._id, token).attach("file", PDF, "second.pdf");
    expect(res.status).toBe(400);
    expect(await ProjectFile.countDocuments()).toBe(0);
  });

  it("400 for a file in another field", async () => {
    const { token, project } = await setup();
    const res = await request(app)
      .post(`/api/v1/projects/${project._id}/files`)
      .set(auth(token))
      .field("area", "documents")
      .field("category", "screening")
      .attach("document", PDF, "a.pdf");
    expect(res.status).toBe(400);
  });

  it("viewer → 403", async () => {
    const { token, project } = await setup("viewer");
    expect((await upload(project._id, token)).status).toBe(403);
  });

  it("archived project → 409 (read-only)", async () => {
    const { token, project } = await setup();
    await Project.updateOne({ _id: project._id }, { archived: true });
    const res = await upload(project._id, token);
    expect(res.status).toBe(409);
    expect(filesOnDisk(project._id)).toEqual([]);
  });

  it("unknown project → 404", async () => {
    const { token } = await setup();
    expect((await upload("64b000000000000000000000", token)).status).toBe(404);
    expect((await upload("not-an-id", token)).status).toBe(404);
    expect(fs.existsSync(uploads()) ? fs.readdirSync(uploads()) : []).toEqual([]);
  });

  it("does not need any workflow step (Documents are open from the start)", async () => {
    const { token, project } = await setup();
    expect((await upload(project._id, token)).status).toBe(201);
  });
});

describe("GET /projects/:id/files", () => {
  it("lists the project's documents oldest first, for every role", async () => {
    const { token, project } = await setup();
    const other = await createProject();
    await upload(project._id, token, { name: "first.pdf" });
    await upload(project._id, token, {
      name: "second.pdf",
      fields: { area: "documents", category: "other" },
    });
    await upload(other._id, token, { name: "elsewhere.pdf" });

    const viewer = await loginAs("viewer");
    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/files?area=documents`)
      .set(auth(viewer.token));

    expect(res.status).toBe(200);
    expect(res.body.data.map((file) => [file.original_name, file.category])).toEqual([
      ["first.pdf", "screening"],
      ["second.pdf", "other"],
    ]);
    expect(res.body.data[0].uploaded_by).toHaveProperty("name");
  });

  it("defaults to the documents area and answers [] when empty", async () => {
    const { token, project } = await setup();
    const res = await request(app).get(`/api/v1/projects/${project._id}/files`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("400 on an unknown area, 404 on an unknown project", async () => {
    const { token, project } = await setup();
    const bad = await request(app)
      .get(`/api/v1/projects/${project._id}/files?area=photos`)
      .set(auth(token));
    expect(bad.status).toBe(400);
    const missing = await request(app)
      .get("/api/v1/projects/64b000000000000000000000/files")
      .set(auth(token));
    expect(missing.status).toBe(404);
  });

  it("archived projects stay readable", async () => {
    const { token, project } = await setup();
    await upload(project._id, token);
    await Project.updateOne({ _id: project._id }, { archived: true });
    const res = await request(app).get(`/api/v1/projects/${project._id}/files`).set(auth(token));
    expect(res.body.data).toHaveLength(1);
  });
});

describe("GET /files/:fileId/download", () => {
  it("sends the bytes with the stored type and a UTF-8 download name, to any role", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token, { name: "تقرير.pdf" });
    const viewer = await loginAs("viewer");

    const res = await request(app)
      .get(`/api/v1/files/${body.data._id}/download`)
      .set(auth(viewer.token))
      .buffer(true)
      .parse((response, done) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => done(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment;");
    expect(res.headers["content-disposition"]).toContain(
      `filename*=UTF-8''${encodeURIComponent("تقرير.pdf")}`
    );
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.body).toEqual(PDF);
  });

  it("needs a token (401)", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token);
    expect((await request(app).get(`/api/v1/files/${body.data._id}/download`)).status).toBe(401);
  });

  it("404 for an unknown id, a bad id, or a file missing on disk", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token);
    fs.rmSync(path.join(uploads(), String(project._id), body.data.stored_name));

    for (const id of ["64b000000000000000000000", "not-an-id", body.data._id]) {
      const res = await request(app).get(`/api/v1/files/${id}/download`).set(auth(token));
      expect(res.status).toBe(404);
    }
  });
});

describe("DELETE /files/:fileId", () => {
  it("removes the row and the file on disk", async () => {
    const { token, project } = await setup();
    const keep = await upload(project._id, token, { name: "keep.pdf" });
    const drop = await upload(project._id, token, { name: "drop.pdf" });

    const res = await request(app).delete(`/api/v1/files/${drop.body.data._id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await ProjectFile.exists({ _id: drop.body.data._id })).toBeNull();
    expect(filesOnDisk(project._id)).toEqual([keep.body.data.stored_name]);
  });

  it("viewer → 403, archived → 409, unknown → 404; the file stays", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token);
    const url = `/api/v1/files/${body.data._id}`;
    const viewer = await loginAs("viewer");

    expect((await request(app).delete(url).set(auth(viewer.token))).status).toBe(403);
    await Project.updateOne({ _id: project._id }, { archived: true });
    expect((await request(app).delete(url).set(auth(token))).status).toBe(409);
    const unknown = await request(app)
      .delete("/api/v1/files/64b000000000000000000000")
      .set(auth(token));
    expect(unknown.status).toBe(404);

    expect(await ProjectFile.exists({ _id: body.data._id })).not.toBeNull();
    expect(filesOnDisk(project._id)).toHaveLength(1);
  });

  it("still deletes the row when the file is already gone from disk", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token);
    fs.rmSync(path.join(uploads(), String(project._id), body.data.stored_name));
    const res = await request(app).delete(`/api/v1/files/${body.data._id}`).set(auth(token));
    expect(res.status).toBe(204);
    expect(await ProjectFile.countDocuments()).toBe(0);
  });
});

describe("SEMP Plan §7 records are locked until v3 (D48)", () => {
  async function sempRecord(project, user) {
    return ProjectFile.create({
      project: project._id,
      area: "semp_record",
      category: "legal_register",
      original_name: "register.pdf",
      stored_name: "00000000-0000-4000-8000-000000000000.pdf",
      mime_type: "application/pdf",
      size: 10,
      uploaded_by: user._id,
    });
  }

  it("the model accepts the 11 record categories or none", async () => {
    const { user, project } = await setup();
    await expect(sempRecord(project, user)).resolves.toBeTruthy();
    const uncategorised = new ProjectFile({
      project: project._id,
      area: "semp_record",
      category: null,
      original_name: "a.pdf",
      stored_name: "00000000-0000-4000-8000-000000000001.pdf",
      mime_type: "application/pdf",
      size: 1,
      uploaded_by: user._id,
    });
    await expect(uncategorised.validate()).resolves.toBeUndefined();
    uncategorised.category = "screening";
    await expect(uncategorised.validate()).rejects.toThrow(/Invalid category/);
  });

  it("list, upload, download, delete and re-categorise answer 404", async () => {
    const { user, token, project } = await setup("admin");
    const record = await sempRecord(project, user);

    const list = await request(app)
      .get(`/api/v1/projects/${project._id}/files?area=semp_record`)
      .set(auth(token));
    const create = await upload(project._id, token, {
      fields: { area: "semp_record", category: "legal_register" },
    });
    const download = await request(app)
      .get(`/api/v1/files/${record._id}/download`)
      .set(auth(token));
    const remove = await request(app).delete(`/api/v1/files/${record._id}`).set(auth(token));
    const patch = await request(app)
      .patch(`/api/v1/files/${record._id}`)
      .set(auth(token))
      .send({ category: "audit_records" });

    for (const res of [list, create, download, remove, patch]) expect(res.status).toBe(404);
    expect(filesOnDisk(project._id)).toEqual([]);
    expect((await ProjectFile.findById(record._id)).category).toBe("legal_register");
  });

  it("a project document cannot change category (400)", async () => {
    const { token, project } = await setup();
    const { body } = await upload(project._id, token);
    const res = await request(app)
      .patch(`/api/v1/files/${body.data._id}`)
      .set(auth(token))
      .send({ category: "audit_records" });
    expect(res.status).toBe(400);
  });
});

describe("files are removed with their project", () => {
  it("DELETE /projects/:id removes the rows and the folder, other projects keep theirs", async () => {
    const { token, project } = await setup("environmental_specialist");
    const other = await createProject();
    await upload(project._id, token);
    await upload(project._id, token, { name: "two.pdf" });
    const kept = await upload(other._id, token);

    const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await ProjectFile.countDocuments({ project: project._id })).toBe(0);
    expect(fs.existsSync(path.join(uploads(), String(project._id)))).toBe(false);
    expect(filesOnDisk(other._id)).toEqual([kept.body.data.stored_name]);
  });

  it("purge removes them too and records the count in the audit log", async () => {
    const { user, token } = await loginAs("admin");
    const project = await createProject({ stage: "assessment_approved" });
    await upload(project._id, token);
    await Project.updateOne(
      { _id: project._id },
      { archived: true, archived_by: user._id, archived_at: new Date() }
    );

    const res = await request(app).delete(`/api/v1/projects/${project._id}/purge`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await ProjectFile.countDocuments()).toBe(0);
    expect(fs.existsSync(path.join(uploads(), String(project._id)))).toBe(false);
    expect((await AuditLog.findOne({ action: "project.purge" })).snapshot.files).toBe(1);
  });
});

describe("cleanOriginalName", () => {
  it("drops control characters and bounds the length, keeping the extension", () => {
    expect(cleanOriginalName("a\u0000b\u001f.pdf", "pdf")).toBe("ab.pdf");
    const long = cleanOriginalName(`${"x".repeat(500)}.pdf`, "pdf");
    expect(long).toHaveLength(200);
    expect(long.endsWith(".pdf")).toBe(true);
    expect(cleanOriginalName("   ", "pdf")).toBe("file.pdf");
    expect(cleanOriginalName(".pdf", "pdf")).toBe("file.pdf");
  });
});
