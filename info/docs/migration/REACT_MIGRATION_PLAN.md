# Migration plan: React + Tailwind front end on Node + Express

**Goal.** Move the whole front end from server-rendered EJS and hand-written CSS to React and Tailwind CSS, served by the
existing Node/Express back end. **The look and the behaviour of every page stay as they are today.** This is a rebuild of
the presentation layer only.

## 1. What is being migrated

| Area | Today | Size |
|---|---|---|
| Hub dashboard (:4100) | one HTML file + `erp-hub.js` (vanilla), 12 views, inline-SVG charts | 1,580 lines of script |
| ERP console (:4200) | 6 EJS pages + 1 large layout (CSS inline) | ~10 files |
| Citizen pages | EJS: sign-in, register, My account (+ hub sign-in) | ~12 files |
| Five portal replicas | EJS + `site.json` data (UIDAI 247 pages, eCourts 228, CCTNS 3, e-Forensics 6) and a hand-built ePrisons app | 126 `.ejs` files in total |
| Styles | hand-written CSS, one file per portal | ~2,900 lines |

## 2. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 18** + **TypeScript** | components for the many repeated pieces (cards, fields, tables, charts); types catch data-shape mistakes |
| Build | **Vite 5** (Node 18 compatible) | fast, simple, produces plain static files that Express serves |
| Styling | **Tailwind CSS 3.4** with one preset per site | each portal's palette and fonts become tokens, so the design is reproduced exactly instead of re-invented |
| Routing | **React Router 6** | one router per app (hub, console, account, each portal) |
| Server | **Node 18 + Express 4** (unchanged) | already holds the business rules; no rewrite |
| Data | **SQLite** (better-sqlite3) and **PostgreSQL 16** (unchanged) | untouched |
| Tests | **Vitest** + Testing Library (components), **Playwright** (browser), **pixelmatch** (visual diff, already in `backend/tools`) | proves the design did not change |

Not added on purpose: Redux (React state and a small fetch helper are enough), a UI kit such as MUI (it would change the
look), Next.js (a second server is not needed), a CSS-in-JS library.

## 3. Directory structure

```
frontend/web/                      new, standalone at first; becomes an npm workspace at cut-over
  package.json  vite.config.ts  tsconfig.json  tailwind.config.ts  postcss.config.js
  src/
    shared/
      boot.ts                      reads the server's JSON data block (CSP-safe: not executed)
      api.ts                       fetch helper (JSON, credentials, 401 handling)
      icons.tsx                    inline SVG icon set
      ui/                          Button, Field, PasswordField, Chip, Carousel, Card, Table, Pill, Donut, Heatmap ...
      tailwind/                    presets: citizen.ts, hub.ts, console.ts, ecourts.ts, uidai.ts, eprisons.ts ...
    apps/
      auth/                        module 1  sign-in, register, hub sign-in
      account/                     module 2  My account
      hub/                         module 3  dashboard, 12 views
      console/                     module 4  ERP console
      portals/
        engine/                    module 5  renders a site.json page: forms, cascades, captcha, tables, outline
        ecourts/  uidai/  cctns/  eforensics/
        eprisons/                  module 6
  e2e/                             Playwright + visual-regression specs and baselines
  dist/                            build output (git-ignored); served by Express under /account/ui/app/*
backend/                           unchanged apart from a thin "boot" layer per page (see 4)
```

## 4. How React and Express fit together (no behaviour change)

* Express keeps every route, cookie, redirect, validation rule and database call.
* For each page Express now returns a small HTML shell: a `<div id="root">`, the page's data as a
  `<script type="application/json" id="boot">` block (JSON blocks are not executed, so the portals' CSP
  `script-src 'self'` stays as it is), and one built bundle served from the same origin.
* Forms still post to the same URLs and the server still redirects, so sign-in, registration, logout and the
  write-through behave exactly as now. React only renders what the server already decided (errors, kept values, lists).
* Data that is already JSON (`/api/dashboard`, `/api/intake` ...) is fetched by React as it is today.
* **Safety switch.** `UI_ENGINE=react` selects the React shell; the default stays EJS until a module has passed its checks.
  Both can run side by side, which also allows page-by-page screenshot comparison.

## 5. Modules, in order

