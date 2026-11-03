import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const ManagementActivity = require("../../src/models/managementActivity.model");

// Every project-owned record that has its own update endpoint (D58). Tools 3–5 are saved per
// project (PUT /projects/:id/...), so their rows take the project from the URL (below).
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

describe("bulk saves take the project from the URL (D32, D58)", () => {
  it("ignores a project id sent in a row", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "assessment_approved", title: "Own" });
    const other = await createProject({ stage: "assessment_approved", title: "Other" });

    const res = await request(app)
      .put(`/api/v1/projects/${project._id}/management`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [{ project: other._id.toString(), activity_description: "Dig" }] });

    expect(res.status).toBe(200);
    expect(await ManagementActivity.countDocuments({ project: project._id })).toBe(1);
    expect(await ManagementActivity.countDocuments({ project: other._id })).toBe(0);
  });
});
