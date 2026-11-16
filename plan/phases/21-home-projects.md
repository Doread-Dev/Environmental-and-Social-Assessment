# Phase 21 — Home, Projects, project overview, new project (v2.5)

**Goal:** the pages people open first, rebuilt from the work-queue, collection-list and
unit-overview patterns, plus creating a project and the project's lifecycle actions.

**Decisions:** D85, D83, D82 (team), D89, D90 (gaps on the home), D93.

**Design reference:** concept "Core pages" (Home, Project overview), "Lists, Administration and New
project" (Projects, New project), "Patterns, group B" (new project and its team; archive, delete,
restore); playgrounds [core-pages](../design/core-pages.html), [lists-and-admin](../design/lists-and-admin.html),
[patterns-tasks](../design/patterns-tasks.html), [components-data](../design/components-data.html).

**Depends on:** 20, 17, 18, 19.

## Scope
1. **Home (work queue):** sections built from permissions: "Needs your action" (returned first with
   the reason on the row, new projects that need a team), "Waiting for your review", "Monitoring
   gaps", "My projects"; organisation counts and the "where the projects are" chart only for
   organisation scope; a restricted reader sees only their projects with Export.
2. **Projects list:** tabs My / All (organisation scope) / Archived (people who can archive); columns:
   project with code and place, the five diamonds, where it stands, "Needs attention" written as a
   reason, last update, Export; filters and sort in the URL; "Export list" of the filtered list; the
   five states; phone cards.
3. **Project overview:** facts, the five steps on one line with states, "Next step" card with one
   button, "People on this project" with the **Give access** side panel (built here: person,
   role with what it allows, where, the result sentence; remove access with Undo; phase 25 reuses
   the same panel from the user and the Access page), recent activity, documents; "Export workbook" in
   the header.
4. **New project / Edit details:** a page with sections (Project, Location, Dates), field errors
   while typing, the sentence about the creator and the team; after creating, the overview with
   "Start screening".
5. **Lifecycle:** "⋯" menu with Archive (at once, Undo), Delete… (unavailable with the reason when
   approved work exists; otherwise the dialog → Deleted items 30 days), Restore on archived projects,
   Delete for good on archived projects (admin, typed project code).
6. Takes the items of these screens from [the findings list](ui-findings.md).

## Tests
- Home sections per permission set (editor, approver, both, reader with one project, admin);
  returned items first with their reason; gaps section from the server summary.
- Projects: tabs per scope; URL keeps filters; export list contains only the filtered, accessible
  projects; the five states.
- Overview: next-step card per workflow state; people list; Give access visible only with the
  permission.
- New project: end date before start shows the field error; create → overview; the creator is on
  the people list.
- Lifecycle: archive + Undo restores; delete unavailable with approved work; delete → Deleted items;
  purge button enabled only after the exact code.
- Both languages and themes, three widths: E2E screenshots or visual checks per page; icons on the
  text line; nothing clipped.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E flows updated and run; coverage floors raised.
- [ ] Old pages and components replaced here are removed (listed in Result).
- [ ] The owner has walked the pages.

## Found during phase
