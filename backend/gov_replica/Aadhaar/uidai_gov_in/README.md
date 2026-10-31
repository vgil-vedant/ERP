# uidai.gov.in — local demonstration replica

> ## Unofficial Local Demonstration — Not an Official Government Service
>
> This directory holds an **independent reimplementation** of the public pages of
> `uidai.gov.in`, built for authorized development, testing and educational use. It is
> **not** affiliated with, endorsed by, or operated by any government body.
>
> It holds **no real data**. Every record is synthetic. It **cannot** submit anything
> to a government system — and it must never be deployed anywhere a member of the
> public could mistake it for the real service.

| | |
|---|---|
| **Target URL** | `https://uidai.gov.in` |
| **Final URL** | `https://uidai.gov.in/hi` (after 1 redirect) |
| **Detected category** | `Aadhaar` — confirmed, high confidence |
| **Local project path** | `gov_replica/Aadhaar/uidai_gov_in/` |
| **Analysed on** | 2026-10-27 |
| **Pages captured** | 249 (1 failed, 193 skipped, 159 URL aliases merged) |
| **Assets collected** | 952 of 1039 referenced (255.9 MB) |
| **Forms inventoried** | 247 (23 functional fields, 6 CAPTCHA-protected) |
| **Tests** | **286 / 286 passing** |
| **Visual difference** | mean 0.1697, median 0.1526, best 0.0972, worst 0.3653 (desktop, banner-aligned) |

---

## 1. Why this category

The classifier reads page content, not the domain name. Terms are weighted by *where*
they appear — a word in a title or heading states purpose; the same word in a footer
usually does not.

Winning category `Aadhaar` scored **117.57**, against 1.87 for `E_Courts`.
Defining terms: `uidai`, `unique identification authority`, `aadhaar`.

`wouldHoldWithoutHostname`: **yes** — the verdict stands on content alone, with the hostname bonus removed.

Full scoring, per zone, in `analysis/classification_evidence.json`.

## 2. Detected technology stack

18 confirmed, 8 inferred, 4 explicit unknowns. Every finding carries its evidence in `analysis/technology_stack.json`.

| Technology | Category | Status |
|---|---|---|
| Google Analytics | analytics | **confirmed** |
| Google Tag Manager / gtag | analytics | **confirmed** |
| CAPTCHA-protected forms | authentication / anti-bot | **confirmed** |
| Cloudflare | CDN / reverse proxy | **confirmed** |
| Drupal | CMS / portal platform | **confirmed** |
| PDF.js | document viewer | **confirmed** |
| Google Fonts | font provider | **confirmed** |
| Create React App production build | frontend framework | **confirmed** |
| Next.js | frontend framework | **confirmed** |
| React (single-page application) | frontend framework | **confirmed** |
| nginx | web server | **confirmed** |
| nginx 1.31.4 | web server | **confirmed** |

Inferred (not safe to build against):

- `Form-based login (server-side session)` (authentication pattern) — 1 login page(s) captured, e.g. https://tathya.uidai.gov.in/access/login?role=resident
- `Bootstrap` (CSS framework) — 74 Bootstrap-style class names observed in the rendered DOM (e.g. `container`, `row`, `col-md-*`, `navbar`)
- `AmazonS3` (web server) — `Server: AmazonS3` response header (product not recognised by this tool)
- `ESF` (web server) — `Server: ESF` response header (product not recognised by this tool)
- `Golfe2` (web server) — `Server: Golfe2` response header (product not recognised by this tool)
- `Google Tag Manager` (web server) — `Server: Google Tag Manager` response header (product not recognised by this tool)

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
cd gov_replica/Aadhaar/uidai_gov_in/replica/backend

