// Phase 12a (D77): one release version — the same in the three package.json files, at the top of
// CHANGELOG.md, in GET /health (health.test.js) and in the release archive name
// (deploy/build-release.mjs).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { releaseName, releaseVersion } from "../../deploy/build-release.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (file) => fs.readFileSync(path.join(repo, file), "utf8");
const versionOf = (app) => JSON.parse(read(`${app}/package.json`)).version;

describe("release version 2.0.1", () => {
  it("is the version of backend, frontend and e2e", () => {
    expect(["backend", "frontend", "e2e"].map(versionOf)).toEqual(["2.0.1", "2.0.1", "2.0.1"]);
    expect(releaseVersion(repo)).toBe("2.0.1");
  });

  it("matches the lockfiles", () => {
    for (const app of ["backend", "frontend", "e2e"]) {
      const lock = JSON.parse(read(`${app}/package-lock.json`));
      expect([lock.version, lock.packages[""].version], app).toEqual([
        versionOf(app),
        versionOf(app),
      ]);
    }
  });

  it("is the newest entry of CHANGELOG.md, with the known limits", () => {
    const changelog = read("CHANGELOG.md");
    const [first] = changelog.match(/^## \d+\.\d+\.\d+/m);
    expect(first).toBe(`## ${releaseVersion(repo)}`);
    expect(changelog).toMatch(/### Known limits/);
    expect(changelog).toMatch(/Linux install path not run on a real server/);
    expect(changelog).toMatch(/uuid/);
  });

  it("marks the code as the client's private code (UNLICENSED, owner 2026-11-08)", () => {
    for (const app of ["backend", "frontend", "e2e"]) {
      const pkg = JSON.parse(read(`${app}/package.json`));
      expect([undefined, "UNLICENSED"], app).toContain(pkg.license);
    }
    expect(JSON.parse(read("backend/package.json")).license).toBe("UNLICENSED");
    expect(JSON.parse(read("backend/package-lock.json")).packages[""].license).toBe("UNLICENSED");
  });

  it("names the release archive esms-<version>-<date>-<commit>", () => {
    expect(releaseName({ version: "2.0.0", date: "2026-11-08", commit: "abc1234" })).toBe(
      "esms-2.0.0-2026-11-08-abc1234"
    );
    expect(
      releaseName({ version: "2.0.0", date: "2026-11-08", commit: "abc1234", dirty: true })
    ).toBe("esms-2.0.0-2026-11-08-abc1234-modified");
  });

  it("stops the release build when the package versions differ", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-release-"));
    try {
      for (const [app, version] of [
        ["backend", "2.0.0"],
        ["frontend", "2.0.1"],
        ["e2e", "2.0.0"],
      ]) {
        fs.mkdirSync(path.join(dir, app));
        fs.writeFileSync(path.join(dir, app, "package.json"), JSON.stringify({ version }));
      }
      expect(() => releaseVersion(dir)).toThrow(/versions differ.*2\.0\.0, 2\.0\.1, 2\.0\.0/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the release carries the changelog and a VERSION file with the version", () => {
    const script = read("deploy/build-release.mjs");
    expect(script).toMatch(/copyFileSync\(path\.join\(root, 'CHANGELOG\.md'\)/);
    expect(script).toMatch(/`ESMS \$\{version\}\\n/);
  });

  it("the release carries docs/user-guide where the Help service reads it (phase 14, D78)", () => {
    const script = read("deploy/build-release.mjs");
    expect(script).toMatch(
      /cpSync\(path\.join\(root, 'docs', 'user-guide'\), path\.join\(out, 'docs', 'user-guide'\)/
    );
    // The service finds the guide by a path relative to backend/src/services, the same in the
    // repository and in the release folder (backend/ and docs/ side by side).
    const fromService = path.relative(
      path.join(repo, "backend/src/services"),
      path.join(repo, "docs/user-guide")
    );
    expect(fromService.split(path.sep).join("/")).toBe("../../../docs/user-guide");
    expect(read("backend/src/services/help.service.js")).toContain('"../../../docs/user-guide"');
    expect(read("deploy/windows/install.ps1")).toMatch(/foreach \(\$part in @\([^)]*'docs'/);
    expect(read("deploy/linux/install.sh")).toMatch(/for part in [^;]* docs [^;]*; do/);
  });

  it("both install scripts copy the changelog and VERSION to the server", () => {
    expect(read("deploy/windows/install.ps1")).toMatch(
      /foreach \(\$part in @\([^)]*'VERSION', 'CHANGELOG\.md'\)\)/
    );
    expect(read("deploy/linux/install.sh")).toMatch(/for part in [^;]*VERSION CHANGELOG\.md; do/);
  });
});
