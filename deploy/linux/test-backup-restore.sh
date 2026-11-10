#!/usr/bin/env bash
# Backup + restore check (Linux): backs up the app's database and uploads into a temporary folder,
# restores that backup into an empty database (<db>_restore_check) and a temporary uploads folder,
# compares every collection count and every file, then removes the copies. The app's own database
# and files are only read. Run once after installing, and after a MongoDB upgrade:
#   sudo -u esms /opt/esms/deploy/linux/test-backup-restore.sh
# The temporary backup goes to BACKUP_DIR (the same disk rule as the daily backup).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="${NODE:-$(command -v node)}"

cd "$APP_DIR/backend"
exec "$NODE" scripts/test-backup-restore.js "$@"
