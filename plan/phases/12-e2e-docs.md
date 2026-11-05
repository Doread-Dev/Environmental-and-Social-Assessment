# Phase 12 — E2E tests & documentation

**Goal:** protect the golden flows end to end and replace the outdated docs.

**Decisions:** D39 (Playwright), D44.

## E2E (Playwright)
- Runs against the production-style single process (phase 11) with a fresh `esms_test` DB and seeded users.
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
- One command to run; documented in `CLAUDE.md`.
- Add the E2E run as a job in `.github/workflows/ci.yml`.

## Test gap review
- Open the coverage reports (`npm run test:coverage` → `coverage/index.html` in each app) and list every module still without meaningful tests (routes, services, hooks, pages, utils). Owner decides which get tests in this phase; raise the thresholds after.

## Documentation (D44)
- Delete `backend/docs/` and `frontend/docs/`.
- Write new docs from the code: architecture, API reference (generated or hand-written per router), data models, roles & permissions matrix, workflow rules, deployment & backup runbook, user guide for admins (users, passwords), developer guide (setup, tests, conventions, v3 folders).
- Keep `frontend/docs/STYLE_GUIDE.md` content: translate to English and move into the new docs.
- Rewrite `CLAUDE.md` to match; keep it short and point to the docs.
- README at the root.

## Tests
- One Playwright spec per golden flow above (1–9), named after the flow, each starting from a fresh `esms_test` database with seeded users; the specs run in the CI job.
- Each E2E flow checks the visible result in the UI and the stored state through the API (e.g. status, `status_history`, audit entry).
- Viewer flow: every write endpoint the UI uses answers 403 for a viewer token.
- Test gap list: each module the owner picks gets a unit or integration test; coverage thresholds raised after.
- Docs: a test (or CI step) fails if `backend/docs/` or `frontend/docs/` come back, and checks that every route in the route table appears in the API reference.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] E2E suite green and running in CI; docs reviewed by the owner.
- [ ] Test gap list reviewed by the owner; agreed tests added.
- [ ] `plan/README.md` progress table complete.

## Found during phase
