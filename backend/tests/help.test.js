// GET /api/v1/help (phase 14, D78): the in-app user guide, filtered by the user's permissions.
// Each role gets exactly the parts and sections its permissions allow; nothing about roles is
// written in the guide or the service, only permission names.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { ROLES, loginAs } from "./helpers/fixtures.js";
import { guideFor, readGuide } from "./helpers/userGuide.js";

const service = require("../../src/services/help.service");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const ids = (parts) => parts.flatMap((p) => [p.id, ...p.sections.map((s) => s.id)]);

const getHelp = async (role, query = "") => {
  const { token } = await loginAs(role);
  return request(app).get(`/api/v1/help${query}`).set(auth(token));
};

afterEach(() => vi.restoreAllMocks());

describe("GET /help", () => {
  it("answers 401 without a sign-in", async () => {
    const res = await request(app).get("/api/v1/help");
    expect(res.status).toBe(401);
  });

  it.each(ROLES)("%s gets exactly the parts and sections its permissions allow", async (role) => {
    const res = await getHelp(role);
    expect(res.status).toBe(200);
    expect(res.body.data.lang).toBe("en");
    const expected = guideFor(readGuide("en"), role);
    expect(ids(res.body.data.parts)).toEqual(ids(expected));
  });

  it("the administrator gets every section except the read-only texts", async () => {
    const res = await getHelp("admin");
    const all = readGuide("en").flatMap((p) => p.sections);
    const readOnly = all.filter((s) => s.unless.length > 0).map((s) => s.id);
    const got = ids(res.body.data.parts);
    expect(readOnly.length).toBeGreaterThan(0);
    expect(got.filter((id) => readOnly.includes(id))).toEqual([]);
    expect(all.filter((s) => s.unless.length === 0).every((s) => got.includes(s.id))).toBe(true);
  });

  it("the viewer gets no tagged section and not the Settings part", async () => {
    const res = await getHelp("viewer");
    const got = ids(res.body.data.parts);
    const tagged = readGuide("en")
      .flatMap((p) => p.sections)
      .filter((s) => s.requires.length > 0)
      .map((s) => s.id);
    expect(got.filter((id) => tagged.includes(id))).toEqual([]);
    expect(got).not.toContain("administration");
    expect(got).toContain("role-reading");
  });

  it("an editor gets the project work, not the review, users or Activity log", async () => {
    const got = ids((await getHelp("program_manager")).body.data.parts);
    expect(got).toEqual(expect.arrayContaining(["screening-submit", "role-project-work"]));
    for (const id of [
      "screening-review",
      "users",
      "activity-log",
      "project-purge",
      "role-reading",
    ]) {
      expect(got).not.toContain(id);
    }
  });

  it("returns Arabic with the same ids as English (lang=ar)", async () => {
    const en = await getHelp("environmental_specialist");
    const ar = await getHelp("environmental_specialist", "?lang=ar");
    expect(ar.status).toBe(200);
    expect(ar.body.data.lang).toBe("ar");
    expect(ids(ar.body.data.parts)).toEqual(ids(en.body.data.parts));
    expect(ar.body.data.parts[0].title).toMatch(/[؀-ۿ]/);
  });

  it("refuses an unknown language with 400", async () => {
    const res = await getHelp("viewer", "?lang=fr");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/lang/);
  });

  it("sends no anchor lines, and links become in-page links or plain text", async () => {
    const res = await getHelp("viewer");
    const text = JSON.stringify(res.body.data);
    expect(text).not.toMatch(/<a id=/);
    expect(text).not.toMatch(/\]\([^)#]*\.md/);
    // The viewer's quick start links to the signing-in part, which every role sees
    const quick = res.body.data.parts.find((p) => p.id === "quick-start");
    expect(quick.sections[0].body).toContain("](#signing-in)");
  });
});

