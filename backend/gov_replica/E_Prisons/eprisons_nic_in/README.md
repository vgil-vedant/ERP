# eprisons.nic.in — local demonstration replica

> ## Unofficial Local Demonstration — Not an Official Government Service
>
> This directory holds an **independent reimplementation** of the public pages of
> the National Prisons Information Portal, built for authorized development,
> testing and educational use. It is **not** affiliated with, endorsed by, or
> operated by the National Informatics Centre, the Ministry of Home Affairs, or
> any prison administration.
>
> It holds **no real data**. Every record is synthetic. It **cannot** book a
> visit, file a grievance, or reach any government system — and it must never be
> deployed anywhere a member of the public could mistake it for the real service.

| | |
|---|---|
| **Target URL** | `https://eprisons.nic.in` |
| **Final URL** | `https://ePrisons.nic.in/NPIP/public/Home` (after 4 redirects) |
| **Detected category** | `E_Prisons` — confirmed, high confidence |
| **Local project path** | `gov_replica/E_Prisons/eprisons_nic_in/` |
| **Analysed on** | 26 October 2026 |
| **Pages captured** | 30 (0 failed, 1 skipped, 4 URL aliases merged) |
| **Assets downloaded** | 139 of 150 referenced (10.6 MB) |
| **Forms inventoried** | 25 (136 functional fields, 4 CAPTCHA-protected) |
| **Tests** | **86 / 86 passing** |
| **Visual difference** | mean 0.237, median 0.249, best 0.074, worst 0.431 (desktop, banner-aligned) |

---

## 1. Why this category

The classifier reads page content, not the domain name. It scored `E_Prisons`
highest on terms the site itself uses — `emulakat` ×18, `eprisons` ×14,
`national prison` ×6, `prisoner` ×5, `inmate` ×2 — across 4 sampled pages.

`analysis/classification_evidence.json` records the full ranking and a flag,
`wouldHoldWithoutHostname: true`, confirming the verdict stands on content alone
with the hostname bonus removed.

## 2. What the site actually is

**Two applications on one host**, which is the single most important finding for
anyone building against it:

| Path | Application | Evidence |
|---|---|---|
| `/NPIP/`, `/Login/`, `/LegalAid/`, `/CitiZenService/` | **ASP.NET Web Forms** on IIS | `ASP.NET_SessionId` cookie, `__VIEWSTATE` hidden field, `__doPostBack`, IIS 404 page |
| `/NPIPDashboard/` | **Create React App** single-page application | `#root` mount, `<meta … content="Web site created using create-react-app">`, hashed bundle `static/js/main.811484a3.js` |

The React application's inner routes have **no server-side path**. A direct
request to `/NPIPDashboard/lockupReport` can return 403 from IIS while the route
renders perfectly once the bundle has loaded. The crawler handles this: it
detects the mount and, on a 4xx, reaches the route by clicking the in-app link
exactly as a visitor's browser would.

### Detected technology stack

27 technologies confirmed, 4 inferred, 4 explicit unknowns. Full evidence in
`analysis/technology_stack.json`. Highlights:

| Technology | Category | Status |
|---|---|---|
| Microsoft IIS / ASP.NET Web Forms | backend | **confirmed** |
| ASP.NET AJAX (`Sys`), `ScriptResource.axd` | backend | **confirmed** |
| React / Create React App | frontend (SPA at `/NPIPDashboard/`) | **confirmed** |
| Bootstrap 3.4.1 | CSS framework | **confirmed** |
| jQuery 3.2.1 / 3.5.1 / 3.6.3 | JS library (three versions in use) | **confirmed** |
| Chosen (jQuery select widget) | JS library | **confirmed** |
| Highcharts | charting | **confirmed** |
| Font Awesome, Bootstrap Icons, Google Fonts | assets | **confirmed** |
| CAPTCHA-protected forms | anti-bot | **confirmed** |
| **Database product and schema** | — | **unknown, and deliberately not guessed** |

