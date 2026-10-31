# gov-replica pipeline

Takes **one input — a domain** — and produces a local demonstration replica of
that site under [`../gov_replica`](../gov_replica), with the analysis that
justifies every line of it.

```bash
cd tools
npm install

node bin/gov-replica.js eprisons.nic.in            # analyse (resumable)
node bin/build-replica.js ../gov_replica/E_Prisons/eprisons_nic_in --port 4173
node bin/compare-replica.js ../gov_replica/E_Prisons/eprisons_nic_in http://127.0.0.1:4173
node bin/write-readme.js ../gov_replica/E_Prisons/eprisons_nic_in
```

The pipeline picks the category and output directory itself. Nothing else is
asked of the user.

## Layout

| Path | Role |
|---|---|
| `bin/gov-replica.js` | the analysis pipeline: normalize → classify → crawl → stack → assets → artifacts |
| `bin/build-replica.js` | generates a replica from the captured analysis |
| `bin/compare-replica.js` | screenshots the replica and measures the pixel difference |
| `bin/write-readme.js` | writes the per-domain README from the artifacts, so it cannot drift |
| `lib/normalize.js` | validates the input, follows redirects hop by hop |
| `lib/classify.js` | zone-weighted category detection |
| `lib/crawl.js` | the crawler: scope, dedupe, SPA routes, throttling, resume |
| `lib/extract.js` | everything read from inside the page |
| `lib/stack.js` | technology detection with evidence and confidence |
| `lib/assets.js` | asset collection and the manifest |
| `lib/analyze.js` | builds the JSON artifacts |
| `lib/compare.js` | screenshot capture and diffing |
| `replica-kit/` | the generic replica: one Express server driven by a generated `site.json` |
| `certs/` | CA bundle, with why it exists |

## Configuration

Crawl limits live in `lib/config.js` and can be overridden per run:

```bash
GOVREPLICA_MAX_PAGES=250 GOVREPLICA_DELAY_MS=2000 node bin/gov-replica.js uidai.gov.in
```

| Variable | Default | |
|---|---|---|
| `GOVREPLICA_MAX_PAGES` | 60 | pages per crawl |
| `GOVREPLICA_MAX_DEPTH` | 4 | link depth |
| `GOVREPLICA_DELAY_MS` | 1500 | pause between navigations |
| `GOVREPLICA_MAX_RUNTIME_MS` | 25 min | wall-clock cap |

## Things this pipeline learned the hard way

Each of these came from a real failure against one of the five portals, and each
is now handled rather than worked around.

**Zone-weighted classification.** `eforensics.gov.in` carries NCRB's postal
address and an `@ncrb.nic.in` email in its footer, which a flat word count
scored as a CCTNS site. Terms are now weighted by where they appear (title ×30,
headings ×12, nav ×10, meta ×8, body ×1), and a category must have a defining
term *outside* body text to win. A footer does not decide what a site is for.

**Scope is re-checked after every redirect.** `eforensics.gov.in/Login`
redirects to the JanParichay SSO on another domain. Checking scope only at
enqueue time let a third-party page into the project. The landed URL is checked
too; off-scope landings are recorded and not captured.

**Queries are never re-encoded.** Round-tripping a URL through
`URLSearchParams` turned `?p=casestatus/index` into `?p=casestatus%2Findex` —
requesting a URL the site never published. Canonicalisation now works on the raw
query text.

**Throttling is not a 404.** A fast crawl of `services.ecourts.gov.in` drew
HTTP 405 on *every* request; the same URLs served 200 minutes later. 403/405/429/503
now trigger exponential backoff and a retry instead of being recorded as the
page. Crawling slower beats recording a throttled response as content.

**Protocol downgrades are refused.** `digitalpolicecitizenservices.gov.in`
redirects https → http, and its plain-HTTP vhost emits a malformed upgrade that
drops a slash (`...gov.incentercitizen/`), dead-ending the chain. Refusing the
downgrade is both correct and routes around the defect. The defect is recorded,
not hidden.

**Client-side routes are reached the way a visitor reaches them.** The React
dashboard at `eprisons.nic.in/NPIPDashboard/` answers 403 to a direct request
for an inner route, because no such file exists — the bundle routes to it. The
crawler detects the mount and clicks the in-app link.

