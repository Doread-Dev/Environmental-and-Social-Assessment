# Phase 8 — UI & Excel from v2

**Goal:** bring the approved v2 visuals and the official-format Excel exports into this repo.

**Decisions:** D49, D51, D52 (layout goal replaced by D68), D54, D55, D59, D63 (a)–(c), D67 (b)–(d), D68, D69 (+ D25 already done in phase 6).

## Tasks

> **Owner review of PR #19 (2026-11-04):** the official workbook is a quick client sketch. Rules come from the app (D68); exports go back to this repo's pre-phase-8 layouts, made complete for each tool, and keep D67 b–d, `responsible_text`, right-to-left Arabic cells and the `file-saver` removal. The official-layout builders (and D67 a) were dropped. Also in this phase after the review: the dot-folder download fix, the login logo without a box, and the AKF logo as the app's brand mark and tab icon.

### Brand palette (D49)
- Port the token changes from v2 `frontend/src/index.css` (primary `#008c54`, `primary-soft`, `primary-border`, green scale, dark tokens, risk C/F colors, focus colors using `var(--color-primary)`). Check every screen in light and dark mode, the phase 7a/7b screens included (Activity log, Library, PdfViewer, Guidance panel, Documents).
- Do **not** port the `emerald-*`/`teal-*` overrides blindly: replace remaining raw `emerald`/`teal` utilities with tokens instead (STYLE_GUIDE).

### Login page (D51)
- Port v2 `pages/auth/LoginPage.jsx` layout with local assets from v2 `frontend/src/assets/auth/` (AKF logo, Syria map — rename files without spaces) and `public/favicon.png`; title "ESMS System – Environmental & Social Management System".
- Keep "Contact your system administrator" (no forgot-password link).

### Excel exports (D52)
- ~~Port v2 builders~~ (replaced by D68 after the owner review): exports keep this repo's pre-phase-8 layouts, reshaped so each builder adds its sheet to a given workbook (shared by per-tool exports and the project workbook), and made complete: every field the app holds for the tool, labelled. `sempWorkbook.js` + `exportSempPlan.js` come in phase 9 (locked).
- **Project workbook (D67 b):** "Export project workbook" on the project overview (only with `can('export')`, never viewers, D28a): one file with a sheet per tool that has data, in the official order Tool 1 → Tool 5; loads only what those sheets need (request count in `requestCounts.test.jsx`). Per-tool exports stay.
- **Status and date (D67 d):** every export carries the tool's status (workspace `workflow.steps`: Draft / Submitted / Approved / Rejected for Tools 1–2, In progress / Completed for Tools 3–5) and the export date in the file name (`Tool2_<project>_Draft_2026-11-04.xlsx`, project workbook `ESMS_<project>_<date>.xlsx`) and in the printed page footer of each sheet — never inside the official sheet area.
- Cells with Arabic text read right-to-left (ExcelJS `alignment.readingOrder`).
- Add `responsible_text` to exports (Tools 3, 4, 5).
- ~~Compare each export with the official workbook~~ (D68): check each export against its tool's pages instead — every piece of information the app holds and shows appears, labelled.
- Keep ExcelJS lazy-loaded; note the chunk size here. Baseline from phase 0: `vendor-excel` ≈ 930 kB minified (Vite warns > 500 kB). Try ExcelJS's browser build / a lighter import path; if it can't shrink, raise `chunkSizeWarningLimit` for that chunk only, with a comment saying why.
- `exceljs` pulls `uuid < 11.1.1` and old `minimatch` (moderate `npm audit` findings, see `00-foundations.md`): if a newer exceljs release fixes them, upgrade here.

