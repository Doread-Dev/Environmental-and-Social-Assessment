const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

// The built frontend (D38, phase 11): on the server one Node process serves the app and the API
// from the same origin. FRONTEND_DIST is the folder `npm run build` wrote in frontend/ (default
// <repo>/frontend/dist). Nothing is served when it has no index.html (development, Vercel).
const DEFAULT_DIST = path.resolve(__dirname, "../../../frontend/dist");

// Vite's hashed files: their name changes with their content, so they can be cached for a year.
const LONG_CACHE = "public, max-age=31536000, immutable";
// Everything else (index.html, favicon, theme-init.js): the browser revalidates every time, so a
// new version is picked up right after a deploy.
const NO_CACHE = "no-cache";

// Paths the app never answers with index.html: the API and the health check keep their own 404.
const isServerPath = (urlPath) =>
  urlPath === "/api" || urlPath.startsWith("/api/") || urlPath === "/health";

// A path whose last segment has an extension is a file: a missing one is a 404, not the app.
const looksLikeFile = (urlPath) => path.posix.extname(urlPath) !== "";

/**
 * Router serving the built frontend with the SPA fallback, or null when there is no build.
 * @param {string} [distDir]
 * @returns {import("express").Router|null}
 */
const serveFrontend = (distDir = DEFAULT_DIST) => {
  const root = path.resolve(distDir);
  const indexFile = path.join(root, "index.html");
  if (!fs.existsSync(indexFile)) return null;

  const router = express.Router();
  router.use(
    express.static(root, {
      index: false,
      setHeaders: (res, filePath) => {
        const relative = path.relative(root, filePath).split(path.sep);
        res.setHeader("Cache-Control", relative[0] === "assets" ? LONG_CACHE : NO_CACHE);
      },
    })
  );
  // SPA fallback: any other GET (a page of the app such as /projects/abc) gets index.html.
  router.get("*", (req, res, next) => {
    if (isServerPath(req.path) || looksLikeFile(req.path)) return next();
    res.setHeader("Cache-Control", NO_CACHE);
    // Relative to `root`, so a dist folder under a dot folder still works (as fileStorage.send).
    return res.sendFile("index.html", { root }, (err) => err && next(err));
  });
  return router;
};

module.exports = { serveFrontend, DEFAULT_DIST, LONG_CACHE, NO_CACHE };