> A website frontend does not expose its database. Nothing in the headers,
> markup, scripts or error output named one, so `analysis/database_findings.json`
> records it as `unknown` and keeps the "probably SQL Server" reasoning in a
> clearly-labelled `inferred` section. **Do not build against that inference.**

## 3. Why this replica is built on Express, not ASP.NET

The original stack is confirmed, but its **source code is not available** and was
never sought. Reproducing the public behaviour does not require .NET. This
replica therefore uses **Node + Express + server-rendered EJS**, which preserves
the original's server-rendered, full-page-post model, plus a small vanilla
client router for the dashboard to mirror its single-page behaviour.

**This is an approximation and does not claim to be recovered source code.**

## 4. Prerequisites

- Node.js 18 or later (built and tested on v18.19.1)
- npm 9 or later
- A C toolchain, for `better-sqlite3`'s native build

## 5. Install, seed, run

```bash
cd gov_replica/E_Prisons/eprisons_nic_in/replica/backend

npm install          # express, ejs, better-sqlite3
npm run seed         # build replica/database/replica.sqlite with synthetic data
npm start            # serve on http://127.0.0.1:4173
```

Local demo URL: **http://127.0.0.1:4173/** (override with `PORT=…`).

Re-running `npm run seed` rebuilds the database from scratch and discards
anything submitted through the local forms.

### Run the tests

```bash
cd gov_replica/E_Prisons/eprisons_nic_in
node tests/run-tests.js          # starts its own server on port 4199
```

Writes `tests/test-report.json`. **86 tests, all passing**: route loading,
internal links, local assets, isolation from the original, validation rules,
submission round-trips, the Citizen Services vocabulary separation, listings and
pagination, the local API, the dashboard shell, error handling, the append-only
audit trail, and persistence across a restart. The suite is idempotent: it can
be re-run against the same database.

### Re-run the analysis, or point it at another domain

```bash
cd tools
node bin/gov-replica.js eprisons.nic.in     # resumable; the domain is the only input
node bin/compare-replica.js ../gov_replica/E_Prisons/eprisons_nic_in http://127.0.0.1:4173
```

## 6. What was analysed

30 pages, every one reachable by link-following from the start URL within the
configured depth; the crawl queue was **exhausted**, not cut short by a limit.

| Page type | Count |
|---|---|
| statistics | 8 |
| policy | 3 |
| login | 3 |
| listing | 4 |
| contact | 2 |
| home, about, help, grievance, registration, visit-service, status-enquiry, sitemap, content, error | 1 each |

The captured evidence lives in:

- `reference_pages/screenshots/` — full-page PNGs at 1366×900, 768×1024, 390×844
- `reference_pages/dom/` — the rendered HTML of each page
- `reference_pages/page_metadata/` — per-page components, geometry, forms, assets, links

### The reference data that matters most for the ERP

Captured from the live form's `<select>` markup and loaded into the replica
database verbatim:

- **36 states/UTs**, **7 identity proof types**, **3 genders**
- **Two different relationship vocabularies** — see below
- `ddlJail` arrives **empty** — it is populated only after a state is chosen,
  confirming a **State → Jail cascade** (the original drives it through an
  ASP.NET `__doPostBack`; the replica enforces the same rule **server-side**)
- The identity proof list includes **`NOT AVAILABLE`**, which is why an ID number
  **cannot** be unconditionally mandatory. The replica models this as a
  conditional rule and tests both branches.

> Six `<select>` elements on the visit form are `display:none` because the
> **Chosen** widget replaces them visually. They are still the real fields. A
> naive "is it visible?" crawler drops all of them; this one flags them
> `replacedByWidget` and inventories them.

#### Two portals, two incompatible relationship vocabularies

The NPIP visit form and the Citizen Services registration form both ask for the
visitor's relationship to the inmate, from **different lists**:

