# Backend Architecture

## Overview

The backend is a Node.js/Express HTTP API that implements the server-side logic and persistence for the Environmental and Social Management System (ESMS). It owns authentication, domain resources (projects, screenings, assessments, SEMP, monitoring, management, mitigation), lookups, attachments, and reports; it does not own the UI or client-side state. This document describes folder structure, process entry, route mounting, and request flow so that an LLM or maintainer can reason about the system without reading all source files.

---

## Folder Structure

All runtime backend code lives under `backend/src`. The layout is domain-oriented: routes, controllers, services, models, and validators are grouped by concern, with shared config, middlewares, and utilities at the top level.

| Path | Purpose |
|------|--------|
| `src/server.js` | Process entry: loads env, validates required vars, connects to MongoDB, starts HTTP server, registers shutdown handlers. |
| `src/app.js` | Express application: security (Helmet), CORS, body parsing, logging (morgan), `/health`, `/api/v1` router, 404 handler, error handler. |
| `src/config/` | Configuration modules. `database.js` is the only file: connects to MongoDB using `MONGODB_URI`. |
| `src/db/` | Database utilities. `seed.js` seeds lookups (impact categories, questions, indicators, job titles) and optional users. |
| `src/routes/` | Route definitions. `index.js` mounts all domain routers under `/api/v1`; one file per domain (e.g. `auth.routes.js`, `projects.routes.js`). |
| `src/controllers/` | Request/response handlers. One file per domain; controllers call services and send JSON. |
| `src/services/` | Business logic. One file per domain (auth, user, project, screening, assessment, monitoring, mitigation, report, lookup, attachment, semp, managementActivity). |
| `src/models/` | Mongoose schemas. One file per entity (User, Project, Screening, Assessment, MonitoringRecord, ManagementActivity, MitigationPlan, SEMP-related models, lookups, Attachment, AnnexItem, etc.). |
| `src/validators/` | Joi schemas for request body/params/query validation. One file per domain (auth, project, screening, assessment, monitoring, mitigation, management, semp, attachment). |
| `src/middlewares/` | Reusable middleware: `auth.js` (JWT, roles), `validate.js` (Joi), `upload.js` (Multer), `rateLimiter.js` (API and login limiters), `errorHandler.js` (centralized error response). |
| `src/utils/` | Helpers. `asyncHandler.js` wraps async route handlers; `ApiError.js` defines a typed error class for status codes. |

No other top-level directories under `src` own request handling. Tests, if added later, are not under `src`.

**Constraints**

- Every HTTP request that reaches a domain handler does so via `app.js` → `routes/index.js` → a domain router. There are no alternate entry points for API traffic.
- All API routes are prefixed with `/api/v1`; the only non-API route is `GET /health`.

---

## App Entry

The process starts from `server.js`; the Express app is created in `app.js` and required by `server.js`.

**Sequence**

1. **Load environment** — `server.js` calls `require('dotenv').config()` first so `process.env` is populated.
2. **Validate required env** — `validateEnv()` in `server.js` checks `JWT_SECRET` (set and length ≥ 32) and `MONGODB_URI` (set and non-empty). On failure it logs and exits with code 1.
3. **Connect database** — `server.js` awaits `connectDB()` from `config/database.js`. `connectDB()` uses `mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })`. On failure it logs and exits with code 1.
4. **Start HTTP server** — After DB connection, `server.js` calls `app.listen(PORT)` where `PORT` is `process.env.PORT` or `3000`. The app is the Express instance exported by `app.js`.
5. **Shutdown** — `server.js` registers: (a) `unhandledRejection` → log, close server, exit 1; (b) `SIGTERM` → close server, then `mongoose.connection.close()`, then exit 0.

**App construction (`app.js`)**

Middleware and routes are applied in this order:

