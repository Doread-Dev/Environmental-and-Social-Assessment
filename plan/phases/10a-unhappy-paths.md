# Phase 10a — Unhappy paths & edge cases

**Goal:** every screen behaves correctly outside the happy path, not only when the user does everything in the expected order. Found by walking the whole app on purpose, not one bug at a time (D61).

**Decisions:** D61 (+ D13, D17, D28a, D39).

**Why a phase:** the owner found that in Tool 5 "Cancel" after an edit neither leaves nor asks to save or discard. Fixing that one button is not enough: the same kind of gap is likely on every page that edits data.

## Known so far
- **Tool 5 – Monitoring Data Entry** (`MonitoringDataEntryPage.jsx`): Cancel with unsaved changes uses `window.confirm`, which an embedded browser can block, so the button does nothing and nothing is shown. The sidebar links and the browser Back button skip the check completely, so changes are lost without a warning.

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
