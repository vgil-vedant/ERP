# Application Security Audit Report: EkSetu (Unified Records)

Version 1.0 | 21 November 2026 | Confidential

## Abstract

This report presents a source-level and configuration-level security assessment of the EkSetu (Unified Records) application: a Node.js 18 / Express back end with a React front end, a hub, five replicated government-portal front ends, per-department SQLite offices, an integration bus into a separate ERP service, a PostgreSQL database, and a Caddy edge proxy. The assessment was non-destructive. It combined code review, live read-only requests against the local deployment, the project's own 105-check security regression suite (all passed), and Gitleaks, Trivy and npm audit scans. 41 controls were evaluated: 17 passed, 11 partially, 5 failed, 5 are not implemented and 3 were not tested. 18 findings are reported: no critical, 1 high, 5 medium, 9 low and 3 informational. The code base shows deliberate security engineering (no built-in secrets, salted password hashes, hashed session tokens, origin checks, security headers, hardened containers). The most important weaknesses are in deployment rather than in the code: the site is served over plain HTTP on public and LAN addresses, the administrator login is reachable from any address, database backups are tracked in Git, and the database credential and runtime versions are weak or end-of-life. We recommend enabling TLS first, then restricting access, purging the backups, and rotating the database credential.

## Findings

| ID | Title | Severity | Status |
|---|---|---|---|
| ERP-SA-01 | Hub, portals and citizen sign-in are served over plain HTTP, including on public and LAN addresses | High | Confirmed |
| ERP-SA-02 | Administrator sign-in is reachable from any address; edge allowlist is unset | Medium | Confirmed |
| ERP-SA-03 | Database backups and SQLite files are committed to the Git history | Medium | Confirmed |
| ERP-SA-04 | Weak, unrotated PostgreSQL credential, and the application connects as the database superuser | Medium | Confirmed |
| ERP-SA-05 | Node.js 18 (end-of-life) is the runtime of both application images and of CI | Medium | Confirmed |
| ERP-SA-06 | Container images carry HIGH and CRITICAL OS and library advisories (scanner-reported) | Medium | Scanner-reported |
| ERP-SA-07 | Hub administrator authentication is a single shared account with per-address, in-memory throttling and no second factor | Low | Confirmed |
| ERP-SA-08 | scrypt cost parameter (N = 16384) is below the OWASP recommended minimum | Low | Confirmed |
| ERP-SA-09 | Citizen registration reveals whether an email address is already registered | Low | Confirmed |
| ERP-SA-10 | Citizen password policy is a minimum length of 8 only | Low | Confirmed |
| ERP-SA-11 | Integration-bus signing uses one shared secret, a time window only, and no throttle on failed signatures | Low | Confirmed |
| ERP-SA-12 | Output-encoding and Content-Security-Policy gaps (defence in depth) | Low | Confirmed |
| ERP-SA-13 | Development-time dependency advisories (frontend/web and backend/tools) | Low | Scanner-reported |
| ERP-SA-14 | No resource limits on any container; the database container is less hardened than the application containers | Low | Confirmed |
| ERP-SA-15 | CI runs the front-end only: no backend tests, security suite or scanners | Low | Confirmed |
| ERP-SA-16 | Session cookies are scoped by host, not by port | Informational | Observation |
| ERP-SA-17 | Rotated secrets are retained as *.old files; secret files are mode 0644 inside a 0700 directory | Informational | Observation |
| ERP-SA-18 | Secret scanner reports are all in captured third-party site assets, none in first-party history | Informational | Observation |

### ERP-SA-01: Hub, portals and citizen sign-in are served over plain HTTP, including on public and LAN addresses (High, Confirmed)

**Location.** `deploy/edge/Caddyfile (auto_https off); deploy/edge/compose.yaml (0.0.0.0:5011-5016); running container ERP_platform_api (LAN address :4100, :4173, :4175-4178); backend/shared/security.js cookie()`

