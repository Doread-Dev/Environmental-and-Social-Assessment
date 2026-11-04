import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, createUser, loginAs } from "./helpers/fixtures.js";

const AuditLog = require("../../src/models/auditLog.model");
const Project = require("../../src/models/project.model");
const User = require("../../src/models/user.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const ProjectFile = require("../../src/models/projectFile.model");
const apiRouter = require("../../src/routes");
const { AUDIT_ACTIONS } = AuditLog;

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const api = (method, url, token) => request(app)[method](`/api/v1${url}`).set(auth(token));
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

const entries = (filter = {}) => AuditLog.find(filter).lean();
const id = (value) => value?.toString();

afterEach(() => vi.restoreAllMocks());

// The one entry of `action`, checked against who did it, the project and the target.
async function expectOneEntry(action, { by, project, target }) {
  const all = await entries();
  expect(all.map((e) => e.action)).toEqual([action]);
  const [entry] = all;
  expect(entry).toMatchObject({
    action,
    by_name: by.name,
    by_role: by.role,
    project_title: project?.title ?? null,
    target_type: target.type,
    target_label: target.label,
  });
  expect(id(entry.by)).toBe(id(by._id));
  expect(id(entry.project)).toBe(project ? id(project._id) : undefined);
  expect(id(entry.target_id)).toBe(target.id === null ? undefined : id(target.id));
  expect(entry.createdAt).toBeInstanceOf(Date);
  return entry;
}

describe("project actions (D65)", () => {
  it("project.delete: snapshot of the project as it was", async () => {
    const { user, token } = await loginAs("environmental_specialist");
    const project = await createProject({ title: "Wells" });
    await ManagementActivity.create({ project: project._id, activity_description: "Dig" });

    expect((await api("delete", `/projects/${project._id}`, token)).status).toBe(204);

    const entry = await expectOneEntry("project.delete", {
      by: user,
      project,
      target: { type: "project", id: project._id, label: "Wells" },
    });
    expect(entry.snapshot).toMatchObject({
      title: "Wells",
      location: "Aleppo",
      archived: false,
      screening_status: null,
      assessment_status: null,
      rows: { management_activities: 1, mitigation_plans: 0, monitoring_records: 0 },
      files: 0,
    });
  });

  it("project.archive and project.restore", async () => {
    const { user, token } = await loginAs("admin");
    const project = await createProject({ title: "Pumps" });
    const target = { type: "project", id: project._id, label: "Pumps" };

    expect((await api("patch", `/projects/${project._id}/archive`, token)).status).toBe(200);
    const archived = await expectOneEntry("project.archive", { by: user, project, target });
    expect(archived.snapshot).toBeNull();

    await AuditLog.deleteMany({});
    expect((await api("patch", `/projects/${project._id}/restore`, token)).status).toBe(200);
    await expectOneEntry("project.restore", { by: user, project, target });
  });

  it("project.purge is covered in projectPurge.test.js; the entry survives the purge", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ title: "Gone", archived: true });

    expect((await api("delete", `/projects/${project._id}/purge`, token)).status).toBe(204);

    expect(await Project.exists({ _id: project._id })).toBeNull();
    const res = await api("get", "/audit-logs", token);
    expect(res.body.data[0]).toMatchObject({ action: "project.purge", project_title: "Gone" });
  });

  it("failed requests write nothing (403, 404, 409)", async () => {
    const editor = await loginAs("program_manager");
    const specialist = await loginAs("environmental_specialist");
    const approved = await createProject({ stage: "screening_approved" });
    const archived = await createProject({ archived: true });
    const unknown = new mongoose.Types.ObjectId();

    const statuses = [
      (await api("delete", `/projects/${approved._id}`, editor.token)).status,
      (await api("delete", `/projects/${approved._id}`, specialist.token)).status,
      (await api("delete", `/projects/${unknown}`, specialist.token)).status,
      (await api("patch", `/projects/${archived._id}/archive`, specialist.token)).status,
      (await api("patch", `/projects/${approved._id}/restore`, specialist.token)).status,
      (await api("delete", `/projects/${approved._id}/purge`, specialist.token)).status,
    ];

    expect(statuses).toEqual([403, 409, 404, 409, 409, 403]);
    expect(await AuditLog.countDocuments()).toBe(0);
  });
});

