// Shared helpers of the server scripts (phase 11, deploy/): backup, restore, replica set, checks.
// No app code here: these scripts run next to the app (or with it stopped).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const BACKEND_DIR = path.resolve(__dirname, "../..");

// The app's settings: backend/.env, whatever folder the script is started from (a scheduled task
// or a systemd timer starts elsewhere). Values already in the environment win.
const loadEnv = () => {
  require("dotenv").config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });
  return process.env;
};

// `--name value`, `--name=value` and `--flag` → { name: value, flag: true }.
const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const [name, inline] = arg.slice(2).split(/=(.*)/s, 2);
    if (inline !== undefined) args[name] = inline;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) args[name] = argv[++i];
    else args[name] = true;
  }
  return args;
};

// mongodump / mongorestore: MONGODB_TOOLS_DIR when set (the Database Tools' bin folder), else the
// PATH.
const toolPath = (name, env = process.env) => {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  return env.MONGODB_TOOLS_DIR ? path.join(env.MONGODB_TOOLS_DIR, exe) : exe;
};

/**
 * Runs a Database Tools command with the connection string in a temporary config file (mode 600),
 * never on the command line, where any user of the machine could read a password in it.
 * Resolves with the tool's output (it writes its log to stderr); rejects when it fails.
 */
const runTool = async (name, uri, args, env = process.env) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "esms-tool-"));
  const config = path.join(dir, "config.yaml");
  fs.writeFileSync(config, `uri: ${JSON.stringify(uri)}\n`, { mode: 0o600 });
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(toolPath(name, env), [`--config=${config}`, ...args], {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      child.on("error", (err) =>
        reject(
          err.code === "ENOENT"
            ? new Error(
                `${name} not found. Install the MongoDB Database Tools and set MONGODB_TOOLS_DIR ` +
                  "to their bin folder (deploy/README.md)."
              )
            : err
        )
      );
      child.on("close", (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`${name} failed (exit code ${code}):\n${output.trim()}`));
      });
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

// Every file under `dir` (relative path with "/", size, sha256), sorted. Missing dir → [].
const listFiles = (dir, { hash = false } = {}) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        const file = {
          path: path.relative(dir, full).split(path.sep).join("/"),
          size: fs.statSync(full).size,
        };
        if (hash)
          file.sha256 = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
        out.push(file);
      }
    }
  };
  walk(dir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
};

// Document count of every collection of a database (system collections left out), sorted by name.
const countCollections = async (db) => {
  const names = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system."))
    .sort();
  const counts = {};
  for (const name of names) counts[name] = await db.collection(name).countDocuments();
  return counts;
};

// Differences between two { collection: count } maps: [{ collection, expected, actual }].
const compareCounts = (expected, actual) => {
  const names = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  return names
    .filter((name) => (expected[name] ?? 0) !== (actual[name] ?? 0))
    .map((name) => ({
      collection: name,
      expected: expected[name] ?? 0,
      actual: actual[name] ?? 0,
    }));
};

// The same connection string with another database name (the query, e.g. replicaSet, kept).
const withDatabase = (uri, name) => {
  const [base, query] = uri.split("?");
  const m = /^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^/]*)?$/.exec(base);
  if (!m) throw new Error("Unrecognised MongoDB connection string");
  return `${m[1]}/${name}${query ? `?${query}` : ""}`;
};

module.exports = {
  BACKEND_DIR,
  withDatabase,
  loadEnv,
  parseArgs,
  toolPath,
  runTool,
  listFiles,
  countCollections,
  compareCounts,
};
