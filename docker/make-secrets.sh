#!/usr/bin/env bash
# Writes docker/.secrets/pg_password from PGPASSWORD in the root .env.
# The file is gitignored and readable only by its owner.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pw="$(awk -F= '/^PGPASSWORD=/{sub(/^PGPASSWORD=/,""); print; exit}' "$ROOT/.env")"
[ -n "$pw" ] || { echo "PGPASSWORD is empty in .env" >&2; exit 1; }
mkdir -p -m 700 "$ROOT/docker/.secrets"
printf '%s' "$pw" > "$ROOT/docker/.secrets/pg_password"
chmod 600 "$ROOT/docker/.secrets/pg_password"
echo "wrote docker/.secrets/pg_password"
