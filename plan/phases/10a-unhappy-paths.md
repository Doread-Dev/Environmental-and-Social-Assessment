# Phase 10a — Unhappy paths & edge cases

**Goal:** every screen behaves correctly outside the happy path, not only when the user does everything in the expected order. Found by walking the whole app on purpose, not one bug at a time (D61).

**Decisions:** D61, D62, D73, D74 (+ D13, D17, D28a, D39).

**Owner's concept (D73, 2026-11-05):** stale saves warn and reload, no merge; an expired session signs in again on the page without losing input; plain bugs are fixed here with a test, behaviour or product choices go back to the owner (list below and in the PR).

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

## Tests
- Stale saves (backend): for project, screening, assessment (PUT, methods, consultations, scores, submit) and the Tools 3 / 4 / 5 bulk saves — two clients load the same version, the first save succeeds, the second answers 409 and writes nothing; after reloading, the second save works; a missing `version` → 400.
- Stale saves (frontend): `useProjectSave` shows the 409 in the app `Modal` with Reload (refetches the tool and workspace queries) and Keep editing (typed input kept).
- Unsaved-changes guard: per edit page, an in-app link and the browser Back after an edit open Save / Discard / Stay (each choice does what it says); `beforeunload` is registered only while there are unsaved changes; no dialog without an edit.
- Double actions: Save / Submit / Approve are disabled while their request runs; a double click sends one request.
- Errors: 400 / 403 / 404 / 409 / 500 / network error on a save each show the `extractErrorMessage` text; an expired session mid-edit keeps what was typed until the user signs in again (or says clearly that it is lost).
- Each agreed case from the list at the bottom of this file has its own test, named after the case.
- Style guard: the `window.confirm` allow-list is empty.

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [x] Inventory and case list at the bottom of this file, reviewed by the owner. *(The owner answered the six questions: D74.)*
- [x] Every agreed problem fixed with a test, or explicitly deferred by the owner. *(Plain bugs fixed with tests; the behaviour questions below wait for the owner.)*
- [x] Shared unsaved-changes guard used by every editing page; no `window.confirm` / `window.alert` left in `src/` (after phase 10 only the three unsaved-changes prompts of Tools 3, 4, 5 remain; remove them from the allow-list in `src/test/styleGuard.test.js`). Confirmations use `ConfirmDialog` (`components/ui`).
- [x] The most important unhappy paths added to the phase 12 E2E list.

## Result

**Branch:** `claude/phase-10a-unhappy-paths-48cb62` (PR into `Development`).

### Shared mechanisms (one per problem)
- **Stale saves (backend, D62/D73):** `src/utils/version.js` + `models/tableRevision.model.js` + `validators/version.validator.js`.
  - Project PUT, screening PUT/submit, assessment PUT/methods/consultations/scores/submit take `version` (the `updatedAt` the client loaded, ISO). The check runs first (a user whose record was submitted/approved/rejected meanwhile is told to reload) and again inside one conditional update, which also moves `updatedAt` on by at least 1 ms, so two saves of the same version never both pass. Approve/reject take no version (the record is locked while submitted) but move it on.
  - Tools 3, 4, 5: `TableRevision { project, table, revision }` (unique per project + table), returned as `version` next to `data` by `GET /<management|mitigation|monitoring>/project/:id` and by the bulk saves; the bulk `PUT` requires it. Rows are validated first, then the revision is checked and raised in one conditional update (`$inc`, upsert at 0 → a concurrent first save hits the unique index → 409), then written; a failed write gives the revision back. Removed with the project (`removeProjectData`).
  - Stale → **409** `{ error: "Someone else changed this since you opened it. Reload to see the latest version.", code: "STALE_VERSION" }`, nothing written. Missing `version` → **400** "version is required (reload the page and try again)".
  - Body shapes that changed: methods/consultations/scores are objects now (`{ version, methods }`, `{ version, consultations }`, `{ version, scores }`) and answer the whole assessment with its children (as `GET /assessments/project/:id`), so the next write sends the version the previous one left. Submit bodies: `{ version }`.
