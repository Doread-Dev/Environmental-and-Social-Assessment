# Phase 25 — Administration (v2.5)

**Goal:** the Administration area on the new access model: Users, Roles & permissions, Access,
Activity log and Deleted items.

**Decisions:** D82, D85, D89, D91 (last sign-in), D65 (+ D4, D22, D60).

**Design reference:** concept "Lists, Administration and New project" (Users, Roles & permissions,
Access, Activity log, Deleted items), "Patterns, group B" (give access; delete for good); playgrounds
[lists-and-admin](../design/lists-and-admin.html), [patterns-tasks](../design/patterns-tasks.html).

**Depends on:** 21 (the Give access panel), 17, 19.

## Scope
1. **Administration in the sidebar** lists only the sections the person may use (a specialist sees
   only Access).
2. **Users:** name and email, job title, access as a short line ("Focal Point · 4 projects"),
   status ("No access yet" highlighted), last sign-in; a row opens a side panel with Details /
   Access / Security (temporary password, deactivate; never delete, D4); nobody changes their own
   access or deactivates themselves.
3. **Roles & permissions:** one matrix (permissions as rows in groups with plain sentences, roles as
   columns with people counts), click to change with a save bar, "organisation only" marks, locked
   admin permissions, "New role" in a side panel (name, description, start from a role); on a phone:
   pick a role, see its permissions as a list.
4. **Access:** "who works on what" list, the strip "New projects need a team" with "Assign team",
   the Give access panel from phase 21.
5. **Activity log:** the D65 actions plus every access and role change, each entry a sentence with
   the person and their role at the time, a row opens details with "As it was before", filters
   (action, person, project, date) and export; never edited or deleted.
6. **Deleted items:** list with the days left, Restore and "Delete now…", bulk selection; deleting
   an archived project for good stays on the project (phase 21).
7. Takes the items of these screens from [the findings list](ui-findings.md).

## Tests
- Sections shown per permission (admin, specialist, others).
- Users: panel tabs; temporary password flow; self-deactivate and self-access refused in the UI.
- Roles: change a permission and save; locked permissions cannot be unticked; new role from an
  existing one; phone list view.
- Access: assign team from the strip; the project leaves the strip once it has a team.
- Activity log: filters; details show the previous state; export.
- Deleted items: restore, delete now (confirmation), bulk; days left.
- Both languages and themes, three widths; icons on the text line; nothing clipped.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Frontend tests, lint, Prettier, build; E2E admin flows updated and run; coverage floors raised.
- [ ] Old Settings pages removed (listed in Result).
- [ ] The owner has walked Administration as admin and as specialist.

## Found during phase
