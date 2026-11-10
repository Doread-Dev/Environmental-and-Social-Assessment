import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Creating the same record twice → 409 (D18, D58). Monitoring records are upserted by
// indicator (PUT /projects/:id/monitoring), so they cannot be created twice; the index below
// still backs that up.
const kinds = [
  {
    name: "screening",
    base: "/api/v1/screenings",
    stage: "new",
    body: (project) => ({ project, category_code: "B", category_reason: "R" }),
  },
  {
    name: "assessment",
    base: "/api/v1/assessments",
    stage: "screening_approved",
    body: (project) => ({ project, project_activity: "A", description: "B" }),
  },
];

describe.each(kinds)("duplicate $name", ({ base, stage, body }) => {
  it("returns 409 on the second create", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage });
    const payload = body(project._id.toString());

    expect((await request(app).post(base).set(auth(token)).send(payload)).status).toBe(201);
    const second = await request(app).post(base).set(auth(token)).send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already exists/);
  });
});

describe("unique indexes back the checks up", () => {
  it.each([
    ["Screening", Screening, (project) => ({ project, category_code: "B", category_reason: "R" })],
    ["Assessment", Assessment, (project) => ({ project, project_activity: "A", description: "B" })],
    [
      "MonitoringRecord",
      MonitoringRecord,
      (project) => ({ project, indicator: "64b000000000000000000001" }),
    ],
  ])("%s", async (_name, Model, doc) => {
    await Model.init();
    const project = await createProject();
    await Model.create(doc(project._id));
    await expect(Model.create(doc(project._id))).rejects.toMatchObject({ code: 11000 });
  });
});
