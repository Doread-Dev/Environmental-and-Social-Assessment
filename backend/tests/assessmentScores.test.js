import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups, withVersion } from "./helpers/fixtures.js";

const Screening = require("../../src/models/screening.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const AssessmentImpactScore = require("../../src/models/assessmentImpactScore.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function setup({ component = "Water network rehabilitation", body = {} } = {}) {
  await seedLookups();
  const { token } = await loginAs("project_manager");
  const project = await createProject({
    stage: "screening_approved",
    project_component: component,
  });
  await Screening.updateOne(
    { project: project._id },
    { potential_negative: "Dust and noise", potential_positive: "Clean water" }
  );
  const res = await request(app)
    .post("/api/v1/assessments")
    .set(auth(token))
    .send({ project: project._id.toString(), description: "Replace pipes", ...body });
  return { token, project, res };
}

// Scores are sent with the version the client loaded (D62).
const scores = async (id, token, payload) => {
  const url = `/api/v1/assessments/${id}/scores`;
  return request(app)
    .post(url)
    .set(auth(token))
    .send(await withVersion(url, { scores: payload }));
};

// D69 replaces D53: inputs start empty, nothing is copied from the project or Tool 1.
describe("no prefill on create (D69)", () => {
  it("leaves project activity and potential impacts empty although the project and screening have them", async () => {
    const { res } = await setup({ body: { description: "" } });

    expect(res.status).toBe(201);
    expect(res.body.data.project_activity).toBeUndefined();
    expect(res.body.data.description).toBe("");
    expect(res.body.data.potential_negative_impact).toBeUndefined();
    expect(res.body.data.potential_positive_impact).toBeUndefined();
  });

  it("keeps the values the user sent", async () => {
    const { res } = await setup({
      body: { project_activity: "Own activity", potential_negative_impact: "Own negative" },
    });

    expect(res.body.data.project_activity).toBe("Own activity");
    expect(res.body.data.potential_negative_impact).toBe("Own negative");
    expect(res.body.data.potential_positive_impact).toBeUndefined();
  });

  it("can be created with no fields at all", async () => {
    const { res } = await setup({ body: { description: undefined } });
    expect(res.status).toBe(201);
  });

  it("lets a draft be saved with an empty project activity", async () => {
    const { token, res } = await setup({ body: { project_activity: "Pipes" } });
    const put = await request(app)
      .put(`/api/v1/assessments/${res.body.data._id}`)
      .set(auth(token))
      .send(
        await withVersion(`/api/v1/assessments/${res.body.data._id}`, { project_activity: "" })
      );
    expect(put.status).toBe(200);
  });
});

describe("required fields are checked at submit (D57, D69)", () => {
  const submit = async (id, token) => {
    const url = `/api/v1/assessments/${id}/submit`;
    return request(app)
      .patch(url)
      .set(auth(token))
      .send(await withVersion(url));
  };

  it("submit without project activity and description → 400, nothing changes", async () => {
    const { token, res } = await setup({ body: { description: "" } });
    const sent = await submit(res.body.data._id, token);

    expect(sent.status).toBe(400);
    expect(sent.body.error).toBe("Fill in Project activity and Description before submitting");
    const read = await request(app)
      .get(`/api/v1/assessments/${res.body.data._id}`)
      .set(auth(token));
    expect(read.body.data.status).toBe("draft");
  });

  it("submit without project activity only → 400 naming it", async () => {
    const { token, res } = await setup();
    const sent = await submit(res.body.data._id, token);
    expect(sent.status).toBe(400);
    expect(sent.body.error).toBe("Fill in Project activity before submitting");
  });

  it("submits once both are filled", async () => {
    const { token, res } = await setup({ body: { project_activity: "Pipes" } });
    expect((await submit(res.body.data._id, token)).status).toBe(200);
  });
});

describe("default scores and total impact (D54)", () => {
  it("creates one Negligible score per question, total impact Negligible", async () => {
    const { token, res } = await setup();
    const questions = await ImpactQuestion.countDocuments();
    const id = res.body.data._id;

    expect(questions).toBe(50);
    expect(res.body.data.scores).toHaveLength(50);
    const read = await request(app)
      .get(`/api/v1/assessments/project/${res.body.data.project._id}`)
      .set(auth(token));
    expect(read.body.data._id).toBe(id);
    expect(read.body.data.scores).toHaveLength(50);
    expect(read.body.data.scores.every((s) => s.level === "negligible")).toBe(true);
    expect(res.body.data.total_project_impact).toBe("negligible");
    expect(res.body.data.total_project_score.negligible).toBe(50);
  });

  it("changes only the scores sent and recalculates the total without a calculate call", async () => {
    const { token, res } = await setup();
    const id = res.body.data._id;
    const [first, second] = await ImpactQuestion.find().limit(2);

    const saved = await scores(id, token, [
      { question: first._id.toString(), level: "high", note: "Trees cut" },
    ]);
    expect(saved.status).toBe(201);
    // The assessment with its children, so the client gets the new version and totals.
    expect(saved.body.data.scores).toHaveLength(50);
    expect(saved.body.data.total_project_impact).toBe("high");

    let assessment = (await request(app).get(`/api/v1/assessments/${id}`).set(auth(token))).body
      .data;
    expect(assessment.total_project_impact).toBe("high");
    expect(assessment.total_project_score).toMatchObject({ high: 1, negligible: 49 });

    await scores(id, token, [
      { question: first._id.toString(), level: "low" },
      { question: second._id.toString(), level: "medium" },
    ]);
    assessment = (await request(app).get(`/api/v1/assessments/${id}`).set(auth(token))).body.data;
    expect(assessment.total_project_impact).toBe("medium");
  });

  it("rejects a question twice in one payload (400)", async () => {
    const { token, res } = await setup();
    const q = (await ImpactQuestion.findOne())._id.toString();

    const r = await scores(res.body.data._id, token, [
      { question: q, level: "low" },
      { question: q, level: "high" },
    ]);
    expect(r.status).toBe(400);
  });

  it("rejects scores for questions that do not exist (400)", async () => {
    const { token, res } = await setup();
    const r = await scores(res.body.data._id, token, [
      { question: new mongoose.Types.ObjectId().toString(), level: "low" },
    ]);
    expect(r.status).toBe(400);
  });

  it("refuses to submit when a question has no level (safety check)", async () => {
    const { token, res } = await setup({ body: { project_activity: "Pipes" } });
    const id = res.body.data._id;
    await AssessmentImpactScore.deleteOne({ assessment: id });

    const url = `/api/v1/assessments/${id}/submit`;
    const r = await request(app)
      .patch(url)
      .set(auth(token))
      .send(await withVersion(url));
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/1 missing/);
  });

  it("enforces one score per (assessment, question) in the database", async () => {
    const { res } = await setup();
    await AssessmentImpactScore.init();
    const existing = await AssessmentImpactScore.findOne({ assessment: res.body.data._id });

    await expect(
      AssessmentImpactScore.create({
        assessment: existing.assessment,
        question: existing.question,
        level: "low",
      })
    ).rejects.toMatchObject({ code: 11000 });
  });
});