**Explanation.** The public edge (Caddy) is configured with auto_https off and serves the hub and the five portals over HTTP on all interfaces; the application container also publishes its ports on the host LAN address. No TLS is terminated anywhere, and no Strict-Transport-Security header is sent [8] because the code adds it only when req.secure is true. OWASP's transport-layer guidance [4] expects HTTPS everywhere. The session cookie is marked Secure only when the request itself arrived over HTTPS, so over HTTP it is sent without the Secure flag.

**Evidence.** Caddyfile line "auto_https off"; ss -ltn shows 0.0.0.0:5011-5016 listening; GET http://127.0.0.1:5011/login returned 200 over HTTP with no Strict-Transport-Security header; the project security suite itself asserts "the session cookie is not marked Secure over plain HTTP".

**Impact.** Anyone on the network path (public Internet hops, shared LAN) can read or alter traffic: the administrator password at /login, officer and citizen passwords, session cookies (session hijack) and the Aadhaar-linked records shown in the hub.

**Prerequisites.** Network position between a user and the server (same LAN, Wi-Fi, or an on-path ISP/router). No credentials needed.

**Recommendation.** Terminate TLS at the edge (a domain name with automatic certificates, or an internal CA for an IP-only site), redirect HTTP to HTTPS, enable HSTS, and stop publishing application ports on the LAN address (bind them to 127.0.0.1 so only the edge can reach them).

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

**Verification.** curl -sI http://HOST/login returns a 301/308 to https; curl -sI https://HOST/login shows Strict-Transport-Security; the session cookie carries Secure; nmap shows no application port open on the LAN address.

### ERP-SA-02: Administrator sign-in is reachable from any address; edge allowlist is unset (Medium, Confirmed)

**Location.** `deploy/edge/Caddyfile @blocked matcher; deploy/edge/.state/ports.env (no EDGE_ALLOW entry)`

**Explanation.** The edge supports an optional source-address allowlist (EDGE_ALLOW) but its default is 0.0.0.0/0 and the state file contains no EDGE_ALLOW value. The hub administrator login, the office (officer) logins and the citizen portals are therefore reachable from the whole Internet. The administrator account is a single shared account with no second factor (see ERP-SA-07).

**Evidence.** Caddyfile: "@blocked not remote_ip 127.0.0.1/32 {$EDGE_ALLOW:0.0.0.0/0 ::/0}"; ports.env lists EDGE_PORT_* and ERP_PUBLIC_PORT_MAP but no EDGE_ALLOW; the hub login page returned 200 on the edge port.

**Impact.** Widens the population able to attempt password guessing against the only administrator and the officer accounts; compounds ERP-SA-01 because credentials cross the Internet in clear text.

**Prerequisites.** Internet access to the edge ports.

**Recommendation.** Set EDGE_ALLOW to the office address ranges (or a VPN range) for the hub and office paths, keeping citizen-facing portals separate if they must stay public.

```
# deploy/edge/.state/ports.env
EDGE_ALLOW=203.0.113.0/24 198.51.100.17/32
```

**Verification.** From an address outside the allowlist the hub login returns 403; from an allowed address it returns 200.

### ERP-SA-03: Database backups and SQLite files are committed to the Git history (Medium, Confirmed)

**Location.** `backup/demo_replica_backup_20261028.dump; backup/sqlite-local-20261028/erp.sqlite; backup/sqlite-local-20261028/platform.sqlite (commit 2d0fe5d)`

**Explanation.** Three database artefacts are tracked in Git even though .gitignore lists *.sqlite: a PostgreSQL custom-format dump (about 219 KB) and the two SQLite files (about 110 KB and 836 KB). The platform schema contains password_hash and password_salt columns. The artefacts are not encrypted. Their contents were deliberately not opened during this audit, so whether they hold real or synthetic personal data was not verified; the project describes the data as demonstration data.

**Evidence.** git ls-files lists the three paths; git log shows them in the initial commit 2d0fe5d; database/sqlite/platform/schema.sql defines password_hash / password_salt.

**Impact.** Anyone who can read the repository or any clone (including CI caches and forks) obtains the databases, offline-crackable credential hashes and any personal data they hold; history rewriting is required to remove them.

**Prerequisites.** Read access to the repository.

