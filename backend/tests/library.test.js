import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { ROLES, loginAs } from "./helpers/fixtures.js";

const LibraryDocument = require("../../src/models/libraryDocument.model");
const ProjectFile = require("../../src/models/projectFile.model");
const { PLACES, PLACE_GROUPS, PLACE_KEYS } = require("../../src/config/places");
const libraryService = require("../../src/services/library.service");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const libraryDir = () => path.join(process.env.UPLOADS_DIR, "library");
const filesOnDisk = () => (fs.existsSync(libraryDir()) ? fs.readdirSync(libraryDir()).sort() : []);

const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
const PDF_2 = Buffer.concat([PDF, Buffer.from("% version 2\n")]);
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(60, 1)]);

const MANAGERS = ["admin", "environmental_specialist"];
const NOT_MANAGERS = ROLES.filter((role) => !MANAGERS.includes(role));

const create = (token, { fields = {}, name = "guide.pdf", data = PDF } = {}) => {
  const req = request(app).post("/api/v1/library").set(auth(token));
  Object.entries({ title: "Guide", ...fields }).forEach(([key, value]) => req.field(key, value));
  return name === null ? req : req.attach("file", data, name);
};

const binary = (req) =>
  req.buffer(true).parse((response, done) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => done(null, Buffer.concat(chunks)));
  });

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.MAX_UPLOAD_MB;
});

describe("places registry (D64 a)", () => {
  it("GET /lookups returns the places and their groups", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app).get("/api/v1/lookups").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.places).toEqual(PLACES);
    expect(res.body.data.place_groups).toEqual(PLACE_GROUPS);
  });

  it("has the 2 v2 groups and the locked v3 places, each with key, label, group, scope", () => {
    expect(PLACES.map((p) => [p.key, p.group, p.scope, p.locked])).toEqual([
      ["screening", "project_workflow", "project", false],
      ["assessment", "project_workflow", "project", false],
      ["management", "project_workflow", "project", false],
      ["mitigation", "project_workflow", "project", false],
      ["monitoring", "project_workflow", "project", false],
      ["semp_plan", "project_support", "project", true],
      ["stakeholder_awareness", "project_support", "project", true],
      ["ghg_emissions", "organization", "organization", true],
      ["environmental_data", "organization", "organization", true],
    ]);
    const groups = PLACE_GROUPS.map((g) => g.key);
    PLACES.forEach((place) => {
      expect(place.label).toEqual(expect.any(String));
      expect(groups).toContain(place.group);
    });
    expect(new Set(PLACE_KEYS).size).toBe(PLACES.length);
  });
});

