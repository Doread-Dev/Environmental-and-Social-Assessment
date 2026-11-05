import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const ImpactQuestion = require("../../src/models/impactQuestion.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const kinds = [
  {
    name: "screening",
    base: "/api/v1/screenings",
    stage: "new",
    body: (project) => ({ project, category_code: "B", category_reason: "Urban works" }),
  },
  {
    name: "assessment",
    base: "/api/v1/assessments",
    stage: "screening_approved",
    body: (project) => ({ project, project_activity: "Pipes", description: "Replace pipes" }),
  },
];

describe.each(kinds)("$name locking (D13) and status history (D16)", ({ base, stage, body }) => {
  async function setup() {
    const editor = await loginAs("project_manager");
    const specialist = await loginAs("environmental_specialist");
    const project = await createProject({ stage });
    const created = await request(app)
      .post(base)
      .set(auth(editor.token))
      .send(body(project._id.toString()));
    expect(created.status).toBe(201);
    return { editor, specialist, id: created.body.data._id };
  }

  const patch = (id, action, token, payload = {}) =>
    request(app).patch(`${base}/${id}/${action}`).set(auth(token)).send(payload);
  const put = (id, token) =>
    request(app)
      .put(`${base}/${id}`)
      .set(auth(token))
      // one content field of each kind (the other is stripped)
      .send({ potential_negative: "Edited", environmental_setting: "Edited" });

  it("can be edited while draft", async () => {
    const { editor, id } = await setup();
    expect((await put(id, editor.token)).status).toBe(200);
  });

  it("is locked once submitted, and stays locked once approved (409)", async () => {
    const { editor, specialist, id } = await setup();

    await patch(id, "submit", editor.token);
    const submitted = await put(id, editor.token);
    expect(submitted.status).toBe(409);
    expect(submitted.body.error).toMatch(/submitted/);

    await patch(id, "approve", specialist.token);
    expect((await put(id, specialist.token)).status).toBe(409);
  });

  it("becomes editable again when rejected", async () => {
    const { editor, specialist, id } = await setup();
    await patch(id, "submit", editor.token);
    await patch(id, "reject", specialist.token, { reject_reason: "Fix it" });

    expect((await put(id, editor.token)).status).toBe(200);
  });

  it("records created / submitted / rejected / submitted / approved with user and time", async () => {
    const { editor, specialist, id } = await setup();
    await patch(id, "submit", editor.token);
    await patch(id, "reject", specialist.token, { reject_reason: "Fix it" });
    await patch(id, "submit", editor.token);
    const res = await patch(id, "approve", specialist.token);

    const history = res.body.data.status_history;
    expect(history.map((h) => h.status)).toEqual([
      "created",
      "submitted",
      "rejected",
      "submitted",
      "approved",
    ]);
    expect(history.map((h) => h.by.name)).toEqual([
      editor.user.name,
      editor.user.name,
      specialist.user.name,
      editor.user.name,
      specialist.user.name,
    ]);
    expect(history[2].note).toBe("Fix it");
    for (const entry of history) expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
  });

  it("ignores status_history sent in a body", async () => {
    const { editor, id } = await setup();
    const res = await request(app)
      .put(`${base}/${id}`)
      .set(auth(editor.token))
      .send({ status_history: [{ status: "approved" }] });
    expect(res.body.data.status_history.map((h) => h.status)).toEqual(["created"]);
  });
});

describe("assessment child edits are locked too (D13)", () => {
  async function submittedAssessment() {
    await seedLookups();
    const editor = await loginAs("project_manager");
    const project = await createProject({ stage: "screening_approved" });
    const created = await request(app)
      .post("/api/v1/assessments")
      .set(auth(editor.token))
      .send({ project: project._id.toString(), project_activity: "A", description: "B" });
    const id = created.body.data._id;
    expect(
      (await request(app).patch(`/api/v1/assessments/${id}/submit`).set(auth(editor.token))).status
    ).toBe(200);
    return { token: editor.token, id };
  }

  it("rejects methods, consultations and scores with 409", async () => {
    const { token, id } = await submittedAssessment();
    const question = await ImpactQuestion.findOne();
    const base = `/api/v1/assessments/${id}`;

    const calls = [
      request(app).put(`${base}/methods`).send([]),
      request(app).put(`${base}/consultations`).send([]),
      request(app)
        .post(`${base}/scores`)
        .send([{ question: question._id.toString(), level: "high" }]),
    ];
    for (const call of calls) {
      const res = await call.set(auth(token));
      expect(res.status).toBe(409);
    }
  });
});
