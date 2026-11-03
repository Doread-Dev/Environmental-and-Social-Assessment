import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// "Not started yet" is a normal state, not an error (D34): 200 with null data or an empty list.
describe("GET /<tool>/project/:projectId before the tool is started", () => {
  it.each([
    ["/api/v1/screenings", null],
    ["/api/v1/assessments", null],
    ["/api/v1/management", []],
    ["/api/v1/mitigation", []],
    ["/api/v1/monitoring", []],
  ])("%s → 200 %j", async (base, empty) => {
    const { token } = await loginAs("viewer");
    const project = await createProject();

    const res = await request(app).get(`${base}/project/${project._id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: empty });
  });

  it("returns the record once it exists", async () => {
    const { token } = await loginAs("viewer");
    const project = await createProject({ stage: "screening_approved" });

    const res = await request(app)
      .get(`/api/v1/screenings/project/${project._id}`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ category_code: "B", status: "approved" });
  });
});
