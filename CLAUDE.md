# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

ESMS (Environmental and Social Management System) — a workflow app for environmental & social due diligence of development projects (AKF Syria branding in exports). Two independent apps in one repo, each with its own `package.json`; there is no root package or workspace tooling:

- `backend/` — Node.js + Express 4 + Mongoose 8 (CommonJS), JWT auth, Joi validation. REST API under `/api/v1`.
- `frontend/` — React 19 + Vite 7 + React Router 7 + Tailwind CSS 4 (ES modules, plain JSX — no TypeScript). Deployed to Vercel.

The domain workflow is strictly ordered, and most code is organized around it:
**Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management Activities (Tool 3) + Mitigation Plan (Tool 4) → Monitoring (Tool 5)**, plus Annex and Settings.

## Active rework plan (read first)

The app is being reworked in phases. Before any change:
- [plan/DECISIONS.md](plan/DECISIONS.md) — what we build (D1–D61). Source of truth; don't diverge silently.
- [plan/README.md](plan/README.md) — phase order, rules for every phase, progress table. Each phase = one conversation, scoped by its file in `plan/phases/`.
- [plan/V2_INVENTORY.md](plan/V2_INVENTORY.md) — what the `Environmental-and-Social-Assessment-main version 2/` prototype contains. That folder is git-ignored, unreviewed third-party work: never edit or commit it; port from it only what a decision/phase names, otherwise keep this repo's behavior and ask the owner.

Sections below describe the code **as it is today**; they change as phases land. `backend/docs/` and `frontend/docs/` are outdated (D44) — the code wins.

## Commands

