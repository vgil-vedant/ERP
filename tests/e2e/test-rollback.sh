#!/usr/bin/env bash
# Proves the "or neither" half of the write-through.
#
# Stops the ERP, submits a form on a portal, and checks that the portal kept
# nothing. Then restarts the ERP and checks a submission succeeds again.
#
#   bash tests/e2e/test-rollback.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORTAL_PORT=4176          # e-Forensics
FORM_ROUTE="/Forget/ForgetPassword"
ERP_PORT=4200
pass=0; fail=0

ok()   { pass=$((pass+1)); printf '  ok   %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf '  FAIL %s\n         %s\n' "$1" "${2:-}"; }
check(){ if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "expected '$3', got '$2'"; fi; }

count_sql() { node -e '
const D=require("better-sqlite3");
const db=new D(process.argv[1],{readonly:true});
process.stdout.write(String(db.prepare(process.argv[2]).get().n));
db.close();' "$1" "$2"; }

PDB="${PLATFORM_DB:-$ROOT/database/sqlite/platform/data/platform.sqlite}"
EDB="${ERP_DB:-$ROOT/database/sqlite/erp/data/erp.sqlite}"

printf '\nRollback: the ERP refuses, so neither database keeps the record\n'
printf '%s\n' "=============================================================="

# --- stop the ERP ----------------------------------------------------------
ERP_PID="$(ss -lptn "sport = :$ERP_PORT" 2>/dev/null | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)"
if [ -z "${ERP_PID:-}" ]; then
  printf '  the ERP is not running on :%s - start it first\n' "$ERP_PORT"; exit 2
fi
printf '\n1. Stopping the ERP (pid %s)\n' "$ERP_PID"
kill "$ERP_PID"
if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$ERP_PORT/api/summary"; then
  bad "the ERP stopped" "it is still answering on :$ERP_PORT"
else
  ok "the ERP is down"
fi

# --- submit with the ERP down ---------------------------------------------
printf '\n2. Submitting on :%s with the ERP down\n' "$PORTAL_PORT"
subs_before="$(count_sql "$PDB" 'SELECT COUNT(*) AS n FROM submission')"
page="$(curl -s "http://127.0.0.1:$PORTAL_PORT$FORM_ROUTE")"
answer="$(printf '%s' "$page" | grep -oP '(?<=name="challenge_expected" value=")\d+' | head -1)"
if [ -z "${answer:-}" ]; then bad "the form was served" "no challenge field found"; fi

status="$(curl -s -o /tmp/rollback-body.html -w '%{http_code}' \
  --data-urlencode "challenge_expected=$answer" \
  --data-urlencode "challenge_answer=$answer" \
  --data-urlencode "user_name=rollback-test" \
  --data-urlencode "Captcha=$answer" \
  "http://127.0.0.1:$PORTAL_PORT$FORM_ROUTE")"
check "the portal answers 503 Service Unavailable" "$status" "503"

if grep -qi 'ERP backend did not accept' /tmp/rollback-body.html; then
  ok "the page says why, and that nothing was saved"
else
  bad "the page explains the refusal" "expected text not found in the response"
fi

subs_after="$(count_sql "$PDB" 'SELECT COUNT(*) AS n FROM submission')"
check "the portal database kept no new row" "$subs_after" "$subs_before"

rolled="$(count_sql "$PDB" "SELECT COUNT(*) AS n FROM erp_sync WHERE status = 'failed'")"
if [ "$rolled" -gt 0 ]; then ok "the failed attempt is in the sync ledger ($rolled total)"
else bad "the failed attempt was recorded" "erp_sync has no failed row"; fi

trail="$(count_sql "$PDB" "SELECT COUNT(*) AS n FROM audit_log WHERE action = 'ROLLBACK'")"
if [ "$trail" -gt 0 ]; then ok "the rollback is permanent in the audit trail ($trail total)"
else bad "the rollback was audited" "no ROLLBACK entry in audit_log"; fi

# --- bring the ERP back ---------------------------------------------------
printf '\n3. Restarting the ERP and submitting again\n'
# --fork matters. Plain setsid execs in place when it is not already a process
# group leader, so the ERP stays a child of this script and inherits whatever
# this script's stdout is. Piping the script into another command then never
# reaches EOF and the pipeline hangs. --fork reparents it to init, and all three
# descriptors are redirected so it holds nothing of ours.
( cd "$ROOT/backend/erp-api" \
    && setsid --fork node src/server.js > /tmp/erp-restart.log 2>&1 < /dev/null )
# --retry-connrefused makes curl itself wait for the port to open, so the
# script neither spins nor guesses a sleep long enough.
if curl -s -o /dev/null --max-time 3 --retry 20 --retry-delay 1 --retry-connrefused \
     "http://127.0.0.1:$ERP_PORT/api/summary"; then
  ok "the ERP is back up"
else
  bad "the ERP restarted" "see /tmp/erp-restart.log"
fi

erp_before="$(count_sql "$EDB" 'SELECT COUNT(*) AS n FROM intake')"
page="$(curl -s "http://127.0.0.1:$PORTAL_PORT$FORM_ROUTE")"
answer="$(printf '%s' "$page" | grep -oP '(?<=name="challenge_expected" value=")\d+' | head -1)"
status="$(curl -s -o /dev/null -w '%{http_code}' \
  --data-urlencode "challenge_expected=$answer" \
  --data-urlencode "challenge_answer=$answer" \
  --data-urlencode "user_name=rollback-test-2" \
  --data-urlencode "Captcha=$answer" \
  "http://127.0.0.1:$PORTAL_PORT$FORM_ROUTE")"
check "the portal accepts the submission again" "$status" "200"

subs_final="$(count_sql "$PDB" 'SELECT COUNT(*) AS n FROM submission')"
erp_after="$(count_sql "$EDB" 'SELECT COUNT(*) AS n FROM intake')"
check "the portal database gained exactly one row" "$subs_final" "$((subs_before+1))"
check "the ERP database gained exactly one record" "$erp_after" "$((erp_before+1))"

printf '\n%s\n' "=============================================================="
printf '%s passed, %s failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || exit 1
