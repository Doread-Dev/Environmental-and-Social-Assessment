# ESMS technical documentation

For developers and IT. Written from the code in phase 12 (D44, D76); when a page and the code
disagree, the code wins and the page is fixed. The user guide for every role is phase 14 (D76 1).

| Page | What |
|---|---|
| [Architecture](architecture.md) | the apps, the single process, the backend pipeline and conventions, the frontend data layer, guards, screens and Excel export |
| [API reference](api-reference.md) | every route under `/api/v1`, per router: permission, project-access check, body, response |
| [Data models](data-models.md) | every MongoDB collection, its fields, references and indexes |
| [Roles and permissions](roles-and-permissions.md) | the six roles, the permission matrices (checked against the code), `allowed_actions`, accounts |
| [Workflow rules](workflow-rules.md) | the tool order and gates, statuses and transitions, locks, bulk saves, stale saves, archive / delete / purge, the critical-actions log, transactions |
| [Developer guide](developer-guide.md) | setup, environment, commands, tests (backend, frontend, E2E, docs), CI and coverage, conventions |
| [Style rules](style-guide.md) | today's UI rules — replaced by the design system of phase 13 |

Server installation, backups and restore (runbooks for IT):

| Page | What |
|---|---|
| [deploy/README.md](../deploy/README.md) | the server shape, settings, replica set, backups, moving servers, logs, health, HTTPS, Vercel |
| [deploy/INSTALL-WINDOWS.md](../deploy/INSTALL-WINDOWS.md) | Windows Server install, step by step, offline |
| [deploy/INSTALL-LINUX.md](../deploy/INSTALL-LINUX.md) | Ubuntu install, step by step, offline (not yet run on a real server) |

Planning and decisions: [plan/README.md](../plan/README.md) (phases and progress),
[plan/DECISIONS.md](../plan/DECISIONS.md) (D1–D76), [plan/V3_VISION.md](../plan/V3_VISION.md).
