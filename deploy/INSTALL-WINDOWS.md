# Installing ESMS on Windows Server

For the IT person installing ESMS. No programming needed; every command is copied into an
**administrator PowerShell** (Start → type "PowerShell" → right-click → *Run as administrator*).
The server needs no internet. Overview and settings: [README.md](README.md).

> Tested on Windows 11 (Node 26, MongoDB 8.3, Database Tools 100.20.1): in phase 11 the release
> build, replica set, the app from the release, backup, restore and the restore check; then
> (2026-11-05/06) the owner ran `install.ps1` for real with a service test kit, under test names:
> the NSSM service and the backup task registered, crash restart, MongoDB restart and the backup
> task checked (31 checks). The two problems that run found (PowerShell 5.1 quoting, the MongoDB
> service dependency) are fixed (phase 11 file, "Found during phase"). Not yet done on a Windows
> **Server** edition: the first real install should follow this guide step by step and report
> anything unclear.

## 0. On a computer with internet: collect the files

Copy all of these to a USB stick or a share the server can read:

| File | From | Note |
|---|---|---|
| `esms-<version>-<date>-<commit>.zip` | the owner runs `node deploy/build-release.mjs` | the app, ready to run |
| Node.js 26 LTS, Windows x64 `.msi` | nodejs.org → Downloads | the version in `.nvmrc` |
| MongoDB Community Server `.msi` (8.0.30+ / 8.3.9+) | mongodb.com → Community Server | Windows x64 |
| MongoDB Database Tools `.msi` or `.zip` (100.x) | mongodb.com → Database Tools | mongodump / mongorestore |
| NSSM 2.24 `nssm-2.24.zip` | nssm.cc/download | SHA-256 `727d1e42275c605e0f04aba98095c38a8e1e46def453cdffce42869428aa6743` |
| IIS URL Rewrite 2.1 `.msi` | iis.net → URL Rewrite | x64 |
| IIS Application Request Routing 3.0 `.msi` | iis.net → ARR | x64 |
| The HTTPS certificate (`.pfx` with its password) | the organisation's IT | for the server's name |

## 1. Decide three folders

- The app: `C:\ESMS` (default).
- Uploaded files: `C:\ESMS\data\uploads` (default) or a data disk, e.g. `D:\ESMS\uploads`.
- **Backups: a second disk or a network share**, never the disk MongoDB keeps its data on, e.g.
  `E:\ESMS-backups` or `\\backup-server\esms`. The backup refuses the database disk.

## 2. Node.js

Run the Node.js `.msi` (defaults). Check in a **new** PowerShell:

```powershell
node --version
```

It must start with `v26.`.

## 3. MongoDB and the Database Tools

1. Run the MongoDB `.msi`: *Complete*, *Install MongoDB as a Service* (service name `MongoDB`),
   no Compass needed.
2. Run the Database Tools `.msi` (it installs to `C:\Program Files\MongoDB\Tools\100\bin`). If you
   have the `.zip`, unpack it there.
3. Check: `Get-Service MongoDB` shows *Running*;
   `& "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" --version` prints a version.

MongoDB listens on `127.0.0.1` only (its default): nobody else needs the database.

## 4. NSSM

Unpack `nssm-2.24.zip` to `C:\Tools\nssm`. The program is `C:\Tools\nssm\nssm-2.24\win64\nssm.exe`.

## 5. Unpack the release and install

Unpack the release `.zip` somewhere temporary, e.g. `C:\Install\esms-<version>-<date>-<commit>`, then:

```powershell
cd C:\Install\esms-<version>-<date>-<commit>
powershell -ExecutionPolicy Bypass -File .\deploy\windows\install.ps1 `
  -BackupDir E:\ESMS-backups `
  -NssmPath C:\Tools\nssm\nssm-2.24\win64\nssm.exe `
  -ConfigureMongo
```

Optional: `-InstallDir`, `-UploadsDir D:\ESMS\uploads`, `-Port 3000`, `-BackupTime 02:00`,
`-MongoToolsDir` (when the tools are elsewhere).

What it does (it prints each step; any `FAILED` line says what to fix, then run it again):

1. checks Node, NSSM, the MongoDB service and mongodump;
2. copies the app to `C:\ESMS`;
3. writes `C:\ESMS\backend\.env` with a new secret (an existing one is kept);
4. `-ConfigureMongo` adds the replica set (`replication: replSetName: rs0`) to MongoDB's
   `mongod.cfg` (a copy is kept as `mongod.cfg.before-esms`), restarts MongoDB and initiates the
   replica set, and fills the lookup lists (impact questions, indicators, job titles);
5. creates the Windows service **ESMS** (starts with Windows, restarts by itself after a crash,
   runs as the low-privilege account `NT SERVICE\ESMS`, logs in `C:\ESMS\logs`). It does not
   depend on the MongoDB service: when MongoDB is stopped or restarted, ESMS keeps running, shows
   errors meanwhile and recovers by itself once MongoDB is back; at boot the start order does
   not matter (ESMS retries until MongoDB answers);
6. creates the scheduled task **ESMS Backup** (every day at 02:00);
7. starts ESMS and runs the server check.

The last lines must show `ESMS answers on http://127.0.0.1:3000/health` and the check list; the
only `WARN` allowed now is `TRUST_PROXY` if IIS is not set up yet.

