# CLAUDE.md

This file provides guidance to Claude Code when working in this repository. The details live in
the technical docs ([docs/README.md](docs/README.md)); this file keeps the rules you must not miss
and says where each topic is written down. When a doc and the code disagree, the code wins — fix
the doc in the same change.

## What this is

ESMS (Environmental and Social Management System) — a workflow app for environmental & social due
diligence of development projects (AKF Syria branding in exports). Folders, each with its own
`package.json` (no root package or workspace tooling):

- `backend/` — Node.js + Express 4 + Mongoose 8 (CommonJS), JWT auth, Joi validation. REST API under
  `/api/v1`. In production it serves the frontend build on the same origin (D38).
- `frontend/` — React 19 + Vite 7 + React Router 7 + TanStack Query 5 + Tailwind CSS 4 (ES modules,
  plain JSX — no TypeScript).
- `e2e/` — Playwright end-to-end tests of the golden flows (Chromium only, D76 2).
- `deploy/` — server install, backups and restore (Windows and Linux); start at
  [deploy/README.md](deploy/README.md). `docs/` — technical docs. `plan/` — the rework plan.

The workflow is strictly ordered: **Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management
Activities (Tool 3) + Mitigation Plan (Tool 4) → Monitoring (Tool 5)**, plus project documents, the
reference library and Settings.

## Active rework plan (read first)

The app is being reworked in phases. Before any change:
- [plan/DECISIONS.md](plan/DECISIONS.md) — what we build (D1–D77). Source of truth; don't diverge
  silently.
- [plan/README.md](plan/README.md) — phase order, rules for every phase, progress table. Each phase =
  one conversation, scoped by its file in `plan/phases/`.
- [plan/V3_VISION.md](plan/V3_VISION.md) — notes for the v3 restructure (not a spec).
- [plan/V2_INVENTORY.md](plan/V2_INVENTORY.md) — what the `Environmental-and-Social-Assessment-main version 2/`
  prototype contains. That folder is git-ignored, unreviewed third-party work: never edit or commit
  it; port from it only what a decision/phase names, otherwise keep this repo's behaviour and ask the
  owner.

## Where things are written

| Topic | Doc |
|---|---|
| Apps, request pipeline, endpoint conventions, files, places, frontend data layer, guards, screens, Excel export, known gaps | [docs/architecture.md](docs/architecture.md) |
| Every route: permission, project-access check, body, response | [docs/api-reference.md](docs/api-reference.md) |
| Collections, fields, indexes | [docs/data-models.md](docs/data-models.md) |
| Roles, permission matrices, `allowed_actions`, accounts and passwords | [docs/roles-and-permissions.md](docs/roles-and-permissions.md) |
| Gates, statuses, locks, bulk saves, stale saves, archive/delete/purge, audit log, transactions | [docs/workflow-rules.md](docs/workflow-rules.md) |
| Setup, `.env` files, commands, tests (backend, frontend, E2E, docs), CI, coverage | [docs/developer-guide.md](docs/developer-guide.md) |
| UI rules (the v2 style guide; the design system comes with v3, D77) | [docs/style-guide.md](docs/style-guide.md) |
| Server install, backups, restore, HTTPS, MongoDB/kernel matrix | [deploy/README.md](deploy/README.md) |

## Commands

