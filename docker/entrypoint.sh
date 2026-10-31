#!/bin/sh
# Seeds an empty data volume on the first start, then runs the service.
set -eu

case "${ERP_SERVICE:-}" in
  erp)      db="$ERP_DB";      seed="backend/erp-api/src/seed.js" ;;
  platform) db="$PLATFORM_DB"; seed="backend/platform-api/src/seed.js" ;;
  *) echo "ERP_SERVICE must be 'erp' or 'platform'" >&2; exit 64 ;;
esac

if [ ! -s "$db" ]; then
  echo "first start: seeding $db"
  node "$seed"
fi

exec "$@"
