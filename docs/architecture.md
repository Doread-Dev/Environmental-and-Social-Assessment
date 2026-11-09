# Architecture

ESMS (Environmental and Social Management System) is a workflow app for the environmental and
social due diligence of development projects (AKF Syria). Two independent apps in one repository,
each with its own `package.json` (there is no root package or workspace tooling), plus the E2E
suite:

| Folder | What | Stack |
|---|---|---|
| [`backend/`](../backend) | REST API under `/api/v1`; in production also serves the built frontend | Node.js 26, Express 4, Mongoose 8 (CommonJS), JWT auth, Joi validation |
| [`frontend/`](../frontend) | Single-page app | React 19, Vite 7, React Router 7, TanStack Query 5, Tailwind CSS 4 (ES modules, plain JSX — no TypeScript) |
| [`e2e/`](../e2e) | End-to-end tests of the golden flows | Playwright (Chromium) |
| [`deploy/`](../deploy) | Server install, backup, restore (Windows and Linux) | PowerShell, bash, Node scripts in `backend/scripts/` |

The domain workflow is strictly ordered, and most code is organised around it:
**Screening (Tool 1) → Assessment (Tool 2) → SEMP: Management activities (Tool 3) + Mitigation
plan (Tool 4) → Monitoring (Tool 5)**, plus project documents, the reference library and Settings.
The rules are in [workflow rules](workflow-rules.md). Direction (DECISIONS context): **the backend
owns business logic**; the frontend displays state and hides buttons for convenience only.

## Single process

In production one Node process (`backend`, `npm start`, `NODE_ENV=production`) serves `/api/v1`,
`/health` and the built frontend (`frontend/dist`) on one origin (D38). MongoDB runs on the same
machine as a single-node replica set `rs0` (transactions); IIS or nginx in front terminates HTTPS
(`TRUST_PROXY`). Vercel keeps a deployment until the real server is live (D75 2). Install and
operation: [`deploy/README.md`](../deploy/README.md).

## Backend

### Request pipeline

`src/createApp.js` builds the app from an environment object (`src/app.js` passes `process.env`;
tests build their own):