npm install          # express, ejs, better-sqlite3
npm run seed         # build replica/database/replica.sqlite (synthetic data)
npm start            # serve on http://127.0.0.1:4177
```

Local demo URL: **http://127.0.0.1:4177/** (override with `PORT=…`).

### Tests

```bash
cd gov_replica/Aadhaar/uidai_gov_in
node tests/run-tests.js
```

Writes `tests/test-report.json`. **286 of 286 passing.**

| Group | Passed | Failed |
|---|---|---|
| routes | 251 | 0 |
| assets | 4 | 0 |
| isolation | 4 | 0 |
| validation | 16 | 0 |
| roundtrip | 3 | 0 |
| api | 3 | 0 |
| errors | 1 | 0 |
| audit | 3 | 0 |
| restart | 1 | 0 |

### Re-run the analysis

```bash
cd tools
node bin/gov-replica.js uidai.gov.in          # resumable; the domain is the only input
node bin/build-replica.js ../gov_replica/Aadhaar/uidai_gov_in
node bin/compare-replica.js ../gov_replica/Aadhaar/uidai_gov_in http://127.0.0.1:4177
```

## 5. What was analysed

249 page(s). **The crawl stopped at maxPages=250**, so the site is NOT fully explored: 113 in-scope URL(s) remained queued.

| Page type | Count |
|---|---|
| `content` | 181 |
| `registration` | 11 |
| `help` | 10 |
| `policy` | 10 |
| `statistics` | 9 |
| `home` | 8 |
| `listing` | 7 |
| `about` | 5 |
| `contact` | 3 |
| `status-enquiry` | 2 |
| `error` | 2 |
| `login` | 1 |

Evidence on disk:

- `reference_pages/screenshots/` — full-page PNGs at 1366×900, 768×1024, 390×844
- `reference_pages/dom/` — the rendered HTML of each page
- `reference_pages/page_metadata/` — per-page components, geometry, forms, assets, links

### Forms and reference data

| Form | Page | Fields | CAPTCHA |
|---|---|---|---|
| `form[0]` | /check-aadhaar-validity/en | 2 | yes |
| `form[0]` | /genricDownloadAadhaar | 6 | yes |
| `form[0]` | /checkStatus/en | 2 | yes |
| `form[0]` | /access/login?role=resident | 2 | yes |
| `form[0]` | /grievance-feedback/en | 9 | yes |
| `form[0]` | /grievance-feedback-status/en | 2 | yes |

Option lists transcribed from the live markup and loaded into the replica verbatim:

- `translate_plugin_target_language_list` — **23** values (e.g. `English`, `Assamese (অসমীয়া)`, `Bengali (বাংলা)`)
- `state` — **36** values (e.g. `Andaman and Nicobar Islands`, `Andhra Pradesh`, `Arunachal Pradesh`)
- `enquirer` — **2** values (e.g. `Self`, `Other`)
- `documenttype1` — **8** values (e.g. `Update Related`, `Enrolment Related`, `Authentication Issue`)

## 6. What could not be accessed or reproduced

Recorded in `analysis/replication_gaps.json` — nothing is papered over elsewhere.

| Gap | Count | Why |
|---|---|---|
| `incomplete-interaction` | 247 | A form on the original was **never submitted**. It is a live production government service, so its real success, validation and error states were never observed and are not guessed at. |
| `skipped-url` | 193 | Not crawled as a page — a linked document, or beyond the configured depth. |
| `external-dependency` | 69 | Hosted on another domain. Recorded, not downloaded; the replica uses a local equivalent. |
| `missing-asset` | 18 | A referenced asset could not be collected (session-bound CAPTCHA images, or 404s on the original itself). |
| `uncertain-technology` | 12 | Detected by inference rather than direct evidence — including the database, which is `unknown`. |
| `inaccessible-page` | 1 | The page could not be captured. |
| `dynamic-navigation` | 1 | The menu is built in the browser and can differ between loads, so the route list is a snapshot. |

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

- **Raw mean difference: 0.1704** (demonstration banner in place)
- **Banner-aligned mean: 0.1697**, median 0.1526, best 0.0972, worst 0.3653

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
uidai_gov_in/
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
