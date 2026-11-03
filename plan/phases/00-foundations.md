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
- [ ] `npm run lint` passes (0 errors) in both apps; frontend Prettier check passes.
- [x] `clean-test-data.js` refuses production.
- [x] Demo seed still works.

## Out of scope
Any behavior change, removals, security fixes.

## Found during phase

### `npm audit` leftovers (2026-11-03)
Both apps: only **moderate** findings remain after `npm audit fix`; every offered fix is a breaking downgrade.
- `minimatch <11.0.1` (GHSA-g3hv-75wg-m249, ReDoS on untrusted glob patterns) — pulled in by eslint, nodemon (dev only) and `exceljs → archiver → glob/readdir-glob`. Fix offered = downgrade nodemon to 1.x / eslint-plugin-prettier to 2.x. We never pass user input as a glob pattern.
- `uuid <11.1.1` (GHSA-w5hq-g745-h8pq, only when a `buf` argument is passed) — via `exceljs`. Fix offered = downgrade exceljs to 3.4.0. Revisit when exceljs ships a release on uuid ≥ 11.1.1.

### Notes for the owner / later phases
- **Node pin:** pinned to **24** (the version installed here; LTS until 2028-04). Node 26 has been Active LTS since 2026-10 — switch `.nvmrc` + `engines` if you want the newer line.
- **Backend quote style:** most files use double quotes (the Prettier config follows them); `app.js`, `server.js`, `config/database.js`, `middlewares/errorHandler.js` and `middlewares/rateLimiter.js` used single quotes and change in the reformat commit.
- **Mass reformat** (Prettier on backend `src/ scripts/` and frontend `src/`) is kept for its own commit, after the logic commit.
- `scripts/clean-test-data.js` → `removeUploads()` resolves `process.cwd()/backend/uploads`, so it only finds uploads when run from the repo root (phase 1 reworks uploads cleanup).
- Frontend: cancellation flags that are set but never read — `isMounted` in `hooks/useScreening.js` and `cancelled` in `hooks/useSemp.js` — so state can update after unmount / a stale request can win. Not mechanical; left for phase 5 (data layer).
- Frontend lint warnings left on purpose (not mechanical): 4 × `react-hooks/exhaustive-deps` (`ProjectsManagementSection`, `UsersManagementSection`, `Toast`, `useAssessment`), 10 × `react-refresh/only-export-components` (contexts, `Toast`, `routes/index.jsx`).
- Frontend build warns that `vendor-excel` is ~930 kB (lazy-loaded on export; pre-existing).
- `npm run seed` replaces lookup documents with new `_id`s, so existing projects (incl. the demo project) lose their question/indicator references (`assessmentImpactScore.question`, `monitoringRecord.indicator`), and users lose `job_title` — re-run the demo seed after it.
