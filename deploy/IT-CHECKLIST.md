# ESMS — checklist for the organisation's IT

For the IT team that hosts ESMS (Environmental and Social Management System), version **2.0.0**.
It lists what to prepare and decide **before install day**. The install itself follows
[INSTALL-WINDOWS.md](INSTALL-WINDOWS.md) or [INSTALL-LINUX.md](INSTALL-LINUX.md); the overview
and every setting are in [README.md](README.md).

**In short:** one server inside the organisation's network, no internet needed. One Node.js
process serves the web app and its API on `127.0.0.1:3000`; MongoDB runs on the same machine;
IIS (Windows) or nginx (Linux) in front gives HTTPS on port 443. A backup runs every night to a
second disk or a network share.

---

## 1. The server

### Operating system (choose one)

| | Supported | Tested |
|---|---|---|
| **Windows Server** 2019, 2022 or 2025 (Windows 10/11 for a test machine) | yes | the full install, service and backup task on Windows 11 |
| **Ubuntu Server** 24.04 LTS or 26.04 LTS (systemd) | yes | scripts checked, **not yet run on a real server** |

Both are supported equally (D75). Windows is the tested path. If you choose Ubuntu, plan a test
install on a spare machine first and tell the owner what differs from the guide.

### MongoDB 8 and the Linux kernel (Ubuntu only)

MongoDB 8.x does not start on Linux kernels **6.19 to 7.0.13**; MongoDB **8.0.30+** and **8.3.9+**
do. Check `uname -r` on the server and pick the MongoDB version from the table in
[README.md](README.md#mongodb-8-and-the-linux-kernel-check-before-choosing-versions).
`install.sh` checks the pair and stops if it does not work. Windows is not affected.

### Size

| | Minimum | Recommended | Why |
|---|---|---|---|
| CPU | 2 cores | 4 cores | Node.js and MongoDB share the machine; Excel exports are built in the browser, not on the server |
| RAM | 4 GB | 8 GB | MongoDB keeps its working set in memory (by default about half of the RAM minus 1 GB); Node uses ~200–300 MB; the OS and IIS / nginx the rest |
| System + app disk | 40 GB | 60 GB | OS, Node.js, MongoDB, the app (~25 MB per release folder), logs (rotated at 10 MB on Windows, journald on Linux) |
| Data (MongoDB + uploads) | 10 GB | 50 GB, on its own disk if possible | Project records are small text; the uploads (PDF and Office files, at most 10 MB each, plus the library) are what grows. Example: 100 projects × 20 files × 2 MB ≈ 4 GB |
| **Backup disk or share** | 30 × data | 40 × data | **Every** nightly backup is a full copy (database + all uploads), kept 30 days. With 4 GB of uploads that is about 120 GB, plus room to grow |

### A second disk or a network share for the backups

Required. The backup **refuses** a folder on the same disk as MongoDB's data (a backup on the
database disk is lost with it). Options:

- Windows: a second disk, e.g. `E:\ESMS-backups`, or a share such as `\\backup-server\esms`.
- Linux: a disk or share mounted in `/etc/fstab`, e.g. `/mnt/backup/esms`.

Copy the backup folder to off-site or tape storage on your usual schedule if you have one.

---

## 2. Installers to carry over (the server needs no internet)

Download these on a machine with internet and carry them over with the release (USB stick or a
file share). Use the newest patch release of the line shown.

