# ecourts.gov.in — local demonstration replica

> ## Unofficial Local Demonstration — Not an Official Government Service
>
> This directory holds an **independent reimplementation** of the public pages of
> `ecourts.gov.in`, built for authorized development, testing and educational use. It is
> **not** affiliated with, endorsed by, or operated by any government body.
>
> It holds **no real data**. Every record is synthetic. It **cannot** submit anything
> to a government system — and it must never be deployed anywhere a member of the
> public could mistake it for the real service.

| | |
|---|---|
| **Target URL** | `https://ecourts.gov.in` |
| **Final URL** | `https://ecourts.gov.in/ecourts2.0/` (after 1 redirect) |
| **Detected category** | `E_Courts` — confirmed, high confidence |
| **Local project path** | `gov_replica/E_Courts/ecourts_gov_in/` |
| **Analysed on** | 2026-10-27 |
| **Pages captured** | 242 (8 failed, 2429 skipped, 16 URL aliases merged) |
| **Assets collected** | 756 of 874 referenced (137.6 MB) |
| **Forms inventoried** | 498 (223 functional fields, 84 CAPTCHA-protected) |
| **Tests** | **492 / 492 passing** |
| **Visual difference** | mean 0.4169, median 0.3844, best 0.1511, worst 0.7496 (desktop, banner-aligned) |

---

## 1. Why this category

The classifier reads page content, not the domain name. Terms are weighted by *where*
they appear — a word in a title or heading states purpose; the same word in a footer
usually does not.

Winning category `E_Courts` scored **181.31**, against 2.18 for `E_Prisons`.
Defining terms: `ecourts`, `e-courts`, `cause list`, `case status`, `cnr number`.

`wouldHoldWithoutHostname`: **yes** — the verdict stands on content alone, with the hostname bonus removed.

Full scoring, per zone, in `analysis/classification_evidence.json`.

## 2. Detected technology stack

19 confirmed, 6 inferred, 4 explicit unknowns. Every finding carries its evidence in `analysis/technology_stack.json`.

| Technology | Category | Status |
|---|---|---|
| CAPTCHA-protected forms | authentication / anti-bot | **confirmed** |
| Bootstrap | CSS framework | **confirmed** |
| Bootstrap (JS bundle) | CSS framework | **confirmed** |
| Bootstrap 4. | CSS framework | **confirmed** |
| Google Fonts | font provider | **confirmed** |
| Bootstrap Icons | icon library | **confirmed** |
| Font Awesome | icon library | **confirmed** |
| Chosen (jQuery select widget) | JavaScript library | **confirmed** |
| DataTables | JavaScript library | **confirmed** |
| jQuery | JavaScript library | **confirmed** |
| jQuery UI | JavaScript library | **confirmed** |
| Popper.js | JavaScript library | **confirmed** |
| Apache httpd | web server | **confirmed** |

Inferred (not safe to build against):

- `` (web server) — `Server: ` response header (product not recognised by this tool)
- `cafe` (web server) — `Server: cafe` response header (product not recognised by this tool)
- `ESF` (web server) — `Server: ESF` response header (product not recognised by this tool)
- `fife` (web server) — `Server: fife` response header (product not recognised by this tool)
- `scaffolding on HTTPServer2` (web server) — `Server: scaffolding on HTTPServer2` response header (product not recognised by this tool)
- `sffe` (web server) — `Server: sffe` response header (product not recognised by this tool)

> **The database is `unknown` and deliberately not guessed.** A website frontend does
> not expose its database, and nothing in the headers, markup, scripts or error output
> named one. `analysis/database_findings.json` keeps any "probably X" reasoning in a
> clearly-labelled `inferred` section. Do not build against it.

## 3. Why this replica is built on Express

The original's source code is not available and was never sought. This replica is an
**independent reimplementation** on Node + Express with server-rendered EJS, driven by
a generated `site.json` describing the captured pages, fields and option lists.

**It is an approximation and does not claim to be recovered source code.**

## 4. Prerequisites, install and run

- Node.js 18 or later, npm 9 or later
- A C toolchain, for `better-sqlite3`'s native build

```bash
cd gov_replica/E_Courts/ecourts_gov_in/replica/backend

npm install          # express, ejs, better-sqlite3
npm run seed         # build replica/database/replica.sqlite (synthetic data)
npm start            # serve on http://127.0.0.1:4178
```

Local demo URL: **http://127.0.0.1:4178/** (override with `PORT=…`).

### Tests

```bash
cd gov_replica/E_Courts/ecourts_gov_in
node tests/run-tests.js
```

Writes `tests/test-report.json`. **492 of 492 passing.**

| Group | Passed | Failed |
|---|---|---|
| routes | 244 | 0 |
| assets | 4 | 0 |
| isolation | 4 | 0 |
| validation | 229 | 0 |
| roundtrip | 3 | 0 |
| api | 3 | 0 |
| errors | 1 | 0 |
| audit | 3 | 0 |
| restart | 1 | 0 |