describe("file.delete (D65)", () => {
  it("records the file as it was, uploader included", async () => {
    const uploader = await loginAs("environmental_focal_point");
    const { user, token } = await loginAs("program_manager");
    const project = await createProject({ title: "Clinic" });
    const uploaded = await api("post", `/projects/${project._id}/files`, uploader.token)
      .field("area", "annex")
      .field("category", "annex_c")
      .attach("file", PDF, "Permit.pdf");
    expect(uploaded.status).toBe(201);
    const fileId = uploaded.body.data._id;

    expect((await api("delete", `/files/${fileId}`, token)).status).toBe(204);

    const entry = await expectOneEntry("file.delete", {
      by: user,
      project,
      target: { type: "file", id: fileId, label: "Permit.pdf" },
    });
    expect(entry.snapshot).toMatchObject({
      name: "Permit.pdf",
      area: "annex",
      category: "annex_c",
      size: PDF.length,
      mime_type: "application/pdf",
      uploaded_by_name: uploader.user.name,
    });
    expect(id(entry.snapshot.uploaded_by)).toBe(id(uploader.user._id));
    expect(entry.snapshot.uploaded_at).toBeInstanceOf(Date);
  });

  it("writes nothing when the delete fails", async () => {
    const { token } = await loginAs("program_manager");
    const viewer = await loginAs("viewer");
    const project = await createProject({ archived: true });
    const file = await ProjectFile.create({
      project: project._id,
      area: "annex",
      category: "annex_a",
      original_name: "a.pdf",
      stored_name: "00000000-0000-4000-8000-000000000000.pdf",
      mime_type: "application/pdf",
      size: 1,
      uploaded_by: viewer.user._id,
    });

    expect((await api("delete", `/files/${file._id}`, viewer.token)).status).toBe(403);
    expect((await api("delete", `/files/${file._id}`, token)).status).toBe(409);
    expect((await api("delete", `/files/${new mongoose.Types.ObjectId()}`, token)).status).toBe(
      404
    );
    expect(await AuditLog.countDocuments()).toBe(0);
  });
});

