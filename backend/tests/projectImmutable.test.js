import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");

const createProject = (title) =>
  Project.create({
    title,
    location: "Aleppo",
    start_date: new Date("2026-01-01"),
    end_date: new Date("2026-12-31"),
  });

// Every project-owned record that has an update endpoint (D58).
const kinds = [
  {
    name: "screening",
    base: "/api/v1/screenings",
    body: { category_code: "B", category_reason: "Urban works" },
  },
  {
    name: "assessment",
    base: "/api/v1/assessments",
    body: { project_activity: "Pipes", description: "Replace pipes" },
  },
  {
    name: "management activity",
    base: "/api/v1/management",
    body: { activity_description: "Dig" },
  },
  { name: "mitigation plan", base: "/api/v1/mitigation", body: { output_description: "Network" } },
  {
    name: "monitoring record",
    base: "/api/v1/monitoring",
    body: { indicator: new mongoose.Types.ObjectId().toString() },
  },
];

describe.each(kinds)("PUT $name", ({ base, body }) => {
  async function setup() {
    const { token } = await loginAs("project_manager");
    const project = await createProject("Own");
    const other = await createProject("Other");
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
