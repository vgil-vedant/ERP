# postgres — `demo_replica`

`demo_replica` lives in the Docker container **`ERP_postgres`** (host `127.0.0.1:7432`, volume
`ERP_postgres_data`). It no longer exists on the Postgres instance on port 5476, which
belongs to another project and is not touched by this one.

The SQLite data of the five websites, copied into exactly five PostgreSQL tables.

| Table | Website |
|---|---|
| `aadhaar_data` | uidai.gov.in |
| `cctns_data` | digitalpolicecitizenservices.gov.in |
| `ecourts_data` | ecourts.gov.in |
| `eforensics_data` | eforensics.gov.in |
| `eprisons_data` | eprisons.nic.in |

Each row is one source row stored as JSONB (`data`). `record_type` says where it
came from: a bare table name (`jail`) is the site's own replica database,
`platform_<table>` comes from `platform.sqlite`, `erp_<table>` from `erp.sqlite`.
`source_id` / `source_key` hold the original primary key.

Left out on purpose: the platform `session` login tokens, and `person`'s
`password_hash` / `password_salt`.

## Run

Connection settings come from the root `.env` (see `.env.example`); `PGPORT=7432` points at the
Docker container. A variable set in the shell wins over `.env`.

```bash
node database/postgres/scripts/migrate.js dry-run   # count rows, write nothing
node database/postgres/scripts/migrate.js schema    # create the five tables
node database/postgres/scripts/migrate.js load      # load; refuses if a table is not empty
node database/postgres/scripts/verify-counts.js     # PostgreSQL vs what was loaded vs SQLite now
```

The SQLite files are only ever opened read-only. `load` writes one transaction
per site and records `logs/load-report.json`.

## Backup and restore

A full backup taken before the original was removed from port 5476 is in
`backup/`: `backup/demo_replica_backup_20261028.dump` (custom format; restore tested).

```bash
# restore into the Docker Postgres (database must exist and be empty)
docker exec -i ERP_postgres pg_restore -U ams -d demo_replica --no-owner --no-privileges --exit-on-error < backup/demo_replica_backup_20261028.dump

# make a new backup
docker exec ERP_postgres pg_dump -U ams -Fc demo_replica > backup/demo_replica_backup_$(date +%Y%m%d).dump
```