1. `helmet()` — security headers.
2. `cors({ origin, credentials: true, methods, allowedHeaders })` — origin is `FRONTEND_URL` in production, else `FRONTEND_URL` or `http://localhost:5173`.
3. `express.json({ limit: '10mb' })` and `express.urlencoded({ extended: true, limit: '10mb' })`.
4. `morgan('dev')` in development, `morgan('combined')` otherwise.
5. `GET /health` — returns `{ success: true, message: 'Server is running' }` (no rate limit).
6. `app.use('/api/v1', apiLimiter, routes)` — all API routes and the global API rate limiter.
7. 404 handler — for any unhandled path, responds with `404` and `{ success: false, error: 'Route not found' }`.
8. `errorHandler` — catches errors passed to `next(err)` and Mongoose/Joi errors; responds with JSON and appropriate status.

**Constraints**

- The server does not listen until the database connection succeeds. No requests are accepted before that.
- `/health` is the only route defined directly on `app`; all other routes are mounted under `/api/v1` via the single `routes` router.

---

## Routes Mounting

API routes are mounted in two layers: a single aggregator router at `src/routes/index.js` under `/api/v1`, and one Express router per domain mounted by that aggregator.

**Mount table**

| Mount path | Router module | Full path prefix |
|------------|---------------|-------------------|
| `/auth` | `auth.routes.js` | `/api/v1/auth` |
| `/users` | `users.routes.js` | `/api/v1/users` |
| `/projects` | `projects.routes.js` | `/api/v1/projects` |
| `/screenings` | `screenings.routes.js` | `/api/v1/screenings` |
| `/assessments` | `assessments.routes.js` | `/api/v1/assessments` |
| `/monitoring` | `monitoring.routes.js` | `/api/v1/monitoring` |
| `/management` | `management.routes.js` | `/api/v1/management` |
| `/mitigation` | `mitigation.routes.js` | `/api/v1/mitigation` |
| `/semp` | `semp.routes.js` | `/api/v1/semp` |
| `/reports` | `reports.routes.js` | `/api/v1/reports` |
| `/lookups` | `lookups.routes.js` | `/api/v1/lookups` |
| `/attachments` | `attachments.routes.js` | `/api/v1/attachments` |

**Aggregator (`routes/index.js`)**

- Creates one `express.Router()`.
- Requires each domain router and mounts it with `router.use("/<segment>", <domain>Routes)`.
- Exports the single router. There is no nested path (e.g. no `/api/v1/admin`); all segments are siblings under `/api/v1`.

**Domain router pattern**

- Each domain file creates an `express.Router()`, defines HTTP methods and paths relative to its mount (e.g. `router.get("/", ...)` for list, `router.get("/:id", ...)` for one, `router.post("/", ...)` for create).
- Routes attach middlewares in order: optional auth/role (e.g. `auth`, `requireRole(...)`), optional validation (`validate(schema)`), then controller method. Example: `router.post("/", auth, requireRole(...), validate(createProjectSchema), controller.create)`.
- Auth routes are special: `POST /register` uses a custom guard (first user allowed without auth; otherwise requires `environmental_specialist`); `POST /login` uses `loginLimiter` and `validate(loginSchema)` but no auth middleware.
- Domain routers export the router; they do not mount other routers.

**Constraints**

- Every API URL is exactly: `/api/v1` + mount segment + path defined in the domain router (e.g. `/api/v1/projects`, `/api/v1/screenings/project/:projectId`).
- Rate limiting: the whole `/api/v1` tree is behind `apiLimiter` (1000 requests per 7 minutes per IP); login has an additional `loginLimiter` (10 attempts per 15 minutes, successful requests skipped).

---

## Request Flow

A single HTTP request passes through a fixed pipeline from the network to the response. This section describes that pipeline and the data boundaries.

**Step-by-step flow**

1. **HTTP request** — Client sends a request to the server (e.g. `GET /api/v1/projects` or `POST /api/v1/auth/login`). The only routes outside this flow are `GET /health` (no rate limit, no further middleware after the handler) and the 404 branch when no route matches.

2. **Helmet** — Modifies response headers for security. No change to `req`/body.

3. **CORS** — Validates `Origin` against the configured origin; adds CORS headers to the response. Preflight requests may be answered here. No change to request body.

4. **Body parsing** — `express.json()` and `express.urlencoded()` populate `req.body` (and `req`-related fields). Body size is capped at 10MB.

5. **Morgan** — Logs the request. No change to `req` or response body.

