# Configuration and Deployment

This document describes how to configure and run the ESMS backend: environment variables, database connection, the seed script, and production considerations. The server is a Node.js/Express API that uses MongoDB and JWT for authentication.

---

## Environment Variables

All configuration is read from the process environment. In development, variables are loaded from a `.env` file in the backend root via `dotenv` (called in `src/server.js` before any other logic). In production you typically set variables in your host’s dashboard or CI/CD; do not commit `.env` (it is in `.gitignore`).

**Required variables** are validated at startup in `src/server.js` (`validateEnv()`). If any required variable is missing or invalid, the process logs an error and exits with code 1.

| Variable        | Required | Default (if any)     | Description |
|----------------|----------|----------------------|-------------|
| `MONGODB_URI`  | Yes      | —                    | MongoDB connection string (e.g. `mongodb://localhost:27017/esms` or Atlas URI). Must be non-empty. |
| `JWT_SECRET`   | Yes      | —                    | Secret used to sign and verify JWTs. Must be set and at least 32 characters (trimmed). |
| `PORT`         | No       | `3000`               | HTTP port the server listens on. |
| `NODE_ENV`     | No       | `development`        | `development` or `production`. Affects CORS default origin and logging (see below). |
| `JWT_EXPIRES_IN` | No     | `12h`                | Token expiry (e.g. `12h`, `7d`). Used when issuing tokens in `auth.service.js`. |
| `FRONTEND_URL` | No (dev) | `http://localhost:5173` (dev) | Allowed CORS origin. In production this should be set to the frontend’s public URL. |

**Validation rules (enforced at startup):**

- `JWT_SECRET`: must be present and have length ≥ 32 after trim.
- `MONGODB_URI`: must be present and non-empty after trim.

**Example `.env` (copy from `.env.example`):**

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your-mongodb-url-here
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=12h
FRONTEND_URL=http://localhost:5173
```

**Invariants**

- The server does not start without valid `MONGODB_URI` and `JWT_SECRET`.
- No other env vars are read by the main app for core behaviour (optional scripts such as `scripts/test-permissions.js` may use their own vars like `ADMIN_EMAIL`).

---

## Database Configuration

The backend uses a single MongoDB database. Connection is performed in `src/config/database.js` and is required before the HTTP server accepts requests.

**Connection flow**

1. `src/server.js` loads env (e.g. via `dotenv`) and runs `validateEnv()`.
2. It then awaits `connectDB()` from `src/config/database.js`.
3. `connectDB()` calls `mongoose.connect(process.env.MONGODB_URI, options)`.
4. Only after a successful connection does `server.js` call `app.listen(PORT)`.

**Options used**

- `serverSelectionTimeoutMS: 10000` — connection fails after 10 seconds instead of hanging indefinitely.

**Behaviour on failure**

- On connection error, `connectDB()` logs the error and calls `process.exit(1)`.
- The HTTP server is never started if the database connection fails.

**Invariants**

- The app does not serve traffic until MongoDB is connected.
- Only one connection (Mongoose default) is used; no connection pooling is configured beyond Mongoose’s default behaviour.

---

## Seed Script

The seed script populates the database with **lookup/reference data** required by the ESMS: impact categories, job titles, impact questions, and indicators. It does not create users or projects.

**How to run**

From the backend directory:

```bash
npm run seed
```

This runs `node src/db/seed.js`. Ensure `.env` (or the environment) has a valid `MONGODB_URI`; the seed uses the same `dotenv` and `connectDB()` as the server.

**What gets seeded**

| Collection / model       | Content |
|--------------------------|--------|
| Impact categories        | Fixed set of categories (e.g. Air Quality, Water Quality, Noise, Solid waste, Radiation, Toxic materials, Plants/wildlife, Land use) with codes and Arabic names. |
| Job titles               | Fixed list of job title strings (e.g. Environmental Specialist, Program Manager, Project Manager, Environmental focal point, Viewer). |
| Impact questions         | Questions linked to impact categories by category code (screening/assessment workflow). |
| Indicators               | Indicators linked to impact categories (name, definition, measurement). |

**Idempotency**

The script uses **delete-then-insert**: it calls `deleteMany({})` on each of the four lookup collections, then `insertMany(...)` with the built-in data. Running the seed multiple times replaces all lookup data with the same default set; it does not merge or append.

**Lifecycle**

1. Load env with `dotenv`, require `connectDB` and the four models.
2. `await connectDB()`.
3. In a `try`, perform the four delete/insert operations.
4. In `finally`, close the connection with `mongoose.connection.close()` and exit. On error, `process.exitCode` is set to `1`.

**Invariants**

- The seed script does not create or update users. Any “starter users” must be created by another process or manually.
- The seed only touches the four lookup collections listed above; it does not modify projects, screenings, assessments, or other domain data.

---

## Production Considerations

**Environment**

- Set `NODE_ENV=production` on the host. This restricts CORS to `FRONTEND_URL` and switches logging to `morgan('combined')`.
- Set `FRONTEND_URL` to the exact origin of your frontend (e.g. `https://app.example.com`). If unset in production, CORS may block legitimate requests.
- Use a strong, random `JWT_SECRET` (32+ characters) and keep it secret. Rotating it invalidates all existing tokens.
- Do not commit `.env` or any file containing secrets; use the platform’s secret or env configuration.

**Database**

- Use a production MongoDB instance (e.g. MongoDB Atlas) with a secure connection string and access rules. Ensure the app’s IP or VPC is allowed if the provider uses network restrictions.
- The same `MONGODB_URI` and connection options (`serverSelectionTimeoutMS: 10000`) apply; tune timeouts or pool size in Mongoose if needed for your workload.

**Security and resilience (already in code)**

- **Helmet** is applied in `app.js` for secure headers.
- **CORS** is restricted to a single origin (from `FRONTEND_URL` in production).
- **Rate limiting** is applied on `/api/v1` (see [MIDDLEWARES.md](MIDDLEWARES.md)).
- **Request body size** is limited (e.g. 10mb in `app.js`) to reduce DoS risk.
- **JWT** is validated with `JWT_SECRET` in the auth middleware; see [AUTHENTICATION.md](AUTHENTICATION.md).

**Logging**

- In production, `morgan('combined')` is used; in development, `morgan('dev')`. No additional log aggregation is configured in the codebase.

**Process and shutdown**

- The server handles `SIGTERM`: it closes the HTTP server, then closes the MongoDB connection, then exits with code 0. Unhandled promise rejections are logged and the process exits with code 1 after closing the server.
- Run the app with `npm run start` (i.e. `node src/server.js`) in production. Use a process manager (e.g. PM2, systemd, or the host’s process manager) for restarts and supervision.

**Deployment checklist (summary)**

1. Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (32+ chars), and `FRONTEND_URL`.
2. Optionally set `PORT` and `JWT_EXPIRES_IN`.
3. Run `npm run seed` once (or when you want to reset lookups) against the production DB if needed.
4. Start with `npm run start` and supervise the process; rely on the existing security middleware and auth as documented in AUTHENTICATION and MIDDLEWARES.

---

## Key Invariants

- Required env vars (`MONGODB_URI`, `JWT_SECRET` with length ≥ 32) are validated at startup; the process exits if they are missing or invalid.
- The HTTP server only listens after a successful MongoDB connection.
- The seed script only populates lookup collections (impact categories, job titles, questions, indicators); it does not create users or domain data.
- In production, CORS is restricted to `FRONTEND_URL` and logging uses `morgan('combined')`.
