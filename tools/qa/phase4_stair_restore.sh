#!/usr/bin/env bash
# Restore the pre-2.8 migration/builds only when explicitly requested.
set -euo pipefail
cd "$(dirname "$0")/../.."
backup=backups/room_stair_repair_20261126
sha256sum -c "$backup/SHA256SUMS"
if [[ "${1:-}" == "--restore" ]]; then
  echo 'WARNING: the restored build cannot load generator 2.8 saves; no saves are modified.' >&2
  cp "$backup/room_generation_migration.py" tools/room_generation_migration.py
  cp "$backup/index.html" index.html
  cp "$backup/DEADBEAT_DISCO.html" DEADBEAT_DISCO.html
  cmp "$backup/room_generation_migration.py" tools/room_generation_migration.py
  cmp "$backup/index.html" index.html
  cmp "$backup/DEADBEAT_DISCO.html" DEADBEAT_DISCO.html
  sha256sum tools/room_generation_migration.py index.html DEADBEAT_DISCO.html
  echo 'Restored and byte-compared; stair_repair.js remains unreferenced.'
elif [[ "${1:-}" != "--check" ]]; then
  echo "Usage: $0 --check|--restore" >&2
  exit 2
fi
