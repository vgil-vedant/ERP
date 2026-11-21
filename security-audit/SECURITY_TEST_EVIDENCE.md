# Sanitised test evidence (2026-11-21)

No secret values, hashes or personal data appear here. The local LAN and public addresses are omitted.

| # | What was run | Result |
|---|---|---|
| E1 | `node tests/security/run-security-tests.js` (temporary databases, unused ports) | 105 passed, 0 failed |
| E2 | `npm audit --json` at the root (all and `--omit=dev`) | 0 advisories |
| E3 | `npm audit --json` in frontend/web, all packages / `--omit=dev` | 6 advisories (2 critical, 2 high, 2 moderate) / 0 |
| E4 | Gitleaks 8.30.1 `git` (17 commits, ~427 MB), redacted | 8,521 matches, all in captured third-party assets |
| E5 | Gitleaks `dir`, redacted | 8,656 matches; 176 outside captured assets: 147 runtime SQLite files (ignored by Git), 27 crawl-analysis JSON, 2 test fixtures |
| E6 | Trivy 0.76.2 `fs` on lockfiles and `config` on Dockerfile, compose, edge | 1 finding (playwright 1.49.1, CVE-2025-59288); 0 misconfigurations |
| E7 | Trivy `image` HIGH/CRITICAL: erp_platform_api, caddy, postgres | 7/76, 6/100, 1/48 (critical/high) |
| E8 | `curl -I` hub login on LAN address and edge port | 200 over HTTP; security headers present; no Strict-Transport-Security |
| E9 | Unauthenticated GET of hub `/api/dashboard`, `/api/me`, `/api/people`, `/api/summary` | 401 each; `/` redirects to `/login` |
| E10 | Unauthenticated GET of ERP `/api/citizens` (loopback) | 401 |
| E11 | GET `/__platform` and `/api/summary` through the edge | 404 and 401 |
| E12 | Request with `Origin: https://evil.example` to the edge | no `Access-Control-*` headers returned |
| E13 | `docker ps`, `ss -ltn`, `docker image inspect` | edge on 0.0.0.0:5011-5016; app ports on the LAN address; ERP console and PostgreSQL on 127.0.0.1; NODE_VERSION 18.20.8; user node |
| E14 | `git ls-files` for sensitive paths; file metadata of docker/.secrets (modes, sizes, dates only) | backups tracked; pg_password 9 bytes dated 2026-10-28; others 48 bytes dated 2026-11-20 |
| E15 | Semgrep, OSV-Scanner, ZAP, Checkov, testssl.sh | not run (see report, Section 9) |
