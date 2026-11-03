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

## Process
- Walk every screen with the demo project in light and dark mode; list issues at the bottom of this file first, agree the list with the owner, then fix.

## Done when
- [ ] Issue list closed or explicitly deferred by the owner.
- [ ] Lint 0 warnings in `src/` (or remaining ones listed with reason). Known from phase 0: 10 × `react-refresh/only-export-components` (contexts export hooks/constants next to providers, `components/ui/Toast.jsx`, `routes/index.jsx`) — split hooks/constants into their own files.

## Found during phase