## 6. The first administrator

```powershell
cd C:\ESMS\backend
node scripts\create-admin.js
```

It asks for name, email and password. Further users are created in the app (Settings → Users).

## 7. IIS with HTTPS

1. Server Manager → Add roles → **Web Server (IIS)** (defaults).
2. Install **URL Rewrite** and **Application Request Routing** (the two `.msi`).
3. Import the certificate: IIS Manager → server → *Server Certificates* → *Import* (the `.pfx`).
4. Create a folder `C:\inetpub\esms`, copy `C:\ESMS\deploy\proxy\iis-web.config` into it as
   `web.config`.
5. IIS Manager → *Sites* → *Add Website*: name `ESMS`, physical path `C:\inetpub\esms`, binding
   **https**, port 443, host name = the server's name, the certificate from step 3. Add a second
   binding **http** port 80 (it only redirects to HTTPS). Stop the *Default Web Site* if it uses
   port 80.
6. Once per server, in the administrator PowerShell (turns the proxy on, 2-minute timeout, lets
   the rule set `X-Forwarded-Proto`):
   ```powershell
   & "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/proxy /enabled:"True" /preserveHostHeader:"True" /reverseRewriteHostInResponseHeaders:"False" /timeout:"00:02:00" /commit:apphost
   & "$env:windir\system32\inetsrv\appcmd.exe" set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_PROTO']" /commit:apphost
   ```
7. Open the Windows firewall for 443 (and 80) only — **not** 3000.
8. From a user's PC open `https://<server name>/`: the ESMS login page.

`C:\ESMS\backend\.env` already has `HOST=127.0.0.1` and `TRUST_PROXY=true` for this setup. The
upload limit in `web.config` (12 MB) is `MAX_UPLOAD_MB` (10) + 2; raise both together.

## 8. Check the backup once

```powershell
powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\test-backup-restore.ps1
```

It backs up, restores into an empty database `esms_restore_check` and a temporary folder,
compares every count and every file, and removes the copies. It must end with
`RESTORE CHECK PASSED`. Keep that output with the install notes.

Then run the real backup once and look at the backup folder:

```powershell
Start-ScheduledTask -TaskName "ESMS Backup"
Get-Content C:\ESMS\logs\backup.log -Tail 5
```

## 9. A network share for the backups

The task runs as `SYSTEM`, which reaches a share as the server's computer account
(`DOMAIN\SERVERNAME$`). Give that account *Modify* on the share and its folder. Without a domain,
open Task Scheduler → *ESMS Backup* → *Properties* → *Change User or Group* and use an account
that can write to the share (tick *Run whether user is logged on or not*).

## Daily operation

Restarting MongoDB (updates, maintenance) needs nothing else: ESMS keeps running, answers with
errors while MongoDB is away, and works again within a few seconds once MongoDB is back. There is
no need to restart ESMS afterwards.

| Task | Command (administrator PowerShell) |
|---|---|
| Status | `Get-Service ESMS` |
| Stop / start | `Stop-Service ESMS` / `Start-Service ESMS` |
| App log | `Get-Content C:\ESMS\logs\esms-out.log -Tail 50` (errors: `esms-err.log`) |
| Backup log | `Get-Content C:\ESMS\logs\backup.log -Tail 20` |
| Check everything | `cd C:\ESMS\backend; node scripts\check-server.js` |
| Back up now | `Start-ScheduledTask -TaskName "ESMS Backup"` |
| Restore | `Stop-Service ESMS`; `powershell -ExecutionPolicy Bypass -File C:\ESMS\deploy\windows\restore.ps1 -From E:\ESMS-backups\esms-<date>`; `Start-Service ESMS` |
| Reset a password | `cd C:\ESMS\backend; node scripts\reset-password.js` |
| Update | unpack the new release, run step 5 again from its folder (take a backup first) |

## Removing ESMS

`Stop-Service ESMS`; `C:\Tools\nssm\nssm-2.24\win64\nssm.exe remove ESMS confirm`;
`Unregister-ScheduledTask -TaskName "ESMS Backup"`; then delete `C:\ESMS` after keeping a backup.