1. `trust proxy` from `TRUST_PROXY` (default off; `true` = one hop, or a hop count / IP list);
2. helmet with the CSP of `config/security.js`: helmet defaults (`default-src 'self'`,
   `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`) + `frame-src blob:` (the PDF
   viewer, nothing wider), `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`, no
   `upgrade-insecure-requests` (HTTPS is the proxy's job);
3. CORS only when `FRONTEND_URL` is set (no CORS at all otherwise);
4. body parsers (10 MB) → morgan (off when `NODE_ENV=test`) → `GET /health`;
5. `app.use('/api/v1', apiLimiter, routes)`;
6. the built frontend (`middlewares/frontend.js`, only when `FRONTEND_DIST` / `frontend/dist` has an
   `index.html`): `assets/*` get `Cache-Control: public, max-age=31536000, immutable`, everything
   else `no-cache`; a GET that is not `/api`, `/api/*` or `/health` and has no file extension gets
   `index.html` (SPA fallback); a missing file is the JSON 404;
7. 404 → `errorHandler` (must stay last).

Inside `routes/index.js`: `/auth` first, then `router.use(auth)` and
`router.use(requirePasswordChanged)` — **every other `/api/v1` route requires a valid token of an
active user with no pending forced password change**, including all GETs and unknown paths (401 /
403 before 404). `server.js` validates the environment (exits when `JWT_SECRET` < 32 characters or
`MONGODB_URI` is missing) and connects to MongoDB **before** `listen`; it warns at start when
MongoDB is standalone; SIGTERM / SIGINT close the server, then MongoDB.

### Layers

One file per domain in each folder:
`routes/<domain>.routes.js` → `controllers/<domain>.controller.js` → `services/<domain>.service.js`
→ `models/<entity>.model.js`, with `validators/<domain>.validator.js` (Joi). Config in `config/`
(roles, permissions, places, files, security, database), shared helpers in `utils/`.

### Conventions for endpoints

- Mount new routers in `src/routes/index.js`; never register API routes on `app` directly.
- Route order: `requirePermission('name'), <project-access check>, validate(schema), controller.fn`
  — `auth` is applied once in `routes/index.js`, don't repeat it. Routes name a permission, never a
  role list (D66 b, `middlewares/auth.js`; an unknown name throws when the routes load). A GET with
  no `requirePermission` is open to every signed-in role, viewer included.
  `tests/permissions.test.js` fails if a write route has no permission or a module outside
  `config/` uses the role groups.
- **Project access (D66 a):** every project-scoped route has one check from
  `middlewares/projectAccess.js`, which calls `services/access.service.js`
  (`assertProjectAccess(user, projectId)` → 404, not 403; `projectFilterFor(user)` → a `Project`
  filter): `fromParam('id'|'projectId')`, `fromBody('project')` (POST screenings / assessments,
  after `validate`), `fromRecord(Model, param, notFoundMessage)` for routes by a record's own id
  (loads its project first; after `validate`, so an invalid body stays 400), `list()` for
  `GET /projects` and `GET /dashboard` (sets `req.projectFilter`, ANDed into the query). In v2 they
  allow everything; v3 adds membership there. Only `POST /projects` is exempt; `/library` is
  organisation data (no check). `tests/projectAccess.test.js` checks the route table and stubs a
  denial (404, nothing written) on every route.
- `validate(schema)` checks **`req.body`** (`validate(schema, "query")` checks `req.query`;
  `abortEarly:false, stripUnknown:true`) and **replaces it with the stripped value**: a field not in
  the schema never reaches the controller. Keep server-owned fields (`status`, `officer`,
  `approved_by`, `reject_by`, `reject_reason`, `recommendations` — set only by `PATCH …/approve`,
  D63 a — totals, `is_active`) out of the schemas.
- Free text uses `text()` from `validators/text.validator.js` (≤ 30,000 characters, D74 4); ids and
  enums stay plain `Joi.string()`.
- Every write of project data takes a `version` (D62, [stale saves](workflow-rules.md#stale-saves-d62-d73));
  a new one takes it the same way. A new critical action or bulk write goes through `atomic()` and
  is logged ([critical-actions log](workflow-rules.md#critical-actions-log-d65)).
- Controllers are wrapped in `asyncHandler` and respond `{ success: true, data }`; errors are thrown
  as `new ApiError(status, msg)` and become `{ success: false, error }` (an `ApiError` with a string
  `code` adds `code`). Mongoose CastError → 404, duplicate key → 409, Mongoose/Joi validation → 400.
  **Unexpected server errors:** a final status ≥ 500 from an error that is not an `ApiError`
  answers exactly `"Server Error"` in every environment except `development` (where the message
  and the stack are shown); the full error is always logged with `console.error`. An `ApiError`
  with a 5xx status keeps its own message (written on purpose); 4xx results keep theirs (incl.
  library errors with their own 4xx status, e.g. invalid JSON → 400, too large → 413).
- Auth errors: bad/expired/forged token, unknown or inactive user → 401; wrong role → 403
  `Forbidden`; pending forced password change → 403 `code: "PASSWORD_CHANGE_REQUIRED"`; unexpected
  verify error → 500 `Server Error` (no stack, no details).
- `GET /<domain>/project/:projectId` answers "not started yet" with `200 { data: null }`
  (screening, assessment) or `200 { data: [] }` (Tools 3–5) — never 404 (D34). Services populate
  user refs (`officer`, `approved_by`, `reject_by`, `responsible`) with `job_title`.
- Rate limits (`express-rate-limit` 8): 1000 requests / 7 min on `/api/v1`, keyed per user id when
  the token is valid, per IP otherwise through `ipKeyGenerator` (IPv6 grouped by /56, D63 d); login:
  10 failed attempts / 15 min per IP.

### Files

`services/fileStorage.service.js` is the one helper for uploads: it checks every upload
(`checkUpload(file, allowedExtensions)`: extension, first bytes, empty, cleaned display name),
writes it under a server-generated name (`store(folder, …)`, folder = project id or `library`),
resolves paths inside `UPLOADS_DIR` only, removes files without throwing, and sends files to the
app (`send`: the stored type, `Cache-Control: private, no-store`, **no `Content-Disposition`** —
download managers such as IDM hijack fetched responses that carry it, which broke the in-app PDF
viewer; the frontend names every saved file from the record's `original_name`; `sendFile` relative to the uploads folder with `root`, so an `UPLOADS_DIR` under a dot folder still
works). Project documents (`ProjectFile`, D47, D64 d) and the reference library (`LibraryDocument`,
D64 b) both use it; nothing else touches the uploads folder. Uploads are parsed in memory by
`multer` 2 (`middlewares/upload.js`), one file per request: PDF + Office for project documents, PDF
only for the library; too big → 413; the stored MIME type comes from the extension, never the
client. No antivirus scan of uploads. Area `semp_record` (SEMP Plan §7) exists in the model but
answers 404 until v3 (`OPEN_AREAS` in `config/files.js`, D48). `removeProjectData` (delete, purge,
demo reset) removes the project's file rows and folder last.

### Places (D64 a)

`config/places.js` is the code registry of where library guidance can appear: each
`{ key, label, group, scope, locked }`; groups `project_workflow` (`screening`, `assessment`,
`management` = Tool 3, `mitigation` = Tool 4, `monitoring`), `project_support` (`semp_plan`,
`stakeholder_awareness`, locked = v3), `organization` (`ghg_emissions`, `environmental_data`,
locked). Keys are stable and never tool numbers. The frontend keeps no copy (it reads `/lookups`).
A new tool = one entry here + `handle: { place }` on its frontend route + a part or section with
that id in the user guide (below).

### User guide and Help (phase 14, D78)

`services/help.service.js` reads `docs/user-guide/<lang>/*.md` (`en`, `ar`; the format is in
[docs/user-guide/README.md](user-guide/README.md)): front matter `id`, one `#` title, an anchor
`<a id="…" data-requires="…" data-unless="…"></a>` before each `##` section. Tags are permission
names, never roles: `GET /help?lang=` keeps the parts and sections whose `requires` the user all has
(`can()`) and none of whose `unless`, turns links between parts into `#<id>` and links to hidden
sections into plain text, and caches the parsed guide in production. The release folder and the
install scripts carry `docs/user-guide/` next to `backend/`.

### v3 modules (D48, D70)

SEMP Plan, Stakeholder Awareness, GHG Emissions and Environmental Data Collection are **not**
ported: no backend model or route, no frontend page, no `v3/` folder; their designs are in
[`plan/V3_VISION.md`](../plan/V3_VISION.md). The app shows locked buttons only.
`backend/tests/v3Locked.test.js` fails if a v3 path is mounted.

## Frontend

### Entry and providers

`index.html` (`public/theme-init.js` applies the saved theme from `localStorage['esms-theme']`
before the first paint; a file, not an inline script, for the CSP) → `src/main.jsx`:
`QueryClientProvider` (`services/queryClient.js`) → `AuthProvider` → `ThemeProvider` →
`ToastProvider` → `App` (`ErrorBoundary` + `OfflineBanner` + `RouterProvider`). Path alias `@` →
`src/`. Barrels (`index.js`) in components / hooks / services / contexts / utils — import from them.
The production build strips `console.log/info/debug` (terser); ESLint warns on `console` except
`warn` / `error`.

### HTTP

**All HTTP goes through `src/services/api.js`** (an axios instance; never `fetch` or raw axios to
the API). It attaches the `Bearer` token from `localStorage['token']`. Base URL (`apiBaseUrl()`):
`VITE_API_URL` when set (must include `/api/v1`), else `http://localhost:3000/api/v1` in
`npm run dev` and `/api/v1` on its own origin in a production build.

- A 401 **while a user is loaded** (D73) marks the error `sessionExpired` and `AuthProvider` opens
  `components/auth/SessionExpiredDialog` over the page: the page stays mounted, the email is the
  user's, after signing in (`reauthenticate`) the user presses Save again (no automatic retry);
  "Sign in as someone else" logs out and opens `/login`. A 401 with no user loaded (first load, bad
  token) clears auth and hard-redirects to `/login`; a 401 of `/auth/login` itself is never a
  session expiry.
- A 403 `PASSWORD_CHANGE_REQUIRED` hard-redirects to `/change-password`.
- `extractErrorMessage(err)` turns a wrong-role 403 (`Forbidden`) into a friendly message and keeps
  other reasons (e.g. "Account is deactivated"). Use it for every user-facing error.

### Data layer

`services/<domain>Service.js` (thin API calls) → `hooks/use<Domain>.js` (TanStack Query: `useQuery`
for reads, `useMutation` for writes) → `pages/` and feature `components/<domain>/`. No global store:
the query cache is the shared state, plus the Auth and Theme contexts. Every query key comes from
`services/queryKeys.js` (`['me']`, `['lookups']`, `['users']`, `['dashboard']`, `['projects']`,
`['projects', 'archived']`, `['workspace', id]`, `['screening'|'assessment'|'management'|'mitigation'|'monitoring', id]`,
`['files', id, area]`, `['library', place|'all']`, `['audit-logs', params]`, `['help', lang]`). Defaults: `staleTime`
30 s, no refetch on focus, no retry on 4xx.

- **Reads:** `useDashboard`, `useProjects` (`{ archived: true }` for the archive; + delete /
  archive / restore / purge), `useWorkspace(projectId)` (project, `workflow`, `allowed_actions` as
  `can(action)`, summaries, counts), `useLookups`, `useUsers` (loaded once, only where used). Guards,
  `ProjectLayout`, sidebars and pages share the workspace query; `ProjectLayout` passes
  `{ project, workflow, counts, can }` as outlet context (`useProjectContext()`). Request budgets
  (`src/routes/requestCounts.test.jsx`): dashboard 2 requests (`/auth/me`, `/dashboard`), project
  overview 2 (`/auth/me`, workspace), assessment pages one assessment request, a tool page at most
  one `/library?place=` request.
- **Writes:** tool hooks write through `useProjectSave(projectId, toolQueryKey)` — one mutation,
  its result put into the tool's query, then `invalidateProjectState()` (workspace refetched before
  the save resolves, project list and dashboard marked stale). A new write in a tool hook, or of
  project data, must go through it. It handles the unhappy paths once (D61, D62, D73): a second call
  while one runs sends no request; a 409 `STALE_VERSION` opens the shared dialog
  (`contexts/SaveConflictContext.jsx`: **Reload** refetches the tool query and the workspace, then
  the layouts remount the page via `<Outlet key={reloadKey}>`; **Keep editing** keeps the input; no
  merge); a stale save or an expired session answers `{ success: false, error, handled: true }` and
  pages show no second message. Versions sent: screening/assessment the cached record's `updatedAt`,
  the project edit the `updatedAt` when its dialog opened, Tools 3/4/5 the revision the local edits
  started from; tool queries do not refetch on reconnect behind an open form.
- Tools 3/4 (`useManagementActivities`, `useMitigationPlans` in `hooks/useSemp.js`) and Monitoring
  (`useMonitoring`) keep edits local and save with ONE bulk request per Save (D32);
  `utils/responsible.js` always sends `responsible` + `responsible_text`
  (`components/semp/ResponsibleSelect`: "Internal user / External party" switch).
- Files don't change workflow state, so `hooks/useProjectFiles` refreshes only its list; uploads
  go one file at a time, pre-checked with `useAuth().uploadRules` (`utils/fileRules.js`).

### Unsaved changes (D61)

`contexts/UnsavedChangesContext.jsx`, mounted once by the root route `routes/AppShell.jsx`: an
editing page calls `useUnsavedChanges(isDirty, onSave)`; while dirty, any in-app navigation (links,
sidebar, Back, the browser's Back) is held by React Router's `useBlocker` and an in-app dialog asks
**Save / Discard / Stay** ("Save" runs `onSave`, which returns `{ success }`, and leaves only on
success; without `onSave` only Discard / Stay), and `beforeunload` is registered only while dirty.
The page's own navigation after a successful save uses the returned `navigateAway(to)`. Sign-out
goes through `useConfirmLeave()`; an exit chosen on purpose calls `allowLeaving()`
(`utils/leaveGuard.js`). Used by every editing page (screening form, assessment metadata / methods /
scoring, Tools 3/4, Tool 5, project create and edit, user form, library form). Never
`window.confirm`.

### Routing and guards

`src/routes/index.jsx` (all pages lazy-loaded; `appRoutes` under one root route `AppShell`) +
`routes.config.js` (`ROUTES` constants, `getProjectRoute(id, ROUTES.X)`, nav config). Use `ROUTES`
constants, not hardcoded paths. Workflow state comes only from the backend (D30): read
`workflow.steps.<step>.status`, `workflow.status`, `percent_complete`, `next_action` (helpers in
`utils/workflowSteps.js`); no workflow rule or role list lives in the frontend.

- `WorkflowRouteGuard step="assessment|semp|monitoring"` redirects a `locked` step to the open step
  before it. A guard or router that renders pages using the same query must show that query's load
  error itself (`WorkflowRouteGuard`, `ScreeningRouter`, `AssessmentRouter`): otherwise a page
  mounting a new observer of a failed query refetches it while the parent shows "Loading" — a loop
  (phase 10a).
- `ProtectedRoute` sends a user with `must_change_password` to `ROUTES.CHANGE_PASSWORD`.
  `SettingsRouteGuard` = `canAccessSettings` (`manage_users` or `delete_project`);
  `PermissionRouteGuard permission="read_audit_log"` guards Settings → Activity log.

### Permissions in the UI (D35)

`useAuth()` loads `GET /auth/me` once per session (`isLoading` until then): `can(permission)` plus
`canCreateProject`, `canEdit`, `canExport`, `canApprove`, `canManageUsers`, `canDeleteProject`,
`canReadAuditLog`, `canAccessSettings`, `mustChangePassword`, `passwordRules`, `changePassword()`;
logout clears the query cache. **On a project, use the workspace's allowed actions instead**
(`can('screening.approve')`, `can('semp.edit')`, `can('export')` …): they also cover the workflow
state and archived projects. Export buttons only with `export` (viewers never, D28a).
Screening/assessment are submitted with `screeningService.submit` / `assessmentService.submit`
(save first, then the transition endpoint); never send `status` in a create/PUT.

### Screens by area

- **Settings:** Users (`components/settings/UsersManagementSection` + `UserFormModal` /
  `TemporaryPasswordModal`, writes via `hooks/useUserManagement`; admin only), Projects
  (`ProjectsManagementSection`: "Active / Archived projects", Archive / Delete / Restore / Delete
  permanently, each only when `allowed_actions` include it and behind a `ConfirmDialog`), Activity log
  (`pages/settings/ActivityLogPage`, labels and snapshot formatting only in `utils/auditLabels.js`).
  Responsible pickers get `useUsers().activeUsers`; a deactivated responsible user shows as
  "(inactive)".
- **Profile** (`ROUTES.PROFILE`): own password (`components/auth/ChangePasswordForm`, D23).
- **Project documents** (`ROUTES.PROJECT_DOCUMENTS`, D64 d): one section per project-workflow place,
  then "Other"; PDFs open in the `PdfViewer`, Office files download only; upload/delete with
  `can('files.edit')`.
- **Library** (`ROUTES.LIBRARY`, D64 b, c): one `useLibrary()` request, search and place filter
  client-side; managers (`manage_library`) upload, edit (`LibraryDocumentFormModal` + `PlacePicker`),
  replace the PDF and delete. A route with `handle: { place }` (screening, assessment, Tool 3,
  Tool 4, monitoring) gets `components/library/GuidanceButton` in its layout header: "Guidance (n)"
  from `useLibrary({ place })` (5 min stale), hidden at n = 0, opening a side panel and the viewer.
- **Help** (`ROUTES.HELP`, D78, every role; main navigation and the project user menus): the lazy
  `pages/help/HelpPage` chunk (with `react-markdown` + `remark-gfm`, rendered as elements:
  `skipHtml`, only in-page links) shows `useHelp(lang)` (`GET /help`), a contents list, the
  English/Arabic switch (`dir="rtl"` for Arabic, kept per user in localStorage,
  `useHelpLanguage`), a scroll-spy (one `IntersectionObserver` on the headings marks the item
  being read with `aria-current` and keeps it in view in the list) and Print (`window.print()`;
  `index.css` hides `[data-print=hide]` and lets `[data-print=flow]` run over several sheets).
  It has its own route (`ProtectedRoute allowPasswordChange`), so it also opens during the
  forced password change. **Floating Help button** (`components/help/FloatingHelpButton`): one
  round button fixed bottom-right (`z-30`: below dialogs, side panels, the mobile menu and
  toasts), mounted once in `MainLayout`, `ProjectLayout`, `SempFullWidthLayout` and `AuthLayout`;
  the layouts leave room under the content for it, and `StickyFooter` lifts it above the save bar
  (`--floating-help-bottom`). It opens `?section=<id>,<id>…` from `routes/helpSections.js`, a page
  → guide-section map keyed by `ROUTES` (most specific first; navigation config, not a permission
  rule); the page opens the first id the user's guide has, else the start. No button on sign-in
  or Help. A new page adds its entry there (`userGuide.test.js` checks the ids).
- **PdfViewer** (`components/files/PdfViewer.jsx`): mount it only while open; it fetches the PDF as a
  blob with the token, shows it in an `iframe` on a `blob:` URL, revokes the URL on close, has a
  Download button and shows "Download to view" where `navigator.pdfViewerEnabled === false`.
  Overlays (`SidePanel`, the viewer, `Modal`) use `useOverlay`: Escape closes only the topmost, the
  page behind stays mounted. Downloads: `utils/saveBlob.js`.
- **Archived projects:** `ProjectLayout` / `SempFullWidthLayout` show
  `components/project/ArchivedNotice` on every page; the Projects page has an "Archived projects"
  view.
- **Locked v3 buttons** (D48, D70): `V3_LOCKED_NAV` in `routes/routes.config.js` →
  `components/layout/V3LockedNav`: the SEMP Plan card on the SEMP overview, Stakeholder Awareness in
  the project sidebar (+ mobile menu), GHG Emissions + Environmental Data Collection in the main
  sidebar (+ mobile menu). Each is a `<button aria-disabled="true">` described by "Available in v3":
  never a link, no route, no click handler; every role sees them; no env variable, query flag or role
  enables them. `routes.test.jsx` fails if the router has a v3 route.
- **Reviewer fields (D16):** `utils/reviewer.js` — `getReviewer(record, 'approved'|'rejected')`
  takes the populated `approved_by` / `reject_by`, else the last matching `status_history` entry;
  `positionOf(user)` = job title, else role label (`utils/roles.js`).
- **D74 in the pages:** the project form refuses an end date before the start; the assessment
  metadata page saves a draft with any field empty, scoring's Submit checks the four fields first
  (`assessmentSubmitError`); `Input` / `Textarea` default to `maxLength` 30,000 and the Tools 3/4
  grid cells (`EditableCell`) cut at it; Approve stays disabled until recommendations are typed;
  approve and reject open `components/review/ReviewDecisionDialog`. Tool 2 submit says how many
  questions differ from Negligible (`changedQuestionsSummary`, D67 c), never blocking (D54).
- **Login page (D51):** local AKF logo and map (`src/assets/auth/`), `public/favicon.png`, title
  "ESMS System – Environmental & Social Management System". Brand mark everywhere:
  `components/layout/BrandLogo`.
- **Contexts:** providers in `contexts/AuthContext.jsx` / `ThemeContext.jsx`, hooks in
  `contexts/useAuth.js` / `useTheme.js` (one kind of export per file); import from `@/contexts`.

### Excel export

Fully client-side (`utils/excelExport/`, loaded with `await import('@/utils/excelExport')`;
ExcelJS in the `vendor-excel` chunk, ~930 kB, the only chunk allowed over 500 kB — `warnLargeChunks`
in `vite.config.js`). Layouts are this repo's own (D68: tidy, complete, never the official
workbook's layout or rules): one builder per tool adds its sheet — `screeningSheet` ("Tool 1
Screening"), `assessmentSheet` ("Tool 2 Assessment"), `sempSheets` ("Tool 3 Management", "Tool 4
Mitigation"), `monitoringSheet` ("Tool 5 Monitoring"); shared helpers in `excelBase.js` (AKF header,
info rows, review section, Arabic text → `readingOrder: 'rtl'`, responsible user or
"<text> (external party)"); status, file name and footer in `exportMeta.js`. Each sheet holds every
field the app keeps for the tool — `workbooks.test.js` has a completeness check per tool; a new field
is added to the sheet and to that check. `exportTool(tool, data, status)` saves one tool;
`exportProjectWorkbook(data)` (overview's `ProjectWorkbookCard`, only with `can('export')`) saves a
sheet per tool that has data, Tool 1 → Tool 5 (D67 b). The tool status and the date are in the file
name (`Tool2_<project>_Draft_2026-11-04.xlsx`, `ESMS_<project>_<date>.xlsx`) and in the printed
footer (D67 d). Layout headers trigger exports via window events (`screening-export`,
`assessment-export`, `semp-export` with `detail.toolType`, `monitoring-export`). Tools 3/4/5 export
the **saved** data; with unsaved edits the header's Export opens
`components/export/UnsavedExportDialog` (Save and export / Cancel). The official AKF workbook is a
client sketch kept outside the repo (git-ignored): never commit it or an export of it, and never take
a rule from it (D68).

### Style

The rules: [style guide](style-guide.md) (a full design system comes with v3, D77).

## Known gaps

- Files: no antivirus scan of uploads; project documents are not shown inside the tools yet (owner
  decides); Office files are not previewed (download only); SEMP Plan §7 records come with v3 (D48).
- Users are never deleted, only deactivated (D4). Changing your own password does not end your
  other sessions (tokens stay valid until they expire).
