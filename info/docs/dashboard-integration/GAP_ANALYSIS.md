# Dashboard integration: project analysis and gap analysis

Reference UI: `info/template/erphub.html` (the "erp-hub-dashboard.html" reference).
Source of truth for behaviour: the running code, not the reference and not the README.
Analysed on branch `erp_hub`, 2026-11-02.

## A. Architecture as implemented

| Piece | Where | Notes |
|---|---|---|
| ERP service | `backend/erp-api` (:4200) | Express + EJS + better-sqlite3. Own database `erp.sqlite`. No authentication. |
| Platform service | `backend/platform-api` (hub :4100, portals :4173/4175/4176/4177/4178) | One process, one database `platform.sqlite`. Calls the ERP over HTTP (`services/erp-client.js`). |
| ERP console | `frontend/erp-console/views/*.ejs` | Server-rendered, already restyled (partial copy of the reference look). |
| Hub | `frontend/platform-hub/views/platform/*.ejs` | Server-rendered; the hub page is a simplified table view. |
| PostgreSQL | container `ERP_postgres`, database `demo_replica` | A **one-off, read-only migrated copy**. It is not the active application database. `erp-api/src/pg.js` reads it for the console's `/sync` and `/integration` pages. |

Active databases: `erp.sqlite` (tables `source_system`, `citizen`, `intake`, `intake_field`, `audit_log`)
and `platform.sqlite` (25 tables incl. `site`, `person`, `session`, `form`, `submission`,
`submission_field`, `erp_sync`, `audit_log`).

Service boundary (README and `ARCHITECTURE.md`): the platform calls the ERP; the ERP never calls a
portal and never opens the platform database. A browser never talks to a database.

## B. API inventory (verified in code)

### ERP service (:4200), no authentication, no pagination (limit only)

| Endpoint | Exists | Source | Parameters | Response |
|---|---|---|---|---|
| `POST /api/intake` | yes | `erp.sqlite` | JSON body | 201/200 `{intakeRef, citizenRef, duplicate}`, 400, 500 |
| `GET /api/intake` | yes | `intake` + `citizen` + `intake_field` | `limit` (default 50, **uncapped**), `system` | `{intake:[{id, intake_ref, source_system, source_form, source_route, source_reference, subject, payload, received_at, full_name, email, fields[]}]}` |
| `GET /api/citizens` | yes | `citizen` + counts | **none** (hard-coded 200) | `{citizens:[{..., intake_count, systems}]}` |
| `GET /api/summary` | yes | counts | none | `{citizens, intake, fields, bySystem[]}` |
| `GET /api/audit` | **no** | `audit_log` | | the console page `/audit` reads it server-side only |
| `GET /api/database`, `GET /api/health` | **no** | | | |

Console routes: `/`, `/intake`, `/citizens`, `/audit` (server-rendered), plus `/portals`, `/sync`,
`/integration` (read the **stale PostgreSQL snapshot** through `pg.js`).

### Platform service

| Endpoint | Exists | Source | Notes |
|---|---|---|---|
| hub `GET /api/summary` | yes | `platform.sqlite` | totals + per-site counts |
| hub `GET /api/people` | yes | `person` | latest 200, public fields only |
| hub `GET /api/submissions` | yes | `submission` | latest 200, no person name |
| hub `GET /api/sync` | yes | `erp_sync` | latest 200, **no source system column** |
| hub `GET /api/audit` | yes | platform `audit_log` | latest 200 |
| hub `GET /api/portals`, `/overview`, `/integration`, `/database`, `/health`, `/endpoints` | yes | added on this branch (`services/hub-stats.js`) | |
| portal `GET /__platform` | yes | | where a portal's data went |

## C. Component-by-component comparison

Status: IMPLEMENTED / PARTIAL / MISSING / UI ONLY (reference has it, no verified backend) / N/A.
"Resolved by" is the planned (and, after implementation, the delivered) change.

| # | Reference component | Backend today | Status | Resolved by |
|---|---|---|---|---|
| 1 | KPI cards (records, citizens, success, rolled back, audit, duplicates) | `/api/summary` has records and citizens only | PARTIAL | counts derived from the real intake, `erp_sync` and audit rows |
| 2 | Activity chart, donut, portal bars, health meter | no time series | PARTIAL | computed in the browser from the real rows |
| 3 | Recent audit activity | ERP has no audit API | MISSING | new `GET /api/audit` on the ERP |
| 4 | Portal quick-access cards | `SITES` config | IMPLEMENTED | real ports, link host follows the visitor's address |
| 5 | Date range selector, export summary | none | UI ONLY | works on the loaded real rows; CSV from real data |
| 6 | Received records table (search, source and form filters, sort, pagination, CSV, drawer) | `/api/intake` | PARTIAL | `limit` capped at 5000; the table engine paginates, sorts and filters in the browser; drawer shows real `intake_field` rows and stored payload |
| 7 | Citizens table (search, filter, sort, CSV, drawer) | `/api/citizens` fixed at 200 | PARTIAL | add `limit` to `/api/citizens`; record counts from `intake_count` |
| 8 | Audit trail | `store.auditTail` only | MISSING API | `GET /api/audit`; append-only preserved (read only) |
| 9 | Government portals (5 cards) | `SITES` | IMPLEMENTED | from the platform configuration |
| 10 | Sync activity (+ filters, drawer) | `erp_sync` has no site column | PARTIAL | join `submission`, `person` and rolled-back audit rows to attribute each attempt to a portal |
| 11 | Integration status | none | PARTIAL | statistics computed from the same real `erp_sync` rows |
| 12 | Submission monitoring | `/api/submissions` has no person | PARTIAL | join `person` for the name; refused attempts come from `erp_sync` |
| 13 | Database overview | none | MISSING | platform: `hub-stats.database()`; ERP: new `GET /api/database` |
| 14 | System health | `hub-stats.health()` exists, ERP has no health route | PARTIAL | new `GET /api/health` on the ERP (DB and PostgreSQL probe); Docker container health is **not visible from inside a container** and is shown as unavailable |
| 15 | Documentation | repo files | IMPLEMENTED | real paths; API list updated to the real endpoints |
| 16 | Sidebar collapse, mobile drawer, global search, toasts, modal | n/a | IMPLEMENTED (client) | kept exactly |