**Recommendation.** Remove the files from the repository, rewrite history (git filter-repo) after confirming with the repository owner, keep backups outside Git in encrypted storage, and extend .gitignore to backup/.

```
git filter-repo --path backup --invert-paths   # after agreement and a fresh clone
echo "backup/" >> .gitignore
```

**Verification.** git log --all -- backup returns nothing; gitleaks and trufflehog report no database files; backups restore from the encrypted store.

### ERP-SA-04: Weak, unrotated PostgreSQL credential, and the application connects as the database superuser (Medium, Confirmed)

**Location.** `docker/.secrets/pg_password (file metadata); compose.yaml postgres POSTGRES_USER and erp_api PGUSER`

**Explanation.** The PostgreSQL password file is 9 bytes long and was last modified on 2026-10-28, whereas the other secrets are 48 bytes and were regenerated on 2026-11-20. The role named by POSTGRES_USER is created by the image as superuser, and the ERP API connects with that same role (PGUSER defaults to the same value), so a compromise of the API process yields full database control. The database port is bound to 127.0.0.1 only, which limits exposure. The password value itself was not read.

**Evidence.** ls -l: pg_password 9 bytes, dated Oct 28; other secret files 48 bytes, dated Nov 20; compose.yaml shows POSTGRES_USER and PGUSER both defaulting to the same name.

**Impact.** A short password is feasible to brute-force by anything that can reach 127.0.0.1:7432 (another local user, or a compromised container on the host); superuser rights remove any containment of SQL-level mistakes.

**Prerequisites.** Local or container-level access to the database port.

**Recommendation.** Generate a 32-byte random password, create a separate least-privilege application role (no superuser, no CREATEDB), and point erp_api at it.

```
CREATE ROLE erp_app LOGIN PASSWORD :'pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE demo_replica TO erp_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO erp_app;
```

**Verification.** SELECT rolsuper FROM pg_roles WHERE rolname = current_user returns false from the API; docker/make-secrets.sh output for pg_password is 32 bytes or more.

### ERP-SA-05: Node.js 18 (end-of-life) is the runtime of both application images and of CI (Medium, Confirmed)

**Location.** `docker/Dockerfile (ARG NODE_IMAGE=node:18-bookworm-slim); .github/workflows/ci.yml (node-version: 18); image environment NODE_VERSION=18.20.8`

**Explanation.** Both services run on Node.js 18.20.8. Node.js 18 reached end-of-life in April 2025 [9], so it no longer receives security fixes for the runtime, its OpenSSL build, or its bundled npm.

**Evidence.** docker image inspect erp_platform_api:1.0.0 shows NODE_VERSION=18.20.8; the Dockerfile and CI file both pin major version 18.

**Impact.** Vulnerabilities disclosed in the Node.js runtime after its end-of-life date will not be patched upstream for this version line.

**Prerequisites.** Depends on the specific vulnerability; none was exploited in this audit.

**Recommendation.** Move the images and CI to a supported LTS line (Node 22 or newer), then re-run the test suites and rebuild both images.

```
ARG NODE_IMAGE=node:22-bookworm-slim
# ci.yml: node-version: 22
```

**Verification.** docker run --rm erp_platform_api node -v prints a supported release; CI green on the new version; security suite still reports 0 failures.

### ERP-SA-06: Container images carry HIGH and CRITICAL OS and library advisories (scanner-reported) (Medium, Scanner-reported)

**Location.** `erp_platform_api:1.0.0 (Debian 12.11 base), caddy:2.10.2-alpine, postgres:16-alpine`

**Explanation.** Trivy v0.76.2 reported advisories against the images in use: erp_platform_api 7 CRITICAL and 76 HIGH, caddy 6 CRITICAL and 100 HIGH, postgres 1 CRITICAL and 48 HIGH. Most are operating-system packages with a fixed version available (for example libgnutls30, perl-base, curl, krb5-libs), plus the Go standard library inside the caddy and gosu binaries and the tar and brace-expansion packages bundled with the image's npm. Reachability from this application was not assessed, so these are scanner findings, not verified exploits. The ERP API image is built from the same Dockerfile base; it was not scanned separately.

