const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { serveFrontend } = require("./middlewares/frontend");
const parseTrustProxy = require("./config/trustProxy");
const { helmetOptions, corsOptions } = require("./config/security");
// The release version (D77): IT reads it from GET /health to tell which build runs
const { version } = require("../package.json");

/**
 * Builds the Express app from the environment (src/app.js passes process.env; tests pass their
 * own values to check CORS and the frontend build).
 * @param {NodeJS.ProcessEnv} env
 */
const createApp = (env) => {
  const app = express();

  // Needed behind a reverse proxy so req.ip (rate limits, logs) is the client, not the proxy.
  app.set("trust proxy", parseTrustProxy(env.TRUST_PROXY));

  // Security headers, incl. the Content-Security-Policy (config/security.js)
  app.use(helmet(helmetOptions));

  // CORS only when the frontend runs on another origin (FRONTEND_URL); none on the server (D38).
  const corsConfig = corsOptions(env.FRONTEND_URL);
  if (corsConfig) app.use(cors(corsConfig));

  // Body parser with size limit to reduce DoS risk
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging middleware (stdout: the service manager keeps it, see deploy/)
  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else if (env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  // Health check route (no rate limit), with the version of the running release
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      version,
    });
  });

  // API routes with rate limiting
  app.use("/api/v1", apiLimiter, routes);

  // The built frontend with its SPA fallback, when there is one (FRONTEND_DIST, D38)
  const frontend = serveFrontend(env.FRONTEND_DIST || undefined);
  if (frontend) app.use(frontend);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
