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
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] E2E suite green and running in CI; docs reviewed by the owner.
- [ ] Untested-modules list in the PR body and below, for the owner's review; coverage floors raised.
- [ ] `plan/README.md` progress table complete.

## Found during phase
