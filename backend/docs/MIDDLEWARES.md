# Backend Middlewares

This document describes the Express middlewares in `backend/src/middlewares`: what each does, how it is used, and the data it reads or writes. It allows an LLM or maintainer to reason about request handling without reading every route file.

---

## Overview

All shared request-handling logic that runs before or after domain controllers lives in `src/middlewares/`. There are five modules: **auth** (JWT and roles), **validate** (Joi schema validation), **upload** (Multer file storage), **rateLimiter** (API and login limits), and **errorHandler** (centralized error response). The app applies some middlewares globally in `app.js` (rate limiter, error handler); others are attached per-route in domain routers under `src/routes/`.

| Middleware | Module | Applied | Purpose |
|------------|--------|---------|---------|
| `apiLimiter` | rateLimiter | Globally on `/api/v1` | Cap requests per IP (1000 / 7 min). |
| `loginLimiter` | rateLimiter | `POST /api/v1/auth/login` only | Cap login attempts (10 / 15 min, success skipped). |
| `auth` | auth | Per route | Verify JWT, set `req.user`. |
| `requireRole(...)` | auth | Per route, after `auth` | Ensure `req.user.role` is in allowed list. |
| `validate(schema)` | validate | Per route | Validate `req.body` with Joi; 400 on failure. |
| `upload.single(field)` | upload | Per route | Parse multipart, save one file to disk, set `req.file`. |
| `errorHandler` | errorHandler | Globally last | Normalize errors and send `{ success: false, error }` JSON. |

**Constraints**

- Middlewares run in the order they are attached. On protected routes the order is: auth → requireRole → validate (if any) → controller.
- The error handler must be registered last in `app.js` so it catches any error passed to `next(err)`.

---

## Auth

The auth module provides JWT verification and role-based access. It is required from `../middlewares/auth` and exports `auth` and `requireRole`. No route is protected by auth unless the route handler explicitly attaches these middlewares.

**Mechanism**

- **auth** — Reads `req.headers.authorization`. Expects format `Bearer <token>`. Verifies the token with `jwt.verify(token, process.env.JWT_SECRET)`; the payload must contain `sub` (user id). Loads the user with `User.findById(payload.sub)`; if no user exists, responds with 401. On success sets `req.user` to the full Mongoose user document and calls `next()`. Any error (missing header, invalid token, expired token, user not found) is forwarded with `next(err)` and results in 401 via the error handler unless overridden.
- **requireRole(...roles)** — Factory that returns a middleware. The middleware checks `req.user`; if missing it calls `next(new ApiError(401, 'Unauthorized'))`. If `roles` is empty or `req.user.role` is in `roles`, it calls `next()`. Otherwise it calls `next(new ApiError(403, 'Forbidden'))`.

**Request flow**

1. Client sends request with header: `Authorization: Bearer <access_token>`.
2. `auth` runs: extracts token, verifies with `JWT_SECRET`, loads user, sets `req.user`.
3. If `requireRole(...)` is present, it runs and checks `req.user.role`.
4. Controller runs with `req.user` populated.

**Typed usage (route pattern)**

```js
const { auth, requireRole } = require("../middlewares/auth");

router.post("/", auth, requireRole("environmental_specialist", "program_manager"), validate(schema), controller.create);
```

**Protected routes (where auth/requireRole are used)**

- **auth.routes.js** — `POST /register` uses a custom guard (first user vs role check); no `auth` on `POST /login`.
- **users.routes.js** — auth + requireRole on all routes.
- **projects, screenings, assessments, monitoring, management, mitigation, semp, reports, attachments** — auth and requireRole (with domain-specific role lists) on create/update/upload and other privileged operations; some read routes (e.g. `GET /attachments/:id`) may be public.

**Constraints**

- `auth` depends on `User` model and `JWT_SECRET`. If the token is valid but the user was deleted, the request is 401.
- `requireRole` must be placed after `auth` on any route that uses it; it does not perform JWT verification.
- The auth middleware does not issue or refresh tokens; that is done in the auth controller/service.

---

## Validate

The validate module runs Joi schema validation against the request. It is required as `validate` from `../middlewares/validate` and used as `validate(schema)` where `schema` is a Joi schema (e.g. from `../validators/*`).

**Mechanism**

- **validate(schema)** — Returns a middleware function. The middleware runs `schema.validate(req.body, { abortEarly: false, stripUnknown: true })`. If validation fails, it responds with `400` and `{ success: false, error: "<joined messages>" }` (messages from `error.details[].message`). It does not call `next()`. On success it calls `next()` and does not modify `req.body` (Joi’s `stripUnknown` only affects the value returned by `validate`, which is not reassigned to `req` in this codebase).

**Where it runs**

- All validated routes use it against **req.body** only. Params and query are not passed to this middleware in the current implementation.
- Used on: auth (register, login), projects (create, update), screenings (create, update, approve, reject), assessments (create, update, add/replace methods, consultations, scores, approve, reject), monitoring (create, update, updateQuarter), management (create, update), mitigation (create, update), semp (objectives, targets, actions create/update), attachments (create). Upload route (`POST /attachments/upload`) does not use `validate`; it uses only auth, requireRole, and `upload.single("file")`.

**Typed usage**

```js
const validate = require("../middlewares/validate");
const { createProjectSchema } = require("../validators/project.validator");

router.post("/", auth, requireRole("..."), validate(createProjectSchema), controller.create);
```

**Constraints**

