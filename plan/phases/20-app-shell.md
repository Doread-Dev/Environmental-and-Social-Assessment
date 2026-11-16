# Phase 20 — App shell and navigation (v2.5)

**Goal:** the new shell around every page: sidebar and project spine, tablet rail, phone drawer and
step bar, header with search, Help panel, notifications bell and account menu.

**Decisions:** D84, D83, D90 (bell), D81, D87, D94 (+ D64, D78 3–4).

**Design reference:** concept "App shell", "Components, group 3"; playgrounds
[app-shell-options](../design/app-shell-options.html) (option 1), [components-nav](../design/components-nav.html).

**Depends on:** 16, 18 (notifications, step states).

## Scope
1. **Sidebar:** main menu outside a project; the spine inside a project (back, name, code, category,
   Overview, Tools 1–5 with diamond and state, sub-parts of the open tool, Documents with count, the
   reserved Activities slot, Collapse); Administration at the bottom only with an admin permission;
   current item with three cues.
2. **Tablet rail (640–1199):** icons and numbered diamonds with tooltips; ☰ opens the full menu as a
   drawer. **Phone (< 640):** drawer from ☰; inside a project the "Step n of 5 · state" bar with
   previous / next and the step list.
3. **Header:** logo, context slot ("AKF Syria"), quick search (Ctrl K: projects first by name, code,
   place, then pages; recent projects when empty; only accessible items), Help "?", bell with unread
   count, account menu (My account, Language, Theme, Sign out). Language and theme change at once and
   are saved on the account.
4. **Help panel:** "Help with this page" side panel with two tabs, the guide section of this page
   (D78 4, by place key) and the library guidance linked to it (D64), plus "Open the full guide";
   full screen on a phone. The floating Help button and the "Guidance (n)" header button go (D78 6
   replaced).
5. **Bell panel:** latest items, each opens its place and becomes read, "Mark all as read", link to
   the Notifications page (the page itself is phase 24).
6. **Offline bar, skip link, keyboard rules** in the shell.
7. Old layouts (`MainSidebar`, `SempFullWidthLayout`, …) removed once every page is on the new shell;
   pages not yet rebuilt keep working inside it.
8. Takes the shell items from [the findings list](ui-findings.md).

## Tests
- Sidebar: main menu vs spine by route; Administration hidden without the permission; spine states
  from the workflow; a restricted reader's menu.
- Breakpoints: rail at tablet width, drawer and step bar at phone width (E2E viewport checks).
- Search: Ctrl K opens it; results only from accessible projects (a reader of one project sees one);
  keyboard selection.
- Help panel: opens the section of the current page; shows linked guidance; full screen on phones.
- Bell: count from the server; opening an item marks it read and navigates.
- Account menu: language switch flips `dir` and saves; theme switch applies and saves.
- RTL: the shell mirrors; icons on the text line in both languages.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E run (navigation steps updated); coverage floors
      raised.
- [ ] The owner has walked the shell in both languages, both themes and the three widths.

## Found during phase
