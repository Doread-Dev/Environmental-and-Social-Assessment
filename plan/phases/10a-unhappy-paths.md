# Phase 10a — Unhappy paths & edge cases

**Goal:** every screen behaves correctly outside the happy path, not only when the user does everything in the expected order. Found by walking the whole app on purpose, not one bug at a time (D61).

**Decisions:** D61, D62 (+ D13, D17, D28a, D39).

**Why a phase:** the owner found that in Tool 5 "Cancel" after an edit neither leaves nor asks to save or discard. Fixing that one button is not enough: the same kind of gap is likely on every page that edits data.

## Known so far
- **Tool 5 – Monitoring Data Entry** (`MonitoringDataEntryPage.jsx`): Cancel with unsaved changes uses `window.confirm`, which an embedded browser can block, so the button does nothing and nothing is shown. The sidebar links and the browser Back button skip the check completely, so changes are lost without a warning.
- **Silent overwrite between users/tabs (D62, found in the review of phases 0–5):** Tools 3 and 4 save the whole table, so a second tab or user that saves later deletes the rows the first one added; screening, assessment, project and monitoring saves also overwrite each other without a warning.

## Stale saves (D62) — build first, the other cases rely on it
- **Backend:** every write of project data takes the version the client loaded and answers **409** when it no longer matches (message: changed by someone else since you opened it).
  - Project, screening, assessment: the record's `updatedAt`, sent as `version` (PUT bodies, assessment methods/consultations/scores, submit). Approve/reject are not blocked by it (the record is locked while submitted).
  - Tools 3, 4, Monitoring: a revision counter per project and table (e.g. `table_revisions.management|mitigation|monitoring` on the project, or a small collection), returned by the table GETs and the bulk save responses, required in the bulk `PUT` bodies, raised by every successful bulk save. Check and raise in one conditional update so two saves at the same moment can't both pass.
  - Validators require `version` on these writes; missing → 400. Update `seed-demo-project.js` and the tests.
- **Frontend:** the tool hooks send the version they hold. On this 409 one shared handler (in `useProjectSave`) shows the message in the app `Modal` with **Reload** (refetches the tool and workspace queries) and **Keep editing** (the user can copy what they typed); no automatic merge.
- **Tests:** two clients load the same record/table, the first saves, the second gets 409 and nothing is written; after reload the second save works. Same for each table and for each record type.

## Tasks
1. **Inventory.** List every screen and every action on it (create, edit, save, submit, approve, reject, delete, archive, export, navigation away). Write the list at the bottom of this file.
2. **Walk each screen through the cases below** and record what happens (expected / actual) in that list. Agree the list with the owner before fixing.
3. **Fix**, with a test for each fix (D39). Prefer one shared mechanism over per-page patches.

### Cases to check on every screen
- **Unsaved changes:** Cancel, Back, sidebar link, browser Back/refresh/close tab. One shared guard: app `Modal` (Save / Discard / Stay) instead of `window.confirm`, React Router `useBlocker` for in-app navigation, `beforeunload` for refresh/close. Applies to screening, assessment (metadata, methods, consultations, scoring), Tools 3 & 4, Tool 5, project create/edit, users.
- **Double actions:** double click on Save/Submit/Approve; buttons disabled while a request runs; no duplicate records.
- **Server errors:** 400 (validation), 401 (expired session mid-edit: what happens to the typed data), 403 (role), 404 (deleted/unknown id in the URL), 409 (gate, lock, archived, duplicate — message from the backend shown), 500, network offline / timeout. Every error shown with `extractErrorMessage`, never a blank page or a silent failure.
- **Stale state:** two users or two tabs on the same project (one approves while the other edits; the other then saves → 409 shown and the page reloads its state).
- **Workflow edges:** rejected → edit → resubmit; approve with empty optional fields; category E; screening/assessment open in a locked state; archived project opened by URL; direct URL to a locked tool (route guards).
- **Roles:** each role on each screen — viewer sees no edit/export controls (D28a), editor cannot approve, only admin purges (D60).
- **Empty and large data:** empty lists, a project with no component, very long texts (layout does not break), many rows in Tools 3–5, special characters and Arabic text in fields and in the Excel export.
- **Forms:** required fields, dates (end before start), leading/trailing spaces, pasted text.
- **Loading:** slow network — loading states shown, no flashes of "Not started" before data arrives, no full-page spinner on a background refresh.

## Done when
- [ ] Inventory and case list at the bottom of this file, reviewed by the owner.
- [ ] Every agreed problem fixed with a test, or explicitly deferred by the owner.
- [ ] Shared unsaved-changes guard used by every editing page; no `window.confirm` / `window.alert` left in `src/`.
- [ ] The most important unhappy paths added to the phase 12 E2E list.

## Found during phase