### Tool screens
- Assessment scoring: show the backend default (all Negligible), user changes only what differs; submit always enabled (D54). The submit confirmation says how many of the 50 questions differ from Negligible ("You changed 7 of 50; the other 43 stay Negligible", D67 c).
- Tools 3, 4, 5: "Responsible" control = user picker **or** "External / other party" free text (D55) — port the idea from v2 `components/semp/ResponsibleSelect.jsx`.
- Navigation stays as this repo: one "SEMP – Tools 3 & 4" entry; overview label "Risk Level" (D59).
- Viewers: no Start/Edit buttons anywhere (from `allowed_actions`).

### Leftovers from the review of phases 0–5 (D63)
- **Recommendations belong to the approver (a):** remove `recommendations` from the create and update schemas of screening and assessment (`validators/screening.validator.js`, `validators/assessment.validator.js`); it is set only by `PATCH …/approve`. The forms never send it; the approval sections keep their field.
- **Screening date (b):** a new screening form starts with today's date instead of empty (`ScreeningFormPage.jsx`); still editable, still required.
- **One request for the assessment (c):** `GET /assessments/project/:projectId` returns the assessment with `methods`, `consultations` and `scores` embedded (null when not started). `useAssessment` reads only that and keeps the separate GETs out of the frontend; remove those GET endpoints if nothing else uses them (`tests/removedEndpoints.test.js`). Update the request-count table in `05-frontend-data.md` (assessment gateway 5 → 3 when the assessment exists: `/auth/me`, workspace, assessment; + `/lookups` / screening only where the page needs them).

## Tests
- Workbook builders run in Node tests: sheet names, header rows, merges, one data row, responsible user vs text.
- Responsible control switches modes and clears the other value.
- `recommendations` in a create/PUT body is ignored; approve still stores it.
- New screening form shows today's date.
- Completeness check per tool (every field, labelled; approved / rejected / submitted variants). Project workbook: sheet order, only tools with data, each footer with its tool's status (D67 b, d). File names and footers carry status and date (D67 d).
- Tool 2 submit summary counts the questions that differ from Negligible (D67 c).
- Project workbook export: only the needed requests; not offered without `export` (viewers).
- The assessment read returns methods, consultations and scores; the assessment pages make one assessment request (`requestCounts.test.jsx`).

