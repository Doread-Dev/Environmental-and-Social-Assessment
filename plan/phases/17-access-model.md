# Phase 17 — Access model: permissions, roles, scopes, assignments (v2.5, backend)

**Goal:** per-person access as the client needs it now: which projects each person sees, edits,
approves and exports, managed by the admin, built behind the D66 seams so v3 can add country/office
scopes without changing the model.

**Decisions:** D82, D83 (+ D65, D66, D4, the v2.0.1 rule that nobody changes their own access).

**Design reference:** concept "Access model in v2.5", "Screens follow permissions",
"Lists, Administration and New project" (Roles & permissions, Access); playground
[lists-and-admin](../design/lists-and-admin.html), [patterns-tasks](../design/patterns-tasks.html)
("Give access").

**Depends on:** v2.0.x. Runs next to phases 15–16 (frontend, other sessions); this phase changes the
backend and the frontend only where `GET /auth/me` / `allowed_actions` change shape.

## Scope
1. **Model:** `Permission` names stay in code (`config/permissions.js`, grouped: Projects, Workflow
   tools, Library, Administration, each with a plain sentence for the UI); **roles** become data
   (name, description, permission list, "organisation only" marks on permissions that only work
   organisation-wide); **assignments** = user + role + scope (`organisation` or a list of projects).
   A person's access is the union of their assignments.
2. **Starting roles:** the six v2 roles become editable starting roles with today's permissions,
   except: the Program Manager gets "approve or return"; the Reader (today's viewer) **gets** Export
   (D28a replaced). New permissions: "manage access" (admin, Environmental Specialist), "manage
   roles" (admin), "read the library" (every starting role except the Reader; today every role
   reads it). The Administrator's "Manage users" and "Manage roles" cannot be removed (nobody
   locks everyone out).
   Existing users get an organisation-wide assignment of their current role (the seed and
   `create-admin` follow).
3. **Checks:** `can(user, permission, project?)` and `projectFilterFor(user)` read the assignments;
   `assertProjectAccess` refuses projects outside the person's scope (404, so names do not leak);
   lists, dashboard counts, search, notifications and exports only contain accessible projects.
   `allowedActions` and `GET /auth/me` return what the person may do (organisation-wide and per
   project).
4. **Endpoints:** roles (list with people count, create from an existing role, edit permissions,
   delete when unused), assignments (list "who works on what" with filters, give, change, remove),
   "projects that need a team"; people on a project. You cannot change your own assignments.
5. **New project:** the creator is assigned to the new project with their own role; people with
   "manage access" are listed for the notification (sent in phase 18).
6. **Log:** every role change and every assignment given, changed or removed goes through
   `audit.service.record()` in `atomic()` (D65), with the person's role at the time.
7. **Docs:** `docs/roles-and-permissions.md` rewritten for the model; API reference and data models
   updated; the permission-matrix check of `docs.test.js` follows the new source.

## Tests
- Union of assignments: two assignments on different projects give access to both, nothing else.
- A reader with one project: project list, dashboard, search, a direct project URL (404), files,
  exports and help all hide other projects, names and counts included.
- "Organisation only" permissions do nothing in a project-scoped assignment.
- Starting roles: the seeded permissions equal today's, with the owner changes (Program Manager
  approves, Reader exports) and the new permissions; a Reader cannot read the library.
- Locked admin permissions cannot be removed; nobody edits their own assignments (403).
- Every role/assignment change writes one audit entry in a transaction (both replica-set and
  standalone paths).
- The route table: every project-scoped route still goes through the project-access check and names
  a permission (existing tests extended to the new routes).
- Creating a project assigns the creator to it.

## Done when
- [ ] Every item under Tests has a test (file names listed in Result).
- [ ] Backend and frontend `npm test`, lint, Prettier; E2E run (roles in the flows updated);
      coverage floors raised; `seed-demo-project.js` creates assignments.
- [ ] Docs updated in the same change.

## Found during phase
