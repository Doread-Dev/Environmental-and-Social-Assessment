// Restores one backup made by scripts/backup.js (phase 11, D75 3): the database and the uploads
// folder. Moving the app to a new server is the same: install it there, then restore a backup.
//
// Usage (settings from backend/.env; deploy/windows/restore.ps1 and deploy/linux/restore.sh call
// this). Stop the ESMS service first when restoring into the app's own database.
//   node scripts/restore.js --from <backup folder>
//   node scripts/restore.js --from <backup folder> --target-uri <uri> --uploads-dir <folder>
//       restores into another database and folder (the restore test, deploy/*/test-backup-restore)
//   --yes     no question (scripts)        --strict  exit 1 when a count differs from the manifest
//
// The database in the backup replaces the target database (mongorestore --drop). An uploads
// folder that is not empty is kept next to it as "<folder>.before-restore-<time>", never deleted.
// Afterwards every collection is counted and compared with the backup's manifest.
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const mongoose = require("mongoose");
const ops = require("./lib/ops");
const { backupName } = require("./lib/backup");

const appAnswers = async (port) => {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
};

const confirm = async (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim() === "RESTORE";
  } finally {
    rl.close();
  }
};

async function main() {
  const env = ops.loadEnv();
  const args = ops.parseArgs(process.argv.slice(2));
  if (!args.from || args.from === true) throw new Error("Name the backup folder: --from <folder>");

  const from = path.resolve(args.from);
  const manifestFile = path.join(from, "manifest.json");
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`${from} is not a finished backup (no manifest.json)`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const archive = path.join(from, manifest.archive);
  if (!fs.existsSync(archive)) throw new Error(`The backup has no ${manifest.archive}`);

  const targetUri = args["target-uri"] || env.MONGODB_URI;
  if (!targetUri) throw new Error("MONGODB_URI is not set (backend/.env)");
  const uploads = path.resolve(
    args["uploads-dir"] || env.UPLOADS_DIR || path.join(ops.BACKEND_DIR, "uploads")
  );

  const client = new mongoose.mongo.MongoClient(targetUri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  try {
    const db = client.db();
    const target = db.databaseName;
    const ownDatabase = targetUri === env.MONGODB_URI;
    if (ownDatabase && (await appAnswers(env.PORT || 3000))) {
      throw new Error("The app is running. Stop the ESMS service first, then restore.");
    }

    console.log(`Backup:   ${from} (${manifest.created_at}, database ${manifest.database})`);
    console.log(`Restore:  database ${target} and uploads folder ${uploads}`);
    if (!args.yes && !(await confirm(`This replaces database "${target}". Type RESTORE: `))) {
      console.log("Nothing restored.");
      return;
    }

    await ops.runTool(
      "mongorestore",
      targetUri,
      [
        `--archive=${archive}`,
        "--gzip",
        "--drop",
        `--nsInclude=${manifest.database}.*`,
        `--nsFrom=${manifest.database}.*`,
        `--nsTo=${target}.*`,
      ],
      env
    );

    const source = path.join(from, "uploads");
    if (fs.existsSync(uploads) && fs.readdirSync(uploads).length > 0) {
      const kept = `${uploads}.before-restore-${backupName(new Date()).slice(5)}`;
      fs.renameSync(uploads, kept);
      console.log(`The uploads folder that was there is kept as ${kept}`);
    }
    fs.mkdirSync(path.dirname(uploads), { recursive: true });
    fs.cpSync(source, uploads, { recursive: true, preserveTimestamps: true });

    const counts = await ops.countCollections(db);
    const diff = ops.compareCounts(manifest.collections, counts);
    const files = ops.listFiles(uploads);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    console.log(
      `Restored: ${Object.keys(counts).length} collections, ${total} documents; ` +
        `uploads: ${files.length} files`
    );
    const uploadsDiffer = files.length !== manifest.uploads.files;
    if (diff.length === 0 && !uploadsDiffer) {
      console.log("Check: every count matches the backup's manifest.");
      return;
    }
    for (const d of diff) {
      console.warn(`  ${d.collection}: backup ${d.expected}, restored ${d.actual}`);
    }
    if (uploadsDiffer) {
      console.warn(`  uploads: backup ${manifest.uploads.files} files, restored ${files.length}`);
    }
    const note = manifest.counts_exact
      ? ""
      : " (the app wrote data while this backup ran, so small differences are expected)";
    console.warn(`Check: counts differ from the manifest${note}.`);
    if (args.strict) process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(`Restore FAILED: ${err.message}`);
  process.exit(1);
});
