# Developer guide

How to set up, run, test and change ESMS. The rules for every change (and the phase plan) are in
[`plan/README.md`](../plan/README.md); what we build is decided in
[`plan/DECISIONS.md`](../plan/DECISIONS.md).

## Setup

- **Node 26 LTS** (`.nvmrc`, `engines` in each `package.json`). Lockfiles are committed: install
  with `npm ci` in `backend/`, `frontend/` and `e2e/` (each is independent; there is no root
  package). esbuild's install script is approved via `allowScripts` in `frontend/package.json`
  (npm 11).
- **MongoDB** locally (developed against 8.3; CI and E2E use 7.0 because MongoDB 8 does not start on
  Linux kernels 6.19–7.0.13, see [`deploy/README.md`](../deploy/README.md)). Database `esms`.
- **Line endings:** the repo is LF (Prettier `endOfLine: lf`). On Windows set
  `git config core.autocrlf false` in the clone; a machine-wide CRLF default makes ESLint report
  thousands of `Delete ␍` warnings. Keep new files LF.

### `backend/.env`

Read from the folder of `backend/package.json`, whatever the working folder (gitignored).

| Variable | Notes |
|---|---|
| `MONGODB_URI` | required, e.g. `mongodb://127.0.0.1:27017/esms` |
| `JWT_SECRET` | required, at least 32 characters (the server exits otherwise) |
| `PORT` | default 3000 |
| `HOST` | default all interfaces; `127.0.0.1` on the server behind the proxy |
| `NODE_ENV` | `development` locally, `production` on the server |
| `JWT_EXPIRES_IN` | default `12h` |
| `FRONTEND_URL` | CORS origin; **no CORS at all when unset** — set `http://localhost:5173` for `npm run dev` |
| `FRONTEND_DIST` | default `../frontend/dist` (served when it has an `index.html`) |
| `TRUST_PROXY` | default off; `true` = one proxy hop, or a hop count / IP list — only behind IIS / nginx |
| `UPLOADS_DIR` | project files and `library/`, default `backend/uploads` (gitignored; **backups must include it**) |
| `MAX_UPLOAD_MB` | default 10 |
| `BACKUP_DIR`, `BACKUP_KEEP_DAYS`, `MONGODB_TOOLS_DIR` | backups ([`deploy/README.md`](../deploy/README.md)) |

### `frontend/.env`

`VITE_API_URL` (must include `/api/v1`) and `VITE_API_TIMEOUT`. Without `VITE_API_URL`,
`npm run dev` calls `http://localhost:3000/api/v1` and a production build calls `/api/v1` on its own
origin (the server). Vercel sets it.

### First users

There is no open registration. Create the first admin with `node scripts/create-admin.js`; then an
admin creates users in Settings → Users. Joi `email()` validates top-level domains, so `@*.local` /
`@*.test` addresses are refused — use `@example.com` for test users.

## Commands

### Backend (`cd backend`)

| Command | What |
|---|---|
| `npm run dev` | `node --watch src/server.js` (port 3000). Health: `GET http://localhost:3000/health` |
| `npm start` | `node src/server.js` without watching (`NODE_ENV` comes from `.env`: `production` on the server); also serves `frontend/dist` when built |
| `npm run seed` | upserts the 4 lookup collections (impact categories, questions, indicators, job titles) by a stable key; safe to re-run (rows keep their `_id`); deletes nothing; creates no users |
| `node scripts/create-admin.js` | creates an admin (the only way to create the first user); asks, or reads `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`; never prints the password; fails if the email exists; no forced change |
| `node scripts/reset-password.js [--activate]` | break-glass reset straight in MongoDB (`RESET_EMAIL` / `RESET_PASSWORD`); `--activate` also reactivates; clears a pending forced change |
| `SEED_EMAIL=… SEED_PASSWORD=… [DEMO_PASSWORD=…] node scripts/seed-demo-project.js` | through the real API with an **admin** login: one demo user per role (`demo.<role>@example.com`), then `[DEMO] Al-Salam Water Network Rehabilitation` through all 5 tools (sending versions like the app) and one generated sample library PDF linked to Tool 4. Deletes previous demo copies first; stops before changing anything on a database without lookups; refuses `NODE_ENV=production`; never prints passwords |
| `node scripts/clean-test-data.js` | deletes ALL domain data. Destructive: ask before running; refuses `NODE_ENV=production` |
| `npm test` / `test:watch` / `test:coverage` | Vitest + Supertest (needs MongoDB) |
| `npm run lint` / `lint:fix` | ESLint flat config (CommonJS, Node globals, `eslint-config-prettier`) |
| `npm run format` / `format:check` | Prettier, backend style: double quotes, semicolons, width 100 |

