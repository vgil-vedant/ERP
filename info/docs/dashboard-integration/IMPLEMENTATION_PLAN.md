# Dashboard integration: implementation plan

## Decisions

1. **Where it lives:** the hub (port 4100) serves the dashboard at `/`. The hub owns the platform database
   and already calls the ERP over HTTP, so it can show both sides without breaking the rule that the ERP
   never reads the platform database. The browser only talks to the hub (same origin).
2. **How the reference is kept:** the reference markup, CSS and script are used as-is. Only the data layer
   changes: the synthetic generators are removed and replaced by one `fetch('/api/dashboard')`. Rendering,
   tables, charts, drawers and interactions are untouched.
3. **No new stack, no new tables:** Express and EJS-era conventions, `better-sqlite3`, plain `http`.
4. **No fabricated data:** empty database gives empty states; a failing ERP gives a visible error state;
   unknown values display "unavailable".

## Phases

| Phase | Work | Files | Status |
|---|---|---|---|
| 1 | ERP read-only APIs: `GET /api/audit`, `GET /api/database`, `GET /api/health`; cap `limit` and add it to `/api/citizens` | `backend/erp-api/src/server.js`, `backend/erp-api/src/db/index.js` | done |
| 2 | Hub aggregator `GET /api/dashboard` (platform queries + ERP over HTTP + health) | new `backend/platform-api/src/services/hub-dashboard.js`, `backend/platform-api/src/server.js` | done |
| 3 | Dashboard page: reference markup/CSS with truthful text; script with the data layer swapped | new `frontend/platform-hub/static/erp-hub.html`, `erp-hub.js`; static route in `server.js` | done |
| 4 | Real filters (forms, audit entities and makers), real health, database, portals, docs | `erp-hub.js` | done |
| 5 | Auto-refresh of the loaded data, error and empty states | `erp-hub.js` | done |
| 6 | Verification: API tests, data-integrity comparison against the databases, UI click-through, responsive check, existing end-to-end suites | scratch scripts only | done |

## Verification strategy

* Run a staging copy (ports 6100 to 6200, scratch databases), never the live stack.
* Compare every dashboard count with a direct SQL count on the scratch databases.
* Click through every sidebar entry, filter, sort, pager, drawer, export and the global search with Playwright.
* Check an empty database, and an ERP that is down.
* Run the existing end-to-end suite and rollback test against a staging instance.

## Deployment note

The dashboard needs both services rebuilt, because the hub now calls three new ERP endpoints
(`/api/audit`, `/api/database`, `/api/health`). Until the ERP is rebuilt the dashboard shows its "ERP could not be
read" state, by design.

```bash
docker compose up -d --build --no-deps erp_api platform_api
```
