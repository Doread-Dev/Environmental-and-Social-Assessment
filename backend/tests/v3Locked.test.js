import { describe, expect, it } from "vitest";
import { listRoutes } from "./helpers/routes.js";

// The v3 modules (SEMP Plan, Stakeholder Awareness, GHG Emissions, Environmental Data
// Collection) are locked buttons only in v2: no endpoint is mounted (D48, D70). SEMP Plan §7
// files (area `semp_record`) answer 404 until then — see projectFiles.test.js.
describe("v3 modules are not mounted (D48, D70)", () => {
  it("no route serves a v3 path", () => {
    const routes = listRoutes();
    expect(routes.length).toBeGreaterThan(50);
    const v3 = /\/(semp-plans?|stakeholder-awareness|organization-[^/]*)(\/|$)/i;
    expect(routes.filter((route) => v3.test(route.path)).map((route) => route.key)).toEqual([]);
  });
});
