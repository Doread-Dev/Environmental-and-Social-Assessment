# Authentication & Authorization

## Mechanism

The backend uses **JWT (JSON Web Tokens)** for authentication. There is no session store; the token carries the user identity (`sub`) and role. The client sends the token in the `Authorization` header on each request. This was chosen so the API stays stateless and scales without server-side session storage.

**Constraints**

- Authentication is not applied at the `/api/v1` router level; each route or route group opts in via the `auth` middleware.
- The only secrets used for auth are `JWT_SECRET` (and optionally `JWT_EXPIRES_IN`). There is no refresh token; when the token expires, the user must log in again.

---

## Token Lifecycle

| State    | When it happens | Outcome |
|---------|------------------|--------|
| Issued  | After successful `POST /api/v1/auth/login` or `POST /api/v1/auth/register`. | Response body includes `data.token` and `data.user`. |
| Validated | On every request that passes through the `auth` middleware. | `req.user` is set to the Mongoose User document; request continues. |
| Expired | Token `exp` claim is in the past. | `jwt.verify` throws; middleware calls `next(err)`; error handler returns 401. |
| Revoked | Not implemented. | There is no token blacklist or server-side revocation. Logout is client-side only (discard token). |

**Token payload (signed, not encrypted):**

- `sub`: MongoDB `_id` of the User document (string).
- `role`: One of `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

**Expiry:** Controlled by `JWT_EXPIRES_IN` (e.g. `12h`, `7d`). Default if unset: `12h`. See `auth.service.js` `signToken`.

**Constraints**

- Token is only verified when a route uses the `auth` middleware. Public routes never read the token.
- If the user is deleted after the token is issued, the next request that uses `auth` will fail (User not found → 401).

---

## Permissions Model

Authorization is **role-based**. There are five roles defined in `src/models/user.model.js` and accepted by `src/validators/auth.validator.js` for registration.

| Role                      | Description (for reference) | Typical use in routes |
|---------------------------|------------------------------|------------------------|
| `environmental_specialist`| Can approve/reject screenings and assessments; delete projects. | Required for approve/reject and project delete. |
| `program_manager`         | Can manage projects and content; export reports. | Create/update projects, SEMP, monitoring, etc.; report export. |
| `project_manager`         | Same as program_manager for most domain resources. | Create/update projects, screenings, assessments, SEMP, etc. |
| `environmental_focal_point` | Same as project_manager for domain resources. | Create/update projects, screenings, assessments, SEMP, etc. |
| `viewer`                  | Read-only. | List users; dashboard stats; no create/update/delete on domain resources. |

**How it is enforced:** The `requireRole(...roles)` middleware runs after `auth`. It checks `req.user.role`. If `req.user` is missing, it returns 401. If the allowed `roles` list is non-empty and `req.user.role` is not in that list, it returns 403.

**Constraints**

- Permissions are not stored in the database; they are derived only from the role string on the User and the middleware on each route.
- There is no resource-level ownership (e.g. “only the creator can edit”); any user with the required role can call the endpoint.

---

## Request Flow

1. **Client** sends a request to an API path under `/api/v1` (e.g. `POST /api/v1/projects`).
2. **Express** runs route-specific middleware in order. For protected routes, the order is: `auth` then optionally `requireRole(...)` then validation then controller.
3. **auth middleware** (`src/middlewares/auth.js`): Reads `req.headers.authorization`. If missing or not starting with `"Bearer "`, calls `next(ApiError(401, "Unauthorized"))`. Otherwise extracts the token, calls `jwt.verify(token, process.env.JWT_SECRET)`, loads the user with `User.findById(payload.sub)`. If verification fails or user is missing, passes an error to `next` (401). Otherwise sets `req.user` to the User document and calls `next()`.
4. **requireRole middleware** (when present): If `!req.user`, returns 401. If the allowed roles list is non-empty and `req.user.role` is not in it, returns 403. Otherwise calls `next()`.
5. **Controller** runs with `req.user` set; it can use `req.user._id` for audit or ownership if needed.

**Constraints**

- `requireRole` must be used only on routes that already use `auth`; otherwise `req.user` is undefined and it will return 401.
- Errors from `auth` (including JWT expiry or invalid signature) are passed to the central error handler and returned as JSON with status 401.

---

## Auth Middleware

Both exports live in `src/middlewares/auth.js`.

| Export        | Signature | Behavior |
|---------------|-----------|----------|
| `auth`        | `(req, res, next)` | Ensures `Authorization: Bearer <token>` is present, verifies JWT with `JWT_SECRET`, loads user by `payload.sub`, sets `req.user`. On failure calls `next(err)` with `ApiError(401, "Unauthorized")`. |
| `requireRole` | `(...roles) => (req, res, next)` | Factory. Returns a middleware that: if no `req.user` → 401; else if `roles.length > 0` and `req.user.role` not in `roles` → 403; else `next()`. |

**Usage:** Routes apply `auth` first, then `requireRole("role1", "role2", ...)` if the endpoint is restricted by role. Example:

```js
router.post("/", auth, requireRole("environmental_specialist", "program_manager"), validate(schema), controller.create);
```

**Constraints**

- Token must be in the form `Bearer <token>`; no other scheme is supported.
- JWT verification uses `process.env.JWT_SECRET`; the server refuses to start if `JWT_SECRET` is missing or shorter than 32 characters (`server.js` `validateEnv()`).

---

## Protected Routes

The following list is the full map of how auth and roles are applied. Routes not listed here are **unprotected** (no `auth`): anyone can call them. All paths are under `/api/v1`.

### Auth

- **POST /auth/register** — First user: no auth. After that: `auth` + `requireRole("environmental_specialist")`.
- **POST /auth/login** — No auth. Rate-limited by `loginLimiter` (see MIDDLEWARES.md).

### Users

- **GET /users** — `auth` + `requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point", "viewer")` (all roles).

