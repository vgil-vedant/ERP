# backend

| Path | Role |
|---|---|
| `platform-api/` | one Node process serving all five portals; `src/{server,seed}.js`, `config/`, `db/`, `services/`, `drivers/` |
| `erp-api/` | the ERP service on its own database; `src/{server,seed}.js`, `config/`, `db/` |
| `shared/paths.js` | the repository root and the `gov_replica` location, computed once |
| `gov_replica/` | one directory per replicated site: analysis, captures, replica code |
| `tools/` | the pipeline that produces `gov_replica/` from a domain name |
| `scripts/embed-eforensics-images.js` | converts the captured e-Forensics images to base64 partials in `frontend/portals/eforensics/views/partials/img/` |
| `scripts/embed-eprisons-images.js` | converts the images in `info/images/eprisoner/` to base64 partials in `frontend/portals/eprisons/views/partials/img/` |
| `scripts/start-all.sh` | starts the ERP then the platform; refuses if any of their ports is already in use |

Each service keeps its own database, schema and views paths in its own
`src/config/paths.js`, so neither service can name the other's database.

```bash
npm run seed:erp && npm run start:erp          # :4200, start this first
npm run seed:platform && npm run start:platform # :4100 + the five portals
```