| What | Version | Download page | Note |
|---|---|---|---|
| ESMS release `esms-2.0.0-<date>-<commit>.zip` | 2.0.0 | from the owner (built with `deploy/build-release.mjs`) | the app with all its packages; nothing to download on the server |
| Node.js, LTS | **26.x** (tested 26.13.0) — Windows x64 `.msi` / Linux x64 `.tar.xz` | https://nodejs.org/en/download | the install scripts refuse another major version |
| MongoDB Community Server | **8.0.x (8.0.30 or later)** recommended; 8.3.x (tested 8.3.3 on Windows) or 7.0.x also work | https://www.mongodb.com/try/download/community | Windows `.msi`; Ubuntu `.deb` (`mongodb-org-server`), check the kernel first |
| MongoDB Database Tools | **100.x** (tested 100.20.1) | https://www.mongodb.com/try/download/database-tools | `mongodump` / `mongorestore` for the backups |
| Windows: NSSM | **2.24** | https://nssm.cc/download | runs Node as a Windows service; SHA-256 of `nssm-2.24.zip`: `727d1e42275c605e0f04aba98095c38a8e1e46def453cdffce42869428aa6743` |
| Windows: IIS URL Rewrite | **2.1** (x64) | https://www.iis.net/downloads/microsoft/url-rewrite | HTTPS reverse proxy |
| Windows: IIS Application Request Routing | **3.0** (x64) | https://www.iis.net/downloads/microsoft/application-request-routing | HTTPS reverse proxy |
| Linux: nginx | from Ubuntu's packages | `apt-get download nginx nginx-common` on a machine with the same Ubuntu release, or your local mirror | HTTPS reverse proxy |
| The HTTPS certificate | — | your certificate authority (section 3) | Windows: `.pfx` with its password; Linux: `.crt` (full chain) + `.key` |

---

## 3. HTTPS certificate and host name

- **Host name:** choose the name users type, e.g. `esms.<your-domain>`, and add it to the internal
  DNS (an A record to the server's address). The certificate must be issued for exactly that name.
- **Certificate — one of:**
  1. **From your internal certificate authority** (usual on a Windows domain, e.g. Active Directory
     Certificate Services). Every domain PC trusts it already. **Recommended.**
  2. **Self-signed**, made once on the server. Every user's PC must then trust it (installed by
     hand or pushed by group policy), or browsers show a warning.
  3. Plain HTTP is **not recommended**: passwords and data would cross the network unencrypted. At
     most for a short trial.
- IIS (Windows) or nginx (Linux) holds the certificate; Node itself never does. The example
  configs are in [proxy/](proxy/).
- Tell the owner which option you choose; a script for option 2 is added when that is the choice.

---

## 4. Firewall and ports

| Port | Direction | Open to | Why |
|---|---|---|---|
| **443** (HTTPS) | inbound | the users' network | the app |
| **80** (HTTP) | inbound | the users' network | only redirects to HTTPS (optional) |
| 3000 (Node) | — | **nobody**: listens on `127.0.0.1` only | IIS / nginx forwards to it on the same machine |
| 27017 (MongoDB) | — | **nobody**: listens on `127.0.0.1` only | the app on the same machine |
| 445 (SMB) or 2049 (NFS) | outbound | the backup server | only if the backups go to a network share |
| RDP / SSH | inbound | your admins only | administration, as you usually do |

The server needs **no outbound internet access**: the app loads nothing from outside (fonts and
icons are part of the app).

---

## 5. Antivirus

Exclude MongoDB's data folder from real-time scanning (scanning it slows MongoDB down and can
damage open database files; MongoDB's own advice):

