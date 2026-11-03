# Phase 8 — UI & Excel from v2

**Goal:** bring the approved v2 visuals and the official-format Excel exports into this repo.

**Decisions:** D49, D51, D52, D54, D55, D59 (+ D25 already done in phase 6).

## Tasks

### Brand palette (D49)
- Port the token changes from v2 `frontend/src/index.css` (primary `#008c54`, `primary-soft`, `primary-border`, green scale, dark tokens, risk C/F colors, focus colors using `var(--color-primary)`). Check every screen in light and dark mode.
- Do **not** port the `emerald-*`/`teal-*` overrides blindly: replace remaining raw `emerald`/`teal` utilities with tokens instead (STYLE_GUIDE).

### Login page (D51)
- Port v2 `pages/auth/LoginPage.jsx` layout with local assets from v2 `frontend/src/assets/auth/` (AKF logo, Syria map — rename files without spaces) and `public/favicon.png`; title "ESMS System – Environmental & Social Management System".
- Keep "Contact your system administrator" (no forgot-password link).

### Excel exports (D52)
- Port v2 builders: `utils/excelExport/assessmentWorkbook.js` (Tool 2), `tool34Workbook.js` (Tools 3 & 4), `tool5Workbook.js` (Tool 5) and their wrappers; keep Tool 1 (`exportScreening.js`) unless the owner wants it changed. `sempWorkbook.js` + `exportSempPlan.js` come in phase 9 (locked).
- Add `responsible_text` to exports (Tools 3, 4, 5).
- Compare each export with the official workbook "AKF-S Environmental and Social Assessment Tooles 2025.xlsx" (ask the owner for the file) — headers, merges, widths.
- Keep ExcelJS lazy-loaded; note the chunk size here.

### Tool screens
- Assessment scoring: show the backend default (all Negligible), user changes only what differs; submit always enabled (D54).
- Tools 3, 4, 5: "Responsible" control = user picker **or** "External / other party" free text (D55) — port the idea from v2 `components/semp/ResponsibleSelect.jsx`.
- Navigation stays as this repo: one "SEMP – Tools 3 & 4" entry; overview label "Risk Level" (D59).
- Viewers: no Start/Edit buttons anywhere (from `allowed_actions`).

## Tests
- Workbook builders run in Node tests: sheet names, header rows, merges, one data row, responsible user vs text.
- Responsible control switches modes and clears the other value.

## Done when
- [ ] Owner has checked light/dark screens, login page and one export of each tool against the official workbook.

## Out of scope
SEMP Plan, v3 modules (phase 9), general polish (phase 10).

## Found during phase
