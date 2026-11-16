# Phase 16 — Component library and shared patterns (v2.5)

**Goal:** the v2.5 components (layer 2) and the shared parts of the patterns (layer 3) exist in the
app as tested, documented building blocks, so the page phases only assemble them.

**Decisions:** D86, D87, D88 (stale-save list, save bar), D94.

**Design reference:** concept "Components, group 1 / 2 / 3", "Patterns, group A / B"; playgrounds
[components-inputs](../design/components-inputs.html), [components-data](../design/components-data.html),
[components-nav](../design/components-nav.html), [patterns-workflow](../design/patterns-workflow.html),
[patterns-tasks](../design/patterns-tasks.html).

**Depends on:** 15.

## Scope
1. **Actions and inputs (group 1):** Button (four variants, three sizes, working state that keeps its
   width and refuses a second press, unavailable with a reason), icon button with tooltip and name,
   "⋯" menu (keyboard, destructive last, unavailable items with a reason), field anatomy (label,
   hint, error, "(optional)"), text and number inputs (`dir="auto"`, unit inside), long text (grows,
   30,000 counter in the last 10 %), native select, combobox with search (single and multiple),
   checkbox (with mixed), radio, switch, segmented control, our own date field with calendar
   (Levantine months in Arabic), quarter picker showing filled / empty / gap, upload (Choose files
   first, drop as a shortcut, per-file states), search box.
2. **Data display (group 2):** collection table (toolbar, filter chips in the URL, sort, bulk bar,
   pager, five states, phone cards), working table (clamped text, edited-row bar, problem cells,
   "only rows with problems"), key facts, people, activity, notification item, counts, meter,
   charts (sequential bars, coverage matrix, segmented bar) with "Show as table".
3. **Navigation and overlays (group 3):** page header (breadcrumb, title, state, Export, one primary,
   "⋯"), tabs, status strip, notices, offline bar, toasts (Undo, errors stay), confirmation dialog
   (focus on Cancel; typed confirmation variant), side panel (400 px, full screen on a phone), tooltip,
   skip link. Keyboard rules: Esc closes the top layer only, focus returns, Ctrl S on pages with a
   save bar.
4. **Shared pattern parts:** the save bar and its six states; the stale-save handling in
   `useProjectSave`: "Load the latest version" keeps the person's unsaved changes in a side list
   ("Now" / "Yours", Apply mine / Add it again; nothing merged on its own); the unsaved-changes
   dialog (Leave without saving / Stay / Save and leave); the "Before you submit" checklist; the
   result sentence block.
5. **A components page for developers** (`/dev/components`, development builds only) showing each
   component in its states, both languages and themes, used by the tests and by the owner.
6. Old shared components that the new ones replace are marked for removal when their last page is
   rebuilt (listed in Result), not left to rot.

## Tests
- Each component: its states (default, hover/focus where testable, unavailable with reason, error,
  working), keyboard behaviour (menu arrows and letter jump, Esc focus return, dialog focus trap,
  combobox), accessible names, RTL rendering (`dir="rtl"` mirrors arrows and order).
- Upload: several files, one refused (type, size from the server limit) while the others continue;
  cancel one.
- Collection table: filters and page live in the URL; the five states render; bulk bar replaces the
  toolbar.
- Save bar: the six states; Ctrl S saves; discard shows a toast with Undo that restores.
- Stale save: a 409 `STALE_VERSION` opens the dialog; "Load the latest version" refetches and lists
  the person's changes; "Apply mine" puts a value back.
- Icons: every component's icon is on the text line (box height = line height) in both languages.
- Contrast: token pairs used by the components pass WCAG AA (test over the token table).

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] `npm test`, `npm run lint`, `npm run format:check`, `npm run build`; coverage floors raised.
- [ ] The components page shown to the owner, both languages and themes.

## Found during phase