**Evidence.** trivy image --scanners vuln --severity HIGH,CRITICAL on the three images; counts above; examples: CVE-2026-33845 (libgnutls30), CVE-2025-68121 (Go stdlib), CVE-2026-31789 (libssl3).

**Impact.** Unpatched base-image packages enlarge the attack surface of the edge and database containers in particular, because both are network-reachable services.

**Prerequisites.** Varies per advisory; not verified.

**Recommendation.** Rebuild on a current base image (apt-get upgrade in the build, newer caddy and postgres patch tags), pin by digest, and re-scan until only accepted advisories remain.

```
FROM node:22-bookworm-slim@sha256:<digest>
RUN apt-get update && apt-get -y upgrade && rm -rf /var/lib/apt/lists/*
```

**Verification.** trivy image --severity HIGH,CRITICAL --exit-code 1 <image> exits 0, or lists only documented exceptions.

### ERP-SA-07: Hub administrator authentication is a single shared account with per-address, in-memory throttling and no second factor (Low, Confirmed)

**Location.** `backend/platform-api/src/services/hub-auth.js; backend/shared/admin-account.js`

**Explanation.** There is one administrator account for the hub and the ERP console. Failed sign-ins are throttled per client address (8 in 10 minutes), the counter lives in memory and resets when the process restarts, sessions last 12 hours with no inactivity timeout, and no multi-factor option exists. The throttle does not slow an attacker who rotates addresses.

**Evidence.** hub-auth.js: limiter({ max: 8, windowMs: 10 min }), SESSION_HOURS = 12, sessions held in a Map; no MFA code path found.

**Impact.** With ERP-SA-01 and ERP-SA-02, a stolen or guessed password gives full administrative access with no second barrier and no individual accountability.

**Prerequisites.** Knowledge of the single password.

**Recommendation.** Add per-account lockout or exponential delay, an idle timeout, and TOTP or WebAuthn for the administrator; move to named accounts so audit entries identify a person.

```
// idle timeout: refresh `exp = now + 30 min` on each request, cap at 12 h absolute
```

**Verification.** Ten wrong passwords from different test addresses still slow the account; an idle session is rejected after the timeout; sign-in requires the second factor.

### ERP-SA-08: scrypt cost parameter (N = 16384) is below the OWASP recommended minimum (Low, Confirmed)

**Location.** `backend/shared/security.js (SCRYPT = { N: 16384, r: 8, p: 1 }); backend/platform-api/src/db/index.js hashPassword()`

**Explanation.** Passwords are hashed with salted scrypt, which is a sound choice, but the work factor is Node's default N = 2^14. The OWASP Password Storage Cheat Sheet lists N = 2^17 (with r = 8, p = 1) as the minimum configuration [3]. Citizen passwords use the Node defaults without any explicit cost.

**Evidence.** security.js line "const SCRYPT = { N: 16384, r: 8, p: 1 }"; db/index.js calls crypto.scryptSync(password, salt, 32) with defaults.

**Impact.** An attacker holding a leaked hash (for example through ERP-SA-03) can test guesses about eight times faster than at the recommended cost.

**Prerequisites.** Possession of a hash.

**Recommendation.** Raise N to 2^17 and store the parameters with each hash so existing hashes still verify and can be upgraded at next sign-in. maxmem must be raised accordingly.

```
crypto.scryptSync(pw, salt, 32, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 })
```

**Verification.** New hashes carry the new parameters; a unit test verifies old and new hashes; sign-in latency stays acceptable.

### ERP-SA-09: Citizen registration reveals whether an email address is already registered (Low, Confirmed)

**Location.** `backend/platform-api/src/services/identity.js line 128`

**Explanation.** Registering with an existing address returns "That email is already registered. Sign in instead." The sign-in form, by contrast, gives a generic message. Registration is limited to 10 per hour per address, which slows but does not prevent enumeration.

**Evidence.** Source line 128; sign-up limiter on line 60.

**Impact.** An attacker can learn which email addresses hold citizen accounts, aiding phishing and targeted guessing.

**Prerequisites.** Access to the registration form.

