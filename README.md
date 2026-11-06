# ESMS — Environmental and Social Management System

A workflow application for the environmental and social due diligence of development projects
(Aga Khan Foundation – Syria). A project goes through five tools in a fixed order:

**Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management activities (Tool 3) + Mitigation plan
(Tool 4) → Monitoring (Tool 5)**

Editors fill in and submit each tool; environmental specialists approve or reject screenings and
assessments; viewers read. Projects keep their documents; a reference library holds organisation
guidance shown next to the tools; admins manage users and read a log of critical actions. Every tool
exports to Excel. The app runs offline on one internal server.

## Repository

| Folder | What |
|---|---|
| [`backend/`](backend) | Node.js 26 + Express 4 + Mongoose 8 REST API (`/api/v1`); in production it also serves the frontend |
| [`frontend/`](frontend) | React 19 + Vite 7 + TanStack Query + Tailwind CSS 4 single-page app |
| [`e2e/`](e2e) | Playwright end-to-end tests of the golden flows |
| [`deploy/`](deploy) | server install, backup and restore for Windows Server and Ubuntu |
| [`docs/`](docs) | technical documentation |
| [`plan/`](plan) | the rework plan: decisions (D1–D76) and phases |

## Quick start (development)

Needs Node 26 and a local MongoDB.

```bash
cd backend && npm ci
```

Create `backend/.env` with at least `MONGODB_URI`, `JWT_SECRET` (32+ characters) and
`FRONTEND_URL=http://localhost:5173` ([all settings](docs/developer-guide.md#backendenv)), then:

```bash
cd backend && npm run seed && node scripts/create-admin.js && npm run dev
```

```bash
cd frontend && npm ci && npm run dev
```

Open http://localhost:5173 and sign in with the admin you created.

Tests: `npm test` in `backend/` and `frontend/`; the end-to-end flows with `npm test` in `e2e/`
([developer guide](docs/developer-guide.md#tests)).

## Documentation

- [Technical docs](docs/README.md): architecture, API reference, data models, roles and
  permissions, workflow rules, developer guide, style rules.
- [Server installation and backups](deploy/README.md) (for IT).
- [Decisions](plan/DECISIONS.md) and [phase plan](plan/README.md).
