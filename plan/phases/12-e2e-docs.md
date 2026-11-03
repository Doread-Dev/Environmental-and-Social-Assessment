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
  5. Annex upload / download / delete.
  6. Viewer: sees everything, no edit/export controls; direct API writes 403.
  7. Archive / restore; delete blocked when something is approved.
  8. Locked v3 buttons visible and inert.
- One command to run; documented in `CLAUDE.md`.

## Documentation (D44)
- Delete `backend/docs/` and `frontend/docs/`.
- Write new docs from the code: architecture, API reference (generated or hand-written per router), data models, roles & permissions matrix, workflow rules, deployment & backup runbook, user guide for admins (users, passwords), developer guide (setup, tests, conventions, v3 folders).
- Keep `frontend/docs/STYLE_GUIDE.md` content: translate to English and move into the new docs.
- Rewrite `CLAUDE.md` to match; keep it short and point to the docs.
- README at the root.

## Done when
- [ ] E2E suite green; docs reviewed by the owner.
- [ ] `plan/README.md` progress table complete.

## Found during phase