### Projects

- **GET /projects**, **GET /projects/:id** — Unprotected.
- **POST /projects** — `auth` + `requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point")`.
- **PUT /projects/:id** — Same four roles.
- **DELETE /projects/:id** — `auth` + `requireRole("environmental_specialist")` only.

### Screenings

- **GET /screenings**, **GET /screenings/:id**, **GET /screenings/project/:projectId** — Unprotected.
- **POST /screenings**, **PUT /screenings/:id** — `auth` + the four roles (excluding viewer).
- **PATCH /screenings/:id/approve**, **PATCH /screenings/:id/reject** — `auth` + `requireRole("environmental_specialist")` only.

### Assessments

- **GET /assessments**, **GET /assessments/:id**, **GET /assessments/project/:projectId** — Unprotected.
- **POST /assessments**, **PUT /assessments/:id**, **POST/PUT /assessments/:id/methods**, **POST/PUT /assessments/:id/consultations**, **POST /assessments/:id/scores**, **GET** for methods/consultations/scores, **PATCH /assessments/:id/calculate** — `auth` + the four roles (excluding viewer).
- **PATCH /assessments/:id/approve**, **PATCH /assessments/:id/reject** — `auth` + `requireRole("environmental_specialist")` only.

### Monitoring

- **GET /monitoring**, **GET /monitoring/:id**, **GET /monitoring/project/:projectId** — Unprotected.
- **POST /monitoring**, **PUT /monitoring/:id**, **PATCH /monitoring/:id/quarter/:q** — `auth` + the four roles (excluding viewer).

### Management activities

- **GET /management/project/:projectId** — Unprotected.
- **POST /management**, **PUT /management/:id**, **DELETE /management/:id** — `auth` + the four roles (excluding viewer).

### Mitigation

- **GET /mitigation/project/:projectId** — Unprotected.
- **POST /mitigation**, **PUT /mitigation/:id**, **DELETE /mitigation/:id** — `auth` + the four roles (excluding viewer).

### SEMP

- **GET /semp/project/:projectId** — Unprotected.
- **POST /semp/objectives**, **PUT /semp/objectives/:id**, **POST /semp/targets**, **PUT /semp/targets/:id**, **POST /semp/actions**, **PUT /semp/actions/:id** — `auth` + the four roles (excluding viewer).

### Reports

- **GET /reports/dashboard** — `auth` + all five roles (including viewer).
- **GET /reports/export** — `auth` + `requireRole("environmental_specialist", "program_manager")` only.

### Attachments

- **POST /attachments** — `auth` + the four roles (excluding viewer).
- **POST /attachments/upload** — `auth` + the four roles (excluding viewer).
- **GET /attachments/:id** — Unprotected.

### Lookups

- **GET /lookups/impact-categories**, **/impact-questions**, **/indicators**, **/job-titles** — All unprotected.

**Constraints**

- “The four roles” means: `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point` (viewer excluded for write operations).
- Any new route under `/api/v1` that should be protected must explicitly add `auth` and, if needed, `requireRole(...)`.

---

## Constraints (summary)

- **JWT only:** No cookie-based or session-based auth; no refresh tokens.
- **No revocation:** Expired or discarded tokens cannot be invalidated server-side.
- **Role-only authorization:** No per-resource or per-tenant permissions beyond the five roles.
- **Public reads:** Many GET endpoints (projects, screenings, assessments, monitoring, management, mitigation, SEMP, attachments, lookups) are intentionally unprotected; protect them in middleware if the product requires it.
- **Env:** `JWT_SECRET` is required and must be at least 32 characters; optional `JWT_EXPIRES_IN` controls token lifetime (default `12h`).