| | Values | Notes |
|---|---|---|
| NPIP visit form (`ddlVisRelationship`) | **33** | includes official roles: `Judge`, `Minister`, `Police`, `Doctor`, `Consule/Ambassador` |
| Citizen Services (`VisitorProfile.Vis_Relation`) | **20** | adds `Self`; has `COUSIN` where NPIP has `Cousin` |
| **Shared** | **18** | — |

15 NPIP values have no Citizen Services equivalent, and `COUSIN` / `Cousin`
differ only by case — a collision any mapping has to handle deliberately.

This independently confirms the finding in `docs/research_reports/E Prisons.pdf` that the two
public booking paths "collect overlapping but different fields and use different
relationship lists". The replica models it honestly: `relationship.source_portal`
keeps the two lists apart, each form offers only its own, and a test asserts that
a value from one is rejected by the other.

**For the ERP this is a concrete integration requirement**, not a curiosity: any
pre-fill feature must know which portal it is targeting and map between the two
vocabularies.

## 7. What could not be accessed or reproduced

Everything below is recorded in `analysis/replication_gaps.json` — nothing is
papered over elsewhere.

| Gap | Count | Why |
|---|---|---|
| `incomplete-interaction` | 25 | **No form was ever submitted to the original.** It is a live production government service; submitting would create or query a real record. So no success, validation or error state of the original was observed, and none is guessed at. |
| `uncertain-technology` | 8 | Items that are `inferred`, not `confirmed` — including the database, which is `unknown`. |
| `missing-asset` | 7 | Live CAPTCHA images (session-bound, so they 404 when re-requested) and three 404s on the original itself. |
| `external-dependency` | 4 | Google Fonts (Roboto). Recorded, not downloaded; the replica uses a local system font stack instead. |
| `dynamic-navigation` | 1 | The React mount builds its menu after hydration and can offer different routes between loads, so its route list is a snapshot. |
| `skipped-url` | 1 | A linked PDF, collected as an asset rather than crawled as a page. |

> `WebResource.axd` / `ScriptResource.axd` carry a session- and machine-key-scoped
> `d=` token and can 404 when re-requested outside their originating page session.
> The pipeline classifies those as `unavailable-by-design` rather than failures.
> On the final run they resolved and were downloaded.

Additionally:

- **Everything behind a login is out of scope.** The Citizen Services account
  area, ePrisons MIS and Legal Aid were never accessed. The replica renders their
  public login screens and authenticates nobody.
- **No CAPTCHA was reproduced, solved or bypassed.** The replica asks a simple
  arithmetic question instead, purely to demonstrate that a verification step
  exists in the flow.
- **A `/NPIPDashboard/siteMap` link was present in the site's navigation early on
  26 Oct 2026 and absent from it later the same day.** The route still resolves.
  The original's SPA navigation is dynamic; this is an observation about the
  target, not a crawl failure.
- `/Test` is linked from the live site and **returns 404 there**. The replica
  reproduces that 404 deliberately, and the test suite asserts it.

## 8. Which components are simulated

| Area | In the replica |
|---|---|
| Visit registration, grievance, visitor registration | Fully working locally: validation, cascade, success and error states, persisted to SQLite |
| Visit status, grievance status | Working lookups against locally submitted or seeded records |
| Listings (absconder, parole jumper) | Working, with state filter and pagination |
| Statistics and dashboards | Computed from the local synthetic database — **not** the original's figures |
| `/NPIPDashboard/` | Client-routed shell with six routes, fetching the local API — mirrors the original's SPA shape, implemented in vanilla JS rather than React |
| Login screens | Rendered, non-functional by design |
| CAPTCHA | Replaced by an arithmetic challenge |
| Official emblem, NPIP wordmark, NIC logo, hero illustration | **Replaced by a neutral placeholder mark** |

## 9. Visual comparison

`analysis/visual_comparison.json`, with diff images in `comparison/`.

Measured with pixelmatch at three viewports, full-page, images padded to a common
canvas so a longer page counts as a difference rather than being cropped away.

- **Raw mean difference: 0.286** (demonstration banner in place)
- **Banner-aligned mean: 0.239**, median 0.249, best 0.075, worst 0.431

