// Phase 12 (D44, D76): the technical docs live in docs/ at the repository root and stay in step
// with the code. Fails when the old backend/docs or frontend/docs come back, when a mounted route
// is missing from the API reference, when the permission matrices differ from config/permissions.js,
// or when a relative link in the docs (or README / CLAUDE.md) points at a missing file.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listRoutes } from "./helpers/routes.js";
import { require } from "./helpers/app.js";

const { ROLES } = require("../../src/config/roles");
const { PERMISSIONS, ACTION_PERMISSIONS } = require("../../src/config/permissions");

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const docs = path.join(repo, "docs");
const read = (file) => fs.readFileSync(path.join(repo, file), "utf8");

/** The rows of the table between <!-- matrix:name --> and <!-- /matrix:name -->. */
function matrix(text, name) {
  const start = text.indexOf(`<!-- matrix:${name} -->`);
  const end = text.indexOf(`<!-- /matrix:${name} -->`);
  expect(start, `matrix:${name} markers`).toBeGreaterThan(-1);
  return text
    .slice(start, end)
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/`/g, ""))
    );
}

describe("documentation (phase 12)", () => {
  it("the old backend/docs and frontend/docs are gone", () => {
    expect(fs.existsSync(path.join(repo, "backend/docs"))).toBe(false);
    expect(fs.existsSync(path.join(repo, "frontend/docs"))).toBe(false);
  });

  it("has the technical docs and the root README", () => {
    for (const file of [
      "README.md",
      "docs/README.md",
      "docs/architecture.md",
      "docs/api-reference.md",
      "docs/data-models.md",
      "docs/roles-and-permissions.md",
      "docs/workflow-rules.md",
      "docs/developer-guide.md",
      "docs/style-guide.md",
    ]) {
      expect(fs.existsSync(path.join(repo, file)), file).toBe(true);
    }
  });

  it("every route of the route table appears in the API reference", () => {
    const reference = read("docs/api-reference.md");
    const missing = listRoutes()
      .map((route) => `\`${route.method.toUpperCase()} ${route.path}\``)
      .filter((entry) => !reference.includes(entry));
    expect(missing).toEqual([]);
  });

  it("the general permission matrix matches config/permissions.js", () => {
    const rows = matrix(read("docs/roles-and-permissions.md"), "general");
    const header = read("docs/roles-and-permissions.md")
      .split("\n")
      .find((line) => line.startsWith("| Permission |"))
      .split("|")
      .slice(2, -1)
      .map((cell) => cell.trim());
    expect(header).toEqual(ROLES);
    const documented = Object.fromEntries(
      rows.map(([name, ...cells]) => [name, ROLES.filter((_, i) => cells[i] === "✓")])
    );
    const actual = Object.fromEntries(
      Object.entries(PERMISSIONS).map(([name, roles]) => [
        name,
        ROLES.filter((role) => roles.includes(role)),
      ])
    );
    expect(documented).toEqual(actual);
  });

  it("the action permission table matches config/permissions.js", () => {
    const rows = matrix(read("docs/roles-and-permissions.md"), "actions");
    expect(Object.fromEntries(rows)).toEqual(ACTION_PERMISSIONS);
  });

  it("relative links in the docs, README and CLAUDE.md point at existing files", () => {
    const files = [
      "README.md",
      "CLAUDE.md",
      "backend/README.md",
      "frontend/README.md",
      // Phase 12a: the changelog and the deploy guides (IT checklist, owner runbook included)
      "CHANGELOG.md",
      ...fs
        .readdirSync(path.join(repo, "deploy"))
        .filter((name) => name.endsWith(".md"))
        .map((name) => `deploy/${name}`),
      ...fs
        .readdirSync(docs)
        .filter((name) => name.endsWith(".md"))
        .map((name) => `docs/${name}`),
    ];
    const broken = [];
    for (const file of files) {
      const text = read(file);
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const clean = decodeURIComponent(target.split("#")[0].replace(/:\d+$/, ""));
        if (!clean) continue;
        const resolved = path.resolve(path.dirname(path.join(repo, file)), clean);
        if (!fs.existsSync(resolved)) broken.push(`${file} → ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
