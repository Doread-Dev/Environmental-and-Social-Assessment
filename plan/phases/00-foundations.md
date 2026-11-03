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
- [ ] Fresh clone + `npm ci` works in both apps with the pinned Node.
- [ ] `npm test` passes in both apps; backend tests cannot touch `esms`.
- [ ] `npm run lint` passes (0 errors) in both apps; frontend Prettier check passes.
- [ ] `clean-test-data.js` refuses production.
- [ ] Demo seed still works.

## Out of scope
Any behavior change, removals, security fixes.

## Found during phase
