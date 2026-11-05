// deploy/windows/install.ps1 names everything it registers with Windows after its parameters, so
// an install with test names (release/service-test kit) never touches or clashes with the real
// one. PowerShell is not run in CI; this reads the script.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const install = fs.readFileSync(path.join(repo, "deploy/windows/install.ps1"), "utf8");

describe("deploy/windows/install.ps1 names", () => {
  it("the service's display name is its -ServiceName (Windows refuses two equal display names)", () => {
    expect(install).toMatch(/@\('DisplayName', \$ServiceName\)/);
    expect(install).not.toMatch(/@\('DisplayName', '[^']*'\)/);
  });

  it("the service account, the backup task and the MongoDB dependency come from parameters", () => {
    expect(install).toContain('$serviceAccount = "NT SERVICE\\$ServiceName"');
    expect(install).toContain('$taskName = "$ServiceName Backup"');
    expect(install).toMatch(/@\('DependOnService', \$MongoServiceName\)/);
  });

  it("every nssm and sc.exe call targets $ServiceName, never a fixed name", () => {
    const calls = install.match(/@\('(?:install|set)', [^)]*\)|sc\.exe @\([^)]*\)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(call).toContain("$ServiceName");
  });
});
