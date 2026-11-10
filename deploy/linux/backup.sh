#!/usr/bin/env bash
# ESMS daily backup (Linux): the database (mongodump) + a copy of UPLOADS_DIR into BACKUP_DIR;
# backups older than BACKUP_KEEP_DAYS are deleted (never the newest). Settings: backend/.env.
# Run daily by esms-backup.timer as the esms user. By hand:
#   sudo -u esms /opt/esms/deploy/linux/backup.sh
# Exit code 0 = a new backup was written.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="${NODE:-$(command -v node)}"

cd "$APP_DIR/backend"
exec "$NODE" scripts/backup.js "$@"
