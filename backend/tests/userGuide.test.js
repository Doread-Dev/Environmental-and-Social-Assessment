// Phase 14 (D76 1, D77 3): the user guide in docs/user-guide/en and docs/user-guide/ar stays in
// step with the app. Fails when a quoted UI label no longer exists in the frontend, when a role
// gets no section about its own work, when a tool page with a place key has no section, when a
// section is tagged with an unknown permission, when English and Arabic drift apart, or when a
// link inside the guide breaks. The format is described in docs/user-guide/README.md.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { require } from "./helpers/app.js";
import { LANGUAGES, guideDir, guideFor, partFiles, readGuide, repo } from "./helpers/userGuide.js";
import { HELP_SECTIONS } from "../../frontend/src/routes/helpSections.js";

const { ROLES } = require("../../src/config/roles");
const { isPermission } = require("../../src/config/permissions");

const guides = Object.fromEntries(LANGUAGES.map((lang) => [lang, readGuide(lang)]));
const allIds = (parts) => parts.flatMap((part) => [part.id, ...part.sections.map((s) => s.id)]);
const tags = (item) => `requires=${item.requires.join(",")} unless=${item.unless.join(",")}`;

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    );

// JSX spreads text over lines and writes some characters as entities: compare with the
// whitespace collapsed.
const normalize = (text) =>
  text
    .replace(/\{' '\}/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const frontendSource = walk(path.join(repo, "frontend/src"))
  .filter((file) => /\.(jsx?|mjs)$/.test(file) && !/\.test\.jsx?$/.test(file))
  .map((file) => normalize(fs.readFileSync(file, "utf8")))
  .join("\n");

describe("user guide (phase 14)", () => {
  it("every part file has front matter, one title and an anchor before each section", () => {
    const errors = LANGUAGES.flatMap((lang) => guides[lang].flatMap((part) => part.errors));
    expect(errors).toEqual([]);
  });

  it("English and Arabic have the same files, ids (in order) and tags", () => {
    expect(partFiles("ar")).toEqual(partFiles("en"));
    const shape = (parts) =>
      parts.map((part) => ({
        file: part.file,
        part: `${part.id} ${tags(part)}`,
        sections: part.sections.map((section) => `${section.id} ${tags(section)}`),
      }));
    expect(shape(guides.ar)).toEqual(shape(guides.en));
  });

  it("ids are lowercase words joined by '-' and unique in each language", () => {
    for (const lang of LANGUAGES) {
      const ids = allIds(guides[lang]);
      expect(
        ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)),
        lang
      ).toEqual([]);
      expect(
        ids.filter((id, i) => ids.indexOf(id) !== i),
        lang
      ).toEqual([]);
    }
  });

  it("every requires/unless tag names a real permission of config/permissions.js", () => {
    const unknown = guides.en
      .flatMap((part) => [part, ...part.sections])
      .flatMap((item) => [...item.requires, ...item.unless])
      .filter((name) => !isPermission(name));
    expect(unknown).toEqual([]);
  });

  it("every tool route with a place key has a part or section with that id, in both languages", () => {
    const routes = fs.readFileSync(path.join(repo, "frontend/src/routes/index.jsx"), "utf8");
    const places = [...new Set([...routes.matchAll(/place:\s*'([a-z_]+)'/g)].map((m) => m[1]))];
    expect(places.length).toBeGreaterThanOrEqual(5);
    for (const lang of LANGUAGES) {
      const ids = allIds(guides[lang]);
      expect(
        places.filter((place) => !ids.includes(place)),
        lang
      ).toEqual([]);
    }
  });

  it("every guide id the floating Help button opens (frontend routes/helpSections.js) exists, in both languages", () => {
    const wanted = [...new Set(HELP_SECTIONS.flatMap(([, ids]) => ids))];
    expect(wanted.length).toBeGreaterThan(10);
    for (const lang of LANGUAGES) {
      const ids = allIds(guides[lang]);
      expect(
        wanted.filter((id) => !ids.includes(id)),
        lang
      ).toEqual([]);
    }
  });

  it("every role in config/roles.js has its own section in 'Your role' and in the quick start", () => {
    for (const role of ROLES) {
      const parts = guideFor(guides.en, role);
      const sectionsOf = (id) => parts.find((part) => part.id === id)?.sections ?? [];
      const own = (section) => section.requires.length > 0 || section.unless.length > 0;
      expect(sectionsOf("your-role").filter(own).length, role).toBeGreaterThan(0);
      expect(sectionsOf("quick-start").filter(own).length, role).toBeGreaterThan(0);
    }
  });

  it("a read-only role sees no section that needs a permission it lacks", () => {
    const viewer = guideFor(guides.en, "viewer");
    const tagged = viewer.flatMap((part) => part.sections).filter((s) => s.requires.length > 0);
    expect(tagged).toEqual([]);
    const admin = guideFor(guides.en, "admin");
    expect(admin.flatMap((part) => part.sections).some((s) => s.id === "users")).toBe(true);
    expect(admin.flatMap((part) => part.sections).some((s) => s.id === "role-reading")).toBe(false);
  });

  it("every UI label the guide quotes in bold exists in frontend/src", () => {
    const missing = [];
    for (const lang of LANGUAGES) {
      for (const file of partFiles(lang)) {
        const text = fs.readFileSync(path.join(guideDir, lang, file), "utf8");
        for (const [, label] of text.matchAll(/\*\*([\s\S]+?)\*\*/g)) {
          const clean = normalize(label).trim();
          if (!frontendSource.includes(clean)) missing.push(`${lang}/${file}: ${clean}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("relative links in the guide point at existing files and section ids", () => {
    const broken = [];
    const files = [
      "README.md",
      ...LANGUAGES.flatMap((lang) => partFiles(lang).map((f) => `${lang}/${f}`)),
    ];
    for (const file of files) {
      const text = fs.readFileSync(path.join(guideDir, file), "utf8");
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:)/.test(target)) continue;
        const [name, fragment] = target.split("#");
        const resolved = name
          ? path.resolve(path.dirname(path.join(guideDir, file)), decodeURIComponent(name))
          : path.join(guideDir, file);
        if (!fs.existsSync(resolved)) {
          broken.push(`${file} → ${target}`);
          continue;
        }
        if (!fragment) continue;
        const lang = path.relative(guideDir, resolved).split(path.sep)[0];
        const part = guides[lang]?.find((p) => path.join(guideDir, lang, p.file) === resolved);
        if (!part || ![part.id, ...part.sections.map((s) => s.id)].includes(fragment)) {
          broken.push(`${file} → ${target}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});
