# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

ESMS (Environmental and Social Management System) — a workflow app for environmental & social due diligence of development projects (AKF Syria branding in exports). Two independent apps in one repo, each with its own `package.json`; there is no root package or workspace tooling:

- `backend/` — Node.js + Express 4 + Mongoose 8 (CommonJS), JWT auth, Joi validation. REST API under `/api/v1`.
- `frontend/` — React 19 + Vite 7 + React Router 7 + Tailwind CSS 4 (ES modules, plain JSX — no TypeScript). Deployed to Vercel.

The domain workflow is strictly ordered, and most code is organized around it:
**Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management Activities (Tool 3) + Mitigation Plan (Tool 4) → Monitoring (Tool 5)**, plus Annex/Files and Settings.

## Commands

Backend (`cd backend`):
- `npm run dev` — nodemon on `src/server.js` (port 3000). Health: `GET http://localhost:3000/health`.
- `npm start` — production start.
- `npm run seed` — **wipes and re-inserts** the 4 lookup collections (impact categories, impact questions, indicators, job titles). Does not create users.
- `node scripts/clean-test-data.js` — deletes ALL domain data (projects, screenings, assessments, SEMP, monitoring, attachments). Destructive; ask before running.

Frontend (`cd frontend`):
- `npm run dev` — Vite on http://localhost:5173.
- `npm run build` / `npm run preview`
- `npm run lint` / `npm run lint:fix` — ESLint 9 flat config (prettier as a lint rule).
- `npm run format` / `npm run format:check` — Prettier on `src/`.

There are **no automated tests** in either app, and the backend has no linter. Verify changes by running the app (and `npm run lint` + `npm run build` for frontend).

Frontend lint baseline (pre-existing, as of 2026-11-03): 3 errors (`ErrorBoundary.jsx` empty catch blocks, unreachable code in `useFiles.js`), ~460 warnings, 39 files not Prettier-formatted. Don't mass-reformat unrelated files; keep your diffs from adding new problems.

`.claude/launch.json` defines `backend` (port 3000) and `frontend` (port 5173) dev servers for the preview pane.

Line endings: the repo is LF (Prettier `endOfLine: lf`). This clone sets `core.autocrlf=false` locally because the machine-wide Git default converts to CRLF, which makes ESLint report ~24k `Delete ␍` warnings. Keep new files LF.

## Local environment