Backend (`cd backend`):
- `npm run dev` — `node --watch src/server.js` (port 3000). Health: `GET http://localhost:3000/health`.
- `npm start` — production start.
- `npm run seed` — upserts the 4 lookup collections (impact categories, impact questions, indicators, job titles) by a stable key (category `code`, question text, indicator name, job title name). Safe to re-run: existing rows keep their `_id`, so scores, monitoring records and users stay linked. Does not delete rows that are no longer in the seed, and does not create users.
- `SEED_EMAIL=... SEED_PASSWORD=... node scripts/seed-demo-project.js` — (re)creates `[DEMO] Al-Salam Water Network Rehabilitation`, a project that has passed all 5 tools, through the real API, using the submit/approve endpoints (needs an admin or specialist login; use the `DEV_LOGIN_*` values from `backend/.env`). It first deletes every previous demo copy (by title, archived ones too) straight in MongoDB, so only one stays; refuses to run when `NODE_ENV=production`.
- `node scripts/create-admin.js` — creates an admin (the only way to create the first user). Asks for name/email/password, or reads `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Never prints the password; fails if the email exists.
- `node scripts/reset-password.js [--activate]` — break-glass reset of any account's password, straight in MongoDB (asks, or `RESET_EMAIL` / `RESET_PASSWORD`). `--activate` also reactivates a deactivated account.
- `node scripts/clean-test-data.js` — deletes ALL domain data (projects, screenings, assessments, management activities, mitigation plans, monitoring). Destructive; ask before running. Refuses to run when `NODE_ENV=production`.
- `npm test` (`npm run test:watch`, `npm run test:coverage`) — Vitest + Supertest, see "Tests" below. Needs MongoDB running.
- `npm run lint` / `npm run lint:fix` — ESLint flat config (CommonJS, Node globals, `eslint-config-prettier`).
- `npm run format` / `npm run format:check` — Prettier, backend style: double quotes, semicolons, width 100.

Frontend (`cd frontend`):
- `npm run dev` — Vite on http://localhost:5173.
- `npm run build` / `npm run preview`
- `npm test` (`npm run test:watch`, `npm run test:coverage`) — Vitest + React Testing Library + jsdom. Tests sit next to the code as `*.test.js(x)`; setup in `src/test/setup.js`.
- `npm run lint` / `npm run lint:fix` — ESLint 9 flat config (prettier as a lint rule).
- `npm run format` / `npm run format:check` — Prettier on `src/`.

Node is pinned to 26 LTS (`.nvmrc`, `engines` in both `package.json`). Lockfiles are committed: install with `npm ci`. esbuild's install script is approved via `allowScripts` in `frontend/package.json` (npm 11).

Every behavior change and fix ships with a test (D39). Before finishing a change: `npm test` + `npm run lint` in each app you touched, plus `npm run build` for the frontend. Lint must stay at 0 errors and Prettier checks must pass in both apps.

### CI and coverage

- `.github/workflows/ci.yml` (GitHub Actions) runs on every PR and on pushes to `main`/`Development`: jobs **Backend** (MongoDB **7.0** service — 8.x cannot start on the runner kernels, see the comment in the workflow; `npm ci`, lint, `format:check`, `test:coverage`) and **Frontend** (`npm ci`, lint, `format:check`, `test:coverage`, `build`). Merge only when green. Coverage HTML is uploaded as an artifact; the job summary shows the numbers.
- New `*.test.js(x)` files run in CI automatically. Add a step/job only for a new kind of check (e.g. Playwright in phase 12).
- `coverage.thresholds` in `backend/vitest.config.mjs` and `frontend/vitest.config.js` are a floor: `test:coverage` fails below them. Raise them at the end of a phase (rounded down to the new numbers); never lower them.
- A green CI does not mean new code is tested — writing the test is still part of the change (D39).

### Tests

- Backend tests live in `backend/tests/` (`*.test.js`, ESM syntax; app code is loaded via `createRequire` in `tests/helpers/app.js` so tests share the app's mongoose instance).
- They run against `esms_test`: `MONGODB_URI_TEST` if set, else `MONGODB_URI` with `_test` appended to the DB name. `tests/setup/env.js` refuses any database whose name doesn't end in `_test`; every collection is emptied before each file and after each test. Files run one at a time.
- Helpers (`tests/helpers/fixtures.js`): `createUser(role)`, `loginAs(role)` → `{ user, token }` via the real login endpoint, `seedLookups()` (same data as `npm run seed`, from `seedLookupData()` in `src/db/seed.js`), `ROLES`.

`.claude/launch.json` defines `backend` (port 3000) and `frontend` (port 5173) dev servers for the preview pane.

Line endings: the repo is LF (Prettier `endOfLine: lf`). This clone sets `core.autocrlf=false` locally because the machine-wide Git default converts to CRLF, which makes ESLint report ~24k `Delete ␍` warnings. Keep new files LF.

## Local environment

- MongoDB runs locally as the Windows service `MongoDB` (8.3). Start with `Start-Service MongoDB` if stopped. DB name: `esms`.
- `backend/.env` (gitignored): `MONGODB_URI`, `JWT_SECRET` (server exits if < 32 chars), `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN` (default 12h), `FRONTEND_URL` (CORS origin, default http://localhost:5173), `TRUST_PROXY` (default off; `true` = one proxy hop, or a hop count / IP list — set only behind IIS/nginx).
- `frontend/.env` (gitignored): `VITE_API_URL` (must include `/api/v1`), `VITE_API_TIMEOUT`. In dev `api.js` falls back to `http://localhost:3000/api/v1`; in prod there is no fallback.
- Users: the seed creates none. There is no open registration: create the first admin with `scripts/create-admin.js`; then an `admin` or `environmental_specialist` registers users (Settings page → Users; `admin` cannot be registered through the API). A local dev specialist login is stored as comments in `backend/.env` (`DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`).
- Joi `email()` validates TLDs, so `@*.local` / `@*.test` addresses are rejected — use `@example.com` for test users.

## Backend architecture

