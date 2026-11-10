// The .env next to package.json, whatever folder the service starts in (deploy/).
require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");
const { supportsTransactions } = require("./utils/transaction");

const PORT = process.env.PORT || 3000;
// Behind IIS/nginx on the same machine, HOST=127.0.0.1 keeps the app reachable only through the
// proxy (deploy/). Unset: every interface, as before.
const HOST = process.env.HOST || undefined;

// Validate required env vars before starting (security: fail fast in production)
function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
    missing.push("JWT_SECRET (must be set and at least 32 characters)");
  }
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    missing.push("MONGODB_URI");
  }
  if (missing.length > 0) {
    console.error("Missing or invalid required environment variables:", missing.join(", "));
    process.exit(1);
  }
}
validateEnv();

// Connect to database, then start server (so we don't accept requests before DB is ready)
(async () => {
  await connectDB();
  if (!(await supportsTransactions())) {
    console.warn(
      "MongoDB is not a replica set: critical actions and bulk saves run without transactions. " +
        "On the server, run MongoDB as a single-node replica set (deploy/README.md)."
    );
  }
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST ?? "all interfaces"}, port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err.message);
    server.close(() => process.exit(1));
  });

  // SIGTERM (systemd) or SIGINT (Ctrl+C, NSSM on Windows): close the server, then MongoDB.
  const shutdown = () => {
    server.close(() => {
      mongoose.connection
        .close()
        .then(() => process.exit(0))
        .catch(() => process.exit(0));
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
