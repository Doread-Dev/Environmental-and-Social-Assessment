#!/usr/bin/env bash
# ESMS install on Ubuntu (as root, from the unpacked release folder, no internet needed):
#   sudo ./deploy/linux/install.sh --backup-dir /mnt/backup/esms [--configure-mongo]
# Steps (each is safe to run again; an update is the same command from the new release folder):
#   1. checks: Node (the version in .nvmrc), MongoDB and the MongoDB/kernel matrix, mongodump
#   2. user "esms", the app in /opt/esms, uploads in /var/lib/esms/uploads, the backup folder
#   3. backend/.env from deploy/config/esms.env.example with a new JWT_SECRET (an existing one is
#      kept)
#   4. --configure-mongo: adds the rs0 replica set to /etc/mongod.conf (a copy is kept) and
#      restarts mongod; then initiates the replica set (scripts/init-replica-set.js) and fills the
#      lookup lists (src/db/seed.js, safe to run again)
#   5. systemd: esms.service (starts with the server), esms-backup.timer (daily at 02:00)
#   6. starts ESMS, waits for /health, runs scripts/check-server.js
# NOTE: written for Ubuntu 24.04 / 26.04 with systemd and checked with bash -n, but NOT yet run
# on a real Linux server (only the Windows path was run on a test machine). Read INSTALL-LINUX.md
# first.
set -euo pipefail

usage() {
  echo "Usage: sudo $0 --backup-dir <folder> [--app-dir /opt/esms] [--uploads-dir <folder>]" >&2
  echo "                 [--port 3000] [--configure-mongo]" >&2
  exit 2
}

APP_DIR=/opt/esms
UPLOADS_DIR=/var/lib/esms/uploads
BACKUP_DIR=""
PORT=3000
CONFIGURE_MONGO=0
MONGOD_CONF=/etc/mongod.conf

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir) BACKUP_DIR="${2:-}"; shift 2 ;;
    --app-dir) APP_DIR="${2:-}"; shift 2 ;;
    --uploads-dir) UPLOADS_DIR="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --configure-mongo) CONFIGURE_MONGO=1; shift ;;
    -h | --help) usage ;;
    *) echo "Unknown option: $1" >&2; usage ;;
  esac
done

step() { printf '\n== %s\n' "$*"; }
fail() { echo "FAILED: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "run as root (sudo)"
[[ -n "$BACKUP_DIR" ]] || fail "--backup-dir is required (a second disk or a network share)"
[[ "$PORT" =~ ^[0-9]+$ ]] || fail "--port must be a number"

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

step "1. Checks"
NODE="$(command -v node)" || fail "Node.js is not installed (INSTALL-LINUX.md, step 3)"
WANTED_NODE="$(tr -d ' v\r\n' < "$SOURCE_DIR/.nvmrc" | cut -d. -f1)"
NODE_MAJOR="$("$NODE" -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" == "$WANTED_NODE" ]] || fail "Node $NODE_MAJOR found, the app needs Node $WANTED_NODE"
echo "Node $("$NODE" --version) at $NODE"
command -v mongod > /dev/null || fail "MongoDB (mongod) is not installed (INSTALL-LINUX.md, step 4)"
MONGO_VERSION="$(mongod --version | sed -n 's/^db version v\([0-9.]*\).*/\1/p')"
echo "MongoDB $MONGO_VERSION, kernel $(uname -r)"
(cd "$SOURCE_DIR/backend" && "$NODE" scripts/check-server.js --mongodb-version "$MONGO_VERSION") ||
  fail "this MongoDB version does not start on this kernel (see above, INSTALL-LINUX.md step 1)"
command -v mongodump > /dev/null || fail "mongodump not found: install the MongoDB Database Tools"
[[ -f "$SOURCE_DIR/frontend/dist/index.html" ]] || fail "frontend/dist is missing: use a release folder"
[[ -d "$SOURCE_DIR/backend/node_modules" ]] || fail "backend/node_modules is missing: use a release folder"

step "2. User and folders"
id esms > /dev/null 2>&1 || useradd --system --home-dir /var/lib/esms --shell /usr/sbin/nologin esms
mkdir -p "$APP_DIR" "$UPLOADS_DIR" "$BACKUP_DIR" /var/lib/esms
if [[ "$SOURCE_DIR" != "$APP_DIR" ]]; then
  # The new release replaces the old code; backend/.env stays (uploads live outside the app).
  KEEP_ENV=""
  if [[ -f "$APP_DIR/backend/.env" ]]; then
    KEEP_ENV="$(mktemp)"
    cp -p "$APP_DIR/backend/.env" "$KEEP_ENV"
  fi
  for part in backend frontend deploy .nvmrc VERSION CHANGELOG.md; do
    [[ -e "$SOURCE_DIR/$part" ]] || continue
    rm -rf "${APP_DIR:?}/$part"
    cp -a "$SOURCE_DIR/$part" "$APP_DIR/$part"
  done
  if [[ -n "$KEEP_ENV" ]]; then
    mv "$KEEP_ENV" "$APP_DIR/backend/.env"
  fi
