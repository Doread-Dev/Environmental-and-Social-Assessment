# Phase 10 — UI polish

**Goal:** a consistent, finished-looking app — the **system-wide pass** (D71).

**Decisions:** D43, D71 (+ STYLE_GUIDE rules in `CLAUDE.md`).

**Scope (D71, owner 2026-11-05):** this phase unifies everything that is shared or obviously inconsistent across the app — typography (one font family, one type scale), form controls (inputs, select boxes, textareas, checkboxes), colours via tokens, buttons, badges, cards, page headers, tables, modals/confirm dialogs, toasts, date/number formats, loading/empty/error/read-only states, focus rings and basic accessibility — with one shared component or helper per kind, every usage migrated, and a guard test against forbidden colours and raw selects. It is visual and consistency work only: no workflow rule, export or data change. **Page-specific findings go to [phase 13](13-page-by-page-ui-review.md)** (page-by-page review), not into this phase.

## Unify (system-wide)
- Inventory by searching the code: font families/sizes and heading styles, raw `<select>` vs a shared Select, inputs/textareas, colour classes that bypass the tokens (forbidden classes, raw hex, `gray-*` where a token exists, leftover emerald/teal), button variants, badges/status pills, date helpers, spinners and loading/empty/error patterns, confirm dialogs, toasts.
- Converge on one shared component or helper per kind (`components/ui`, `utils`), reusing what exists; migrate every usage; light and dark mode everywhere.
- One font family (AKF-consistent, offline-safe: no new internet dependency, D37 — an internet-loaded font is noted for phase 11) and a consistent type scale.
- One styled Select used everywhere (Responsible, ranking, filters, place filter, role pickers…), native `<select>` underneath.

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

## Tests
- Shared components: variants, disabled, error, read-only and dark classes of `Select`, `Input`, `Textarea`, `Badge` / `StatusBadge`, `Button`; `LoadingState` / `EmptyState` / `ErrorState` (retry); `ConfirmDialog` (confirm, cancel, busy); `Modal` (focus in and back, Escape, unique ids, close button); `PageHeader`.
- Date, reviewer (D16) and status-badge helpers.
- Archive UI: archive / restore / delete / purge each ask in the dialog and call the right endpoint; buttons only with the matching allowed action; purge hidden without `project.purge`; the archived list is requested with `archived=true`; errors are shown.
- Gateway: four steps incl. Monitoring; start card without accent border / decorative icon, shared badge. Project Context card: no map, no title, "Not specified", approver from status history. `ArchivedNotice`.
- Guard: forbidden classes, raw hex, light gray, emerald/teal, `bg-white`/`bg-black`, raw `<select>`, new `window.confirm`, `alert`/`prompt`, `toLocale*String`, icon spans without `aria-hidden`.
- Font (D72): no Google text font, font stack, bundled `@fontsource` files with exact versions, only loaded weights.

