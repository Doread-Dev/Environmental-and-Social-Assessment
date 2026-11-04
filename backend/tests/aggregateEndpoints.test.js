import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const ImpactCategory = require("../../src/models/impactCategory.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const Indicator = require("../../src/models/indicator.model");
const JobTitle = require("../../src/models/jobTitle.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const get = async (url, role = "viewer") => {
  const { token } = await loginAs(role);
  return request(app).get(url).set(auth(token));
};

// Counts MongoDB operations while `run` executes (mongoose debug hook).
async function countQueries(run) {
  let count = 0;
  mongoose.set("debug", () => {
    count += 1;
  });
  try {
    await run();
  } finally {
    mongoose.set("debug", false);
  }
  return count;
}

afterEach(() => mongoose.set("debug", false));

describe("GET /dashboard (D31)", () => {
  it("returns stats and the latest 5 projects with workflow state", async () => {
    await createProject({ title: "New" });
    await createProject({ title: "Approved B", stage: "screening_approved" });
    const a = await createProject({ title: "Category A", stage: "assessment_approved" });
    await Screening.updateOne({ project: a._id }, { category_code: "A" });
    await createProject({ title: "SEMP done", stage: "semp_complete" });
    const rejected = await createProject({ title: "Rejected" });
    await Screening.create({
      project: rejected._id,
      category_code: "D",
      category_reason: "r",
      status: "rejected",
    });
    const latest = await createProject({ title: "Latest" });
    await createProject({ title: "Archived", stage: "screening_approved", archived: true });

    const res = await get("/api/v1/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({
      total_projects: 6,
      by_status: { draft: 2, in_progress: 3, needs_action: 1, monitoring: 0, completed: 0 },
      high_risk: 3, // A + two B (fixture screenings are B); D and the archived one don't count
    });
    const items = res.body.data.latest_projects;
    expect(items).toHaveLength(5);
    expect(items[0]).toMatchObject({ _id: latest._id.toString(), title: "Latest" });
    expect(items.map((p) => p.title)).not.toContain("Archived");
    expect(items[0]).toHaveProperty("workflow.steps.screening.status", "not_started");
    expect(items[0]).toHaveProperty("allowed_actions");
  });

  it("works with no projects", async () => {
    const res = await get("/api/v1/dashboard");
    expect(res.body.data).toEqual({
      stats: {
        total_projects: 0,
        by_status: { draft: 0, in_progress: 0, needs_action: 0, monitoring: 0, completed: 0 },
        high_risk: 0,
      },
      latest_projects: [],
    });
  });
});

describe("query count stays bounded (no per-project loop)", () => {
  const seed = async (count) => {
    for (let i = 0; i < count; i += 1) {
      const project = await createProject({ stage: "semp_complete" });
      await MonitoringRecord.create({
        project: project._id,
        indicator: new mongoose.Types.ObjectId(),
      });
    }
  };

  it.each(["/api/v1/dashboard", "/api/v1/projects"])("%s", async (url) => {
    const { token } = await loginAs("viewer");
    const call = () => request(app).get(url).set(auth(token)).expect(200);

    await seed(1);
    const withOne = await countQueries(call);
    await seed(6);
    const withSeven = await countQueries(call);

    expect(withSeven).toBe(withOne);
    expect(withOne).toBeLessThanOrEqual(8);
  });
});