## Done when
- [x] All five tools export in this repo's layouts with every field the app holds, labelled (D68); the project workbook holds a sheet per tool with data, Tool 1 → Tool 5 (D67 b); file names and printed footers carry status and date (D67 d).
- [x] The Tool 2 submit confirmation shows the "changed N of 50" count; submit is never blocked (D67 c, D54).
- [x] Responsible = internal user or external party on Tools 3, 4, 5, in the UI and in the exports (D55).
- [x] D63 a–c done; one assessment request on the assessment pages.
- [x] Tests, lint, Prettier and build green in both apps; coverage thresholds raised.
- [x] Checked in the browser (throwaway DB, ports 3001/5174, light and dark): login, dashboard, overview, Tools 1–5, Documents, Library + PdfViewer, Guidance panel, Activity log, the AKF brand mark; one export per tool and one project workbook opened and read back.
- [x] Downloads work with `UPLOADS_DIR` under a dot folder (fix + test).
- [x] AKF logo: login without a box (as v2), brand mark in every header/sidebar/menu, tab icon.
- [x] Owner has checked light/dark screens, the login page and one export of each tool. *(Done before PR #19 was merged.)*

## Result

- **Exports** (`frontend/src/utils/excelExport/`, after the owner review, D68): the pre-phase-8 layouts restored as sheet builders that add to a given workbook — `screeningSheet.js`, `assessmentSheet.js`, `sempSheets.js`, `monitoringSheet.js` on `excelBase.js`; `exportMeta.js` (status labels, file names, footers) and `workbooks.js` (one tool, or the project workbook) as before. Added for completeness, checked against each tool's pages: status (Tools 1–2 the record's, Tools 3–5 the workflow's), submitted / approved / rejected dates (`status_history`), project location, component and dates, rejecter + reason, consultation notes, "Other" assessment method, a correct "All questions scored" (it read "approved" before) and the "changed N of 50" count, per-question notes, `responsible_text` ("<text> (external party)"), inactive users marked "(inactive)", the Tool 5 project block with Location. `file-saver` stays removed.
- **Completeness check:** `workbooks.test.js` fills every field the app keeps for each tool with a unique value and checks that it appears in the sheet next to its label (plus approved / rejected / submitted variants, the project workbook, footers, file names, RTL).
- **Chunk size:** `vendor-excel` stays 930 kB minified (256 kB gzip). ExcelJS 4.4.0 is the latest release and ships one browser bundle; the "bare" build only drops polyfills it needs. `chunkSizeWarningLimit` is 1000 for that chunk; every other chunk keeps the 500 kB warning through a small Vite plugin (`warnLargeChunks` in `vite.config.js`). It is loaded only on export.
- **npm audit:** 17 moderate findings, all from exceljs's Node-side dependencies (`uuid < 11.1.1`, `minimatch`/`glob` via archiver/unzipper). No newer exceljs release fixes them (4.4.0 is the latest; only 4.4.1-prerelease exists); `npm audit fix --force` would downgrade to exceljs 3.4.0. Left as is.
- **Request counts:** assessment gateway 4 (`/auth/me`, workspace, assessment, screening), scoring 4 (+ `/lookups` instead of the screening); `useAssessment` no longer loads `/lookups`, which it never used. Table in `05-frontend-data.md`.
- **Viewers:** SEMP cards say "View Tool", the assessment gateway "View Assessment", monitoring "View Data" without the edit actions.

## Out of scope
SEMP Plan, v3 modules (phase 9), general polish (phase 10).

### Inputs start empty (D69, owner follow-up, own commit)
- Backend `createAssessment` copies nothing (D53 prefill removed: `project_activity` ← project component, potential impacts ← screening). `project_activity` and `description` are no longer required at create (model + Joi); submit answers 400 "Fill in Project activity and Description before submitting" when one is empty, before the scores check. A draft may be saved with them empty.
- Frontend `useAssessment.startAssessment` creates with `{ project }` only: the "(To be filled)" values for description and project activity are gone.
- Demo seed sends the Tool 2 fields itself, as a user would type them.
- Searched Tools 1–5 forms, hooks and the backend for other inputs filled automatically. Owner's answers: the screening date keeps today as its default (D63 b, the one D69 exception: a date default, not content); the monitoring ranking starts empty — the select shows "Select ranking", the frontend sends `null` (no more "not_applicable" when none is picked), the backend accepts `null` (clears it). Workflow (records / quarters) never used the ranking; the Tool 5 export already leaves an empty ranking blank. Existing records saved as "not_applicable" before this stay as they are (no migration: they cannot be told apart from a picked N/A). Assessment scores start Negligible by D54 (not a typed input), kept. Joi defaults are empty values or query defaults only. Read-only project data and context cards unchanged.

## Found during phase

- **Downloads failed when `UPLOADS_DIR` is under a folder whose name starts with a dot** (phase 7b code). `fileStorage.service.send` called `res.sendFile(absolutePath, { dotfiles: "deny" })`, and `send` applied the dot rule to every segment of the absolute path, so a path such as `.../.claude/worktrees/.../uploads` (or `/home/esms/.data/uploads` on a server) answered 500 "Forbidden" for every project file and library PDF. **Fixed after the owner review:** `sendFile(<relative stored path>, { root: <uploads dir>, dotfiles: "deny" })`; `tests/uploadsDotFolder.test.js` (failed before the fix).
- Remaining `bg-gray-100` and similar non-token utilities in older screens (assessment, monitoring, timeline, header): general polish, phase 10. The raw hex dark backgrounds and the `emerald`/`teal` utilities were replaced with tokens here.
- The browser pane does not load Google Fonts, so icons show their names until the font arrives; local fonts are D37 (phase 11).
