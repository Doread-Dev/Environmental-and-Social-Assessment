import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups, withVersion } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const Indicator = require("../../src/models/indicator.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const MAX = 30000;
const tooLong = "x".repeat(MAX + 1);
const longest = "x".repeat(MAX);
const TOO_LONG = /is too long \(at most 30,000 characters\)/;

// D74 1: a project may end on the day it starts, never before.
describe("project dates (D74 1)", () => {
  const body = (start_date, end_date) => ({
    title: "Water network",
    location: "Aleppo",
    start_date,
    end_date,
  });

  it("create: an end date before the start date → 400; the same day is allowed", async () => {
    const { token } = await loginAs("project_manager");

    const before = await request(app)
      .post("/api/v1/projects")
      .set(auth(token))
      .send(body("2026-05-10", "2026-05-09"));
    expect(before.status).toBe(400);
    expect(before.body.error).toBe("End date cannot be before the start date");
    expect(await Project.countDocuments()).toBe(0);

    const sameDay = await request(app)
      .post("/api/v1/projects")
      .set(auth(token))
      .send(body("2026-05-10", "2026-05-10"));
    expect(sameDay.status).toBe(201);
  });

  it("update: one date sent is compared with the other date as stored", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject(); // 2026-01-01 → 2026-12-31
    const url = `/api/v1/projects/${project._id}`;
    const put = async (fields) =>
      request(app)
        .put(url)
        .set(auth(token))
        .send(await withVersion(url, fields));

    const endTooEarly = await put({ end_date: "2025-12-31" });
    expect(endTooEarly.status).toBe(400);
    expect(endTooEarly.body.error).toBe("End date cannot be before the start date");

    const startTooLate = await put({ start_date: "2027-01-01" });
    expect(startTooLate.status).toBe(400);

    expect((await Project.findById(project._id)).end_date.toISOString()).toMatch(/^2026-12-31/);
    expect((await put({ end_date: "2026-01-01" })).status).toBe(200); // one-day project
    expect((await put({ start_date: "2026-02-01", end_date: "2026-03-01" })).status).toBe(200);
  });
});

// D74 5: recommendations are required to approve, in both tools (replaces D56's "optional").
describe.each([
  ["screening", "/api/v1/screenings", Screening, "new"],
  ["assessment", "/api/v1/assessments", Assessment, "screening_approved"],
])("%s approve needs recommendations (D74 5)", (_name, base, Model, stage) => {
  async function submitted() {
    const project = await createProject({ stage });
    const doc = await Model.create({
      project: project._id,
      status: "submitted",
      ...(Model === Screening ? { category_code: "B", category_reason: "Works" } : {}),
    });
    return doc._id;
  }

  it.each([
    ["missing", {}],
    ["empty", { recommendations: "" }],
    ["only spaces", { recommendations: "   " }],
  ])("%s → 400, still submitted", async (_case, payload) => {
    const { token } = await loginAs("environmental_specialist");
    const id = await submitted();

    const res = await request(app).patch(`${base}/${id}/approve`).set(auth(token)).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Recommendations are required to approve");
    expect((await Model.findById(id)).status).toBe("submitted");
  });

  it("with recommendations → approved, stored trimmed", async () => {
    const { token } = await loginAs("environmental_specialist");
    const id = await submitted();

    const res = await request(app)
      .patch(`${base}/${id}/approve`)
      .set(auth(token))
      .send({ recommendations: "  Proceed with the SEMP  " });

    expect(res.status).toBe(200);
    expect(res.body.data.recommendations).toBe("Proceed with the SEMP");
  });
});

// D74 4: every free-text field is limited to 30,000 characters (a maximum, not a D57 minimum).
describe("free text is limited to 30,000 characters (D74 4)", () => {
  async function fixture() {
    await seedLookups();
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "semp_complete" });
    const draftProject = await createProject({ stage: "screening_approved" });
    const assessment = await Assessment.create({ project: draftProject._id });
    const newProject = await createProject();
    const screening = await Screening.create({
      project: newProject._id,
      category_code: "B",
      category_reason: "Works",
      status: "submitted",
    });
    const question = String((await ImpactQuestion.findOne())._id);
    const indicator = String((await Indicator.findOne())._id);
    const freshProject = await createProject();
    return { token, project, assessment, screening, question, indicator, freshProject };
  }

  // [name, method, url(ids), body(text, ids)] — one free-text field of each write
  const writes = [
    ["project title", "put", (i) => `/projects/${i.project._id}`, (t) => ({ title: t })],
    [
      "project component",
      "post",
      () => "/projects",
      (t) => ({
        title: "P",
        location: "L",
        start_date: "2026-01-01",
        end_date: "2026-02-01",
        project_component: t,
      }),
    ],
    [
      "screening justification",
      "post",
      () => "/screenings",
      (t, i) => ({
        project: String(i.freshProject._id),
        category_code: "B",
        category_reason: t,
      }),
    ],
    [
      "approve recommendations",
      "patch",
      (i) => `/screenings/${i.screening._id}/approve`,
      (t) => ({
        recommendations: t,
      }),
    ],
    [
      "reject reason",
      "patch",
      (i) => `/screenings/${i.screening._id}/reject`,
      (t) => ({
        reject_reason: t,
      }),
    ],
    [
      "assessment description",
      "put",
      (i) => `/assessments/${i.assessment._id}`,
      (t) => ({
        description: t,
      }),
    ],
    [
      "method details",
      "put",
      (i) => `/assessments/${i.assessment._id}/methods`,
      (t) => ({
        methods: [{ method_type: "field_visits", details: t }],
      }),
    ],
    [
      "consultation participants",
      "put",
      (i) => `/assessments/${i.assessment._id}/consultations`,
      (t) => ({
        consultations: [{ type: "village_meetings", participants: t }],
      }),
    ],
    [
      "score note",
      "post",
      (i) => `/assessments/${i.assessment._id}/scores`,
      (t, i) => ({
        scores: [{ question: i.question, level: "low", note: t }],
      }),
    ],
    [
      "Tool 3 notes",
      "put",
      (i) => `/projects/${i.project._id}/management`,
      (t) => ({
        rows: [{ activity_description: "Dig", notes: t }],
      }),
    ],
    [
      "Tool 4 schedule",
      "put",
      (i) => `/projects/${i.project._id}/mitigation`,
      (t) => ({
        rows: [{ output_description: "Network", schedule: t }],
      }),
    ],
    [
      "monitoring quarter value",
      "put",
      (i) => `/projects/${i.project._id}/monitoring`,
      (t, i) => ({
        records: [{ indicator: i.indicator, scores: { Q1: t } }],
      }),
    ],
    [
      "monitoring total",
      "put",
      (i) => `/projects/${i.project._id}/monitoring`,
      (t, i) => ({
        records: [{ indicator: i.indicator, total: t }],
      }),
    ],
  ];

  it.each(writes)("%s: 30,001 characters → 400; 30,000 pass", async (_name, method, url, body) => {
    const ids = await fixture();
    const path = `/api/v1${url(ids)}`;
    const send = async (value) =>
      request(app)
        [method](path)
        .set(auth(ids.token))
        .send(await withVersion(path, body(value, ids)));

    const refused = await send(tooLong);
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatch(TOO_LONG);

    const accepted = await send(longest);
    expect(accepted.status).toBeLessThan(300);
  });
});