**Recommendation.** Respond identically whether or not the address exists and send the outcome by email, or accept the disclosure explicitly for this demonstration.

```
// always: 'If this address can be registered, we have sent a confirmation.'
```

**Verification.** Registering a known and an unknown address produce byte-identical responses and timing within noise.

### ERP-SA-10: Citizen password policy is a minimum length of 8 only (Low, Confirmed)

**Location.** `backend/platform-api/src/services/identity.js lines 80-84`

**Explanation.** The only rules are 8 to 200 characters and a matching confirmation. NIST SP 800-63B [7] recommends screening new passwords against lists of commonly used and breached passwords. No password-reset flow was found among the reviewed routes.

**Evidence.** identity.js validateRegistration().

**Impact.** Weak but length-compliant passwords (for example "password1") are accepted.

**Prerequisites.** None.

**Recommendation.** Reject passwords on a common-password list (a local top-10,000 list is enough), keep the length minimum, and avoid composition rules.

```
if (COMMON.has(password.toLowerCase())) errors.password = 'Choose a less common password.';
```

**Verification.** Registration with a listed password is refused; a random 12-character password is accepted.

### ERP-SA-11: Integration-bus signing uses one shared secret, a time window only, and no throttle on failed signatures (Low, Confirmed)

**Location.** `backend/erp-api/src/lookup/ingest.js verify(); backend/erp-api/src/auth.js (ingest door open)`

**Explanation.** The ERP accepts POST /api/ingest/events without any other credential when the HMAC-SHA-256 signature and timestamp are valid. All five departments sign with the same secret, and the department name is taken from the request body, so any holder of the secret can speak for any department. The timestamp window is five minutes with no nonce, so a captured delivery can be replayed inside that window. Failed signatures are not counted by the sign-in throttle.

**Evidence.** verify() checks X-Integration-Timestamp within SKEW_MS = 5 minutes and the HMAC over "ts.body"; auth.js lets POST /api/ingest/events through before the throttle. Event idempotency was not tested independently.

**Impact.** Limited by the endpoint being bound to loopback in the observed deployment and by the secret being 48 bytes; if the secret leaks, forged department records can enter the lookup mirror.

**Prerequisites.** The shared integration secret, or a captured request within five minutes.

**Recommendation.** Use a distinct secret per department and bind the signed source to it, add a nonce or event-id replay cache, and count failed signatures per address.

```
const secret = SECRETS[source]; // one per department
if (seen.has(e.id)) return 'replay';
```

**Verification.** A delivery signed with department A's secret but claiming source B is refused; a replayed body is rejected; repeated bad signatures return 429.

### ERP-SA-12: Output-encoding and Content-Security-Policy gaps (defence in depth) (Low, Confirmed)

**Location.** `backend/platform-api/src/server.js (style-src 'unsafe-inline'); backend/erp-api/src/server.js (sec.headers() without csp); frontend/erp-console/views/dashboard.ejs lines 273-275; frontend/web/src/portals/behaviours.ts line 32`

**Explanation.** (a) The hub and portal policies allow inline styles. (b) The ERP console sends no Content-Security-Policy [6]. (c) The legacy EJS console embeds JSON with <%- JSON.stringify(...) %> without escaping "<", unlike the other pages which escape it. (d) The portal cascading-select code builds option markup from server-supplied values without escaping the value attribute. In each case the data originates from server-controlled lists or counts, and no exploit was demonstrated; these are hardening gaps, not confirmed XSS.

**Evidence.** Source lines as listed; live headers from the hub login show the policy including style-src 'unsafe-inline'.

**Impact.** If a future change lets user-controlled text reach these sinks, script injection becomes possible with little further effort.

**Prerequisites.** A future data path to the sinks.

**Recommendation.** Escape "<" when embedding JSON, escape attribute values, add a CSP to the ERP console, and move inline styles to classes so unsafe-inline can be dropped.

```
const json = JSON.stringify(x).replace(/</g, '\\u003c');
```

**Verification.** A test payload containing </script> in a department name renders as text; the ERP console responds with a CSP header.