describe("GET /projects (D31)", () => {
  it("lists projects with workflow state, summaries and allowed actions", async () => {
    const project = await createProject({ stage: "assessment_approved" });

    const res = await get("/api/v1/projects", "project_manager");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, limit: null, total: 1, pages: 1 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      _id: project._id.toString(),
      title: "Test project",
      screening: { status: "approved", category_code: "B" },
      assessment: { status: "approved" },
      workflow: { status: "in_progress", current_step: "semp", percent_complete: 50 },
      allowed_actions: ["project.edit", "semp.edit", "files.edit", "export"],
    });
  });

  it("keeps the old default: newest first, archived hidden; archived=true lists only them", async () => {
    await createProject({ title: "Old" });
    await createProject({ title: "Archived", archived: true });
    await createProject({ title: "New" });

    const active = await get("/api/v1/projects");
    const archived = await get("/api/v1/projects?archived=true");

    expect(active.body.data.map((p) => p.title)).toEqual(["New", "Old"]);
    expect(archived.body.data.map((p) => p.title)).toEqual(["Archived"]);
  });

  it("paginates when a limit is given", async () => {
    for (const title of ["P1", "P2", "P3", "P4", "P5"]) await createProject({ title });

    const res = await get("/api/v1/projects?limit=2&page=2&sort=title");

    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 5, pages: 3 });
    expect(res.body.data.map((p) => p.title)).toEqual(["P3", "P4"]);
  });

  it("filters by search (title or location, case-insensitive, literal), status and category", async () => {
    await createProject({ title: "Water network", location: "Aleppo" });
    await createProject({ title: "School", location: "Homs (rural)" });
    const approved = await createProject({ title: "Clinic", stage: "screening_approved" });
    await Screening.updateOne({ project: approved._id }, { category_code: "C" });

    const titles = async (query) =>
      (await get(`/api/v1/projects?${query}`)).body.data.map((p) => p.title).sort();

    expect(await titles("search=WATER")).toEqual(["Water network"]);
    expect(await titles("search=homs%20(")).toEqual(["School"]);
    expect(await titles("search=.*")).toEqual([]);
    expect(await titles("status=draft")).toEqual(["School", "Water network"]);
    expect(await titles("status=in_progress")).toEqual(["Clinic"]);
    expect(await titles("category=C")).toEqual(["Clinic"]);
    expect(await titles("category=B")).toEqual([]);
  });

  it("rejects invalid query values (400)", async () => {
    for (const query of ["limit=0", "limit=101", "page=0", "status=done", "sort=random"]) {
      const res = await get(`/api/v1/projects?${query}`);
      expect(res.status, query).toBe(400);
    }
  });
});

describe("GET /projects/:id/workspace (D31)", () => {
  it("returns project, workflow, allowed actions, summaries and counts in one call", async () => {
    const project = await createProject({ stage: "semp_complete" });

    const res = await get(`/api/v1/projects/${project._id}/workspace`, "environmental_specialist");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual([
      "allowed_actions",
      "assessment",
      "counts",
      "project",
      "screening",
      "workflow",
    ]);
    expect(res.body.data).toMatchObject({
      project: { _id: project._id.toString(), title: "Test project", archived: false },
      screening: { status: "approved", category_code: "B" },
      assessment: { status: "approved" },
      counts: { management_activities: 1, mitigation_plans: 1, monitoring_records: 0 },
      workflow: { current_step: "monitoring", next_action: { route: "MONITORING" } },
    });
    expect(res.body.data.allowed_actions).toContain("monitoring.edit");
  });

  it("returns null summaries before the tools are started", async () => {
    const project = await createProject();
    const res = await get(`/api/v1/projects/${project._id}/workspace`);
    expect(res.body.data).toMatchObject({ screening: null, assessment: null });
  });

  it("shows who archived an archived project", async () => {
    const { user, token } = await loginAs("environmental_specialist");
    const project = await createProject();
    await request(app).patch(`/api/v1/projects/${project._id}/archive`).set(auth(token));

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/workspace`)
      .set(auth(token));

    expect(res.body.data.project).toMatchObject({
      archived: true,
      archived_by: { _id: user._id.toString(), name: user.name },
    });
  });

  it("unknown or malformed project id → 404", async () => {
    const unknown = new mongoose.Types.ObjectId();
    expect((await get(`/api/v1/projects/${unknown}/workspace`)).status).toBe(404);
    expect((await get("/api/v1/projects/not-an-id/workspace")).status).toBe(404);
  });
});

describe("GET /lookups (D31)", () => {
  it("returns all four lookup collections and the places registry in one response", async () => {
    await seedLookups();

    const res = await get("/api/v1/lookups");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual([
      "impact_categories",
      "impact_questions",
      "indicators",
      "job_titles",
      "place_groups",
      "places",
    ]);
    expect(res.body.data.impact_categories).toHaveLength(await ImpactCategory.countDocuments());
    expect(res.body.data.impact_questions).toHaveLength(await ImpactQuestion.countDocuments());
    expect(res.body.data.indicators).toHaveLength(await Indicator.countDocuments());
    expect(res.body.data.job_titles).toHaveLength(await JobTitle.countDocuments());
    // Same shape as the single endpoints: categories populated on questions and indicators.
    expect(res.body.data.impact_questions[0].category).toHaveProperty("code");
    expect(res.body.data.indicators[0].category).toHaveProperty("code");
  });
});

describe("GET /projects/:id stays as it was (additive phase)", () => {
  it("returns the bare project", async () => {
    const project = await createProject({ stage: "screening_approved" });
    const res = await get(`/api/v1/projects/${project._id}`);
    expect(res.body.data).not.toHaveProperty("workflow");
    expect(res.body.data.title).toBe((await Project.findById(project._id)).title);
  });
});
