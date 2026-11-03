# Phase 0 — Foundations: tooling, tests, lint

**Goal:** a reproducible install, a working test harness in both apps, a clean lint baseline. No behavior change.

**Decisions:** D39, D40, D41, D42, D44 (marking only).

## Tasks

### Dependencies (D40)
- Stop ignoring `package-lock.json` (root `.gitignore` and the app-level `.gitignore` files ignore it); commit both lockfiles.
- Pin Node: `.nvmrc` with the current LTS major + `"engines"` in both `package.json`.
- Approve the esbuild install script (npm 11 `allow-scripts` / equivalent) so installs don't warn.
- `npm audit` in both apps: fix what upgrades cleanly; list anything left (with reason) at the bottom of this file.

### Backend tests (D39)
- Add Vitest + Supertest. `npm test` script.
- Split `app.js` creation from `listen` if needed so Supertest can load the app without a port.
- Test DB `esms_test` (from `MONGODB_URI_TEST` or derived); refuse to run against any DB not ending in `_test`. Clean collections between tests.
- Helpers: create user + get token per role, seed lookups.
- First tests (current behavior, they will change later): `GET /health`, login success/failure, one protected route returning 401 without token.

### Frontend tests (D39)
- Add Vitest + React Testing Library + jsdom. `npm test` script.
- One smoke test (e.g. `Button` renders, `cn()` merges).

### Lint & format (D41)
- Backend: add ESLint flat config (CommonJS, Node globals, recommended rules) + a Prettier config that matches the backend's **existing** style (double quotes, semicolons) so formatting changes stay small. `npm run lint` / `npm run format`.
- Frontend: fix the 3 errors (`ErrorBoundary.jsx` empty catches, unreachable code in `useFiles.js`), run Prettier on `src/` once, clear warnings that are mechanical. **One dedicated commit** for the mass reformat, separate from logic changes.

### Dev scripts (D42)
- `clean-test-data.js`: refuse to run when `NODE_ENV=production`; keep the rest (uploads/removed models are cleaned up in phase 1).

### Docs (D44)
- In `CLAUDE.md`: mark `backend/docs/` and `frontend/docs/` as outdated (code is the source of truth), add the new `npm test` / lint commands, point to `plan/README.md`.

## Done when
- [x] Fresh clone + `npm ci` works in both apps with the pinned Node.
- [x] `npm test` passes in both apps; backend tests cannot touch `esms`.
- [x] `npm run lint` passes (0 errors) in both apps; frontend Prettier check passes.
- [x] `clean-test-data.js` refuses production.
- [x] Demo seed still works.

## Out of scope
Any behavior change, removals, security fixes.

## Found during phase

### `npm audit` leftovers (2026-11-03, re-run after phase 1)
Both apps: only **moderate** findings remain; every offered fix is a breaking downgrade.
- **Backend:** `npm audit --omit=dev` → **0**. The 7 remaining findings are dev-only: `minimatch <11.0.1` (GHSA-g3hv-75wg-m249, ReDoS on untrusted glob patterns) via eslint and nodemon. Fix offered = downgrade nodemon to 1.x. We never pass user input as a glob pattern. Removing backend `exceljs` in phase 1 cleared `uuid` and the `archiver` → `minimatch` chain.
- **Frontend:** 17 moderate. `minimatch <11.0.1` via `exceljs → archiver → glob/readdir-glob` (also in the production tree) and dev tooling; `uuid <11.1.1` (GHSA-w5hq-g745-h8pq, only when a `buf` argument is passed) via `exceljs`. Fix offered = downgrade exceljs to 3.4.0.
- Follow-up: phase 8 upgrades frontend exceljs if possible; phase 11 requires no high/critical.

### Decisions taken during the phase
- **Node:** pinned to **26 LTS** (owner: always the best current stack, not what is installed locally). Local machine upgraded to Node 26.13.0; Vercel supports Node 26 for builds and functions.
- **Backend quote style:** most files used double quotes, so Prettier follows them; `app.js`, `server.js`, `config/database.js`, `middlewares/errorHandler.js`, `middlewares/rateLimiter.js` were converted in the reformat commit.
- **Mass reformat** done in its own commit ("Format backend and frontend with Prettier").

### Findings moved to later phases
- `clean-test-data.js` `removeUploads()` only works from the repo root → phase 1 (uploads cleanup removed).
- `npm run seed` re-creates lookups with new `_id`s and breaks question/indicator/job-title references → phase 1 (idempotent seed + test).
- Unused cancellation flags in `useScreening` / `useSemp` (stale requests can set state) → phase 5.
- 4 × `react-hooks/exhaustive-deps` → phase 5; 10 × `react-refresh/only-export-components` → phase 10.
- `multer` 1.x deprecated / vulnerable → removed in phase 1, phase 7 uses 2.x.
- `vendor-excel` chunk ≈ 930 kB → phase 8.
