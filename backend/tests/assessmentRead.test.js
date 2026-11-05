import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const ImpactQuestion = require("../../src/models/impactQuestion.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// D63 c: the assessment pages read Tool 2 in one request.
describe("GET /assessments/project/:projectId embeds methods, consultations and scores", () => {
  it("returns the assessment with its children", async () => {
    await seedLookups();
    const { token } = await loginAs("project_manager");
    const project = await createProject({
      stage: "screening_approved",
      project_component: "Pipes",
    });
    const created = await request(app)
      .post("/api/v1/assessments")
      .set(auth(token))
      .send({ project: project._id.toString(), description: "Replace pipes" });
    expect(created.status).toBe(201);
    // the create answers the same shape, so the page needs no second read
    expect(created.body.data.methods).toEqual([]);
    expect(created.body.data.consultations).toEqual([]);
    expect(created.body.data.scores).toHaveLength(50);

    const id = created.body.data._id;
    await request(app)
      .put(`/api/v1/assessments/${id}/methods`)
      .set(auth(token))
      .send([{ method_type: "field_visits", details: "Two visits" }]);
    await request(app)
      .put(`/api/v1/assessments/${id}/consultations`)
      .set(auth(token))
      .send([{ type: "community_interviews", participants: "12", notes: "Village A" }]);
    const question = await ImpactQuestion.findOne();
    await request(app)
      .post(`/api/v1/assessments/${id}/scores`)
      .set(auth(token))
      .send([{ question: question._id.toString(), level: "high", note: "Dust" }]);

    const res = await request(app)
      .get(`/api/v1/assessments/project/${project._id}`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
    expect(res.body.data.officer.name).toBeTruthy();
    expect(res.body.data.methods).toEqual([
      expect.objectContaining({ method_type: "field_visits", details: "Two visits" }),
    ]);
    expect(res.body.data.consultations).toEqual([
      expect.objectContaining({ type: "community_interviews", participants: "12" }),
    ]);
    expect(res.body.data.scores).toHaveLength(50);
    expect(res.body.data.scores.find((s) => s.question === question._id.toString())).toEqual(
      expect.objectContaining({ level: "high", note: "Dust" })
    );
  });

  it("answers null when the assessment is not started (D34)", async () => {
    const { token } = await loginAs("viewer");
    const project = await createProject({ stage: "screening_approved" });
    const res = await request(app)
      .get(`/api/v1/assessments/project/${project._id}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});