Request pipeline (`src/app.js`): `trust proxy` from `TRUST_PROXY` → helmet → cors → body parsers (10mb) → morgan (off when `NODE_ENV=test`) → `GET /health` → `app.use('/api/v1', apiLimiter, routes)` → 404 → `errorHandler` (must stay last). Inside `routes/index.js`: `/auth` first, then `router.use(auth)` — **every other `/api/v1` route requires a valid token of an active user**, including all GETs and unknown paths (401 before 404). `server.js` validates env and connects to Mongo **before** `listen`.

Layering, one file per domain in each folder:
`routes/<domain>.routes.js` → `controllers/<domain>.controller.js` → `services/<domain>.service.js` → `models/<entity>.model.js`, with `validators/<domain>.validator.js` (Joi).

Conventions to follow when adding endpoints:
- Mount new routers in `src/routes/index.js`; never register API routes on `app` directly.
- Route order: `requireRole(...ROLES_LIST), validate(schema), controller.fn` — `auth` is applied once in `routes/index.js`, don't repeat it. Role lists come from `src/config/roles.js` (`EDITOR_ROLES`, `SPECIALIST_ROLES`). A GET with no `requireRole` is open to every signed-in role, viewer included.
- `validate(schema)` checks **`req.body`** (`validate(schema, "query")` checks `req.query`; `abortEarly:false, stripUnknown:true`) and **replaces it with the stripped value** (defaults applied, types converted): a field not in the schema never reaches the controller. Keep server-owned fields (`status`, `officer`, `approved_by`, `reject_by`, `reject_reason`, totals, `is_active`) out of the schemas.
- Updates of project-owned records (screening, assessment, management, mitigation, monitoring) call `assertSameProject` (`src/utils/assertSameProject.js`): changing `project` → 400.
- Auth errors: bad/expired/forged token, unknown or inactive user → 401; wrong role → 403; unexpected verify error → 500 `Server Error` (no stack, no details).
- Controllers are wrapped in `asyncHandler` and respond `{ success: true, data }`; errors are thrown as `new ApiError(status, msg)` (`src/utils/ApiError.js`) and become `{ success: false, error }`. Mongoose CastError → 404, duplicate key → 409.
- Models use snake_case fields, `timestamps: true`, `versionKey: false`. References use `ObjectId` + `ref`.

