# syntax=docker/dockerfile:1
#
# One Dockerfile, two images:
#   --target erp-api        the ERP service      (:4200)
#   --target platform-api   the five portals     (:4100 hub, :4173 :4175 :4176 :4177 :4178)
#
# Build from the repository root:  docker compose build

ARG NODE_IMAGE=node:18-bookworm-slim

# --- dependencies: exactly what package-lock.json says, no dev packages -----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# better-sqlite3 downloads a prebuilt binary; the compiler is the fallback.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY backend/platform-api/package.json backend/platform-api/
COPY backend/erp-api/package.json backend/erp-api/
COPY backend/tools/package.json backend/tools/
RUN npm ci --omit=dev --ignore-scripts=false \
        --workspace backend/platform-api --workspace backend/erp-api

# --- the web bundles: React pages (browser) and their server renderer -------
# frontend/web is built here, in its own stage, so no build tool reaches the runtime images.
# The ePrisons page scripts are bundled unchanged, so that folder is needed for the build.
FROM ${NODE_IMAGE} AS web
WORKDIR /build/frontend/web
COPY frontend/web/package.json frontend/web/package-lock.json ./
RUN npm ci
COPY frontend/web ./
COPY frontend/portals/eprisons/public/js /build/frontend/portals/eprisons/public/js
RUN npm run build

# --- shared runtime layer ---------------------------------------------------
FROM ${NODE_IMAGE} AS runtime-base
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY backend/shared backend/shared
COPY backend/gov_replica backend/gov_replica
COPY backend/platform-api/src/config backend/platform-api/src/config
COPY frontend/platform-hub frontend/platform-hub
COPY frontend/erp-console frontend/erp-console
# the person-lookup page module, served by both the ERP console and the hub
COPY frontend/shared frontend/shared
COPY frontend/portals frontend/portals
COPY --from=web /build/frontend/web/dist frontend/web/dist
COPY --from=web /build/frontend/web/dist-ssr frontend/web/dist-ssr
COPY database/sqlite/platform/schema.sql database/sqlite/platform/schema.sql
COPY database/sqlite/erp/schema.sql database/sqlite/erp/schema.sql
COPY docker/entrypoint.sh /usr/local/bin/erp-entrypoint
RUN chmod 0755 /usr/local/bin/erp-entrypoint \
 && mkdir -p /data/platform /data/erp \
 && chown -R node:node /data
USER node
ENTRYPOINT ["erp-entrypoint"]

# --- the ERP ----------------------------------------------------------------
FROM runtime-base AS erp-api
COPY backend/erp-api backend/erp-api
ENV ERP_SERVICE=erp ERP_PORT=4200 ERP_DB=/data/erp/erp.sqlite
VOLUME ["/data/erp"]
EXPOSE 4200
HEALTHCHECK --interval=15s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.ERP_PORT+'/api/summary',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "backend/erp-api/src/server.js"]

# --- the platform -----------------------------------------------------------
FROM runtime-base AS platform-api
COPY backend/platform-api backend/platform-api
ENV ERP_SERVICE=platform PLATFORM_PORT=4100 PLATFORM_DB=/data/platform/platform.sqlite
VOLUME ["/data/platform"]
EXPOSE 4100 4173 4175 4176 4177 4178
HEALTHCHECK --interval=15s --timeout=4s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PLATFORM_PORT+'/api/summary',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "backend/platform-api/src/server.js"]
