# Phase 2 — Security & authentication

**Goal:** close the known holes; the backend decides who may do what.

**Decisions:** D1, D3, D4, D5, D6, D7, D8, D9, D10, D24, D58 (auth part).

## Tasks

### Validation (D5)
- `middlewares/validate.js`: replace `req.body` with Joi's stripped value. Review every schema so server-owned fields (`officer`, `approved_by`, `reject_by`, `approved_at`, `status`, `created_by`, …) are not accepted.

### Status transitions (D1, D10)
- Remove `status` from all create/update schemas (screening, assessment).
- Explicit endpoints: `PATCH /screenings/:id/submit|approve|reject`, same for assessments (approve/reject exist — add submit). Role checks: submit = editor roles; approve/reject = `environmental_specialist` + `admin`. Specialist may approve own work; record who did what.
- Transition rules: draft|rejected → submitted → approved|rejected. Anything else → 409.

### Authentication everywhere (D3)
- `auth` on every route except `GET /health` and `POST /auth/login` (projects, lookups, users, reports, all GETs). Viewers keep read access.
- Port v2's JWT error handling (`backend/src/middlewares/auth.js` in v2): bad/expired token → 401, wrong role → 403, unexpected → 500; no stack traces in auth error responses.

### Active users (D4)
- Login rejects `is_active: false`. `auth` middleware rejects inactive users on every request (tokens stop working immediately).

### Admin role & first user (D7, D9)
- Add `admin` to the role enum; admin passes every specialist check.
- Remove open first-user registration: `/auth/register` always requires a logged-in `admin` or `environmental_specialist` (specialist keeps it only until phase 6 moves user management to admin).
- CLI `scripts/create-admin.js` (interactive or env-driven; never prints the password).
- CLI `scripts/reset-password.js` — break-glass reset of any account (D24).

### Proxy & rate limits (D6, D8)
- `TRUST_PROXY` env (default off) → `app.set('trust proxy', …)`.
- API limiter keyed by user id when authenticated, IP otherwise; login limiter by IP. Keep limits generous.

### Hardening from v2 (D58)
- `project` cannot be changed on update of any child record (400).

## Tests
- Every route without token → 401 (table-driven over the router list).
- Viewer write → 403; editor approve → 403; specialist/admin approve → 200.
- PUT with `status: "approved"` does not change status.
- Illegal transitions → 409.
- Inactive user: login 401/403, existing token rejected.
- Unknown body fields are stripped (e.g. `approved_by` ignored).
- `create-admin` and `reset-password` scripts work against `esms_test`.

## Frontend (minimal, to keep it working)
- Use the new submit endpoints; send no `status` in PUT.
- Treat `admin` like specialist in `useAuth` helpers until phase 5 replaces them.
- Login page: no change yet (phase 8).

## Done when
- [ ] All tests above pass; frontend flows (create → submit → approve) still work in the browser.
- [ ] `CLAUDE.md` updated: auth on all routes, transitions, admin role, CLI scripts.
- [ ] Demo seed uses the transition endpoints and an admin/specialist account.

## Out of scope
User management UI and password change (phase 6), workflow order (phase 3).

## Found during phase