- Only `req.body` is validated. To validate `params` or `query`, the route would need a different wrapper or a schema that combines body/params/query and a different call (not in current codebase).
- Validation errors are sent directly by the middleware (400); they do not go through `next(err)`. Joi errors thrown elsewhere and passed to `next()` are still handled by `errorHandler`.

---

## Upload

The upload module configures Multer for file storage on disk. It is required as `upload` from `../middlewares/upload` and used as `upload.single(fieldName)` in routes.

**Mechanism**

- **Storage** — `multer.diskStorage`: destination is `path.join(process.cwd(), "uploads")`; the directory is created if missing (`fs.mkdirSync(..., { recursive: true })`). Filename is `${Date.now()}-${random}-${file.originalname}` so files are unique and retain the original name in the suffix.
- **upload** — A single `multer({ storage })` instance. No file count or size limit is set in the middleware; limits would be configured on the same `multer` options if needed.
- **upload.single("file")** — Parses multipart for one file under the field name `"file"`. The file is written to `uploads/`. `req.file` is set with Multer’s shape (e.g. `path`, `filename`, `originalname`, `mimetype`, `size`). Body fields are still available on `req.body`.

**Where it runs**

- **attachments.routes.js** — `POST /upload` uses `auth`, `requireRole(...)`, `upload.single("file")`, then `controller.upload`. No `validate()` on this route.

**Typed usage**

```js
const upload = require("../middlewares/upload");

router.post("/upload", auth, requireRole("..."), upload.single("file"), controller.upload);
```

**Constraints**

- Files are stored under `process.cwd()/uploads`. Deployment must ensure this path is writable and that disk space and cleanup are managed.
- The middleware does not validate file type or size; such checks would be in the controller or in Multer options (e.g. `fileFilter`, `limits`).

---

## Rate limiter

The rateLimiter module exports two express-rate-limit middlewares: `apiLimiter` and `loginLimiter`. They limit how many requests an IP can make in a time window.

**apiLimiter**

- **Window:** 7 minutes (`windowMs: 7 * 60 * 1000`).
- **Max:** 1000 requests per IP per window.
- **Response when over limit:** 429, body `{ success: false, error: 'Too many requests. Please try again later.' }`.
- **Headers:** `standardHeaders: true`, `legacyHeaders: false` (RateLimit-* headers).
- **Applied in:** `app.js` as `app.use('/api/v1', apiLimiter, routes)`. So every request under `/api/v1` is counted; `GET /health` is not under `/api/v1` and is not rate-limited.

**loginLimiter**

- **Window:** 15 minutes.
- **Max:** 10 requests per IP per window.
- **Skip:** `skipSuccessfulRequests: true` — only failed login attempts count toward the limit.
- **Response when over limit:** 429, body `{ success: false, error: 'Too many login attempts. Please try again later.' }`.
- **Applied in:** `auth.routes.js` on `POST /login` only: `router.post("/login", loginLimiter, validate(loginSchema), controller.login)`.

**Constraints**

- Rate limiting is per IP. Proxies or load balancers may require `trust proxy` and possibly a custom key function if the app is behind a reverse proxy.
- No other route has a dedicated rate limiter; only the global API limit and the login limit apply.

---

## Error handler

The errorHandler is the central middleware that turns thrown or passed errors into a JSON response. It is required from `./middlewares/errorHandler` and registered last in `app.js` with `app.use(errorHandler)`.

**Signature**

- Express error middleware: `(err, req, res, next) => { ... }`. It must have four arguments so Express treats it as error-handling middleware.

**Mechanism**

1. Copies `err` into a local `error` and sets `error.message = err.message`.
2. Logs the error with `console.error(err)`.
3. Normalizes known error types into an `ApiError`-like object with `statusCode` and `message`:
   - **Mongoose CastError** (`err.name === 'CastError'`) → 404, message `"Resource not found"`.
   - **Mongoose duplicate key** (`err.code === 11000`) → 400, message `"Duplicate field value entered"`.
   - **Mongoose ValidationError** (`err.name === 'ValidationError'`) → 400, message from `Object.values(err.errors).map(v => v.message).join(', ')`.
   - **Joi** (`err.isJoi`) → 400, message from `err.details.map(d => d.message).join(', ')`.
4. Sends `res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server Error', ... })`. In development (`process.env.NODE_ENV === 'development'`) it also sends `stack: err.stack`.

**ApiError**

- `utils/ApiError.js` defines a class with `constructor(statusCode, message, isOperational = true, stack = '')`. The error handler uses `error.statusCode`; if the normalized error or the original `err` has `statusCode`, that is used; otherwise 500.

**Constraints**

- The handler must be the last middleware so that any `next(err)` from routes or other middlewares reaches it.
- It does not distinguish 404 “route not found” (handled by the 404 route in `app.js`) from 404 “resource not found” (e.g. invalid ID); both result in a JSON body with `success: false` and an error message.

---

## Key Invariants

1. **Order** — On protected routes: auth → requireRole → validate (if any) → controller. Rate limiting runs before the route stack (apiLimiter on `/api/v1`; loginLimiter only on login route).
2. **Auth** — No route is protected unless it attaches `auth` (and optionally `requireRole`). Login and health check do not use auth.
3. **Validation** — Only `req.body` is validated by the validate middleware; one Joi schema per route usage.
4. **Upload** — Only the attachments upload route uses the upload middleware; files go to `uploads/` under cwd.
5. **Errors** — All operational errors that should return JSON go through `errorHandler`; it normalizes Mongoose and Joi errors and uses `ApiError.statusCode` when present.
6. **Rate limits** — All `/api/v1` traffic is subject to apiLimiter; only `POST /api/v1/auth/login` is additionally subject to loginLimiter.
