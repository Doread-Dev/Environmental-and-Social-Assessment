# Phase 12 — E2E tests & documentation

**Goal:** protect the golden flows end to end and replace the outdated docs with technical docs for developers and IT. The user guide (every role) is phase 14 (D76 1).

**Decisions:** D39 (Playwright), D44, D76.

## E2E (Playwright)
- Runs against the production-style single process (phase 11: `frontend/dist` built, `npm start` with `NODE_ENV=production` serving it) on a fresh database whose name ends in `_test` (its own, e.g. `esms_e2e_test`, so it never clashes with the backend tests), seeded with the lookups and users, on a port that is not the owner's dev ports (3000, 5173).
- **Chromium only** (Chrome and Edge, D76 2).
- Each flow creates its own projects and users (never the demo project); a project for each state the flow needs.
- Golden flows:
  1. Admin creates users; forced password change on first login.
  2. Editor creates project → screening → submit; specialist approves.
  3. Assessment with defaults (all Negligible) → change a few → submit → approve.
  4. Tools 3 & 4 bulk save → Monitoring unlocks → quarter data saved.
  5. Project documents upload / PDF preview / download / delete; library document uploaded by a specialist, linked to Tool 4, opened from Tool 4's Guidance panel without leaving the page.
  5a. Critical-actions log: a file delete, an archive and a user deactivation appear in Settings → Activity log (admin) with who and a snapshot; non-admins cannot open it.
  6. Viewer: sees everything, no edit/export controls; direct API writes 403.
  7. Archive / restore; delete blocked when something is approved.
  8. Locked v3 buttons visible and inert.
  9. Unhappy paths agreed in phase 10a (D61, D73), at least:
     - leaving an edited page (sidebar link, browser Back, sign out) asks Save / Discard / Stay; Save saves and leaves, Discard leaves, Stay keeps the input; refresh asks only while there are changes;
     - two tabs on one Tool 3 table (and one screening): the second save shows "Someone else changed this", nothing is overwritten (check the rows through the API), Reload shows the other tab's rows, the next save works;
     - an expired session mid-edit (token replaced by an expired one): the sign-in dialog opens over the page, the input is kept, signing in again and pressing Save stores it; "Sign in as someone else" ends on the login page;
     - an unknown project id in a Tools 3/4 URL shows "Project not found" and sends one workspace request (no loop);
     - a double click on Save sends one request.
  10. **Excel export (D76 2):** export one tool and the project workbook; open the downloaded files (ExcelJS in the test) and check the sheets, the status and date in the file name and key cells.
  11. **Arabic text (D76 2):** Arabic in the project title and location and in free text of Tools 1–4; the API stores it exactly, the UI shows it, and the export has those cells with `readingOrder: 'rtl'`.
- One command to run; documented in `CLAUDE.md`.
- Add the E2E run as a job in `.github/workflows/ci.yml` (MongoDB 7.0 replica set, the production shape; the Playwright report uploaded on failure). No flaky tests: web-first assertions, no fixed sleeps.

## Test gaps (D76 3 — a rule, not a pause)
- Run `npm run test:coverage` in both apps. **Every module with logic gets a unit or integration test:** hooks, utils, services, controllers, middlewares, and pages with forms or actions. Plain display components with no logic may stay untested.
- The phase does not stop to ask: the modules left untested are listed under "Found during phase" (and in the PR body), each with a one-line reason; the owner reviews the list there.
- Raise the coverage floors at the end.

## Documentation (D44, D76)
- Delete `backend/docs/` and `frontend/docs/`.
- Write new **technical** docs from the code (developers and IT), in English: architecture, API reference per router, data models, roles & permissions matrix (from `config/permissions.js`), workflow rules, developer guide (setup, tests, E2E, conventions, CI). Deployment and backup runbooks: link the existing `deploy/` guides, don't duplicate them.
- **Style section (D76 4):** `frontend/docs/STYLE_GUIDE.md` translated to English plus the style rules in `CLAUDE.md`, as a short section marked "replaced by the design system of phase 13". No design-system doc in this phase.
- The **user guide** (every role, admin users & passwords included) is **not** in this phase: it is phase 14, after phase 13 changes the screens (D76 1).
- Rewrite `CLAUDE.md` to match; keep it short and point to the docs; no rule dropped silently (moved rules are linked).
- README at the root.

