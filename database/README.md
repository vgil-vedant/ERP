# database

| Path | Holds |
|---|---|
| `sqlite/platform/` | `schema.sql` and `data/platform.sqlite` — the one database behind the five portals |
| `sqlite/erp/` | `schema.sql` and `data/erp.sqlite` — the ERP's own database |
| `postgres/migrations/` | SQL that creates the PostgreSQL tables in `demo_replica` (in the Docker container `ERP_postgres`) |
| `postgres/scripts/` | scripts that copy the SQLite data into PostgreSQL and verify the counts |
| `postgres/logs/` | run logs and row-count reports (not committed) |

The per-site replica databases still live inside each project under
`backend/gov_replica/<Category>/<host>/replica/database/`.

Connection settings for PostgreSQL are read from the root `.env`.
