// Server check (phase 11): run it after installing and after any change to the server. Every line
// says OK, WARN or FAIL; exit code 1 when anything FAILs.
//
// Usage (settings from backend/.env):
//   node scripts/check-server.js
//   node scripts/check-server.js --mongodb-version 8.0.31   # Linux, before installing MongoDB:
//                                                            # only the kernel check
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const mongoose = require("mongoose");
const ops = require("./lib/ops");
const { sameDisk } = require("./lib/backup");
const { kernelCompatibility, nodeMajor } = require("./lib/serverCheck");

const results = [];
const report = (level, what, detail) => {
  results.push(level);
  console.log(`${level.padEnd(4)}  ${what}${detail ? ` — ${detail}` : ""}`);
};

const kernelCheck = (mongodbVersion) => {
  if (process.platform !== "linux") return;
  const result = kernelCompatibility(os.release(), mongodbVersion);
  report(
    result.ok ? "OK" : "FAIL",
    `Linux kernel ${os.release()} with MongoDB ${mongodbVersion}`,
    result.reason
  );
};

async function main() {
  const env = ops.loadEnv();
  const args = ops.parseArgs(process.argv.slice(2));

  if (args["mongodb-version"]) {
    kernelCheck(String(args["mongodb-version"]));
    if (process.platform !== "linux") report("OK", "Not Linux", "the kernel check does not apply");
    process.exitCode = results.includes("FAIL") ? 1 : 0;
    return;
  }

  const nvmrc = path.join(ops.BACKEND_DIR, "../.nvmrc");
  const wanted = fs.existsSync(nvmrc) ? nodeMajor(fs.readFileSync(nvmrc, "utf8")) : null;
  const running = Number(process.versions.node.split(".")[0]);
  report(
    wanted === null || wanted === running ? "OK" : "FAIL",
    `Node ${process.versions.node}`,
    wanted === null ? ".nvmrc not found" : `the app is built for Node ${wanted}`
  );

  report(
    env.NODE_ENV === "production" ? "OK" : "WARN",
    `NODE_ENV=${env.NODE_ENV ?? ""}`,
    "production on the server"
  );
  const secret = (env.JWT_SECRET ?? "").trim();
  report(
    secret.length >= 32 ? "OK" : "FAIL",
    "JWT_SECRET",
    secret.length >= 32 ? "set" : "at least 32 characters"
  );

  const dist = path.resolve(env.FRONTEND_DIST || path.join(ops.BACKEND_DIR, "../frontend/dist"));
  report(fs.existsSync(path.join(dist, "index.html")) ? "OK" : "FAIL", "Frontend build", dist);

  const uploads = path.resolve(env.UPLOADS_DIR || path.join(ops.BACKEND_DIR, "uploads"));
  try {
    fs.mkdirSync(uploads, { recursive: true });
    fs.accessSync(uploads, fs.constants.W_OK);
    report("OK", "Uploads folder", uploads);
  } catch (err) {
    report("FAIL", "Uploads folder", `${uploads}: ${err.message}`);
  }

  let dbPath = null;
  if (!env.MONGODB_URI) {
    report("FAIL", "MONGODB_URI", "not set");
  } else {
    const client = new mongoose.mongo.MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    try {
      await client.connect();
      const admin = client.db("admin");
      const info = await admin.command({ buildInfo: 1 });
      report("OK", `MongoDB ${info.version}`, `database ${client.db().databaseName}`);
      kernelCheck(info.version);
      const hello = await admin.command({ hello: 1 });
      report(
        hello.setName ? "OK" : "FAIL",
        "Replica set",
        hello.setName
          ? `${hello.setName}: transactions are on`
          : "MongoDB is standalone: run scripts/init-replica-set.js (deploy/README.md)"
      );
      try {
        dbPath = (await admin.command({ getCmdLineOpts: 1 })).parsed?.storage?.dbPath ?? null;
      } catch {
        dbPath = null;
      }
    } catch (err) {
      report("FAIL", "MongoDB", err.message);
    } finally {
      await client.close();
    }
  }

  if (!env.BACKUP_DIR) {
    report("FAIL", "BACKUP_DIR", "not set: a folder on a second disk or a network share");
  } else {
    const backupDir = path.resolve(env.BACKUP_DIR);
    const onDbDisk = dbPath && sameDisk(backupDir, dbPath);
    report(
      onDbDisk ? "FAIL" : "OK",
      `BACKUP_DIR ${backupDir}`,
      onDbDisk ? `same disk as the database (${dbPath})` : "not on the database disk"
    );
    const tool = spawnSync(ops.toolPath("mongodump", env), ["--version"], { encoding: "utf8" });
    report(
      tool.status === 0 ? "OK" : "FAIL",
      "mongodump",
      tool.status === 0 ? tool.stdout.split("\n")[0] : "not found: set MONGODB_TOOLS_DIR"
    );
  }

  report(
    env.TRUST_PROXY ? "OK" : "WARN",
    `TRUST_PROXY=${env.TRUST_PROXY ?? ""}`,
    "set it when IIS/nginx is in front"
  );
  report(
    env.FRONTEND_URL ? "WARN" : "OK",
    `FRONTEND_URL=${env.FRONTEND_URL ?? ""}`,
    "empty on the server (same origin)"
  );

  const failed = results.filter((r) => r === "FAIL").length;
  console.log(failed ? `\n${failed} check(s) FAILED.` : "\nAll checks passed.");
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(`Check FAILED: ${err.message}`);
  process.exit(1);
});
