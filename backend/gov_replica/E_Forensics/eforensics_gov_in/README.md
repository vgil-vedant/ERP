# eforensics.gov.in — local demonstration replica

> ## Unofficial Local Demonstration — Not an Official Government Service
>
> This directory holds an **independent reimplementation** of the public pages of
> `eforensics.gov.in`, built for authorized development, testing and educational use. It is
> **not** affiliated with, endorsed by, or operated by any government body.
>
> It holds **no real data**. Every record is synthetic. It **cannot** submit anything
> to a government system — and it must never be deployed anywhere a member of the
> public could mistake it for the real service.

| | |
|---|---|
| **Target URL** | `https://eforensics.gov.in` |
| **Final URL** | `https://eforensics.gov.in` |
| **Detected category** | `E_Forensics` — confirmed, medium confidence |
| **Local project path** | `gov_replica/E_Forensics/eforensics_gov_in/` |
| **Analysed on** | 2026-10-27 |
| **Pages captured** | 4 (0 failed, 1 skipped) |
| **Assets collected** | 44 of 45 referenced (2.5 MB) |
| **Forms inventoried** | 2 (5 functional fields, 2 CAPTCHA-protected) |
| **Tests** | **30 / 30 passing** |
| **Visual difference** | mean 0.2927, median 0.2652, best 0.2236, worst 0.4391 (desktop, banner-aligned) |

---

## 1. Why this category

The classifier reads page content, not the domain name. Terms are weighted by *where*
they appear — a word in a title or heading states purpose; the same word in a footer
usually does not.

Winning category `E_Forensics` scored **42.41**, against 20.95 for `CCTNS`.
Defining terms: `e-forensic`, `forensic case`.

`wouldHoldWithoutHostname`: **yes** — the verdict stands on content alone, with the hostname bonus removed.

Full scoring, per zone, in `analysis/classification_evidence.json`.

## 2. Detected technology stack

16 confirmed, 2 inferred, 4 explicit unknowns. Every finding carries its evidence in `analysis/technology_stack.json`.

| Technology | Category | Status |
|---|---|---|
| CAPTCHA-protected forms | authentication / anti-bot | **confirmed** |
| Bootstrap | CSS framework | **confirmed** |
| Bootstrap (JS bundle) | CSS framework | **confirmed** |
| Bootstrap 4. | CSS framework | **confirmed** |
| Google Fonts | font provider | **confirmed** |
| Font Awesome | icon library | **confirmed** |
| DataTables | JavaScript library | **confirmed** |
| jQuery | JavaScript library | **confirmed** |
| jQuery 3.7.1 | JavaScript library | **confirmed** |
| jQuery 3.7.1. | JavaScript library | **confirmed** |
| Owl Carousel | JavaScript library | **confirmed** |

Inferred (not safe to build against):

- `Form-based login (server-side session)` (authentication pattern) — 1 login page(s) captured, e.g. https://eforensics.gov.in/Login
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
cd gov_replica/E_Forensics/eforensics_gov_in/replica/backend