| # | Module | Why this order | Done when |
|---|---|---|---|
| 0 | Foundation | everything depends on it | Vite + Tailwind + tokens + boot + build served by Express + visual-diff harness |
| 1 | **Auth**: portal sign-in, register, hub sign-in | small, fully specified, just refined | visual diff within tolerance at 3 widths x 2 themes; sign-in/register/reset/logout flows pass |
| 2 | **My account** | reuses module 1 pieces; adds charts | overview figures, donuts, calendar and drawer identical |
| 3 | **Hub dashboard** | largest script; self-contained | 12 views identical; `/api/dashboard` untouched; sign-out and 401 redirect keep working |
| 4 | **ERP console** | server-rendered tables and pop-up | list, search, sort, pager and the record pop-up identical |
| 5 | **Portal engine + eCourts, UIDAI, CCTNS, e-Forensics** | one renderer serves 480+ data-driven pages | each replica's own test suite still passes (492 / 286 / ...) |
| 6 | **ePrisons** | hand-built app, 22 views | its 86 checks pass |
| 7 | **Cut-over and clean-up** | only after all pass | remove EJS and old CSS, Docker multi-stage build, docs, CI |

## 6. How "the design does not change" is proven

1. **Baseline.** Screenshots of every page of the current site, at 1440, 1024 and 390 px, light and dark where it exists.
2. **Pixel diff.** The React page is rendered with the same data and compared with pixelmatch; a page passes when the
   difference stays under an agreed tolerance (anti-aliasing only). Anything above is fixed, not waived.
3. **Behaviour.** The existing suites stay the judge: end-to-end (79), eCourts (492), UIDAI (286), ePrisons (86),
   CCTNS (30), plus a Playwright script per module for interactions that the suites do not cover.
4. **Rules that stay.** The unofficial-demonstration banner, the `X-Replica-Notice` header, no outside requests,
   real data only, and the live Docker stack untouched until the owner rebuilds.

## 7. Risks and how they are handled

* **Size.** 126 templates and ~2,900 lines of CSS. Mitigation: module by module; the old page keeps working until the
  new one passes.
* **Tailwind versus hand-written CSS.** Rebuilding the same look in utility classes can drift. Mitigation: palette,
  fonts, radii and spacing go into per-site Tailwind presets first, and the visual diff gates every page.
* **CSP.** Only same-origin scripts. Mitigation: no inline script; JSON data block; bundles served from the same origin.
* **Bundle size.** One entry per app (code splitting), so a portal page never loads the hub's charts.
* **Server rendering lost.** Not needed here (no search-engine requirement), but first paint stays fast because the data
  is already in the page.

## 8. Rough effort

Foundation 1 day, auth 1-2 days, account 2 days, hub 4-5 days, console 2 days, portal engine and four replicas 6-8 days,
ePrisons 3 days, cut-over 2 days: about **3-4 weeks** of focused work, delivered module by module.

## 9. Status