### ERP-SA-13: Development-time dependency advisories (frontend/web and backend/tools) (Low, Scanner-reported)

**Location.** `frontend/web/package.json (vitest 2.1.9, vite 5.4.21, postcss 8.5.33, esbuild); backend/tools/package-lock.json (playwright 1.49.1)`

**Explanation.** npm audit with development packages included reports 6 advisories in frontend/web (2 critical via vitest and tinypool, 2 high via vite and postcss, 2 moderate), for example GHSA-9crc-q9x8-hgqq (vitest) and GHSA-6g55-p6wh-862q (postcss) [10]. Trivy [12] reports CVE-2025-59288 (HIGH) for playwright 1.49.1, fixed in 1.55.1 [11]. All affect development servers or build tooling. npm audit with --omit=dev reports zero advisories for every workspace, so the production dependency trees were clean at the time of the scan.

**Evidence.** npm audit --json (root: 0 total; frontend/web with dev packages: 6 total); npm audit --omit=dev: 0 in both; trivy fs on the lockfiles.

**Impact.** A developer running the Vite or Vitest server on a machine that browses untrusted sites could be affected; the shipped application is not.

**Prerequisites.** A developer workstation running the affected dev servers.

**Recommendation.** Upgrade vitest, vite and playwright to current patch lines, and run npm audit in CI.

```
npm install -D vitest@latest vite@latest postcss@latest
npm --prefix backend/tools install playwright@latest
```

**Verification.** npm audit reports 0 advisories with and without --omit=dev.

### ERP-SA-14: No resource limits on any container; the database container is less hardened than the application containers (Low, Confirmed)

**Location.** `compose.yaml (hardening anchor; postgres service)`

**Explanation.** The application services inherit a strong baseline (read-only root file system, all capabilities dropped, no-new-privileges, non-root user "node", in line with the CIS Docker Benchmark [14]), and the edge container is also non-root with capabilities dropped. None of the services sets memory, CPU or process limits, and the postgres service does not use the baseline (no read-only file system, capabilities not dropped).

**Evidence.** compose.yaml: x-hardening anchor has no mem_limit, cpus or pids_limit; postgres block lists only security_opt no-new-privileges.

**Impact.** A runaway or abused process can exhaust host memory or CPU and take down the other services, including the other applications sharing this host.

**Prerequisites.** Ability to trigger heavy requests; availability testing was out of scope.

**Recommendation.** Add mem_limit, cpus and pids_limit to each service, and apply cap_drop to postgres with only the capabilities its entrypoint needs.

```
services:
  platform_api:
    mem_limit: 768m
    cpus: 1.0
    pids_limit: 256
```

**Verification.** docker inspect shows the limits; the stack passes its health checks under the project test load.

### ERP-SA-15: CI runs the front-end only: no backend tests, security suite or scanners (Low, Confirmed)

**Location.** `.github/workflows/ci.yml`

**Explanation.** The single CI job type-checks, tests and builds frontend/web. The backend, the 105-check security regression suite (tests/security) and the other test suites run only when someone starts them. No dependency, secret or image scan runs in CI, and actions are referenced by tag rather than commit SHA.

**Evidence.** ci.yml contains one job (web); no step references npm audit, gitleaks, trivy or the test:* scripts.

**Impact.** A change that reopens a closed door (the suite checks 105 of them) can be merged without any automatic signal.

**Prerequisites.** None.

**Recommendation.** Add a backend job running the security and department suites, plus Gitleaks and Trivy steps, and pin actions by SHA.

```
  security:
    steps:
      - run: node tests/security/run-security-tests.js
      - run: npm audit --omit=dev
```

**Verification.** A pull request that removes the origin check fails CI.

### ERP-SA-16: Session cookies are scoped by host, not by port (Informational, Observation)

**Location.** `backend/shared/security.js cookie(); backend/platform-api/src/services/identity.js (header comment on cookies by host)`

**Explanation.** Browsers send cookies to every port of the same host. The hub session cookie (hub_session) and the citizen cookie are therefore also sent to the portal ports on that host. The hub cookie is HttpOnly and its token is validated server-side, and all services are one process, so no exploitation path was found; it does mean the hub shares a cookie jar with five replica portals.

