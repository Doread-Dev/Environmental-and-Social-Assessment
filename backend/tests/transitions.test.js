import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose } from "./helpers/app.js";
import {
  EDITOR_ROLES,
  createProject as createStagedProject,
  createUser,
  loginAs,
} from "./helpers/fixtures.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Screening and assessment share the same transition rules; run every test for both.
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

describe.each(kinds)("$name status transitions", ({ base, stage, body }) => {
  const createProject = () => createStagedProject({ stage });

  async function setup() {
    const editor = await loginAs("project_manager");
    const specialist = await loginAs("environmental_specialist");
    const project = await createProject();
    const created = await request(app)
      .post(base)
      .set(auth(editor.token))
      .send(body(project._id.toString()));
    expect(created.status).toBe(201);
    return { editor, specialist, project, id: created.body.data._id };
  }

  const patch = (id, action, token, payload = {}) =>
    request(app).patch(`${base}/${id}/${action}`).set(auth(token)).send(payload);

  it("ignores status and approval fields sent on create (D1, D5)", async () => {
    const editor = await loginAs("project_manager");
    const { user: other } = await createUser("environmental_specialist");
    const project = await createProject();

    const res = await request(app)
      .post(base)
      .set(auth(editor.token))
      .send({
        ...body(project._id.toString()),
        status: "approved",
        approved_by: other._id.toString(),
        reject_by: other._id.toString(),
        officer: other._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.approved_by).toBeUndefined();
    expect(res.body.data.reject_by).toBeUndefined();
    expect(res.body.data.officer._id).toBe(editor.user._id.toString());
  });

  it("PUT with status: approved does not change the status", async () => {
    const { editor, id } = await setup();

    const res = await request(app)
      .put(`${base}/${id}`)
      .set(auth(editor.token))
      .send({ status: "approved", approved_by: editor.user._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.approved_by).toBeUndefined();
  });

  it("ignores recommendations on create and PUT; only approve sets them (D63 a)", async () => {
    const editor = await loginAs("project_manager");
    const specialist = await loginAs("environmental_specialist");
    const project = await createProject();

    const created = await request(app)
      .post(base)
      .set(auth(editor.token))
      .send({ ...body(project._id.toString()), recommendations: "Self-recommended" });
    expect(created.status).toBe(201);
    expect(created.body.data.recommendations).toBeUndefined();
    const id = created.body.data._id;

    const put = await request(app)
      .put(`${base}/${id}`)
      .set(auth(editor.token))
      .send({ recommendations: "Edited by the editor" });
    expect(put.status).toBe(200);
    expect(put.body.data.recommendations).toBeUndefined();

    await patch(id, "submit", editor.token);
    const approved = await patch(id, "approve", specialist.token, { recommendations: "Approver" });
    expect(approved.body.data.recommendations).toBe("Approver");
  });

  it("goes draft → submitted → approved and records who did what", async () => {
    const { editor, specialist, id } = await setup();

    const submitted = await patch(id, "submit", editor.token);
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.status).toBe("submitted");
    expect(submitted.body.data.officer._id).toBe(editor.user._id.toString());

    const approved = await patch(id, "approve", specialist.token, { recommendations: "Go on" });
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("approved");
    expect(approved.body.data.approved_by._id).toBe(specialist.user._id.toString());
    expect(approved.body.data.recommendations).toBe("Go on");
  });

  it("goes submitted → rejected → submitted again", async () => {
    const { editor, specialist, id } = await setup();
    await patch(id, "submit", editor.token);

    const rejected = await patch(id, "reject", specialist.token, { reject_reason: "Incomplete" });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe("rejected");
    expect(rejected.body.data.reject_by._id).toBe(specialist.user._id.toString());
    expect(rejected.body.data.reject_reason).toBe("Incomplete");

    const resubmitted = await patch(id, "submit", editor.token);
    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body.data.status).toBe("submitted");
  });

  it("lets a specialist approve work they created themselves (D10)", async () => {
    const specialist = await loginAs("environmental_specialist");
    const project = await createProject();
    const created = await request(app)
      .post(base)
      .set(auth(specialist.token))
      .send(body(project._id.toString()));
    const id = created.body.data._id;

    await patch(id, "submit", specialist.token);
    const res = await patch(id, "approve", specialist.token);

    expect(res.status).toBe(200);
    expect(res.body.data.officer._id).toBe(specialist.user._id.toString());
    expect(res.body.data.approved_by._id).toBe(specialist.user._id.toString());
  });

  it.each([
    ["approve", "draft"],
    ["reject", "draft"],
  ])("cannot %s a %s record (409)", async (action) => {
    const { specialist, id } = await setup();
    const res = await patch(id, action, specialist.token);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("cannot submit twice, or approve/reject/submit an approved record (409)", async () => {
    const { editor, specialist, id } = await setup();
    await patch(id, "submit", editor.token);
    expect((await patch(id, "submit", editor.token)).status).toBe(409);

    await patch(id, "approve", specialist.token);
    expect((await patch(id, "approve", specialist.token)).status).toBe(409);
    expect((await patch(id, "reject", specialist.token)).status).toBe(409);
    expect((await patch(id, "submit", editor.token)).status).toBe(409);
  });

  it("lets only one of two concurrent approve/reject calls win", async () => {
    const { editor, specialist, id } = await setup();
    await patch(id, "submit", editor.token);

    const results = await Promise.all([
      patch(id, "approve", specialist.token),
      patch(id, "reject", specialist.token),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it("returns 404 for an unknown id", async () => {
    const { editor } = await setup();
    const res = await patch(new mongoose.Types.ObjectId(), "submit", editor.token);
    expect(res.status).toBe(404);
  });

  it.each(EDITOR_ROLES)("%s can submit", async (role) => {
    const { id } = await setup();
    const { token } = await loginAs(role);
    expect((await patch(id, "submit", token)).status).toBe(200);
  });

  it("viewer cannot submit (403)", async () => {
    const { id } = await setup();
    const { token } = await loginAs("viewer");
    expect((await patch(id, "submit", token)).status).toBe(403);
  });

  it.each(["program_manager", "project_manager", "environmental_focal_point", "viewer"])(
    "%s cannot approve or reject (403)",
    async (role) => {
      const { editor, id } = await setup();
      await patch(id, "submit", editor.token);
      const { token } = await loginAs(role);

      expect((await patch(id, "approve", token)).status).toBe(403);
      expect((await patch(id, "reject", token)).status).toBe(403);
    }
  );

  it.each(["environmental_specialist", "admin"])("%s can approve", async (role) => {
    const { editor, id } = await setup();
    await patch(id, "submit", editor.token);
    const { token } = await loginAs(role);

    const res = await patch(id, "approve", token);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
  });
});
