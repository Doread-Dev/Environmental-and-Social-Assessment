# Changelog

All notable changes to ESMS. Versions follow `MAJOR.MINOR.PATCH`; the version is the same in
`backend/`, `frontend/` and `e2e/package.json`, `GET /health` reports it, the app shows it at the
bottom of the user menu, and the release archive carries it in its name
(`esms-<version>-<date>-<commit>.zip`).

## 2.0.0 — 2026-11-08

The finished v2 (D77): the rework of the first version in phases 0–12a
([plan/README.md](plan/README.md), decisions D1–D77 in [plan/DECISIONS.md](plan/DECISIONS.md)),
for the organisation's internal, offline server.

### What v2 contains

- **The workflow, ruled by the backend:** Screening (Tool 1) → Assessment (Tool 2) → SEMP:
  Management Activities (Tool 3) + Mitigation Plan (Tool 4) → Monitoring (Tool 5). Gates, locks,
  submit / approve / reject with recommendations and reasons, status history, archive / restore,
  guarded delete and the admin's permanent delete of archived projects
  ([workflow rules](docs/workflow-rules.md)).
- **Roles and permissions:** admin, environmental specialist, program manager, project manager,
  environmental focal point, viewer; every route checks a named permission and the project access
  ([roles and permissions](docs/roles-and-permissions.md)).
- **Users and passwords without e-mail:** the first admin from a script, then users created in
  Settings → Users with a one-time temporary password, a forced change at first sign-in, password
  reset, deactivate / reactivate.
- **Project documents and the reference library:** PDF and Office files (10 MB), an in-app PDF
  viewer, library documents linked to the tools and opened from each tool's Guidance panel.
- **Critical-actions log:** deletes, archive / restore, permanent delete, user and access changes,
  with who and a snapshot (Settings → Activity log, admin).
- **Safe editing:** stale saves refused ("Someone else changed this"), sign-in again on the page
  when the session expires, an unsaved-changes guard on every edit page, one request per click.
- **Excel export** of each tool and of the whole project (complete, status and date in the
  file name, Arabic cells right to left).
- **One English UI** in light and dark mode, IBM Plex Sans / Plex Sans Arabic and the Material
  Symbols icons self-hosted (the icon font is a subset of the icons the app uses), nothing loaded
  from the internet.
- **Server install:** one Node.js process serves the app and the API; MongoDB as a single-node
  replica set (transactions); IIS or nginx in front for HTTPS; install, backup (daily, 30 days, a
  second disk or a share) and restore scripts for Windows Server and Ubuntu
  ([deploy/README.md](deploy/README.md), [IT checklist](deploy/IT-CHECKLIST.md),
  [owner runbook](deploy/OWNER-RUNBOOK.md)).
- **Tests:** backend and frontend unit / integration tests with coverage floors, Playwright
  end-to-end tests of the golden flows in Chromium, CI on every pull request
  ([developer guide](docs/developer-guide.md)).

### Phase 12a (release readiness)

- Version 2.0.0; `GET /health` returns `version`; the version in the user menu; this changelog;
  the version in the release archive name; `deploy/IT-CHECKLIST.md` and
  `deploy/OWNER-RUNBOOK.md`.
- Fixed: the assessment metadata showed Arabic text next to Officer Name / Position (now "(on
  submit)"), and its four text areas had no label; the monitoring data entry showed "Cancel" to a
  viewer; the header "Export Excel" could be clicked before the tool page was ready (now disabled
  until then); the Tool 5 lock cards named Tool 2 instead of Tools 3 and 4; "Save as Draft" on the
  assessment scoring gave no "Saved" feedback; Arabic project titles, locations and texts are shown
  right to left (`dir="auto"`), also in the Tools 3/4 cells; the Tools 3/4 pages have the phone /
  tablet menu, and the menu shows done tools like the desktop sidebar; a viewer no longer sees
  "Edit Assessment" on a rejected assessment.
- The Material Symbols font in the build is a subset (~170 kB instead of ~4 MB).
- Cleaned: unused files and exports, stale comments, `.gitignore`; code comments in English (a test
  guards it); docs checked against the code; the backend package marked `UNLICENSED`.

### Known limits

- **Linux install path not run on a real server.** The Ubuntu scripts are checked (`bash -n`,
  shellcheck) and do the same work through the same Node scripts as the Windows ones, which were
  run on a Windows 11 test machine. The first Linux install should follow
  [INSTALL-LINUX.md](deploy/INSTALL-LINUX.md) step by step.
- **Windows service: the last fix was not run on a real machine.** The owner's service test kit
  registered and checked the Windows service and the backup task (31 checks) on the build before
  the fix that removed the service's dependency on MongoDB (PR #25). That fix is covered by
  `backend/tests/deployScripts.test.js` but was not run again on a real machine.
- **Not yet installed on a Windows Server edition.** Tested on Windows 11.
- **HTTPS certificate and server OS** wait on the organisation's IT
  ([IT checklist](deploy/IT-CHECKLIST.md)).
- **`npm audit`:** the backend's production packages are clean. The frontend reports 2 moderate
  findings through `exceljs` → `uuid`: they concern `uuid` v3 / v5 / v6 called with a buffer,
  which ExcelJS does not do; the only offered fix is a downgrade of ExcelJS, so it is left as is.
- **v3 modules are locked buttons only:** SEMP Plan, Stakeholder Awareness, GHG Emissions and
  Environmental Data Collection show "Available in v3" and do nothing (D48, D70).
- **The design system and the page-by-page UI/UX review (phase 13) moved to v3** (D77); its list
  of open UI items is kept in
  [plan/phases/13-page-by-page-ui-review.md](plan/phases/13-page-by-page-ui-review.md).
- **Office files** (Word, Excel, PowerPoint) are downloaded, not previewed in the app.
- Sessions: a JWT in the browser, 12 hours, no server-side revocation (a v3 topic,
  [V3_VISION.md](plan/V3_VISION.md)).