**Evidence.** Cookie attributes in code (Path=/, HttpOnly, SameSite=Lax); the identity module documents that cookies are not port-isolated.

**Impact.** Reduced isolation if a portal origin were ever compromised.

**Prerequisites.** A separate weakness in a portal origin.

**Recommendation.** Serve the hub on its own host name, or use the __Host- cookie prefix with Secure once TLS is in place.

```
Set-Cookie: __Host-hub_session=...; Secure; HttpOnly; SameSite=Lax; Path=/
```

**Verification.** The portal origins no longer receive the hub cookie in their request headers.

### ERP-SA-17: Rotated secrets are retained as *.old files; secret files are mode 0644 inside a 0700 directory (Informational, Observation)

**Location.** `docker/.secrets/ (lookup_pepper.old, uidai_token_key.old; most other files 0644 owned by root)`

**Explanation.** The rotation script keeps the previous LOOKUP_PEPPER and UIDAI_TOKEN_KEY as *.old files. The directory itself is mode 0700, which prevents other local users from reading the files, so the effective exposure is limited to the owner and root. Old keys remain usable for anything encrypted or hashed under them.

**Evidence.** ls -l metadata only; contents were not read.

**Impact.** Minor: extends the lifetime of retired key material.

**Prerequisites.** Local access as the owner or root.

**Recommendation.** Delete the *.old files once the rebuild of the lookup mirror is confirmed, and keep them in an encrypted vault if retention is required.

```
shred -u docker/.secrets/*.old
```

**Verification.** ls docker/.secrets shows no *.old files.

### ERP-SA-18: Secret scanner reports are all in captured third-party site assets, none in first-party history (Informational, Observation)

**Location.** `backend/gov_replica/*/original_assets and reference_pages`

**Explanation.** Gitleaks v8.30.1 [13] scanned 17 commits (about 427 MB) and reported 8,521 matches, all of them under the captured third-party site content (JWT-shaped strings and keys inside public JavaScript and HTML). Scanning the working tree reported 8,656, of which 176 fall outside the captured assets: crawl-analysis JSON in the same replica folders, runtime SQLite write-ahead files in database/ (ignored by Git), and the deliberately labelled test fixtures in tests/_test-secrets.js. No first-party credential was found in the commit history by this scan. This is a positive observation, not a vulnerability.

**Evidence.** gitleaks git --redact and gitleaks dir --redact reports; matches grouped by path prefix.

**Impact.** None directly; the volume of third-party matches will mask a real secret in future scans.

**Prerequisites.** n/a

**Recommendation.** Add a .gitleaks.toml that allowlists the captured-asset directories and test fixtures so that any new match is a real signal.

```
[allowlist]
paths = ['''backend/gov_replica/.*/(original_assets|reference_pages|analysis)/''', '''tests/_test-secrets.js''']
```

**Verification.** gitleaks reports 0 findings on a clean tree.

## Untested hypotheses

- **P-1: ERP console state changes and cached Basic credentials.** The ERP API has no Origin check (the hub and portals do). Browsers resend cached HTTP Basic credentials to the origin, so a cross-site form post to the console could carry them (see [5]). The only state-changing route reachable with Basic credentials found was the audited Aadhaar-reveal POST, and the port is bound to 127.0.0.1. Not tested.
- **P-2: Client-address spoofing behind the edge.** Rate limits key on req.ip, which trusts X-Forwarded-For only from the edge container. The Caddyfile states that client-supplied values are replaced. This was not tested with forged headers.
- **P-3: Duplicate processing of a replayed delivery.** Replays inside the five-minute window rely on the ERP treating repeated event identifiers as duplicates. The behaviour is described in the dashboard but was not tested independently.
- **P-4: Citizen-account object access (IDOR).** The citizen account pages were not exercised with two accounts, so horizontal access control between citizens is untested.

## Control matrix

