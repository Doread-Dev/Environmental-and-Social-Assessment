# Installing ESMS on Ubuntu Linux

For the IT person installing ESMS on Ubuntu Server 24.04 or 26.04 (systemd). Every command is run
in a terminal on the server as a user with `sudo`. The server needs no internet. Overview and
settings: [README.md](README.md).

> **Not yet run on a real Linux server.** The scripts were written alongside the Windows ones
> (which were run on a test machine in phase 11), checked with `bash -n` and shellcheck, and do
> the same work through the same Node scripts. The first real install should follow this guide
> step by step and report anything that differs.

## 0. On a computer with internet: collect the files

| File | From | Note |
|---|---|---|
| `esms-<date>-<commit>.tar.gz` (or `.zip`) | a developer runs `node deploy/build-release.mjs` | the app, ready to run |
| Node.js 26 LTS, `node-v26.x.x-linux-x64.tar.xz` | nodejs.org → Downloads | the version in `.nvmrc` |
| MongoDB Community Server `.deb` packages (`mongodb-org-server`, `mongodb-mongosh` optional) | mongodb.com → Community Server → Ubuntu | version: **check step 1 first** |
| MongoDB Database Tools `.deb` (100.x) | mongodb.com → Database Tools → Ubuntu | mongodump / mongorestore |
| nginx | Ubuntu packages (`apt-get download nginx nginx-common` on a machine with the same Ubuntu release, or the server's local mirror) | |
| The HTTPS certificate and key (`.crt` full chain + `.key`) | the organisation's IT | |

## 1. Check the kernel against MongoDB (before choosing the MongoDB version)

```bash
uname -r
```

MongoDB 8.x does not start on kernels **6.19 to 7.0.13**; 8.0.30+ and 8.3.9+ do. Pick the
MongoDB version from this table:

| Kernel | MongoDB 7.0 | MongoDB 8.0 | MongoDB 8.3 |
|---|---|---|---|
| before 6.19 | ✔ | ✔ | ✔ |
| 6.19 – 7.0.13 | ✔ | only 8.0.30+ | only 8.3.9+ |
| 7.0.14 and later | ✔ | ✔ | ✔ |

After step 5 you can ask the app to check it: `node backend/scripts/check-server.js
--mongodb-version 8.0.31`. `install.sh` repeats the check and stops if the pair does not work.

## 2. Decide three folders

- The app: `/opt/esms` (default).
- Uploaded files: `/var/lib/esms/uploads` (default).
- **Backups: a second disk or a network share**, never the disk MongoDB keeps its data on
  (`/var/lib/mongodb`), e.g. a disk mounted at `/mnt/backup` → `/mnt/backup/esms`. Mount it in
  `/etc/fstab` so it is there after a restart. The backup refuses the database disk.

## 3. Node.js

```bash
sudo tar -xJf node-v26.*-linux-x64.tar.xz -C /usr/local --strip-components=1
node --version    # must start with v26.
```

## 4. MongoDB and the Database Tools

```bash
sudo apt-get install ./mongodb-org-server_*.deb ./mongodb-database-tools_*.deb
sudo systemctl enable --now mongod
systemctl status mongod --no-pager    # active (running)
mongodump --version
```

The package's `/etc/mongod.conf` listens on `127.0.0.1` only: keep it that way. The replica set
is added in step 5 (`--configure-mongo`); by hand it is the `replication:` block in
[config/mongod-linux.conf](config/mongod-linux.conf), then `sudo systemctl restart mongod` and
`sudo -u esms node /opt/esms/backend/scripts/init-replica-set.js`.

## 5. Unpack the release and install

```bash
mkdir -p ~/install && cd ~/install
tar -xzf /media/usb/esms-<date>-<commit>.tar.gz     # or: unzip esms-<date>-<commit>.zip
cd esms-<date>-<commit>
sudo bash deploy/linux/install.sh --backup-dir /mnt/backup/esms --configure-mongo
```

Optional: `--app-dir`, `--uploads-dir`, `--port 3000`.

What it does (each step is printed; a `FAILED` line says what to fix, then run it again):

1. checks Node, MongoDB and the kernel matrix, mongodump, the release;
2. creates the system user `esms`, copies the app to `/opt/esms`, creates the folders;
3. writes `/opt/esms/backend/.env` with a new secret (an existing one is kept), readable only by
   root and `esms`;
4. `--configure-mongo` adds the replica set to `/etc/mongod.conf` (copy kept as
   `mongod.conf.before-esms`), restarts MongoDB, initiates the replica set, and fills the lookup
   lists;
5. installs `esms.service` (starts with the server, restarts after a crash, may write only to the
   uploads folder; a MongoDB restart does not stop it, it recovers by itself) and
   `esms-backup.timer` (every day at 02:00);
6. starts ESMS and runs the server check.

It must end with `ESMS answers on http://127.0.0.1:3000/health` and the check list.

## 6. The first administrator

```bash
cd /opt/esms/backend && sudo -u esms node scripts/create-admin.js
```

Further users are created in the app (Settings → Users).

## 7. nginx with HTTPS

```bash
sudo apt-get install ./nginx*.deb
sudo mkdir -p /etc/ssl/esms
sudo cp esms.crt esms.key /etc/ssl/esms/ && sudo chmod 600 /etc/ssl/esms/esms.key
sudo cp /opt/esms/deploy/proxy/nginx-esms.conf /etc/nginx/sites-available/esms
sudo nano /etc/nginx/sites-available/esms      # set server_name (twice) and the certificate paths
sudo ln -s /etc/nginx/sites-available/esms /etc/nginx/sites-enabled/esms
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Open only 80 and 443 in the firewall, never 3000 (`sudo ufw allow 'Nginx Full'`). From a user's
PC open `https://<server name>/`: the ESMS login page. `client_max_body_size 12m` is
`MAX_UPLOAD_MB` (10) + 2; raise both together.

## 8. Check the backup once

```bash
sudo -u esms /opt/esms/deploy/linux/test-backup-restore.sh
```

It must end with `RESTORE CHECK PASSED`. Then run the real backup once:

```bash
sudo systemctl start esms-backup.service
journalctl -u esms-backup -n 20 --no-pager
ls /mnt/backup/esms
```

A network share (CIFS/NFS) must be mounted so that the `esms` user can write to it (for CIFS:
`uid=esms,gid=esms` in the mount options).

## Daily operation

| Task | Command |
|---|---|
| Status | `systemctl status esms --no-pager` |
| Stop / start | `sudo systemctl stop esms` / `sudo systemctl start esms` |
| App log | `journalctl -u esms -n 100 --no-pager` |
| Backup log / next run | `journalctl -u esms-backup -n 20` / `systemctl list-timers esms-backup.timer` |
| Check everything | `cd /opt/esms/backend && sudo -u esms node scripts/check-server.js` |
| Back up now | `sudo systemctl start esms-backup.service` |
| Restore | `sudo systemctl stop esms`; `sudo -u esms /opt/esms/deploy/linux/restore.sh /mnt/backup/esms/esms-<date>`; `sudo systemctl start esms` |
| Reset a password | `cd /opt/esms/backend && sudo -u esms node scripts/reset-password.js` |
| Update | unpack the new release, run step 5 again from its folder (take a backup first) |

## Removing ESMS

`sudo systemctl disable --now esms esms-backup.timer`, remove the three unit files from
`/etc/systemd/system` and `esms.service.d/`, `sudo systemctl daemon-reload`, then delete
`/opt/esms` after keeping a backup.