## Tests
- One Playwright spec per golden flow above (1–11), named after the flow, each creating its own data on a fresh `_test` database with seeded users; the specs run in the CI job.
- Each E2E flow checks the visible result in the UI and the stored state through the API (e.g. status, `status_history`, audit entry).
- Viewer flow: every write endpoint the UI uses answers 403 for a viewer token.
- Excel export flow: the downloaded tool file and project workbook open with ExcelJS; sheet names, the status and date in the file name and key cells are checked.
- Arabic flow: the API returns the Arabic values unchanged, the UI shows them, the exported cells carry `readingOrder: 'rtl'`.
- Test gaps: every module with logic has a unit or integration test, or is listed as untested with a reason; coverage thresholds raised after.
- Docs: a test (or CI step) fails if `backend/docs/` or `frontend/docs/` come back, and checks that every route in the route table appears in the API reference.

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [x] E2E suite green and running in CI (job **E2E**); docs reviewed by the owner — *open: owner review*.
- [x] Untested-modules list in the PR body and below, for the owner's review; coverage floors raised.
- [x] `plan/README.md` progress table complete.

## Result

Branch `claude/phase-12-e2e-docs-a8d581`. Owner's concept answers written as **D76**; new
[phase 14](14-user-guide.md) (user guide); phase 13 Goal carries the design-system aim (D76 4).

**E2E (`e2e/`).** Own package (Playwright **1.65.0**, ExcelJS 4.4.0, exact versions, lockfile),
Chromium only (`channel: 'chromium'`, new headless; no separate headless shell), one worker, no
retries, web-first assertions, no fixed sleeps. `npm test` = build the frontend into
`e2e/.build/dist` with an empty `VITE_API_URL` (same guard as the release builder) + run every flow.
`scripts/start-server.mjs` is the Playwright web server: refuses a database not ending in `_test`,
drops `esms_e2e_test`, seeds the lookups, creates the bootstrap admin, then runs
`backend/src/server.js` with `NODE_ENV=production` on **port 3100**, every setting set explicitly (no
developer `.env` leaks in). Each flow creates its own users (through the admin API, temporary
password → own password, like a real user) and projects (`projectAt(step)`), never the demo project.
19 tests, ~3.5 min locally. CI job **E2E**: MongoDB 7.0 as replica set `rs0`, backend installed with
`--omit=dev`, e2e lint + Prettier, `playwright install --with-deps --no-shell chromium`, `npm test`;
Playwright report + traces uploaded on failure.

**Test gaps (D76 3).** New unit/integration tests for every module with logic that had none (list
under Tests). Coverage: backend lines 96.5 → **97.4 %** (949 tests), frontend lines 78 → **87.2 %**
(494 tests). Floors raised: backend 95/90/94/96 → **96/91/95/97**, frontend 77/72/71/78 →
**85/78/80/87** (statements/branches/functions/lines).

**Docs (D44, D76).** `backend/docs/` and `frontend/docs/` deleted. New `docs/`: `README.md` (index),
`architecture.md`, `api-reference.md` (per router, all 55 routes), `data-models.md`,
`roles-and-permissions.md` (matrices checked against the code), `workflow-rules.md`,
`developer-guide.md`, `style-guide.md` (old STYLE_GUIDE translated + the CLAUDE.md style rules,
marked "replaced by the design system of phase 13"). Deployment and backups link `deploy/` (three
backup details that were only in CLAUDE.md moved into `deploy/README.md`). New root `README.md`;
`backend/README.md` and `frontend/README.md` reduced to pointers. `CLAUDE.md` rewritten (200 → ~140
lines): every rule kept or linked to the doc it moved to.

### Tests, item by item
- **One spec per golden flow (1–11), CI job:** `e2e/tests/01-admin-creates-users.spec.js`,
  `02-screening-submit-approve.spec.js`, `03-assessment-defaults-submit-approve.spec.js`,
  `04-semp-bulk-save-monitoring.spec.js`, `05-documents-and-library.spec.js`,
  `05a-critical-actions-log.spec.js`, `06-viewer-read-only.spec.js`,
  `07-archive-restore-delete.spec.js`, `08-v3-locked-buttons.spec.js`,
  `09-unhappy-paths.spec.js` (5 tests: leave guard incl. Back, sign-out and refresh; two tabs on
  Tool 3 and screening; expired session; unknown project id; double click), `10-excel-export.spec.js`,
  `11-arabic-text.spec.js`; `.github/workflows/ci.yml` job `e2e`.
- **UI + stored state through the API:** every spec (status, `status_history`, audit entries, rows,
  files, versions).
- **Viewer: every write endpoint the UI uses → 403:** `06-viewer-read-only.spec.js` (34 write
  routes, then "nothing changed").
- **Excel export:** `10-excel-export.spec.js` (Tool 1 and Tool 3 files + project workbook: sheet
  names, `Tool1_<title>_Approved_<date>.xlsx` / `Tool3_…_Completed_…` / `ESMS_<title>_<date>.xlsx`,
  key cells, footers).
- **Arabic:** `11-arabic-text.spec.js` (typed in the UI; API values exact; shown after reload;
  every exported cell `readingOrder: 'rtl'`).
