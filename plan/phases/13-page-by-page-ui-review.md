# Phase 13 — Page-by-page UI/UX review

**Goal:** every screen looks finished, consistent and behaves well, so the version ships clean — enterprise-grade QA/UX is release scope (D72). Phase 10 unified what is shared across the app (components, tokens, type scale, states); this phase walks **every element of every screen, one by one, UI and UX**, and cleans what is left.

**Decisions:** D71, D72 (+ D43, D49, STYLE_GUIDE rules in `CLAUDE.md`).

**Fed by every phase (D72):** each phase writes the UI/UX issues it finds below, under its screen, instead of fixing them on the side.

**Depends on:** 12.

## Method
1. **Inventory:** list every screen (each route, plus its modals, side panels and empty/locked/archived/read-only variants) at the bottom of this file.
2. **Walk each screen** the way phase 10a walks the unhappy paths: light and dark mode, desktop and mobile (375 px), each role that sees it (admin, specialist, editor, viewer). Record an issue list per screen.
   - **Test data:** not only the demo project. Create a project for each state the screen can show (screening draft / submitted / rejected / approved; assessment not started / in progress / submitted / rejected / approved; SEMP empty / partly described / complete; monitoring empty / baseline only / quarters filled; archived) and walk the screen on each.
3. **Agree the list with the owner** before fixing.
4. **Fix**, using the shared components from phase 10 (no new one-off styles), with a test for each fix (D39).

