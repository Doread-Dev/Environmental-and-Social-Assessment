# Phase 12a — Release readiness (v2.0.0)

**Goal:** hand v2 to the client as a finished, clean **v2.0.0** that the organisation's IT can
install on their internal, offline server: the project folder polished, the docs true to the code,
the visible day-one bugs fixed, a smaller icon font, a version that IT can read off the running
app, and handover docs for IT and for the owner.

**Decisions:** D77 (+ D37, D38, D75 for the server, D72 c for UI findings).

**Depends on:** 12. Runs next to [phase 14](14-user-guide.md) (user guide, another session); this
phase does not touch `plan/phases/14-user-guide.md`, `docs/user-guide/**`, the root `README.md` or
`docs/README.md`.

## Scope

1. **Clean the project folder** (no behaviour change):
   - leftover or unused files (e.g. `frontend/public/vite.svg`, the unused
     `components/ui/Accordion.jsx` and its test, empty barrel files, dead exports, stale scripts and
     package fields, old config, empty folders);
   - stale comments that name phases as "later" or "TODO";
   - inconsistent file names;
   - `.gitignore` gaps.
   Every file removed or moved is listed in Result with its reason; anything unclear is written
   down for the owner.
2. **Docs check, item by item against the code:** `docs/*.md` (not the user guide, not
   `docs/README.md`), `deploy/*.md`, `backend/README.md`, `frontend/README.md`, the `e2e/` docs and
   `CLAUDE.md`: commands that run, env vars that exist, ports, and what the docs say was tested
   (the Windows service and scheduled task were registered and checked by the owner's service test
   kit, phase 11 "Found during phase"). `docs/style-guide.md` is the v2 style guide (no "until
   phase 13").
3. **Small visible fixes** taken from the phase 13 list (bugs a user meets on day one; nothing from
   the design system), each with a test, each moved out of the phase 13 list into Result:
   - Assessment metadata: no Arabic "(في حال الحفظ)" next to Officer Name/Position.
   - Assessment metadata: the four text areas are labelled by their visible question.
   - Monitoring data entry, read-only: no "Cancel" button.
   - Header "Export Excel" (screening, assessment, Tools 3–5): disabled until the tool page is
     ready, so no click is lost.
   - Tool 5 lock card: names Tools 3 and 4 (the real gate) and links to the SEMP overview.
   - Assessment scoring "Save as Draft": the same "Saved" feedback as Tools 3–5.
   - Arabic user text (project title, location, descriptions): `dir="auto"` where it is displayed
     (lists, headers, cards, the Tools 3/4 grid cells).
   - Tools 3/4 pages (`SempFullWidthLayout`): the same mobile/tablet menu as the other project
     pages, with matching lock/done states.
4. **Icon font:** subset Material Symbols to the icons the app uses, at build time and offline-safe
   (no runtime download; the axes the app uses kept). A test fails when an icon name used in
   `src/` is missing from the subset.
5. **Version 2.0.0:** `version` in the three `package.json` files; `GET /health` returns it; the
   app shows it in one small place; root `CHANGELOG.md` with the v2.0.0 entry (contents and known
   limits); the release builder puts the version in the archive name.
6. **IT handover:** `deploy/IT-CHECKLIST.md` (server, installers, certificate and DNS, ports,
   antivirus exclusion, service accounts, backups and restore check, updates, questions for IT),
   linked from `deploy/README.md`.
7. **Owner handover:** `deploy/OWNER-RUNBOOK.md` (build a release, ship an update, first admin and
   users, restore, logs, when the app is down, where each doc lives).

## Tests
- Cleaning: lint, Prettier, all tests and the build still pass; nothing imports a removed file.
- Assessment metadata: no Arabic text in the page; each of the four text areas is found by its
  question as accessible name.
- Monitoring data entry for a viewer (read-only): no "Cancel" button; an editor still has it.
- Header "Export Excel": disabled while no tool page has said it is ready, enabled once one has,
  disabled again when it unmounts; a click sends the export event.
- Tool 5 lock card: names Tools 3 and 4 and links to the SEMP overview, not to the assessment.
- Assessment scoring "Save as Draft": shows "Saved" after a successful save.
- Arabic text: `dir="auto"` on the project list (title, location), the project header, a project
  card on the dashboard and a Tools 3/4 grid cell.
- Tools 3/4 mobile menu: the SEMP layout has a menu button below `lg`; the menu lists the project
  tools with the same lock/done state as the desktop sidebar.
- Icon font: every icon name in `src/` (literals and the names in the config/lookup maps) is in
  the subset; the subset file is built from the bundled font, with no network access.
- Version: `GET /health` returns `version: "2.0.0"` (= `backend/package.json`); the three
  `package.json` files and `CHANGELOG.md` agree; the app shows the version; the release name
  carries the version (deploy scripts test).
- Docs: `backend/tests/docs.test.js` passes (links in the new deploy docs included).

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [x] `npm test`, `npm run lint`, `npm run format:check` in each app touched; frontend `npm run
      build`; `node deploy/build-release.mjs` run once; coverage floors raised.
- [x] Removed/moved files listed below; open questions for the owner listed below.
- [x] `plan/README.md` progress table complete.

## Result

Branch `claude/phase-12a-release-v2-eb1eee`. D77 written; phase 13 marked "moved to v3" in
`plan/README.md` and linked from `V3_VISION.md`; phase 14 now depends on 12a.

### 1. Cleaning — files removed or moved
| File | Why |
|---|---|
| `frontend/public/vite.svg` | Vite template icon, referenced nowhere (the tab icon is `favicon.png`) |
| `frontend/src/components/ui/Accordion.jsx` (+ its tests in `navigationPrimitives.test.jsx`, the barrel export) | used nowhere (phase 12 finding); the assessment and monitoring accordions are their own components |
| `frontend/src/components/charts/index.js`, `components/forms/index.js` | empty barrels ("add exports as components are created"), imported nowhere; their folders are gone with them |
| `backend/src/db/.gitkeep` | the folder has `seed.js`, the placeholder was left over |

No file was moved or renamed: the names already follow one scheme per app (backend
`name.layer.js`, frontend PascalCase components / camelCase hooks and utils, plan `NN-name.md`).

Also cleaned (no behaviour change): dead exports `isNetworkError`, `isAuthError` (`services/api.js`)
and `FOCUS_RING` (`ui/formControl.js`); unused barrel re-exports (`utils/index.js`: constants,
categoryIcons, impactCalculations, workflowSteps; `services/index.js`: the commented
`reportService` line); the unused Arabic `labelAr` / `descriptionAr` fields in
`utils/impactLevels.js` and `utils/screeningDisplay.js` (the UI is English, D-context); the dead
`/data/` chunk rule in `vite.config.js` (there is no `data/` folder); stale comments (seed
"can be extended later", "Matches design from: 17….html" on Tools 3/4, "moved from data/…",
install.ps1 "starts after MongoDB" since PR #25); `backend/package.json`: name
`express-mongodb-backend` → `esms-backend`, the template description, the fake `build` script
(`echo 'Build completed'`, used nowhere), the empty `keywords` / `author`; `private: true`.
`.gitignore`: grouped and commented; added `.claude/worktrees/`, `.claude/settings.local.json`,
`desktop.ini`, patterns for the client documents (`AKF-S*.xlsx`, `Annex*1*.pdf`); dropped entries
for files that no longer exist (`Static UI/`, `doc-decisions.md`, `documentation-blueprint.md`,
`docs-architecture.json`, `backend/exports/`, duplicate `node_modules` / `dist` lines).

### 2. Docs check (against the code)
Checked: env vars, `npm run` scripts and repo paths named in `CLAUDE.md`, `docs/*.md`, `deploy/*.md`,
`backend/README.md`, `frontend/README.md` (a script compared every name with the code; all exist).
Fixed:
- `deploy/README.md`, `INSTALL-WINDOWS.md`, `INSTALL-LINUX.md`, `install.sh`: the Windows service and
  backup task **were** registered and checked by the owner's service test kit (31 checks); the
  Linux path is still not run on a real server; Windows Server editions not yet.
- `install.sh` named the wrong guide steps for Node (2 → 3) and MongoDB (3 → 4); `install.ps1`'s
  header used another NSSM path than the guide.
- `esms.env.example`: `\backup-server\esms` → `\\backup-server\esms`.
- `developer-guide.md`: `npm start` does not set `NODE_ENV` (it comes from `.env`).
- `docs/style-guide.md` is "the v2 style guide" (no "until phase 13"); same in `architecture.md`,
  `CLAUDE.md`, `developer-guide.md` (UI findings go to the phase 13 file, the v3 UI list).
- Release name `esms-<version>-<date>-<commit>`, `/health` with `version`, the icon subset rule
  (style guide, developer guide).
- `e2e/` has no docs of its own (they are in the developer guide); nothing wrong there.
- Not touched (other session): root `README.md` and `docs/README.md` still say "D1–D76" and
  "replaced by the design system of phase 13" — noted for the user-guide / main session.

### 3. Small visible fixes (moved out of the phase 13 list)
| Fix | Label change? | Test |
|---|---|---|
| Assessment metadata: the Arabic "(في حال الحفظ)" next to Officer Name/Position is now English **"(on submit)"** — the officer becomes the submitter on submit (`utils/statusTransition.js`), so "if saved" was also wrong | yes: "(on submit)" | `components/assessment/metadataSections.test.jsx` |
| Assessment metadata: each text area is labelled by its question (`<label htmlFor>`) and described by its hint | no | same file |
| Monitoring data entry: no "Cancel" for a read-only user | no (the button is hidden) | `pages/project-workspace/monitoring/MonitoringDataEntryPage.test.jsx` |
| Header "Export Excel" (screening, assessment, Tools 3–5): disabled until the tool page has its data and answers the export (`components/export/exportEvents.js`: `useExportHandler` / `useExportReady`) | no | `components/export/exportEvents.test.jsx`, `MonitoringDataEntryPage.test.jsx`, `components/layout/SempFullWidthLayout.test.jsx` |
| Tool 5 lock card (data entry **and** overview, same text): names Management Activities (Tool 3) and the Mitigation Plan (Tool 4) and leads to the SEMP overview | yes: button **"Go to SEMP"** (was "Go to Assessment") | `MonitoringDataEntryPage.test.jsx`, `MonitoringOverviewPage.test.jsx` |
| Assessment scoring "Save as Draft" shows **"Saved"** (check icon, disabled) after a successful save, until the next change — as Tools 3–5 | yes: "Saved" state | `pages/project-workspace/assessment/AssessmentScoringPage.test.jsx` |
| `dir="auto"` on displayed user text: project list, dashboard list, Settings → Projects, project header, project sidebar, mobile menu, Project Details / Context card, screening summary and assessment review (project title, reject reason, recommendations), Tools 3/4 cells (`dir="ltr"` → `auto`, `text-left` → `text-start`) | no | `src/test/arabicDirection.test.jsx` |
| Tools 3/4 (`SempFullWidthLayout`): menu button + the project `MobileMenu` below `lg` (also on the locked view); the mobile menu now shows a done check for the expandable tools (Assessment, SEMP) like the desktop sidebar | no | `components/layout/SempFullWidthLayout.test.jsx` (menu states = desktop sidebar states) |

### 4. Icon font
`frontend/scripts/iconFont.js` + the Vite plugin `materialSymbolsSubset()` (build only): every
word of `src/` (non-test) that the font draws as one icon is kept, through the icons' private-use
code points with `noLayoutClosure` (HarfBuzz via `subset-font` 2.9.0 / `harfbuzzjs` 1.6.4 /
`fontverter` 2.0.0, exact devDependencies, WebAssembly, no network). Result: **258 icons,
4.0 MB → 169 kB**, all four axes kept (FILL is used, wght, opsz, GRAD), a new hashed file name
whenever the icon set changes. Dev and tests keep the full font. No icon name comes from the API,
so the subset is safe. Test: `src/test/iconFont.test.js` (names found where icons are written —
JSX text, `<Icon name>`, `icon="…"`, `icon: '…'` in maps, ternaries — must be icons of the full
font **and** of the subset; the subset equals the icon words of `src/`; unused icons are gone; the
axes stay; `fetch` is never called; the plugin writes the font next to a copy of the package CSS).

### 5. Version 2.0.0
`version` 2.0.0 in the three `package.json` and lockfiles; `GET /health` →
`{ success, message, version }`; the user menu (header, top right) ends with **"ESMS v2.0.0"**
(`utils/appVersion.js`, read from `frontend/package.json` at build time); root `CHANGELOG.md`;
`deploy/build-release.mjs` names the release `esms-<version>-<date>-<commit>` (stops when the
three versions differ) and adds `CHANGELOG.md` and the version to `VERSION`; both install scripts
copy `CHANGELOG.md` to the server. Tests: `backend/tests/health.test.js`,
`backend/tests/release.test.js`, `frontend/src/components/layout/Header.test.jsx`.
Release build run once: see "Found during phase".

### 6–7. Handover docs
`deploy/IT-CHECKLIST.md` (server OS and sizing with the reasoning, the kernel check, installers
with versions and download pages, certificate and DNS, ports, antivirus exclusion, service
accounts, backup owner and restore check, updates, 11 questions for IT) and
`deploy/OWNER-RUNBOOK.md` (build a release, update the server, first admin and users, restore,
logs, when the app is down, where each doc lives), both linked from `deploy/README.md` and checked
by the link test in `backend/tests/docs.test.js` (which now also covers `CHANGELOG.md` and
`deploy/*.md`).

### Checks and coverage
Backend: 966 tests (+ 15 replica-set only), lint 0, Prettier clean; coverage 96.8 / 91.2 / 95.9 / 97.4 %
(statements / branches / functions / lines): the floors 96/91/95/97 already equal these rounded
down. Frontend: 531 tests, lint 0, Prettier clean, build OK; coverage 86.6 / 80.4 / 81.7 / 88.0 %:
floors raised 85/78/80/87 → **86/80/81/88**. E2E: lint and Prettier clean; the suite runs in CI
(not locally on this machine, see the brief). The built app was opened in the browser: the login
page draws its icons from the 169 kB subset.

### Tests, item by item
- Cleaning: lint 0 / Prettier clean / all tests / build in the three folders; nothing imports a
  removed file (the build and the suites would fail).
- Metadata Arabic + labels: `components/assessment/metadataSections.test.jsx`.
- Viewer without Cancel, editor with it: `MonitoringDataEntryPage.test.jsx`.
- Export Excel readiness: `components/export/exportEvents.test.jsx` (+ page and layout tests above).
- Tool 5 lock card: `MonitoringDataEntryPage.test.jsx`, `MonitoringOverviewPage.test.jsx`.
- "Saved" on scoring: `AssessmentScoringPage.test.jsx`.
- `dir="auto"`: `src/test/arabicDirection.test.jsx`.
- Tools 3/4 mobile menu: `components/layout/SempFullWidthLayout.test.jsx`.
- Icon font: `src/test/iconFont.test.js`.
- Version: `backend/tests/health.test.js`, `backend/tests/release.test.js`, `Header.test.jsx`.
- Docs: `backend/tests/docs.test.js`.

## Found during phase
- **Arabic code comments:** about 50 frontend files still carry JSDoc / inline comments in Arabic
  (~300 lines); the code language is English. Not translated here (large, no behaviour); a
  follow-up for the owner to schedule.
- **MongoDB version for the server:** the IT checklist recommends 8.0.x (≥ 8.0.30, the long-support
  line); the Windows test used 8.3.3 and CI 7.0. Owner to confirm.
- **`license: "ISC"` in `backend/package.json`** is the npm default, not a decision; kept as is
  (the package is now `private`). Owner to say whether it should go.
- **UI findings (D72 c)** written into the phase 13 file: the "GIS risk overlay later" hint on
  project create, no project navigation on the Tools 3/4 pages at desktop width, the Tools 3/4
  menu backdrop under the sticky header.
- **Service test kit after PR #25:** the docs now say the owner's kit ran `install.ps1` for real (31
  checks). Owner to confirm the kit was run again after the "no MongoDB dependency" fix (PR #25),
  whose check 5c changed.
- **Two sessions, one test database:** the backend tests of two worktrees running at the same time
  share `esms_test` and break each other (seen with the user-guide session). Run one at a time, or
  give one `MONGODB_URI_TEST=…/esms_<name>_test` (the setup accepts any name ending in `_test`).