- **Test gaps:** backend `tests/coverageGaps.test.js` (error handler branches, ApiError,
  `GET /monitoring/:id`, `connectDB` failure, a real `server.js` start + `/health` + shutdown);
  frontend `services/toolServices.test.js` (screening/assessment services, query client retry
  rules), `components/appShell.test.jsx` (ErrorBoundary incl. chunk reload, OfflineBanner,
  `useOnlineStatus`), `components/ui/navigationPrimitives.test.jsx` (Pagination, Tooltip, Accordion),
  `utils/excelExport/index.test.js`, `components/layout/Header.test.jsx` (Header + ProfilePage),
  `pages/projects/ProjectListPage.test.jsx`, `pages/project-workspace/monitoring/MonitoringOverviewPage.test.jsx`,
  `pages/auth/LoginPage.test.jsx` (form added), `contexts/ThemeContext.test.jsx` (+ ImpactScoreRow,
  WorkflowProgressBar), `components/semp/sempTables.test.jsx` (Tools 3/4 grids).
- **Docs:** `backend/tests/docs.test.js` (old docs folders absent, every route in the API
  reference, permission matrices = `config/permissions.js`, no broken relative link in `docs/`,
  READMEs, `CLAUDE.md`).

## Found during phase

**Modules left without a direct unit test (D76 3), for the owner's review:**
- `frontend/src/App.jsx`, `main.jsx`, `fonts.js` — wiring only (providers, imports); every E2E flow
  loads them; `fonts.test.js` / `offline.test.js` check the font imports.
- `components/layout/MainLayout.jsx`, `AuthLayout.jsx`, `pages/NotFoundPage.jsx` — display only, no
  logic (MainLayout only passes the mobile-menu open state to Header / MobileMenu).
- `components/dashboard/ScreeningCategoryBadge.jsx`, `components/monitoring/MonitoringCategoryCard.jsx`,
  `MonitoringProgressTimeline.jsx`, `components/assessment/MetadataFormSection.jsx`,
  `ConsultationChecklistItem.jsx`, `components/screening/ImpactSection.jsx` — display components
  (rendered in page tests and E2E, no logic of their own).
- Low but not zero unit coverage, flows covered end to end: `ScreeningFormPage` (41 %),
  `AssessmentGatewayPage` (36 %), `AssessmentScoringPage` (55 %), `ScreeningSummaryPage` (59 %),
  `AssessmentReviewPage` (63 %) — each has unit tests (unsaved changes, stale save, D74 rules) and is
  driven by E2E flows 2, 3, 9, 10, 11.
- `backend/src/server.js` shows 0 % because it runs in a child process (`coverageGaps.test.js`,
  `productionChecks.test.js` and E2E start it); `src/db/seed.js` 80 % (its CLI wrapper; the data
  function is used by every test).

**Other findings:**
- **Empty downloads on the owner's machine (local download managers such as IDM):** during the
  local E2E runs, file fetches (`GET /files/:id/download`, `GET /library/:id/file`) reached the page
  as an empty 204 although the server sent 200 with the file, and each was fetched once more without
  `Sec-Fetch-*` headers. Cause: the owner's Internet Download Manager hooks into `chrome.exe`
  (Chrome for Testing included), takes over any response with `Content-Disposition` and downloads it
  itself. Not an app or Chromium bug: the CI E2E job (Linux, no download manager) passes every flow
  through the real download path, the temporary routing workaround was removed, and server and
  frontend are unchanged. The developer guide says to turn off the download manager's browser
  integration (or exclude the Playwright browser) while running E2E.
- **This machine:** Playwright's Chromium does not start from `%LOCALAPPDATA%\ms-playwright` ("side-by-side
  configuration is incorrect"); the same files start from another folder. Local runs use
  `PLAYWRIGHT_BROWSERS_PATH` (in the developer guide and CLAUDE.md). CI (Linux) is not affected.
- **Header "Export Excel" race:** a click before the tool page has loaded is lost (UI issue, written
  into phase 13 with three other UI findings).
- `components/ui/Accordion.jsx` is not used anywhere (tested now; phase 13 can remove or use it).
- **Fixed (owner approved, 2026-11-08):** the error handler returned the message of an unexpected
  (non-`ApiError`) error to the client with status 500 (e.g. a library message or a path). Now a
  status ≥ 500 from a non-`ApiError` answers exactly "Server Error" outside `development`; the full
  error is still logged; `ApiError` 5xx messages and every 4xx stay as they were. Tests:
  `backend/tests/coverageGaps.test.js` (production / test / development, `ApiError` 503, a 4xx
  library error, invalid JSON → 400 and a thrown error → 500 through the app).
- `.claude/launch.json` gained an `e2e-server` entry (port 3100) for the preview pane.
