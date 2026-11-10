# ESMS — owner runbook

For the owner of ESMS: the everyday tasks around the server, in plain steps. The IT side (what the
server needs, certificates, ports) is in the [IT checklist](IT-CHECKLIST.md); the full install is
in [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md) / [INSTALL-LINUX.md](INSTALL-LINUX.md).

Paths below are the defaults: Windows `C:\ESMS`, Linux `/opt/esms`. Windows commands go in an
**administrator PowerShell**; Linux commands in a terminal on the server.

---

## 1. Build a release

On your own computer (with internet), from an up-to-date `main`:

```powershell
git checkout main
git pull
node deploy/build-release.mjs
```

- It installs the packages, builds the app and writes `release/esms-<version>-<date>-<commit>/`
  plus `release/esms-<version>-<date>-<commit>.zip` (`.tar.gz` on Linux/macOS), e.g.
  `esms-2.0.0-2026-11-08-0fbe114.zip`. The `release/` folder is never committed.
- The version comes from the three `package.json` files (they must agree). For a new version,
  raise it in `backend/`, `frontend/` and `e2e/package.json` and add an entry at the top of
  [CHANGELOG.md](../CHANGELOG.md) in the same pull request.
- A name ending in `-modified` means the checkout had uncommitted changes: don't ship that one.
- The zip holds `VERSION` (version, commit, build time), `CHANGELOG.md` and `docs/user-guide/`
  (the user guide the in-app Help page reads).

### A clean source package (only if the client asks for the code)

The release zip above is what IT installs. If the client also wants the source code, build it
from `main` with Git. `.gitattributes` leaves out the internal working files (`plan/`, `.claude/`,
`CLAUDE.md`); the repository keeps them:

```
git archive --format=zip --prefix=esms-source-2.0.1/ -o release/esms-source-2.0.1.zip main
```

Use the version of that release in both places. The developer docs in `docs/` still mention the
decision numbers (D1, D2 …) of the plan, which is not in this package.

## 2. Bring an update to the server

1. Copy the zip to the server (USB stick or a file share). The server needs no internet.
2. **Back up first:** Windows `Start-ScheduledTask -TaskName "ESMS Backup"`, then
   `Get-Content C:\ESMS\logs\backup.log -Tail 5` shows `Backup written: …`. Linux
   `sudo systemctl start esms-backup.service`, then `journalctl -u esms-backup -n 5`.
3. Unpack the zip into a new folder, e.g. `C:\Install\esms-2.0.1-…`.
4. From that folder, run the same install command as the first time (step 5 of the install
   guide). Windows:
   ```powershell
   cd C:\Install\esms-<version>-<date>-<commit>
   powershell -ExecutionPolicy Bypass -File .\deploy\windows\install.ps1 `
     -BackupDir E:\ESMS-backups -NssmPath C:\Tools\nssm\nssm-2.24\win64\nssm.exe
   ```
   Linux: `sudo bash deploy/linux/install.sh --backup-dir /mnt/backup/esms`.
   It stops ESMS, replaces the code, keeps the settings (`backend\.env`), the uploads and the
   logs, and starts ESMS again. Use the same `-BackupDir` as the first install.
5. Check: open `http://127.0.0.1:3000/health` on the server — `"version"` is the new one — and
   sign in to the app; the version is also at the bottom of the user menu (top right).
6. Keep the previous release folder until the new one has run for a while: running its install
   command again goes back to it.

## 3. The first admin and the users

There is no sign-up page. The first admin is made on the server:

```powershell
cd C:\ESMS\backend
node scripts\create-admin.js
```

Linux: `cd /opt/esms/backend && sudo -u esms node scripts/create-admin.js`.
It asks for name, email and password (the password is never shown). Then, in the app:

1. Sign in as that admin → **Settings → Users** → **Add User** (name, email, role, job title).
2. The app shows a **temporary password once**: give it to the person yourself (no e-mail is
   sent). At the first sign-in they must choose their own password.
3. A forgotten password: **Settings → Users** → the reset-password button on that user; a new
   temporary password is shown once.
4. Someone leaves: deactivate the account (it can be reactivated). The last active admin cannot
   be deactivated.
5. All admins locked out (break glass), on the server:
   `cd C:\ESMS\backend; node scripts\reset-password.js --activate` (asks for the email and a new
   password).

Use real addresses or `@example.com` for test users (addresses ending in `.local` or `.test` are
refused).

## 4. Restore a backup

A restore **replaces the whole database** with the backup and puts the backup's files back. Do it
only for lost or damaged data, or to move to a new server.

1. Find the backup folder in the backup location, e.g. `E:\ESMS-backups\esms-20261108-020000Z`
   (folders ending in `.partial` are unfinished: never use them).