6. **Route matching** — If path is not `GET /health`, Express matches against `app.use('/api/v1', apiLimiter, routes)`. So the request is first passed to `apiLimiter`, then to the `routes` router.

7. **API rate limiter** — `apiLimiter` (express-rate-limit) counts requests per IP in a 7-minute window (max 1000). If over limit, responds with 429 and `{ success: false, error: 'Too many requests. Please try again later.' }`. Otherwise calls `next()`.

8. **Aggregator router** — `routes/index.js` matches the first path segment (e.g. `auth`, `projects`) and forwards the request to the corresponding domain router. The request URL at this point is the remainder after `/api/v1` (e.g. `auth/login`, `projects`).

9. **Domain router** — The domain router matches method and path (e.g. `GET /`, `POST /`, `GET /:id`). For each route, middlewares run in order: auth (if present), role (if present), validate (if present), controller.

10. **Auth middleware** (when attached) — Reads `Authorization` header, verifies JWT with `JWT_SECRET`, attaches user to `req.user`. On failure, responds with 401. Does not touch body.

11. **Role middleware** (when attached) — Checks `req.user.role` against allowed roles. On failure, responds with 403. Does not touch body.

12. **Validate middleware** (when attached) — Runs Joi schema against the specified part of `req` (body/params/query). On failure, responds with 400 and validation messages. Does not modify `req` on success.

13. **Controller** — Controller function is invoked with `(req, res, next)`. It typically calls a service, then sends JSON with `res.status(...).json(...)`. Errors are passed to `next(err)` (often via `asyncHandler`).

14. **Error handler** — If any middleware or controller calls `next(err)`, or if a synchronous exception is thrown, control reaches `errorHandler`. It normalizes Mongoose `CastError`, duplicate key (11000), `ValidationError`, and Joi errors to an `ApiError`-like shape and responds with `res.status(statusCode).json({ success: false, error: message })`. In development, `stack` is included. Unhandled errors result in 500.

15. **Response** — The client receives the JSON response and status code set by the controller or error handler.

**Data shapes at boundaries**

- **After body parsing:** `req.body` is a plain object (for JSON or urlencoded); `req.params` and `req.query` are set by Express from the URL.
- **After auth:** `req.user` exists and contains at least `id` and `role` (and other fields from the JWT payload).
- **Controller → client:** Response body is JSON; success responses typically include `success: true` and domain data; error responses include `success: false` and `error` (string). Status codes follow REST conventions (200, 201, 400, 401, 403, 404, 429, 500).

**Constraints**

- The 404 handler runs only if no route matched; it is not used when a route matches and a controller sends a 404.
- The error handler must be the last middleware; it is the only place that turns thrown or passed errors into a JSON response.
- Request body is never mutated by auth or role middlewares; validation may read body/params/query but the validate middleware in this codebase does not rewrite them.

---

## Key Invariants

1. **Single entry** — All API requests are served through the Express app created in `app.js`, mounted at `/api/v1` via `routes/index.js`. There are no separate HTTP servers or duplicate app instances for API traffic.

2. **DB before listen** — The HTTP server does not listen until MongoDB connection has succeeded. Startup fails fast if `MONGODB_URI` or `JWT_SECRET` is missing or invalid.

3. **Route prefix** — Every API URL starts with `/api/v1`. The only exception is `GET /health`, which is not under `/api/v1` and is not rate-limited.

4. **Rate limits** — All `/api/v1` requests are subject to `apiLimiter`. `POST /api/v1/auth/login` is additionally subject to `loginLimiter`. No other routes have separate rate limiters.

5. **Error handling** — All operational errors that should return JSON go through `errorHandler`. Controllers and services use `next(err)` or throw; the handler maps known error types to status codes and a consistent `{ success: false, error }` shape.

6. **Auth and validation order** — On protected routes, auth runs before role check, and both run before validation and controller. Validation runs against the same `req` that the controller will use; it does not run before auth.

7. **No API routes outside `src/routes`** — New API endpoints are added by defining routes in the appropriate file under `src/routes` and, if needed, mounting them in `routes/index.js`. No API routes are registered directly on `app` except the health check.