- Windows: `C:\Program Files\MongoDB\Server\<version>\data\` (the default; the `dbPath` in
  `mongod.cfg`), and the process `mongod.exe`.
- Linux: `/var/lib/mongodb` and the process `mongod`.

Keep scanning the **uploads** folder (files users upload): Windows `C:\ESMS\data\uploads` by
default, Linux `/var/lib/esms/uploads`. The app accepts only PDF and Office files and checks their
first bytes, but it does not scan for viruses.

---

## 6. Service accounts

| | Windows | Linux |
|---|---|---|
| The app | the install script creates the Windows service **ESMS** running as the virtual account `NT SERVICE\ESMS` (no password; it may read the app and write only its uploads and logs) | the script creates the system user **`esms`** (no login shell); the systemd unit may write only to the uploads folder |
| MongoDB | the MongoDB installer's service account (default `Network Service`) | the package's `mongodb` user |
| The nightly backup | scheduled task **ESMS Backup** as `SYSTEM`; it reaches a network share as the computer account `DOMAIN\SERVERNAME$`: give that account *Modify* on the share and its folder (no domain: run the task as an account that can write there) | the `esms-backup.timer` runs as `esms`: the share must be mounted so that `esms` can write (CIFS: `uid=esms,gid=esms`) |
| People | an administrator account for the install and updates | a user with `sudo` |

The app's own users (people who sign in to ESMS) are created **inside the app** by its admin, not
in Windows or Linux. There is no link to Active Directory in v2.

---

## 7. Backups and the restore check

- **What:** the whole ESMS database (`mongodump`) and a copy of the uploads folder, every night at
  **02:00**, kept **30 days**, under `BACKUP_DIR/esms-<date>-<time>Z/`. A folder still named
  `….partial` is an unfinished backup.
- **Who checks it:** name a person in IT who looks at the backup log once a week and after every
  update, and gets told when a backup is missing. Windows: `C:\ESMS\logs\backup.log`; Linux:
  `journalctl -u esms-backup`. A good night ends with `Backup written: <folder> (database …, uploads: … files)`.
- **Restore check:** run `test-backup-restore` (step 8 of the install guides) once after the
  install, after every MongoDB upgrade, and every few months. It restores the latest data into a
  separate, empty database and compares every count and every file; it must end with
  `RESTORE CHECK PASSED`. Keep its output with your install notes.
- **A real restore** (lost data, new server) is in [README.md](README.md#backups) and the owner
  runbook; it replaces the database, so it is done only with the owner.

---

## 8. Updates later

1. The owner brings a new release `esms-<version>-<date>-<commit>.zip` and its `CHANGELOG.md`.
2. Take a backup first (Windows `Start-ScheduledTask -TaskName "ESMS Backup"`; Linux
   `sudo systemctl start esms-backup.service`) and check it finished.
3. Unpack the new release in a new folder and run the same install command from there
   (INSTALL-WINDOWS.md step 5 / INSTALL-LINUX.md step 5). It stops ESMS, replaces the code, keeps
   the settings (`backend/.env`), the uploads and the logs, and starts ESMS again.
4. Check: `http://127.0.0.1:3000/health` shows the new `"version"`, and the app opens.
5. If something is wrong: run the install command again from the **previous** release folder (keep
   it until the new one has run for a while). A database restore is needed only if the owner says
   the update changed data.

Node.js, MongoDB and Windows / Ubuntu updates follow your usual patch policy. ESMS keeps running
while MongoDB restarts and reconnects by itself. Stay on Node.js 26 (the scripts refuse another
major version until a release says otherwise); before a MongoDB major upgrade, ask the owner.

---

## 9. Questions IT must answer before install day

Send the answers to the owner:

1. **Operating system:** Windows Server (which edition) or Ubuntu (which release, and the kernel
   version from `uname -r`)?
2. **Server size:** how many cores, how much RAM, which disks (system, data)?
3. **Backups:** which second disk or network share (path), how big, and who checks the backup log?
   Is there an off-site copy?
4. **Host name** users will type, and who adds it to DNS?
5. **Certificate:** internal certificate authority (who issues it) or self-signed (and how it
   reaches the users' PCs)?
6. **Network:** can every user's PC reach the server on port 443? Any proxy between them?
7. **Antivirus:** which product, and who adds the MongoDB exclusion?
8. **Access:** who has administrator / `sudo` access for the install and updates? Is remote access
   (RDP / SSH) for the owner allowed during install day?
9. **Domain:** is the server in a Windows domain (matters for the share access of the backup task)?
10. **Time:** is 02:00 a good time for the nightly backup (no other heavy job then)?
11. **Monitoring:** do you watch services or URLs? If so, watch the service `ESMS` / `esms` and
    `http://127.0.0.1:3000/health` (it answers `200` when the app runs).
