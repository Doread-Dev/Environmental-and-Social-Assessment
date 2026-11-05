import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups, withVersion } from "./helpers/fixtures.js";
import { listRoutes } from "./helpers/routes.js";

const access = require("../../src/services/access.service");
const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const ProjectFile = require("../../src/models/projectFile.model");
const Indicator = require("../../src/models/indicator.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const AuditLog = require("../../src/models/auditLog.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// D66a: everything under these prefixes reads or writes a project or something in it.
const PROJECT_SCOPED = [
  "/projects",
  "/screenings",
  "/assessments",
  "/management",
  "/mitigation",
  "/monitoring",
  "/files",
  "/dashboard",
];
// Not about a project: own account, users, lookups, the admin-wide audit log.
// The reference library is organisation guidance, not tied to a project (D64 b).
const NOT_PROJECT_SCOPED = ["/auth", "/users", "/lookups", "/audit-logs", "/library"];
// Creating a project is a permission, there is no project to check yet.
const NO_PROJECT_YET = new Set(["post /projects"]);
const LISTS = new Set(["get /projects", "get /dashboard"]);

const routes = listRoutes();
const accessOf = (route) => route.handlers.find((h) => h.projectAccess)?.projectAccess;
const scoped = routes.filter(
  (r) => PROJECT_SCOPED.includes(r.prefix) && !NO_PROJECT_YET.has(r.key)
);
const single = scoped.filter((r) => !LISTS.has(r.key));

afterEach(() => vi.restoreAllMocks());

describe("route table: every project-scoped route has the access check (D66a)", () => {
  it("finds the routes", () => {
    expect(routes.length).toBeGreaterThan(40);
    expect(single.length).toBeGreaterThan(30);
  });

  it("every mounted prefix is classified, so a new router needs a decision", () => {
    const prefixes = [...new Set(routes.map((r) => r.prefix))].sort();
    expect(prefixes).toEqual([...PROJECT_SCOPED, ...NOT_PROJECT_SCOPED].sort());
  });

  it.each(scoped.map((r) => [r.key, r]))("%s", (_key, route) => {
    const source = accessOf(route);
    expect(source, `${route.key} skips projectAccess`).toBeDefined();
    expect(source === "list").toBe(LISTS.has(route.key));
  });

  it("routes outside the project prefixes have none", () => {
    const others = routes.filter((r) => !PROJECT_SCOPED.includes(r.prefix));
    expect(others.filter(accessOf).map((r) => r.key)).toEqual([]);
  });
});

// One project with one record of every kind, so every by-id route can resolve its project.
async function fixture() {
  await seedLookups();
  const project = await createProject({ stage: "semp_complete", title: "Hidden" });
  const other = await createProject({ title: "Other" });
  const screening = await Screening.findOne({ project: project._id });
  // A draft assessment, so the edit routes would get past their own locks.
  const assessment = await Assessment.findOneAndUpdate(
    { project: project._id },
    { status: "draft" },
    { new: true }
  );
  const indicator = await Indicator.findOne();
  const record = await MonitoringRecord.create({ project: project._id, indicator: indicator._id });
  const file = await ProjectFile.create({
    project: project._id,
    area: "documents",
    category: "screening",
    original_name: "a.pdf",
    stored_name: "11111111-1111-4111-8111-111111111111.pdf",
    mime_type: "application/pdf",
    size: 1,
    uploaded_by: (await loginAs("viewer")).user._id,
  });
  const question = await ImpactQuestion.findOne();
  return { project, other, screening, assessment, record, file, question };
}

// Concrete URL and a body that passes validation (the by-record checks run after validate),
// with the current version where the route needs one (D62).
async function requestFor(route, ids) {
  const recordId = {
    "/screenings": ids.screening._id,
    "/assessments": ids.assessment._id,
    "/monitoring": ids.record._id,
    "/files": ids.file._id,
  }[route.prefix];
  const url = route.path
    .replace(":projectId", ids.project._id)
    .replace(":fileId", ids.file._id)
    .replace(":id", route.prefix === "/projects" ? ids.project._id : recordId);
  const project = ids.project._id.toString();
  const bodies = {
    "post /screenings": { project, category_code: "B", category_reason: "r" },
    "post /assessments": { project, description: "d", project_activity: "a" },
    "put /assessments/:id/methods": { methods: [] },
    "put /assessments/:id/consultations": { consultations: [] },
    "post /assessments/:id/scores": {
      scores: [{ question: ids.question._id.toString(), level: "low" }],
    },
    "put /projects/:id/management": { rows: [] },
    "put /projects/:id/mitigation": { rows: [] },
    "put /projects/:id/monitoring": { records: [] },
    "patch /files/:fileId": { category: null },
    "patch /screenings/:id/approve": { recommendations: "ok" },
    "patch /assessments/:id/approve": { recommendations: "ok" },
  };
  const full = `/api/v1${url}`;
  return { url: full, body: await withVersion(full, bodies[route.key] ?? {}) };
}

describe("deny stub: a denied project answers 404, not 403 (D66a)", () => {
  it.each(single.map((r) => [r.key, r]))("%s", async (_key, route) => {
    const ids = await fixture();
    const { token } = await loginAs("admin");
    const spy = vi.spyOn(access, "assertProjectAccess").mockRejectedValue(access.noAccess());
    const { url, body } = await requestFor(route, ids);

    const res = await request(app)[route.method](url).set(auth(token)).send(body);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Project not found" });
    // The check was asked about the right project (by-id routes resolve it first).
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" }),
      String(ids.project._id)
    );
    // Nothing was written.
    const project = await Project.findById(ids.project._id).lean();
    expect(project).toMatchObject({ title: "Hidden", archived: false });
    expect(await Screening.countDocuments()).toBe(1);
    expect(await ProjectFile.countDocuments()).toBe(1);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("an allowed project is unaffected by a denial of another one", async () => {
    const ids = await fixture();
    const { token } = await loginAs("viewer");
    vi.spyOn(access, "assertProjectAccess").mockImplementation(async (_user, projectId) => {
      if (projectId === String(ids.project._id)) throw access.noAccess();
    });

    const hidden = await request(app).get(`/api/v1/projects/${ids.project._id}`).set(auth(token));
    const visible = await request(app).get(`/api/v1/projects/${ids.other._id}`).set(auth(token));

    expect(hidden.status).toBe(404);
    expect(visible.status).toBe(200);
  });

  it("lists apply projectFilterFor (project list, dashboard)", async () => {
    const ids = await fixture();
    const { user, token } = await loginAs("viewer");
    const spy = vi
      .spyOn(access, "projectFilterFor")
      .mockResolvedValue({ _id: { $in: [ids.other._id] } });

    const list = await request(app).get("/api/v1/projects").set(auth(token));
    const dashboard = await request(app).get("/api/v1/dashboard").set(auth(token));

    expect(list.body.data.map((p) => p.title)).toEqual(["Other"]);
    expect(list.body.pagination.total).toBe(1);
    expect(dashboard.body.data.stats.total_projects).toBe(1);
    expect(dashboard.body.data.latest_projects.map((p) => p.title)).toEqual(["Other"]);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(String(spy.mock.calls[0][0]._id)).toBe(String(user._id));
  });

  it("the list filter combines with search and archived", async () => {
    const ids = await fixture();
    await Project.updateOne({ _id: ids.other._id }, { archived: true });
    const { token } = await loginAs("viewer");
    vi.spyOn(access, "projectFilterFor").mockResolvedValue({ _id: { $in: [ids.other._id] } });

    const live = await request(app).get("/api/v1/projects?search=Hid").set(auth(token));
    const archived = await request(app).get("/api/v1/projects?archived=true").set(auth(token));

    expect(live.body.data).toEqual([]);
    expect(archived.body.data.map((p) => p.title)).toEqual(["Other"]);
  });
});

describe("v2 allows every signed-in user (D66a)", () => {
  it("assertProjectAccess resolves and projectFilterFor is {}", async () => {
    const { user } = await loginAs("viewer");
    await expect(access.assertProjectAccess(user, "64b000000000000000000000")).resolves.toBe(
      undefined
    );
    await expect(access.projectFilterFor(user)).resolves.toEqual({});
  });

  it("an unknown screening id still answers 404 with its own message", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app)
      .get("/api/v1/screenings/64b000000000000000000000")
      .set(auth(token));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Screening not found");
  });
});