- Backend (`cd backend`): `npm run dev` (port 3000), `npm start`, `npm run seed`, `npm test`,
  `npm run test:coverage`, `npm run lint`, `npm run format:check`. Scripts: `create-admin.js`,
  `reset-password.js`, `seed-demo-project.js` (needs an **admin** login — the `DEV_ADMIN_*` values in
  `backend/.env`), `clean-test-data.js` (**destructive: ask before running; never on `esms`**), and
  the server scripts (`backup.js`, `restore.js`, `test-backup-restore.js`, `init-replica-set.js`,
  `check-server.js`). Details: [developer guide → commands](docs/developer-guide.md#commands).
- Frontend (`cd frontend`): `npm run dev` (port 5173), `npm run build`, `npm test`,
  `npm run test:coverage`, `npm run lint`, `npm run format:check`.
- **E2E (`cd e2e`): `npm test`** — one command: builds the frontend into `e2e/.build/dist` with an
  empty `VITE_API_URL`, starts the production-style server on port **3100** with a fresh
  `esms_e2e_test` database (dropped, lookups seeded, bootstrap admin), and runs every flow in
  Chromium. `npm run test:nobuild` reuses the last build; `npm run report` opens the report. Once per
  machine: `npx playwright install chromium`. Details:
  [developer guide → E2E](docs/developer-guide.md#e2e-playwright-phase-12).
- `.claude/launch.json` defines `backend` (3000), `frontend` (5173) and `e2e-server` (3100) for the
  preview pane.

## Rules for every change

- **Tests (D39, D76 3):** every behaviour change and fix ships with a test; every module with logic
  (hooks, utils, services, controllers, middlewares, pages with forms or actions) has a unit or
  integration test. Before finishing: `npm test` + `npm run lint` + `npm run format:check` in each app
  you touched, `npm run build` for the frontend, and the E2E run when a flow is affected. Lint stays
  at 0 errors; Prettier checks pass in all three folders.
- **Coverage floors** (`coverage.thresholds` in `backend/vitest.config.mjs` and
  `frontend/vitest.config.js`): raise them at the end of a phase (rounded down), never lower them.
- **CI** (`.github/workflows/ci.yml`: Backend, Backend (replica set), E2E, Deploy scripts, Frontend)
  must be green before a merge. New test files and specs run automatically; add a job only for a new
  kind of check.
- Backend tests run against `esms_test` (the setup refuses any database not ending in `_test`); E2E
  against `esms_e2e_test`. Never run tests or destructive scripts against `esms`.
- **Backend endpoints:** mount routers in `routes/index.js`; order `requirePermission(name)`,
  project-access check, `validate(schema)`, controller; name a permission, never a role list (D66 b);
  every project-scoped route has one check from `middlewares/projectAccess.js` (D66 a); server-owned
  fields stay out of Joi schemas; free text uses `text()` (≤ 30,000, D74 4); every write of project
  data takes a `version` (D62); a critical action is logged through `audit.service.record()` and runs
  in `atomic()` (D65). Details: [architecture](docs/architecture.md#conventions-for-endpoints),
  [workflow rules](docs/workflow-rules.md).
- **Frontend:** all HTTP through `src/services/api.js`; query keys from `services/queryKeys.js`;
  writes of project data through `useProjectSave`; edit pages use `useUnsavedChanges`; workflow state
  and permissions only from the backend (`workflow`, `allowed_actions`, `GET /auth/me`) — no workflow
  rule or role list in the frontend; `ROUTES` constants, never hardcoded paths; `extractErrorMessage`
  for user-facing errors. Details: [architecture → frontend](docs/architecture.md#frontend).
- **UI:** shared components only, tokens only, light and dark mode, one `Select`, `ConfirmDialog`
  (never `window.confirm`), one date format, Material Symbols with `aria-hidden`; `styleGuard.test.js`
  enforces it. Details: [style rules](docs/style-guide.md). UI/UX issues found while working go into
  [the phase 13 file](plan/phases/13-page-by-page-ui-review.md) (the v3 UI list, D77), not fixed on
  the side (D72 c).
- **Docs:** `backend/tests/docs.test.js` fails when a mounted route is missing from the API
  reference, when the permission matrices differ from `config/permissions.js`, when a relative link
  breaks, or when `backend/docs/` / `frontend/docs/` come back. Update the docs in the same change.
- Language: UI, code and docs in English; replies to the owner in Arabic.
- Never commit the official AKF workbook, an export of it, or the Annex 1 PDF (client documents,
  D68, D75 3).
- Git: `origin` = github.com/Doread-Dev/Environmental-and-Social-Assessment; branches `main`
  (default) and `Development`, changes via pull requests. No Claude/AI attribution in commits or PRs.

## Local environment

- MongoDB runs locally as the Windows service `MongoDB` (8.3, standalone). Start with
  `Start-Service MongoDB` if stopped. DB name: `esms`. Never change the service's configuration (for
  the transaction path, use a throwaway replica set:
  [developer guide → tests](docs/developer-guide.md#backend)).
- `backend/.env` and `frontend/.env` are gitignored; their variables are listed in the
  [developer guide](docs/developer-guide.md#backendenv). Keep `FRONTEND_URL=http://localhost:5173`
  for `npm run dev` (no CORS at all when it is unset). Local dev logins are stored as comments in
  `backend/.env`: an admin (`DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`) and a specialist
  (`DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`).
- There is no open registration: the first admin comes from `scripts/create-admin.js`; then an admin
  creates users in Settings → Users. Use `@example.com` for test users (Joi `email()` refuses
  `@*.local` / `@*.test`).
- Node is pinned to 26 LTS (`.nvmrc`); install with `npm ci` (lockfiles committed).
- Line endings: the repo is LF. This clone sets `core.autocrlf=false` locally because the
  machine-wide Git default converts to CRLF (ESLint then reports ~24k `Delete ␍` warnings). Keep new
  files LF.
- On this machine Playwright's Chromium does not start from `%LOCALAPPDATA%\ms-playwright` ("side-by-side
  configuration"); run E2E with `PLAYWRIGHT_BROWSERS_PATH` pointing at a copy elsewhere.
