import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { ROLES, createUser, loginAs } from "./helpers/fixtures.js";

const User = require("../../src/models/user.model");
const JobTitle = require("../../src/models/jobTitle.model");
const { loginLimiter } = require("../../src/middlewares/rateLimiter");

// These tests check on purpose that old passwords fail; keep the per-IP login limit (10 failures
// per 15 minutes) from blocking the next test.
beforeEach(() =>
  Promise.all(["::ffff:127.0.0.1", "127.0.0.1", "::1"].map((ip) => loginLimiter.resetKey(ip)))
);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const NON_ADMIN_ROLES = ROLES.filter((role) => role !== "admin");

const login = (email, password) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

const newUser = (n, fields = {}) => ({
  name: `New ${n}`,
  email: `new.${n}@example.com`,
  role: "viewer",
  ...fields,
});

describe("GET /api/v1/users", () => {
  it("admin gets every account, inactive ones included, with full fields", async () => {
    const { token } = await loginAs("admin");
    const { user: inactive } = await createUser("viewer", { is_active: false });

    const res = await request(app).get("/api/v1/users").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const row = res.body.data.find((u) => u._id === inactive._id.toString());
    expect(row).toMatchObject({ email: inactive.email, role: "viewer", is_active: false });
    expect(row).not.toHaveProperty("password");
  });

  it.each(NON_ADMIN_ROLES)(
    "%s gets only active users, with picker fields only (D4)",
    async (role) => {
      const jobTitle = await JobTitle.create({ title_name: "Engineer" });
      const { token } = await loginAs(role);
      const { user: active } = await createUser("program_manager", { job_title: jobTitle._id });
      await createUser("viewer", { is_active: false });

      const res = await request(app).get("/api/v1/users").set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      const row = res.body.data.find((u) => u._id === active._id.toString());
      expect(Object.keys(row).sort()).toEqual(["_id", "is_active", "job_title", "name"]);
      expect(row.job_title.title_name).toBe("Engineer");
      expect(res.body.data.every((u) => u.is_active)).toBe(true);
    }
  );
});

