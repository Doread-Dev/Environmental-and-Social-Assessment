// Reads the user guide (docs/user-guide/<lang>/*.md, phase 14) into parts and sections, the format
// described in docs/user-guide/README.md. Used by tests/userGuide.test.js; the Help endpoint reads
// the guide the same way.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const guideDir = path.join(repo, "docs/user-guide");
export const LANGUAGES = ["en", "ar"];

const ANCHOR = /^<a id="([^"]+)"((?:\s+data-(?:requires|unless)="[^"]*")*)><\/a>$/;
const words = (value) => (value ?? "").split(/\s+/).filter(Boolean);
const attribute = (attrs, name) => attrs.match(new RegExp(`data-${name}="([^"]*)"`))?.[1];

export const partFiles = (lang) =>
  fs
    .readdirSync(path.join(guideDir, lang))
    .filter((name) => name.endsWith(".md"))
    .sort();

/**
 * One part file → { file, id, requires, unless, title, intro, sections: [{ id, requires, unless,
 * title, body }], errors }. `errors` lists format problems instead of throwing, so a test can name
 * them all.
 */
export function parsePart(lang, file) {
  const text = fs.readFileSync(path.join(guideDir, lang, file), "utf8").replace(/\r\n/g, "\n");
  const errors = [];
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
  if (!part.id) errors.push(`${lang}/${file}: no id`);

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
    }
    if (line.startsWith("# ")) {
      if (part.title) errors.push(`${lang}/${file}: more than one # title`);
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
  if (!part.title) errors.push(`${lang}/${file}: no # title`);
  return part;
}

export const readGuide = (lang) => partFiles(lang).map((file) => parsePart(lang, file));

/** Whether a user with these general permissions sees an item tagged requires/unless. */
export const visibleTo = (permissions, { requires, unless }) =>
  requires.every((name) => permissions.includes(name)) &&
  !unless.some((name) => permissions.includes(name));

/** The parts and sections a user with these permissions sees. */
export const guideFor = (parts, permissions) =>
  parts
    .filter((part) => visibleTo(permissions, part))
    .map((part) => ({
      ...part,
      sections: part.sections.filter((section) => visibleTo(permissions, section)),
    }));
