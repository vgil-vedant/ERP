# Remediation plan

Nothing here has been applied. Each step awaits the owner's approval and a retest.

## Immediate

### ERP-SA-01: Hub, portals and citizen sign-in are served over plain HTTP, including on public and LAN addresses (High)

**Fix.** Terminate TLS at the edge (a domain name with automatic certificates, or an internal CA for an IP-only site), redirect HTTP to HTTPS, enable HSTS, and stop publishing application ports on the LAN address (bind them to 127.0.0.1 so only the edge can reach them).

```
# deploy/edge/Caddyfile
{
  # remove: auto_https off
  email security@example.org
}
hub.example.org {
  import common
  header Strict-Transport-Security "max-age=31536000"
  reverse_proxy ERP_platform_api:4100
}
# compose: ERP_BIND_ADDR=127.0.0.1
```

**Retest.** curl -sI http://HOST/login returns a 301/308 to https; curl -sI https://HOST/login shows Strict-Transport-Security; the session cookie carries Secure; nmap shows no application port open on the LAN address.

### ERP-SA-02: Administrator sign-in is reachable from any address; edge allowlist is unset (Medium)

**Fix.** Set EDGE_ALLOW to the office address ranges (or a VPN range) for the hub and office paths, keeping citizen-facing portals separate if they must stay public.

```
# deploy/edge/.state/ports.env
EDGE_ALLOW=203.0.113.0/24 198.51.100.17/32
```

**Retest.** From an address outside the allowlist the hub login returns 403; from an allowed address it returns 200.

### ERP-SA-03: Database backups and SQLite files are committed to the Git history (Medium)

**Fix.** Remove the files from the repository, rewrite history (git filter-repo) after confirming with the repository owner, keep backups outside Git in encrypted storage, and extend .gitignore to backup/.

```
git filter-repo --path backup --invert-paths   # after agreement and a fresh clone
echo "backup/" >> .gitignore
```

**Retest.** git log --all -- backup returns nothing; gitleaks and trufflehog report no database files; backups restore from the encrypted store.

## Short-term

### ERP-SA-04: Weak, unrotated PostgreSQL credential, and the application connects as the database superuser (Medium)

**Fix.** Generate a 32-byte random password, create a separate least-privilege application role (no superuser, no CREATEDB), and point erp_api at it.

```
CREATE ROLE erp_app LOGIN PASSWORD :'pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE demo_replica TO erp_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO erp_app;
```

**Retest.** SELECT rolsuper FROM pg_roles WHERE rolname = current_user returns false from the API; docker/make-secrets.sh output for pg_password is 32 bytes or more.

### ERP-SA-05: Node.js 18 (end-of-life) is the runtime of both application images and of CI (Medium)

**Fix.** Move the images and CI to a supported LTS line (Node 22 or newer), then re-run the test suites and rebuild both images.

```
ARG NODE_IMAGE=node:22-bookworm-slim
# ci.yml: node-version: 22
```

**Retest.** docker run --rm erp_platform_api node -v prints a supported release; CI green on the new version; security suite still reports 0 failures.

### ERP-SA-06: Container images carry HIGH and CRITICAL OS and library advisories (scanner-reported) (Medium)

**Fix.** Rebuild on a current base image (apt-get upgrade in the build, newer caddy and postgres patch tags), pin by digest, and re-scan until only accepted advisories remain.

```
FROM node:22-bookworm-slim@sha256:<digest>
RUN apt-get update && apt-get -y upgrade && rm -rf /var/lib/apt/lists/*
```

**Retest.** trivy image --severity HIGH,CRITICAL --exit-code 1 <image> exits 0, or lists only documented exceptions.

### ERP-SA-07: Hub administrator authentication is a single shared account with per-address, in-memory throttling and no second factor (Low)

**Fix.** Add per-account lockout or exponential delay, an idle timeout, and TOTP or WebAuthn for the administrator; move to named accounts so audit entries identify a person.

```
// idle timeout: refresh `exp = now + 30 min` on each request, cap at 12 h absolute
```

**Retest.** Ten wrong passwords from different test addresses still slow the account; an idle session is rejected after the timeout; sign-in requires the second factor.

## Medium-term

### ERP-SA-08: scrypt cost parameter (N = 16384) is below the OWASP recommended minimum (Low)

