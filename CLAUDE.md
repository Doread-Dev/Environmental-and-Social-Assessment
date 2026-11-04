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
- `SEED_EMAIL=... SEED_PASSWORD=... [DEMO_PASSWORD=...] node scripts/seed-demo-project.js` — through the real API (needs an **admin** login; use the `DEV_ADMIN_*` values from `backend/.env`): creates or resets one demo user per role, `demo.<role>@example.com` (admin endpoints, then signs in as each to swap the temporary password for `DEMO_PASSWORD`, default `SEED_PASSWORD`), then (re)creates `[DEMO] Al-Salam Water Network Rehabilitation`, a project that has passed all 5 tools, using the submit/approve endpoints. It first deletes every previous demo project copy (by title, archived ones too) straight in MongoDB, so only one stays; refuses to run when `NODE_ENV=production`. Never prints passwords.
- `node scripts/create-admin.js` — creates an admin (the only way to create the first user). Asks for name/email/password, or reads `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Never prints the password; fails if the email exists. No forced change at first login (the operator chose the password).
- `node scripts/reset-password.js [--activate]` — break-glass reset of any account's password, straight in MongoDB (asks, or `RESET_EMAIL` / `RESET_PASSWORD`). `--activate` also reactivates a deactivated account. Clears a pending forced password change.
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
- `backend/.env` (gitignored): `MONGODB_URI`, `JWT_SECRET` (server exits if < 32 chars), `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN` (default 12h), `FRONTEND_URL` (CORS origin, default http://localhost:5173), `TRUST_PROXY` (default off; `true` = one proxy hop, or a hop count / IP list — set only behind IIS/nginx), `UPLOADS_DIR` (project files, default `backend/uploads`, gitignored — **backups must include this folder**, D38/phase 11), `MAX_UPLOAD_MB` (default 10).
- `frontend/.env` (gitignored): `VITE_API_URL` (must include `/api/v1`), `VITE_API_TIMEOUT`. In dev `api.js` falls back to `http://localhost:3000/api/v1`; in prod there is no fallback.
- Users: the lookup seed creates none (the demo seed creates `demo.<role>@example.com`). There is no open registration: create the first admin with `scripts/create-admin.js`; then an `admin` creates users in Settings → Users (any role, admins included). Local dev logins are stored as comments in `backend/.env`: an admin (`DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`) and a specialist (`DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`).
- Joi `email()` validates TLDs, so `@*.local` / `@*.test` addresses are rejected — use `@example.com` for test users.

## Backend architecture

Request pipeline (`src/app.js`): `trust proxy` from `TRUST_PROXY` → helmet → cors → body parsers (10mb) → morgan (off when `NODE_ENV=test`) → `GET /health` → `app.use('/api/v1', apiLimiter, routes)` → 404 → `errorHandler` (must stay last). Inside `routes/index.js`: `/auth` first, then `router.use(auth)` and `router.use(requirePasswordChanged)` — **every other `/api/v1` route requires a valid token of an active user with no pending forced password change**, including all GETs and unknown paths (401 / 403 before 404). `server.js` validates env and connects to Mongo **before** `listen`.

Layering, one file per domain in each folder:
`routes/<domain>.routes.js` → `controllers/<domain>.controller.js` → `services/<domain>.service.js` → `models/<entity>.model.js`, with `validators/<domain>.validator.js` (Joi).

