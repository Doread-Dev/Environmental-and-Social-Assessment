# Phase 11 — Offline & server deployment

**Goal:** the app runs on one internal server with no internet. Vercel keeps working until that server is live; removing it is a small follow-up then (owner, D75 2; line in the phase 13 file).

**Decisions:** D6, D37, D38, D75 (+ D47 backups, D63 d rate limiter, D64 viewer, D65 critical-actions log).

## Offline (D37)
- Self-host the Material Symbols icons (e.g. the `material-symbols` npm package); remove the last Google Fonts `@import` in `index.css` and drop the Material Symbols exception in `src/test/fonts.test.js`. The text font (IBM Plex Sans + Arabic) is already self-hosted since phase 10 (D72).
- Replace remote images (`LoginPage.jsx` if still there) with local assets. (`ProjectContextCard.jsx`'s map was removed in phase 10.)
- Phase 10 (D72): the text font is offline already; only the icons are left.
- Remove `@vercel/speed-insights` (`main.jsx`, `package.json`). `vercel.json` stays until the server is live (D75 2).
- Verify: run with the network cable / adapter off — no failed requests in DevTools.

## Single process (D38)
- Express serves `frontend/dist` with SPA fallback (non-`/api` GET → `index.html`), correct cache headers (hashed assets long-cache, `index.html` no-cache).
- Same origin → `VITE_API_URL` defaults to `/api/v1`; CORS only when `FRONTEND_URL` is set.
- One `npm run build` at the root or a documented two-step build; one start command.
- HTTPS: either Node with cert/key paths from env, or IIS/nginx in front with `TRUST_PROXY=1` (D6). Document both.
- Service: Windows (NSSM) and Linux (systemd) instructions + example config files in `deploy/`.
- Health check and log location documented.

## Backups
- Daily `mongodump` (includes the audit log) + copy of `UPLOADS_DIR` (project files and `library/`), retention N days, restore procedure tested once (script in `deploy/`).

## Atomic bulk saves (owner, phase 4)
- Run MongoDB as a **single-node replica set** on the server (`replication.replSetName: rs0` in `mongod.cfg` + `rs.initiate()` once; connection string with `replicaSet=rs0`). Document it in `deploy/`.
- Put each critical action and its audit entry (D65) in the same transaction, so it never happens without its entry; keep the purge entry written first.
- Then wrap the phase 4 bulk saves (`utils/replaceProjectRows.js`, `upsertForProject` in `monitoring.service.js`) in a transaction when the connection supports one, and keep today's path (validate everything, then one `bulkWrite`) as the fallback. Test both (CI needs a replica-set MongoDB for the transaction path).

## Security for production
- Helmet CSP must allow the in-app PDF viewer (D64): it shows the PDF in an `iframe` on a `blob:` URL (`components/files/PdfViewer.jsx`), so `frame-src blob:` (and `object-src blob:` only if the viewer ever moves to `<object>`), nothing wider. Test it in the production build.
- `NODE_ENV=production` checks: strong `JWT_SECRET`, no dev scripts, `clean-test-data` refused, helmet CSP that works with self-hosted assets.
- `npm audit --omit=dev` in both apps: no high/critical findings; anything moderate left is listed with a reason in this file.
- Server runs the Node LTS pinned in `.nvmrc` (26 as of phase 0); check it is still the current LTS and bump if a newer LTS line exists.
- Upgrade `express-rate-limit` to 8.x (D63 d) and use its `ipKeyGenerator` for the IP fallback key in `middlewares/rateLimiter.js` (IPv6 addresses grouped by subnet); keep the per-user key for signed-in requests. Test both keys, including an IPv6 address.

## Tests
- Offline: `src/test/fonts.test.js` with the Material Symbols exception removed (no `fonts.googleapis.com` / `fonts.gstatic.com` anywhere); a test that `index.html`, the CSS and the source load no other remote URL (no `googleusercontent`, no CDN); `@vercel/speed-insights` gone from `package.json` and `main.jsx`.
- Single process: Express serves `frontend/dist`; a non-`/api` GET returns `index.html` (no-cache); hashed assets get the long cache header; `/api/v1/*` and `/health` are unchanged; an unknown `/api/v1` path is still 401/404, never `index.html`.
- CORS only when `FRONTEND_URL` is set (one test with, one without).
- Production checks: the server refuses to start with a short `JWT_SECRET`; `clean-test-data` and the demo seed refuse `NODE_ENV=production`; the CSP header contains `frame-src blob:` and nothing wider.
- Rate limiter (`express-rate-limit` 8.x): per-user key for a valid token; IP key via `ipKeyGenerator`, with two IPv6 addresses of the same subnet sharing one bucket.
- Transactions: on a replica-set connection a failing bulk save (and a critical action whose audit entry fails) writes nothing; on a standalone connection the existing path still works (CI job with a replica-set MongoDB).
- Backup script: a dump + uploads copy restores into an empty database with the same counts (scripted test in `deploy/`, run once and recorded here).

## Done when
- [x] Every item under Tests has a test (file names listed in Result).
- [ ] A clean machine with only Node + MongoDB can install and run the app from the docs, offline. Windows: every step run for real on this machine from a release `.zip` (release build, `.env`, replica set, lookups, first admin, the app from the release on 3001, backup, restore, restore check, offline browser check) **except** registering the Windows service (NSSM) and the scheduled task, which the session's permission check blocked (see Found during phase). Linux: written and checked (`bash -n` here, shellcheck in CI), not run on a real server — the guide says so.
- [x] Backup and restore tested (recorded below).
- [x] `CLAUDE.md` deployment section rewritten.

## Result

Branch `claude/phase-11-offline-deploy-4c7f17`. Owner's concept answers written as **D75** (D38 adjusted).

**Offline (D37).** Material Symbols bundled from `material-symbols@0.48.1` (exact; imported in `src/fonts.js`, the variable font so `FILL` and weights keep working); the Google Fonts `@import` is gone; `@vercel/speed-insights` removed (package + `main.jsx`). The inline theme script in `index.html` moved to `public/theme-init.js` so the CSP can keep `script-src 'self'`. No remote image was left (the login page uses local assets since phase 8). `vercel.json` stays (D75 2).

**Single process (D38).** `src/createApp.js` (app built from the environment; `src/app.js` passes `process.env`) + `middlewares/frontend.js`: Express serves `FRONTEND_DIST` (default `frontend/dist`) after the API — hashed `assets/*` long-cached (`public, max-age=31536000, immutable`), everything else `no-cache`; SPA fallback for a GET that is not `/api*` or `/health` and has no file extension; missing files stay the JSON 404. Nothing is served when there is no build (dev, Vercel). Frontend `apiBaseUrl()`: `VITE_API_URL` when set (Vercel, previews, dev on another port), else `/api/v1` in a production build and `http://localhost:3000/api/v1` in `npm run dev`. CORS only when `FRONTEND_URL` is set (before: a production start without it answered `Access-Control-Allow-Origin: *`). `HOST` setting (127.0.0.1 behind the proxy); `server.js` reads the `.env` next to `package.json` (services start elsewhere) and closes cleanly on SIGINT too (NSSM).

**Release and deploy (`deploy/`).** `build-release.mjs` → `release/esms-<date>-<commit>/` + `.zip`/`.tar.gz` (production `node_modules`, `frontend/dist` built with an empty `VITE_API_URL`, refusing a baked-in URL). Windows: `install.ps1` (checks, copy, `.env` with a new secret, `-ConfigureMongo` + replica set, lookups, NSSM service as `NT SERVICE\ESMS` with logs and rotation, scheduled task, start + check), `backup.ps1`, `restore.ps1`, `test-backup-restore.ps1`. Linux: `install.sh`, `backup.sh`, `restore.sh`, `test-backup-restore.sh`, `esms.service`, `esms-backup.service` / `.timer`. Configs: `esms.env.example`, `mongod-windows.cfg`, `mongod-linux.conf`, `proxy/iis-web.config` (URL Rewrite + ARR, `X-Forwarded-Proto`, 12 MB request limit, 2-min proxy timeout), `proxy/nginx-esms.conf` (HTTPS, forwarded headers, `client_max_body_size 12m`, 120 s timeouts). Guides: `README.md` (shape, settings, replica set, backups, moving servers = restore, logs, health, HTTPS, Vercel), `INSTALL-WINDOWS.md`, `INSTALL-LINUX.md` (both with the MongoDB/kernel matrix; the Linux one says it was not run on a real server). The work is in Node scripts under `backend/scripts/` (`backup.js`, `restore.js`, `test-backup-restore.js`, `init-replica-set.js`, `check-server.js`, `lib/ops.js`, `lib/backup.js`, `lib/serverCheck.js`), the same on both systems; the shell scripts are thin wrappers.

**Backups (D75 3).** `BACKUP_DIR/esms-<YYYYMMDD-HHMMSS>Z/` = `database.archive.gz` (mongodump `--gzip`, the whole database, audit log included) + `uploads/` + `manifest.json` (collection counts, files, whether writes happened during the dump); written as `.partial` and renamed when complete; 30 days kept (`BACKUP_KEEP_DAYS`), never the newest; refuses a folder on the database disk (`fs.stat().dev` against MongoDB's `dbPath` from `getCmdLineOpts`), and refuses as well when that cannot be checked (`diskCheck()` → `unknown`: no `dbPath` reported, or the folder is not on this machine); `--allow-same-disk` is the explicit override, used only by tests and CI or inside `UPLOADS_DIR`. The connection string goes to the tools in a temporary config file, never on the command line. Restore: `mongorestore --drop` with `nsFrom/nsTo` (restores into another database name too), the old uploads kept as `.before-restore-<time>`, counts checked against the manifest, refuses while the app answers on its port (and the wrappers refuse while the service runs).

**Transactions.** `utils/transaction.js`: `atomic(fn)` = one transaction on a replica set (Mongoose `transactionAsyncLocalStorage`, so no `session` threading), plain run on a standalone server. In a transaction `audit.record()` throws on a failed write and `withRevision` leaves the revision to the abort. Wrapped: project delete (records first, folder on disk after), purge (entry first, then the records), archive, restore, file delete, library delete and replace (new file written before, old one removed after), user create / role change / deactivate / reactivate / reset, and the Tools 3/4/5 bulk saves with their revision and `rows_removed` entry. `server.js` warns at start on a standalone MongoDB. `removeProjectFiles` became `removeProjectFolder` (disk only; the file rows are deleted with the other records).

**Security.** Helmet CSP (`config/security.js`): defaults + `frame-src blob:` only, `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`, no `https:` anywhere, no `upgrade-insecure-requests` (HTTPS is the proxy's). `express-rate-limit` 7.5.1 → **8.7.3**, IP key through `ipKeyGenerator` (IPv6 /56), per-user key kept, `max` → `limit`. Node: `.nvmrc` 26 is the active LTS line (Node 26.13.0 here; 27 is "Current", not LTS) — no bump.

**`npm audit --omit=dev` (2026-11-05).** Backend: 0 vulnerabilities. Frontend: 2 moderate, **left with reason** — `uuid < 11.1.1` (GHSA-w5hq-g745-h8pq: missing buffer bounds check in v3/v5/v6 when a `buf` is passed) through `exceljs@4.4.0` (the latest ExcelJS; the only "fix" is a downgrade to 3.4.0). ExcelJS only calls `uuidv4()` without a buffer (conditional-formatting ids), so the flaw is not reachable; no high or critical findings.

**CI.** New jobs **Backend (replica set)** (MongoDB 7.0 started with `--replSet rs0`, initiated by `scripts/init-replica-set.js`, Database Tools 100.20.1 with SHA-256 check, whole suite with `EXPECT_TRANSACTIONS=true`) and **Deploy scripts** (`bash -n`, shellcheck, `node --check`); the standalone Backend job sets `EXPECT_TRANSACTIONS=false`.

**Numbers.** Backend 926 tests: 912 pass + 14 skipped on the standalone server (the replica-set-only cases), all 926 pass on the replica set with the Database Tools (run here, as in the new CI job). Backend coverage (standalone, as CI measures it) 95.96 / 90.37 / 94.82 / 96.53 % (statements / branches / functions / lines). Frontend 410 tests, 77.18 / 72.16 / 71.54 / 78.15 %. Floors unchanged: backend 95/90/94/96 and frontend 77/72/71/78 already equal the new numbers rounded down (the new code is covered; the totals round to the same).

### Tests, item by item
- **Offline:** `frontend/src/test/fonts.test.js` (exception removed: no `fonts.googleapis.com` / `fonts.gstatic.com`); `frontend/src/test/offline.test.js` (no remote URL in `index.html`, `public/`, the CSS or the source — only XML namespaces and the dev fallback; no `@import url(` / remote `url()` in CSS; icons from `material-symbols` at an exact version; `@vercel/speed-insights` gone from `package.json` and `main.jsx`; no inline script in `index.html`); `frontend/src/services/apiBaseUrl.test.js` (same-origin default).
- **Single process:** `backend/tests/frontendServing.test.js` (pages → `index.html` with `no-cache`; hashed asset long-cached; other files revalidated; missing files and non-GET → JSON 404; `/health` unchanged; unknown `/api/v1` path 401 / 404 and `/api`, `/api/`, `/api/v2/...` never `index.html`; nothing served without a build). Fixture: `backend/tests/fixtures/frontend-dist/`.
- **CORS:** `backend/tests/security.test.js` (with `FRONTEND_URL`: origin + preflight; empty and unset: no CORS headers).
- **Production checks:** `backend/tests/productionChecks.test.js` (server refuses a missing / 31-character / blank `JWT_SECRET` and a missing `MONGODB_URI`); `backend/tests/cleanTestData.test.js` and `backend/tests/seedDemoProject.test.js` (refuse `NODE_ENV=production`, unchanged); `backend/tests/security.test.js` (CSP on pages, `/health` and the API; `frame-src` exactly `blob:`; `object-src 'none'`; no `https:`, `http:` or `*`).
- **Rate limiter:** `backend/tests/rateLimit.test.js` (version 8; two IPv6 addresses of one /56 share a key, another subnet does not; IPv4 and IPv4-mapped; per-user key for a valid token whatever the IP; the login limit counts one IPv6 subnet together and lets another through).
- **Transactions:** `backend/tests/transactions.test.js` — on a replica set: a Tool 3 / Tool 4 / monitoring bulk save whose write fails half-way writes nothing (rows, revision, entry); a failed `rows_removed` entry undoes the save; project archive / restore / delete (with its file on disk) / purge, file delete, library delete and replace, user create / role change / deactivate / reset each write nothing when the entry fails; `EXPECT_TRANSACTIONS` makes the CI job prove it runs on a replica set. On any server (driver transaction replaced by a plain call, so the standalone CI job covers these branches too): the callback runs inside, nested calls join, a failed entry throws, a failed write leaves the revision to the rollback, `supportsTransactions()` forced / not connected. Without transactions: validation first and nothing written on a bad row, the revision given back after a failed write, a critical action still happens and the failed entry is logged (`backend/tests/auditLog.test.js` keeps its standalone case forced). The whole backend suite also ran on the replica set here and runs in the new CI job.
- **Backup script:** `backend/tests/backupRestore.test.js` (with the real Database Tools: data in every kind of collection incl. an audit entry, an Arabic file name and a library PDF → backup → restore into an empty database with the same counts and byte-identical files; refuses without `BACKUP_DIR`, a `BACKUP_DIR` inside the uploads, a folder that is not a backup; without `--allow-same-disk` the real backup refuses the database disk here and the uncheckable disk in CI, writing nothing); `backend/tests/opsScripts.test.js` `diskCheck` cases: no `dbPath` reported → unknown, `dbPath` not on this machine → unknown, same volume → same, different volume → different; `backend/tests/opsScripts.test.js` (names, 30-day retention never deleting the newest, `.partial` clean-up, same-disk check, kernel matrix, `.nvmrc` major, helpers, replica-set URIs); the scripted check `deploy/windows/test-backup-restore.ps1` / `deploy/linux/test-backup-restore.sh` (→ `backend/scripts/test-backup-restore.js`), run once below.

### Backup and restore, run on Windows (2026-11-05)
Release `esms-2026-11-05-1b60d3d-modified.zip` unpacked into an empty folder; app on port 3001 (`NODE_ENV=production`) against a throwaway MongoDB 8.3.3 single-node replica set (port 27117, initiated with `scripts/init-replica-set.js`), MongoDB Database Tools 100.20.1, data from `seed.js`, `create-admin.js` and the demo seed. All throwaway, removed afterwards.

```
> deploy\windows\backup.ps1                       (BACKUP_DIR on C:, the database disk)
Backup FAILED: BACKUP_DIR (...\server-backups) is on the same disk as the database (...\rs-db).
Use a second disk or a network share: a disk failure would take both.            exit 1

> deploy\windows\test-backup-restore.ps1 -AllowSameDisk
Backup written: ...\esms-20261105-134720Z (database esms_p11_server: 18 collections, 193 documents; uploads: 2 files)
Restored: 18 collections, 193 documents; uploads: 2 files
Check: every count matches the backup's manifest.
   OK   assessmentimpactscores 50 → 50      OK   librarydocuments       2 → 2
   OK   assessmentmethods      3 → 3        OK   managementactivities   3 → 3
   OK   assessments            1 → 1        OK   mitigationplans        3 → 3
   OK   auditlogs              6 → 6        OK   monitoringrecords     24 → 24
   OK   communityconsultations 2 → 2        OK   projectfiles           0 → 0
   OK   impactcategories       8 → 8        OK   projects               1 → 1
   OK   impactquestions       50 → 50       OK   screenings             1 → 1
   OK   indicators            24 → 24       OK   tablerevisions         3 → 3
   OK   jobtitles              5 → 5        OK   users                  7 → 7
   OK   uploads                2 files → 2 files (sha256 compared)
RESTORE CHECK PASSED: 18 collections, 193 documents, 2 files — same as the backup.   exit 0

> deploy\windows\restore.ps1 -From ...\esms-20261105-134753Z -Yes -Strict   (app running)
Restore FAILED: The app is running. Stop the ESMS service first, then restore.     exit 1
> (app stopped) same command
The uploads folder that was there is kept as ...\uploads.before-restore-20261105-134828Z
Restored: 18 collections, 193 documents; uploads: 2 files
Check: every count matches the backup's manifest.                                 exit 0
```

### Offline browser check (production build from the release, served by Express on 3001)
Signed in, dashboard, Library, a PDF opened in the in-app viewer (`iframe` on `blob:http://127.0.0.1:3001/…`, loaded, no CSP error), light and dark. **Every request in the network panel went to `127.0.0.1:3001`** (plus the viewer's `blob:`): the JS/CSS chunks, `theme-init.js`, the IBM Plex woff2 files, `material-symbols-outlined-*.woff2`, the PNGs and `/api/v1/*`; the console had no messages. `document.fonts` reported IBM Plex Sans and Material Symbols Outlined loaded; the icons rendered in both themes. The network adapter was not switched off (it would have cut this session off); the CSP (`default-src 'self'`, no remote source) blocks any outside request in any case, and none was attempted.

### Throwaway resources (all removed at the end)
Ports 3001 and 27117 only; MongoDB in a scratch folder; databases `esms_p11_test`, `esms_p11_rs`, `esms_p11_server` (+ `_restore_check`) dropped with the mongod. The `MongoDB` service, its config, port 3000/5173 and the `esms` database were not touched.

## Found during phase
- **MongoDB 8 vs Linux kernel (found while adding CI, 2026-11-03):** MongoDB 8.x refuses to start on Linux kernels 6.19 to 7.0.13 (tcmalloc/rseq bug, SERVER-121912; startup check changed in 8.0.30 / 8.3.9 by SERVER-125742). The GitHub runners (ubuntu-24.04 and 26.04) hit it, so CI uses `mongo:7.0` for now. When choosing the server OS/kernel and MongoDB version here, check this matrix first (kernel < 6.19 or a fixed kernel, MongoDB ≥ 8.0.30 / 8.3.9).
- **Windows service and scheduled task not registered on the test machine (2026-11-05):** the session's permission check blocked creating Windows services (a throwaway `mongod --install` service and the NSSM service) and so `install.ps1` steps 5–6 (NSSM service `ESMS` as `NT SERVICE\ESMS`, the `ESMS Backup` task) and `-ConfigureMongo` on a real MongoDB service were not run. Everything they call was run (release, `.env`, replica-set init, lookups, the app from the release, backup/restore wrappers). The first real install should follow INSTALL-WINDOWS.md step by step, or the owner allows service registration on a test machine and this is run once.
- **A leftover empty folder `C:\ESMS-p11-test-mongo`** (two empty folders + a small `mongod.cfg`, from the blocked attempt above) could not be removed by this session (protected path); the owner can delete it.
- **CORS before this phase:** with `NODE_ENV=production` and no `FRONTEND_URL`, `cors({ origin: undefined })` answered `Access-Control-Allow-Origin: *`. Now no CORS headers at all without `FRONTEND_URL`.
- **Icon font size:** the Material Symbols variable font is ~4 MB (loaded once, cached a year). Subsetting it to the ~150 icons the app uses is possible later; noted in the phase 13 file.
- **helmet** stays at 7.2 (8.x exists; not in this phase's scope, `npm audit` clean). Upgrading it is a small separate change.
- **Same-disk check (fixed after the first CI run, 2026-11-05):** the check compares volumes (`fs.stat().dev`; on Windows the volume serial number; a network share is always another disk). The first version only *warned* when it could not read MongoDB's data folder and then backed up anyway; in CI the `mongo:7.0` container reports no `storage.dbPath` (the image uses the default `/data/db`), so the restore test failed on that warning. Now a disk that cannot be checked is refused like the database disk (`diskCheck()` → `unknown`), never a silent pass; `--allow-same-disk` is the explicit override for tests and CI, and it prints what it overrode. On the server the install scripts keep `dbPath` in MongoDB's config file, so the check always has an answer.
- **Service display name (after the merge, 2026-11-05):** `install.ps1` gave every NSSM service the display name `ESMS`; Windows refuses two services with the same display name, so a second install with test names (the owner-run service test kit) would clash with a real one. It is now the `-ServiceName` (`ESMS` by default, unchanged for a normal install); `backend/tests/deployScripts.test.js` checks that every name install.ps1 registers comes from its parameters.
- **install.ps1 failed at step 1 on Windows PowerShell 5.1 (owner-run service test, 2026-11-05):** 5.1 strips the double quotes inside an argument to a native program, so `& $node -p 'process.versions.node.split(".")[0]'` reached node as `split(.)` (SyntaxError), and the JWT-secret line (`node -e '…require("crypto")…'`) would have failed next. Not caught here because the phase 11 Windows run did not get to install.ps1 (service registration was blocked). Fixed: the Node major is parsed from `node --version` in PowerShell, the secret comes from .NET `RandomNumberGenerator` (48 bytes, base64url), and `backup.ps1` passes its arguments as an array instead of a `cmd /c` string with embedded quotes (that one worked only because of how cmd strips quotes). `backend/tests/deployScripts.test.js` fails on inline JavaScript (`node -e/-p`), `cmd /c` command strings, or any string literal with an embedded double quote in an argument to a native program in `deploy/windows/*.ps1`; it catches all three old lines.
