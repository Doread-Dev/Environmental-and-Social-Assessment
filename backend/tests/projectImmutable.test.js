import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

// Every project-owned record that has an update endpoint (D58).
const kinds = [
  {
    name: "screening",
    stage: "new",
    base: "/api/v1/screenings",
    body: { category_code: "B", category_reason: "Urban works" },
  },
  {
    name: "assessment",
    stage: "screening_approved",
    base: "/api/v1/assessments",
    body: { project_activity: "Pipes", description: "Replace pipes" },
  },
  {
    name: "management activity",
    stage: "assessment_approved",
    base: "/api/v1/management",
    body: { activity_description: "Dig" },
  },
  {
    name: "mitigation plan",
    stage: "assessment_approved",
    base: "/api/v1/mitigation",
    body: { output_description: "Network" },
  },
  {
    name: "monitoring record",
    stage: "semp_complete",
    base: "/api/v1/monitoring",
    body: { indicator: new mongoose.Types.ObjectId().toString() },
  },
];

describe.each(kinds)("PUT $name", ({ base, stage, body }) => {
  async function setup() {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage, title: "Own" });
    const other = await createProject({ stage, title: "Other" });
    const created = await request(app)
      .post(base)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, project: project._id.toString() });
    expect(created.status).toBe(201);
    return { token, project, other, id: created.body.data._id };
  }

  it("rejects moving the record to another project (400)", async () => {
    const { token, other, id } = await setup();

    const res = await request(app)
      .put(`${base}/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, project: other._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "project cannot be changed" });
  });

  it("accepts the same project id (clients send the whole record)", async () => {
    const { token, project, id } = await setup();

    const res = await request(app)
      .put(`${base}/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...body, project: project._id.toString() });

    expect(res.status).toBe(200);
    expect(String(res.body.data.project._id ?? res.body.data.project)).toBe(project._id.toString());
  });
});
