# backup

| File | What |
|---|---|
| `demo_replica_backup_20261028.dump` | PostgreSQL custom-format dump of `demo_replica` (five tables, 8,375 rows), taken before the copy on port 5476 was dropped. Restore tested. |

| `sqlite-local-20261028/` | `platform.sqlite` and `erp.sqlite` of the original non-Docker servers (integrity checked), archived after those servers were stopped and their data moved into the Docker volumes. |

Restore (Postgres): `docker exec -i ERP_postgres pg_restore -U ams -d demo_replica --no-owner --no-privileges --exit-on-error < backup/demo_replica_backup_20261028.dump`
