// deploy/windows/install.ps1 names everything it registers with Windows after its parameters, so
// an install with test names (release/service-test kit) never touches or clashes with the real
// one. PowerShell is not run in CI; this reads the script.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const install = fs.readFileSync(path.join(repo, "deploy/windows/install.ps1"), "utf8");

// Windows PowerShell 5.1 strips the double quotes inside an argument to a native program:
// `& $node -p 'a.split(".")'` reaches node as `a.split(.)` (found by the owner's service test,
// 2026-11-05). So no .ps1 in deploy/windows may pass inline JavaScript or a quoted string to a
// native program; it passes plain words and paths as an array instead.
const windowsDir = path.join(repo, "deploy/windows");
const scripts = fs
  .readdirSync(windowsDir)
  .filter((f) => f.endsWith(".ps1"))
  .map((f) => [f, fs.readFileSync(path.join(windowsDir, f), "utf8")]);

// Code lines only: no <# … #> blocks (their line breaks kept, so line numbers stay true), no #
// comments.
const codeLines = (text) =>
  text
    .replace(/<#[\s\S]*?#>/g, (block) => block.replace(/[^\n]/g, ""))
    .split(/\r?\n/)
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => line.trim() !== "" && !line.trim().startsWith("#"));

// A line that starts a native program: `& $exe …`, `& node …`, `& x.exe …`, Invoke-Native, cmd.
const NATIVE_CALL =
  /(?:^|[\s(=])(?:&\s*(?:\$\w+|[\w.-]+\.exe\b|node\b|cmd\b)|Invoke-Native\s|cmd(?:\.exe)?\s+\/c)/i;

// The string literals of one PowerShell line, each read on its own: '…' ('' is a quote inside)
// and "…" (` escapes the next character). Returns [{ quote: "'" | '"', body }].
const stringLiterals = (line) => {
  const found = [];
  for (let i = 0; i < line.length; i += 1) {
    const quote = line[i];
    if (quote !== "'" && quote !== '"') continue;
    let body = "";
    let j = i + 1;
    for (; j < line.length; j += 1) {
      if (quote === "'" && line[j] === "'" && line[j + 1] === "'") {
        body += "'";
        j += 1;
      } else if (quote === '"' && line[j] === "`") {
        body += line[j] + (line[j + 1] ?? "");
        j += 1;
      } else if (line[j] === quote) break;
      else body += line[j];
    }
    found.push({ quote, body });
    i = j;
  }
  return found;
};

// A double quote inside a string literal: '…"…' or "…`"…".
const hasEmbeddedQuote = (line) =>
  stringLiterals(line).some(({ quote, body }) =>
    quote === "'" ? body.includes('"') : body.includes('`"')
  );

const nativeQuoteProblems = (text) =>
  codeLines(text).flatMap(([n, line]) => {
    const problems = [];
    if (
      /\bnode(?:\.exe)?\b[^\n]*\s(?:-e|-p|--eval|--print)\b|\$node\s+(?:-e|-p|--eval|--print)\b/i.test(
        line
      )
    ) {
      problems.push(`line ${n}: inline JavaScript (node -e/-p)`);
    }
    if (NATIVE_CALL.test(line) && hasEmbeddedQuote(line)) {
      problems.push(`line ${n}: a quoted string inside an argument to a native program`);
    }
    if (/\bcmd(?:\.exe)?\s+\/c\b/i.test(line))
      problems.push(`line ${n}: cmd /c with a command string`);
    return problems;
  });

describe("deploy/windows/*.ps1: arguments to native programs survive Windows PowerShell 5.1", () => {
  it.each(scripts.map(([f]) => f))("%s passes no inline JavaScript or quoted string", (file) => {
    const [, text] = scripts.find(([f]) => f === file);
    expect(nativeQuoteProblems(text)).toEqual([]);
  });

  it("the check catches what broke the owner's install (and similar calls)", () => {
    const broken = [
      "$have = (& $node -p 'process.versions.node.split(\".\")[0]').Trim()",
      '  $secret = (& $node -e \'console.log(require("crypto").randomBytes(48).toString("base64url"))\').Trim()',
      '  $output = & cmd /c "`"$node`" scripts\\backup.js $args 2>&1"',
      "Invoke-Native $node @('-e', 'console.log(\"x\")')",
    ];
    for (const line of broken) expect(nativeQuoteProblems(line)).not.toEqual([]);
  });

  it("a scheduled-task argument (a cmdlet parameter, not a native call) may keep its quotes", () => {
    const ok = [
      "  $action = New-ScheduledTaskAction -Execute 'powershell.exe' `",
      '    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -LogDir `"$logDir`""',
      "  Invoke-Native $node @('scripts\\init-replica-set.js') | Write-Host",
      "$have = ((& $node --version) -replace '^v', '').Split('.')[0]",
    ].join("\n");
    expect(nativeQuoteProblems(ok)).toEqual([]);
  });
});

describe("deploy/windows/install.ps1 names", () => {
  it("the service's display name is its -ServiceName (Windows refuses two equal display names)", () => {
    expect(install).toMatch(/@\('DisplayName', \$ServiceName\)/);
    expect(install).not.toMatch(/@\('DisplayName', '[^']*'\)/);
  });

  it("the service account and the backup task come from parameters", () => {
    expect(install).toContain('$serviceAccount = "NT SERVICE\\$ServiceName"');
    expect(install).toContain('$taskName = "$ServiceName Backup"');
  });
});

// A MongoDB restart must never stop ESMS (owner's service test, 2026-11-06): with a Windows
// service dependency, stopping MongoDB stopped ESMS and nothing started it again. The app keeps
// running, reconnects by itself, and is restarted by the service manager when it exits.
const unit = fs.readFileSync(path.join(repo, "deploy/linux/esms.service"), "utf8");
const unitLines = unit.split(/\r?\n/).filter((line) => !line.trim().startsWith("#"));

describe("MongoDB restarts never stop ESMS", () => {
  it("install.ps1 sets no service dependency and clears one left by an older install", () => {
    expect(codeLines(install).map(([, line]) => line)).not.toContainEqual(
      expect.stringMatching(/'DependOnService'\s*,/)
    );
    expect(install).toMatch(/@\('reset', \$ServiceName, 'DependOnService'\)/);
    expect(install).toMatch(/ServicesDependedOn/);
  });

  it("install.ps1 restarts the app when it exits (also at boot before MongoDB answers)", () => {
    expect(install).toMatch(/@\('AppExit', 'Default', 'Restart'\)/);
    expect(install).toMatch(/@\('AppRestartDelay', '\d+'\)/);
    expect(install).toMatch(/@\('AppThrottle', '\d+'\)/);
  });

  it("esms.service only orders after mongod (Wants/After), never Requires/BindsTo/PartOf", () => {
    for (const key of ["Requires", "BindsTo", "PartOf", "Requisite"]) {
      expect(unitLines.filter((line) => line.startsWith(`${key}=`))).toEqual([]);
    }
    expect(unitLines).toContain("Wants=network-online.target mongod.service");
    expect(unitLines).toContain("After=network-online.target mongod.service");
    expect(unitLines).toContain("Restart=always");
  });

  it("the checks catch a dependency", () => {
    const withDependency = "  @('DependOnService', $MongoServiceName),";
    expect(codeLines(withDependency).map(([, line]) => line)).toContainEqual(
      expect.stringMatching(/'DependOnService'\s*,/)
    );
  });

  it("every nssm and sc.exe call targets $ServiceName, never a fixed name", () => {
    const calls = install.match(/@\('(?:install|set)', [^)]*\)|sc\.exe @\([^)]*\)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(call).toContain("$ServiceName");
  });
});