fi
chown -R root:root "$APP_DIR"
chmod +x "$APP_DIR"/deploy/linux/*.sh
chown esms:esms /var/lib/esms
chown -R esms:esms "$UPLOADS_DIR"
chmod 750 /var/lib/esms "$UPLOADS_DIR"
# A network share may not allow chown: then its mount options must give the esms user write access.
if ! chown esms:esms "$BACKUP_DIR" 2> /dev/null; then
  echo "WARN: could not give $BACKUP_DIR to the esms user (a network share?). Make sure esms can write there."
fi
sudo -u esms test -w "$BACKUP_DIR" || fail "the esms user cannot write to $BACKUP_DIR"

step "3. Settings (backend/.env)"
ENV_FILE="$APP_DIR/backend/.env"
if [[ -f "$ENV_FILE" ]]; then
  echo "Kept the existing $ENV_FILE"
else
  SECRET="$("$NODE" -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')"
  sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" \
    -e "s|^PORT=.*|PORT=$PORT|" \
    -e "s|^UPLOADS_DIR=.*|UPLOADS_DIR=$UPLOADS_DIR|" \
    -e "s|^BACKUP_DIR=.*|BACKUP_DIR=$BACKUP_DIR|" \
    "$APP_DIR/deploy/config/esms.env.example" > "$ENV_FILE"
  echo "Wrote $ENV_FILE with a new JWT_SECRET"
fi
chown root:esms "$ENV_FILE"
chmod 640 "$ENV_FILE"

step "4. MongoDB replica set"
if [[ $CONFIGURE_MONGO -eq 1 ]]; then
  [[ -f "$MONGOD_CONF" ]] || fail "$MONGOD_CONF not found"
  if grep -Eq '^replication:' "$MONGOD_CONF"; then
    echo "$MONGOD_CONF already has a replication block (left as it is)"
  else
    cp -p "$MONGOD_CONF" "$MONGOD_CONF.before-esms"
    printf '\n# Single-node replica set for ESMS transactions\nreplication:\n  replSetName: rs0\n' \
      >> "$MONGOD_CONF"
    echo "Added the rs0 replica set to $MONGOD_CONF (copy: $MONGOD_CONF.before-esms)"
    systemctl restart mongod
    sleep 3
  fi
fi
(cd "$APP_DIR/backend" && sudo -u esms "$NODE" scripts/init-replica-set.js) ||
  fail "the replica set is not ready (run again with --configure-mongo, or INSTALL-LINUX.md step 4)"
# The lookup lists (impact categories, questions, indicators, job titles); safe to run again.
(cd "$APP_DIR/backend" && sudo -u esms "$NODE" src/db/seed.js) || fail "filling the lookup lists failed"

step "5. Services"
sed -e "s|/opt/esms|$APP_DIR|g" -e "s|^ExecStart=/usr/bin/node |ExecStart=$NODE |" \
  "$APP_DIR/deploy/linux/esms.service" > /etc/systemd/system/esms.service
sed -e "s|/opt/esms|$APP_DIR|g" "$APP_DIR/deploy/linux/esms-backup.service" \
  > /etc/systemd/system/esms-backup.service
cp "$APP_DIR/deploy/linux/esms-backup.timer" /etc/systemd/system/esms-backup.timer
# The app may write to its uploads folder wherever it is (the unit has ProtectSystem=strict).
mkdir -p /etc/systemd/system/esms.service.d
printf '[Service]\nReadWritePaths=%s\n' "$UPLOADS_DIR" > /etc/systemd/system/esms.service.d/paths.conf
systemctl daemon-reload
systemctl enable esms.service esms-backup.timer
systemctl restart esms.service
systemctl start esms-backup.timer

step "6. Start and check"
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/health" > /dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:$PORT/health" > /dev/null ||
  fail "ESMS does not answer on port $PORT: journalctl -u esms -n 50"
echo "ESMS answers on http://127.0.0.1:$PORT/health"
(cd "$APP_DIR/backend" && sudo -u esms "$NODE" scripts/check-server.js) || true

echo
echo "Done. Next (INSTALL-LINUX.md): nginx with HTTPS (deploy/proxy/nginx-esms.conf), the first"
echo "admin (cd $APP_DIR/backend && sudo -u esms node scripts/create-admin.js), and one restore"
echo "check (sudo -u esms $APP_DIR/deploy/linux/test-backup-restore.sh)."
