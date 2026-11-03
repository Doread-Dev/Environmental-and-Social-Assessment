import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

// Attachments (D26), old SEMP tree (D27) and reports (D28) were removed in phase 1.
describe("removed endpoints", () => {
  it.each([
    ["post", "/api/v1/attachments"],
    ["post", "/api/v1/attachments/upload"],
    ["get", "/api/v1/attachments/000000000000000000000000"],
    ["get", "/api/v1/semp/objectives"],
    ["post", "/api/v1/semp/objectives"],
    ["post", "/api/v1/semp/targets"],
    ["post", "/api/v1/semp/actions"],
    ["get", "/api/v1/reports/export"],
    ["get", "/api/v1/reports/dashboard"],
  ])("%s %s returns 404", async (method, url) => {
    const { token } = await loginAs("environmental_specialist");

    const res = await request(app)[method](url).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
