import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { loginAs, withVersion } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const projectBody = {
  title: "Roles",
  location: "Aleppo",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
};

describe("viewer", () => {
  it("can read but not write (403)", async () => {
    const { token } = await loginAs("viewer");
    const project = await Project.create(projectBody);

    expect((await request(app).get("/api/v1/projects").set(auth(token))).status).toBe(200);
    expect(
      (await request(app).post("/api/v1/projects").set(auth(token)).send(projectBody)).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(`/api/v1/projects/${project._id}`)
          .set(auth(token))
          .send(await withVersion(`/api/v1/projects/${project._id}`, { title: "x" }))
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/v1/screenings")
          .set(auth(token))
          .send({ project: project._id.toString(), category_code: "B", category_reason: "r" })
      ).status
    ).toBe(403);
  });
});

describe("admin role (D9)", () => {
  it("can do everything an editor can", async () => {
    const { token } = await loginAs("admin");
    const res = await request(app).post("/api/v1/projects").set(auth(token)).send(projectBody);
    expect(res.status).toBe(201);
  });

  it("passes specialist-only checks: delete project", async () => {
    const { token } = await loginAs("admin");
    const project = await Project.create(projectBody);
    const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));
    expect(res.status).toBe(204);
  });

  it("an editor cannot delete a project (403)", async () => {
    const { token } = await loginAs("program_manager");
    const project = await Project.create(projectBody);
    const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));
    expect(res.status).toBe(403);
  });
});

describe("validate() strips unknown fields (D5)", () => {
  it("drops model fields the schema does not allow, e.g. reject_reason on a screening PUT", async () => {
    const { token } = await loginAs("project_manager");
    const project = await Project.create(projectBody);
    const created = await request(app)
      .post("/api/v1/screenings")
      .set(auth(token))
      .send({ project: project._id.toString(), category_code: "B", category_reason: "r" });

    const res = await request(app)
      .put(`/api/v1/screenings/${created.body.data._id}`)
      .set(auth(token))
      .send(
        await withVersion(`/api/v1/screenings/${created.body.data._id}`, {
          category_reason: "updated",
          reject_reason: "forged",
        })
      );

    expect(res.status).toBe(200);
    expect(res.body.data.category_reason).toBe("updated");
    expect(res.body.data.reject_reason).toBeUndefined();
  });
});
