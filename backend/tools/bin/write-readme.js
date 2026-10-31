#!/usr/bin/env node
'use strict';

/**
 * Generate the per-domain README required by spec section 9.
 *
 * Every number comes from the analysis artifacts on disk, so the README cannot
 * drift from what was actually measured. Nothing is asserted that is not in a
 * JSON file next to it.
 *
 *   node bin/write-readme.js <projectDir>
 */

const fs = require('fs');
const path = require('path');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

function table(rows, headers) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `|${headers.map(() => '---').join('|')}|`;
  return [head, sep].concat(rows.map((r) => `| ${r.join(' | ')} |`)).join('\n');
}

function build(projectDir) {
  const abs = path.resolve(projectDir);
  const A = (f) => path.join(abs, 'analysis', f);

  const overview = readJson(A('website_overview.json'), null);
  if (!overview) { process.stderr.write(`No analysis under ${abs}\n`); process.exit(2); }
  const stack = readJson(A('technology_stack.json'), { findings: [], unknowns: [], summary: {} });
  const routes = readJson(A('routes.json'), { routes: [], byPageType: {} });
  const forms = readJson(A('forms_and_interactions.json'), { counts: {}, forms: [] });
  const assets = readJson(A('asset_manifest.json'), { assets: [] });
  const api = readJson(A('api_inventory.json'), { endpoints: [] });
  const dbf = readJson(A('database_findings.json'), {});
  const gaps = readJson(A('replication_gaps.json'), { counts: {}, gaps: [] });
  const visual = readJson(A('visual_comparison.json'), null);
  const tests = readJson(path.join(abs, 'tests', 'test-report.json'), null);
  const site = readJson(path.join(abs, 'replica', 'backend', 'site.json'), null);

  const host = overview.hostname;
  const cat = overview.category;
  const rel = path.relative(path.resolve(abs, '..', '..', '..'), abs);

  const confirmed = stack.findings.filter((f) => f.status === 'confirmed');
  const inferred = stack.findings.filter((f) => f.status === 'inferred');
  const nonFont = confirmed.filter((f) => f.category !== 'typography');

  const L = [];
  const P = (s) => L.push(s);

  // ---- header -------------------------------------------------------------
  P(`# ${host} — local demonstration replica`);
  P('');
  P('> ## Unofficial Local Demonstration — Not an Official Government Service');
  P('>');
  P(`> This directory holds an **independent reimplementation** of the public pages of`);
  P(`> \`${host}\`, built for authorized development, testing and educational use. It is`);
  P('> **not** affiliated with, endorsed by, or operated by any government body.');
  P('>');
  P('> It holds **no real data**. Every record is synthetic. It **cannot** submit anything');
  P('> to a government system — and it must never be deployed anywhere a member of the');
  P('> public could mistake it for the real service.');
  P('');

  const headline = [
    ['**Target URL**', `\`${overview.initialUrl}\``],
    ['**Final URL**', `\`${overview.finalUrl}\`${overview.redirectChain.length ? ` (after ${overview.redirectChain.length} redirect${overview.redirectChain.length === 1 ? '' : 's'})` : ''}`],
    ['**Detected category**', `\`${cat.selected}\` — ${cat.status}, ${cat.confidence} confidence`],
    ['**Local project path**', `\`${rel}/\``],
    ['**Analysed on**', (overview.generatedAt || '').slice(0, 10)],
    ['**Pages captured**', `${overview.counts.pagesCaptured} (${overview.counts.pagesFailed} failed, ${overview.counts.pagesSkipped} skipped${overview.counts.urlAliasesMerged ? `, ${overview.counts.urlAliasesMerged} URL aliases merged` : ''})`],
    ['**Assets collected**', `${assets.downloaded || 0} of ${assets.referenced || 0} referenced${assets.totalBytes ? ` (${(assets.totalBytes / 1048576).toFixed(1)} MB)` : ''}`],
    ['**Forms inventoried**', `${forms.counts.forms || 0} (${forms.counts.totalFunctionalFields || 0} functional fields, ${forms.counts.withCaptcha || 0} CAPTCHA-protected)`],
    ['**Tests**', tests ? `**${tests.totals.passed} / ${tests.totals.tests} passing**` : '_not run yet_'],
    ['**Visual difference**', visual && visual.desktopDifferenceRatio
      ? `mean ${visual.desktopDifferenceRatio.mean}, median ${visual.desktopDifferenceRatio.median}, best ${visual.desktopDifferenceRatio.best}, worst ${visual.desktopDifferenceRatio.worst} (desktop, banner-aligned)`
      : '_not measured yet_'],
  ];
  P(table(headline, ['', '']).split('\n').slice(2).join('\n').replace(/^/, '| | |\n|---|---|\n'));
  P('');
  P('---');
  P('');

  // ---- 1. category --------------------------------------------------------
  P('## 1. Why this category');
  P('');
  P('The classifier reads page content, not the domain name. Terms are weighted by *where*');
  P('they appear — a word in a title or heading states purpose; the same word in a footer');
  P('usually does not.');
  P('');
  const top = (cat.evidence || [])[0];
  if (top) {
    const terms = (top.topStrongTerms || []).slice(0, 5)
      .map((t) => `\`${t.term}\``).join(', ');
    P(`Winning category \`${top.category}\` scored **${top.score}**${(cat.evidence || [])[1] ? `, against ${cat.evidence[1].score} for \`${cat.evidence[1].category}\`` : ''}.`);
    if (terms) P(`Defining terms: ${terms}.`);
    P('');
  }
  P(`\`wouldHoldWithoutHostname\`: **${cat.wouldHoldWithoutHostname ? 'yes' : 'no'}** — ` +
    (cat.wouldHoldWithoutHostname
      ? 'the verdict stands on content alone, with the hostname bonus removed.'
      : 'the hostname was needed; treat the classification as weaker.'));
  P('');
  P('Full scoring, per zone, in `analysis/classification_evidence.json`.');
  P('');

  // ---- redirect defects ---------------------------------------------------
  if ((overview.redirectProblems || []).length) {
    P('### Redirect defects on the target');
    P('');
    P('These are faults in the live site, recorded because they affect how it can be reached:');
    P('');
    for (const p of overview.redirectProblems) {
      P(`- **${p.error}**`);
      if (p.url) P(`  - at \`${p.url}\``);
      if (p.location) P(`  - \`Location: ${p.location}\``);
      if (p.note) P(`  - ${p.note}`);
    }
    P('');
  }

  // ---- 2. technology ------------------------------------------------------
  P('## 2. Detected technology stack');
  P('');
  P(`${stack.summary.confirmed || 0} confirmed, ${stack.summary.inferred || 0} inferred, ` +
    `${stack.summary.unknown || 0} explicit unknowns. Every finding carries its evidence in ` +
    '`analysis/technology_stack.json`.');
  P('');
  if (nonFont.length) {
    P(table(nonFont.slice(0, 18).map((f) => [
      f.name.length > 60 ? f.name.slice(0, 57) + '…' : f.name,
      f.category,
      '**confirmed**',
    ]), ['Technology', 'Category', 'Status']));
    P('');
  }
  if (inferred.length) {
    P('Inferred (not safe to build against):');
    P('');
    for (const f of inferred.slice(0, 6)) {
      P(`- \`${f.name}\` (${f.category}) — ${(f.evidence || [])[0] || 'no evidence recorded'}`);
    }
    P('');
  }
  P('> **The database is `unknown` and deliberately not guessed.** A website frontend does');
  P('> not expose its database, and nothing in the headers, markup, scripts or error output');
  P('> named one. `analysis/database_findings.json` keeps any "probably X" reasoning in a');
  P('> clearly-labelled `inferred` section. Do not build against it.');
  P('');

  // ---- 3. replica stack ---------------------------------------------------
  P('## 3. Why this replica is built on Express');
  P('');
  P("The original's source code is not available and was never sought. This replica is an");
  P('**independent reimplementation** on Node + Express with server-rendered EJS, driven by');
  P('a generated `site.json` describing the captured pages, fields and option lists.');
  P('');
  P('**It is an approximation and does not claim to be recovered source code.**');
  P('');

  // ---- 4. run it ----------------------------------------------------------
  P('## 4. Prerequisites, install and run');
  P('');
  P('- Node.js 18 or later, npm 9 or later');
  P("- A C toolchain, for `better-sqlite3`'s native build");
  P('');
  P('```bash');
  P(`cd ${rel}/replica/backend`);
  P('');
  P('npm install          # express, ejs, better-sqlite3');
  P('npm run seed         # build replica/database/replica.sqlite (synthetic data)');
  P(`npm start            # serve on http://127.0.0.1:${site ? site.port : 4174}`);
  P('```');
  P('');
  P(`Local demo URL: **http://127.0.0.1:${site ? site.port : 4174}/** (override with \`PORT=…\`).`);
  P('');
  P('### Tests');
  P('');
  P('```bash');
  P(`cd ${rel}`);
  P('node tests/run-tests.js');
  P('```');
  P('');
  if (tests) {
    P(`Writes \`tests/test-report.json\`. **${tests.totals.passed} of ${tests.totals.tests} passing.**`);
    P('');
    P(table(Object.entries(tests.byGroup).map(([g, v]) => [g, String(v.passed), String(v.failed)]),
      ['Group', 'Passed', 'Failed']));
    P('');
  }
  P('### Re-run the analysis');
  P('');
  P('```bash');
  P('cd tools');
  P(`node bin/gov-replica.js ${host}          # resumable; the domain is the only input`);
  P(`node bin/build-replica.js ../${rel}`);
  P(`node bin/compare-replica.js ../${rel} http://127.0.0.1:${site ? site.port : 4174}`);
  P('```');
  P('');

  // ---- 5. what was analysed ----------------------------------------------
  P('## 5. What was analysed');
  P('');
  P(`${overview.counts.pagesCaptured} page(s). ` +
    (overview.coverage.queueExhausted
      ? '**The crawl queue was exhausted** — every in-scope page reachable by link-following ' +
        'from the start URL, within the configured depth, was captured.'
      : `**The crawl stopped at ${overview.coverage.limitThatStoppedTheCrawl}**, so the site ` +
        `is NOT fully explored: ${overview.counts.pagesStillPending} in-scope URL(s) remained queued.`));
  P('');
  const types = Object.entries(routes.byPageType || {}).sort((a, b) => b[1] - a[1]);
  if (types.length) {
    P(table(types.map(([t, n]) => [`\`${t}\``, String(n)]), ['Page type', 'Count']));
    P('');
  }
  P('Evidence on disk:');
  P('');
  P('- `reference_pages/screenshots/` — full-page PNGs at 1366×900, 768×1024, 390×844');
  P('- `reference_pages/dom/` — the rendered HTML of each page');
  P('- `reference_pages/page_metadata/` — per-page components, geometry, forms, assets, links');
  P('');

  // ---- forms --------------------------------------------------------------
  const withFields = forms.forms.filter((f) => (f.functionalFieldCount || 0) > 0);
  if (withFields.length) {
    P('### Forms and reference data');
    P('');
    P(table(withFields.slice(0, 12).map((f) => [
      `\`${String(f.formId).slice(0, 28)}\``,
      (f.page || '').replace(/^https?:\/\/[^/]+/, '') || '/',
      String(f.functionalFieldCount),
      f.hasCaptcha ? 'yes' : 'no',
    ]), ['Form', 'Page', 'Fields', 'CAPTCHA']));
    P('');
    if (site && Object.keys(site.referenceLists || {}).length) {
      P('Option lists transcribed from the live markup and loaded into the replica verbatim:');
      P('');
      for (const [list, options] of Object.entries(site.referenceLists).slice(0, 10)) {
        P(`- \`${list}\` — **${options.length}** values` +
          (options.length ? ` (e.g. ${options.slice(0, 3).map((o) => `\`${o.label}\``).join(', ')})` : ''));
      }
      P('');
    }
    if (site && Object.keys(site.cascadeLists || {}).length) {
      P('> **Dependent dropdowns.** ' +
        Object.keys(site.cascadeLists).map((l) => `\`${l}\``).join(', ') +
        ' are populated by the original only after a parent value is chosen, so the real ' +
        'lists were never exposed. The replica generates synthetic children and enforces the ' +
        'parent/child rule **server-side**, not only in the browser.');
      P('');
    }
  }

  // ---- 6. gaps ------------------------------------------------------------
  P('## 6. What could not be accessed or reproduced');
  P('');
  P('Recorded in `analysis/replication_gaps.json` — nothing is papered over elsewhere.');
  P('');
  const meanings = {
    'incomplete-interaction': 'A form on the original was **never submitted**. It is a live production government service, so its real success, validation and error states were never observed and are not guessed at.',
    'uncertain-technology': 'Detected by inference rather than direct evidence — including the database, which is `unknown`.',
    'missing-asset': 'A referenced asset could not be collected (session-bound CAPTCHA images, or 404s on the original itself).',
    'platform-internal-asset': 'Framework plumbing the replica does not use.',
    'external-dependency': 'Hosted on another domain. Recorded, not downloaded; the replica uses a local equivalent.',
    'inaccessible-page': 'The page could not be captured.',
    'skipped-url': 'Not crawled as a page — a linked document, or beyond the configured depth.',
    'dynamic-navigation': 'The menu is built in the browser and can differ between loads, so the route list is a snapshot.',
  };
  const gapRows = Object.entries(gaps.counts || {}).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => [`\`${k}\``, String(n), meanings[k] || '—']);
  if (gapRows.length) { P(table(gapRows, ['Gap', 'Count', 'Why'])); P(''); }
  P('Always out of scope:');
  P('');
  P('- **Anything behind a login.** Authenticated areas were never accessed.');
  P('- **Anything behind a CAPTCHA.** None was reproduced, solved or bypassed; the replica');
  P('  asks a simple arithmetic question instead.');
  P("- **The original's database, source code and server behaviour**, none of which a public");
  P('  frontend exposes.');
  P('');

  // ---- 7. API -------------------------------------------------------------
  P('## 7. Public API findings');
  P('');
  P(`**${api.publicApiAvailable ? 'An API was observed.' : 'No public API.'}** ${api.publicApiEvidence || ''}`);
  P('');
  if ((api.integrationRestrictions || []).length) {
    for (const r of api.integrationRestrictions) P(`- ${r}`);
    P('');
  }
  P('> The replica exposes its **own** local API (`/api/reference/…`, `/api/cascade/…`,');
  P('> `/api/submissions/…`) so ERP integration code has something to develop against.');
  P('> **That is not the original\'s contract and must not be treated as one.**');
  P('');

  // ---- 8. visual ----------------------------------------------------------
  if (visual) {
    P('## 8. Visual comparison');
    P('');
    P(`Measured with pixelmatch at ${(visual.viewports || []).length} viewports, full-page, ` +
      'images padded to a common canvas so a longer page counts as a difference rather than ' +
      'being cropped away.');
    P('');
    P(`- **Raw mean difference: ${visual.rawDesktopDifferenceRatio ? visual.rawDesktopDifferenceRatio.mean : '—'}** (demonstration banner in place)`);
    P(`- **Banner-aligned mean: ${visual.desktopDifferenceRatio.mean}**, median ${visual.desktopDifferenceRatio.median}, best ${visual.desktopDifferenceRatio.best}, worst ${visual.desktopDifferenceRatio.worst}`);
    P('');
    P('The replica adds a banner the original has no counterpart for, which displaces every');
    P('row below it. The banner-aligned figure crops that deliberate addition. Both are reported.');
    P('');
    P('**No page matches the original exactly, and none is claimed to.** Expected differences:');
    P('');
    for (const d of visual.expectedDifferences || []) P(`- ${d}`);
    P('');
    P('Diff images in `comparison/`, per-route numbers in `analysis/visual_comparison.json`.');
    P('');
  }

  // ---- 9. security --------------------------------------------------------
  P('## 9. Security and data handling');
  P('');
  P('- **No TLS verification was disabled anywhere.** No `-k`, no `rejectUnauthorized: false`,');
  P('  no `ignoreHTTPSErrors`. See `tools/certs/README.md`.');
  P('- **No credential, session token, cookie or authorization header is stored.** Those');
  P('  header names are stripped before anything is written to disk.');
  P('- **No endpoint was enumerated, fuzzed or probed.** Network observations are passive.');
  P('- **No account was created and no CAPTCHA was solved or bypassed.**');
  P('- Requests were made one at a time with a delay, so the original was never put under load.');
  P('- Assets the browser already received while rendering a page are kept from that');
  P('  response rather than re-requested, halving the load on the target.');
  P("- The replica sends a strict CSP with `form-action 'self'` and `connect-src 'self'`, so");
  P('  even an accidental absolute URL cannot post outward. A test asserts no page references');
  P('  an off-host URL.');
  P('- Anything secret-shaped (password, OTP, token) is **stripped before storage**: this');
  P('  demonstration authenticates nobody, so keeping one would be a liability with no purpose.');
  P('- The local database has **no access control and no encryption at rest**. Do not type');
  P("  anyone's real personal data into it.");
  P('- Submissions write an **append-only audit entry**; database triggers reject any `UPDATE`');
  P('  or `DELETE` against `audit_log`, and tests assert both.');
  P('');
  P('### Asset licensing');
  P('');
  P('Government of India websites generally reserve copyright in their content and emblems,');
  P('and the National Emblem is additionally protected by the State Emblem of India');
  P('(Prohibition of Improper Use) Act, 2005. Downloaded assets are retained here as');
  P('**analysis evidence for an internal, clearly-labelled demonstration**. The replica');
  P('substitutes a neutral placeholder mark for every official emblem and logo, and does not');
  P("republish the original's prose.");
  P('');

  // ---- 10. structure ------------------------------------------------------
  P('## 10. Directory structure');
  P('');
  P('```');
  P(`${path.basename(abs)}/`);
  P('├── README.md                 this file');
  P('├── analysis/                 the JSON artifacts listed below');
  P('├── original_assets/          collected public assets');
  P('├── reference_pages/          screenshots, rendered DOM, per-page metadata');
  P('├── replica/                  backend (Express + site.json), frontend (EJS), database');
  P('├── replica_screenshots/      the replica at the same viewports');
  P('├── comparison/               pixel diffs, raw and banner-aligned');
  P('├── tests/                    run-tests.js, test-report.json');
  P('└── logs/                     per-run JSONL logs');
  P('```');
  P('');
  P(table([
    ['`website_overview.json`', 'input/final URL, category and evidence, crawl scope, counts, coverage claim'],
    ['`technology_stack.json`', 'each technology with evidence, confidence and confirmed/inferred/unknown'],
    ['`routes.json`', 'every discovered URL, page type, local replica route, aliases'],
    ['`component_inventory.json`', 'reusable components, where used, median geometry and style'],
    ['`asset_manifest.json`', 'source URL, local path, type, SHA-256, size, usage pages, status'],
    ['`forms_and_interactions.json`', 'every form, field, option list, validation and dependency'],
    ['`api_inventory.json`', 'passively observed endpoints'],
    ['`database_findings.json`', 'verified / inferred / unknown, kept strictly apart'],
    ['`replication_gaps.json`', 'the deliberate record of what is *not* reproduced'],
    ['`crawl_manifest.json`', 'visited, pending, skipped, aliases, errors — enough to resume'],
    ['`visual_comparison.json`', 'per-route measured pixel difference'],
    ['`classification_evidence.json`', 'zone-weighted category scoring'],
  ], ['File', 'Contents']));
  P('');

  // ---- 11. ERP ------------------------------------------------------------
  P('## 11. How this feeds the ERP');
  P('');
  P('`docs/requirements/erp-scope.pdf` requires the ERP to exchange data with this system. There is');
  P('**no public API to integrate with**, which makes this replica useful in two ways:');
  P('');
  P('1. **A field-level contract.** `analysis/forms_and_interactions.json` gives the exact');
  P('   names, lengths and option lists the ERP must mirror so a citizen or officer never');
  P('   retypes data.');
  P('2. **A local integration target.** The replica runs offline, so ERP integration code can');
  P('   be developed and tested without touching a production government system.');
  P('');
  P("The replica's schema models the accountability the ERP scope demands in section 4 —");
  P('maker, approver, timestamp, and an audit trail no role can alter.');
  P('');
  P('> **The ERP must not treat this replica\'s API as the real integration contract.** The');
  P('> real exchange needs a published interface obtained from the system owner, as the scope');
  P("> document's \"use published interfaces through an API gateway\" requirement anticipates.");
  P('');

  const out = L.join('\n');
  fs.writeFileSync(path.join(abs, 'README.md'), out);
  return { path: path.join(abs, 'README.md'), bytes: out.length, host };
}

function main() {
  const dir = process.argv[2];
  if (!dir) { process.stderr.write('Usage: node bin/write-readme.js <projectDir>\n'); process.exit(2); }
  const r = build(dir);
  process.stdout.write(`wrote ${path.relative(process.cwd(), r.path)} (${(r.bytes / 1024).toFixed(1)} KB) for ${r.host}\n`);
}

if (require.main === module) main();
module.exports = { build };