- **Stale saves (frontend):** `useProjectSave(projectId, toolQueryKey)` + `contexts/SaveConflictContext.jsx` (one dialog for the app, in `App.jsx`). Reload refetches the tool query and the workspace, then the project layouts remount the page (`<Outlet key={reloadKey}>`), so forms, local drafts and their versions start from the fresh data. Keep editing closes it; the input stays. Versions: screening/assessment/project from the record the page shows (cache, or the form's opening state for the project edit); Tools 3/4/5 from the revision the local edits started from. Tool queries no longer refetch on reconnect behind an open form.
- **Session expired (D73):** `api.js` `setSessionExpiredHandler` + `AuthContext` (`sessionExpired`, `reauthenticate`) + `components/auth/SessionExpiredDialog.jsx` (in `App.jsx`). The page is never unmounted; the failed save answers `handled: true` and shows nothing twice.
- **Unsaved changes (D61):** `contexts/UnsavedChangesContext.jsx` (one `useBlocker` for the router, mounted by `routes/AppShell.jsx`), `useUnsavedChanges(isDirty, onSave)` for pages, `useConfirmLeave()` for sign-out, `utils/leaveGuard.js` for exits chosen on purpose. Used by: screening form, assessment metadata, methods & consultations, scoring, Tools 3 and 4, Tool 5 data entry, project create, project edit (overview dialog), Settings → user form (edit: Save/Discard/Stay; create: Discard/Stay only, the one-time password must be seen), library document form. `window.confirm` allow-list is empty.
- **Double actions:** `useProjectSave` returns the running call's result to a second call (every tool write, approve/reject, project edit); project create, user form and library form guard their own submit.
- **Seed:** `seed-demo-project.js` sends every version and stops with "The lookup data is missing … Run `npm run seed` in backend/ first … Nothing was changed." on an empty database.

### Plain bugs found and fixed (each with a test)
| # | Bug (before) | Fix | Test |
|---|---|---|---|
| B1 | Tool 5 Cancel with changes did nothing in embedded browsers (`window.confirm` suppressed); sidebar/Back lost changes silently (also Tools 3/4) | shared guard | `test/unsavedChangesPages.test.jsx` |
| B2 | Unknown/deleted project id on `…/semp/activities` (also any route behind `WorkflowRouteGuard` outside `ProjectLayout`): "Loading {step} access..." forever **and a request loop** (≈1,400 workspace requests per second until the rate limit locked the user out for 7 minutes) | `WorkflowRouteGuard` shows the load error (Back to Projects / Try again) before rendering the pages below; message typo fixed | `routes/unknownProject.test.jsx` |
| B3 | Same loop pattern in `ScreeningRouter` / `AssessmentRouter` on any read error (500, offline) | they show the read error first (`loadError` from the hooks) | `routes/unknownProject.test.jsx` |
| B4 | Assessment metadata: a failed save showed nothing | server reason shown in an Alert | `test/saveUnhappyPaths.test.jsx` |
| B5 | Assessment review: a failed approve/reject showed nothing | toast with the reason (and a success toast) | `test/saveUnhappyPaths.test.jsx` |
| B6 | Assessment methods page: methods and consultations saved in parallel (now impossible with versions) and errors were generic ("Failed to save methods") | saved one after the other, the server reason shown | `test/saveUnhappyPaths.test.jsx`, `hooks/useAssessment.test.js` |
| B7 | Project create: a double submit could create two projects | one request per submit | `test/saveUnhappyPaths.test.jsx` |
| B8 | User form: a double click on Create User sent two requests (second → 409 toast) | one request | `test/saveUnhappyPaths.test.jsx` |
| B9 | Project edit dialog: a background refresh of the project replaced what was being typed | form taken when the dialog opens | `test/saveUnhappyPaths.test.jsx` (version from opening state) |
| B10 | Tools 3/4 cells: pasted formatting/links/images showed in the cell but only the text was saved | paste as plain text | `components/semp/EditableCell.test.jsx` |
| B11 | Signing out with unsaved changes discarded them silently | sign-out asks Save / Discard / Stay | `contexts/UnsavedChangesContext.test.jsx` |

### Tests (item by item)
- **Stale saves (backend):** `backend/tests/staleSaves.test.js` — for project PUT, screening PUT, assessment PUT, methods, consultations, scores and the Tools 3/4/5 bulk saves: two clients load one version, the first saves, the second gets 409 `STALE_VERSION` and nothing is written; after reloading the second save works; a missing `version` → 400; two saves of one version at the same moment → exactly one wins; stale submit (screening, assessment) → 409 before the required-field check; reject moves the version on; table revisions per project and table, returned by GET and saves, kept on a refused save, removed with the project. Existing suites send versions through `tests/helpers/fixtures.js` `withVersion` / `currentVersion`. Seed on an empty DB: `backend/tests/seedDemoProject.test.js`.
- **Stale saves (frontend):** `hooks/useProjectSave.test.jsx` (dialog with Reload / Keep editing; Reload refetches the tool and workspace queries and remounts; Keep editing keeps the input), `test/saveUnhappyPaths.test.jsx` (Tool 3 and the project edit through the real pages; next save sends the new revision), `hooks/useAssessment.test.js`, `hooks/useScreening.test.js`, `services/workflowTransitions.test.js` (versions sent).
- **Unsaved-changes guard:** `contexts/UnsavedChangesContext.test.jsx` (each choice; browser Back; `beforeunload` only while dirty; no dialog without an edit; sign-out; Discard/Stay only without a save) and `test/unsavedChangesPages.test.jsx` (per edit page: screening, assessment metadata / methods / scoring, Tools 3 and 4, Tool 5, project create, project edit, user form, library form — an in-app link and the browser Back after an edit open the dialog; none without an edit).
- **Double actions:** `hooks/useProjectSave.test.jsx` (a second call sends no request; fails without the guard), `test/saveUnhappyPaths.test.jsx` (Tool 3 Save disabled while running and one request; project create; Approve; Create User).
- **Errors:** `test/saveUnhappyPaths.test.jsx` (400 / 403 / 404 / 409 / 500 / network on a save show the `extractErrorMessage` text and keep the edit), `components/auth/SessionExpiredDialog.test.jsx` (expired session keeps the input until signing in again; no automatic retry; wrong password; deactivated; sign in as someone else; no user loaded → login page), `services/api.test.js` (interceptor: 401 with/without a user, a 401 of the sign-in request, stale 409 detection).
- **Cases from the list below:** `routes/unknownProject.test.jsx` (B2, B3), `components/semp/EditableCell.test.jsx` (B10), `utils/excelExport/workbooks.test.js` ("large and Arabic data": 40 rows and a 12,000-character Arabic cell stay complete and right to left).
- **Style guard:** `test/styleGuard.test.js` — `window.confirm` allow-list empty (`confirm(` anywhere fails).

### Browser check (ports 3001/5174, throwaway DB `esms_phase10a_check`, admin + demo users per role)
Demo seed with versions; a test project per state (not started, screening draft / submitted / rejected, category E, assessment draft / submitted / rejected, SEMP empty, archived, Arabic + long text with 40 Tool 3 rows). Checked: guard dialog and its Save on the screening form; Tool 3 stale save (another user saved via the API) → dialog, input kept, nothing overwritten, Reload shows their row; screening submitted by another user while editing → dialog → Reload shows "Pending Approval"; expired token mid-edit → sign-in dialog, input kept, Save again works; unknown project URLs (B2 found here); locked tool by URL redirects; archived project read-only; category E opens Tool 2; rejected → edit → resubmit; viewer sees no edit/export controls on any tool page; Arabic 40-row Tool 3 renders without page overflow.

D74 round (same setup, fresh DB, dropped afterwards): an end date before the start refused on project create, a one-day project created; assessment metadata saved as a draft with two fields cleared, Submit then refused with "Fill in Environmental setting and Legal requirements before submitting" (no request); Tool 3 Export with an unsaved edit opens "You have unsaved changes" (Save and export / Cancel), Cancel keeps the edit; screening Approve disabled until recommendations are typed, then the shared "Approve the screening?" dialog, approved; assessment reject with a reason through "Reject the assessment?", rejected; stale-save dialog on Tool 4 after another user saved (Reload shows their row) and the sign-in dialog after a broken token (input kept, Save again → Saved) re-checked. Servers stopped, 3001/5174 free, no worktree node process, launch.json restored.

### Inventory (screens and actions)
| Screen | Actions |
|---|---|
| Login / forced password change / Profile | sign in, change password |
| Dashboard | open project, create |
| Projects list (active / archived) | search, filter, sort, paginate, open |
| Project create | fill, save, cancel |
| Project overview | edit project (dialog), export workbook, next step |
| Screening form (new / draft / rejected edit) | save draft, submit (confirm), leave |
| Screening summary | approve, reject (reason), edit when rejected, proceed, export |
| Assessment gateway / metadata / methods & consultations / scoring / review | start, save & continue, back, save draft, submit (confirm), approve, reject, edit when rejected, export |
| SEMP overview, Tools 3 and 4 | add / edit / delete rows, save, back, export, Guidance |
| Monitoring overview and data entry | edit values, ranking, responsible, save, cancel, export |
| Project documents | upload, view PDF, download, delete |
| Library | search, filter, upload, edit, replace PDF, delete, view |
| Settings → Users / Projects / Activity log | add, edit, deactivate, reactivate, reset password; archive, restore, delete, purge; filter |
| Layout (header, sidebars, mobile menu) | navigate, theme, sign out |

### Case list (expected / actual before 10a / now)
| Case | Screens | Expected | Before 10a | Now |
|---|---|---|---|---|
| Unsaved changes: Cancel / Back / sidebar / browser Back | every edit page | ask Save / Discard / Stay | Tools 3/4/5 `window.confirm` on their own Back only (suppressed in embedded browsers); every other path lost the input silently | shared in-app guard on every edit page |
| Unsaved changes: refresh / close tab | every edit page | browser prompt only while dirty | none | `beforeunload` while dirty |
| Unsaved changes: sign out | every edit page | ask first | input lost | asks |
| Double click Save / Submit / Approve / Create | all writes | one request | buttons disabled after a render; project create and user create could send two | one request (shared lock) |
| 400 / 403 / 404 / 409 / 500 / offline on a save | every edit page | the server's reason, input kept | mostly shown; silent on assessment metadata save and assessment approve/reject; generic text on methods | reason shown everywhere checked |
| 401 mid-edit | every page | sign in on the page, input kept | hard redirect to login, input lost | sign-in dialog (D73) |
| 404 unknown / deleted project id | project pages | "Project not found" + way back | fine inside `ProjectLayout`; SEMP full-width URL: endless loading + request loop (B2) | error with Back to Projects / Try again |
| Read error of a tool record | screening, assessment | error + Try again | same loop pattern (B3) | error + Try again |
| Two users on one record or table | all tools, project edit | 409 shown, page reloads its state | last save won (rows of Tools 3/4 deleted) | stale dialog, nothing overwritten |
| One approves / submits while the other edits | screening, assessment | other's save refused, reload shows the new state | edit overwrote or failed with "locked" | stale dialog → Reload shows the new status |
| Rejected → edit → resubmit | screening, assessment | works | works | works (browser) |
| Category E | Tool 2 | opens like any category | opens | opens (browser) |
| Archived project by URL | all pages | read-only notice, no edit controls | as expected | unchanged |
| Locked tool by URL | assessment, SEMP, monitoring | redirect to the open step | as expected | unchanged |
| Roles | every page | viewer: no edit/export; editor: no approve; purge admin only | as expected (backend + allowed actions) | unchanged; viewer checked in the browser |
| Many rows, long and Arabic text | Tools 3–5, export | layout holds, export complete | export complete and RTL; grid cells forced LTR, very tall rows (phase 13) | unchanged (UI items in phase 13) |
| Pasted text | Tools 3/4 cells | what is shown is saved | formatting shown, not saved (B10) | plain text |
| Loading | all pages | loading state, no flashes | as expected | unchanged |

### Owner answers (D74, 2026-11-05) — built in this phase
The six questions raised by the walk were answered by the owner and built here (DECISIONS D74).

| # | Question | Answer (D74) | Where | Tests |
|---|---|---|---|---|
| 1 | Project dates: page refused "on or before", backend nothing | Backend 400 "End date cannot be before the start date" on create and update (one date sent → compared with the stored one); a one-day project is allowed; the page rule is "before" only | `project.service.js` `assertDateOrder`; `utils/validators.js` `validateDates` | `backend/tests/ownerRulesD74.test.js`; `frontend/src/utils/validators.test.js`, `frontend/src/test/ownerRulesD74.test.jsx` |
| 2 | Assessment metadata: page required all four to save a draft | A draft saves with any field empty; submit requires all four (project activity, description, environmental setting, legal requirements), 400 naming the missing ones; scoring's Submit says the same before sending (extends D69) | `assessment.service.js` `REQUIRED_AT_SUBMIT`; `AssessmentMetadataPage`, `AssessmentScoringPage`, `assessmentSubmitError` | `backend/tests/assessmentScores.test.js`; `frontend/src/test/ownerRulesD74.test.jsx`, `frontend/src/utils/validators.test.js` |
| 3 | Tools 3/4/5 exported unsaved edits | With unsaved edits Export opens "You have unsaved changes" (Save and export / Cancel); a failed save (stale 409 included) exports nothing; every export reads the saved data and the current status | `components/export/UnsavedExportDialog`; Tools 3/4/5 pages | `frontend/src/test/ownerRulesD74.test.jsx` |
| 4 | No maximum length (Excel cell limit 32,767) | Every free-text field ≤ 30,000 characters: Joi `text()` → 400; shared `Input`/`Textarea` default `maxLength`; grid cells cut at it; shorter limits stay (a maximum, not a D57 minimum) | `validators/text.validator.js`; `utils/textLimits.js`, `Input`, `Textarea`, `EditableCell` | `backend/tests/ownerRulesD74.test.js`; `frontend/src/test/ownerRulesD74.test.jsx`, `frontend/src/components/semp/EditableCell.test.jsx` |
| 5 | Recommendations: required for assessment in the page only, optional for screening | Required to approve in both tools: server 400 "Recommendations are required to approve", Approve disabled until typed (replaces D56's "optional") | `validators/text.validator.js` `recommendations()`; `ScreeningSummaryPage`, `AssessmentReviewPage` | `backend/tests/ownerRulesD74.test.js`; `frontend/src/test/ownerRulesD74.test.jsx` |
| 6 | Screening approve without confirmation | Approve and reject confirm in both tools, one wording and layout | `components/review/ReviewDecisionDialog` | `frontend/src/test/ownerRulesD74.test.jsx`, `frontend/src/test/saveUnhappyPaths.test.jsx` |

Existing suites adjusted for the new rules (approve sends recommendations, assessments carry all four fields): `backend/tests/transitions.test.js`, `locking.test.js`, `projectAccess.test.js`, `assessmentScores.test.js`. The demo seed already sends recommendations and all four fields.

## Found during phase
- UI/UX items written to [phase 13](13-page-by-page-ui-review.md) (D72 c): Arabic in the Tools 3/4 grid cells is forced left to right; very long cell text makes rows hundreds of pixels tall; the Tool 5 lock card names Tool 2 and links to it (the gate is Tools 3 and 4; the route guard makes the card mostly unreachable); "Save and Continue" is disabled for viewers on the assessment pages, with no forward button; "Save as Draft" in scoring gives no success feedback; the session and stale-save dialogs need a look in both themes and on mobile.
- Not in scope, for later: an editor's own token stays valid after a password change elsewhere (known gap in CLAUDE.md); a 403 `PASSWORD_CHANGE_REQUIRED` after signing in again in the session dialog (admin reset meanwhile) still hard-redirects to the change-password screen, losing input (rare).