Roles (`src/config/roles.js`): `admin`, `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.
- `EDITOR_ROLES` (all but viewer): create/update and submit. `SPECIALIST_ROLES` (`admin` + `environmental_specialist`): approve/reject screening & assessment, delete/archive/restore project, register users. `ADMIN_ROLES` (`admin`): purge archived projects, read the audit log. Viewers read only. There is no per-resource ownership check.
- Inactive users (`is_active: false`): login → 403 `Account is deactivated` (only after a correct password); existing tokens → 401 on the next request.
- Permissions (D35, `src/config/permissions.js`, built from the same role lists): `GET /auth/me` → `{ user (job_title populated), permissions }` — `create_project`, `edit`, `export` (editors; never viewer, D28a), `approve`, `manage_users`, `delete_project`, `archive_project` (specialist/admin), `purge_project`, `read_audit_log` (admin). Project-level `allowed_actions` (below) add the workflow state on top.

Rate limits: 1000 req / 7 min on `/api/v1`, keyed per user id when the token is valid, per IP otherwise; login 10 failed attempts / 15 min per IP.

Each project has at most one screening and one assessment (unique indexes; a second create → 409), one score per (assessment, question) and one monitoring record per (project, indicator). `GET /<domain>/project/:projectId` returns **404 when none exists yet** — the frontend treats that as "not started" (axios `silent404` + a `console.error` filter in `api.js`), so don't change it to `200 null` without updating the hooks. Services populate user refs (`officer`, `approved_by`, `reject_by`, `responsible`) with `job_title`; `officer` is set on create and on submit.

Statuses for screening & assessment: `draft | submitted | approved | rejected`, changed **only** through `PATCH /<screenings|assessments>/:id/submit|approve|reject` (`src/utils/statusTransition.js`): `draft|rejected → submitted` (editors; sets `officer`), `submitted → approved|rejected` (specialist/admin; sets `approved_by` or `reject_by` + `reject_reason`; a specialist may approve their own work). Any other transition → 409. `status` in a create/PUT body is ignored. Each create and transition appends `{ status: created|submitted|approved|rejected, by, at, note? }` to `status_history` (note = reject reason), returned with `by` populated (`name`, `role`).

Impact levels everywhere: `negligible | low | medium | high | not_applicable`. Screening category codes: `A`–`F`.

### Workflow state & aggregate endpoints (D30–D32, D35)

`computeWorkflow()` in `src/services/workflow.service.js` is the one source of truth for project state; the gates below use it too. Per step (`screening`, `assessment`, `semp`, `monitoring`) a status `locked | not_started | in_progress | submitted | approved | rejected | completed` (screening/assessment `draft` → `in_progress`); plus overall `status` (`draft | in_progress | needs_action | monitoring | completed`), `current_step`, `percent_complete` (approved/completed = 1 step, in_progress/submitted/rejected = ½, of 4), `next_action` (`step`, `tool`, `route` = frontend `ROUTES` key, `label`, `description`), SEMP row/described counts, monitoring `records`/`complete_records`/`quarters_filled` (monitoring is in progress once it has any record, a baseline alone included, and completed once one record has all four quarters). `loadWorkflowInputs(ids)` loads many projects in 5 queries — never loop per project. `allowedActions(role, project, workflow)` → e.g. `project.edit|archive|restore|delete|purge`, `screening.create|edit|submit|approve|reject`, same for `assessment`, `semp.edit`, `monitoring.edit`, `export` (archived: only restore/delete/purge/export).
- `GET /dashboard` → `{ stats: { total_projects, by_status, high_risk (category A/B) }, latest_projects (5, newest update first) }`, archived left out.
- `GET /projects` → each project + `screening`/`assessment` summary (or null) + `workflow` + `allowed_actions`, and `pagination: { page, limit, total, pages }` next to `data`. Query: `archived`, `search` (title/location), `status`, `category`, `sort` (`createdAt` default, newest first | `updatedAt` | `title` | `start_date`), `page`, `limit` (≤ 100; **no `limit` = all**, as the current frontend expects). Invalid values → 400.
- `GET /projects/:id/workspace` → `{ project (archived_by populated), workflow, allowed_actions, screening, assessment, counts }` — works on archived projects. `GET /projects/:id` is unchanged.
- `GET /lookups` → `{ impact_categories, impact_questions, indicators, job_titles }` (same data as the four single endpoints).
- Bulk saves (editors, same gates as the row endpoints): `PUT /projects/:id/management` and `/mitigation` with `{ rows }` replace the whole table — a row with `_id` updates that row (fields not sent keep their value), a row without one is created, rows left out are deleted, a row without `serial_number` gets its position. `PUT /projects/:id/monitoring` with `{ records }` upserts by `indicator` (must exist, once per payload); records not sent stay. Every row is checked first (Joi, responsible rule, ids of this project, model validation → 400 `Row n: …` / `Record n: …`) and nothing is written on error; the writes then go out as one `bulkWrite` (no transaction: the local MongoDB is standalone; phase 11 adds a single-node replica set and a transaction). Responses return the saved table/records like the `GET …/project/:projectId` endpoints.

### Workflow rules (`src/services/workflow.service.js`)

Every create/update/delete of project data calls a gate; reads never do. **Every broken workflow rule is 409** (gate, lock, archived, duplicate):
- **Order** (any screening category A–F, E included): assessment and its children need the screening approved (`requireScreeningApproved`); management activities and mitigation plan need the assessment approved (`requireAssessmentApproved`); monitoring needs Tools 3 and 4 complete — at least one row each, every row with its description (`requireSempComplete`).
- **Archive**: `PATCH /projects/:id/archive|restore` (specialist/admin) sets `archived` + `archived_by`/`archived_at`. Archived projects are hidden from `GET /projects` (`?archived=true` lists only them), still readable by id, and every write on them (project PUT, all tools, transitions) → 409 (`assertProjectWritable`, called by all gates). `DELETE /projects/:id` → 409 when the screening or assessment is approved (archive instead); otherwise it deletes the project with all its data. `DELETE /projects/:id/purge` (**admin only**, D60) permanently deletes an **archived** project, approved work included (not archived → 409), after writing an `AuditLog` entry (`action: project.purge`, `by`, `target_title`, state snapshot in `details`); `GET /audit-logs` (admin only) lists entries newest first.
- **Locking**: screening/assessment PUT and assessment methods/consultations/scores/calculate only while `draft` or `rejected` (`assertEditable` in `utils/statusTransition.js`); `submitted`/`approved` → 409. No reopen. SEMP, monitoring and project metadata stay editable (unless archived).
- **Assessment create** prefills empty `project_activity` (← project `project_component`, 400 if neither) and `potential_negative_impact`/`potential_positive_impact` (← screening), once; and creates one `negligible` score per `ImpactQuestion`. `POST /assessments/:id/scores` upserts only the questions sent (others keep their level; duplicate or unknown question → 400) and returns all scores. `total_project_score` counts and `total_project_impact` (highest level: high > medium > low > negligible > not_applicable) are recalculated on every score change; `PATCH .../calculate` is kept but optional. Submit → 400 unless every question has a score.
- **Responsible** (Tools 3, 4, 5): `responsible` (user id) **or** `responsible_text` (external party), never both (400). Setting one clears the other (`utils/responsible.js`).
- No minimum-length rules anywhere (D57); monitoring quarter values and `total` are free text, never parsed.

## Frontend architecture

- Entry: `index.html` (inline script applies saved theme from `localStorage['esms-theme']`) → `src/main.jsx` providers: `AuthProvider` → `LookupProvider` → `ThemeProvider` → `ToastProvider` → `App` (`ErrorBoundary` + `OfflineBanner` + `RouterProvider`).
- Path alias `@` → `src/`. Barrels (`index.js`) in components/hooks/services/contexts/utils — import from them.
- **All HTTP goes through `src/services/api.js`** (axios instance: attaches `Bearer` token from `localStorage['token']`; on 401 clears auth and hard-redirects to `/login`). Use `extractErrorMessage(err)` for user-facing errors. Never call `fetch`/raw axios to the API.
- Layering: `services/<domain>Service.js` (thin API calls) → `hooks/use<Domain>.js` (loading/error/data + actions) → `pages/` and feature `components/<domain>/`. No global store; only Auth/Lookup/Theme contexts. Lookups load once per session via `useLookups()` — don't refetch reference data in pages.
- Routing: `src/routes/index.jsx` (all pages lazy-loaded) + `routes.config.js` (`ROUTES` constants, `getProjectRoute(id, ROUTES.X)`, sidebar nav config). Use `ROUTES` constants rather than hardcoded paths.
- Workflow gates are enforced by the backend (409, shown through `extractErrorMessage`) and mirrored client-side by route guards: `AssessmentRouteGuard` (screening approved) → `SempRouteGuard` (+ assessment approved) → `MonitoringRouteGuard` (+ SEMP completed). `SettingsRouteGuard` = specialist only. Project status/next step derivation lives in `utils/workflowDerivation.js` + `hooks/useWorkflow.js` until phase 5 (the backend's `computeWorkflow` ports the same rules; keep both in step until then).
- Permission helpers come from `useAuth()`: `canEdit`, `canApprove`, `canManageUsers`, `canDeleteProject`, `canUpdateMonitoring`. Keep them aligned with backend `requireRole` lists: `admin` passes everything a specialist does (`canApprove`, `canManageUsers` — also gates Settings —, `canDeleteProject`). Screening/assessment are submitted with `screeningService.submit` / `assessmentService.submit` (save first, then the transition endpoint); never send `status` in a create/PUT.
- Excel export is fully client-side (`utils/excelExport/`, ExcelJS lazy-loaded into the `vendor-excel` chunk). Layout headers trigger exports via window events: `screening-export`, `assessment-export`, `semp-export` (`detail.toolType: 'tool3'|'tool4'`), `monitoring-export`.
- Workflow refresh: each page loads its own copy of the tool data, so the hooks that change it (`useScreening`, `useAssessment`, `useSemp`, `useMonitoring`) call `notifyWorkflowChanged(projectId)` (`utils/workflowEvents.js`) after every successful save/submit/approve/reject. `useWorkflow` (project sidebar + overview, loads all five tools itself) refetches **silently** on that event — never set its `isLoading` on a refresh, `ProjectLayout` replaces the whole page with a spinner while it is true — and `useProjects` refetches the list. A new mutation in a tool hook must call it too.
- `src/data/` is deprecated (re-exports from `utils/`); don't use it in new code.
- Production build strips `console.log/info/debug` (terser). ESLint warns on `console` except `warn`/`error`.

### Styling rules (from `frontend/docs/STYLE_GUIDE.md` — mandatory)

- Use design tokens only: `bg-background`/`dark:bg-background-dark`, `bg-surface`/`dark:bg-surface-dark`, `text-text-main`/`dark:text-white`, `text-text-secondary`/`dark:text-gray-400`, `border-border-default`/`dark:border-border-dark`, `text-primary`. Tokens are defined in `src/index.css`.
- Forbidden: `dark:bg-gray-800/900/700`, `border-gray-200`, `dark:border-gray-700`, `bg-gray-100`, arbitrary hex like `bg-[#1a1a1a]` / `text-[#888]`.
- Merge classes with `cn()` from `@/utils/cn`. Reuse `@/components/ui` (Button, Card with `Card.Header/Body/Footer`, Input, Modal, Toast, …) instead of new primitives.
- Icons: Material Symbols only (`<span className="material-symbols-outlined">name</span>`).
- Every UI change must work in both light and dark mode.
- Prettier: no semicolons, single quotes, 2 spaces, width 100, trailing commas es5, LF.

## Known gaps (as of initial review)

- **No file uploads**: the old attachments module and the Project Files page were removed in phase 1 (D26); the new file module comes in phase 7 (D47).
- Annex page is static data (`utils/annexTypes.js`).
- The frontend still computes workflow state and dashboard stats itself (`workflowDerivation.js`, N+1 requests in `useProjects`) and saves SEMP/monitoring row by row; it switches to the phase 4 endpoints in phase 5.
- No user update/delete endpoints (only `GET /users` and register).

## Documentation

Outdated (D44: deleted and rewritten in phase 12). Useful only as background; when they disagree with the code, the code wins. Don't spend time updating them:
- `backend/docs/`: `ARCHITECTURE`, `API_REFERENCE` (full endpoint list), `DATA_MODELS`, `AUTHENTICATION` (route → role map), `MIDDLEWARES`, `SERVICES_AND_VALIDATORS`, `CONFIGURATION_AND_DEPLOYMENT`.
- `frontend/docs/`: `ARCHITECTURE`, `ROUTING_AND_PAGES`, `STATE_AND_CONTEXTS`, `SERVICES_AND_API`, `COMPONENTS`, `HOOKS_AND_UTILS`, `FEATURES` (per-tool workflow behavior), `STYLE_GUIDE` (Arabic).

## Git

Remote `origin` = github.com/Doread-Dev/Environmental-and-Social-Assessment. Branches: `main` (default) and `Development`; changes flow via PRs between them.
