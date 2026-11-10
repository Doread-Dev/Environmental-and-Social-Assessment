// Daily backup (phase 11, D38, D47, D75 3): the database (mongodump, the audit log included) and a
// copy of the uploads folder (project files and library/), in one dated folder under BACKUP_DIR.
// Backups older than BACKUP_KEEP_DAYS (default 30) are deleted, never the newest one.
//
// Usage (settings from backend/.env; deploy/windows/backup.ps1 and deploy/linux/backup.sh call
// this, the scheduled task / systemd timer runs them daily):
//   node scripts/backup.js
//   node scripts/backup.js --allow-same-disk   # tests only: skip the database-disk rule (also
//                                              # needed when the disk cannot be checked)
//
// Settings: MONGODB_URI, UPLOADS_DIR (default backend/uploads), BACKUP_DIR (required: a second
// disk or a network share, never the database disk), BACKUP_KEEP_DAYS (default 30),
// MONGODB_TOOLS_DIR (the MongoDB Database Tools' bin folder, when not on the PATH).
//
// Layout: <BACKUP_DIR>/esms-20261105-020000Z/{database.archive.gz, uploads/, manifest.json}. It is
// written as "<name>.partial" and renamed when complete, so a folder without ".partial" is a full
// backup. Exit code 0 = backup written; anything else = no new backup (the message says why).
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const ops = require("./lib/ops");
const { PARTIAL, backupName, keepDays, expiredBackups, diskCheck } = require("./lib/backup");

const ARCHIVE = "database.archive.gz";

const uploadsDir = (env) => path.resolve(env.UPLOADS_DIR || path.join(ops.BACKEND_DIR, "uploads"));

// The folder MongoDB keeps its data in, as the server reports it (null when it may not say).
const databasePath = async (client) => {
  try {
    const opts = await client.db("admin").command({ getCmdLineOpts: 1 });
    return opts.parsed?.storage?.dbPath ?? null;
  } catch {
    return null;
  }
};

async function main() {
  const env = ops.loadEnv();
  const args = ops.parseArgs(process.argv.slice(2));
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set (backend/.env)");
  if (!env.BACKUP_DIR) {
    throw new Error(
      "BACKUP_DIR is not set. Set it in backend/.env to a folder on a second disk or a network " +
        "share (deploy/README.md, Backups)."
    );
  }
  const days = keepDays(env.BACKUP_KEEP_DAYS);
  const backupRoot = path.resolve(env.BACKUP_DIR);
  const uploads = uploadsDir(env);
  const inside = path.relative(uploads, backupRoot);
  if (inside === "" || (!inside.startsWith("..") && !path.isAbsolute(inside))) {
    throw new Error(`BACKUP_DIR (${backupRoot}) must not be inside UPLOADS_DIR (${uploads})`);
  }

  const client = new mongoose.mongo.MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  try {
    const db = client.db();
    // Never the database disk (D75 3); a disk that cannot be checked is refused too, so a backup
    // never passes the rule silently. --allow-same-disk is the explicit override.
    const disk = diskCheck(backupRoot, await databasePath(client));
    if (disk.status !== "different") {
      if (!args["allow-same-disk"]) {
        throw new Error(
          disk.status === "same"
            ? `BACKUP_DIR (${backupRoot}) is on the ${disk.reason}. Use a second disk or a ` +
                "network share: a disk failure would take both."
            : `Could not check that BACKUP_DIR (${backupRoot}) is not on the database disk: ` +
                `${disk.reason}. Set storage.dbPath in MongoDB's config file (deploy/config), or ` +
                "run with --allow-same-disk after checking the disks yourself."
        );
      }
      console.log(`Disk check overridden (--allow-same-disk): ${disk.reason}.`);
    }

    const started = new Date();
    const name = backupName(started);
    const partial = path.join(backupRoot, `${name}${PARTIAL}`);
    const final = path.join(backupRoot, name);
    fs.mkdirSync(partial, { recursive: true });

    try {
      const countsBefore = await ops.countCollections(db);
      await ops.runTool(
        "mongodump",
        env.MONGODB_URI,
        [`--archive=${path.join(partial, ARCHIVE)}`, "--gzip"],
        env
      );
      const countsAfter = await ops.countCollections(db);

      // Project files and the library; an install without uploads yet still gets an empty folder.
      const uploadsCopy = path.join(partial, "uploads");
      if (fs.existsSync(uploads)) {
        fs.cpSync(uploads, uploadsCopy, { recursive: true, preserveTimestamps: true });
      } else {
        fs.mkdirSync(uploadsCopy);
      }
      const files = ops.listFiles(uploadsCopy);

      const manifest = {
        app: "ESMS",
        format: 1,
        created_at: started.toISOString(),
        finished_at: new Date().toISOString(),
        database: db.databaseName,
        archive: ARCHIVE,
        collections: countsAfter,
        // False when something was written while the dump ran: counts may differ by those writes.
        counts_exact: ops.compareCounts(countsBefore, countsAfter).length === 0,
        uploads: { files: files.length, bytes: files.reduce((sum, f) => sum + f.size, 0) },
        keep_days: days,
      };
      fs.writeFileSync(
        path.join(partial, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`
      );
      fs.renameSync(partial, final);

      const total = Object.values(countsAfter).reduce((sum, n) => sum + n, 0);
      console.log(
        `Backup written: ${final} (database ${db.databaseName}: ` +
          `${Object.keys(countsAfter).length} collections, ${total} documents; ` +
          `uploads: ${files.length} files)`
      );
    } catch (err) {
      fs.rmSync(partial, { recursive: true, force: true });
      throw err;
    }

    // Retention, only after a new backup was written.
    const names = fs.readdirSync(backupRoot);
    const expired = expiredBackups(
      names,
      new Date(),
      days,
      (n) => fs.statSync(path.join(backupRoot, n)).mtime
    );
    for (const old of expired) {
      fs.rmSync(path.join(backupRoot, old), { recursive: true, force: true });
      console.log(`Deleted old backup: ${old}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(`Backup FAILED: ${err.message}`);
  process.exit(1);
});