describe.each([
  ["management", ManagementActivity, "activity_description", "management_activity", "Tool 3"],
  ["mitigation", MitigationPlan, "output_description", "mitigation_plan", "Tool 4"],
])("%s.rows_removed (D65)", (tool, Model, field, targetType, toolName) => {
  const url = (project) => `/projects/${project._id}/${tool}`;

  async function table() {
    const project = await createProject({ stage: "assessment_approved", title: "Roads" });
    const rows = await Model.insertMany([
      { project: project._id, serial_number: 1, [field]: "Keep" },
      { project: project._id, serial_number: 2, [field]: "Drop A" },
      { project: project._id, serial_number: 3, [field]: "Drop B" },
    ]);
    return { project, rows };
  }

  it("one entry per save that removes rows, with each removed row", async () => {
    const { user, token } = await loginAs("project_manager");
    const { project, rows } = await table();

    const res = await api("put", url(project), token).send({
      rows: [{ _id: rows[0]._id.toString(), [field]: "Keep, edited" }, { [field]: "New" }],
    });

    expect(res.status).toBe(200);
    const entry = await expectOneEntry(`${tool}.rows_removed`, {
      by: user,
      project,
      target: { type: targetType, id: null, label: expect.stringContaining(toolName) },
    });
    expect(
      entry.snapshot.rows.map(({ serial_number, description }) => [serial_number, description])
    ).toEqual([
      [2, "Drop A"],
      [3, "Drop B"],
    ]);
    expect(entry.snapshot.rows.map((r) => id(r._id))).toEqual([id(rows[1]._id), id(rows[2]._id)]);
    expect(entry.details).toEqual({ removed: 2 });
  });

  it("a save that removes no rows writes nothing", async () => {
    const { token } = await loginAs("project_manager");
    const { project, rows } = await table();

    const res = await api("put", url(project), token).send({
      rows: [
        ...rows.map((r) => ({ _id: r._id.toString(), [field]: "Edited" })),
        { [field]: "New" },
      ],
    });

    expect(res.status).toBe(200);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("a rejected save (400, 403, 409) writes nothing and removes nothing", async () => {
    const { token } = await loginAs("project_manager");
    const viewer = await loginAs("viewer");
    const { project } = await table();
    const locked = await createProject({ stage: "screening_approved" });

    expect((await api("put", url(project), token).send({ rows: [{}] })).status).toBe(400);
    expect((await api("put", url(project), viewer.token).send({ rows: [] })).status).toBe(403);
    expect((await api("put", url(locked), token).send({ rows: [] })).status).toBe(409);
    expect(await Model.countDocuments({ project: project._id })).toBe(3);
    expect(await AuditLog.countDocuments()).toBe(0);
  });
});

describe("user actions (D65)", () => {
  it("user.create: name, email and role, never the temporary password", async () => {
    const { user, token } = await loginAs("admin");

    const res = await api("post", "/users", token).send({
      name: "Rana",
      email: "rana@example.com",
      role: "viewer",
    });

    expect(res.status).toBe(201);
    const entry = await expectOneEntry("user.create", {
      by: user,
      project: null,
      target: { type: "user", id: res.body.data.user._id, label: "Rana" },
    });
    expect(entry.snapshot).toEqual({ name: "Rana", email: "rana@example.com", role: "viewer" });
    expect(JSON.stringify(entry)).not.toContain(res.body.data.temporary_password);
  });

  it("user.role_change only when the role changes", async () => {
    const { user, token } = await loginAs("admin");
    const { user: target } = await createUser("viewer", { name: "Omar" });

    await api("put", `/users/${target._id}`, token).send({ name: "Omar K." });
    await api("put", `/users/${target._id}`, token).send({ role: "viewer" });
    expect(await AuditLog.countDocuments()).toBe(0);

    expect(
      (await api("put", `/users/${target._id}`, token).send({ role: "project_manager" })).status
    ).toBe(200);

    const entry = await expectOneEntry("user.role_change", {
      by: user,
      project: null,
      target: { type: "user", id: target._id, label: "Omar K." },
    });
    expect(entry.details).toEqual({ from: "viewer", to: "project_manager" });
    expect(entry.snapshot).toEqual({ name: "Omar K.", email: target.email });
  });

  it.each([
    ["deactivate", "patch", "user.deactivate", { is_active: true }],
    ["reactivate", "patch", "user.reactivate", { is_active: false }],
    ["reset-password", "post", "user.reset_password", {}],
  ])("%s → %s entry with the user's name and email", async (path, method, action, fields) => {
    const { user, token } = await loginAs("admin");
    const { user: target } = await createUser("viewer", { name: "Lina", ...fields });

    const res = await api(method, `/users/${target._id}/${path}`, token);

    expect(res.status).toBe(200);
    const entry = await expectOneEntry(action, {
      by: user,
      project: null,
      target: { type: "user", id: target._id, label: "Lina" },
    });
    expect(entry.snapshot).toEqual({ name: "Lina", email: target.email });
    if (res.body.data.temporary_password) {
      expect(JSON.stringify(entry)).not.toContain(res.body.data.temporary_password);
    }
  });

  it("failed user actions write nothing", async () => {
    const admin = await loginAs("admin");
    const specialist = await loginAs("environmental_specialist");
    const { user: other } = await createUser("viewer");

    const statuses = [
      // Duplicate email, invalid body, wrong role, unknown user, last active admin.
      (
        await api("post", "/users", admin.token).send({
          name: "X",
          email: other.email,
          role: "viewer",
        })
      ).status,
      (await api("post", "/users", admin.token).send({ name: "X" })).status,
      (await api("patch", `/users/${other._id}/deactivate`, specialist.token)).status,
      (await api("post", `/users/${new mongoose.Types.ObjectId()}/reset-password`, admin.token))
        .status,
      (await api("patch", `/users/${admin.user._id}/deactivate`, admin.token)).status,
      (await api("put", `/users/${admin.user._id}`, admin.token).send({ role: "viewer" })).status,
    ];

    expect(statuses).toEqual([409, 400, 403, 404, 409, 409]);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("entries keep the copied names after the actor is deactivated", async () => {
    const actor = await loginAs("admin");
    const other = await loginAs("admin");
    const { user: target } = await createUser("viewer");
    await api("patch", `/users/${target._id}/deactivate`, actor.token);
    await api("patch", `/users/${actor.user._id}/deactivate`, other.token);
    await User.updateOne({ _id: actor.user._id }, { name: "Renamed later" });

    const res = await api("get", "/audit-logs?action=user.deactivate", other.token);

    expect(res.body.data.map((e) => e.by_name)).toEqual([other.user.name, actor.user.name]);
  });
});

describe("secrets (D65)", () => {
  it("no entry ever holds a password, hash or token", async () => {
    const { token } = await loginAs("admin");
    const created = await api("post", "/users", token).send({
      name: "S",
      email: "s@example.com",
      role: "viewer",
    });
    const userId = created.body.data.user._id;
    const reset = await api("post", `/users/${userId}/reset-password`, token);
    await api("put", `/users/${userId}`, token).send({ role: "project_manager" });
    await api("patch", `/users/${userId}/deactivate`, token);
    await api("patch", `/users/${userId}/reactivate`, token);
    const project = await createProject();
    await api("patch", `/projects/${project._id}/archive`, token);
    await api("delete", `/projects/${project._id}/purge`, token);

    const all = await entries();
    expect(all.length).toBeGreaterThanOrEqual(7);
    const hash = (await User.findById(userId).lean()).password;
    const text = JSON.stringify(all);
    for (const secret of [
      created.body.data.temporary_password,
      reset.body.data.temporary_password,
      hash,
      token,
    ]) {
      expect(secret).toBeTruthy();
      expect(text).not.toContain(secret);
    }
    expect(text).not.toMatch(/"[^"]*(password|token|hash|secret)[^"]*":/i);
  });

  it("record() drops secret-looking keys whatever a caller passes", async () => {
    const audit = require("../../src/services/audit.service");
    const { user } = await createUser("admin");

    await audit.record(user, "user.create", {
      target: { type: "user", id: user._id, label: user.name },
      snapshot: { name: "A", password: "p", nested: [{ resetToken: "t", ok: 1 }] },
      details: { password_hash: "h", apiSecret: "s", kept: true },
    });

    const [entry] = await entries();
    expect(entry.snapshot).toEqual({ name: "A", nested: [{ ok: 1 }] });
    expect(entry.details).toEqual({ kept: true });
  });
});

describe("a failed log write", () => {
  it("is logged on the server and the action still answers", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject();
    vi.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("disk full"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await api("patch", `/projects/${project._id}/archive`, token);

    expect(res.status).toBe(200);
    expect((await Project.findById(project._id)).archived).toBe(true);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("project.archive"), "disk full");
  });

  it("stops a purge: no purge without its entry (D60)", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ archived: true });
    vi.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("disk full"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await api("delete", `/projects/${project._id}/purge`, token);

    expect(res.status).toBe(500);
    expect(await Project.exists({ _id: project._id })).not.toBeNull();
  });
});

describe("GET /audit-logs (D65)", () => {
  async function seedEntries() {
    const { user } = await createUser("admin");
    const base = { by: user._id, by_name: user.name, by_role: "admin" };
    const at = (day) => new Date(`2026-03-${String(day).padStart(2, "0")}T10:00:00Z`);
    const docs = [
      ["user.create", 1],
      ["user.deactivate", 2],
      ["project.archive", 3],
      ["project.restore", 4],
      ["file.delete", 5],
    ].map(([action, day]) => ({
      ...base,
      action,
      target_type: action.split(".")[0] === "file" ? "file" : action.split(".")[0],
      target_label: action,
      createdAt: at(day),
    }));
    // insertMany keeps the given createdAt (timestamps only fill missing ones).
    await AuditLog.insertMany(docs, { timestamps: false });
  }

  const list = async (query = "") => {
    const { token } = await loginAs("admin");
    return api("get", `/audit-logs${query}`, token);
  };

  it("newest first, paginated", async () => {
    await seedEntries();

    const first = await list("?limit=2");
    const third = await list("?limit=2&page=3");

    expect(first.status).toBe(200);
    expect(first.body.data.map((e) => e.action)).toEqual(["file.delete", "project.restore"]);
    expect(first.body.pagination).toEqual({ page: 1, limit: 2, total: 5, pages: 3 });
    expect(third.body.data.map((e) => e.action)).toEqual(["user.create"]);
  });

  it("defaults to 50 per page", async () => {
    await seedEntries();
    expect((await list()).body.pagination).toEqual({ page: 1, limit: 50, total: 5, pages: 1 });
  });

  it.each([
    ["?action=project.archive", ["project.archive"]],
    ["?action=user.", ["user.deactivate", "user.create"]],
    ["?action=project.", ["project.restore", "project.archive"]],
    ["?from=2026-03-02T00:00:00Z&to=2026-03-04T00:00:00Z", ["project.archive", "user.deactivate"]],
    ["?from=2026-03-04T10:00:00Z", ["file.delete", "project.restore"]],
    ["?to=2026-03-01T10:00:00Z", ["user.create"]],
    ["?action=user.&from=2026-03-02T00:00:00Z", ["user.deactivate"]],
  ])("filters %s", async (query, expected) => {
    await seedEntries();
    const res = await list(query);
    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.action)).toEqual(expected);
  });

  it.each([
    "?page=0",
    "?limit=101",
    "?limit=abc",
    "?action=project",
    "?action=user.login",
    "?action=project.*",
    "?from=yesterday",
    "?from=2026-03-04T00:00:00Z&to=2026-03-01T00:00:00Z",
  ])("invalid query %s → 400", async (query) => {
    expect((await list(query)).status).toBe(400);
  });

  it.each(["environmental_specialist", "program_manager", "viewer"])(
    "is admin only: %s gets 403",
    async (role) => {
      const { token } = await loginAs(role);
      expect((await api("get", "/audit-logs", token)).status).toBe(403);
    }
  );
});

