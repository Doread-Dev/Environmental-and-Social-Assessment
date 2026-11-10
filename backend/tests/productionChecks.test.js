import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(backend, "src/server.js");

const start = (env) =>
  spawnSync(process.execPath, [server], {
    env: { ...process.env, NODE_ENV: "production", PORT: "0", ...env },
    encoding: "utf8",
    timeout: 15000,
  });

// The server checks its settings before it connects to MongoDB or listens (phase 11). The dev
// scripts refusing NODE_ENV=production are tested in cleanTestData.test.js and
// seedDemoProject.test.js.
describe("production start checks", () => {
  it.each([
    ["missing", ""],
    ["too short", "x".repeat(31)],
    ["blank", " ".repeat(40)],
  ])("refuses to start with a %s JWT_SECRET", (_name, secret) => {
    const result = start({ JWT_SECRET: secret });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/JWT_SECRET \(must be set and at least 32 characters\)/);
    expect(result.stdout).not.toMatch(/Server running/);
  });

  it("refuses to start without MONGODB_URI", () => {
    const result = start({ JWT_SECRET: "y".repeat(40), MONGODB_URI: " " });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/MONGODB_URI/);
  });
});
