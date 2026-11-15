#!/usr/bin/env bash
# ERP public edge (Caddy reverse proxy in Docker): publishes the hub and the five
# portals on the public IP, ports 5011-5100, and nothing else.
#
#   deploy/edge/edge.sh up        pick free ports, validate, (re)start, verify
#   deploy/edge/edge.sh status    container state and the public addresses
#   deploy/edge/edge.sh ports     the port assignment only
#   deploy/edge/edge.sh logs      follow the access log
#   deploy/edge/edge.sh down      stop and remove the edge (the ERP keeps running)
#
# Ports: each service keeps the port it had last time (saved in
# .state/ports.env) so addresses people have bookmarked keep working. A port that
# is taken by anything else is replaced by the next free one in the range,
# starting at 5011. Preferred order: ERP hub 5011, Aadhaar 5012, ePrisons 5013,
# CCTNS 5014, e-Forensics 5015, eCourts 5016.
#
# Environment (all optional):
#   EDGE_PORT_MIN / EDGE_PORT_MAX   the range (default 5011 / 5100)
#   EDGE_PUBLIC_HOST                printed in the addresses (default 103.210.74.194)
#   EDGE_ALLOW                      only these CIDRs may connect, e.g. "49.36.0.0/16 1.2.3.4/32"
#                                   (saved; EDGE_ALLOW=any removes the restriction)
#   EDGE_RESET_PORTS=1              forget the saved ports and pick from 5011 again
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$HERE/.state"
STATE="$STATE_DIR/ports.env"
LOCK="$STATE_DIR/.lock"
CONTAINER=ERP_edge
NETWORK=ERP_net
UPSTREAM_CONTAINER=ERP_platform_api
IMAGE="$(awk '/^ *image:/ {print $2; exit}' "$HERE/compose.yaml")"

PORT_MIN="${EDGE_PORT_MIN:-5011}"
PORT_MAX="${EDGE_PORT_MAX:-5100}"
MAX_ATTEMPTS=5

# key | label | internal port on platform_api | preferred public port offset
SERVICES=(
  "HUB|ERP hub|4100"
  "AADHAAR|UIDAI / Aadhaar|4177"
  "EPRISONS|ePrisons|4173"
  "CCTNS|CCTNS Citizen Services|4175"
  "EFORENSICS|e-Forensics|4176"
  "ECOURTS|eCourts|4178"
)

c_red=$'\e[31m'; c_grn=$'\e[32m'; c_yel=$'\e[33m'; c_dim=$'\e[2m'; c_off=$'\e[0m'
[ -t 1 ] || { c_red=; c_grn=; c_yel=; c_dim=; c_off=; }
log()  { printf '%s\n' "$*"; }
info() { printf '%s==>%s %s\n' "$c_grn" "$c_off" "$*"; }
warn() { printf '%swarning:%s %s\n' "$c_yel" "$c_off" "$*" >&2; }
die()  { printf '%serror:%s %s\n' "$c_red" "$c_off" "$*" >&2; exit 1; }
trap 'die "failed at line $LINENO: $BASH_COMMAND"' ERR

compose() { docker compose --project-directory "$HERE" -f "$HERE/compose.yaml" --env-file "$STATE" "$@"; }

is_int() { [[ "$1" =~ ^[0-9]+$ ]]; }