## UX scope (owner, D72)
- **Unsaved changes:** every page with editable input warns, in an in-app dialog (never the browser's), when the user leaves after editing without saving — sidebar or any in-app link, Back, the browser's Back, refresh and tab close. If phase 10a built the shared guard, check that every edit page uses it (screening, assessment metadata / methods / scoring / review, Tools 3 and 4, Tool 5, project create/edit, user form, library form); list any page that does not.
- **No `window.confirm` / `alert` / `prompt` anywhere:** every confirm, approve, reject, delete, archive, restore, purge and submit happens inside the page as the app's own card or `ConfirmDialog`. Audit all of them and record where each one lives (the style guard already fails on a new `window.confirm`, `alert` or `prompt`).
- **Repeated areas unified across the tools:** the same thing must look and behave the same in Tool 1–5. For each area, list the tools it appears in and the differences, then unify on one shared component:
  - the review / approval card and the approve / reject section (reason input, buttons, states);
  - the reviewer block: Approved By / Rejected By, Position, date, recommendations / reject reason;
  - the status header (title, tool label, status badge, dates);
  - the submit bar / sticky footer (Back, Save, Submit; disabled and loading states);
  - the save and export buttons (place, label, icon, "Saved" feedback, export availability);
  - the Guidance button, the locked / read-only / archived notices, empty tables.
- **Select boxes:** decide with the owner whether to replace the native look with a designed select / listbox (accessible: keyboard, screen reader, focus; dark mode; long option lists, groups, search where useful). Phase 10's single `Select` (`components/ui/Select.jsx`) is the base, so the change happens in one place.
- **Tables (owner):**
  - **Tool-specific tables keep their own layout:** the Tools 3/4 editable grid, the monitoring quarters table, the assessment scoring table.
  - **General tables share one look and one visual identity:** project list, Settings → Users, Settings → Projects, activity log, library, project documents, dashboard lists.
  - **Check each table for:** size and density (row height, padding, font size); column widths and overflow on mobile (horizontal scroll, what stays visible); header style; sorting and filtering and where their controls sit; pagination; empty, loading and error rows; row actions (placement, icons, confirmation); conflicts between tables (the same thing behaving differently).
  - **Method:** list every table below, mark it general or tool-specific, and converge the general ones on the shared `Table` component and the phase 10 controls (`Select`, `Input`, `Pagination`, `Button`, `StatusBadge`, `EmptyState` / `LoadingState` / `ErrorState`, `ConfirmDialog`).
- **Every element:** labels, help texts, placeholders, error messages (wording, `extractErrorMessage`), tab order and focus, hover/active/disabled states, truncation of long text (titles, names, Arabic text right-to-left), numbers and dates, icons, spacing and alignment, scroll areas, print views.

## Tests
- Every fix from the agreed issue list has a test next to the code it changes (D39).
- Unsaved-changes guard: one test per edit page (screening, assessment metadata / methods / scoring / review, Tools 3 and 4, Tool 5, project create/edit, user form, library form): after an edit, an in-app link and the browser Back open the app dialog (Save / Discard / Stay); without an edit they do not.
- Style guard (`src/test/styleGuard.test.js`): `window.confirm` allow-list empty; `alert` / `prompt` stay rejected.
- Repeated areas: each unified area (review card, approve/reject section, reviewer block, status header, submit bar, save/export buttons) has a component test, and each tool page renders that shared component (one assertion per tool).
- General tables: each renders through the shared `Table` and shows the shared empty, loading and error states (one test per table); row actions that change data ask in `ConfirmDialog`.
- Arabic text: displayed user text (project title, location, descriptions) carries `dir="auto"` (test on the project list, the project header and one tool page).
- Select box: if the owner picks a designed select / listbox, its tests cover keyboard (arrows, Enter, Escape, type-ahead), screen-reader roles, disabled options, groups and dark-mode classes.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Every screen walked in light/dark and desktop/mobile; issue list closed or explicitly deferred by the owner.
- [ ] Lint 0 errors, Prettier clean, build OK; coverage floors raised.

## Issue list (per screen)

Items found during phase 10 that are page-specific (not shared) are listed here so this phase starts from them.

### From phase 10 (page-specific, not fixed there)
- **Page wrappers:** several pages inside `ProjectLayout` add their own outer padding/max-width (SEMP overview, Documents, Monitoring overview/data entry, Assessment review), so their gutters differ from the other pages.
- **Headers:** the document-style headers (Screening summary, Assessment review) and the Tools 3/4 and Monitoring headers use the shared title classes but not `PageHeader`; decide per page.
- **Assessment gateway:** the "cut off at the top when scrolling" report could not be reproduced with the demo project (its assessment is approved, so the router shows the review); the double padding was removed. **Check it on a new project created for this, whose screening is approved and assessment not started** (and one in progress), with the owner.
- **Small text:** `text-[10px]` / `text-[11px]` labels remain (workflow bar labels, responsible user/external switch, step numbers).
- **Raw buttons left by design:** sidebar/nav items, icon buttons, radio-style cards (risk category), table row actions — check each for size and focus ring.
- **Settings → Users:** the name column wraps ("Check Admin (you)") at medium widths.
- **Monitoring overview:** its "Export" button and the category cards still have their own styles.
- **Dashboard metric cards:** coloured icon tiles (blue/orange/red) — confirm with the owner against the AKF palette.
- **Login / change password:** check the type scale after `PAGE_TITLE` in both themes.
- **Phase 10a (D72 c, UI/UX only; behaviour was fixed there):**
  - **Tools 3/4 grid (`components/semp/EditableCell.jsx`):** cells are `dir="ltr"`, so Arabic text in them is laid out left to right; a very long cell (3,000+ characters) makes its row hundreds of pixels tall (no clamp or expand); the editable cells have no accessible name.
  - **Tool 5 data entry:** the lock card says "complete Tool 2" and links to the assessment, but the gate is Tools 3 and 4 (the route guard redirects first, so it is rarely seen).
  - **Assessment metadata / methods for a viewer or a locked assessment:** "Save and Continue" is disabled and there is no other forward button (only the sidebar).
  - **Assessment scoring:** "Save as Draft" gives no success feedback (Tools 3–5 show "Saved").
  - **New dialogs of phase 10a** (unsaved changes, stale save, session expired) use the shared `Modal`/`Button`/`Input`; check their wording, focus order and layout in both themes and at 375 px with the owner.
  - **Error boxes:** Tools 3/4 still draw their own red error box (raw red classes) instead of `Alert`.
- **Arabic text direction (found in the D72 font check):** Arabic project titles and locations in the Projects list (and likely other lists, headers and cards) are aligned left-to-right. User-entered text needs `dir="auto"` wherever it is displayed, not only in the inputs; check every screen with an Arabic test project.