npm install          # express, ejs, better-sqlite3
npm run seed         # build replica/database/replica.sqlite (synthetic data)
npm start            # serve on http://127.0.0.1:4176
```

Local demo URL: **http://127.0.0.1:4176/** (override with `PORT=…`).

### Tests

```bash
cd gov_replica/E_Forensics/eforensics_gov_in
node tests/run-tests.js
```

Writes `tests/test-report.json`. **30 of 30 passing.**

| Group | Passed | Failed |
|---|---|---|
| routes | 6 | 0 |
| assets | 4 | 0 |
| isolation | 4 | 0 |
| validation | 6 | 0 |
| roundtrip | 3 | 0 |
| api | 2 | 0 |
| errors | 1 | 0 |
| audit | 3 | 0 |
| restart | 1 | 0 |

### Re-run the analysis

```bash
cd tools
node bin/gov-replica.js eforensics.gov.in          # resumable; the domain is the only input
node bin/build-replica.js ../gov_replica/E_Forensics/eforensics_gov_in
node bin/compare-replica.js ../gov_replica/E_Forensics/eforensics_gov_in http://127.0.0.1:4176
```

## 5. What was analysed

4 page(s). **The crawl queue was exhausted** — every in-scope page reachable by link-following from the start URL, within the configured depth, was captured.

| Page type | Count |
|---|---|
| `home` | 1 |
| `contact` | 1 |
| `login` | 1 |
| `content` | 1 |

Evidence on disk:

- `reference_pages/screenshots/` — full-page PNGs at 1366×900, 768×1024, 390×844
- `reference_pages/dom/` — the rendered HTML of each page
- `reference_pages/page_metadata/` — per-page components, geometry, forms, assets, links

### Forms and reference data

| Form | Page | Fields | CAPTCHA |
|---|---|---|---|
| `form[0]` | /Login | 3 | yes |
| `form[0]` | /Forget/ForgetPassword | 2 | yes |

## 6. What could not be accessed or reproduced

Recorded in `analysis/replication_gaps.json` — nothing is papered over elsewhere.

| Gap | Count | Why |
|---|---|---|
| `uncertain-technology` | 6 | Detected by inference rather than direct evidence — including the database, which is `unknown`. |
| `external-dependency` | 2 | Hosted on another domain. Recorded, not downloaded; the replica uses a local equivalent. |
| `incomplete-interaction` | 2 | A form on the original was **never submitted**. It is a live production government service, so its real success, validation and error states were never observed and are not guessed at. |
| `off-scope-redirect` | 1 | — |
| `skipped-url` | 1 | Not crawled as a page — a linked document, or beyond the configured depth. |

Always out of scope:

- **Anything behind a login.** Authenticated areas were never accessed.
- **Anything behind a CAPTCHA.** None was reproduced, solved or bypassed; the replica
  asks a simple arithmetic question instead.
- **The original's database, source code and server behaviour**, none of which a public
  frontend exposes.

## 7. Public API findings

**No public API.** No XHR/fetch data endpoint was observed on any captured page. The portal renders server-side and posts back through full page requests.

- No public, self-service API is published for this portal.
- Public forms are CAPTCHA-protected; automated submission is not available.
- Authenticated functionality sits behind a server-side session and is out of scope.

> The replica exposes its **own** local API (`/api/reference/…`, `/api/cascade/…`,
> `/api/submissions/…`) so ERP integration code has something to develop against.
> **That is not the original's contract and must not be treated as one.**

## 8. Visual comparison

Measured with pixelmatch at 3 viewports, full-page, images padded to a common canvas so a longer page counts as a difference rather than being cropped away.

- **Raw mean difference: 0.3055** (demonstration banner in place)
- **Banner-aligned mean: 0.2927**, median 0.2652, best 0.2236, worst 0.4391

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
eforensics_gov_in/
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

## Images (added 2026-10-29)

The 14 images captured in `original_assets/images` (logo, banner, three key-feature
icons, five "how it works" icons, phone / e-mail / location icons and the NIC logo) are
embedded as base64 data URIs in the replica's views, each where the original placed it:

| Image | Place |
|---|---|
| `logo.png` | header, left of the navigation |
| `Banner.png` | home page hero, right of the heading |
| `key-feature1-3.png` | Key Features cards |
| `Login`, `Registration`, `Report-Submission`, `Analyze-Track`, `Monitor-via-Dashboard` | How It Works steps, on white rounded squares |
| `phone`, `email`, `location` (twice) | Contact Us band on the home, login, password and contact pages |
| `nic_logo.png` | footer |

They are generated by `node backend/scripts/embed-eforensics-images.js` into
`frontend/portals/eforensics/views/partials/img/`. `GetCaptchaImage` was not embedded:
it is a captured HTML response, not an image, and the replica keeps its arithmetic
question instead of a CAPTCHA. The page text and the contact details are unchanged and
still not copied. The "Unofficial Local Demonstration" banner and the "local demo" tag
stay on every page.

## Navigation (changed 2026-10-29)

The header menu follows the original: **Home, FAQ, Contact Us, Login, Login with JanParichay,
e-Forensic 1.0**, with the last three drawn as buttons. It is defined in
`replica/backend/site.json` (`nav`; `variant` picks the button style). Differences from the
original, on purpose:

- `FAQ` links to `#`, as it does on the original.
- `Login with JanParichay` opens a local page (`/Authorize/RedirectToAuthorization`) that says the
  replica never contacts the national sign-in service. The original redirects to it.
- `e-Forensic 1.0` opens a local page (`/Home/eForensic1`) that says what the original button opens. The original links to another host; the replica's own isolation test forbids any page pointing off-host, so no link leaves this replica.
- `Forgot Password` is no longer in the menu; `/Forget/ForgetPassword` still works.

`build-replica.js` regenerates `site.json` from the capture and would overwrite this menu and the
extra page, so re-apply them after a rebuild.

## Font (changed 2026-10-30)

This site uses **Times New Roman** everywhere (`--font` in `frontend/portals/eforensics/public/css/tokens.css`:
`"Times New Roman", Times, "Liberation Serif", serif`). Body text, menu, headings, form fields and
buttons all take it from that one setting. Liberation Serif is the metric-compatible stand-in on
systems without Times New Roman. Only reference numbers (`.ref-no`) stay monospaced. Each portal has its
own `tokens.css`, so the other four are unchanged.