describe("POST /library (D64 b)", () => {
  it.each(MANAGERS)("%s uploads a PDF linked to places", async (role) => {
    const { user, token } = await loginAs(role);

    const res = await create(token, {
      name: "Annex 1 — Climate change resilience examples.pdf",
      fields: {
        title: "Annex 1 — Climate change resilience examples",
        description: "Examples per sector",
        places: "mitigation,management",
        order: "1",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: "Annex 1 — Climate change resilience examples",
      description: "Examples per sector",
      places: ["mitigation", "management"],
      order: 1,
      original_name: "Annex 1 — Climate change resilience examples.pdf",
      mime_type: "application/pdf",
      size: PDF.length,
      uploaded_by: { _id: user._id.toString(), name: user.name },
      updated_by: null,
    });
    expect(res.body.data.stored_name).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(filesOnDisk()).toEqual([res.body.data.stored_name]);
    expect(fs.readFileSync(path.join(libraryDir(), res.body.data.stored_name))).toEqual(PDF);
  });

  it.each(NOT_MANAGERS)("%s → 403 and nothing is written", async (role) => {
    const { token } = await loginAs(role);
    expect((await create(token)).status).toBe(403);
    expect(await LibraryDocument.countDocuments()).toBe(0);
    expect(filesOnDisk()).toEqual([]);
  });

  it("no places = general (Library page only); places may also be sent one field each", async () => {
    const { token } = await loginAs("admin");
    const general = await create(token, { fields: { places: "" } });
    expect(general.body.data.places).toEqual([]);
    const missing = await create(token);
    expect(missing.body.data.places).toEqual([]);

    const repeated = await request(app)
      .post("/api/v1/library")
      .set(auth(token))
      .field("title", "Two")
      .field("places", "screening")
      .field("places", "monitoring")
      .attach("file", PDF, "two.pdf");
    expect(repeated.status).toBe(201);
    expect(repeated.body.data.places).toEqual(["screening", "monitoring"]);
  });

  it("accepts locked (v3) and organisation places", async () => {
    const { token } = await loginAs("admin");
    const res = await create(token, {
      fields: { places: "semp_plan,stakeholder_awareness,ghg_emissions,environmental_data" },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.places).toHaveLength(4);
  });

  it.each([
    ["an unknown place", { places: "mitigation,annex_a" }, /Unknown place: annex_a/],
    ["a place listed twice", { places: "mitigation,mitigation" }, /twice/],
    ["no title", { title: "" }, /title/],
    ["a negative order", { order: "-1" }, /order/],
    ["a title over 200 characters", { title: "x".repeat(201) }, /title/],
  ])("400 on %s, nothing written", async (_label, fields, message) => {
    const { token } = await loginAs("admin");
    const res = await create(token, { fields });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(filesOnDisk()).toEqual([]);
  });

  it("takes a long description (multipart field up to 16 KB, 2000 characters)", async () => {
    const { token } = await loginAs("admin");
    const ok = await create(token, { fields: { description: "d".repeat(2000) } });
    expect(ok.status).toBe(201);
    const tooLong = await create(token, { fields: { description: "d".repeat(2001) } });
    expect(tooLong.status).toBe(400);
  });

  it.each([
    ["plan.docx", DOCX, /File type not allowed. Allowed: \.pdf$/],
    ["no-extension", PDF, /File type not allowed/],
    ["fake.pdf", Buffer.from("<html>not a pdf</html>"), /does not match/],
    ["empty.pdf", Buffer.alloc(0), /empty/],
  ])("PDF only, by extension and first bytes (%s → 400)", async (name, data, message) => {
    const { token } = await loginAs("admin");
    const res = await create(token, { name, data });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(filesOnDisk()).toEqual([]);
  });

  it("400 without a file, 413 over the size limit of project files", async () => {
    const { token } = await loginAs("admin");
    expect((await create(token, { name: null })).status).toBe(400);
    process.env.MAX_UPLOAD_MB = String(100 / 1024 / 1024);
    const big = await create(token, { data: Buffer.concat([PDF, Buffer.alloc(100)]) });
    expect(big.status).toBe(413);
    expect(await LibraryDocument.countDocuments()).toBe(0);
  });

  it("removes the written file when the row cannot be saved", async () => {
    const { token } = await loginAs("admin");
    vi.spyOn(LibraryDocument, "create").mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await create(token)).status).toBe(500);
    expect(filesOnDisk()).toEqual([]);
  });

  it("library files are kept apart from project folders", async () => {
    const { token } = await loginAs("admin");
    await create(token);
    expect(fs.readdirSync(process.env.UPLOADS_DIR)).toEqual(["library"]);
    expect(await ProjectFile.countDocuments()).toBe(0);
  });
});

describe("GET /library", () => {
  async function seed(token) {
    await create(token, { fields: { title: "beta", places: "mitigation", order: "1" } });
    await create(token, { fields: { title: "Alpha", places: "mitigation,screening", order: "1" } });
    await create(token, {
      fields: { title: "Zulu", description: "Climate examples", places: "", order: "0" },
    });
    await create(token, { fields: { title: "GHG factors", places: "ghg_emissions", order: "5" } });
  }

  it("every role lists every document, ordered by order then title", async () => {
    const admin = await loginAs("admin");
    await seed(admin.token);

    for (const role of ROLES) {
      const { token } = await loginAs(role, { email: `${role}.list@example.com` });
      const res = await request(app).get("/api/v1/library").set(auth(token));
      expect(res.status).toBe(200);
      expect(res.body.data.map((d) => d.title)).toEqual(["Zulu", "Alpha", "beta", "GHG factors"]);
    }
  });

  it("?place= lists the documents linked to that place only", async () => {
    const { token } = await loginAs("viewer");
    const admin = await loginAs("admin");
    await seed(admin.token);

    const titles = async (query) =>
      (await request(app).get(`/api/v1/library${query}`).set(auth(token))).body.data.map(
        (d) => d.title
      );

    expect(await titles("?place=mitigation")).toEqual(["Alpha", "beta"]);
    expect(await titles("?place=screening")).toEqual(["Alpha"]);
    expect(await titles("?place=ghg_emissions")).toEqual(["GHG factors"]);
    expect(await titles("?place=monitoring")).toEqual([]);
  });

  it("?search= matches title or description, case-insensitive, as plain text", async () => {
    const { token } = await loginAs("viewer");
    const admin = await loginAs("admin");
    await seed(admin.token);
    const titles = async (query) =>
      (await request(app).get(`/api/v1/library${query}`).set(auth(token))).body.data.map(
        (d) => d.title
      );

    expect(await titles("?search=CLIMATE")).toEqual(["Zulu"]);
    expect(await titles("?search=alp&place=mitigation")).toEqual(["Alpha"]);
    expect(await titles("?search=.*")).toEqual([]);
  });

  it("400 on an unknown place", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app).get("/api/v1/library?place=annex_a").set(auth(token));
    expect(res.status).toBe(400);
  });

  it("needs a token (401)", async () => {
    expect((await request(app).get("/api/v1/library")).status).toBe(401);
  });
});

