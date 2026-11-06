# Phase 14 — User guide

**Goal:** one user guide, in English, for every role — admin, environmental specialist, the editor roles (program manager, project manager, environmental focal point) and viewer — that says what each role does in each tool, who submits and who approves, what locks and when, written on the screens as phase 13 leaves them.

**Decisions:** D76 1 (+ D2, D13–D19, D21–D25, D35, D60–D62, D64, D65, D73, D74 for the behaviour it describes).

**Depends on:** 13 (phase 13 changes the screens; a guide written before it would go stale).

## Scope
- **Audience:** the people who use the app, not developers or IT (they have the technical docs of phase 12 and the `deploy/` guides).
- **Per role:** what the role sees and can do (from `config/permissions.js` and the project's allowed actions), told as tasks, not as a permission table.
- **Per tool (Screening, Assessment, Tool 3, Tool 4, Monitoring):** what to fill in, how to save, how to submit, who approves or rejects (recommendations required, reject reason), what locks after submit/approve, what unlocks the next tool, how to export (who may).
- **Project life:** create, edit, documents, archive / restore, delete (blocked once something is approved), permanent delete (admin), the library and the Guidance button.
- **Admin part:** users (create, temporary password shown once, forced change at first sign-in, edit, role change, deactivate / reactivate, reset password, the last active admin), the own password (Profile), the Activity log.
- **Everyday situations:** unsaved changes (Save / Discard / Stay), "Someone else changed this" (Reload / Keep editing), session expired (sign in on the page), locked v3 buttons ("Available in v3").
- Screenshots optional; if used, taken from the build of phase 13 in light mode, no real data.
- Where it lives: a `docs/user-guide/` section (or the layout the phase-12 docs use), linked from the root `README.md`; whether it is also reachable from inside the app is decided with the owner in this phase's concept talk.

## Tests
- Docs check (a test next to the docs tests of phase 12): every screen name, button and menu label the guide quotes (written in a fixed form, e.g. **bold** or a marked list) exists in the frontend source (`src/`) — a label that is renamed or removed makes the test fail.
- Every role in `config/roles.js` has its section in the guide (test fails on a new role without one).
- Every tool route with a place key (`handle: { place }` in `routes/index.jsx`) has its section.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Guide reviewed by the owner (and, if possible, read by one person of each role).
- [ ] `plan/README.md` progress table complete.

## Found during phase