The replica adds a banner the original has no counterpart for, which displaces
every row below it. The banner-aligned figure crops that deliberate addition so
the number reflects layout fidelity rather than the banner. Both are reported.

**No page matches the original exactly, and none is claimed to.** The residual
difference is dominated by:

1. deliberately different body text on the policy, contact and FAQ pages — this
   replica does not copy government prose or republish real contact details;
2. the placeholder mark in place of the official emblems;
3. a flat gradient where the original has a photographic hero and illustrations;
4. native select controls where the original paints Chosen widgets;
5. different figures, because the replica reports its own synthetic database.

## 10. Security and data handling

- **No TLS verification was disabled anywhere.** No `-k`, no
  `rejectUnauthorized: false`, no `ignoreHTTPSErrors`. `eprisons.nic.in` chains to
  the new ISRG **Root YR**, which this machine's CA bundle predates; the fix was
  to add Let's Encrypt's published cross-signed root — which chains to the
  already-trusted ISRG Root X1 — to `tools/certs/ca-bundle.pem`. See
  `tools/certs/README.md`.
- **No credential, session token, cookie or authorization header is stored.**
  Those header names are stripped before anything is written to disk.
- **No endpoint was enumerated, fuzzed or probed.** Network observations are
  passive, from loading public pages. No request body was captured.
- **No account was created anywhere.** The original's Code of Conduct forbids
  bot-created accounts, and this project creates none.
- Requests were made **one at a time** with a ~900 ms delay, so the original was
  never put under load.
- The replica sends a strict `Content-Security-Policy` with `form-action 'self'`
  and `connect-src 'self'`, so even an accidental absolute URL cannot post
  outward. A test asserts no page references an off-host URL.
- The local database has **no access control and no encryption at rest**. Do not
  type anyone's real personal data into it.
- Submissions write an **append-only audit entry**; database triggers reject any
  `UPDATE` or `DELETE` against `audit_log`, and tests assert both.

### Asset licensing

Government of India websites generally reserve copyright in their content and
emblems, and the National Emblem is additionally protected by the State Emblem of
India (Prohibition of Improper Use) Act, 2005. The downloaded assets are retained
here as **analysis evidence for an internal, clearly-labelled demonstration**.
The replica substitutes a neutral placeholder mark for every official emblem and
logo, so it cannot be mistaken for the official service.

## 11. Directory structure

```
eprisons_nic_in/
├── README.md                    this file
├── analysis/                    11 JSON artifacts (see below)
├── original_assets/             111 downloaded files: images, icons, stylesheets, scripts, documents
├── reference_pages/
│   ├── screenshots/             the original at 3 viewports
│   ├── dom/                     rendered HTML per page
│   └── page_metadata/           components, geometry, forms, assets, links per page
├── replica/
│   ├── backend/                 Express server, db access, validation rules
│   ├── frontend/                EJS views, CSS, client JS, placeholder mark
│   └── database/                schema.sql, seed.js, replica.sqlite
├── replica_screenshots/         the replica at the same 3 viewports
├── comparison/                  pixel diffs, raw and banner-aligned
├── tests/                       run-tests.js, test-report.json
└── logs/                        per-run JSONL logs
```

### Analysis artifacts

| File | Contents |
|---|---|
| `website_overview.json` | input/final URL, category and evidence, crawl scope, counts, coverage claim |
| `technology_stack.json` | each technology with evidence, confidence and confirmed/inferred/unknown |
| `routes.json` | every discovered URL, page type, local replica route, aliases |
| `component_inventory.json` | reusable components, where used, median geometry and style |
| `asset_manifest.json` | source URL, local path, type, SHA-256, size, usage pages, status |
| `forms_and_interactions.json` | every form, field, option list, validation and dependency |
| `api_inventory.json` | passively observed endpoints — **no public API exists** |
| `database_findings.json` | verified / inferred / unknown, kept strictly apart |
| `replication_gaps.json` | the deliberate record of what is *not* reproduced |
| `crawl_manifest.json` | visited, pending, skipped, aliases, errors — enough to resume |
| `visual_comparison.json` | per-route measured pixel difference at 3 viewports |
| `classification_evidence.json` | category scoring, and whether it holds without the hostname |

