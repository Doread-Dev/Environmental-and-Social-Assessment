import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose } from "./helpers/app.js";
import { createProject, createUser, loginAs } from "./helpers/fixtures.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Responsible = an internal user OR free text, never both (D55).
const kinds = [
  {
    name: "management activity",
    base: "/api/v1/management",
    stage: "assessment_approved",
    body: (project) => ({ project, activity_description: "Dig" }),
  },
  {
    name: "mitigation plan",
    base: "/api/v1/mitigation",
    stage: "assessment_approved",
    body: (project) => ({ project, output_description: "Network" }),
  },
  {
    name: "monitoring record",
    base: "/api/v1/monitoring",
    stage: "semp_complete",
    body: (project) => ({ project, indicator: new mongoose.Types.ObjectId().toString() }),
  },
];

const responsibleId = (data) => data.responsible?._id ?? data.responsible ?? null;

describe.each(kinds)("$name responsible", ({ base, stage, body }) => {
  async function setup() {
    const { token } = await loginAs("project_manager");
    const { user } = await createUser("environmental_focal_point");
    const project = await createProject({ stage });
    return { token, user, payload: body(project._id.toString()) };
  }

  it("accepts a user", async () => {
    const { token, user, payload } = await setup();
    const res = await request(app)
      .post(base)
      .set(auth(token))
      .send({ ...payload, responsible: user._id.toString() });
    expect(res.status).toBe(201);
    expect(String(responsibleId(res.body.data))).toBe(user._id.toString());
    expect(res.body.data.responsible_text).toBe("");
  });

  it("accepts an external party as text", async () => {
    const { token, payload } = await setup();
    const res = await request(app)
      .post(base)
      .set(auth(token))
      .send({ ...payload, responsible_text: "  Contractor Ltd  " });
    expect(res.status).toBe(201);
    expect(res.body.data.responsible_text).toBe("Contractor Ltd");
    expect(responsibleId(res.body.data)).toBeNull();
  });

  it("rejects both (400)", async () => {
    const { token, user, payload } = await setup();
    const res = await request(app)
      .post(base)
      .set(auth(token))
      .send({ ...payload, responsible: user._id.toString(), responsible_text: "Contractor" });
    expect(res.status).toBe(400);
  });

  it("switching to text on update clears the user", async () => {
    const { token, user, payload } = await setup();
    const created = await request(app)
      .post(base)
      .set(auth(token))
      .send({ ...payload, responsible: user._id.toString() });

    const res = await request(app)
      .put(`${base}/${created.body.data._id}`)
      .set(auth(token))
      .send({ ...payload, responsible_text: "Municipality" });

    expect(res.status).toBe(200);
    expect(res.body.data.responsible_text).toBe("Municipality");
    expect(responsibleId(res.body.data)).toBeNull();
  });
});