# ---------------------------------------------------------------- preflight ---
preflight() {
  command -v docker >/dev/null || die "docker is not installed"
  docker info >/dev/null 2>&1 || die "cannot talk to Docker (is the daemon running, are you in the docker group?)"
  docker compose version >/dev/null 2>&1 || die "the docker compose plugin is missing"
  command -v ss >/dev/null || die "ss (iproute2) is required to check which ports are free"
  is_int "$PORT_MIN" && is_int "$PORT_MAX" || die "EDGE_PORT_MIN/MAX must be numbers"
  (( PORT_MIN >= 1024 && PORT_MAX <= 65535 && PORT_MIN <= PORT_MAX )) \
    || die "port range $PORT_MIN-$PORT_MAX is invalid"
  (( PORT_MAX - PORT_MIN + 1 >= ${#SERVICES[@]} )) \
    || die "port range $PORT_MIN-$PORT_MAX is smaller than the ${#SERVICES[@]} ports needed"
  docker network inspect "$NETWORK" >/dev/null 2>&1 \
    || die "Docker network $NETWORK not found: start the ERP stack first (docker compose up -d in the repository root)"
  local st
  st="$(docker inspect -f '{{.State.Status}}' "$UPSTREAM_CONTAINER" 2>/dev/null || true)"
  [ "$st" = running ] || warn "$UPSTREAM_CONTAINER is '${st:-missing}': the edge will start but answer 503 until it runs"
}

# ------------------------------------------------------------ port checking ---
# Host ports in a `docker ps` Ports column, one per line. Docker folds runs of
# consecutive ports into ranges: "0.0.0.0:5011-5016->5011-5016/tcp".
published_ports() {
  grep -oE ':[0-9]+(-[0-9]+)?->' <<<"$1" | tr -d ':>' | sed 's/-$//' \
    | while IFS=- read -r a b; do seq "$a" "${b:-$a}"; done || true
}

# Every TCP port something listens on, on any address, plus every host port a
# container other than the edge publishes (Docker may not show those in ss).
busy_ports() {
  ss -Htln 2>/dev/null | awk '{print $4}' | sed -E 's/.*:([0-9]+)$/\1/'
  docker ps --format '{{.Names}}|{{.Ports}}' 2>/dev/null | while IFS='|' read -r name ports; do
    [ "$name" = "$CONTAINER" ] && continue
    published_ports "$ports"
  done
}

# Host ports the running edge holds now (they are ours, not "taken").
own_ports() {
  published_ports "$(docker ps --filter "name=^${CONTAINER}$" --format '{{.Ports}}' 2>/dev/null || true)"
}

declare -A BUSY=() OWN=() BAD=() CHOSEN_BY_PORT=() PORT_OF=()

scan_ports() {
  BUSY=(); OWN=()
  local p
  while read -r p; do is_int "$p" && BUSY[$p]=1; done < <(busy_ports | sort -un)
  while read -r p; do is_int "$p" && OWN[$p]=1; done < <(own_ports | sort -un)
}

usable() {
  local p=$1
  is_int "$p" || return 1
  (( p >= PORT_MIN && p <= PORT_MAX )) || return 1
  [ -z "${BAD[$p]:-}" ] || return 1
  [ -z "${CHOSEN_BY_PORT[$p]:-}" ] || return 1
  [ -n "${OWN[$p]:-}" ] && return 0
  [ -z "${BUSY[$p]:-}" ]
}

saved() { [ -f "$STATE" ] && sed -n "s/^$1=//p" "$STATE" | tail -1 | tr -d '"'"'"'[:space:]' || true; }

pick_ports() {
  CHOSEN_BY_PORT=(); PORT_OF=()
  local i=0 entry key label internal want p
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r key label internal <<<"$entry"
    want=""
    [ "${EDGE_RESET_PORTS:-0}" = 1 ] || want="$(saved "EDGE_PORT_$key")"
    if [ -n "$want" ] && usable "$want"; then
      p=$want
    else
      [ -n "$want" ] && warn "$label: port $want is no longer free or not allowed, choosing another"
      p=""
      local pref=$(( PORT_MIN + i ))
      if usable "$pref"; then p=$pref; else
        local q
        for (( q = PORT_MIN; q <= PORT_MAX; q++ )); do usable "$q" && { p=$q; break; }; done
      fi
      [ -n "$p" ] || die "no free port left in $PORT_MIN-$PORT_MAX for $label"
      if (( p != pref )) && [ -z "$want" ] && [ -n "${BUSY[$pref]:-}" ] && [ -z "${OWN[$pref]:-}" ]; then
        warn "$label: port $pref is used by another program, using $p"
      fi
    fi
    CHOSEN_BY_PORT[$p]=$key
    PORT_OF[$key]=$p
    i=$(( i + 1 ))
  done
}

write_state() {
  local allow host tmp map="" entry key label internal
  allow="${EDGE_ALLOW-$(saved_raw EDGE_ALLOW)}"
  [ "$allow" = any ] && allow=""
  if [ -n "$allow" ]; then
    local cidr
    for cidr in $allow; do
      [[ "$cidr" =~ ^[0-9a-fA-F:.]+(/[0-9]{1,3})?$ ]] || die "EDGE_ALLOW: '$cidr' is not an IP address or CIDR"
    done
  fi
  host="${EDGE_PUBLIC_HOST:-$(saved EDGE_PUBLIC_HOST)}"; host="${host:-103.210.74.194}"
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r key label internal <<<"$entry"
    map+="${map:+,}$internal=${PORT_OF[$key]}"
  done
  mkdir -p "$STATE_DIR"
  tmp="$(mktemp "$STATE_DIR/ports.env.XXXXXX")"
  {
    echo "# Written by deploy/edge/edge.sh on $(date -Is). Edit through the script, not by hand."
    for entry in "${SERVICES[@]}"; do
      IFS='|' read -r key label internal <<<"$entry"
      echo "EDGE_PORT_$key=${PORT_OF[$key]}"
    done
    echo "ERP_PUBLIC_PORT_MAP=$map"
    echo "EDGE_PUBLIC_HOST=$host"
    if [ -n "$allow" ]; then echo "EDGE_ALLOW=$allow"; fi
  } >"$tmp"
  chmod 644 "$tmp"
  echo "$tmp"
}
saved_raw() { [ -f "$STATE" ] && sed -n "s/^$1=//p" "$STATE" | tail -1 || true; }

validate() {
  local envfile=$1 out
  if ! out="$(docker run --rm --network none --env-file "$envfile" \
        -v "$HERE/Caddyfile:/etc/caddy/Caddyfile:ro" "$IMAGE" \
        caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1)"; then
    printf '%s\n' "$out" | tail -15 >&2
    die "the Caddy configuration is invalid; the running edge was left as it was"
  fi
}

# Port number from a Docker "port is already allocated" / "address already in use" error.
conflict_port() {
  grep -oE '(0\.0\.0\.0|\[::\]|:::?)?:[0-9]+[^0-9]*(failed|already|in use)' <<<"$1" \
    | grep -oE ':[0-9]+' | head -1 | tr -d ':' || true
}

wait_running() {
  local i st
  for (( i = 0; i < 30; i++ )); do
    st="$(docker inspect -f '{{.State.Status}}|{{.State.Restarting}}' "$CONTAINER" 2>/dev/null || true)"
    [ "$st" = "running|false" ] && return 0
    sleep 1
  done
  docker logs --tail 30 "$CONTAINER" >&2 2>&1 || true
  return 1
}

verify() {
  local ok=0 fail=0 entry key label internal p code
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r key label internal <<<"$entry"
    p=${PORT_OF[$key]}
    code=000
    for _ in 1 2 3 4 5; do
      code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$p/" || true)"
      [[ "$code" =~ ^[234] ]] && break
      sleep 1
    done
    if [[ "$code" =~ ^[234] ]]; then ok=$((ok + 1)); else
      fail=$((fail + 1)); warn "$label on :$p answered HTTP $code"
    fi
  done
  (( fail == 0 )) && info "all $ok services answer through the edge" \
    || warn "$fail of $((ok + fail)) services did not answer; check: docker logs $CONTAINER, docker ps"
}

print_table() {
  [ -f "$STATE" ] || { log "no ports assigned yet: run '$0 up'"; return; }
  local host entry key label internal p
  host="$(saved EDGE_PUBLIC_HOST)"
  printf '\n  %-24s %-34s %s\n' "SERVICE" "PUBLIC ADDRESS" "INTERNAL"
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r key label internal <<<"$entry"
    p="$(saved "EDGE_PORT_$key")"
    printf '  %-24s %-34s %s\n' "$label" "http://$host:$p/" "${c_dim}platform_api:$internal${c_off}"
  done
  local allow; allow="$(saved_raw EDGE_ALLOW)"
  printf '\n  access: %s\n\n' "${allow:-${c_yel}anyone on the internet${c_off} (set EDGE_ALLOW to restrict)}"
}

# ----------------------------------------------------------------- commands ---
cmd_up() {
  preflight
  mkdir -p "$STATE_DIR"
  exec 9>"$LOCK"
  flock -n 9 || die "another edge.sh is running"

  info "pulling $IMAGE (if needed)"
  docker image inspect "$IMAGE" >/dev/null 2>&1 || docker pull -q "$IMAGE" >/dev/null

  local attempt new out bad
  for (( attempt = 1; attempt <= MAX_ATTEMPTS; attempt++ )); do
    scan_ports
    pick_ports
    new="$(write_state)"
    validate "$new"

    # Keep the previous assignment until the new one is up, to restore it on failure.
    [ -f "$STATE" ] && cp -p "$STATE" "$STATE.prev"
    mv -f "$new" "$STATE"

    info "starting the edge (attempt $attempt)"
    if out="$(compose up -d --force-recreate --remove-orphans 2>&1)"; then
      if wait_running; then
        rm -f "$STATE.prev"
        verify
        print_table
        return 0
      fi
      warn "the edge container did not stay up"
      out="$(docker logs --tail 50 "$CONTAINER" 2>&1 || true)"
    fi
    bad="$(conflict_port "$out")"
    if is_int "$bad"; then
      warn "port $bad was taken while starting; trying another"
      BAD[$bad]=1
      compose down --remove-orphans >/dev/null 2>&1 || true
      continue
    fi
    printf '%s\n' "$out" | tail -20 >&2
    [ -f "$STATE.prev" ] && mv -f "$STATE.prev" "$STATE"
    die "the edge could not be started (see above)"
  done
  [ -f "$STATE.prev" ] && mv -f "$STATE.prev" "$STATE"
  die "gave up after $MAX_ATTEMPTS attempts; ports keep being taken"
}

cmd_down() {
  [ -f "$STATE" ] || die "nothing to stop (no $STATE)"
  compose down --remove-orphans
  info "edge stopped; the ERP stack is untouched. Ports stay reserved in $STATE for next time."
}

cmd_status() {
  docker ps -a --filter "name=^/${CONTAINER}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  print_table
}

case "${1:-}" in
  up)     cmd_up ;;
  down)   cmd_down ;;
  status) cmd_status ;;
  ports)  print_table ;;
  logs)   docker logs -f --tail 50 "$CONTAINER" ;;
  *) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
