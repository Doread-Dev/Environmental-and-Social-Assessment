// Rules of the server scripts (phase 11): backup names and retention, the "not on the database
// disk" check, the MongoDB/kernel matrix, argument parsing, count comparison, replica-set URIs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { require } from "./helpers/app.js";

const backup = require("../../scripts/lib/backup");
const ops = require("../../scripts/lib/ops");
const { kernelCompatibility, nodeMajor } = require("../../scripts/lib/serverCheck");
const { directUri, firstHost } = require("../../scripts/init-replica-set");

describe("backup names", () => {
  it("are dated in UTC, without characters Windows refuses", () => {
    const name = backup.backupName(new Date("2026-11-05T02:00:07.123Z"));
    expect(name).toBe("esms-20261105-020007Z");
    expect(name).not.toMatch(/[:\\/*?"<>|]/);
    expect(backup.backupDate(name)).toEqual(new Date("2026-11-05T02:00:07Z"));
  });

  it("anything else in the folder is not a backup", () => {
    for (const name of ["esms-20261105-020007Z.partial", "notes.txt", "esms-latest", "x"]) {
      expect(backup.backupDate(name)).toBeNull();
    }
  });
});

describe("BACKUP_KEEP_DAYS", () => {
  it("defaults to 30 days (owner)", () => {
    expect(backup.keepDays(undefined)).toBe(30);
    expect(backup.keepDays("")).toBe(30);
    expect(backup.DEFAULT_KEEP_DAYS).toBe(30);
  });

  it("takes whole days of 1 or more", () => {
    expect(backup.keepDays("7")).toBe(7);
    for (const bad of ["0", "-1", "1.5", "a week"]) {
      expect(() => backup.keepDays(bad)).toThrow(/whole number of days/);
    }
  });
});

describe("retention", () => {
  const now = new Date("2026-12-31T02:00:00Z");
  const daily = (count) =>
    Array.from({ length: count }, (_, i) =>
      backup.backupName(new Date(now.getTime() - i * 24 * 60 * 60 * 1000))
    );

  it("keeps 30 days and deletes older backups", () => {
    const names = daily(35);
    const expired = backup.expiredBackups(names, now, 30);
    expect(expired).toEqual(names.slice(31));
    expect(expired).toHaveLength(4);
  });

  it("never deletes the newest backup, however old", () => {
    const old = [backup.backupName(new Date("2026-01-01T02:00:00Z"))];
    expect(backup.expiredBackups(old, now, 30)).toEqual([]);
    const two = [...old, backup.backupName(new Date("2026-01-02T02:00:00Z"))];
    expect(backup.expiredBackups(two, now, 30)).toEqual([old[0]]);
  });

  it("deletes unfinished .partial folders older than a day, nothing else", () => {
    const names = ["esms-20261229-020000Z.partial", "esms-20261231-015900Z.partial", "notes.txt"];
    const times = {
      "esms-20261229-020000Z.partial": new Date("2026-12-29T02:00:00Z"),
      "esms-20261231-015900Z.partial": new Date("2026-12-31T01:59:00Z"),
    };
    expect(backup.expiredBackups(names, now, 30, (n) => times[n])).toEqual([
      "esms-20261229-020000Z.partial",
    ]);
  });
});

describe("the backup folder is never on the database disk", () => {
  it("two folders of one disk are the same disk, even before the backup folder exists", () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "esms-disk-"));
    try {
      expect(backup.sameDisk(path.join(base, "db"), path.join(base, "not-yet", "backups"))).toBe(
        true
      );
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });
});

describe("MongoDB 8 vs the Linux kernel (phase 11 note)", () => {
  it.each([
    ["6.8.0-49-generic", "8.0.12", true],
    ["6.18.9", "8.3.0", true],
    ["6.19.0", "8.0.29", false],
    ["7.0.13-azure", "8.3.8", false],
    ["6.19.2", "8.2.1", false],
    ["6.19.2", "8.0.30", true],
    ["7.0.5", "8.3.9", true],
    ["7.0.14", "8.0.1", true],
    ["7.0.5", "7.0.25", true],
    ["7.0.5", "8.4.0", true],
  ])("kernel %s with MongoDB %s → ok %s", (kernel, mongodb, ok) => {
    expect(kernelCompatibility(kernel, mongodb).ok).toBe(ok);
  });

  it("an unknown version is not ok", () => {
    expect(kernelCompatibility("", "8.0.1").ok).toBe(false);
  });

  it("reads the Node major of .nvmrc", () => {
    expect(nodeMajor("26\n")).toBe(26);
    expect(nodeMajor("v26.13.0")).toBe(26);
    const nvmrc = fs.readFileSync(path.join(ops.BACKEND_DIR, "../.nvmrc"), "utf8");
    expect(nodeMajor(nvmrc)).toBe(Number(process.versions.node.split(".")[0]));
  });
});

describe("script helpers", () => {
  it("parseArgs reads --name value, --name=value and flags", () => {
    expect(
      ops.parseArgs(["--from", "D:\\b\\esms-1", "--target-uri=mongodb://h/db?a=b", "--yes"])
    ).toEqual({ from: "D:\\b\\esms-1", "target-uri": "mongodb://h/db?a=b", yes: true });
  });

  it("compareCounts lists only the collections that differ", () => {
    expect(ops.compareCounts({ a: 1, b: 2, c: 0 }, { a: 1, b: 3, d: 4 })).toEqual([
      { collection: "b", expected: 2, actual: 3 },
      { collection: "d", expected: 0, actual: 4 },
    ]);
  });

  it("listFiles lists every file with size (and sha256 on request)", () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "esms-files-"));
    try {
      fs.mkdirSync(path.join(base, "library"));
      fs.writeFileSync(path.join(base, "library", "a.pdf"), "abc");
      fs.writeFileSync(path.join(base, "b.docx"), "de");
      expect(ops.listFiles(base)).toEqual([
        { path: "b.docx", size: 2 },
        { path: "library/a.pdf", size: 3 },
      ]);
      expect(ops.listFiles(base, { hash: true })[1].sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(ops.listFiles(path.join(base, "missing"))).toEqual([]);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it("withDatabase swaps the database name and keeps the options", () => {
    expect(ops.withDatabase("mongodb://127.0.0.1:27017/esms?replicaSet=rs0", "esms_check")).toBe(
      "mongodb://127.0.0.1:27017/esms_check?replicaSet=rs0"
    );
    expect(ops.withDatabase("mongodb://u:p@a:1,b:2/esms", "x")).toBe("mongodb://u:p@a:1,b:2/x");
    expect(ops.withDatabase("mongodb://h:1", "x")).toBe("mongodb://h:1/x");
    expect(() => ops.withDatabase("postgres://h/db", "x")).toThrow(/Unrecognised/);
  });

  it("toolPath uses MONGODB_TOOLS_DIR when it is set", () => {
    const exe = process.platform === "win32" ? "mongodump.exe" : "mongodump";
    expect(ops.toolPath("mongodump", {})).toBe(exe);
    expect(ops.toolPath("mongodump", { MONGODB_TOOLS_DIR: "/opt/tools" })).toBe(
      path.join("/opt/tools", exe)
    );
  });
});

describe("init-replica-set connection", () => {
  it("connects straight to the server, without the replica-set option", () => {
    expect(directUri("mongodb://127.0.0.1:27017/esms?replicaSet=rs0")).toBe(
      "mongodb://127.0.0.1:27017/esms?directConnection=true"
    );
    expect(directUri("mongodb://127.0.0.1/esms")).toBe(
      "mongodb://127.0.0.1/esms?directConnection=true"
    );
  });

  it("names the member by the first host of the connection string", () => {
    expect(firstHost("mongodb://127.0.0.1:27017/esms?replicaSet=rs0")).toBe("127.0.0.1:27017");
    expect(firstHost("mongodb://user:pw@db.local/esms")).toBe("db.local:27017");
    expect(firstHost("mongodb://a:1,b:2/esms")).toBe("a:1");
  });
});
