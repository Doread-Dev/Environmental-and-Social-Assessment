# Backend

> Node.js/Express API that powers the ESMS: auth, projects, screenings, assessments, SEMP, monitoring, lookups, and file storage. It owns all server-side logic and persistence (MongoDB).

## Responsibilities

- **Authentication and users** — JWT-based auth, roles, user CRUD.
- **Projects** — Project records and workspace context for the rest of the workflow.
- **Screenings, assessments, SEMP, monitoring** — Domain routes, services, and persistence for the ESMS workflow.
- **Lookups** — Reference data (impact categories, questions, indicators, job titles) consumed by the frontend.
- **Attachments and reports** — File uploads (e.g. Multer), exports (e.g. Excel/CSV), and report generation.
- **Security and resilience** — Helmet, CORS, rate limiting, request validation (Joi), centralized error handling.

## Local Development

1. **Prerequisites:** Node.js (LTS) and MongoDB (local or remote). From the repo root, see [README.md](../README.md) for overall quick start.
2. **Install:** From this directory:
   ```bash
   npm install
   ```
3. **Environment:** Copy `.env.example` to `.env` and set at least:
   - `MONGODB_URI` — MongoDB connection string (required).
   - `JWT_SECRET` — Strong secret, at least 32 characters (required; server refuses to start otherwise).
   Optionally set `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`, and `FRONTEND_URL` (see [Configuration](#configuration)).
4. **Run:** Start the API in development (with nodemon):
   ```bash
   npm run dev
   ```
   The server listens on `PORT` (default `3000`). A health check is available at `GET /health`. All REST API routes are under `GET/POST/PUT/PATCH/DELETE /api/v1/...`.
5. **Seed (optional):** To populate lookups (impact categories, questions, indicators, job titles) and any starter users:
   ```bash
   npm run seed
   ```
   Details and production notes are in [backend/docs/CONFIGURATION_AND_DEPLOYMENT.md](docs/CONFIGURATION_AND_DEPLOYMENT.md) (when present).

## Scripts

| Script   | Command              | Purpose |
|----------|----------------------|--------|
| `dev`    | `nodemon src/server.js` | Run server with auto-reload (development). |
| `start`  | `node src/server.js` | Run server (production). |
| `build`  | `echo 'Build completed'` | No bundle step; placeholder for CI if needed. |
| `seed`   | `node src/db/seed.js` | Connect to DB and seed lookups (and optional users). |

## Configuration

Environment variables are read from `.env` (via `dotenv`). Required variables are validated at startup; the process exits with a clear error if they are missing or invalid.

| Key           | Type   | Default              | Purpose |
|---------------|--------|----------------------|--------|
| `PORT`        | number | `3000`               | HTTP server port. |
| `NODE_ENV`    | string | `development`        | `development` or `production`; affects CORS default and logging. |
| `MONGODB_URI` | string | —                    | **Required.** MongoDB connection string. |
| `JWT_SECRET`  | string | —                    | **Required.** Secret for signing JWTs; must be at least 32 characters. |
| `JWT_EXPIRES_IN` | string | `12h`            | Token expiry (e.g. `12h`, `7d`). |
| `FRONTEND_URL`| string | `http://localhost:5173` (dev) | Allowed CORS origin; in production should be set to the frontend origin. |

Further configuration (database options, seed behaviour, production hardening) is documented in [backend/docs/CONFIGURATION_AND_DEPLOYMENT.md](docs/CONFIGURATION_AND_DEPLOYMENT.md).

## Key Modules

| Area        | Path              | Purpose |
|-------------|-------------------|--------|
| Entry       | `src/server.js`   | Loads env, validates required vars, connects DB, starts HTTP server. |
| App         | `src/app.js`      | Express app: Helmet, CORS, body parsing, morgan, `/health`, `/api/v1` routes, 404, error handler. |
| Config      | `src/config/`     | Database connection (MongoDB). |
| Routes      | `src/routes/`     | Mounts auth, users, projects, screenings, assessments, monitoring, management, mitigation, semp, reports, lookups, attachments. |
| Controllers | `src/controllers/`| Request/response handling per domain. |
| Services    | `src/services/`   | Business logic (auth, user, project, screening, assessment, monitoring, mitigation, report). |
| Models      | `src/models/`     | Mongoose schemas (User, Project, Screening, Assessment, etc.). |
| Validators  | `src/validators/` | Joi schemas for request validation. |
| Middlewares | `src/middlewares/`| Auth, validation, upload, rate limiter, error handler. |
| Seed        | `src/db/seed.js`  | Populates lookups and optional seed users. |

For request flow, route details, and data models, see [backend/docs/](docs/).

## How It Connects

- **Consumes:** Environment variables (above), MongoDB instance at `MONGODB_URI`. No other backend services are required for normal run.
- **Exposes:** REST API at `/api/v1` (and `GET /health`). The [frontend](../frontend/README.md) is the primary consumer; it calls this API using the base URL you configure (e.g. `http://localhost:3000` in development). Auth is via JWT in the `Authorization` header; CORS is restricted to `FRONTEND_URL` in production.

Cross-stack behaviour (how the frontend calls the backend) is described from the frontend side in [frontend/docs/SERVICES_AND_API.md](../frontend/docs/SERVICES_AND_API.md) and from the backend side in [backend/docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Link to Backend Docs

Deeper documentation for this domain lives under **backend/docs/**:

| Doc | Contents |
|-----|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Folder structure, request flow, app entry, route mounting. |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Base URL, endpoints for auth, users, projects, screenings, assessments, monitoring, management, mitigation, SEMP, reports, lookups, attachments. |
| [DATA_MODELS.md](docs/DATA_MODELS.md) | Mongoose models and schemas. |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md) | JWT flow, auth middleware, roles, protected routes. |
| [MIDDLEWARES.md](docs/MIDDLEWARES.md) | Auth, validate, upload, rate limiter, error handler. |
| [SERVICES_AND_VALIDATORS.md](docs/SERVICES_AND_VALIDATORS.md) | Service layer and Joi validators. |
| [CONFIGURATION_AND_DEPLOYMENT.md](docs/CONFIGURATION_AND_DEPLOYMENT.md) | Env vars, database config, seed, production considerations. |

For project-wide overview and quick start, see the root [README.md](../README.md).