## Process
- Walk the main screens with the demo project in light and dark mode, desktop and 375 px. Page-specific findings go to [phase 13](13-page-by-page-ui-review.md) (D71); this phase fixes what is shared.

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [x] Shared components/helpers, one per kind, every usage migrated (see "Result" below).
- [x] Guard test against forbidden colours, raw hex, light gray classes, emerald/teal, raw `<select>`, new `window.confirm`, `toLocale*String` dates and icon text read by screen readers (`src/test/styleGuard.test.js`).
- [x] Lint 0 warnings in `src/`: the 7 `react-refresh/only-export-components` cases split (`contexts/useAuth.js`, `contexts/useTheme.js`, `components/ui/useToast.js`, `utils/roles.js`, `pages/NotFoundPage.jsx`, `LoadingState` as the route fallback).
- [x] Owner-reported gateway and Project Context card done as described above (confirm on a project whose assessment is not started: the demo project's is approved, so its gateway shows the review).
- [ ] Owner walk-through of the PR; remaining page-level items are in phase 13.

## Result (2026-11-05)
- **Font (D72, owner review):** IBM Plex Sans + IBM Plex Sans Arabic everywhere (`--font-sans` in `@theme`, so Tailwind's base and `font-sans` use it), self-hosted from `@fontsource` (`src/fonts.js`, weights 400–700), so it works offline; the Google Fonts import of the text font is gone (`src/test/fonts.test.js`). The three `font-black` uses became `font-bold` (Plex stops at 700). Type scale in `components/ui/typography.js` (`PAGE_TITLE`, `PAGE_DESCRIPTION`, `SECTION_TITLE`).
- **Form controls:** `components/ui/formControl.js` (`controlClasses`, sizes, label/error/helper, read-only look) used by `Input`, `Select`, `Textarea`; `Select` takes `options` or `<option>/<optgroup>` children, an optional placeholder and a borderless `cell` variant. All 6 raw selects (ranking, responsible, activity-log filter, users status/role filters, library place filter) and the project-list dropdown filters use it; `Dropdown` removed.
- **Colours:** every light-mode `gray-*`, `bg-white`, raw hex (`#11d452` focus ring, CSS scrollbars) replaced by tokens.
- **Buttons:** one `Button` (focus-visible ring, AKF primary, danger `red-600`); hand-styled primary/secondary buttons and the Tools 3–5 save buttons migrated.
- **Badges:** `StatusBadge` + `utils/statusBadges.js` for every status (steps, records, projects, archived); `SempStatusBadge` and the dashboard `ProjectStatusBadge` removed; progress bars use the same colours.
- **States:** `LoadingState`, `EmptyState`, `ErrorState` (with "Try again"), `ArchivedNotice` (read-only); hand-made spinners and error blocks migrated.
- **Dialogs:** `ConfirmDialog` (`ConfirmDeleteModal` / `ConfirmUserActionModal` built on it); `Modal` uses the shared overlay stack for Escape, unique ids, moves focus in and back, shows its close button.
- **Toasts:** `status` role (`alert` for errors), full width on phones.
- **Dates:** one format, `5 Nov 2026` (`formatDate`), `5 Nov 2026, 14:30` (`formatDateTime`, activity log), ranges with "–".
- **D16:** `utils/reviewer.js` fills "Approved By" / "Position" (and "Screening approved by") from `approved_by` / `reject_by`, else the last `status_history` entry.
- **Archive UI (D17, D60):** Settings → Projects lists active or archived projects; archive, restore, delete, admin "Delete permanently" (purge), each behind `allowed_actions` and a ConfirmDialog; the Projects page has an "Archived projects" view with the Archived badge; every page of an archived project shows the read-only notice; the overview header shows the real status instead of a fixed "Active".
- **Accessibility:** Material Symbols spans are `aria-hidden`; the closed mobile menu is invisible to keyboard and screen readers (and no longer bleeds the project title into the page); labels linked on the migrated fields.
- **Tests (by item):** shared components → `src/components/ui/sharedComponents.test.jsx`; helpers → `src/utils/displayFormats.test.js`; archive UI → `src/components/settings/ProjectsManagementSection.test.jsx`; gateway, Project Context card, `ArchivedNotice` → `src/components/assessment/assessmentGateway.test.jsx`; guard → `src/test/styleGuard.test.js`; font → `src/test/fonts.test.js`.
- **Removed (dead):** `ComponentShowcase`, `utils/apiTest.js`, `ApprovalSection`, `AssessmentApprovalSection`, `AssessmentReviewCard`, `ScreeningSummaryCard`, `TableRowActions`, `ProgressBar`, `ProgressStepper`, `RadioGroup`, `Dropdown`, `utils/workflowStatuses.js`, unused constants/helpers; the project header's "Help" button that did nothing.

## Found during phase
- Three `window.confirm` unsaved-changes prompts remain (Tools 3, 4, 5); phase 10a replaces them with its shared guard (the style guard allows only these three files).
- `scripts/seed-demo-project.js` fails with an unclear 400 on a database without the lookup seed (already noted in phase 9).
