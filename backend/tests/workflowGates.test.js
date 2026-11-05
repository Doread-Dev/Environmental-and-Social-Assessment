import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups, withVersion } from "./helpers/fixtures.js";

const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const Indicator = require("../../src/models/indicator.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Each gated tool: the stage just before its prerequisite is met, the first stage that unlocks
// it, and its writes: create, change an existing row, (for tables) delete one. Tools 3–5 save
// through the bulk endpoints (D32).
const put = (url, body) => async (token) =>
  request(app)
    .put(url)
    .set(auth(token))
    .send(await withVersion(url, body));

const tools = [
  {
    name: "assessment (Tool 2)",
    blocked: "new",
    unlocked: "screening_approved",
    created: 201,
    read: (project) => `/api/v1/assessments/project/${project}`,
    create: (project) => (token) =>
      request(app)
        .post("/api/v1/assessments")
        .set(auth(token))
        .send({ project, project_activity: "Pipes", description: "Replace pipes" }),
    insert: (project) =>
      Assessment.create({ project, project_activity: "Pipes", description: "Replace pipes" }),
    writes: (project, row) => [put(`/api/v1/assessments/${row._id}`, { description: "Changed" })],
  },
  {
    name: "management activities (Tool 3)",
    blocked: "screening_approved",
    unlocked: "assessment_approved",
    created: 200,
    read: (project) => `/api/v1/management/project/${project}`,
    create: (project) =>
      put(`/api/v1/projects/${project}/management`, { rows: [{ activity_description: "Dig" }] }),
    insert: (project) => ManagementActivity.create({ project, activity_description: "Dig" }),
    writes: (project, row) => [
      put(`/api/v1/projects/${project}/management`, {
        rows: [{ _id: String(row._id), activity_description: "Dig", notes: "Changed" }],
      }),
      put(`/api/v1/projects/${project}/management`, { rows: [] }),
    ],
  },
  {
    name: "mitigation plan (Tool 4)",
    blocked: "screening_approved",
    unlocked: "assessment_approved",
    created: 200,
    read: (project) => `/api/v1/mitigation/project/${project}`,
    create: (project) =>
      put(`/api/v1/projects/${project}/mitigation`, { rows: [{ output_description: "Network" }] }),
    insert: (project) => MitigationPlan.create({ project, output_description: "Network" }),
    writes: (project, row) => [
      put(`/api/v1/projects/${project}/mitigation`, {
        rows: [{ _id: String(row._id), output_description: "Network", notes: "Changed" }],
      }),
      put(`/api/v1/projects/${project}/mitigation`, { rows: [] }),
    ],
  },
  {
    name: "monitoring records (Tool 5)",
    blocked: "assessment_approved",
    unlocked: "semp_complete",
    created: 200,
    read: (project) => `/api/v1/monitoring/project/${project}`,
    create: (project, indicator) =>
      put(`/api/v1/projects/${project}/monitoring`, { records: [{ indicator }] }),
    insert: (project, indicator) => MonitoringRecord.create({ project, indicator }),
    writes: (project, row) => [
      put(`/api/v1/projects/${project}/monitoring`, {
        records: [{ indicator: String(row.indicator), note: "Changed" }],
      }),
    ],
  },
];

const anIndicator = async () => {
  await seedLookups();
  return String((await Indicator.findOne())._id);
};

describe.each(tools)("$name gate (D2)", (tool) => {
  it("blocks create before the prerequisite (409)", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.blocked });

    const res = await tool.create(String(project._id), await anIndicator())(token);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/must be/);
  });

  it("allows create once the prerequisite is met", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.unlocked });

    const res = await tool.create(String(project._id), await anIndicator())(token);

    expect(res.status).toBe(tool.created);
  });

  it("blocks changing (and deleting) rows whose prerequisite is no longer met (409)", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.blocked });
    const row = await tool.insert(project._id, await anIndicator());

    for (const write of tool.writes(String(project._id), row)) {
      expect((await write(token)).status).toBe(409);
    }
  });

  it("does not gate reads", async () => {
    const { token } = await loginAs("viewer");
    const project = await createProject({ stage: tool.blocked });

    const res = await request(app).get(tool.read(project._id)).set(auth(token));

    expect(res.status).toBe(200);
  });
});

describe("category E follows the same order (D12)", () => {
  it("unlocks the assessment once an E screening is approved, not before", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject();
    const body = { project: project._id.toString(), project_activity: "A", description: "B" };
    const screening = await Screening.create({
      project: project._id,
      category_code: "E",
      category_reason: "Emergency",
      status: "submitted",
    });

    const before = await request(app).post("/api/v1/assessments").set(auth(token)).send(body);
    expect(before.status).toBe(409);

    await Screening.updateOne({ _id: screening._id }, { status: "approved" });
    const after = await request(app).post("/api/v1/assessments").set(auth(token)).send(body);
    expect(after.status).toBe(201);
  });
});

describe("monitoring needs complete SEMP tables", () => {
  const post = async (token, project) =>
    tools[3].create(String(project._id), await anIndicator())(token);

  it("blocks when only one of Tools 3 and 4 has rows", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "assessment_approved" });
    await ManagementActivity.create({ project: project._id, activity_description: "Dig" });

    expect((await post(token, project)).status).toBe(409);
  });

  it("blocks when a row has an empty description", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "semp_complete" });
    await MitigationPlan.collection.insertOne({ project: project._id, output_description: "  " });

    expect((await post(token, project)).status).toBe(409);
  });
});

describe("unknown project", () => {
  it("returns 404 on create", async () => {
    const { token } = await loginAs("project_manager");
    const res = await request(app)
      .post("/api/v1/screenings")
      .set(auth(token))
      .send({ project: "64b000000000000000000000", category_code: "B", category_reason: "R" });
    expect(res.status).toBe(404);
  });
});
