# Phase 8 — UI & Excel from v2

**Goal:** bring the approved v2 visuals and the official-format Excel exports into this repo.

**Decisions:** D49, D51, D52, D54, D55, D59, D63 (a)–(c), D67 (+ D25 already done in phase 6).

## Tasks

### Brand palette (D49)
- Port the token changes from v2 `frontend/src/index.css` (primary `#008c54`, `primary-soft`, `primary-border`, green scale, dark tokens, risk C/F colors, focus colors using `var(--color-primary)`). Check every screen in light and dark mode, the phase 7a/7b screens included (Activity log, Library, PdfViewer, Guidance panel, Documents).
- Do **not** port the `emerald-*`/`teal-*` overrides blindly: replace remaining raw `emerald`/`teal` utilities with tokens instead (STYLE_GUIDE).

### Login page (D51)
- Port v2 `pages/auth/LoginPage.jsx` layout with local assets from v2 `frontend/src/assets/auth/` (AKF logo, Syria map — rename files without spaces) and `public/favicon.png`; title "ESMS System – Environmental & Social Management System".
- Keep "Contact your system administrator" (no forgot-password link).

### Excel exports (D52)
- Port v2 builders: `utils/excelExport/assessmentWorkbook.js` (Tool 2), `tool34Workbook.js` (Tools 3 & 4), `tool5Workbook.js` (Tool 5) and their wrappers. Tool 1 gets a new builder in the official "Tool 1" sheet layout (D67 a; v2's `exportScreening.js` is not the official layout). Each builder adds its sheet to a given workbook, so per-tool exports and the project workbook share them. `sempWorkbook.js` + `exportSempPlan.js` come in phase 9 (locked).
- **Project workbook (D67 b):** "Export project workbook" on the project overview (only with `can('export')`, never viewers, D28a): one file with a sheet per tool that has data, in the official order Tool 1 → Tool 5; loads only what those sheets need (request count in `requestCounts.test.jsx`). Per-tool exports stay.
- **Status and date (D67 d):** every export carries the tool's status (workspace `workflow.steps`: Draft / Submitted / Approved / Rejected for Tools 1–2, In progress / Completed for Tools 3–5) and the export date in the file name (`Tool2_<project>_Draft_2026-11-04.xlsx`, project workbook `ESMS_<project>_<date>.xlsx`) and in the printed page footer of each sheet — never inside the official sheet area.
- Cells with Arabic text read right-to-left (ExcelJS `alignment.readingOrder`).
- Add `responsible_text` to exports (Tools 3, 4, 5).
- Compare each export with the official workbook "AKF-S Environmental and Social Assessment Tooles 2025.xlsx" (ask the owner for the file) — headers, merges, widths.
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
- Tool 1 sheet: official rows, merges, labels; approval empty until approved (D67 a). Project workbook: sheet order, only tools with data, each footer with its tool's status (D67 b, d). File names and footers carry status and date, nothing in the sheet area (D67 d).
- Tool 2 submit summary counts the questions that differ from Negligible (D67 c).
- Project workbook export: only the needed requests; not offered without `export` (viewers).
- The assessment read returns methods, consultations and scores; the assessment pages make one assessment request (`requestCounts.test.jsx`).

## Done when
- [x] All five tools export in the official sheet layout (Tool 1 included, D67 a); the project workbook holds a sheet per tool with data in the official order (D67 b); file names and printed footers carry status and date (D67 d).
- [x] The Tool 2 submit confirmation shows the "changed N of 50" count; submit is never blocked (D67 c, D54).
- [x] Responsible = internal user or external party on Tools 3, 4, 5, in the UI and in the exports (D55).
- [x] D63 a–c done; one assessment request on the assessment pages.
- [x] Tests, lint, Prettier and build green in both apps; coverage thresholds raised.
- [x] Checked in the browser (throwaway DB, light and dark): login, dashboard, overview, Tools 1–5, Documents, Library + PdfViewer, Guidance panel, Activity log; one export per tool and one project workbook compared with the official sheets (headers, merges, widths, fills, fonts).
- [ ] Owner has checked light/dark screens, login page and one export of each tool against the official workbook.

## Result

- **Exports** (`frontend/src/utils/excelExport/`): `tool1Sheet.js` (new, official layout), `tool2Sheet.js`, `tool34Sheets.js`, `tool5Sheet.js` (ported from v2 and aligned cell by cell with the official sheets), `sheetKit.js` (shared cell helpers, RTL for Arabic), `exportMeta.js` (status labels, file names, footers), `workbooks.js` (one tool, or the project workbook). `exportTool(tool, data, status)` / `exportProjectWorkbook(data)` save through `utils/saveBlob`; `file-saver` was removed.
- **Compared with the official workbook** (one export per tool from the real app + one project workbook, read back with ExcelJS): every official label, fill and font size matches; widths match; merges match except (1) Tool 1 adds C22:E22 and C23:E23 so the potential-impact text wraps in the empty template cells, (2) Tool 2 leaves out seven stray merges the official sheet has outside its print area (L27:N27, N13:X15, O18:Y20). Tool 2 "TOTAL PROJECT IMPACT" uses the app rule (highest level scored) instead of the official sheet's "most frequent level" formula, so the export agrees with the app. The official Tool 2 has one Note cell per domain (K merged), so per-question notes are listed there as "n. note". Tool 5 "Ranking" shows the recorded ranking (the official template has "Negligible (...)" placeholders).
- **Chunk size:** `vendor-excel` stays 930 kB minified (256 kB gzip). ExcelJS 4.4.0 is the latest release and ships one browser bundle; the "bare" build only drops polyfills it needs. `chunkSizeWarningLimit` is 1000 for that chunk; every other chunk keeps the 500 kB warning through a small Vite plugin (`warnLargeChunks` in `vite.config.js`). It is loaded only on export.
- **npm audit:** 17 moderate findings, all from exceljs's Node-side dependencies (`uuid < 11.1.1`, `minimatch`/`glob` via archiver/unzipper). No newer exceljs release fixes them (4.4.0 is the latest; only 4.4.1-prerelease exists); `npm audit fix --force` would downgrade to exceljs 3.4.0. Left as is.
- **Request counts:** assessment gateway 4 (`/auth/me`, workspace, assessment, screening), scoring 4 (+ `/lookups` instead of the screening); `useAssessment` no longer loads `/lookups`, which it never used. Table in `05-frontend-data.md`.
- **Viewers:** SEMP cards say "View Tool", the assessment gateway "View Assessment", monitoring "View Data" without the edit actions.

## Out of scope
SEMP Plan, v3 modules (phase 9), general polish (phase 10).

## Found during phase

- **Downloads fail when `UPLOADS_DIR` is under a folder whose name starts with a dot** (phase 7b code, not changed here). `fileStorage.service.send` calls `res.sendFile(absolutePath, { dotfiles: "deny" })`; `send` checks every segment of the absolute path, so a path such as `.../.claude/worktrees/.../uploads` (or `/home/esms/.data/uploads` on a server) answers 500 "Forbidden" for every project file and library PDF. Fix: `res.sendFile(storedName, { root: <uploads dir>, dotfiles: "deny" })`, so only the stored part is checked. Found in the browser check (the worktree lives under `.claude/`); worked around there with `UPLOADS_DIR` outside it. Owner decides where it goes (phase 10a or 11).
- Remaining `bg-gray-100` and similar non-token utilities in older screens (assessment, monitoring, timeline, header): general polish, phase 10. The raw hex dark backgrounds and the `emerald`/`teal` utilities were replaced with tokens here.
- The browser pane does not load Google Fonts, so icons show their names until the font arrives; local fonts are D37 (phase 11).