## D. Gap reports

1. **Missing dashboard components:** none removed. Every reference section is kept, with real data, an
   empty state or an error state.
2. **Missing backend APIs:** ERP `GET /api/audit`, `GET /api/database`, `GET /api/health`; hub
   `GET /api/dashboard` (aggregator, platform to ERP over HTTP).
3. **Missing response fields:** `erp_sync` rows lack the source system (derived by join); submission rows
   lack the person name (join `person`).
4. **Missing queries:** sync attribution join; submissions with person; per-site form counts.
5. **Missing filters:** form filter options and audit filter options were hard-coded in the reference;
   now built from the distinct real values.
6. **Missing search and pagination:** the APIs have none (limit only). The reference's table engine does
   search, sort, filter and pagination in the browser over up to 5000 loaded rows per table; the response says
   when rows were truncated.
7. **Missing sorting:** same as above (client-side).
8. **Missing export:** CSV is generated in the browser from the real rows; summary export likewise.
9. **Missing navigation:** none.
10. **Missing monitoring:** live health probes (new). Docker healthcheck status is unavailable from inside the
    container and is labelled as such.

## E. Findings outside the dashboard (not changed here)

* The ERP console's `/sync` and `/integration` pages read a **stale PostgreSQL snapshot** (`pg.js`), so they
  do not show live data. The new dashboard uses the live `erp_sync` ledger instead.
* `pg.js` reads the project `.env` file from disk as a fallback; the Docker secret path is the intended source.
* The ERP console builds its record drawer from HTML strings assembled from record values. A citizen name
  containing HTML could be injected. The new dashboard escapes every value.
* No authentication exists on either service (documented roadmap item).

## F. Outcome (after implementation)

Every row in section C is now backed by real data. Verified on a staging instance (ports 6100 to 6200,
throwaway databases), never on the live stack.

| Check | Result |
|---|---|
| Dashboard counts compared with direct SQL (records, citizens, audit events, kept, duplicate, rolled back, per-table row counts) | all match, on two different datasets |
| Functional click-through: 11 views, search, filters, sort, pagination, CSV, drawers, global search, date range, summary export, portal link | 53 of 53 pass |
| Empty database | proper empty states, no invented numbers (13 of 13) |
| ERP down | banner names the problem, ERP views empty, platform views still real, health row shows the ERP as not answering |
| Hub API failing after a good load | failure announced, last good data stays, recovers on the next refresh (11 of 11) |
| Hostile text (HTML in a citizen name) | shown as plain text, nothing runs |
| Responsive: 11 views at 10 widths from 1440 to 320 px | no horizontal overflow (110 of 110) |
| Reference fidelity | CSS identical to the reference; all views and components kept, except the System Overview page, which was removed on request |
| `tests/e2e/run-e2e-tests.js` (unmodified) | 77 of 77 |
| `tests/e2e/test-rollback.sh` | 10 of 10 (run from a scratch copy with only the two port lines and two log paths changed, because the script hard-codes port 4200 and a log file owned by another user) |

### Known limits

* Pagination, sorting and filtering happen in the browser over up to 5000 rows per list. The page says when a list
  was cut off. Beyond that, server-side paging would be needed.
* Docker container health cannot be read from inside a container; the dashboard shows it as unavailable.
* PostgreSQL status is reported by the ERP service (`/api/health`). On a staging instance that is not wired to
  the Docker database it shows "down", which is the truth for that instance.
* The ERP console's own `/sync` and `/integration` pages still read the stale PostgreSQL snapshot (section E).
* Neither service has authentication. The hub is bound to the LAN address in the Docker setup, and
  `/api/dashboard` returns citizen names, emails and mobile numbers (the same kind of data `/api/people` already
  returned) plus each record's field values. Add authentication or restrict the binding before exposing it widely.
* The hub's older server-rendered pages (`hub.ejs`, `_shell-head.ejs`, `_shell-foot.ejs`) are no longer routed;
  they are left in place.

### Changes after the first delivery

* The System Overview page was removed on request (the dashboard now has 11 views). A link to `#overview` opens the dashboard.
* The "Live data" notice is shown only when something is wrong (ERP unreachable, a failed refresh, or a list cut off at the row limit).
* Page descriptions run the full width of the page.
* The "Records by source system" card shows the real number of source systems and a "Portals" button.
