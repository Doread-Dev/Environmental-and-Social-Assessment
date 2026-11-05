// HTTP security settings of the app (phase 11).

/**
 * Helmet options. The Content-Security-Policy keeps helmet's defaults (scripts, styles, fonts,
 * images and requests from this origin only; no plugins; the app cannot be framed by other sites)
 * with these changes:
 * - `frame-src blob:`: the in-app PDF viewer (D64, `components/files/PdfViewer.jsx`) shows the PDF
 *   in an iframe on a `blob:` URL. Nothing wider: no other site can be framed.
 * - styles and fonts: this origin (+ inline styles, which React sets, and `data:` fonts that the
 *   build may inline), never `https:` — the app loads nothing from the internet (D37).
 * - no `upgrade-insecure-requests`: HTTPS is the reverse proxy's job (D6, deploy/); the directive
 *   would break a plain-HTTP health check or a first install before the proxy is set up.
 */
const helmetOptions = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "frame-src": ["blob:"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "data:"],
      "upgrade-insecure-requests": null,
    },
  },
};

/**
 * CORS options, or null for none. The server serves the app and the API from one origin (D38), so
 * CORS is only needed when the frontend runs elsewhere (Vite on :5173 in development, Vercel until
 * the server is live): then FRONTEND_URL names that origin. Unset → no CORS headers at all.
 * @param {string|undefined} frontendUrl
 */
const corsOptions = (frontendUrl) => {
  const origin = (frontendUrl ?? "").trim();
  if (!origin) return null;
  return {
    origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
};

module.exports = { helmetOptions, corsOptions };
