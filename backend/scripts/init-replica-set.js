// Turns the server's MongoDB into a single-node replica set, once (phase 11): transactions need
// one, so a critical action and its audit entry, and a bulk save, either all happen or none does.
//
// Before: mongod's config has `replication: replSetName: rs0` and the service was restarted
// (deploy/README.md; the install scripts do both with -ConfigureMongo / --configure-mongo).
// Usage (MONGODB_URI from backend/.env, with or without ?replicaSet=rs0):
//   node scripts/init-replica-set.js            # initiates when needed, waits for a primary
//   node scripts/init-replica-set.js --check    # only reports; exit 0 = ready, 2 = not ready
// Safe to run again: an initiated replica set is left as it is.
const mongoose = require("mongoose");
const ops = require("./lib/ops");

const NOT_INITIATED = 94; // NotYetInitialized
const NO_REPLICATION = 76; // NoReplicationEnabled

// The same server, connected to directly (a replica set that is not initiated has no primary to
// find), without the replica-set options of the app's connection string.
const directUri = (uri) => {
  const [base, query = ""] = uri.split("?");
  const params = new URLSearchParams(query);
  params.delete("replicaSet");
  params.set("directConnection", "true");
  return `${base}?${params}`;
};

// host:port of the first host in the connection string.
const firstHost = (uri) => {
  const hosts = uri
    .replace(/^mongodb:\/\//, "")
    .replace(/^[^@/]*@/, "")
    .split(/[/?]/)[0];
  const host = hosts.split(",")[0];
  return host.includes(":") || host.startsWith("[") ? host : `${host}:27017`;
};

const waitForPrimary = async (admin, seconds = 30) => {
  for (let i = 0; i < seconds * 2; i += 1) {
    const hello = await admin.command({ hello: 1 });
    if (hello.isWritablePrimary) return hello;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No primary after ${seconds} s; see the MongoDB log`);
};

async function main() {
  const env = ops.loadEnv();
  const args = ops.parseArgs(process.argv.slice(2));
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set (backend/.env)");
  const name = args.name || env.MONGODB_REPLICA_SET || "rs0";

  const client = new mongoose.mongo.MongoClient(directUri(env.MONGODB_URI), {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  try {
    const admin = client.db("admin");
    let status;
    try {
      status = await admin.command({ replSetGetStatus: 1 });
    } catch (err) {
      if (err.code === NO_REPLICATION) {
        console.error(
          "MongoDB is not started as a replica set. Add to its config file:\n" +
            `  replication:\n    replSetName: ${name}\n` +
            "then restart the MongoDB service and run this again (deploy/README.md)."
        );
        process.exitCode = 2;
        return;
      }
      if (err.code !== NOT_INITIATED) throw err;
    }

    if (status) {
      const primary = status.members.find((m) => m.stateStr === "PRIMARY");
      console.log(
        `Replica set "${status.set}" is ready (primary: ${primary?.name ?? "none yet"}). ` +
          "Transactions are on."
      );
      if (!primary) process.exitCode = 2;
      return;
    }

    if (args.check) {
      console.log(
        `Replica set "${name}" is configured but not initiated yet. Run without --check.`
      );
      process.exitCode = 2;
      return;
    }

    const host = firstHost(env.MONGODB_URI);
    await admin.command({ replSetInitiate: { _id: name, members: [{ _id: 0, host }] } });
    await waitForPrimary(admin);
    console.log(`Replica set "${name}" initiated with one member (${host}). Transactions are on.`);
    if (!/[?&]replicaSet=/.test(env.MONGODB_URI)) {
      console.log(`Add ?replicaSet=${name} to MONGODB_URI in backend/.env.`);
    }
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Replica set setup FAILED: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { directUri, firstHost };