describe("user management is admin only (D21)", () => {
  const someone = async () => (await createUser("viewer")).user._id.toString();

  const writes = [
    ["POST /users", async () => ["post", "/api/v1/users", newUser(1)]],
    ["PUT /users/:id", async () => ["put", `/api/v1/users/${await someone()}`, { name: "X" }]],
    [
      "PATCH /users/:id/deactivate",
      async () => ["patch", `/api/v1/users/${await someone()}/deactivate`],
    ],
    [
      "PATCH /users/:id/reactivate",
      async () => ["patch", `/api/v1/users/${await someone()}/reactivate`],
    ],
    [
      "POST /users/:id/reset-password",
      async () => ["post", `/api/v1/users/${await someone()}/reset-password`],
    ],
  ];

  describe.each(writes)("%s", (_name, build) => {
    it.each(NON_ADMIN_ROLES)("%s → 403", async (role) => {
      const { token } = await loginAs(role);
      const [method, url, body] = await build();
      const res = await request(app)[method](url).set(auth(token)).send(body);
      expect(res.status).toBe(403);
    });

    it("admin → 2xx", async () => {
      const { token } = await loginAs("admin");
      const [method, url, body] = await build();
      const res = await request(app)[method](url).set(auth(token)).send(body);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });
  });

  it.each(["post", "put", "patch"])("unknown user id → 404 (%s)", async (method) => {
    const { token } = await loginAs("admin");
    const id = "000000000000000000000000";
    const url = {
      post: `/api/v1/users/${id}/reset-password`,
      put: `/api/v1/users/${id}`,
      patch: `/api/v1/users/${id}/deactivate`,
    }[method];
    const res = await request(app)[method](url).set(auth(token)).send({ name: "X" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/users", () => {
  it("creates the user with a temporary password returned once (D22)", async () => {
    const { token } = await loginAs("admin");
    const jobTitle = await JobTitle.create({ title_name: "Engineer" });

    const res = await request(app)
      .post("/api/v1/users")
      .set(auth(token))
      .send(newUser(1, { email: "New.One@Example.com", job_title: jobTitle._id.toString() }));

    expect(res.status).toBe(201);
    const { user, temporary_password: temp } = res.body.data;
    expect(user).toMatchObject({
      email: "new.one@example.com",
      role: "viewer",
      is_active: true,
      must_change_password: true,
      job_title: { title_name: "Engineer" },
    });
    expect(user).not.toHaveProperty("password");
    expect(temp).toMatch(/^[A-Za-z0-9]{12}$/);
    expect((await login("new.one@example.com", temp)).status).toBe(200);
  });

  it("an admin may create another admin", async () => {
    const { token } = await loginAs("admin");
    const res = await request(app)
      .post("/api/v1/users")
      .set(auth(token))
      .send(newUser(2, { role: "admin" }));
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("strips a password and server-owned fields from the body", async () => {
    const { token } = await loginAs("admin");
    const res = await request(app)
      .post("/api/v1/users")
      .set(auth(token))
      .send(newUser(3, { password: "chosen-pass", is_active: false, must_change_password: false }));

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ is_active: true, must_change_password: true });
    expect((await login("new.3@example.com", "chosen-pass")).status).toBe(401);
  });

  it("refuses an email already in use (409)", async () => {
    const { token } = await loginAs("admin");
    await createUser("viewer", { email: "taken@example.com" });
    const res = await request(app)
      .post("/api/v1/users")
      .set(auth(token))
      .send(newUser(4, { email: "TAKEN@example.com" }));
    expect(res.status).toBe(409);
  });

  it.each([
    ["missing name", { name: undefined }],
    ["invalid email", { email: "not-an-email" }],
    ["unknown role", { role: "superuser" }],
    ["malformed job title", { job_title: "nope" }],
  ])("rejects %s (400)", async (_name, fields) => {
    const { token } = await loginAs("admin");
    const res = await request(app).post("/api/v1/users").set(auth(token)).send(newUser(5, fields));
    expect(res.status).toBe(400);
  });

  it("rejects a job title that does not exist (400)", async () => {
    const { token } = await loginAs("admin");
    const res = await request(app)
      .post("/api/v1/users")
      .set(auth(token))
      .send(newUser(6, { job_title: "000000000000000000000000" }));
    expect(res.status).toBe(400);
    expect(await User.exists({ email: "new.6@example.com" })).toBeNull();
  });
});

describe("PUT /api/v1/users/:id", () => {
  it("updates name, role and job title; email stays", async () => {
    const { token } = await loginAs("admin");
    const jobTitle = await JobTitle.create({ title_name: "Engineer" });
    const { user } = await createUser("viewer");

    const res = await request(app).put(`/api/v1/users/${user._id}`).set(auth(token)).send({
      name: "Renamed",
      role: "project_manager",
      job_title: jobTitle._id.toString(),
      email: "changed@example.com",
      is_active: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: "Renamed",
      role: "project_manager",
      email: user.email,
      is_active: true,
      job_title: { title_name: "Engineer" },
    });
  });

  it("clears the job title with null", async () => {
    const { token } = await loginAs("admin");
    const jobTitle = await JobTitle.create({ title_name: "Engineer" });
    const { user } = await createUser("viewer", { job_title: jobTitle._id });

    const res = await request(app)
      .put(`/api/v1/users/${user._id}`)
      .set(auth(token))
      .send({ job_title: null });

    expect(res.status).toBe(200);
    expect(res.body.data.job_title).toBeNull();
  });

  it("rejects an empty body (400)", async () => {
    const { token } = await loginAs("admin");
    const { user } = await createUser("viewer");
    const res = await request(app).put(`/api/v1/users/${user._id}`).set(auth(token)).send({});
    expect(res.status).toBe(400);
  });

  it("a role change applies on the next request of that user", async () => {
    const admin = await loginAs("admin");
    const specialist = await loginAs("environmental_specialist");
    const url = `/api/v1/users/${specialist.user._id}`;

    await request(app).put(url).set(auth(admin.token)).send({ role: "viewer" });

    const res = await request(app)
      .post("/api/v1/projects")
      .set(auth(specialist.token))
      .send({ title: "x", location: "y", start_date: "2026-01-01", end_date: "2026-02-01" });
    expect(res.status).toBe(403);
  });
});

describe("last active admin protection", () => {
  it("cannot demote the last active admin (409), not even themselves", async () => {
    const { user, token } = await loginAs("admin");
    const res = await request(app)
      .put(`/api/v1/users/${user._id}`)
      .set(auth(token))
      .send({ role: "environmental_specialist" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Cannot change the role of the last active admin");
    expect((await User.findById(user._id)).role).toBe("admin");
  });

  it("cannot deactivate the last active admin (409)", async () => {
    const { user, token } = await loginAs("admin");
    const res = await request(app).patch(`/api/v1/users/${user._id}/deactivate`).set(auth(token));
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Cannot deactivate the last active admin");
    expect((await User.findById(user._id)).is_active).toBe(true);
  });

  it("an inactive admin does not count as another admin", async () => {
    const { user, token } = await loginAs("admin");
    await createUser("admin", { is_active: false });
    const res = await request(app).patch(`/api/v1/users/${user._id}/deactivate`).set(auth(token));
    expect(res.status).toBe(409);
  });

  it("with a second active admin, demote and deactivate work", async () => {
    const { token } = await loginAs("admin");
    const { user: other } = await createUser("admin");

    const demoted = await request(app)
      .put(`/api/v1/users/${other._id}`)
      .set(auth(token))
      .send({ role: "viewer" });
    expect(demoted.status).toBe(200);

    await User.updateOne({ _id: other._id }, { role: "admin" });
    const deactivated = await request(app)
      .patch(`/api/v1/users/${other._id}/deactivate`)
      .set(auth(token));
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.is_active).toBe(false);
  });

  it("saving the same role is not a demotion", async () => {
    const { user, token } = await loginAs("admin");
    const res = await request(app)
      .put(`/api/v1/users/${user._id}`)
      .set(auth(token))
      .send({ role: "admin", name: "Still admin" });
    expect(res.status).toBe(200);
  });
});

describe("deactivate / reactivate (D4)", () => {
  it("a deactivated user's token is rejected at once and login is refused", async () => {
    const admin = await loginAs("admin");
    const target = await loginAs("program_manager");

    const res = await request(app)
      .patch(`/api/v1/users/${target.user._id}/deactivate`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);

    expect((await request(app).get("/api/v1/projects").set(auth(target.token))).status).toBe(401);
    expect((await request(app).get("/api/v1/auth/me").set(auth(target.token))).status).toBe(401);
  });

  it("reactivate lets the user log in again", async () => {
    const { token } = await loginAs("admin");
    const { user, password } = await createUser("viewer", { is_active: false });

    const res = await request(app).patch(`/api/v1/users/${user._id}/reactivate`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
    expect((await login(user.email, password)).status).toBe(200);
  });
});

describe("an admin's own account (v2.0.1)", () => {
  // Another active admin exists, so only the self rule can refuse.
  const asAdminWithAnother = async () => {
    const { user, password } = await createUser("admin");
    const { token } = (await login(user.email, password)).body.data;
    await createUser("admin");
    return { user, token, password };
  };

  it("cannot reset their own password here (409): no change is forced, the password still works", async () => {
    const { user, token, password } = await asAdminWithAnother();
    const res = await request(app)
      .post(`/api/v1/users/${user._id}/reset-password`)
      .set(auth(token));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cannot reset your own password here/);
    const stored = await User.findById(user._id);
    expect(stored.must_change_password).toBe(false);
    expect((await login(user.email, password)).status).toBe(200);
  });

  it("cannot deactivate their own account (409)", async () => {
    const { user, token } = await asAdminWithAnother();
    const res = await request(app).patch(`/api/v1/users/${user._id}/deactivate`).set(auth(token));
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You cannot deactivate your own account");
    expect((await User.findById(user._id)).is_active).toBe(true);
  });

  it("cannot change their own role (409), but can edit their own name", async () => {
    const { user, token } = await asAdminWithAnother();
    const role = await request(app)
      .put(`/api/v1/users/${user._id}`)
      .set(auth(token))
      .send({ role: "viewer" });
    expect(role.status).toBe(409);
    expect(role.body.error).toBe("You cannot change your own role");
    expect((await User.findById(user._id)).role).toBe("admin");

    const name = await request(app)
      .put(`/api/v1/users/${user._id}`)
      .set(auth(token))
      .send({ name: "Renamed Admin", role: "admin" });
    expect(name.status).toBe(200);
    expect(name.body.data.name).toBe("Renamed Admin");
  });

  it("can still reset, deactivate and change the role of another admin", async () => {
    const { token } = await loginAs("admin");
    const { user: other } = await createUser("admin");
    const reset = await request(app)
      .post(`/api/v1/users/${other._id}/reset-password`)
      .set(auth(token));
    expect(reset.status).toBe(200);
    const role = await request(app)
      .put(`/api/v1/users/${other._id}`)
      .set(auth(token))
      .send({ role: "viewer" });
    expect(role.status).toBe(200);
    const off = await request(app).patch(`/api/v1/users/${other._id}/deactivate`).set(auth(token));
    expect(off.status).toBe(200);
  });
});

describe("POST /api/v1/users/:id/reset-password (D22)", () => {
  it("the temporary password works, the old one stops, and a change is forced", async () => {
    const { token } = await loginAs("admin");
    const { user, password } = await createUser("program_manager");

    const res = await request(app)
      .post(`/api/v1/users/${user._id}/reset-password`)
      .set(auth(token));

    expect(res.status).toBe(200);
    const temp = res.body.data.temporary_password;
    expect(temp).toMatch(/^[A-Za-z0-9]{12}$/);
    expect(res.body.data.user.must_change_password).toBe(true);
    expect((await login(user.email, password)).status).toBe(401);

    const signedIn = await login(user.email, temp);
    expect(signedIn.status).toBe(200);
    expect(signedIn.body.data.user.must_change_password).toBe(true);
  });

  it("every reset gives a new password; the previous temporary one stops working", async () => {
    const { token } = await loginAs("admin");
    const { user } = await createUser("viewer");
    const url = `/api/v1/users/${user._id}/reset-password`;

    const first = (await request(app).post(url).set(auth(token))).body.data.temporary_password;
    const second = (await request(app).post(url).set(auth(token))).body.data.temporary_password;

    expect(second).not.toBe(first);
    expect((await login(user.email, first)).status).toBe(401);
    expect((await login(user.email, second)).status).toBe(200);
  });

  it("the user's existing token is held at the forced change", async () => {
    const admin = await loginAs("admin");
    const target = await loginAs("program_manager");

    await request(app)
      .post(`/api/v1/users/${target.user._id}/reset-password`)
      .set(auth(admin.token));

    const res = await request(app).get("/api/v1/projects").set(auth(target.token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("the temporary password is not stored in plain text", async () => {
    const { token } = await loginAs("admin");
    const { user } = await createUser("viewer");
    const res = await request(app)
      .post(`/api/v1/users/${user._id}/reset-password`)
      .set(auth(token));
    expect((await User.findById(user._id)).password).not.toBe(res.body.data.temporary_password);
  });
});

describe("forced password change (D22)", () => {
  it("blocks every endpoint except GET /auth/me and PUT /auth/password", async () => {
    const { token } = await loginAs("admin", { must_change_password: true });

    for (const [method, url] of [
      ["get", "/api/v1/projects"],
      ["get", "/api/v1/users"],
      ["get", "/api/v1/dashboard"],
      ["get", "/api/v1/lookups"],
      ["post", "/api/v1/users"],
      ["get", "/api/v1/no-such-route"],
    ]) {
      const res = await request(app)[method](url).set(auth(token)).send({});
      expect(res.status, `${method} ${url}`).toBe(403);
      expect(res.body).toEqual({
        success: false,
        error: "You must change your password before continuing",
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }

    const me = await request(app).get("/api/v1/auth/me").set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.data.user.must_change_password).toBe(true);
  });

  it("changing the password lifts the block; the temporary password no longer works", async () => {
    const admin = await loginAs("admin");
    const created = await request(app)
      .post("/api/v1/users")
      .set(auth(admin.token))
      .send(newUser(7, { role: "project_manager" }));
    const temp = created.body.data.temporary_password;
    const { token } = (await login("new.7@example.com", temp)).body.data;

    const res = await request(app)
      .put("/api/v1/auth/password")
      .set(auth(token))
      .send({ current_password: temp, new_password: "my-own-password" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.must_change_password).toBe(false);
    expect(res.body.data.permissions).toContain("edit");
    expect((await request(app).get("/api/v1/projects").set(auth(token))).status).toBe(200);
    expect((await login("new.7@example.com", temp)).status).toBe(401);
    expect((await login("new.7@example.com", "my-own-password")).status).toBe(200);
  });
});

describe("PUT /api/v1/auth/password (D23)", () => {
  it.each(ROLES)("%s can change their own password", async (role) => {
    const { user, password } = await createUser(role);
    const { token } = (await login(user.email, password)).body.data;

    const res = await request(app)
      .put("/api/v1/auth/password")
      .set(auth(token))
      .send({ current_password: password, new_password: "another-password" });

    expect(res.status).toBe(200);
    expect(res.body.data.user).not.toHaveProperty("password");
    expect((await login(user.email, password)).status).toBe(401);
    expect((await login(user.email, "another-password")).status).toBe(200);
  });

  it("a wrong current password → 400 (not 401: the session is fine)", async () => {
    const { user, password } = await createUser("viewer");
    const { token } = (await login(user.email, password)).body.data;

    const res = await request(app)
      .put("/api/v1/auth/password")
      .set(auth(token))
      .send({ current_password: "wrong-password", new_password: "another-password" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Current password is incorrect");
    expect((await login(user.email, password)).status).toBe(200);
  });

  it("the new password must differ from the current one (400)", async () => {
    const { user, password } = await createUser("viewer", { must_change_password: true });
    const { token } = (await login(user.email, password)).body.data;

    const res = await request(app)
      .put("/api/v1/auth/password")
      .set(auth(token))
      .send({ current_password: password, new_password: password });

    expect(res.status).toBe(400);
    expect((await User.findById(user._id)).must_change_password).toBe(true);
  });

  it.each([
    ["too short", { current_password: "x", new_password: "12345" }],
    ["missing current password", { new_password: "another-password" }],
  ])("rejects %s (400)", async (_name, body) => {
    const { token } = await loginAs("viewer");
    const res = await request(app).put("/api/v1/auth/password").set(auth(token)).send(body);
    expect(res.status).toBe(400);
  });

  it("requires a token (401)", async () => {
    const res = await request(app)
      .put("/api/v1/auth/password")
      .send({ current_password: "a", new_password: "another-password" });
    expect(res.status).toBe(401);
  });
});
