// The user guide (docs/user-guide/<lang>/*.md, phase 14) as the Help service reads it
// (services/help.service.js), for tests/userGuide.test.js and tests/help.test.js.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { require } from "./app.js";

const service = require("../../src/services/help.service");

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const guideDir = path.join(repo, "docs/user-guide");
export const LANGUAGES = service.LANGUAGES;

export const partFiles = (lang) => service.partFiles(guideDir, lang);
export const readGuide = (lang) => service.readGuide(lang, guideDir);

/** The parts and sections a user of this role sees. */
export const guideFor = (parts, role) => service.filterGuide(parts, { role });