### Re-run the analysis

```bash
cd tools
node bin/gov-replica.js ecourts.gov.in          # resumable; the domain is the only input
node bin/build-replica.js ../gov_replica/E_Courts/ecourts_gov_in
node bin/compare-replica.js ../gov_replica/E_Courts/ecourts_gov_in http://127.0.0.1:4178
```

## 5. What was analysed

242 page(s). **The crawl stopped at maxPages=250**, so the site is NOT fully explored: 2331 in-scope URL(s) remained queued.

| Page type | Count |
|---|---|
| `content` | 169 |
| `listing` | 18 |
| `error` | 14 |
| `form` | 13 |
| `search` | 12 |
| `policy` | 9 |
| `contact` | 2 |
| `about` | 2 |
| `sitemap` | 2 |
| `home` | 1 |

Evidence on disk:

- `reference_pages/screenshots/` — full-page PNGs at 1366×900, 768×1024, 390×844
- `reference_pages/dom/` — the rendered HTML of each page
- `reference_pages/page_metadata/` — per-page components, geometry, forms, assets, links

### Forms and reference data

| Form | Page | Fields | CAPTCHA |
|---|---|---|---|
| `Search By CNR Number` | /hcservices/main.php | 2 | yes |
| `form[1]` | /ecourtindia_v6/ | 2 | yes |
| `frm` | /epay/ | 5 | no |
| `frm_login` | /pdedev/ | 9 | yes |
| `frm` | /pdfsearch/index.php | 6 | yes |
| `form[1]` | /ecourtindia_v6/?code=english&lang=English&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?code=hindi&lang=%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?code=marathi&lang=%E0%A4%AE%E0%A4%B0%E0%A4%BE%E0%A4%A0%E0%A5%80&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?code=gujarati&lang=%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?code=kannada&lang=%E0%B2%95%E0%B2%A8%E0%B3%8D%E0%B2%A8%E0%B2%A1&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?code=tamil&lang=%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D&p=home/fillLangState | 2 | yes |
| `form[1]` | /ecourtindia_v6/?p=home | 2 | yes |

Option lists transcribed from the live markup and loaded into the replica verbatim:

- `sel_lang` — **3** values (e.g. `English`, `हिन्दी (Hindi)`, `मराठी (Marathi)`)
- `sateist` — **37** values (e.g. `Please Select Your State/UT`, `Andaman and Nicobar`, `Andhra Pradesh`)
- `state_code1` — **26** values (e.g. `Select State`, `Allahabad High Court`, `Bombay High Court`)
- `dist_code1` — **1** values (e.g. `Select District`)
- `sel_year` — **9** values (e.g. `2018`, `2019`, `2020`)
- `state_code` — **26** values (e.g. `Select High Court`, `Allahabad High Court`, `Bombay High Court`)
- `dist_code` — **1** values (e.g. `Select Bench`)
- `alertdashboard_length` — **4** values (e.g. `10`, `25`, `50`)
- `case_type_gr` — **11** values (e.g. `All`, `Writ Petition`, `Second Appeal`)
- `ins_year` — **10** values (e.g. `Year`, `2018`, `2019`)

## 6. What could not be accessed or reproduced

Recorded in `analysis/replication_gaps.json` — nothing is papered over elsewhere.

| Gap | Count | Why |
|---|---|---|
| `skipped-url` | 2429 | Not crawled as a page — a linked document, or beyond the configured depth. |
| `incomplete-interaction` | 498 | A form on the original was **never submitted**. It is a live production government service, so its real success, validation and error states were never observed and are not guessed at. |
| `external-dependency` | 83 | Hosted on another domain. Recorded, not downloaded; the replica uses a local equivalent. |
| `missing-asset` | 35 | A referenced asset could not be collected (session-bound CAPTCHA images, or 404s on the original itself). |
| `uncertain-technology` | 10 | Detected by inference rather than direct evidence — including the database, which is `unknown`. |
| `inaccessible-page` | 8 | The page could not be captured. |

Always out of scope:

- **Anything behind a login.** Authenticated areas were never accessed.
- **Anything behind a CAPTCHA.** None was reproduced, solved or bypassed; the replica
  asks a simple arithmetic question instead.
- **The original's database, source code and server behaviour**, none of which a public
  frontend exposes.

## 7. Public API findings

**No public API.** 155 data request(s) were observed, all internal to the application. None is a documented public API.

- No public, self-service API is published for this portal.
- Public forms are CAPTCHA-protected; automated submission is not available.
- Authenticated functionality sits behind a server-side session and is out of scope.

> The replica exposes its **own** local API (`/api/reference/…`, `/api/cascade/…`,
> `/api/submissions/…`) so ERP integration code has something to develop against.
> **That is not the original's contract and must not be treated as one.**

## 8. Visual comparison

Measured with pixelmatch at 3 viewports, full-page, images padded to a common canvas so a longer page counts as a difference rather than being cropped away.

