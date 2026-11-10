# Changelog

All notable changes to ESMS. Versions follow `MAJOR.MINOR.PATCH`. The running version is shown at
the bottom of the user menu and in `GET /health`, and the release archive carries it in its name
(`esms-<version>-<date>-<commit>.zip`).

## 2.0.1 — 2026-11-10

A fix release on top of 2.0.0.

### Fixed

- **An administrator could lock themselves out.** In Settings → Users, an administrator could
  reset their own password. The app then asked for the new one-time password before it could be
  shown, and the only administrator could no longer sign in. Now an administrator can't reset their
  own password, deactivate their own account or change their own role from Settings → Users. These
  buttons are not shown on their own row, and the server refuses them. Administrators change their
  own password in their profile (**Change password**). Other accounts work as before.

### Known limits

The same as 2.0.0, below.

## 2.0.0 — 2026-11-09

The second version of ESMS, for the organisation's internal, offline server.

### What 2.0.0 contains

- **The workflow, enforced by the server:** Screening (Tool 1) → Assessment (Tool 2) → SEMP:
  Management Activities (Tool 3) + Mitigation Plan (Tool 4) → Monitoring (Tool 5). It covers:
  - steps that open in order and lock after approval;
  - submit, approve and reject, with recommendations and reasons;
  - status history;
  - archive and restore, a guarded delete, and the administrator's permanent delete of archived
    projects.
- **Roles and permissions:** administrator, environmental specialist, program manager, project
  manager, environmental focal point and viewer. Every action checks the user's permissions and
  their access to the project.
- **Users and passwords without e-mail:**
  - the first administrator is created by a script;
  - administrators create the other users in Settings → Users, each with a one-time temporary
    password that must be changed at the first sign-in;
  - administrators can reset passwords and deactivate or reactivate accounts.
- **Project documents and the reference library:** PDF and Office files (up to 10 MB) and an in-app
  PDF viewer. Library documents are linked to the tools and opened from each tool's Guidance panel.
- **Activity log:** deletes, archive and restore, permanent deletes, and user and access changes,
  with who did it and when (Settings → Activity log, administrators).
- **Safe editing:**
  - a save is refused when someone else changed the same data meanwhile;
  - an expired session signs in again on the same page;
  - a warning appears before leaving unsaved changes;
  - a double click sends only one request.
- **Excel export** of each tool and of the whole project, with the status and date in the file
  name. Arabic text is right to left.
- **User guide and in-app Help** in English and Arabic ([user guide](docs/user-guide/README.md)).
  Each user sees only the parts for their role. A Help button on every page opens that page's
  section, and the guide can be printed.
- **Works fully offline:** the fonts and icons are served by the server, and nothing is loaded from
  the internet. The interface is in English, in light and dark mode.
- **Server installation** for Windows Server and Ubuntu ([server guide](deploy/README.md),
  [IT checklist](deploy/IT-CHECKLIST.md)):
  - one Node.js service serves the app;
  - MongoDB runs as a single-node replica set;
  - IIS or nginx in front provides HTTPS;
  - a backup runs daily, keeps 30 days and goes to a second disk or a network share, with restore
    scripts.
- **Quality:** automated unit, integration and end-to-end tests run on every change.

### Known limits

- **Linux install path not run on a real server.** The Ubuntu scripts are checked automatically and
  do the same work, through the same Node.js scripts, as the Windows ones. The Windows ones were run
  on a Windows 11 test machine. The first Linux install should follow
  [INSTALL-LINUX.md](deploy/INSTALL-LINUX.md) step by step.
- **Windows service:** the install script registered and checked the Windows service and the backup
  task on a test machine (31 checks). One later change to the service settings (no dependency on
  the MongoDB service) is covered by automated tests but was not run again on a real machine.
- **Not yet installed on a Windows Server edition.** Tested on Windows 11.
- **The HTTPS certificate and the server operating system** are decided with the organisation's
  IT ([IT checklist](deploy/IT-CHECKLIST.md)).
- **Package audit:** the server's packages have no known vulnerabilities. The browser app has 2
  moderate findings in `exceljs` → `uuid`. They concern `uuid` v3 / v5 / v6 called with a buffer,
  which ExcelJS does not do. The only offered fix is an older ExcelJS, so it is left as is.
- **Modules planned for version 3** (SEMP Plan, Stakeholder Awareness, GHG Emissions,
  Environmental Data Collection) show "Available in v3" and can't be opened yet.
- **A redesigned interface** is planned for version 3.
- **Office files** (Word, Excel, PowerPoint) are downloaded, not previewed in the app.
- **Sign-in sessions** last 12 hours and can't be ended from the server before then.