Server scripts (phase 11; shared code in `scripts/lib/`): `backup.js`, `restore.js`,
`test-backup-restore.js`, `init-replica-set.js [--check]`, `check-server.js [--mongodb-version x]`
— see [`deploy/README.md`](../deploy/README.md).

### Frontend (`cd frontend`)

| Command | What |
|---|---|
| `npm run dev` | Vite on http://localhost:5173 |
| `npm run build` / `npm run preview` | production build into `dist/` (the icon font becomes a subset of the icons in `src/`, `scripts/iconFont.js`) |
| `npm test` / `test:watch` / `test:coverage` | Vitest + React Testing Library + jsdom |
| `npm run lint` / `lint:fix` | ESLint 9 flat config (Prettier as a lint rule) |
| `npm run format` / `format:check` | Prettier on `src/`: no semicolons, single quotes, 2 spaces, width 100, trailing commas es5 |

### E2E (`cd e2e`)

| Command | What |
|---|---|
| `npm test` | **the one command:** builds the frontend into `e2e/.build/dist` (with `VITE_API_URL` empty), then runs every flow |
| `npm run test:nobuild` | runs the flows on the last build |
| `npm run report` | opens the last HTML report |
| `npm run lint` / `format:check` | ESLint and Prettier (frontend style) |

Once per machine: `npx playwright install chromium` (CI uses `--with-deps --no-shell`).

## Tests

Every behaviour change and every fix ships with a test (D39). Every module with logic has a unit or
integration test — hooks, utils, services, controllers, middlewares, pages with forms or actions;
plain display components without logic may stay untested (D76 3).

### Backend

