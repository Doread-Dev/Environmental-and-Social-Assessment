#!/usr/bin/env bash
# Restores one ESMS backup (Linux): the database and the uploads folder. Moving to a new server is
# the same: install ESMS there, then restore the latest backup.
#   sudo systemctl stop esms
#   sudo -u esms /opt/esms/deploy/linux/restore.sh /mnt/backup/esms/esms-20261105-020000Z
#   sudo systemctl start esms
# It asks you to type RESTORE first. Extra options go to scripts/restore.js (--yes, --strict,
# --target-uri, --uploads-dir).
set -euo pipefail

if [[ $# -lt 1 || "$1" == --* ]]; then
  echo "Usage: $0 <backup folder> [options]" >&2
  exit 2
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="${NODE:-$(command -v node)}"
FROM="$(realpath "$1")"
shift

if systemctl is-active --quiet esms 2>/dev/null; then
  echo "The esms service is running. Stop it first: sudo systemctl stop esms" >&2
  exit 1
fi

cd "$APP_DIR/backend"
exec "$NODE" scripts/restore.js --from "$FROM" "$@"
