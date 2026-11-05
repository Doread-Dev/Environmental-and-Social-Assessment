// Backup naming, retention and the "not on the database disk" rule (phase 11, D75 3).
const fs = require("node:fs");
const path = require("node:path");

const PREFIX = "esms-";
const PARTIAL = ".partial";
const NAME = /^esms-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_KEEP_DAYS = 30;

// esms-20261105-020000Z (UTC; no ":" so the name works on Windows too).
const backupName = (date) =>
  `${PREFIX}${date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z")
    .replace("T", "-")}`;

// The time in a backup folder's name, or null for anything else (an unfinished .partial folder).
const backupDate = (name) => {
  const m = NAME.exec(name);
  return m ? new Date(Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6])) : null;
};

// BACKUP_KEEP_DAYS: whole days ≥ 1, default 30 (owner).
const keepDays = (raw) => {
  if (raw === undefined || String(raw).trim() === "") return DEFAULT_KEEP_DAYS;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`BACKUP_KEEP_DAYS must be a whole number of days (1 or more), not "${raw}"`);
  }
  return days;
};

/**
 * Which folders in the backup folder to delete: finished backups older than `days`, but never the
 * newest one (a backup that stopped running for a month still leaves the last good copy), and
 * unfinished `.partial` folders older than a day (left by a run that failed or was stopped).
 * Anything else in the folder is never touched.
 * @param {string[]} names folder names
 * @param {Date} now
 * @param {number} days
 * @param {(name: string) => Date} [partialTime] modification time of a .partial folder
 */
const expiredBackups = (names, now, days, partialTime = () => now) => {
  const finished = names
    .map((name) => ({ name, date: backupDate(name) }))
    .filter((b) => b.date)
    .sort((a, b) => b.date - a.date);
  const cutoff = now.getTime() - days * DAY_MS;
  const old = finished
    .slice(1)
    .filter((b) => b.date.getTime() < cutoff)
    .map((b) => b.name);
  const leftovers = names.filter(
    (name) =>
      name.startsWith(PREFIX) &&
      name.endsWith(PARTIAL) &&
      now.getTime() - partialTime(name).getTime() > DAY_MS
  );
  return [...old, ...leftovers];
};

// Nearest existing folder at or above `p` (the backup folder may not exist yet).
const existingAncestor = (p) => {
  let current = path.resolve(p);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return current;
};

/**
 * True when both paths are on the same disk (volume). The owner's rule: backups go to a second
 * disk or a network share, never the database disk.
 */
const sameDisk = (a, b) => {
  const left = existingAncestor(a);
  const right = existingAncestor(b);
  if (!left || !right) return false;
  return fs.statSync(left).dev === fs.statSync(right).dev;
};

/**
 * The "never the database disk" rule (D75 3) as one answer: `same`, `different`, or `unknown` when
 * it cannot be checked from here — MongoDB did not report its data folder (an access rule, or the
 * default folder, which `getCmdLineOpts` does not list), or that folder is not on this machine
 * (MongoDB in a container or on another host). The backup treats `unknown` like `same`: it
 * refuses unless the operator passes `--allow-same-disk` after checking the disks themselves.
 * @param {string} backupDir
 * @param {string|null} dbPath MongoDB's dbPath as the server reports it
 * @returns {{ status: "same"|"different"|"unknown", reason: string }}
 */
const diskCheck = (backupDir, dbPath) => {
  if (!dbPath) {
    return {
      status: "unknown",
      reason: "MongoDB did not report its data folder (storage.dbPath)",
    };
  }
  if (!fs.existsSync(dbPath)) {
    return {
      status: "unknown",
      reason: `MongoDB's data folder (${dbPath}) is not on this machine`,
    };
  }
  return sameDisk(backupDir, dbPath)
    ? { status: "same", reason: `same disk as the database (${dbPath})` }
    : { status: "different", reason: `not on the database disk (${dbPath})` };
};

module.exports = {
  diskCheck,
  PREFIX,
  PARTIAL,
  DEFAULT_KEEP_DAYS,
  backupName,
  backupDate,
  keepDays,
  expiredBackups,
  sameDisk,
};
