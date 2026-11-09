const fs = require("node:fs");
const path = require("node:path");
const { can } = require("../config/permissions");

// The in-app user guide (phase 14, D78). Source: the Markdown parts in docs/user-guide/<lang>/,
// written in the format of docs/user-guide/README.md: front matter (id, requires, unless), one
// "#" title, and an anchor line `<a id="…" data-requires="…" data-unless="…"></a>` before each
// "##" section. Tags name permissions (config/permissions.js), never roles: a user gets the parts
// and sections whose permissions they all have and none of whose `unless` permissions.
//
// The release folder carries docs/user-guide next to backend/ (deploy/build-release.mjs), so the
// same relative path works in the repository and on the server.

const LANGUAGES = ["en", "ar"];
const defaultDir = () => path.resolve(__dirname, "../../../docs/user-guide");

const ANCHOR = /^<a id="([^"]+)"((?:\s+data-(?:requires|unless)="[^"]*")*)><\/a>$/;
const words = (value) => (value ?? "").split(/\s+/).filter(Boolean);
const attribute = (attrs, name) => attrs.match(new RegExp(`data-${name}="([^"]*)"`))?.[1];

const partFiles = (dir, lang) =>
  fs
    .readdirSync(path.join(dir, lang))
    .filter((name) => name.endsWith(".md"))
    .sort();

/**
 * One part file → { file, id, requires, unless, title, intro, sections: [{ id, requires, unless,
 * title, body }], errors }. Format problems are collected in `errors`, not thrown, so the tests
 * can name them all.
 */
const parsePart = (dir, lang, file) => {
  const text = fs.readFileSync(path.join(dir, lang, file), "utf8").replace(/\r\n/g, "\n");
  const errors = [];
  // Records `message` unless `ok`
  const check = (ok, message) => (ok ? null : errors.push(`${lang}/${file}: ${message}`));
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (!front) errors.push(`${lang}/${file}: no front matter`);
  else {
    for (const line of front[1].split("\n")) {
      const [, key, value] = line.match(/^(\w+):\s*(.*)$/) ?? [];
      if (key) meta[key] = value.trim();
      else if (line.trim()) errors.push(`${lang}/${file}: bad front matter line "${line}"`);
    }
  }
  const part = {
    file,
    id: meta.id,
    requires: words(meta.requires),
    unless: words(meta.unless),
    title: null,
    intro: "",
    sections: [],
    errors,
  };
  check(part.id, "no id");

  const lines = (front ? text.slice(front[0].length) : text).split("\n");
  let current = null;
  let pending = null; // the anchor seen on the line before
  for (const line of lines) {
    const anchor = line.match(ANCHOR);
    if (anchor) {
      pending = {
        id: anchor[1],
        requires: words(attribute(anchor[2], "requires")),
        unless: words(attribute(anchor[2], "unless")),
      };
      continue;
    } else if (line.startsWith("# ")) {
      check(!part.title, "more than one # title");
      part.title = line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      if (!pending) errors.push(`${lang}/${file}: "${line}" has no anchor on the line before`);
      current = {
        ...(pending ?? { id: null, requires: [], unless: [] }),
        title: line.slice(3).trim(),
        body: "",
      };
      part.sections.push(current);
    } else if (pending) {
      errors.push(`${lang}/${file}: anchor "${pending.id}" is not followed by a ## heading`);
    } else if (current) current.body += `${line}\n`;
    else if (part.title) part.intro += `${line}\n`;
    pending = null;
  }
  check(part.title, "no # title");
  return part;
};

const readGuide = (lang, dir = defaultDir()) =>
  partFiles(dir, lang).map((file) => parsePart(dir, lang, file));

// Parsed once per language in production; read again on each request elsewhere, so an edit of the
// Markdown shows without a restart while writing the guide.
const cache = new Map();
const cached = (lang) => cache.get(lang) ?? cache.set(lang, readGuide(lang)).get(lang);
const guideOf = (lang) => (process.env.NODE_ENV === "production" ? cached(lang) : readGuide(lang));

/** Whether the user sees an item tagged with `requires` / `unless` permissions. */
const visibleTo = (user, { requires, unless }) =>
  requires.every((name) => can(user, name)) && !unless.some((name) => can(user, name));

/** The parts and sections the user sees, in order. */
const filterGuide = (parts, user) =>
  parts
    .filter((part) => visibleTo(user, part))
    .map((part) => ({
      ...part,
      sections: part.sections.filter((section) => visibleTo(user, section)),
    }));

// Links between parts are written as files ("05-tool-1-screening.md#screening-review") so they work
// on GitHub; in the app they become in-page links ("#screening-review", or "#<part id>" for a
// whole part). A link to a part or section this user does not see is left as its text.
const rewriteLinks = (markdown, fileToPart, visibleIds) =>
  markdown.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (link, text, target) => {
    const [file, fragment] = target.split("#");
    const id = /^(https?:|mailto:)/.test(target) ? null : fragment || fileToPart.get(file);
    // shown: an in-page link; hidden: its text; not a guide link (outside, unknown file): as it is
    const rendered = id ? text : link;
    return visibleIds.has(id) ? `[${text}](#${id})` : rendered;
  });

/**
 * The guide `parts` (as readGuide returns them) for this user → { lang, parts: [{ id, title, intro,
 * sections: [{ id, title, body }] }] }, Markdown with in-page links.
 */
const renderFor = (parts, user, lang) => {
  const fileToPart = new Map(parts.map((part) => [part.file, part.id]));
  const visible = filterGuide(parts, user);
  const visibleIds = new Set(
    visible.flatMap((part) => [part.id, ...part.sections.map((section) => section.id)])
  );
  const links = (markdown) => rewriteLinks(markdown, fileToPart, visibleIds).trim();
  return {
    lang,
    parts: visible.map((part) => ({
      id: part.id,
      title: part.title,
      intro: links(part.intro),
      sections: part.sections.map((section) => ({
        id: section.id,
        title: section.title,
        body: links(section.body),
      })),
    })),
  };
};

/** GET /help: the guide in `lang` for this user. */
const helpFor = (user, lang) => renderFor(guideOf(lang), user, lang);

module.exports = {
  LANGUAGES,
  readGuide,
  parsePart,
  partFiles,
  filterGuide,
  visibleTo,
  renderFor,
  helpFor,
};
