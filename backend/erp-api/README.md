# erp — the final product's backend and database

This is the ERP itself: its own Node process, its own SQLite database, and the
one door the demonstration portals hand records through.

> **Unofficial Local Demonstration — Not an Official Government Service.**
> Every row arrives from a local replica holding synthetic data. Nothing here
> came from a government system.

## Run it

```bash
cd backend/erp-api
npm run seed      # creates the database and registers the five source systems
npm start         # console on :4200
```

| | URL |
|---|---|
| console | http://127.0.0.1:4200/ |
| received records | http://127.0.0.1:4200/intake |
| citizens | http://127.0.0.1:4200/citizens |
| audit trail | http://127.0.0.1:4200/audit |
| intake API | `POST http://127.0.0.1:4200/api/intake` |

The console starts empty on purpose. If a row is in it, a portal put it there.

## How data gets in

One way only, portal → ERP, over HTTP:

```
portal (:4173 … :4178)  ──POST /api/intake──▶  ERP (:4200)  ──▶  erp.sqlite
```

The ERP never calls a portal and never opens
`database/sqlite/platform/data/platform.sqlite`. The portals never open `erp.sqlite`. Two
tests assert both directions by reading the source with comments stripped.

### `POST /api/intake`

```json
{
  "sourceSystem": "uidai",
  "sourceForm": "grievance-feedback_en_form0",
  "sourceRoute": "/grievance-feedback/en",
  "sourceReference": "DEMO-000014",
  "subject": "Grievance",
  "person": { "personRef": "CIT-000001-6D48", "fullName": "…", "email": "…" },
  "fields": [{ "name": "subject", "label": "Subject", "value": "…" }],
  "payload": {}
}
```

Answers `201` with `{ intakeRef, citizenRef, duplicate: false }`, or `200` with
`duplicate: true` if that `(sourceSystem, sourceReference)` pair has already
been received — so a retried write-through never duplicates a record.

A `400` or `500` here makes the calling portal roll its own row back, which is
what keeps the two databases in step.

## Schema

| Table | Holds |
|---|---|
| `source_system` | the portals this ERP accepts data from |
| `citizen` | one row per human, keyed on the portal's `person_ref` |
| `intake` | one row per record received, unique on `(source_system, source_reference)` |
| `intake_field` | the field values of that record |
| `audit_log` | append-only, enforced by triggers |

`citizen.citizen_ref` is the portal's `person_ref`, so the person who registered
once on one portal is **one row here** however many portals they then use. That
is what removes the re-registration the ERP scope complains about.

`intake.source_reference` is the portal's own reference number, so every row
here can be traced back to the exact submission that produced it.

`erp-scope.pdf` §4 requires a maker, an approver where one is required, a
timestamp on every entry, and a trail no role can alter. The last part is the
`audit_log_no_update` and `audit_log_no_delete` triggers, which abort the
statement rather than merely discouraging it.

## What this will not do

- Reach out to a portal, a government system, or any remote host.
- Open the portals' database.
- Accept a record from a `sourceSystem` it does not know.
- Store a password, CAPTCHA answer or token — those field names are stripped by
  the portal before the handover and filtered again on arrival.
