# platform — one backend, one database, five portals

This replaces the five separate backends that used to live one per replica
directory. It is **one Node process** that listens on all five portal ports and
reads **one SQLite file**.

> **Unofficial Local Demonstration — Not an Official Government Service.**
> Nothing here contacts any government system. Every row is synthetic.

## Run it

```bash
cd backend/platform-api
npm run seed      # loads every portal's reference data into the one database
npm start         # binds all five portal ports plus the hub
```

The ERP must be running too, or submissions are refused by design:

```bash
cd backend/erp-api && npm run seed && npm start
```

| | URL |
|---|---|
| hub (shows the whole arrangement) | http://127.0.0.1:4100/ |
| ePrisons | http://127.0.0.1:4173/ |
| CCTNS Citizen Services | http://127.0.0.1:4175/ |
| e-Forensics | http://127.0.0.1:4176/ |
| UIDAI / Aadhaar | http://127.0.0.1:4177/ |
| eCourts | http://127.0.0.1:4178/ |
| ERP console | http://127.0.0.1:4200/ |

Each portal keeps the port it always had, so every URL that worked before still
works.

## What "one backend" means here

```
      :4173    :4175    :4176    :4177    :4178          :4100
        │        │        │        │        │              │
        └────────┴────────┴───┬────┴────────┘              │
                             │                             │
                  ONE process, ONE database  ──────────────┘
                  database/sqlite/platform/data/platform.sqlite
                             │
                        HTTP only
                             ▼
                  ERP backend  :4200
                  database/sqlite/erp/data/erp.sqlite      (a separate database)
```

`/__platform` on any portal reports the process id and database path, and all
five report the same ones. That is the test, not the claim.

## Register once

A citizen registers on whichever portal they happen to be on, at
`/account/register`, and the account is accepted by all five — they are the same
server reading the same `person` table.

The session cookie is set on `127.0.0.1` with no port. Browsers scope cookies by
host and **not** by port, so signing in on `:4177` is already signed in on
`:4173`. That is a real property of this arrangement rather than a trick: as far
as the session is concerned the five portals are one origin.

Each portal's own captured login form (7 of the 70 forms carry a password field)
authenticates that same shared account instead of pretending to log someone in.

## Every submission lands in both databases, or neither

Submitting runs two phases:

1. **reserve** — the row is written to the portal database, which is also what
   allocates its reference number;
2. **hand over** — the record is POSTed to the ERP at `/api/intake`.

If the ERP accepts, the portal row is stamped with the ERP's reference. If the
ERP refuses or is unreachable, the portal row is **deleted again**, the attempt
is recorded in `erp_sync`, and the page says so with HTTP 503. The audit entry
stays — `audit_log` rejects `DELETE`, so a refused write-through leaves a
permanent mark even though the data row is gone.

`tests/e2e/test-rollback.sh` stops the ERP, submits, and checks both databases, so
this path is exercised rather than asserted.

## Layout

| Path | Role |
|---|---|
| `src/server.js` | builds one app per portal, binds the ports, serves the hub |
| `src/config/sites.js` | the portal registry: code, port, frontend, driver |
| `database/sqlite/platform/schema.sql` | the one shared schema, 25 tables |
| `src/db/index.js` | the shared store, including the two-phase write-through |
| `src/services/identity.js` | the one registration, mounted on every portal |
| `src/services/erp-client.js` | the only code that talks to the ERP, and it uses HTTP |
| `src/drivers/generic.js` | routes for a portal described by a generated `site.json` |
| `src/drivers/eprisons.js` | mounts the hand-built ePrisons app and injects the write-through |
| `frontend/platform-hub/views/platform/` | register / sign in / account / hub, rendered in each portal's own skin |
| `database/sqlite/platform/data/platform.sqlite` | the one shared database |

Portal frontends are **not** copied here. Each portal renders from the views
already sitting in `gov_replica/<Category>/<host>/replica/frontend`, which is why
the hand-tuned e-Forensics and CCTNS pages still look the way they did.

## Schema notes

- `person` and `session` carry no `site_code`. That omission is the feature.
- Rows belonging to one portal carry `site_code`. **eCourts alone publishes 55
  forms and reuses the id `index_form0` across pages**, so a form key is
  `site:route:local_id` or the rows collide.
- `submission_field` flattens values alongside the JSON payload, so a report can
  read one field without parsing every blob.
- The ePrisons domain tables (`state`, `jail`, `relationship`, `id_proof_type`,
  `visit_request`, `grievance`, …) are carried over unchanged. They hold the real
  integration facts the ERP depends on: the State → Jail cascade, the two
  incompatible relationship vocabularies (33 from NPIP, 20 from Citizen Services,
  only 18 shared), and conditional ID-proof numbering.
- Field names matching `pass|pwd|secret|otp|pin|captcha|token|cvv|challenge` are
  dropped before anything is persisted, in both databases.
- Passwords are stored only as a salted scrypt hash, and compared with
  `timingSafeEqual`.

## What this will not do

- Contact any government system, or any remote host other than the local ERP.
- Open the ERP's database file. The ERP is reached over HTTP or not at all.
- Reproduce, solve or bypass a CAPTCHA. Forms ask an arithmetic question instead.
- Store a password, CAPTCHA answer, session token or secret from any form.
- Claim a submission reached the ERP when it did not — `erp_sync` records every
  attempt, successful or not.

## The old per-site servers

Each replica directory still contains the `server.js`, `db.js`, `seed.js` and
`replica.sqlite` it had before, and each still runs standalone against its own
private database. They are superseded by this one, and they are **not** started
by `npm start` here. Running one at the same time as the platform would collide
on its port.