- MongoDB runs locally as the Windows service `MongoDB` (8.3). Start with `Start-Service MongoDB` if stopped. DB name: `esms`.
- `backend/.env` (gitignored): `MONGODB_URI`, `JWT_SECRET` (server exits if < 32 chars), `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN` (default 12h), `FRONTEND_URL` (CORS origin, default http://localhost:5173).
- `frontend/.env` (gitignored): `VITE_API_URL` (must include `/api/v1`), `VITE_API_TIMEOUT`. In dev `api.js` falls back to `http://localhost:3000/api/v1`; in prod there is no fallback.
- Users: the seed creates none. The **first** `POST /api/v1/auth/register` succeeds without auth; after that only an `environmental_specialist` can register users (Settings page → Users). A local dev specialist login is stored as comments in `backend/.env` (`DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`).
- Joi `email()` validates TLDs, so `@*.local` / `@*.test` addresses are rejected — use `@example.com` for test users.
- `package-lock.json` is gitignored, so installs are not pinned — dependency versions can drift between machines.

## Backend architecture

Request pipeline (`src/app.js`): helmet → cors → body parsers (10mb) → morgan → `GET /health` → `app.use('/api/v1', apiLimiter, routes)` → 404 → `errorHandler` (must stay last). `server.js` validates env and connects to Mongo **before** `listen`.

Layering, one file per domain in each folder:
`routes/<domain>.routes.js` → `controllers/<domain>.controller.js` → `services/<domain>.service.js` → `models/<entity>.model.js`, with `validators/<domain>.validator.js` (Joi).

Conventions to follow when adding endpoints:
- Mount new routers in `src/routes/index.js`; never register API routes on `app` directly.
- Protected route order: `auth, requireRole(...roles), validate(schema), controller.fn`.
- `validate()` checks **`req.body` only** (`abortEarly:false, stripUnknown:true`) and does **not** write the stripped value back — controllers receive the raw body.
- Controllers are wrapped in `asyncHandler` and respond `{ success: true, data }`; errors are thrown as `new ApiError(status, msg)` (`src/utils/ApiError.js`) and become `{ success: false, error }`. Mongoose CastError → 404, duplicate key → 400.
- Models use snake_case fields, `timestamps: true`, `versionKey: false`. References use `ObjectId` + `ref`.

Roles (`user.model.js`): `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.
- Writes (create/update) → the first four roles. Approve/reject screening & assessment, delete project, register users → `environmental_specialist` only. Report export → specialist + program manager.
- Most `GET` endpoints are **unauthenticated** by design (projects, screenings, assessments, monitoring, SEMP, lookups, attachments/:id). There is no per-resource ownership check.

Rate limits: 1000 req / 7 min per IP on `/api/v1`; login 10 failed attempts / 15 min.

Each project has at most one screening and one assessment. `GET /<domain>/project/:projectId` returns **404 when none exists yet** — the frontend treats that as "not started" (axios `silent404` + a `console.error` filter in `api.js`), so don't change it to `200 null` without updating the hooks. Services populate user refs (`officer`, `approved_by`, `reject_by`, `responsible`) with `job_title`; `officer` is set on create/submit. `PATCH /assessments/:id/calculate` derives `total_project_impact` as the highest scored level (high > medium > low > negligible > not_applicable).

Statuses for screening & assessment: `draft | submitted | approved | rejected`. Impact levels everywhere: `negligible | low | medium | high | not_applicable`. Screening category codes: `A`–`F`.

## Frontend architecture

- Entry: `index.html` (inline script applies saved theme from `localStorage['esms-theme']`) → `src/main.jsx` providers: `AuthProvider` → `LookupProvider` → `ThemeProvider` → `ToastProvider` → `App` (`ErrorBoundary` + `OfflineBanner` + `RouterProvider`).
- Path alias `@` → `src/`. Barrels (`index.js`) in components/hooks/services/contexts/utils — import from them.
- **All HTTP goes through `src/services/api.js`** (axios instance: attaches `Bearer` token from `localStorage['token']`; on 401 clears auth and hard-redirects to `/login`). Use `extractErrorMessage(err)` for user-facing errors. Never call `fetch`/raw axios to the API.
- Layering: `services/<domain>Service.js` (thin API calls) → `hooks/use<Domain>.js` (loading/error/data + actions) → `pages/` and feature `components/<domain>/`. No global store; only Auth/Lookup/Theme contexts. Lookups load once per session via `useLookups()` — don't refetch reference data in pages.
- Routing: `src/routes/index.jsx` (all pages lazy-loaded) + `routes.config.js` (`ROUTES` constants, `getProjectRoute(id, ROUTES.X)`, sidebar nav config). Use `ROUTES` constants rather than hardcoded paths.
- Workflow gates are enforced client-side by route guards: `AssessmentRouteGuard` (screening approved) → `SempRouteGuard` (+ assessment approved) → `MonitoringRouteGuard` (+ SEMP completed). `SettingsRouteGuard` = specialist only. Project status/next step derivation lives in `utils/workflowDerivation.js` + `hooks/useWorkflow.js`.
- Permission helpers come from `useAuth()`: `canEdit`, `canApprove`, `canManageUsers`, `canDeleteProject`, `canUpdateMonitoring`. Keep them aligned with backend `requireRole` lists.
- Excel export is fully client-side (`utils/excelExport/`, ExcelJS lazy-loaded into the `vendor-excel` chunk). Layout headers trigger exports via window events: `screening-export`, `assessment-export`, `semp-export` (`detail.toolType: 'tool3'|'tool4'`), `monitoring-export`; `monitoring-data-updated` tells `useWorkflow` to refetch.
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

- **Project Files is mocked**: `hooks/useFiles.js` simulates upload/list/delete (TODO comment). The backend only has `POST /attachments`, `POST /attachments/upload` (multer → `backend/uploads/`, no size/type limits) and `GET /attachments/:id` — there is no list-by-entity, delete, or download/static-serve endpoint.
- Annex page is static data (`utils/annexTypes.js`).
- Backend endpoints not used by the frontend: `/reports/dashboard`, `/reports/export`, `/semp/objectives|targets|actions`, `/attachments/*`. The dashboard computes stats client-side.
- No user update/delete endpoints (only `GET /users` and register).

## Documentation

Detailed, mostly accurate docs exist — read the relevant one before working in an area, and update it when behavior changes:
- `backend/docs/`: `ARCHITECTURE`, `API_REFERENCE` (full endpoint list), `DATA_MODELS`, `AUTHENTICATION` (route → role map), `MIDDLEWARES`, `SERVICES_AND_VALIDATORS`, `CONFIGURATION_AND_DEPLOYMENT`.
- `frontend/docs/`: `ARCHITECTURE`, `ROUTING_AND_PAGES`, `STATE_AND_CONTEXTS`, `SERVICES_AND_API`, `COMPONENTS`, `HOOKS_AND_UTILS`, `FEATURES` (per-tool workflow behavior), `STYLE_GUIDE` (Arabic).

## Git

Remote `origin` = github.com/Doread-Dev/Environmental-and-Social-Assessment. Branches: `main` (default) and `Development`; changes flow via PRs between them.
