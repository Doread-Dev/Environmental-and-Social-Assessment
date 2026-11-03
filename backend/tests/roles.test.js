import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const User = require("../../src/models/user.model");

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
          .send({ title: "x" })
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

describe("POST /api/v1/auth/register (D7)", () => {
  const newUser = (n) => ({
    name: `New ${n}`,
    email: `new.${n}@example.com`,
    password: "secret-123",
    role: "viewer",
  });

  it("is closed without a token, even when there are no users yet", async () => {
    expect(await User.countDocuments()).toBe(0);
    const res = await request(app).post("/api/v1/auth/register").send(newUser(1));
    expect(res.status).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });

  it.each(["admin", "environmental_specialist"])("%s can register users", async (role) => {
    const { token } = await loginAs(role);
    const res = await request(app).post("/api/v1/auth/register").set(auth(token)).send(newUser(2));
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("viewer");
  });

  it.each(["program_manager", "project_manager", "environmental_focal_point", "viewer"])(
    "%s cannot register users (403)",
    async (role) => {
      const { token } = await loginAs(role);
      const res = await request(app)
        .post("/api/v1/auth/register")
        .set(auth(token))
        .send(newUser(3));
      expect(res.status).toBe(403);
    }
  );

  it("cannot create an admin (admins come from scripts/create-admin.js)", async () => {
    const { token } = await loginAs("environmental_specialist");
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set(auth(token))
      .send({ ...newUser(4), role: "admin" });
    expect(res.status).toBe(400);
  });

  it("strips server-owned fields such as is_active", async () => {
    const { token } = await loginAs("environmental_specialist");
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set(auth(token))
      .send({ ...newUser(5), is_active: false });
    expect(res.status).toBe(201);
    expect(res.body.data.user.is_active).toBe(true);
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
      .send({ category_reason: "updated", reject_reason: "forged" });

    expect(res.status).toBe(200);
    expect(res.body.data.category_reason).toBe("updated");
    expect(res.body.data.reject_reason).toBeUndefined();
  });
});