describe("append-only (D65)", () => {
  // Every route registered under /api/v1, read from the real routers.
  const routes = apiRouter.stack
    .filter((layer) => layer.handle.stack)
    .flatMap((layer) => {
      const prefix = layer.regexp.source
        .replace(/^\^/, "")
        .replace("\\/?(?=\\/|$)", "")
        .replace(/\\\//g, "/");
      return layer.handle.stack
        .filter((sub) => sub.route)
        .flatMap((sub) =>
          Object.keys(sub.route.methods).map((method) => `${method} ${prefix}${sub.route.path}`)
        );
    });

  it("the only audit-log endpoint is GET /audit-logs", () => {
    expect(routes.length).toBeGreaterThan(40);
    expect(routes.filter((r) => /audit/i.test(r))).toEqual(["get /audit-logs/"]);
  });

  it("only services/audit.service.js loads the AuditLog model", () => {
    const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
    const walk = (dir) =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) =>
          entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
        );
    const users = walk(src)
      .filter((file) => file.endsWith(".js"))
      .filter((file) => /auditLog\.model/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(src, file).replace(/\\/g, "/"))
      .sort();
    // The validator only reads the action names.
    expect(users).toEqual(["services/audit.service.js", "validators/auditLog.validator.js"]);
  });

  it("every action in the model is one this phase logs", () => {
    expect(AUDIT_ACTIONS).toEqual([
      "project.delete",
      "project.purge",
      "project.archive",
      "project.restore",
      "file.delete",
      "management.rows_removed",
      "mitigation.rows_removed",
      "user.create",
      "user.role_change",
      "user.deactivate",
      "user.reactivate",
      "user.reset_password",
    ]);
  });
});