describe("help service", () => {
  const write = (dir, file, text) => {
    fs.mkdirSync(path.join(dir, "en"), { recursive: true });
    fs.writeFileSync(path.join(dir, "en", file), text);
  };

  it("drops a link to a section the user does not see, keeps its text", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-guide-"));
    try {
      write(
        dir,
        "01-a.md",
        "---\nid: a\n---\n\n# A\n\n" +
          '<a id="open"></a>\n## Open\n\nSee [the review](02-b.md#secret) and [part B](02-b.md).\n'
      );
      write(
        dir,
        "02-b.md",
        '---\nid: b\n---\n\n# B\n\n<a id="secret" data-requires="approve"></a>\n## Secret\n\nx\n'
      );
      const parts = service.readGuide("en", dir);
      const viewer = service.renderFor(parts, { role: "viewer" }, "en");
      expect(ids(viewer.parts)).toEqual(["a", "open", "b"]);
      expect(viewer.parts[0].sections[0].body).toBe("See the review and [part B](#b).");
      const admin = service.renderFor(parts, { role: "admin" }, "en");
      expect(ids(admin.parts)).toEqual(["a", "open", "b", "secret"]);
      expect(admin.parts[0].sections[0].body).toBe("See [the review](#secret) and [part B](#b).");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("names format errors instead of throwing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-guide-"));
    try {
      write(dir, "01-a.md", '# No front matter\n\n## No anchor\n\n<a id="x"></a>\n\ntext\n');
      const [part] = service.readGuide("en", dir);
      expect(part.errors).toEqual(
        expect.arrayContaining([
          "en/01-a.md: no front matter",
          "en/01-a.md: no id",
          'en/01-a.md: "## No anchor" has no anchor on the line before',
          'en/01-a.md: anchor "x" is not followed by a ## heading',
        ])
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("names the other format errors: a bad front matter line, two titles, no title", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-guide-"));
    try {
      write(dir, "01-a.md", "---\nid: a\nnot a field\n\n---\n\n# One\n\n# Two\n");
      write(dir, "02-b.md", "---\nid: b\n---\n\nNo title here.\n");
      const [a, b] = service.readGuide("en", dir);
      expect(a.errors).toEqual([
        'en/01-a.md: bad front matter line "not a field"',
        "en/01-a.md: more than one # title",
      ]);
      expect(b.errors).toEqual(["en/02-b.md: no # title"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("applies part tags, keeps outside links and links it cannot place", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-guide-"));
    try {
      write(
        dir,
        "01-a.md",
        "---\nid: a\n---\n\n# A\n\nSee [the site](https://example.com), [mail](mailto:x@example.com)" +
          " and [the readme](../README.md).\n"
      );
      write(dir, "02-admin.md", "---\nid: admin-only\nrequires: manage_users\n---\n\n# Admin\n");
      write(dir, "03-read.md", "---\nid: read-only\nunless: edit\n---\n\n# Reading\n");
      const parts = service.readGuide("en", dir);
      expect(parts[1]).toMatchObject({ requires: ["manage_users"], unless: [] });
      expect(parts[2]).toMatchObject({ requires: [], unless: ["edit"] });
      const viewer = service.renderFor(parts, { role: "viewer" }, "en");
      expect(viewer.parts.map((p) => p.id)).toEqual(["a", "read-only"]);
      expect(viewer.parts[0].intro).toBe(
        "See [the site](https://example.com), [mail](mailto:x@example.com) and [the readme](../README.md)."
      );
      const admin = service.renderFor(parts, { role: "admin" }, "en");
      expect(admin.parts.map((p) => p.id)).toEqual(["a", "admin-only"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("caches the parsed guide in production only", () => {
    const spy = vi.spyOn(fs, "readdirSync");
    const before = process.env.NODE_ENV;
    try {
      service.helpFor({ role: "viewer" }, "en");
      service.helpFor({ role: "viewer" }, "en");
      expect(spy).toHaveBeenCalledTimes(2);
      process.env.NODE_ENV = "production";
      spy.mockClear();
      service.helpFor({ role: "viewer" }, "ar");
      service.helpFor({ role: "viewer" }, "ar");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      process.env.NODE_ENV = before;
    }
  });
});