Conventions to follow when adding endpoints:
- Mount new routers in `src/routes/index.js`; never register API routes on `app` directly.
- Route order: `requireRole(...ROLES_LIST), validate(schema), controller.fn` — `auth` is applied once in `routes/index.js`, don't repeat it. Role lists come from `src/config/roles.js` (`EDITOR_ROLES`, `SPECIALIST_ROLES`, `ADMIN_ROLES`). A GET with no `requireRole` is open to every signed-in role, viewer included.
- `validate(schema)` checks **`req.body`** (`validate(schema, "query")` checks `req.query`; `abortEarly:false, stripUnknown:true`) and **replaces it with the stripped value** (defaults applied, types converted): a field not in the schema never reaches the controller. Keep server-owned fields (`status`, `officer`, `approved_by`, `reject_by`, `reject_reason`, totals, `is_active`) out of the schemas.
- Updates of a screening or assessment call `assertSameProject` (`src/utils/assertSameProject.js`): changing `project` → 400. Tools 3–5 are written only through the bulk saves, which take the project from the URL (a `project` in a row is stripped).
- Auth errors: bad/expired/forged token, unknown or inactive user → 401; wrong role → 403 `Forbidden`; pending forced password change → 403 with `code: "PASSWORD_CHANGE_REQUIRED"`; unexpected verify error → 500 `Server Error` (no stack, no details). An `ApiError` with a string `code` property adds `code` to the error response.
- Controllers are wrapped in `asyncHandler` and respond `{ success: true, data }`; errors are thrown as `new ApiError(status, msg)` (`src/utils/ApiError.js`) and become `{ success: false, error }`. Mongoose CastError → 404, duplicate key → 409.
- Models use snake_case fields, `timestamps: true`, `versionKey: false`. References use `ObjectId` + `ref`.