- Tests in `backend/tests/` (`*.test.js`, ESM syntax; app code is loaded via `createRequire` in
  `tests/helpers/app.js`, so tests share the app's mongoose instance).
- They run against `esms_test`: `MONGODB_URI_TEST` if set, else `MONGODB_URI` with `_test` appended
  to the database name. `tests/setup/env.js` refuses any database whose name does not end in
  `_test`; every collection is emptied before each file and after each test. Files run one at a
  time.
- Helpers (`tests/helpers/fixtures.js`): `createUser(role)`, `loginAs(role)` → `{ user, token }`
  via the real login, `createProject({ stage })`, `seedLookups()` (same data as `npm run seed`),
  `ROLES`, `currentVersion(url)` / `withVersion(url, body)` (the version a client that just loaded
  the record would send, D62). `tests/helpers/routes.js` → `listRoutes()`: every mounted route with
  its middleware chain (route-table tests).
- **Transaction path:** the local MongoDB service is standalone, so locally the code runs without
  transactions. To run the suite on the transaction path, start a throwaway
  `mongod --replSet rs0` on another port and dbpath, run
  `MONGODB_URI=mongodb://127.0.0.1:<port>/x node scripts/init-replica-set.js`, then
  `MONGODB_URI_TEST=mongodb://127.0.0.1:<port>/esms_test?replicaSet=rs0 EXPECT_TRANSACTIONS=true npm test`.
  Never change the local MongoDB service's configuration.
- `tests/docs.test.js` keeps these docs in step with the code (see below).

### Frontend

Tests sit next to the code as `*.test.js(x)`; setup in `src/test/setup.js`. Page tests render
through `src/test/renderApp.jsx` (the app's providers and root route; `path` may be a list of
history entries) with a mocked `@/services/api` (`src/test/utils.jsx`: `mockGet`, `ok`, `fail`,
`signIn`, `workspaceFixture`, `lookupsFixture`). `src/test/styleGuard.test.js` enforces the
[style rules](style-guide.md); `src/routes/requestCounts.test.jsx` the request budgets.

### E2E (Playwright, phase 12)

- One spec per golden flow in `e2e/tests/` (`01-…` to `11-…`, plus `05a-…`), named after the flow;
  each flow creates its own users and projects (never the demo project) and checks the visible UI
  **and** the stored state through the API (status, `status_history`, audit entries).
- Runs against the production-style single process: `scripts/start-server.mjs` refuses a database
  whose name does not end in `_test`, drops it, fills the lookups, creates the bootstrap admin
  (`e2e.admin@example.com`, as `create-admin.js` does), then runs `backend/src/server.js` with
  `NODE_ENV=production`, serving the E2E build. Every server setting is set there, so nothing comes
  from a developer's `backend/.env`.
- Database `esms_e2e_test` (`E2E_MONGODB_URI` to change it), port **3100** (`E2E_PORT`), never the
  dev ports 3000 / 5173. Chromium only (D76 2), one worker, no retries: a flaky test is a bug.
  Web-first assertions, no fixed sleeps.
- Helpers in `e2e/support/`: `api.js` (an API client: users per role, projects at a given step,
  saves, an expired token), `ui.js` (sign-in, request counting), `excel.js` (ExcelJS reading),
  `files.js` (a generated PDF), `test.js` (the `test` every spec imports, with `newUserPage()`).
  Nothing is routed or mocked: downloads and PDF previews use the real API.
- **Download managers (IDM):** download managers such as Internet Download Manager take over any
  fetched response that carries `Content-Disposition`, and the page then gets an empty 204. The app
  no longer sends that header on its file endpoints (phase 12), so IDM no longer breaks the PDF viewer
  or downloads for users. When running E2E on a machine with IDM, its browser integration may still
  pop up for the files the flows save (flows 5 and 10); turn it off, or exclude the Playwright
  browser, if it does.
- On Windows, if Playwright's Chromium fails to start from `%LOCALAPPDATA%\ms-playwright` with a
  "side-by-side configuration" error, install the browsers elsewhere with
  `PLAYWRIGHT_BROWSERS_PATH` (seen on one machine in phase 12).

### Docs tests

`backend/tests/docs.test.js` fails when `backend/docs/` or `frontend/docs/` come back, when a route of
the route table is missing from the [API reference](api-reference.md), when the matrices in
[roles and permissions](roles-and-permissions.md) differ from `config/permissions.js`, or when a
relative link in `docs/`, the READMEs or `CLAUDE.md` points at a missing file.

## CI and coverage

`.github/workflows/ci.yml` runs on every PR and on pushes to `main` / `Development`:

| Job | What |
|---|---|
| **Backend** | MongoDB 7.0 standalone service; `npm ci`, lint, `format:check`, `test:coverage` (`EXPECT_TRANSACTIONS=false`) |
| **Backend (replica set)** | MongoDB 7.0 as single-node `rs0` (`docker run`, initiated by `scripts/init-replica-set.js`); MongoDB Database Tools 100.20.1 with a SHA-256 check; the whole suite on the transaction path (`EXPECT_TRANSACTIONS=true`), incl. the real backup/restore test |
| **E2E** | MongoDB 7.0 replica set; backend installed with `--omit=dev`; frontend built with an empty `VITE_API_URL`; e2e lint + `format:check`; Chromium; every flow. The Playwright report and traces are uploaded on failure |
| **Deploy scripts** | `bash -n` + shellcheck on `deploy/linux/*.sh`, `node --check deploy/build-release.mjs` |
| **Frontend** | `npm ci`, lint, `format:check`, `test:coverage`, `build` |

Merge only when green. New `*.test.js(x)` files and new specs run automatically; add a job or step
only for a new kind of check. Coverage HTML is uploaded as an artifact and the job summary shows the
numbers. `coverage.thresholds` in `backend/vitest.config.mjs` and `frontend/vitest.config.js` are a
floor: `test:coverage` fails below them. Raise them at the end of a phase (rounded down to the new
numbers); never lower them. A green CI does not mean new code is tested.

## Before finishing a change

`npm test` + `npm run lint` + `npm run format:check` in each app you touched, `npm run build` for the
frontend, and the E2E run (`cd e2e && npm test`) when a flow is affected. Lint stays at 0 errors.

## Conventions

- Backend endpoint conventions: [architecture → conventions](architecture.md#conventions-for-endpoints).
- Frontend data layer and guards: [architecture → frontend](architecture.md#frontend).
- UI: [style rules](style-guide.md); UI or UX issues found while working go into
  [the phase 13 file](../plan/phases/13-page-by-page-ui-review.md) (the v3 UI list, D77), not fixed
  on the side (D72 c).
- Language: UI and code in English; Arabic only as user data.
- There is no `v3/` folder: the v3 modules are not ported (D70); their designs are in
  [`plan/V3_VISION.md`](../plan/V3_VISION.md).
- The `Environmental-and-Social-Assessment-main version 2/` prototype is git-ignored, unreviewed
  third-party work: never edit or commit it ([`plan/V2_INVENTORY.md`](../plan/V2_INVENTORY.md)).
- The official AKF workbook and the library's Annex 1 PDF are client documents: never commit them.

## Git

Remote `origin` = github.com/Doread-Dev/Environmental-and-Social-Assessment. Branches: `main`
(default) and `Development`; changes flow via pull requests between them. No AI attribution in
commits or pull requests.
