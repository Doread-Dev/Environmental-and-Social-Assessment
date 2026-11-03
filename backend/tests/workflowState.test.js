import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const { computeWorkflow } = require("../../src/services/workflow.service");
const Screening = require("../../src/models/screening.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const Indicator = require("../../src/models/indicator.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const approved = { status: "approved" };
const activity = (description = "Dig") => ({ activity_description: description });
const plan = (description = "Network") => ({ output_description: description });
const semp = { activities: [activity()], plans: [plan()] };
const statuses = (workflow) =>
  Object.fromEntries(Object.entries(workflow.steps).map(([step, { status }]) => [step, status]));

// Each workflow stage (D30): inputs → step statuses, overall status, %, next action.
const stages = [
  {
    name: "empty project",
    inputs: {},
    steps: ["not_started", "locked", "locked", "locked"],
    status: "draft",
    percent: 0,
    next: ["screening", "Start Screening", "SCREENING", 1],
  },
  {
    name: "screening draft",
    inputs: { screening: { status: "draft" } },
    steps: ["in_progress", "locked", "locked", "locked"],
    status: "draft",
    percent: 13,
    next: ["screening", "Complete Screening", "SCREENING", 1],
  },
  {
    name: "screening submitted",
    inputs: { screening: { status: "submitted" } },
    steps: ["submitted", "locked", "locked", "locked"],
    status: "in_progress",
    percent: 13,
    next: ["screening", "Pending Approval", "SCREENING", 1],
  },
  {
    name: "screening rejected",
    inputs: { screening: { status: "rejected" } },
    steps: ["rejected", "locked", "locked", "locked"],
    status: "needs_action",
    percent: 13,
    next: ["screening", "Revise Screening", "SCREENING", 1],
  },
  {
    name: "screening approved",
    inputs: { screening: approved },
    steps: ["approved", "not_started", "locked", "locked"],
    status: "in_progress",
    percent: 25,
    next: ["assessment", "Start Assessment", "ASSESSMENT", 2],
  },
  {
    name: "assessment draft",
    inputs: { screening: approved, assessment: { status: "draft" } },
    steps: ["approved", "in_progress", "locked", "locked"],
    status: "in_progress",
    percent: 38,
    next: ["assessment", "Continue Assessment", "ASSESSMENT", 2],
  },
  {
    name: "assessment submitted",
    inputs: { screening: approved, assessment: { status: "submitted" } },
    steps: ["approved", "submitted", "locked", "locked"],
    status: "in_progress",
    percent: 38,
    next: ["assessment", "Pending Approval", "ASSESSMENT", 2],
  },
  {
    name: "assessment rejected",
    inputs: { screening: approved, assessment: { status: "rejected" } },
    steps: ["approved", "rejected", "locked", "locked"],
    status: "needs_action",
    percent: 38,
    next: ["assessment", "Revise Assessment", "ASSESSMENT", 2],
  },
  {
    name: "assessment approved",
    inputs: { screening: approved, assessment: approved },
    steps: ["approved", "approved", "not_started", "locked"],
    status: "in_progress",
    percent: 50,
    next: ["semp", "Complete Management Plan (SEMP)", "SEMP", 3],
  },
  {
    name: "SEMP with Tool 3 rows only",
    inputs: { screening: approved, assessment: approved, activities: [activity()] },
    steps: ["approved", "approved", "in_progress", "locked"],
    status: "in_progress",
    percent: 63,
    next: ["semp", "Complete Management Plan (SEMP)", "SEMP", 3],
  },
  {
    name: "SEMP with an undescribed row",
    inputs: {
      screening: approved,
      assessment: approved,
      activities: [activity(), activity("  ")],
      plans: [plan()],
    },
    steps: ["approved", "approved", "in_progress", "locked"],
    status: "in_progress",
    percent: 63,
    next: ["semp", "Complete Management Plan (SEMP)", "SEMP", 3],
  },
  {
    name: "SEMP complete",
    inputs: { screening: approved, assessment: approved, ...semp },
    steps: ["approved", "approved", "completed", "not_started"],
    status: "in_progress",
    percent: 75,
    next: ["monitoring", "Start Monitoring", "MONITORING", 5],
  },
  {
    // A record with only its baseline is already work done (owner, phase 4).
    name: "monitoring record with a baseline only",
    inputs: {
      screening: approved,
      assessment: approved,
      ...semp,
      records: [{ scores: { baseline: "10" } }],
    },
    steps: ["approved", "approved", "completed", "in_progress"],
    status: "monitoring",
    percent: 88,
    next: ["monitoring", "Start Monitoring", "MONITORING", 5],
  },
  {
    name: "monitoring record with nothing filled yet",
    inputs: { screening: approved, assessment: approved, ...semp, records: [{}] },
    steps: ["approved", "approved", "completed", "in_progress"],
    status: "monitoring",
    percent: 88,
    next: ["monitoring", "Start Monitoring", "MONITORING", 5],
  },
  {
    name: "monitoring in progress",
    inputs: {
      screening: approved,
      assessment: approved,
      ...semp,
      records: [{ scores: { Q1: "5", Q2: "" } }],
    },
    steps: ["approved", "approved", "completed", "in_progress"],
    status: "monitoring",
    percent: 88,
    next: ["monitoring", "Start Monitoring", "MONITORING", 5],
  },
  {
    name: "monitoring complete",
    inputs: {
      screening: approved,
      assessment: approved,
      ...semp,
      records: [{ scores: { Q1: "5", Q2: "n/a", Q3: "7", Q4: "done" } }, { scores: {} }],
    },
    steps: ["approved", "approved", "completed", "completed"],
    status: "completed",
    percent: 100,
    next: ["monitoring", "Monitoring Complete", "MONITORING", 5],
  },
];

describe("computeWorkflow (D30)", () => {
  it.each(stages)("$name", ({ inputs, steps, status, percent, next }) => {
    const workflow = computeWorkflow(inputs);
    const [step, label, route, tool] = next;

    expect(Object.values(statuses(workflow))).toEqual(steps);
    expect(workflow.status).toBe(status);
    expect(workflow.percent_complete).toBe(percent);
    expect(workflow.current_step).toBe(step);
    expect(workflow.next_action).toMatchObject({ step, label, route, tool });
    expect(workflow.next_action.description).toEqual(expect.any(String));
  });

  it("counts SEMP rows and described rows", () => {
    const { steps } = computeWorkflow({
      screening: approved,
      assessment: approved,
      activities: [activity(), activity(""), activity()],
      plans: [plan()],
    });
    expect(steps.semp).toMatchObject({
      tools: [3, 4],
      management_activities: { count: 3, described: 2, status: "in_progress" },
      mitigation_plans: { count: 1, described: 1, status: "completed" },
    });
  });

  it("gives each SEMP table its own status", () => {
    const { steps } = computeWorkflow({
      screening: approved,
      assessment: approved,
      activities: [],
      plans: [plan("")],
    });
    expect(steps.semp.status).toBe("in_progress");
    expect(steps.semp.management_activities).toEqual({
      count: 0,
      described: 0,
      status: "not_started",
    });
    expect(steps.semp.mitigation_plans.status).toBe("in_progress");
  });

  it("counts filled quarters per quarter and complete records", () => {
    const { steps } = computeWorkflow({
      screening: approved,
      assessment: approved,
      ...semp,
      records: [
        { scores: { Q1: "1", Q2: "2", Q3: "3", Q4: "4" } },
        { scores: { Q1: "x", Q3: " " } },
        {},
      ],
    });
    expect(steps.monitoring).toEqual({
      tool: 5,
      status: "completed",
      records: 3,
      complete_records: 1,
      quarters_filled: { Q1: 2, Q2: 1, Q3: 1, Q4: 1 },
    });
  });

  it("keeps later steps locked while an earlier one is not approved, whatever their rows", () => {
    // Rows left over from before a status change never unlock a later step on their own.
    const workflow = computeWorkflow({
      screening: approved,
      assessment: { status: "submitted" },
      ...semp,
      records: [{ scores: { Q1: "1", Q2: "2", Q3: "3", Q4: "4" } }],
    });
    expect(statuses(workflow)).toMatchObject({ semp: "locked", monitoring: "locked" });
  });
});

describe("workflow state through the API", () => {
  it("category E follows the same order as every other category (D12)", async () => {
    const { token } = await loginAs("viewer");
    const project = await createProject({ stage: "screening_approved" });
    await Screening.updateOne({ project: project._id }, { category_code: "E" });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/workspace`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(statuses(res.body.data.workflow)).toEqual({
      screening: "approved",
      assessment: "not_started",
      semp: "locked",
      monitoring: "locked",
    });
  });

  it("an archived project keeps its workflow state (read-only, not reset)", async () => {
    const { token } = await loginAs("environmental_specialist");
    const project = await createProject({ stage: "semp_complete", archived: true });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}/workspace`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.project.archived).toBe(true);
    expect(statuses(res.body.data.workflow)).toEqual({
      screening: "approved",
      assessment: "approved",
      semp: "completed",
      monitoring: "not_started",
    });
  });

  it("the gates use the same state: monitoring opens exactly when SEMP is completed", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "semp_complete" });
    // One undescribed row makes SEMP in_progress → the monitoring gate closes.
    await ManagementActivity.collection.insertOne({ project: project._id });
    await seedLookups();
    const body = { records: [{ indicator: String((await Indicator.findOne())._id) }] };
    const save = () =>
      request(app).put(`/api/v1/projects/${project._id}/monitoring`).set(auth(token)).send(body);

    const blocked = await save();
    expect(blocked.status).toBe(409);

    await ManagementActivity.deleteMany({ project: project._id, activity_description: null });
    const allowed = await save();
    expect(allowed.status).toBe(200);
    expect(await MonitoringRecord.countDocuments({ project: project._id })).toBe(1);
  });
});