**Fix.** Raise N to 2^17 and store the parameters with each hash so existing hashes still verify and can be upgraded at next sign-in. maxmem must be raised accordingly.

```
crypto.scryptSync(pw, salt, 32, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 })
```

**Retest.** New hashes carry the new parameters; a unit test verifies old and new hashes; sign-in latency stays acceptable.

### ERP-SA-09: Citizen registration reveals whether an email address is already registered (Low)

**Fix.** Respond identically whether or not the address exists and send the outcome by email, or accept the disclosure explicitly for this demonstration.

```
// always: 'If this address can be registered, we have sent a confirmation.'
```

**Retest.** Registering a known and an unknown address produce byte-identical responses and timing within noise.

### ERP-SA-10: Citizen password policy is a minimum length of 8 only (Low)

**Fix.** Reject passwords on a common-password list (a local top-10,000 list is enough), keep the length minimum, and avoid composition rules.

```
if (COMMON.has(password.toLowerCase())) errors.password = 'Choose a less common password.';
```

**Retest.** Registration with a listed password is refused; a random 12-character password is accepted.

### ERP-SA-11: Integration-bus signing uses one shared secret, a time window only, and no throttle on failed signatures (Low)

**Fix.** Use a distinct secret per department and bind the signed source to it, add a nonce or event-id replay cache, and count failed signatures per address.

```
const secret = SECRETS[source]; // one per department
if (seen.has(e.id)) return 'replay';
```

**Retest.** A delivery signed with department A's secret but claiming source B is refused; a replayed body is rejected; repeated bad signatures return 429.

### ERP-SA-12: Output-encoding and Content-Security-Policy gaps (defence in depth) (Low)

**Fix.** Escape "<" when embedding JSON, escape attribute values, add a CSP to the ERP console, and move inline styles to classes so unsafe-inline can be dropped.

```
const json = JSON.stringify(x).replace(/</g, '\\u003c');
```

**Retest.** A test payload containing </script> in a department name renders as text; the ERP console responds with a CSP header.

### ERP-SA-14: No resource limits on any container; the database container is less hardened than the application containers (Low)

**Fix.** Add mem_limit, cpus and pids_limit to each service, and apply cap_drop to postgres with only the capabilities its entrypoint needs.

```
services:
  platform_api:
    mem_limit: 768m
    cpus: 1.0
    pids_limit: 256
```

**Retest.** docker inspect shows the limits; the stack passes its health checks under the project test load.

## Long-term

### ERP-SA-13: Development-time dependency advisories (frontend/web and backend/tools) (Low)

**Fix.** Upgrade vitest, vite and playwright to current patch lines, and run npm audit in CI.

```
npm install -D vitest@latest vite@latest postcss@latest
npm --prefix backend/tools install playwright@latest
```

**Retest.** npm audit reports 0 advisories with and without --omit=dev.

### ERP-SA-15: CI runs the front-end only: no backend tests, security suite or scanners (Low)

**Fix.** Add a backend job running the security and department suites, plus Gitleaks and Trivy steps, and pin actions by SHA.

```
  security:
    steps:
      - run: node tests/security/run-security-tests.js
      - run: npm audit --omit=dev
```

**Retest.** A pull request that removes the origin check fails CI.

### ERP-SA-16: Session cookies are scoped by host, not by port (Informational)

**Fix.** Serve the hub on its own host name, or use the __Host- cookie prefix with Secure once TLS is in place.

```
Set-Cookie: __Host-hub_session=...; Secure; HttpOnly; SameSite=Lax; Path=/
```

**Retest.** The portal origins no longer receive the hub cookie in their request headers.

### ERP-SA-17: Rotated secrets are retained as *.old files; secret files are mode 0644 inside a 0700 directory (Informational)

**Fix.** Delete the *.old files once the rebuild of the lookup mirror is confirmed, and keep them in an encrypted vault if retention is required.

```
shred -u docker/.secrets/*.old
```

**Retest.** ls docker/.secrets shows no *.old files.

### ERP-SA-18: Secret scanner reports are all in captured third-party site assets, none in first-party history (Informational)

**Fix.** Add a .gitleaks.toml that allowlists the captured-asset directories and test fixtures so that any new match is a real signal.

```
[allowlist]
paths = ['''backend/gov_replica/.*/(original_assets|reference_pages|analysis)/''', '''tests/_test-secrets.js''']
```

**Retest.** gitleaks reports 0 findings on a clean tree.

