// Backup + restore check (phase 11, D75 3): backs up the app's database and uploads, restores that
// backup into an empty database (<db>_restore_check) and a temporary uploads folder, compares every
// collection count and every file (sha256), then removes the copies. The app's own database and
// files are only read. deploy/windows/test-backup-restore.ps1 and deploy/linux/test-backup-
// restore.sh call it; run it once after installing and after a MongoDB upgrade.
//
// Usage (settings from backend/.env):
//   node scripts/test-backup-restore.js
//   node scripts/test-backup-restore.js --allow-same-disk   # a test machine with one disk
//   node scripts/test-backup-restore.js --keep              # keep the copies to look at them
// Exit code 0 = the restore matches the backup.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const mongoose = require("mongoose");
const ops = require("./lib/ops");

const run = (script, args, env) => {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ops.BACKEND_DIR,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${script} failed (exit code ${result.status})`);
};

async function main() {
  const env = ops.loadEnv();
  const args = ops.parseArgs(process.argv.slice(2));
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set (backend/.env)");
  if (!env.BACKUP_DIR) throw new Error("BACKUP_DIR is not set (backend/.env)");

  const stamp = new Date().toISOString().replace(/[-:.]/g, "");
  const backupDir = path.join(path.resolve(env.BACKUP_DIR), `restore-check-${stamp}`);
  const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-restore-check-"));
  const restoredUploads = path.join(uploadsDir, "uploads");

  const source = new mongoose.mongo.MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await source.connect();
  const checkDb = `${source.db().databaseName}_restore_check`;
  const targetUri = ops.withDatabase(env.MONGODB_URI, checkDb);
  try {
    if ((await source.db(checkDb).listCollections().toArray()).length > 0) {
      throw new Error(`Database ${checkDb} is not empty; drop it or remove it first`);
    }

    console.log(`1. Backup into ${backupDir}`);
    run("backup.js", args["allow-same-disk"] ? ["--allow-same-disk"] : [], {
      BACKUP_DIR: backupDir,
    });
    const [name] = fs.readdirSync(backupDir).filter((n) => n.startsWith("esms-"));
    const folder = path.join(backupDir, name);
    const manifest = JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"), "utf8"));

    console.log(`\n2. Restore into the empty database ${checkDb} and ${restoredUploads}`);
    run("restore.js", [
      "--from",
      folder,
      "--target-uri",
      targetUri,
      "--uploads-dir",
      restoredUploads,
      "--yes",
      "--strict",
    ]);

    console.log("\n3. Compare");
    const restored = await ops.countCollections(source.db(checkDb));
    const countDiff = ops.compareCounts(manifest.collections, restored);
    const backupFiles = ops.listFiles(path.join(folder, "uploads"), { hash: true });
    const restoredFiles = ops.listFiles(restoredUploads, { hash: true });
    const filesMatch = JSON.stringify(backupFiles) === JSON.stringify(restoredFiles);

    const width = Math.max(...Object.keys(restored).map((n) => n.length), 10);
    for (const [collection, count] of Object.entries(manifest.collections)) {
      const mark = restored[collection] === count ? "OK  " : "DIFF";
      console.log(`   ${mark} ${collection.padEnd(width)} ${count} → ${restored[collection] ?? 0}`);
    }
    console.log(
      `   ${filesMatch ? "OK  " : "DIFF"} ${"uploads".padEnd(width)} ${backupFiles.length} files → ` +
        `${restoredFiles.length} files (sha256 compared)`
    );
    const total = Object.values(restored).reduce((sum, n) => sum + n, 0);
    if (countDiff.length > 0 || !filesMatch) {
      throw new Error("the restored data differs from the backup (see DIFF above)");
    }
    console.log(
      `\nRESTORE CHECK PASSED: ${Object.keys(restored).length} collections, ${total} documents, ` +
        `${restoredFiles.length} files — same as the backup (${manifest.created_at}).`
    );
  } finally {
    if (!args.keep) {
      await source.db(checkDb).dropDatabase();
      fs.rmSync(backupDir, { recursive: true, force: true });
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    } else {
      console.log(`Kept: database ${checkDb}, ${backupDir}, ${uploadsDir}`);
    }
    await source.close();
  }
}

main().catch((err) => {
  console.error(`RESTORE CHECK FAILED: ${err.message}`);
  process.exit(1);
});