| Module | State | Evidence |
|---|---|---|
| 0 Foundation | **done** | Vite + Tailwind (preflight off, citizen preset) + TypeScript build; `UI_ENGINE=react` switch in `backend/platform-api/src/services/ui-engine.js` (falls back to EJS if the build is missing); build served at `/account/ui/app/` (the `/ui` prefix of section 4 was moved here so no route can collide); `e2e/visual-diff.mjs` and `e2e/behaviour.mjs` |
| 1 Auth (portal sign-in, register, hub sign-in) | **done** | 18 of 18 screenshots (3 pages x 3 widths x 2 themes) pixel-identical to the EJS pages; 9 interaction scenarios and 5 error-state screenshots identical; 5 component tests; no console messages, no off-host requests, CSP unchanged |
| 2 My account | **done** | 26 of 26 screenshots identical (overview, info, submissions, website switcher, drawer; 1440/1024/390 px; light and dark); 18 interaction checks identical (navigation, hash, theme, drawer, switcher keys, sign-out); 4 component tests |
| 3 Hub dashboard | **done** | 36 of 36 screenshots near-identical (12 views x 1440/1024/390 px; worst case 25 differing pixels); 60+ interaction checks identical, including table search/sort/filter/paging, detail panels, global search, CSV contents, mobile navigation and the expired-session redirect; 3 table tests. The old stylesheet was carried over unchanged (hub.css, console.css) and is served with the bundle; moving it to Tailwind utilities is left for module 7. The unused API-mapping dialog (no button opened it) was not ported. One improvement: keyboard focus now stays on a pager button after paging |
| 4 ERP console (7 pages) | **done** | 30 of 30 screenshots near-identical (10 pages x 1440/1024/390 px; worst case 276 px, the port number in the header chip); ~60 interaction checks identical (search, drawers, nav, collapse persistence, mobile menu, CSV). Pages were converted from EJS by `frontend/web/scripts/ejs_to_jsx.py` (reusable for module 5). The ERP server switches with `UI_ENGINE=react` (`backend/erp-api/src/ui-react.js`). Fixed on purpose: the old pager only advanced after a page search, the page search never updated the page count, sorting only reordered the rows already on screen, and a missing portal showed the word "null"; detail panels now escape record values. 2 tests |
| 5 Portal engine: CCTNS, e-Forensics, eCourts, UIDAI/Aadhaar | **done** | Replica suites pass on the React path: CCTNS 30/30, e-Forensics 32/32, eCourts 492/492, UIDAI 286/286. Visual: CCTNS 14/14, e-Forensics 18/18, eCourts 490/490 (every route x 2 widths, before hydration) and 56/56 (sample, after), UIDAI 72/72 and 56/56 (samples). The suites read the server-rendered HTML (error messages, form actions, banner), so each page is **rendered on the server** by React (`frontend/web/src/portals`, one self-contained bundle `dist-ssr/portals.cjs`) and then **hydrated in the browser** by `dist/portal.js` (`src/portals/client.tsx`), which also starts the page's behaviours: menu, dependent dropdowns, character counters, text size, language and More menus, hero carousel (`src/portals/behaviours.ts`, ported from the plain `replica.js` files). Page data travels as JSON in the page (`:\/\/` encoded so original-site addresses are not literal links). Switch: `UI_ENGINE=react`, installed behind each server's existing `res.render` by `backend/shared/portal-ui.js` (falls back to EJS per view; logs if it cannot install). Views were converted from EJS by `scripts/gen_portal_views.py`. Behaviour: identical results on the EJS and React pages (menus, carousel, text size, cascades, counters), no hydration errors. Old quirks kept on purpose: attribute values written through an escaping output tag (e.g. `aria-current` reaches the browser as `\"page\"` with quotes). |
| 6 ePrisons | **done** | Suite 86/86; 46/46 page comparisons identical (23 routes x 2 widths); behaviour identical (home carousel, menus, state/jail cascade, ID proof, additional visitors, counters, challenge refresh, dashboard filter panel and charts). Its seven plain scripts are bundled unchanged and started after hydration; porting them to React components is optional polish. |
| 7 Cut-over and clean-up | **done, except deleting the old files** | React is now the default on every service; `UI_ENGINE=ejs` draws the EJS views instead, and a missing build or an unconverted view falls back to EJS by itself. `docker/Dockerfile` builds the bundles in a `web` stage (`npm ci` + `npm run build`) and copies only `dist` and `dist-ssr` into the images; `.dockerignore` keeps a host build out. Root scripts `build:web` and `test:web`; README, `frontend/README.md`, `frontend/web/README.md` and `docker/README.md` updated; `.github/workflows/ci.yml` runs typecheck, tests and build. Checked on the default engine: 5 replica suites (30, 32, 492, 286, 86), the project end-to-end suite 79/79, web tests 14/14; the Docker build stage was reproduced in a clean directory (the image itself was not built or started). **Left for you to decide:** delete the EJS views and the old CSS and scripts (they are the fallback), and optionally rewrite `hub.css` and `console.css` as Tailwind utilities. Rebuilding the running containers is yours: `docker compose up -d --build --no-deps erp_api platform_api`. |

Run: `cd frontend/web && npm run build`, start the platform with `UI_ENGINE=react`.

## 10. Hub navigation redesign (department offices)

The hub's left navigation now follows the data flow (citizen portal -> department office -> integration bus -> ERP): Command centre; ERP
(Person Lookup, Citizens, Department Records, Citizen Submissions, Audit Trail); Departments (one page per office, and All departments);
Integration bus (Event Queue, Retries & Failures, Write-through Ledger, Reconciliation); Access & audit (Officer Accounts, Lookup Audit,
Activity Log); System (Service Health, Databases, Documentation). New backend: `backend/platform-api/src/services/hub-offices.js`
(`GET /api/offices`, `POST /api/offices/:code/retry`). New views: `frontend/web/src/apps/hub/offices.tsx`. The older pages Integration
Status, Platform Submissions and All portals stay reachable by link. Only the React hub has the new navigation; the EJS-era hub
(`UI_ENGINE=ejs`) keeps its old one.

## 11. Hub dashboard follows the departments

The Dashboard no longer shows citizen figures. Five cards (one per department office) replace the six KPI cards, in the same card design: icon tile, delivery pill ("all delivered" / "N waiting" / "N rejected"), record count, "open · people" line. The donut shows records by department; the area chart shows records created and events not delivered per day (`daily` series added to `GET /api/offices`); the bars and the meter show delivered versus waiting/rejected events; the feeds and tables show office activity, department records and bus events. Citizen views remain under "ERP · record of truth". Tests: `src/apps/hub/dashboard.test.ts`.
