import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongoose } from "./helpers/app.js";

const script = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/clean-test-data.js"
);

describe("scripts/clean-test-data.js", () => {
  it("refuses to run when NODE_ENV=production and deletes nothing", async () => {
    await mongoose.connection.db.collection("projects").insertOne({ project_name: "keep me" });

    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, NODE_ENV: "production" },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/refuses to run with NODE_ENV=production/);
    expect(await mongoose.connection.db.collection("projects").countDocuments()).toBe(1);
  });
});
