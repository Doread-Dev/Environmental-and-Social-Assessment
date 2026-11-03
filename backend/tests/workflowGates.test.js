import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Each gated tool: the stage just before its prerequisite is met, the first stage that unlocks
// it, how to create one, and how to insert an existing row directly (for update/delete).
const tools = [
  {
    name: "assessment (Tool 2)",
    blocked: "new",
    unlocked: "screening_approved",
    base: "/api/v1/assessments",
    body: (project) => ({ project, project_activity: "Pipes", description: "Replace pipes" }),
    insert: (project) =>
      Assessment.create({ project, project_activity: "Pipes", description: "Replace pipes" }),
    update: () => ({ description: "Changed" }),
  },
  {
    name: "management activity (Tool 3)",
    blocked: "screening_approved",
    unlocked: "assessment_approved",
    base: "/api/v1/management",
    body: (project) => ({ project, activity_description: "Dig" }),
    insert: (project) => ManagementActivity.create({ project, activity_description: "Dig" }),
    update: () => ({ notes: "Changed" }),
    canDelete: true,
  },
  {
    name: "mitigation plan (Tool 4)",
    blocked: "screening_approved",
    unlocked: "assessment_approved",
    base: "/api/v1/mitigation",
    body: (project) => ({ project, output_description: "Network" }),
    insert: (project) => MitigationPlan.create({ project, output_description: "Network" }),
    update: () => ({ notes: "Changed" }),
    canDelete: true,
  },
  {
    name: "monitoring record (Tool 5)",
    blocked: "assessment_approved",
    unlocked: "semp_complete",
    base: "/api/v1/monitoring",
    body: (project, indicator) => ({ project, indicator }),
    insert: (project, indicator) => MonitoringRecord.create({ project, indicator }),
    // The monitoring PUT schema requires project and indicator.
    update: (project, indicator) => ({ project, indicator, note: "Changed" }),
  },
];

// Monitoring does not look the indicator up, a fresh id is enough.
const newIndicator = async () => ({ _id: new mongoose.Types.ObjectId() });

describe.each(tools)("$name gate (D2)", (tool) => {
  it("blocks create before the prerequisite (409)", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.blocked });
    const indicator = await newIndicator();

    const res = await request(app)
      .post(tool.base)
      .set(auth(token))
      .send(tool.body(project._id.toString(), indicator._id.toString()));

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/must be/);
  });

  it("allows create once the prerequisite is met", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.unlocked });
    const indicator = await newIndicator();

    const res = await request(app)
      .post(tool.base)
      .set(auth(token))
      .send(tool.body(project._id.toString(), indicator._id.toString()));

    expect(res.status).toBe(201);
  });

  it("blocks update (and delete) of a row whose prerequisite is no longer met (409)", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: tool.blocked });
    const indicator = await newIndicator();
    const row = await tool.insert(project._id, indicator._id);

    const put = await request(app)
      .put(`${tool.base}/${row._id}`)
      .set(auth(token))
      .send(tool.update(project._id.toString(), indicator._id.toString()));
    expect(put.status).toBe(409);

    if (tool.canDelete) {
      const del = await request(app).delete(`${tool.base}/${row._id}`).set(auth(token));
      expect(del.status).toBe(409);
    }
  });

  it("does not gate reads", async () => {
    const { token } = await loginAs("viewer");
    const project = await createProject({ stage: tool.blocked });

    const res = await request(app).get(`${tool.base}/project/${project._id}`).set(auth(token));

    expect(res.status).not.toBe(409);
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
    request(app)
      .post("/api/v1/monitoring")
      .set(auth(token))
      .send({ project: project._id.toString(), indicator: (await newIndicator())._id.toString() });

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
