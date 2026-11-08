# Roles and permissions

Source of truth: [`backend/src/config/roles.js`](../backend/src/config/roles.js) and
[`backend/src/config/permissions.js`](../backend/src/config/permissions.js), the only role →
permission map (D35, D66 b). Routes name a permission (`requirePermission('screening.approve')`),
services ask `can(user, name)`; nothing else lists roles. v3 replaces this map with per-user
capabilities without touching routes or services. `backend/tests/docs.test.js` fails when the
matrices below no longer match the code.

## Roles

| Role | Label in the app | Role groups |
|---|---|---|
| `admin` | Administrator | editors, specialists, library managers, admin |
| `environmental_specialist` | Environmental Specialist | editors, specialists, library managers |
| `program_manager` | Program Manager | editors |
| `project_manager` | Project Manager | editors |
| `environmental_focal_point` | Environmental Focal Point | editors |
| `viewer` | Viewer | — (reads only) |

Groups (`config/roles.js`): **editors** create, update and submit; **specialists** approve/reject
screenings and assessments and delete/archive/restore projects (a specialist may approve their own
work); **library managers** manage the reference library (its own list on purpose, D64 b);
**admin** manages users (D21), purges archived projects (D60) and reads the audit log (D65).

## General permissions

Returned by `GET /auth/me` as `permissions` (`permissionsFor(user)`).

<!-- matrix:general -->
| Permission | admin | environmental_specialist | program_manager | project_manager | environmental_focal_point | viewer |
|---|---|---|---|---|---|---|
| `create_project` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `edit` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `export` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `approve` | ✓ | ✓ | | | | |
| `manage_users` | ✓ | | | | | |
| `delete_project` | ✓ | ✓ | | | | |
| `archive_project` | ✓ | ✓ | | | | |
| `purge_project` | ✓ | | | | | |
| `read_audit_log` | ✓ | | | | | |
| `manage_library` | ✓ | ✓ | | | | |
<!-- /matrix:general -->

`export` is every role except viewer (D28a). Reading is open to every signed-in role: a `GET`
route without `requirePermission` answers every role, the viewer included.

## Action permissions

The names routes and `allowed_actions` use; each is granted by one general permission.

<!-- matrix:actions -->
| Action | Granted by |
|---|---|
| `project.create` | `create_project` |
| `project.edit` | `edit` |
| `project.delete` | `delete_project` |
| `project.archive` | `archive_project` |
| `project.restore` | `archive_project` |
| `project.purge` | `purge_project` |
| `screening.create` | `edit` |
| `screening.edit` | `edit` |
| `screening.submit` | `edit` |
| `screening.approve` | `approve` |
| `screening.reject` | `approve` |
| `assessment.create` | `edit` |
| `assessment.edit` | `edit` |
| `assessment.submit` | `edit` |
| `assessment.approve` | `approve` |
| `assessment.reject` | `approve` |
| `semp.edit` | `edit` |
| `monitoring.edit` | `edit` |
| `files.edit` | `edit` |
<!-- /matrix:actions -->

## Per project: `allowed_actions`

`allowedActions(user, project, workflow)` in `services/workflow.service.js` = the user's permission
of the same name **and** the workflow condition (D35). Examples: `screening.submit` only while the
screening is `draft` or `rejected`; `assessment.create` only once the screening is approved;
`project.delete` only while nothing is approved; `project.purge` only when archived. On an archived
project only `project.restore`, `project.delete`, `project.purge` and `export` can be allowed.
`GET /projects` and `GET /projects/:id/workspace` return them; the frontend shows buttons from them
(`can('screening.approve')`, …) and never decides a rule itself (D30). See
[workflow rules](workflow-rules.md).

## Project access (D66 a)

Every project-scoped route has one check from `middlewares/projectAccess.js`, which calls
`services/access.service.js` (`assertProjectAccess(user, projectId)` → 404, not 403;
`projectFilterFor(user)` → a `Project` filter). In v2 it allows every signed-in user; v3 puts
project membership behind it. Details in [architecture](architecture.md#request-pipeline).

## Accounts

- No open registration. The first admin comes from `backend/scripts/create-admin.js`; then an admin
  creates users in Settings → Users (any role). A new account and an admin reset get a 12-character
  temporary password, shown once, with `must_change_password` (D22): until the user picks their own
  password every endpoint except `GET /auth/me` and `PUT /auth/password` answers
  `403 { code: "PASSWORD_CHANGE_REQUIRED" }`.
- Password policy: `PASSWORD_MIN_LENGTH` (6) in `validators/auth.validator.js` (security, so D57
  does not remove it); login only requires a value.
- Users are never deleted, only deactivated (D4). A deactivated user cannot sign in (403 "Account is
  deactivated", only after a correct password) and existing tokens answer 401 on the next request.
  The last **active** admin can be neither deactivated nor given another role (409).
- Changing your own password does not end your other sessions (tokens stay valid until they
  expire, `JWT_EXPIRES_IN`, default 12 h).