2. Stop the app: Windows `Stop-Service ESMS`; Linux `sudo systemctl stop esms`.
3. Restore:
   - Windows:
     `powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\restore.ps1 -From E:\ESMS-backups\esms-<date>`
   - Linux: `sudo -u esms /opt/esms/deploy/linux/restore.sh /mnt/backup/esms/esms-<date>`
4. Start the app: `Start-Service ESMS` / `sudo systemctl start esms`, and sign in to check.

The restore refuses to run while ESMS is running, checks the restored counts against the backup's
`manifest.json`, and keeps the old uploads folder next to the new one as
`…before-restore-<time>` (delete it once all is well).

**Moving to a new server:** install the same release there (install guide, steps 1–8), copy the
latest backup folder over, then restore it as above. This is also how the library's Annex 1 PDF
reaches the server: upload it in the app once; it travels in the backups (it is a client document
and is never put in the code repository).

**Check that backups can be restored** (safe, changes nothing):
Windows `powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\test-backup-restore.ps1`;
Linux `sudo -u esms /opt/esms/deploy/linux/test-backup-restore.sh`. It must end with
`RESTORE CHECK PASSED`.

## 5. Where the logs are

| Log | Windows | Linux |
|---|---|---|
| App (requests, start, errors) | `C:\ESMS\logs\esms-out.log`, errors in `esms-err.log` (rotated at 10 MB) | `journalctl -u esms -n 100 --no-pager` |
| Nightly backup | `C:\ESMS\logs\backup.log` | `journalctl -u esms-backup -n 20` |
| Who deleted / archived / changed users | in the app: **Settings → Activity log** (admin) | same |

Windows: `Get-Content C:\ESMS\logs\esms-err.log -Tail 50` shows the last 50 lines.

## 6. When the app is down

Work through these in order and stop when it works again:

1. **Is it only one PC?** Try another PC or browser. If others work, it is that PC's network,
   proxy or browser (clear the cache, check the date and time).
2. **Is the service running?** Windows `Get-Service ESMS` (and `Get-Service MongoDB`); Linux
   `systemctl status esms mongod --no-pager`. Start what is stopped: `Start-Service ESMS` /
   `sudo systemctl start esms`.
3. **Does the app answer on the server itself?** Open `http://127.0.0.1:3000/health` on the server.
   - It answers → the app is fine; the problem is IIS / nginx, the certificate, DNS or the
     firewall: ask IT (check that the IIS site `ESMS` or `nginx` is running, the certificate has
     not expired, and port 443 is open).
   - It does not answer → read the app log (section 5): the last lines say why (often MongoDB not
     running, a disk full, or a wrong value in `backend\.env`).
4. **Check everything at once:** Windows `cd C:\ESMS\backend; node scripts\check-server.js`;
   Linux `cd /opt/esms/backend && sudo -u esms node scripts/check-server.js`. Every `FAIL` line
   says what is wrong.
5. **MongoDB was restarted?** ESMS reconnects by itself within a few seconds; no restart needed.
6. **After an update** something broke → run the install command from the previous release
   folder (section 2, step 6).
7. Still down → restart the server once; if it is still down, collect the last 100 lines of the
   app log and the output of `check-server.js` and send them to the developer.

Users see "Session expired" after 12 hours: they just sign in again on the same page.
Changing `JWT_SECRET` in `backend\.env` signs everybody out.

## 7. Where each document lives

| Document | For | Where |
|---|---|---|
| What changed in each version, known limits | everyone | [CHANGELOG.md](../CHANGELOG.md) |
| Server overview, settings, backups, HTTPS | IT, owner | [deploy/README.md](README.md) |
| Before install day | IT | [deploy/IT-CHECKLIST.md](IT-CHECKLIST.md) |
| Install step by step | IT | [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md), [INSTALL-LINUX.md](INSTALL-LINUX.md) |
| This runbook | owner | `deploy/OWNER-RUNBOOK.md` |
| Server settings, every line explained | IT, owner | [config/esms.env.example](config/esms.env.example) |
| User guide, English and Arabic (also the in-app Help page) | everyone | [docs/user-guide/](../docs/user-guide/README.md) |
| Technical docs (architecture, API, data, roles, workflow rules) | developers | [docs/](../docs/README.md) |
| Setup, commands, tests, CI | developers | [docs/developer-guide.md](../docs/developer-guide.md) |
| Decisions and the phase plan | owner, developers | [plan/DECISIONS.md](../plan/DECISIONS.md), [plan/README.md](../plan/README.md) |
| Notes for v3 (and the v3 UI list) | owner | [plan/V3_VISION.md](../plan/V3_VISION.md) |

The release zip carries `deploy/` (all server guides) and `CHANGELOG.md`, so the server has them
too, under `C:\ESMS\deploy\` / `/opt/esms/deploy/`.
