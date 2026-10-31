#!/usr/bin/env bash
# Starts the ERP (:4200) and then the platform (:4100 + portals :4173-4178).
#
#   bash backend/scripts/start-all.sh
#
# It refuses to start if any of those ports is already in use, so it can never
# take over a process that belongs to another project. Logs go to /tmp.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORTS=(4200 4100 4173 4175 4176 4177 4178)

busy=0
for p in "${PORTS[@]}"; do
  if ss -ltn "sport = :$p" 2>/dev/null | grep -q LISTEN; then
    printf 'port %s is already in use - not starting\n' "$p"; busy=1
  fi
done
[ "$busy" = 0 ] || exit 1

( cd "$ROOT/backend/erp-api" && nohup node src/server.js > /tmp/erp-api.log 2>&1 & )
sleep 2
( cd "$ROOT/backend/platform-api" && nohup node src/server.js > /tmp/platform-api.log 2>&1 & )
sleep 3

for p in "${PORTS[@]}"; do
  printf '%s: ' "$p"; curl -s -o /dev/null -m 5 -w '%{http_code}\n' "http://127.0.0.1:$p/"
done
