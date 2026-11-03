import { describe, expect, it } from "vitest";
import { require } from "./helpers/app.js";
import { seedLookups } from "./helpers/fixtures.js";

const ImpactCategory = require("../../src/models/impactCategory.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const Indicator = require("../../src/models/indicator.model");
const JobTitle = require("../../src/models/jobTitle.model");

const lookupModels = [ImpactCategory, ImpactQuestion, Indicator, JobTitle];

async function snapshot() {
  const result = {};
  for (const Model of lookupModels) {
    const ids = await Model.find({}, "_id").sort({ _id: 1 }).lean();
    result[Model.modelName] = ids.map((d) => String(d._id));
  }
  return result;
}

describe("seedLookupData", () => {
  it("is idempotent: a second run keeps the same _ids and counts", async () => {
    await seedLookups();
    const first = await snapshot();

    await seedLookups();
    const second = await snapshot();

    expect(first.ImpactCategory).toHaveLength(8);
    expect(first.ImpactQuestion).toHaveLength(50);
    expect(first.Indicator).toHaveLength(24);
    expect(first.JobTitle).toHaveLength(5);
    expect(second).toEqual(first);
  });

  it("restores edited lookup text without changing the _id", async () => {
    await seedLookups();
    const category = await ImpactCategory.findOne({ code: "A" });
    await ImpactCategory.updateOne({ _id: category._id }, { name: "Edited" });

    await seedLookups();

    const restored = await ImpactCategory.findById(category._id);
    expect(restored.name).toBe("Air Quality");
  });
});
