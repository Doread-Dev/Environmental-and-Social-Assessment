# Phase 10 — UI polish

**Goal:** a consistent, finished-looking app.

**Decisions:** D43 (+ STYLE_GUIDE rules in `CLAUDE.md`).

## Tasks
- Fill the known empty fields: "Approved By" / "Position" on approved screening and assessment summaries (from status history, D16).
- Consistent states on every page: loading, empty, error with retry, read-only (viewer, locked, archived).
- Forbidden classes from STYLE_GUIDE removed everywhere (`dark:bg-gray-*`, `border-gray-200`, raw hex); all colors via tokens.
- Consistent page headers, buttons, toasts, confirm dialogs, date format, status badges.
- Responsive check (mobile menu, tables scroll horizontally).
- Accessibility basics: labels on inputs, focus rings, keyboard on locked buttons and dialogs, contrast in both themes.
- Remove leftover dev pages (`ComponentShowcase` if present), dead components, unused utils.
- Archive UI: archived badge, filter on project list, restore button (D17); in the archive list a "Delete permanently" action for `admin` only, with a confirm dialog (`DELETE /projects/:id/purge`, D60). An admin page for the audit log (`GET /audit-logs`).

### Owner-reported screens
- **Assessment gateway** (`pages/project-workspace/assessment/AssessmentGatewayPage.jsx`, "Begin Assessment Process"), reported by the owner with UI problems. Seen so far, to confirm with the owner before fixing:
  - The page header with the step indicator (Screening → Assessment → SEMP) gets cut off at the top when the page scrolls, and the indicator stops at SEMP (no Monitoring).
  - Left accent border on the main card and a decorative icon in its corner that does nothing; "Not Started" badge differs from the status badges elsewhere.
- **Right-hand "Project Context" card** (`components/assessment/ProjectContextCard.jsx`): redo it the way the Overview card was redone in phase 1 (`ProjectSiteCard` → `ProjectDetailsCard`). Drop the placeholder map image, show real project data only (location, component, start/end with the full date, "Not specified" when empty) by reusing `ProjectDetailsCard`, and keep "Screening approved by" from `status_history` (D16). No project title (the sidebar already shows it). Same card wherever `ProjectContextCard` is used.

## Process
- Walk every screen with the demo project in light and dark mode; list issues at the bottom of this file first, agree the list with the owner, then fix.

## Done when
- [ ] Issue list closed or explicitly deferred by the owner.
- [ ] Lint 0 warnings in `src/` (or remaining ones listed with reason). Known from phase 0: 10 × `react-refresh/only-export-components` (contexts export hooks/constants next to providers, `components/ui/Toast.jsx`, `routes/index.jsx`) — split hooks/constants into their own files.

## Found during phase
