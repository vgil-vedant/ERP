# Architecture

## Processes and ports

| Process | Code | Listens on | Database |
|---|---|---|---|
| ERP | `backend/erp-api` | `127.0.0.1:4200` | `database/sqlite/erp/data/erp.sqlite` |
| Platform | `backend/platform-api` | hub `:4100`, portals `:4173 :4175 :4176 :4177 :4178` | `database/sqlite/platform/data/platform.sqlite` |
| Replica copies (optional) | `backend/gov_replica/*/*/replica/backend` | LAN address, `:5173 :5175 :5176 :5177 :5178` | each project's own `replica.sqlite` |
| Docker stack (`compose.yaml`) | `ERP_erp_api`, `ERP_platform_api` on network `ERP_net` | ERP console `127.0.0.1:4200`, hub `:4100` and portals `:4173 :4175 :4176 :4177 :4178` on the LAN address, Postgres `127.0.0.1:7432` | volumes `ERP_erp_data`, `ERP_platform_data`, `ERP_postgres_data` (container `ERP_postgres`) |
| PostgreSQL | external | `127.0.0.1:5476` | `demo_replica` (five tables) |

| Port | Portal |
|---|---|
| 4173 | ePrisons |
| 4175 | CCTNS |
| 4176 | e-Forensics |
| 4177 | UIDAI / Aadhaar |
| 4178 | eCourts |

## Data flow

```
 citizen / officer ──► five portals (:4173–4178)
                              │  one process, one database
                              ▼
                     platform-api ── platform.sqlite
                              │  HTTP only (POST /api/intake)
                              ▼
                        erp-api ── erp.sqlite

 SQLite files ──(read-only, database/postgres/scripts/migrate.js)──► demo_replica
                       aadhaar_data  cctns_data  ecourts_data  eforensics_data  eprisons_data
```

A submission is written to the platform database and to the ERP, or to neither:
if the ERP refuses, the platform rolls its row back.

[**blueprint.html**](blueprint.html) draws all of this in detail — runtime topology, the
accepted and refused write-through step by step, and an entity-relationship diagram of both
databases. Open it in a browser; it is one self-contained file with no dependencies.
Every figure in it was read from the live schema.

## Where things live

| Concern | Path |
|---|---|
| Server code | `backend/platform-api/src`, `backend/erp-api/src` |
| Paths used by the servers | `backend/shared/paths.js`, each service's `src/config/paths.js` |
| Portal views and static files | `frontend/portals/<portal>/{views,public}` |
| Hub and ERP console views | `frontend/platform-hub`, `frontend/erp-console` |
| Research, captures, replica backends | `backend/gov_replica/<Category>/<host>/` |
| Crawler and generator | `backend/tools` |
| SQLite schemas and data | `database/sqlite/{platform,erp}` |
| PostgreSQL migration | `database/postgres` |
| Requirements and research reports | `docs/requirements`, `docs/research_reports` |
| Drawn system blueprint | `docs/architecture/blueprint.html` |
| End-to-end tests | `tests/e2e` |

## Rules this repository follows

- The platform and the ERP never open each other's database. The platform talks to the ERP over HTTP only.
- A process binds only a port that is free. Nothing here stops or takes over a process that belongs to another project.
- Every row is synthetic. None of this contacts a government system.
