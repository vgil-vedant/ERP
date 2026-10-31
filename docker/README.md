# docker

The ERP stack as two containers. Every Docker object it creates is prefixed `ERP_`.

| Kind | Name |
|---|---|
| Containers | `ERP_erp_api`, `ERP_platform_api`, `ERP_postgres` |
| Network | `ERP_net` |
| Volumes | `ERP_erp_data`, `ERP_platform_data`, `ERP_postgres_data` |
| Images | `erp_erp_api`, `erp_platform_api` (image repository names must be lowercase) |
| Compose project | `erp` |

## Run

First time only (writes the PostgreSQL password secret from the root `.env`):

```bash
bash docker/make-secrets.sh
```

```bash
docker compose up -d --build      # build and start (from the repository root)
docker compose ps                 # both should be "healthy"
docker compose logs -f platform_api
docker compose down               # stop; the data volumes are kept
docker compose down -v            # stop and DELETE the data volumes
```

| Service | Inside the container | On the host (as configured in the root `.env`) |
|---|---|---|
| ERP console and API | 4200 | **4200**, `127.0.0.1` only |
| Platform hub | 4100 | **4100**, on `ERP_BIND_ADDR` (this machine's network address) |
| ePrisons | 4173 | **4173**, on `ERP_BIND_ADDR` |
| CCTNS | 4175 | **4175**, on `ERP_BIND_ADDR` |
| e-Forensics | 4176 | **4176**, on `ERP_BIND_ADDR` |
| UIDAI / Aadhaar | 4177 | **4177**, on `ERP_BIND_ADDR` |
| eCourts | 4178 | **4178**, on `ERP_BIND_ADDR` |
| PostgreSQL `demo_replica` | 5432 | **7432**, `127.0.0.1` only |

The stack runs on the ports the original (non-Docker) servers used, so every old URL
reaches Docker. Those servers are stopped; their final databases are archived in
`backup/sqlite-local-20261028/`. The defaults in `compose.yaml` are 7100/7173-7178/7200;
the root `.env` (`ERP_BIND_ADDR`, `ERP_HOST_PORT_*`) overrides them. `docker/original-ports.env`
holds the same mapping without secrets, for anyone who cannot read `.env`:
`docker compose --env-file docker/original-ports.env up -d`.

The portals are reached on the network address, e.g. `http://10.166.170.105:4177/`,
not on `127.0.0.1`. Variables you can set: `ERP_BIND_ADDR`, `ERP_HOST_PORT_ERP`,
`ERP_HOST_PORT_HUB`, `ERP_HOST_PORT_EPRISONS`, `ERP_HOST_PORT_CCTNS`,
`ERP_HOST_PORT_EFORENSICS`, `ERP_HOST_PORT_AADHAAR`, `ERP_HOST_PORT_ECOURTS`,
`ERP_HOST_PORT_POSTGRES` and `ERP_IMAGE_TAG`.

Compose refuses to start if a host port is taken. Nothing here stops or takes over a
process that belongs to another project.

## How it is built

- **One `Dockerfile`, two targets** (`erp-api`, `platform-api`). Dependencies come from
  `npm ci --omit=dev` against the root `package-lock.json`, so the image holds exactly
  the locked versions and no dev packages.
- **Data is not in the image.** Each SQLite database lives in a named volume
  (`/data/erp`, `/data/platform`). On the first start the entrypoint seeds an empty volume.
- **The captured originals** (`original_assets`) are mounted read-only from
  `backend/gov_replica`, not baked in, which keeps each image at about 356 MB.
- **The platform reaches the ERP by service name** (`ERP_HOST=erp_api`) over `ERP_net`,
  over HTTP only, as before. It starts only after the ERP reports healthy.
- **Hardening:** non-root user, read-only root filesystem, all capabilities dropped,
  `no-new-privileges`, log rotation, `restart: unless-stopped`, and a health check on both.

## Running the end-to-end tests against the containers

**This replaces the running stack.** The container, network and volume names are fixed
(`ERP_*`), so the test stack cannot run beside the live one. Stop the live stack first
(`docker compose stop erp_api platform_api`), run the test below, remove the test
containers, then start the live stack again. The test keeps its data in
`docker/.test-data`, never in the live volumes.

```bash
# the test stack publishes the 7xxx defaults, so unset the 4xxx mapping from .env for this run:
#   export ERP_BIND_ADDR=127.0.0.1 ERP_HOST_PORT_HUB=7100 ERP_HOST_PORT_ERP=7200 ERP_HOST_PORT_EPRISONS=7173 \
#          ERP_HOST_PORT_CCTNS=7175 ERP_HOST_PORT_EFORENSICS=7176 ERP_HOST_PORT_AADHAAR=7177 ERP_HOST_PORT_ECOURTS=7178
mkdir -p docker/.test-data/platform docker/.test-data/erp
ERP_UID=$(id -u) ERP_GID=$(id -g) docker compose -f compose.yaml -f docker/compose.test.yaml up -d --build

PLATFORM_DB=$PWD/docker/.test-data/platform/platform.sqlite \
ERP_DB=$PWD/docker/.test-data/erp/erp.sqlite \
PLATFORM_PORT=7100 ERP_PORT=7200 PORT_OFFSET=3000 \
PLATFORM_DB_REPORTED=/data/platform/platform.sqlite \
node tests/e2e/run-e2e-tests.js

docker compose -f compose.yaml -f docker/compose.test.yaml down && rm -rf docker/.test-data
```

The override keeps the databases on the host so the tests can read them. Use it for
tests only; the test data is deleted at the end.

## Not for production as it stands

The five portals are look-alikes of government sites. Do not publish them to the
internet. For a real deployment put a TLS reverse proxy in front of the ERP only,
and replace SQLite with PostgreSQL (see `database/postgres`).

## Where the data lives

| Data | Volume | Inside the container |
|---|---|---|
| ERP database | `ERP_erp_data` | `/data/erp/erp.sqlite` |
| Platform database (portals, accounts, submissions) | `ERP_platform_data` | `/data/platform/platform.sqlite` |
| PostgreSQL `demo_replica` (five tables) | `ERP_postgres_data` | `/var/lib/postgresql/data` |

Connect to the containerised Postgres from the host with
`psql -h 127.0.0.1 -p 7432 -U ams -d demo_replica` (password in the root `.env`).
The database scripts in `database/postgres/scripts` use it with `PGPORT=7432`.

The password reaches the Postgres container as a Docker secret
(`docker/.secrets/pg_password`, mode 600, gitignored), never as an environment variable.

## Copying data into the volumes

The data was copied from the non-Docker databases once, as snapshots. Docker and
the non-Docker processes are separate copies from then on. To refresh a volume:

```bash
docker compose stop erp_api platform_api
# 1. take a consistent copy with better-sqlite3's backup API (works on a live WAL database)
# 2. copy it into the volume with a throwaway container, then chown 1000:1000
docker compose start erp_api platform_api
```

Back up the volumes with `docker run --rm -v ERP_erp_data:/d -v "$PWD":/b alpine tar czf /b/erp-data.tgz -C /d .`
and `docker exec ERP_postgres pg_dump -U ams -Fc demo_replica > demo_replica.dump`.
