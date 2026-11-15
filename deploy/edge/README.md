# Public edge

The only part of the ERP reachable from outside the office network: a Caddy reverse
proxy in its own container (`ERP_edge`), on the public IP, ports 5011-5100. The
application containers stay internal. The edge reaches them over the private Docker
network `ERP_net`.

```
internet ── 103.210.74.194:5011-5016 ── router (NAT) ── ERP_edge (Caddy) ── ERP_net ── platform_api :4100 :4173-4178
```

| Public address | Service | Internal |
|---|---|---|
| `http://103.210.74.194:5011/` | ERP hub (sign-in required) | `platform_api:4100` |
| `http://103.210.74.194:5012/` | UIDAI / Aadhaar | `platform_api:4177` |
| `http://103.210.74.194:5013/` | ePrisons | `platform_api:4173` |
| `http://103.210.74.194:5014/` | CCTNS Citizen Services | `platform_api:4175` |
| `http://103.210.74.194:5015/` | e-Forensics | `platform_api:4176` |
| `http://103.210.74.194:5016/` | eCourts | `platform_api:4178` |

The ports shown are the ones normally assigned. `edge.sh ports` prints the current ones.

## Commands

```bash
deploy/edge/edge.sh up       # pick free ports, validate, (re)start, check every service
deploy/edge/edge.sh status   # container state and the public addresses
deploy/edge/edge.sh logs     # access log (JSON, includes the visitor's IP)
deploy/edge/edge.sh down     # stop the edge; the ERP keeps running internally
```

The container restarts with Docker (`restart: unless-stopped`), so it comes back after a reboot.

## Ports

- Each service keeps its port from the last run, saved in `.state/ports.env` (gitignored),
  so addresses people bookmarked keep working.
- If a port is taken by anything else, the next free port in 5011-5100 is used and a warning
  says so. Ports that something grabs during startup are retried, up to 5 attempts.
- The configuration is validated before the running edge is touched. If the start fails, the
  previous assignment is restored.
- `EDGE_RESET_PORTS=1 deploy/edge/edge.sh up` forgets the saved ports and starts again from 5011.

## Security

- **Not published:** the ERP console and API (`erp_api:4200`, which has no sign-in),
  PostgreSQL, and `/__platform` (internal diagnostics) on every portal.
- **Links between portals:** the hub and the portals normally build links from the internal
  ports (`:4173`), which are closed from outside. The edge sends the public ports in
  `X-ERP-Public-Ports`, and `backend/platform-api/src/services/edge.js` uses them. The
  platform believes that header, and `X-Forwarded-For` (used for the sign-in rate limits),
  only when the request comes from the `erp_edge` container. A direct visitor cannot set either.
- **Restricting who can connect:**
  `EDGE_ALLOW="203.0.113.0/24 198.51.100.7/32" deploy/edge/edge.sh up` (saved).
  Everyone else gets 403. `EDGE_ALLOW=any` lifts the restriction.
- **Plain HTTP:** there is no domain yet, so the site uses plain HTTP and passwords cross the
  internet unencrypted. When a name is available (the `*.vgipl.com` wildcard already used by
  HRMS covers e.g. `erp.vgipl.com`), change each `http://:{$EDGE_PORT_X}` site to
  `erp.vgipl.com:{$EDGE_PORT_X}` with a `tls <cert> <key>` line, and mount the certificate
  read-only. Links already follow `X-Forwarded-Proto`.
- **Hub password:** before relying on the hub's sign-in on the internet, set
  `HUB_ADMIN_PASSWORD_HASH` for `platform_api` (see `backend/platform-api/src/services/hub-auth.js`).
  Otherwise it uses the built-in default.