## 12. How this feeds the ERP

`docs/requirements/erp-scope.pdf` requires the ERP to exchange data with e-Prisons for
"institution-wise prisoner population, sanctioned capacity, admissions, releases,
transfers, classification and category".

**There is no public API to integrate with** — confirmed here and consistent with
all five research reports in `docs/research_reports/`. That makes this replica useful in two
ways:

1. **A field-level contract.** `analysis/forms_and_interactions.json` gives the
   exact names, lengths, option lists and conditional rules the ERP must mirror
   so a citizen or officer never retypes data — including the State→Jail cascade
   and the `NOT AVAILABLE` identity-proof case.
2. **A local integration target.** The replica's API (`/api/jails`,
   `/api/stats/by-state`, `/api/absconders`, …) is *this replica's own*, not the
   original's. It exists so ERP integration code has something to develop and
   test against without touching a production government system.

The replica's schema already models the accountability the ERP scope demands in
section 4 — maker, approver, timestamp, and an audit trail no role can alter.

> **The ERP must not treat this replica's API as the real integration contract.**
> The real exchange will need a published interface obtained from NIC, as the
> scope document's "use published interfaces through an API gateway" requirement
> anticipates.

## Images (added 2026-10-30)

The 12 images supplied in `info/images/eprisoner.zip` (extracted to `info/images/eprisoner/`) are
embedded as base64 data URIs in the replica's views, each in the place the original uses:

| Image | Place |
|---|---|
| `topleft.png` | header logo, top left (NPIP, National Prisons Information Portal) |
| `digital.jpg` | home banner, slide 1 of 2 ("Digital innovation in correctional homes") |
| `feture1.png` … `feature6.png` | the six Features icons, in order: Instant Visit Request, Dashboard Reports, ePrison Canteen, KIOSK Information, Grievances, Legal Aid |
| `indiamap.png`, `net.png`, `comminity.png` | the three Highlights badges: States Covered, Prisons On-Board, records held |
| `ourservice.jpg` | home banner, slide 2 of 2 ("Our Services") |

The original's banner is a two-slide carousel with next/previous arrows and two bar indicators; the
replica rebuilds it in `views/pages/home.ejs` with `public/js/home-carousel.js` (advances every 7 s,
pauses on hover or focus, does not auto-advance for visitors who prefer reduced motion, and `#slide-2`
in the address opens the second slide). The images are generated by `node backend/scripts/embed-eprisons-images.js` into
`frontend/portals/eprisons/views/partials/img/`; the script checks each file's type from its first
bytes and refuses anything that is not a PNG or JPEG. The home page is now about 0.8 MB because the
two banners are inline. The "Unofficial Local Demonstration" banner and the "local demo" tag stay on
every page.

## DashBoard page (changed 2026-10-30)

`/public/DashBoard` follows the original's layout, taken from two reference screenshots in
`info/images/` (`Pasted image.png`, `Pasted image (2).png`): a "Find Your Option" filter panel (State
works; Jails is shown disabled because jail-level figures are not held), a "Dashboard" bar, "As on"
time, five cards with a circular icon, a figure and "View more", two charts, and a "Details of inside
prisoners" table. The earlier visit-status and grievance tables stay below under "Also in this
demonstration".

| Card | Icon | Figure |
|---|---|---|
| Inmates inside | `dashboard.png` (prisoner behind bars) | snapshot `inmates_in_custody` |
| Admissions today | `dashboard2.png` (person with an ID plate) | **synthetic**: 0.017% of inmates inside |
| Released today | `dashboard3.png` (scales of justice) | **synthetic**: 0.145% of inmates inside |
| Visits registered today | `dashboard4.png` (person at a desk) | snapshot `visits_registered_today` |
| Court Hearing today | `dashboard5.png` (person in a court dock) | snapshot `court_hearings_today` |

