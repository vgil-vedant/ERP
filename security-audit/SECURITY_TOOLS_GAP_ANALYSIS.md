# Security tools gap analysis

Assessment date: 2026-11-21. "Run here" means used during this audit, from a scratch folder outside the project.

| Tool | Purpose | Installed in project | Configured | In CI | Run here | Usefulness here | Priority |
|---|---|---|---|---|---|---|---|
| npm audit | Dependency advisories | Yes (npm) | No | No | Yes | High: covers the production tree at no cost | High |
| Gitleaks | Secret detection | No | No | No | Yes | High: needs an allowlist (SA-18) | High |
| Trivy | Images, lockfiles, IaC | No | No | No | Yes | High: found SA-05, SA-06, SA-13 | High |
| Syft (SBOM) | Inventory | No | No | No | No | Medium: Trivy can also emit an SBOM | Medium |
| OSV-Scanner | Dependency advisories | No | No | No | No | Low: parse failed here; npm audit covers it | Low |
| Semgrep | Static analysis | No | No | No | No | Medium: could not install here | Medium |
| OWASP ZAP | Dynamic baseline | No | No | No | No | Medium: run against staging | Medium |
| testssl.sh | TLS checks | No | No | No | No | Not yet: no TLS to test | After SA-01 |
| Checkov | IaC scanning | No | No | No | No | Low: Trivy config found no issues | Low |
| Falco / Wazuh | Runtime and log monitoring | No | No | No | No | Medium for a public host | Medium |
| SonarQube / DefectDojo / AIDE / Burp | Platform and manual tools | No | No | No | No | Low: disproportionate for this size | Low |

Not installable or not run in this environment: Semgrep (pip bootstrap was not permitted), OSV-Scanner (lockfile parse failed), OWASP ZAP, Checkov, testssl.sh (no TLS yet). CI (`.github/workflows/ci.yml`) runs front-end checks only.