- **Raw mean difference: 0.419** (demonstration banner in place)
- **Banner-aligned mean: 0.4169**, median 0.3844, best 0.1511, worst 0.7496

The replica adds a banner the original has no counterpart for, which displaces every
row below it. The banner-aligned figure crops that deliberate addition. Both are reported.

**No page matches the original exactly, and none is claimed to.** Expected differences:

- A demonstration banner runs across the top of every replica page. The original has no such banner, so every page differs by that strip and everything below it is displaced downwards.
- The official NPIP wordmark, the National Emblem and the NIC logo are replaced by a neutral placeholder mark, deliberately, so the replica cannot be mistaken for the official service.
- The home page hero on the original is a photographic carousel. The replica uses a flat gradient: the photograph is government material that is not ours to redistribute.
- Figures differ because the replica reports its own synthetic database, not the original's live statistics.
- The original renders its select controls through the Chosen jQuery widget. The replica uses native selects, which the browser paints differently.

Diff images in `comparison/`, per-route numbers in `analysis/visual_comparison.json`.

## 9. Security and data handling

- **No TLS verification was disabled anywhere.** No `-k`, no `rejectUnauthorized: false`,
  no `ignoreHTTPSErrors`. See `tools/certs/README.md`.
- **No credential, session token, cookie or authorization header is stored.** Those
  header names are stripped before anything is written to disk.
- **No endpoint was enumerated, fuzzed or probed.** Network observations are passive.
- **No account was created and no CAPTCHA was solved or bypassed.**
- Requests were made one at a time with a delay, so the original was never put under load.
- Assets the browser already received while rendering a page are kept from that
  response rather than re-requested, halving the load on the target.
- The replica sends a strict CSP with `form-action 'self'` and `connect-src 'self'`, so
  even an accidental absolute URL cannot post outward. A test asserts no page references
  an off-host URL.
- Anything secret-shaped (password, OTP, token) is **stripped before storage**: this
  demonstration authenticates nobody, so keeping one would be a liability with no purpose.
- The local database has **no access control and no encryption at rest**. Do not type
  anyone's real personal data into it.
- Submissions write an **append-only audit entry**; database triggers reject any `UPDATE`
  or `DELETE` against `audit_log`, and tests assert both.

### Asset licensing

Government of India websites generally reserve copyright in their content and emblems,
and the National Emblem is additionally protected by the State Emblem of India
(Prohibition of Improper Use) Act, 2005. Downloaded assets are retained here as
**analysis evidence for an internal, clearly-labelled demonstration**. The replica
substitutes a neutral placeholder mark for every official emblem and logo, and does not
republish the original's prose.

## 10. Directory structure

```
ecourts_gov_in/
├── README.md                 this file
├── analysis/                 the JSON artifacts listed below
├── original_assets/          collected public assets
├── reference_pages/          screenshots, rendered DOM, per-page metadata
├── replica/                  backend (Express + site.json), frontend (EJS), database
├── replica_screenshots/      the replica at the same viewports
├── comparison/               pixel diffs, raw and banner-aligned
├── tests/                    run-tests.js, test-report.json
└── logs/                     per-run JSONL logs
```

| File | Contents |
|---|---|
| `website_overview.json` | input/final URL, category and evidence, crawl scope, counts, coverage claim |
| `technology_stack.json` | each technology with evidence, confidence and confirmed/inferred/unknown |
| `routes.json` | every discovered URL, page type, local replica route, aliases |
| `component_inventory.json` | reusable components, where used, median geometry and style |
| `asset_manifest.json` | source URL, local path, type, SHA-256, size, usage pages, status |
| `forms_and_interactions.json` | every form, field, option list, validation and dependency |
| `api_inventory.json` | passively observed endpoints |
| `database_findings.json` | verified / inferred / unknown, kept strictly apart |
| `replication_gaps.json` | the deliberate record of what is *not* reproduced |
| `crawl_manifest.json` | visited, pending, skipped, aliases, errors — enough to resume |
| `visual_comparison.json` | per-route measured pixel difference |
| `classification_evidence.json` | zone-weighted category scoring |

## 11. How this feeds the ERP

`docs/requirements/erp-scope.pdf` requires the ERP to exchange data with this system. There is
**no public API to integrate with**, which makes this replica useful in two ways:

1. **A field-level contract.** `analysis/forms_and_interactions.json` gives the exact
   names, lengths and option lists the ERP must mirror so a citizen or officer never
   retypes data.
2. **A local integration target.** The replica runs offline, so ERP integration code can
   be developed and tested without touching a production government system.

The replica's schema models the accountability the ERP scope demands in section 4 —
maker, approver, timestamp, and an audit trail no role can alter.

> **The ERP must not treat this replica's API as the real integration contract.** The
> real exchange needs a published interface obtained from the system owner, as the scope
> document's "use published interfaces through an API gateway" requirement anticipates.