describe("GET /library/:id/file", () => {
  it("sends the PDF with a UTF-8 name, never cached, to any role", async () => {
    const admin = await loginAs("admin");
    const { body } = await create(admin.token, { name: "دليل.pdf" });
    const viewer = await loginAs("viewer");

    const res = await binary(
      request(app).get(`/api/v1/library/${body.data._id}/file`).set(auth(viewer.token))
    );

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain(
      `filename*=UTF-8''${encodeURIComponent("دليل.pdf")}`
    );
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.body).toEqual(PDF);
  });

  it("401 without a token; 404 for an unknown or bad id or a file gone from disk", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    expect((await request(app).get(`/api/v1/library/${body.data._id}/file`)).status).toBe(401);
    fs.rmSync(path.join(libraryDir(), body.data.stored_name));
    for (const id of ["64b000000000000000000000", "not-an-id", body.data._id]) {
      const res = await request(app).get(`/api/v1/library/${id}/file`).set(auth(token));
      expect(res.status).toBe(404);
    }
  });

  it("a stored name that escapes the uploads folder is never served or deleted", async () => {
    const { user, token } = await loginAs("admin");
    const { insertedId } = await LibraryDocument.collection.insertOne({
      title: "Tampered",
      places: [],
      original_name: "x.pdf",
      stored_name: "../../outside.pdf",
      mime_type: "application/pdf",
      size: 1,
      uploaded_by: user._id,
    });
    const get = await request(app).get(`/api/v1/library/${insertedId}/file`).set(auth(token));
    const del = await request(app).delete(`/api/v1/library/${insertedId}`).set(auth(token));
    expect([get.status, del.status]).toEqual([404, 404]);
    expect(await LibraryDocument.exists({ _id: insertedId })).not.toBeNull();
  });
});

describe("PATCH /library/:id", () => {
  it("edits title, description, places and order; the file stays", async () => {
    const admin = await loginAs("admin");
    const { body } = await create(admin.token, { fields: { places: "mitigation" } });
    const specialist = await loginAs("environmental_specialist");

    const res = await request(app)
      .patch(`/api/v1/library/${body.data._id}`)
      .set(auth(specialist.token))
      .send({
        title: "Renamed",
        description: "New text",
        places: ["management", "semp_plan"],
        order: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: "Renamed",
      description: "New text",
      places: ["management", "semp_plan"],
      order: 3,
      stored_name: body.data.stored_name,
      uploaded_by: { name: admin.user.name },
      updated_by: { name: specialist.user.name },
    });
    expect(filesOnDisk()).toEqual([body.data.stored_name]);
  });

  it("places: [] makes it general", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token, { fields: { places: "mitigation" } });
    const res = await request(app)
      .patch(`/api/v1/library/${body.data._id}`)
      .set(auth(token))
      .send({ places: [] });
    expect(res.body.data.places).toEqual([]);
  });

  it.each([
    ["an unknown place", { places: ["tool4"] }],
    ["nothing to change", {}],
    ["an empty title", { title: "" }],
    ["a fractional order", { order: 1.5 }],
  ])("400 on %s", async (_label, send) => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    const res = await request(app)
      .patch(`/api/v1/library/${body.data._id}`)
      .set(auth(token))
      .send(send);
    expect(res.status).toBe(400);
  });

  it("server-owned fields are stripped", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    const res = await request(app)
      .patch(`/api/v1/library/${body.data._id}`)
      .set(auth(token))
      .send({ title: "T", stored_name: "../x.pdf", size: 1, uploaded_by: null });
    expect(res.body.data).toMatchObject({
      title: "T",
      stored_name: body.data.stored_name,
      size: PDF.length,
    });
  });

  it("editors and viewers → 403; unknown id → 404", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    for (const role of NOT_MANAGERS) {
      const other = await loginAs(role, { email: `${role}.patch@example.com` });
      const res = await request(app)
        .patch(`/api/v1/library/${body.data._id}`)
        .set(auth(other.token))
        .send({ title: "No" });
      expect(res.status, role).toBe(403);
    }
    const unknown = await request(app)
      .patch("/api/v1/library/64b000000000000000000000")
      .set(auth(token))
      .send({ title: "No" });
    expect(unknown.status).toBe(404);
    expect((await LibraryDocument.findById(body.data._id)).title).toBe("Guide");
  });
});