**Wait for the page to finish.** Screenshots taken mid-load captured
`"Loading…"` and `"Total Records : 0"`, which later read as a 0.93 visual
difference that was a capture defect, not a replica one. The crawler now waits
for the text to stop changing and loading markers to clear.

**Hidden is not absent.** Six `<select>` elements on the e-Mulakat form are
`display:none` because the Chosen widget paints its own. They are still the
real fields; a naive visibility filter drops all of them. They are flagged
`replacedByWidget` and inventoried.

**Assets come from the page render.** Re-requesting each asset separately drew
HTTP 405 from `services.ecourts.gov.in` (0 of 53 collected). Keeping the bytes
the browser already received halves the requests made to the target and works
regardless of WAF rules.

**Area, not element count, decides a page's colour.** A full-bleed CSS gradient
is one element while a nav bar may be thirty, so `eforensics.gov.in` read as a
white site when most of what a visitor sees is purple. Backgrounds are weighted
by the area they cover, and gradients (which live in `background-image`) are
measured too.

**Resume has to restore the frontier.** Restoring captured pages alone left a
resumed run with nothing to do — every restored page was already visited — so it
reported "queue exhausted" in zero seconds with 120 URLs still pending. Pending
URLs and the links of restored pages are both re-queued, so raising the page
limit actually crawls further.

## What the pipeline will not do

- Submit any form to a live site, create an account, or attempt authentication.
- Reproduce, solve or bypass a CAPTCHA. Replicas ask an arithmetic question instead.
- Enumerate, fuzz or probe endpoints; network observation is passive.
- Record a credential, session token, cookie or authorization header — those
  header names are stripped before anything is written.
- Disable TLS verification. There is no `-k`, no `rejectUnauthorized: false`,
  no `ignoreHTTPSErrors` anywhere. See [`certs/README.md`](certs/README.md).
- Crawl a host it was not given.
- Claim to have recovered anyone's source code, or assert a database product
  that was not actually observed.

## Hand-tuning a page

The generator reproduces structure and fields for every route. Where a page
deserves closer visual work, drop a view into the project's
`replica/frontend/views/custom/` and the server uses it for that route alone:

| Route | View file |
|---|---|
| `/` | `custom/index.ejs` |
| `/Login` | `custom/Login.ejs` |
| `/Forget/ForgetPassword` | `custom/Forget_ForgetPassword.ejs` |

The slug is the route with slashes and punctuation replaced by underscores.
A rebuild never overwrites `views/custom/`, so hand work survives. A custom view
gets the same locals as the generic one (`page`, `form`, `errors`, `challenge`,
`submitted`), and `isCustomView` is set so the shared header stands down from
drawing its own hero band.

This is what closed most of the gap on `eforensics.gov.in`:

| Page | Generic | Hand-tuned |
|---|---|---|
| `/Login` | 0.727 | **0.224** |
| `/Forget/ForgetPassword` | 0.692 | **0.243** |
| `/Home/ContactUs` | 0.667 | **0.265** |
| `/` | 0.547 | **0.439** |
| **mean** | **0.690** | **0.293** |

## Replica fidelity, honestly

`E_Prisons/eprisons_nic_in` was hand-tuned page by page. The other four are
generated by `bin/build-replica.js`, which reproduces **fields, option lists,
validation rules, dependent dropdowns and page structure** faithfully, and
approximates visual design from measured colour, type and geometry tokens.

For a heavily designed marketing-style page the generator plateaus well short of
a pixel match, because it does not redistribute the original's illustrations,
icons or prose. A high difference number there means the replica looks different
**on purpose** — it is not a failed pixel copy. The field-level fidelity is the
part the ERP depends on, and that is faithful.

Some of that gap closes with a custom view, as the table above shows. Some of it
cannot and should not. `www.digitalpolicecitizenservices.gov.in/login.htm` stays
near 0.51 however its layout is matched, because most of its visual mass is the
NCRB crest, the National Emblem of India and a real postal address — none of
which this project reproduces. When the remaining difference *is* the thing we
deliberately leave out, the number has stopped being a quality signal.
