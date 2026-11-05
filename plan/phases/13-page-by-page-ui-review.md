# Phase 13 — Page-by-page UI review

**Goal:** every screen looks finished and consistent, so the version ships clean. Phase 10 unified what is shared across the app (components, tokens, type scale, states); this phase cleans what is left on each page.

**Decisions:** D71 (+ D43, D49, STYLE_GUIDE rules in `CLAUDE.md`).

**Depends on:** 12.

## Method
1. **Inventory:** list every screen (each route, plus its modals, side panels and empty/locked/archived/read-only variants) at the bottom of this file.
2. **Walk each screen** the way phase 10a walks the unhappy paths: light and dark mode, desktop and mobile (375 px), with the demo project and each role that sees it (admin, editor, viewer). Record an issue list per screen.
3. **Agree the list with the owner** before fixing.
4. **Fix**, using the shared components from phase 10 (no new one-off styles), with a test for each fix (D39).

## Done when
- [ ] Every screen walked in light/dark and desktop/mobile; issue list closed or explicitly deferred by the owner.
- [ ] Lint 0 errors, Prettier clean, build OK; coverage floors raised.

## Issue list (per screen)

Items found during phase 10 that are page-specific (not shared) are listed here so this phase starts from them.

### From phase 10 (page-specific, not fixed there)
- **Page wrappers:** several pages inside `ProjectLayout` add their own outer padding/max-width (SEMP overview, Documents, Monitoring overview/data entry, Assessment review), so their gutters differ from the other pages.
- **Headers:** the document-style headers (Screening summary, Assessment review) and the Tools 3/4 and Monitoring headers use the shared title classes but not `PageHeader`; decide per page.
- **Assessment gateway:** the "cut off at the top when scrolling" report could not be reproduced with the demo project (its assessment is approved, so the router shows the review); the double padding was removed — check with the owner on a project whose assessment is not started.
- **Small text:** `text-[10px]` / `text-[11px]` labels remain (workflow bar labels, responsible user/external switch, step numbers).
- **Raw buttons left by design:** sidebar/nav items, icon buttons, radio-style cards (risk category), table row actions — check each for size and focus ring.
- **Settings → Users:** the name column wraps ("Check Admin (you)") at medium widths.
- **Monitoring overview:** its "Export" button and the category cards still have their own styles.
- **Dashboard metric cards:** coloured icon tiles (blue/orange/red) — confirm with the owner against the AKF palette.
- **Login / change password:** check the type scale after `PAGE_TITLE` in both themes.