The demonstration database holds no daily admissions or releases, which is why those two cards are
scaled from the custody population (the page says so).

### The charts (changed 2026-10-30)

Both charts have the three series the original draws, with its colours and its reversed legend:

| Chart | Series (legend order) | Source |
|---|---|---|
| Nation wide prison population trend (last 7 days), stacked area, newest day first | Admission `#00e272`, Release `#544fc5`, Visitors `#2caffe` | today's point is the same figure as the cards; earlier days vary by a fixed function of the date, so a reload draws the same chart |
| Nation wide current prison population (top 7 states), grouped bars | Admission, Release, Inside `#2caffe` | Inside is the snapshot figure; Release and Admission are scaled from it (0.145% and 0.017%) |

They are drawn in the browser by `public/js/dashboard-charts.js` from the figures embedded in the page
(`<script type="application/json" id="dash-data">`), as SVG: no chart library and no request. Hovering a
point or bar shows its value. Clicking a legend entry hides or shows that series and redraws (the stack
re-forms); each chart keeps its own choice, and `#hide=release,admission` in the address starts with
those hidden. Without JavaScript each chart is replaced by a table of the same figures. The first chart
used to plot a single series ("Inside", from the lockup reports); that did not match the original.

### Hiding the filter panel (changed 2026-10-30)

The small square at the left of the "Dashboard" title bar is a button. Clicking it slides the "Find
Your Option" panel away to the left and the page closes the gap; clicking again slides it back. The
motion is a CSS transition (`.dash.is-collapsed` in `public/css/replica.css`); `public/js/dashboard-panel.js`
only flips the class and keeps `aria-expanded` and the button's label in step. On narrow screens, where
the panel sits above the page, it folds up and down instead. The hidden panel's fields leave the tab order,
the square fills in while the panel is hidden, and the motion is switched off for visitors who prefer
reduced motion. The charts and cards widen to use the freed space. The choice is not remembered on reload.

## eMulakat: New Visitor Registration (changed 2026-10-30)

`/public/MyVisitRegistration` (the "eMulakat" menu item) was compared with the original's captured markup and
screenshot and brought into line. What was missing or different, and what it is now:

| Original | Replica before | Now |
|---|---|---|
| title bar "New Visitor Registration" | "Visit Registration" | as the original |
| red "Click here for help" and "Valid Characters include A-z, 0-9 and space." | absent | both, above the cards; the help link opens `/public/eMulakatHelp`, this replica's own summary, because the original's goes to a PDF on another host and no page here may point off-host |
| two cards side by side: "Visitor Details" and "To Meet" (the prisoner's details are inside it) | three stacked cards, including a separate "Prisoner Details" | as the original; stacked on narrow screens |
| a placeholder (watermark) on 11 fields, and "NA" in ID Number | none | the original's own texts |
| red "**Note: Please carry a valid id and address proof at the time of visit in jail." | absent | present |
| Visit Date starts as today's date | empty | today's date in India |
| "Visit Mode *" is a single "Physical" checkbox (its id is `chkPH`) | a Physical/Video dropdown, plus an invented "Physically handicapped" box | the "Physical" checkbox, ticked by default; unticked records a video visit; the handicap field is gone and its column stays 0 |
| a CAPTCHA image with a refresh button, "Type the characters you see in this picture", a Submit button and "(All Fields marked * are mandatory)" | arithmetic question with no refresh, and developer notes ([REC]/[OBS]) shown under fields | the arithmetic question with a refresh button (`/api/challenge`), "Type the answer to the question shown", Submit and the mandatory-fields line; the developer notes moved into a closed "About this demonstration form" section |

No CAPTCHA is reproduced: the question is arithmetic, and the refresh button only asks this server for a new one.
The stray "Submit" in a copy of the original's text, right after Visit Date, is the calendar image button's default
name, not a second button.
