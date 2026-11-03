import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const archive = (id, token) =>
  request(app).patch(`/api/v1/projects/${id}/archive`).set(auth(token));
const restore = (id, token) =>
  request(app).patch(`/api/v1/projects/${id}/restore`).set(auth(token));

describe("DELETE a project with approved work (D17)", () => {
  it.each(["screening_approved", "assessment_approved"])(
    "refuses at stage %s (409) and keeps the data",
    async (stage) => {
      const { token } = await loginAs("environmental_specialist");
      const project = await createProject({ stage });

      const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Archive it instead/);
      expect(await Project.exists({ _id: project._id })).not.toBeNull();
      expect(await Screening.exists({ project: project._id })).not.toBeNull();
    }
  );

  it("still deletes a project whose screening is only submitted", async () => {
    const { token } = await loginAs("environmental_specialist");
    const project = await createProject();
    await Screening.create({
      project: project._id,
      category_code: "B",
      category_reason: "R",
      status: "submitted",
    });

    const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));
    expect(res.status).toBe(204);
  });
});

describe("archive / restore (D17)", () => {
  it("archives with who/when, hides from the default list, lists with ?archived=true", async () => {
    const { user, token } = await loginAs("environmental_specialist");
    const archived = await createProject({ title: "Old", stage: "screening_approved" });
    await createProject({ title: "Live" });

    const res = await archive(archived._id, token);
    expect(res.status).toBe(200);
    expect(res.body.data.archived).toBe(true);
    expect(res.body.data.archived_by.name).toBe(user.name);
    expect(res.body.data.archived_at).toBeTruthy();

    const list = await request(app).get("/api/v1/projects").set(auth(token));
    expect(list.body.data.map((p) => p.title)).toEqual(["Live"]);

    const archivedList = await request(app).get("/api/v1/projects?archived=true").set(auth(token));
    expect(archivedList.body.data.map((p) => p.title)).toEqual(["Old"]);

    // Still readable by id.
    expect(
      (await request(app).get(`/api/v1/projects/${archived._id}`).set(auth(token))).status
    ).toBe(200);
  });

  it("makes every write on the project read-only (409)", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "semp_complete" });
    await archive(project._id, token);
    const id = project._id.toString();
    const indicator = new mongoose.Types.ObjectId().toString();

    const writes = [
      request(app).put(`/api/v1/projects/${id}`).send({ title: "New" }),
      request(app).post("/api/v1/management").send({ project: id, activity_description: "X" }),
      request(app).post("/api/v1/mitigation").send({ project: id, output_description: "X" }),
      request(app).post("/api/v1/monitoring").send({ project: id, indicator }),
    ];
    for (const write of writes) {
      const res = await write.set(auth(token));
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/archived/);
    }
  });

  it("blocks screening edits and transitions on an archived project", async () => {
    const { token } = await loginAs("environmental_specialist");
    const project = await createProject();
    const created = await request(app)
      .post("/api/v1/screenings")
      .set(auth(token))
      .send({ project: project._id.toString(), category_code: "B", category_reason: "R" });
    const id = created.body.data._id;
    await archive(project._id, token);

    const edit = await request(app).put(`/api/v1/screenings/${id}`).set(auth(token)).send({});
    expect(edit.status).toBe(409);
    expect(
      (await request(app).patch(`/api/v1/screenings/${id}/submit`).set(auth(token))).status
    ).toBe(409);
  });

  it("restores a project: listed and writable again", async () => {
    const { token } = await loginAs("environmental_specialist");
    const project = await createProject({ title: "Back" });
    await archive(project._id, token);

    const res = await restore(project._id, token);
    expect(res.status).toBe(200);
    expect(res.body.data.archived).toBe(false);
    expect(res.body.data.archived_by).toBeUndefined();

    const list = await request(app).get("/api/v1/projects").set(auth(token));
    expect(list.body.data.map((p) => p.title)).toEqual(["Back"]);
    const put = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set(auth(token))
      .send({ title: "Edited" });
    expect(put.status).toBe(200);
  });

  it("returns 409 for archive twice / restore of a live project, 404 for unknown", async () => {
    const { token } = await loginAs("environmental_specialist");
    const project = await createProject();

    expect((await restore(project._id, token)).status).toBe(409);
    await archive(project._id, token);
    expect((await archive(project._id, token)).status).toBe(409);
    expect((await archive(new mongoose.Types.ObjectId(), token)).status).toBe(404);
  });

  it.each(["program_manager", "project_manager", "environmental_focal_point", "viewer"])(
    "%s cannot archive or restore (403)",
    async (role) => {
      const { token } = await loginAs(role);
      const project = await createProject();
      expect((await archive(project._id, token)).status).toBe(403);
      expect((await restore(project._id, token)).status).toBe(403);
    }
  );
});