| Category | Control | Result | Basis |
|---|---|---|---|
| Authentication & sessions | Unauthenticated API access refused | PASS | Live: hub /api/* and ERP /api/citizens returned 401 |
| Authentication & sessions | Password hashing | PARTIAL | Salted scrypt, cost below OWASP minimum (SA-08) |
| Authentication & sessions | Session tokens (random, hashed at rest) | PASS | 256-bit tokens; SHA-256 stored; suite checks |
| Authentication & sessions | Cookie flags HttpOnly / SameSite | PASS | Code and suite |
| Authentication & sessions | Cookie Secure flag | PARTIAL | Set only over HTTPS; site is HTTP (SA-01) |
| Authentication & sessions | Brute-force throttling | PARTIAL | Per address, in memory (SA-07) |
| Authentication & sessions | Multi-factor authentication | NOT IMPLEMENTED | No code path found |
| Authentication & sessions | Account enumeration resistance | PARTIAL | Sign-in generic; registration discloses (SA-09) |
| Access control | Open redirect protection | PASS | safeNext(); suite checks |
| Access control | CSRF (hub and portals) | PASS | Origin / Sec-Fetch-Site; suite checks |
| Access control | CSRF (ERP console) | NOT TESTED | Hypothesis P-1 |
| Access control | Role separation (admin / officer / citizen) | PARTIAL | Distinct sessions; citizen IDOR untested (P-4) |
| Access control | Internal diagnostics hidden | PASS | Live: /__platform returned 404 via edge |
| Injection & XSS | SQL injection | PASS | Static review: values bound; dynamic fragments constant |
| Injection & XSS | Command injection | PASS | Only execFileSync in seed.js |
| Injection & XSS | Cross-site scripting | PARTIAL | React escapes; sink gaps (SA-12) |
| Injection & XSS | Path traversal / static files | PASS | Fixed maps and express.static |
| Injection & XSS | File upload handling | NOT IMPLEMENTED | No upload library or route found |
| API & transport | HTTPS / HSTS | FAIL | HTTP only (SA-01) |
| API & transport | Security headers | PASS | nosniff, frame, referrer, permissions-policy |
| API & transport | Content-Security-Policy | PARTIAL | Hub/portals yes; ERP console no (SA-12) |
| API & transport | CORS | PASS | No cross-origin headers sent (live) |
| API & transport | Request-size limits | PASS | 64 KB to 4 MB; 10 MB at edge |
| API & transport | Integration-bus authentication | PARTIAL | HMAC + time; shared secret (SA-11) |
| Data & database | Least-privilege DB role | FAIL | Superuser (SA-04) |
| Data & database | DB credential strength | FAIL | 9-byte secret (SA-04) |
| Data & database | Secrets not hard-coded | PASS | Env / *_FILE; production refuses default |
| Data & database | Encryption at rest | NOT IMPLEMENTED | SQLite and volumes unencrypted |
| Data & database | DB network exposure | PASS | Bound to 127.0.0.1 |
| Data & database | Backups | PARTIAL | Exist, restore tested per README; in Git (SA-03) |
| Infrastructure | Container hardening (app) | PASS | Read-only, cap_drop ALL, non-root |
| Infrastructure | Resource limits | NOT IMPLEMENTED | None set (SA-14) |
| Infrastructure | Exposed services | PARTIAL | Edge public; app ports on LAN (SA-01) |
| Infrastructure | Host firewall / SSH policy | NOT TESTED | Needs root; sshd allows pubkey, password default unknown |
| Supply chain | Production dependencies | PASS | npm audit --omit=dev: 0 |
| Supply chain | Development dependencies | PARTIAL | 6 advisories (SA-13) |
| Supply chain | Image currency / runtime support | FAIL | Node 18 EOL; image advisories (SA-05, SA-06) |
| Monitoring & operations | Audit logging | PASS | Append-only logs; sign-ins audited |
| Monitoring & operations | Security-event monitoring / alerting | NOT IMPLEMENTED | No SIEM or runtime monitor |
| Monitoring & operations | Security checks in CI | FAIL | None (SA-15) |
| Monitoring & operations | Business-logic and race conditions | NOT TESTED | Out of scope for this pass |

The formatted two-column report is `erp_application_security_report.pdf`; this file is its Markdown source summary.
