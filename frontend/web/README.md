# frontend/web

React 18 + TypeScript + Vite + Tailwind CSS. It draws every page of the project: the portal replicas, the ERP Hub, the ERP
console, and the sign-in, register and My account pages.

```
npm run build:web        # from the repository root: npm ci + two builds (below)
npm run test:web         # component tests (Vitest + Testing Library)
cd frontend/web && npm run dev   # Vite dev server
```

| Build | Output | Used by |
|---|---|---|
| `vite build` | `dist/` — `auth`, `account`, `hub`, `console` and `portal` bundles under `/account/ui/app/` | the browser |
| `vite build -c vite.ssr.config.ts` | `dist-ssr/portals.cjs` — one self-contained file, React included | the portal servers, to draw pages |

## How a page is drawn

* **Portals (`src/portals`)**: each portal server calls `res.render` as before; `backend/shared/portal-ui.js` swaps the EJS
  engine behind it. The page is rendered on the server (the replica test suites read this HTML), carries its data as JSON, and
  is hydrated in the browser by `dist/portal.js`, which then starts the page's behaviours (`behaviours.ts`; ePrisons' plain
  scripts are bundled unchanged).
* **Hub, console, sign-in, My account (`src/apps`)**: the server sends a small shell with its data as JSON
  (`backend/platform-api/src/services/ui-engine.js`, `backend/erp-api/src/ui-react.js`); React draws the page.
* **Switch**: React is the default. `UI_ENGINE=ejs` draws everything with the original EJS views. A missing build, or a view
  that has no React version, falls back to EJS by itself.

## Layout

```
src/apps/{auth,account,hub,console}   one folder per application (hub.css and console.css are the original stylesheets)
src/portals/<portal>/views.generated.tsx   the portal views, converted from EJS and maintained by hand from now on
src/portals/{ssr,client,behaviours}        server renderer, browser entry, page behaviours
src/shared                                 boot data reader, icons, small helpers, Tailwind presets
scripts/ejs_to_jsx.py, gen_portal_views.py the EJS -> React converter used for the one-off conversion
e2e/                                       Playwright scripts that compare the React pages with the EJS pages
```

The `e2e/` scripts need the Playwright packages from `backend/tools` and a running pair of servers (one with
`UI_ENGINE=ejs`, one without); see the header of each script. They run against scratch databases, never a live one.