describe("PUT /library/:id/file", () => {
  it("replaces the PDF, keeps title and links, removes the old file", async () => {
    const admin = await loginAs("admin");
    const { body } = await create(admin.token, {
      fields: { title: "Annex 1", places: "mitigation,management" },
    });
    const specialist = await loginAs("environmental_specialist");

    const res = await request(app)
      .put(`/api/v1/library/${body.data._id}/file`)
      .set(auth(specialist.token))
      .attach("file", PDF_2, "annex-1-v2.pdf");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      _id: body.data._id,
      title: "Annex 1",
      places: ["mitigation", "management"],
      original_name: "annex-1-v2.pdf",
      size: PDF_2.length,
      uploaded_by: { name: admin.user.name },
      updated_by: { name: specialist.user.name },
    });
    expect(res.body.data.stored_name).not.toBe(body.data.stored_name);
    expect(filesOnDisk()).toEqual([res.body.data.stored_name]);

    const file = await binary(
      request(app).get(`/api/v1/library/${body.data._id}/file`).set(auth(admin.token))
    );
    expect(file.body).toEqual(PDF_2);
  });

  it("refuses a non-PDF and keeps the old file", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    const res = await request(app)
      .put(`/api/v1/library/${body.data._id}/file`)
      .set(auth(token))
      .attach("file", DOCX, "plan.docx");
    expect(res.status).toBe(400);
    expect(filesOnDisk()).toEqual([body.data.stored_name]);
  });

  it("keeps the old file and row when the new row cannot be saved", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    vi.spyOn(LibraryDocument.prototype, "save").mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app)
      .put(`/api/v1/library/${body.data._id}/file`)
      .set(auth(token))
      .attach("file", PDF_2, "v2.pdf");

    expect(res.status).toBe(500);
    expect(filesOnDisk()).toEqual([body.data.stored_name]);
    expect((await LibraryDocument.findById(body.data._id)).original_name).toBe("guide.pdf");
  });

  it("editors and viewers → 403; no file → 400", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    const editor = await loginAs("program_manager");
    const forbidden = await request(app)
      .put(`/api/v1/library/${body.data._id}/file`)
      .set(auth(editor.token))
      .attach("file", PDF_2, "v2.pdf");
    expect(forbidden.status).toBe(403);
    const empty = await request(app)
      .put(`/api/v1/library/${body.data._id}/file`)
      .set(auth(token))
      .field("x", "y");
    expect(empty.status).toBe(400);
    expect(filesOnDisk()).toEqual([body.data.stored_name]);
  });
});

describe("DELETE /library/:id", () => {
  it("removes the row and the file; other documents stay", async () => {
    const { token } = await loginAs("environmental_specialist");
    const keep = await create(token, { fields: { title: "Keep" } });
    const drop = await create(token, { fields: { title: "Drop" } });

    const res = await request(app).delete(`/api/v1/library/${drop.body.data._id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await LibraryDocument.exists({ _id: drop.body.data._id })).toBeNull();
    expect(filesOnDisk()).toEqual([keep.body.data.stored_name]);
  });

  it.each(NOT_MANAGERS)("%s → 403, the document stays", async (role) => {
    const admin = await loginAs("admin");
    const { body } = await create(admin.token);
    const { token } = await loginAs(role);
    expect(
      (await request(app).delete(`/api/v1/library/${body.data._id}`).set(auth(token))).status
    ).toBe(403);
    expect(filesOnDisk()).toHaveLength(1);
  });

  it("still deletes the row when the file is already gone from disk", async () => {
    const { token } = await loginAs("admin");
    const { body } = await create(token);
    fs.rmSync(path.join(libraryDir(), body.data.stored_name));
    const res = await request(app).delete(`/api/v1/library/${body.data._id}`).set(auth(token));
    expect(res.status).toBe(204);
    expect(await LibraryDocument.countDocuments()).toBe(0);
  });
});

describe("removeDocumentsByTitle (demo seed)", () => {
  it("removes the rows and files with that title only", async () => {
    const { token } = await loginAs("admin");
    await create(token, { fields: { title: "[DEMO] Sample guidance" } });
    await create(token, { fields: { title: "[DEMO] Sample guidance" } });
    const kept = await create(token, { fields: { title: "Real" } });

    expect(await libraryService.removeDocumentsByTitle("[DEMO] Sample guidance")).toBe(2);
    expect((await LibraryDocument.find()).map((d) => d.title)).toEqual(["Real"]);
    expect(filesOnDisk()).toEqual([kept.body.data.stored_name]);
  });
});