Roles (`src/config/roles.js`): `admin`, `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.
- `EDITOR_ROLES` (all but viewer): create/update and submit. `SPECIALIST_ROLES` (`admin` + `environmental_specialist`): approve/reject screening & assessment, delete/archive/restore project. `ADMIN_ROLES` (`admin`): manage users (D21), purge archived projects, read the audit log. Viewers read only. There is no per-resource ownership check.
- Inactive users (`is_active: false`): login → 403 `Account is deactivated` (only after a correct password); existing tokens → 401 on the next request.
- Users (D21–D23, phase 6): `GET /users` — admin: every account incl. inactive (job_title populated); other roles: active users only with `_id, name, job_title, is_active` (pickers, D4). Admin only: `POST /users` (`name, email, role, job_title`; no password — the server generates a 12-char temporary password, returned once as `temporary_password`, and sets `must_change_password`; duplicate email → 409), `PUT /users/:id` (`name, role, job_title`; email is fixed; `job_title: null` clears; unknown job title → 400), `PATCH /users/:id/deactivate|reactivate`, `POST /users/:id/reset-password` (new temporary password, `must_change_password`). The last **active** admin can be neither deactivated nor given another role → 409. `POST /auth/register` is gone.
- Own password: `PUT /auth/password` `{ current_password, new_password }` (any role) → same shape as `/auth/me`, clears `must_change_password`. Wrong current password → 400 (not 401), same password → 400. Policy: `PASSWORD_MIN_LENGTH` (6) in `validators/auth.validator.js` — security, so D57 does not remove it; login only requires a value. While `must_change_password` is set, only `GET /auth/me` and `PUT /auth/password` answer (logout is client-side; there is no endpoint).
- Permissions (D35, `src/config/permissions.js`, built from the same role lists): `GET /auth/me` → `{ user (job_title populated, must_change_password), permissions, password_rules: { min_length }, upload_rules: { max_bytes, extensions } }` — `create_project`, `edit`, `export` (editors; never viewer, D28a), `approve`, `delete_project`, `archive_project` (specialist/admin), `manage_users`, `purge_project`, `read_audit_log` (admin). Project-level `allowed_actions` (below) add the workflow state on top.

Rate limits: 1000 req / 7 min on `/api/v1`, keyed per user id when the token is valid, per IP otherwise; login 10 failed attempts / 15 min per IP.

Each project has at most one screening and one assessment (unique indexes; a second create → 409), one score per (assessment, question) and one monitoring record per (project, indicator). `GET /<domain>/project/:projectId` answers "not started yet" with **`200 { data: null }`** (screening, assessment) or `200 { data: [] }` (management, mitigation, monitoring) — never 404 (D34). Services populate user refs (`officer`, `approved_by`, `reject_by`, `responsible`) with `job_title`; `officer` is set on create and on submit.

Statuses for screening & assessment: `draft | submitted | approved | rejected`, changed **only** through `PATCH /<screenings|assessments>/:id/submit|approve|reject` (`src/utils/statusTransition.js`): `draft|rejected → submitted` (editors; sets `officer`), `submitted → approved|rejected` (specialist/admin; sets `approved_by` or `reject_by` + `reject_reason`; a specialist may approve their own work). Any other transition → 409. `status` in a create/PUT body is ignored. Each create and transition appends `{ status: created|submitted|approved|rejected, by, at, note? }` to `status_history` (note = reject reason), returned with `by` populated (`name`, `role`).

Impact levels everywhere: `negligible | low | medium | high | not_applicable`. Screening category codes: `A`–`F`.

### Workflow state & aggregate endpoints (D30–D32, D35)

`computeWorkflow()` in `src/services/workflow.service.js` is the one source of truth for project state; the gates below use it too. Per step (`screening`, `assessment`, `semp`, `monitoring`) a status `locked | not_started | in_progress | submitted | approved | rejected | completed` (screening/assessment `draft` → `in_progress`); plus overall `status` (`draft | in_progress | needs_action | monitoring | completed`), `current_step`, `percent_complete` (approved/completed = 1 step, in_progress/submitted/rejected = ½, of 4), `next_action` (`step`, `tool`, `route` = frontend `ROUTES` key, `label`, `description`), SEMP `management_activities` / `mitigation_plans` `{ count, described, status: not_started|in_progress|completed }`, monitoring `records`/`complete_records`/`quarters_filled` (monitoring is in progress once it has any record, a baseline alone included, and completed once one record has all four quarters). `loadWorkflowInputs(ids)` loads many projects in 5 queries — never loop per project. `allowedActions(role, project, workflow)` → e.g. `project.edit|archive|restore|delete|purge`, `screening.create|edit|submit|approve|reject`, same for `assessment`, `semp.edit`, `monitoring.edit`, `files.edit` (editors, no workflow lock), `export` (archived: only restore/delete/purge/export).
- `GET /dashboard` → `{ stats: { total_projects, by_status, high_risk (category A/B) }, latest_projects (5, newest update first) }`, archived left out.
- `GET /projects` → each project + `screening`/`assessment` summary (or null) + `workflow` + `allowed_actions`, and `pagination: { page, limit, total, pages }` next to `data`. Query: `archived`, `search` (title/location), `status`, `category`, `sort` (`createdAt` default, newest first | `updatedAt` | `title` | `start_date`), `page`, `limit` (≤ 100; **no `limit` = all**, as the current frontend expects). Invalid values → 400.
- `GET /projects/:id/workspace` → `{ project (archived_by populated), workflow, allowed_actions, screening, assessment, counts }` — works on archived projects. `GET /projects/:id` (plain project) is kept but the frontend doesn't use it.
- `GET /lookups` → `{ impact_categories, impact_questions, indicators, job_titles }` (the only lookup endpoint).
- Bulk saves (editors; the only writes of Tools 3–5, gated like the other tools): `PUT /projects/:id/management` and `/mitigation` with `{ rows }` replace the whole table — a row with `_id` updates that row (fields not sent keep their value), a row without one is created, rows left out are deleted, a row without `serial_number` gets its position. `PUT /projects/:id/monitoring` with `{ records }` upserts by `indicator` (must exist, once per payload); records not sent stay. Every row is checked first (Joi, responsible rule, ids of this project, model validation → 400 `Row n: …` / `Record n: …`) and nothing is written on error; the writes then go out as one `bulkWrite` (no transaction: the local MongoDB is standalone; phase 11 adds a single-node replica set and a transaction). Responses return the saved table/records like the `GET …/project/:projectId` endpoints.
- Project files (D47, phase 7; `ProjectFile` model, `config/files.js`, `services/projectFile.service.js`): `GET /projects/:id/files?area=annex` (all roles, oldest first, `uploaded_by` populated), `POST /projects/:id/files` (editors; multipart `file` + `area` + `category` — annex: `annex_a`…`annex_h` required), `GET /files/:fileId/download` (all roles; `Content-Disposition` with the UTF-8 name, `Cache-Control: private, no-store`), `DELETE /files/:fileId` (editors), `PATCH /files/:fileId` (`category`, `semp_record` files only). Allowed: PDF + Office (`pdf doc docx xls xlsx ppt pptx odt ods odp`, owner) — checked by extension **and** first bytes; the stored MIME type comes from the extension, never the client. One file per request, parsed in memory by `multer` 2 (`middlewares/upload.js`) → too big 413, wrong type/content, empty, no file, bad category → 400; nothing is written on error. Stored at `<UPLOADS_DIR>/<project id>/<uuid>.<ext>`; the client name is display only (last path segment, no control chars, ≤ 200). Archived project → 409 on upload/delete; reads stay. Area `semp_record` (SEMP Plan §7, 11 categories or `null`) exists in the model but answers **404** everywhere until v3 (`OPEN_AREAS` in `config/files.js`, a code constant — D48). `removeProjectData` (delete, purge, demo reset) removes the project's file rows and folder last; disk failures are logged, never thrown. The purge audit entry records `details.files`.
- Removed in phase 5 (unused by the frontend, `tests/removedEndpoints.test.js`): `GET /screenings`, `/assessments`, `/monitoring` (lists), `GET /lookups/<one>`, row writes `POST/PUT/DELETE /management|mitigation[/:id]`, `POST/PUT /monitoring[/:id]`, `PATCH /monitoring/:id/quarter/:q`, `POST /assessments/:id/methods|consultations` (the PUT replaces the list), `PATCH /assessments/:id/calculate` (totals are recalculated on every score change). GET-by-id reads stay.

### Workflow rules (`src/services/workflow.service.js`)

Every create/update/delete of project data calls a gate; reads never do. **Every broken workflow rule is 409** (gate, lock, archived, duplicate):
- **Order** (any screening category A–F, E included): assessment and its children need the screening approved (`requireScreeningApproved`); management activities and mitigation plan need the assessment approved (`requireAssessmentApproved`); monitoring needs Tools 3 and 4 complete — at least one row each, every row with its description (`requireSempComplete`).
- **Archive**: `PATCH /projects/:id/archive|restore` (specialist/admin) sets `archived` + `archived_by`/`archived_at`. Archived projects are hidden from `GET /projects` (`?archived=true` lists only them), still readable by id, and every write on them (project PUT, all tools, transitions) → 409 (`assertProjectWritable`, called by all gates). `DELETE /projects/:id` → 409 when the screening or assessment is approved (archive instead); otherwise it deletes the project with all its data. `DELETE /projects/:id/purge` (**admin only**, D60) permanently deletes an **archived** project, approved work included (not archived → 409), after writing an `AuditLog` entry (`action: project.purge`, `by`, `target_title`, state snapshot in `details`); `GET /audit-logs` (admin only) lists entries newest first.
- **Locking**: screening/assessment PUT and assessment methods/consultations/scores/calculate only while `draft` or `rejected` (`assertEditable` in `utils/statusTransition.js`); `submitted`/`approved` → 409. No reopen. SEMP, monitoring and project metadata stay editable (unless archived).
- **Assessment create** prefills empty `project_activity` (← project `project_component`, 400 if neither) and `potential_negative_impact`/`potential_positive_impact` (← screening), once; and creates one `negligible` score per `ImpactQuestion`. `POST /assessments/:id/scores` upserts only the questions sent (others keep their level; duplicate or unknown question → 400) and returns all scores. `total_project_score` counts and `total_project_impact` (highest level: high > medium > low > negligible > not_applicable) are recalculated on every score change; `PATCH .../calculate` is kept but optional. Submit → 400 unless every question has a score.
- **Responsible** (Tools 3, 4, 5): `responsible` (user id) **or** `responsible_text` (external party), never both (400). Setting one clears the other (`utils/responsible.js`).
- No minimum-length rules anywhere (D57); monitoring quarter values and `total` are free text, never parsed.

## Frontend architecture

- Entry: `index.html` (inline script applies saved theme from `localStorage['esms-theme']`) → `src/main.jsx` providers: `QueryClientProvider` (`services/queryClient.js`) → `AuthProvider` → `ThemeProvider` → `ToastProvider` → `App` (`ErrorBoundary` + `OfflineBanner` + `RouterProvider`).
- Path alias `@` → `src/`. Barrels (`index.js`) in components/hooks/services/contexts/utils — import from them.
- **All HTTP goes through `src/services/api.js`** (axios instance: attaches `Bearer` token from `localStorage['token']`; on 401 clears auth and hard-redirects to `/login`; on 403 `PASSWORD_CHANGE_REQUIRED` hard-redirects to `/change-password`). `extractErrorMessage` turns a wrong-role 403 (`Forbidden`) into a friendly message and keeps other 403 reasons (e.g. `Account is deactivated`). Use `extractErrorMessage(err)` for user-facing errors. Never call `fetch`/raw axios to the API.
- Layering: `services/<domain>Service.js` (thin API calls) → `hooks/use<Domain>.js` (TanStack Query: `useQuery` for reads, `useMutation` for writes; returns loading/error/data + actions) → `pages/` and feature `components/<domain>/`. No global store; the query cache is the shared state, plus Auth/Theme contexts. Every query key comes from `services/queryKeys.js` (`['me']`, `['lookups']`, `['users']`, `['dashboard']`, `['projects']`, `['workspace', id]`, `['screening'|'assessment'|'management'|'mitigation'|'monitoring', id]`). Defaults: `staleTime` 30 s, no refetch on focus, no retry on 4xx.
- Reads: `useDashboard` (`GET /dashboard`), `useProjects` (`GET /projects`, + `deleteProject`), `useWorkspace(projectId)` (`GET /projects/:id/workspace`: project, `workflow`, `allowed_actions` as `can(action)`, summaries, counts), `useLookups` / `useUsers` (`GET /lookups`, `GET /users`, loaded once, only where used). Guards, `ProjectLayout`, sidebars and pages share the workspace query; `ProjectLayout` passes `{ project, workflow, counts, can }` as outlet context (`useProjectContext()`). The dashboard loads in 2 requests (`/auth/me`, `/dashboard`), a project overview in 2 (`/auth/me`, workspace) — `src/routes/requestCounts.test.jsx` asserts it.
- Writes: tool hooks write through `useProjectSave(projectId)` — one mutation, its result put into the tool's query, then `invalidateProjectState()` (workspace refetched before the save resolves, project list and dashboard marked stale). A new write in a tool hook must go through it. Tools 3/4 (`useManagementActivities`, `useMitigationPlans` in `hooks/useSemp.js`) and Monitoring (`useMonitoring`) keep edits local and save with ONE bulk request per Save (D32); `utils/responsible.js` always sends `responsible` + `responsible_text`.
- Routing: `src/routes/index.jsx` (all pages lazy-loaded) + `routes.config.js` (`ROUTES` constants, `getProjectRoute(id, ROUTES.X)`, sidebar nav config). Use `ROUTES` constants rather than hardcoded paths.
- Workflow state comes only from the backend (D30): read `workflow.steps.<step>.status`, `workflow.status`, `percent_complete`, `next_action` (helpers in `utils/workflowSteps.js`). No workflow rule or role list lives in the frontend. Gates are enforced by the backend (409, shown through `extractErrorMessage`); `WorkflowRouteGuard step="assessment|semp|monitoring"` redirects a `locked` step to the open step before it. `SettingsRouteGuard` = `canAccessSettings` (`manage_users` or `delete_project`); Settings shows Users only with `manage_users` (admin) and Projects only with `delete_project`.
- Permissions (D35): `useAuth()` loads `GET /auth/me` once per session (`isLoading` until then) — `can(permission)` plus `canCreateProject`, `canEdit`, `canExport`, `canApprove`, `canManageUsers`, `canDeleteProject`, `canAccessSettings`, plus `mustChangePassword`, `passwordRules` and `changePassword()`; logout clears the query cache. `ProtectedRoute` sends a user with `must_change_password` to `ROUTES.CHANGE_PASSWORD` (`pages/auth/ChangePasswordPage`, forced change, D22); `ROUTES.PROFILE` (`pages/profile/ProfilePage`) holds the own-password form (`components/auth/ChangePasswordForm`, D23), reachable from the user menu. Settings → Users (`components/settings/UsersManagementSection` + `UserFormModal` / `TemporaryPasswordModal`, writes via `hooks/useUserManagement`) is the admin user lifecycle; Responsible pickers get `useUsers().activeUsers`, and a row whose responsible user was deactivated still shows the name as `(inactive)`. On a project, use the workspace's allowed actions instead (`can('screening.approve')`, `can('semp.edit')`, `can('export')` …): they also cover the workflow state and archived projects. Export buttons only with `export` (viewers never, D28a). Screening/assessment are submitted with `screeningService.submit` / `assessmentService.submit` (save first, then the transition endpoint); never send `status` in a create/PUT.
- Annex (D47): `pages/project-workspace/annex/AnnexOverviewPage` + `components/annex/` (`AnnexCard`, `DeleteFileModal`), data via `hooks/useProjectFiles` (`services/fileService.js`, key `queryKeys.files(projectId, area)`). Files don't change workflow state, so its writes refresh only that list, not through `useProjectSave`. Uploads go one file at a time, then one refresh; files are pre-checked with `useAuth().uploadRules` (`utils/fileRules.js`). Downloads fetch a blob with the token. Upload/delete only with `can('files.edit')`.
- Excel export is fully client-side (`utils/excelExport/`, ExcelJS lazy-loaded into the `vendor-excel` chunk). Layout headers trigger exports via window events: `screening-export`, `assessment-export`, `semp-export` (`detail.toolType: 'tool3'|'tool4'`), `monitoring-export`.
- Production build strips `console.log/info/debug` (terser). ESLint warns on `console` except `warn`/`error`.

### Styling rules (from `frontend/docs/STYLE_GUIDE.md` — mandatory)

- Use design tokens only: `bg-background`/`dark:bg-background-dark`, `bg-surface`/`dark:bg-surface-dark`, `text-text-main`/`dark:text-white`, `text-text-secondary`/`dark:text-gray-400`, `border-border-default`/`dark:border-border-dark`, `text-primary`. Tokens are defined in `src/index.css`.
- Forbidden: `dark:bg-gray-800/900/700`, `border-gray-200`, `dark:border-gray-700`, `bg-gray-100`, arbitrary hex like `bg-[#1a1a1a]` / `text-[#888]`.
- Merge classes with `cn()` from `@/utils/cn`. Reuse `@/components/ui` (Button, Card with `Card.Header/Body/Footer`, Input, Modal, Toast, …) instead of new primitives.
- Icons: Material Symbols only (`<span className="material-symbols-outlined">name</span>`).
- Every UI change must work in both light and dark mode.
- Prettier: no semicolons, single quotes, 2 spaces, width 100, trailing commas es5, LF.

## Known gaps (as of initial review)

- Files: Annex A–H only; SEMP Plan §7 records come with the SEMP Plan in v3 (D48). No antivirus scan of uploads.
- Users are never deleted, only deactivated (D4). Changing your own password does not end your other sessions (tokens stay valid until they expire).

## Documentation

Outdated (D44: deleted and rewritten in phase 12). Useful only as background; when they disagree with the code, the code wins. Don't spend time updating them:
- `backend/docs/`: `ARCHITECTURE`, `API_REFERENCE` (full endpoint list), `DATA_MODELS`, `AUTHENTICATION` (route → role map), `MIDDLEWARES`, `SERVICES_AND_VALIDATORS`, `CONFIGURATION_AND_DEPLOYMENT`.
- `frontend/docs/`: `ARCHITECTURE`, `ROUTING_AND_PAGES`, `STATE_AND_CONTEXTS`, `SERVICES_AND_API`, `COMPONENTS`, `HOOKS_AND_UTILS`, `FEATURES` (per-tool workflow behavior), `STYLE_GUIDE` (Arabic).

## Git

Remote `origin` = github.com/Doread-Dev/Environmental-and-Social-Assessment. Branches: `main` (default) and `Development`; changes flow via PRs between them.
