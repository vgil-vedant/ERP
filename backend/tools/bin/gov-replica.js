#!/usr/bin/env node
'use strict';

/**
 * AI-Powered Government Website Explorer, Analyzer & Local Replica Generator.
 *
 * The only required input is a domain or URL:
 *
 *     node bin/gov-replica.js eprisons.nic.in
 *
 * Everything else -- category, output directory, crawl settings, stack choice --
 * is determined by the pipeline (spec sections 1 and 2).
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { limits, viewports, userAgent, replicaRoot } = require('../lib/config');
const { normalizeInput, InputError } = require('../lib/normalize');
const { classify } = require('../lib/classify');
const { inspectWorkspace, initProject, writeJson, readJson, makeLogger } = require('../lib/project');
const { crawl } = require('../lib/crawl');
const { EXTRACTOR } = require('../lib/extract');
const { detectStack } = require('../lib/stack');
const { collectAssets } = require('../lib/assets');
const analyze = require('../lib/analyze');

const STAGES = ['probe', 'classify', 'crawl', 'stack', 'assets', 'analyze'];

function parseArgs(argv) {
  const opts = { domain: null, only: null, resume: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') { opts.only = (argv[++i] || '').split(','); continue; }
    if (a === '--no-resume') { opts.resume = false; continue; }
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (a.startsWith('-')) { throw new Error(`Unknown option: ${a}`); }
    if (!opts.domain) opts.domain = a;
  }
  return opts;
}

const USAGE = `
AI-Powered Government Website Explorer, Analyzer & Local Replica Generator

Usage:
  node bin/gov-replica.js <domain> [options]

Arguments:
  <domain>        The only required input. e.g. eprisons.nic.in
                  or https://eprisons.nic.in/ or https://example.gov.in/portal

Options:
  --only <list>   Run only these stages (comma separated):
                  ${STAGES.join(', ')}
  --no-resume     Ignore any existing crawl manifest and start fresh.
  -h, --help      Show this message.

The pipeline determines the category and output directory itself. Output goes to
gov_replica/<Category>/<normalized_hostname>/.
`;

/**
 * A short probe crawl whose only job is to give the classifier enough content
 * to judge the site's purpose before any directory is created (spec section 3:
 * "Verify the website's purpose before choosing a category").
 */
async function probeForClassification(startUrl, rootHost) {
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--disable-gpu'] });
  const context = await browser.newContext({
    userAgent, viewport: { width: viewports[0].width, height: viewports[0].height }, locale: 'en-IN',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(limits.navTimeoutMs);

  const samples = [];
  const seen = new Set();
  const queue = [startUrl];
  const PROBE_PAGES = 4;

  while (queue.length && samples.length < PROBE_PAGES) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: limits.navTimeoutMs });
      try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch { /* fine */ }
      const d = await page.evaluate(EXTRACTOR);
      samples.push({
        url: page.url(), title: d.title, description: d.description, keywords: d.keywords,
        headings: d.headings.map((h) => h.text), navLabels: d.navLabels, text: d.text,
      });
      // Follow a couple of in-scope links to broaden the content sample.
      for (const l of d.links) {
        if (samples.length + queue.length >= PROBE_PAGES + 2) break;
        if (l.kind !== 'navigational' || !l.href) continue;
        try {
          const h = new URL(l.href);
          const bare = rootHost.replace(/^www\./, '');
          if (!(h.hostname === rootHost || h.hostname.endsWith(`.${bare}`) || h.hostname === bare)) continue;
          if (/\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?)$/i.test(h.pathname)) continue;
        } catch { continue; }
        if (!seen.has(l.href)) queue.push(l.href);
      }
      await new Promise((r) => setTimeout(r, limits.perRequestDelayMs));
    } catch (e) {
      samples.push({ url, title: '', description: '', keywords: '', headings: [], navLabels: [],
                     text: '', error: e.message.split('\n')[0] });
    }
  }

  await context.close();
  await browser.close();
  return samples;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}`);
    process.exit(2);
  }
  if (opts.help || !opts.domain) {
    process.stdout.write(USAGE);
    process.exit(opts.domain ? 0 : 2);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  if (opts.only) {
    const unknown = opts.only.filter((s) => !STAGES.includes(s));
    if (unknown.length) {
      process.stderr.write(`Unknown stage(s): ${unknown.join(', ')}\nKnown stages: ${STAGES.join(', ')}\n`);
      process.exit(2);
    }
    // Stage selection is not implemented: the later stages all consume the
    // crawl's output, so running them in isolation would need the crawl anyway.
    // Say so rather than appearing to honour the flag.
    process.stderr.write(
      'Note: --only is not implemented. Every stage after the crawl consumes its output, ' +
      'so the full pipeline runs. Re-running is cheap: captured pages are resumed from disk.\n\n');
  }

  process.stdout.write(`\n=== gov-replica pipeline ===\ninput: ${opts.domain}\nrun:   ${runId}\n\n`);

  // ---- Stage A.1: validate and normalize --------------------------------
  process.stdout.write('[1/8] Validating and normalizing input...\n');
  let normalized;
  try {
    normalized = await normalizeInput(opts.domain);
  } catch (e) {
    if (e instanceof InputError) {
      process.stderr.write(`\nInput problem: ${e.message}\n`);
      if (e.correction) process.stderr.write(`What to do:    ${e.correction}\n`);
      process.exit(2);
    }
    throw e;
  }
  process.stdout.write(`      initial: ${normalized.initialUrl}\n`);
  process.stdout.write(`      final:   ${normalized.finalUrl} (HTTP ${normalized.status})\n`);
  if (normalized.redirects.length) {
    process.stdout.write(`      redirects: ${normalized.redirects.length}\n`);
  }
  for (const p of normalized.redirectProblems || []) {
    process.stdout.write(`      ! redirect defect on the target: ${p.error}\n`);
    if (p.location) process.stdout.write(`        ${p.url}\n          -> Location: ${p.location}\n`);
  }
  if (normalized.recoveredFromBrokenRedirect) {
    process.stdout.write(`      recovered: using the last URL that responded\n`);
  }
  process.stdout.write(`      host:    ${normalized.hostname} -> ${normalized.normalizedHostname}\n`);

  // ---- Stage A.2: inspect workspace ------------------------------------
  process.stdout.write('[2/8] Inspecting workspace...\n');
  const workspace = inspectWorkspace();
  const existingProjects = Object.entries(workspace.categories || {})
    .flatMap(([c, v]) => v.projects.map((p) => `${c}/${p}`));
  process.stdout.write(`      gov_replica/ ${workspace.replicaRootExists ? 'exists' : 'will be created'}`);
  process.stdout.write(existingProjects.length ? `, ${existingProjects.length} existing project(s)\n` : ', no existing projects\n');

  // ---- Stage A.3: classify by content ----------------------------------
  process.stdout.write('[3/8] Investigating the site to classify its purpose...\n');
  const probeSamples = await probeForClassification(normalized.finalUrl, normalized.hostname);
  const classification = classify({ hostname: normalized.hostname, pages: probeSamples });
  process.stdout.write(`      sampled ${probeSamples.length} page(s)\n`);
  process.stdout.write(`      category: ${classification.category} ` +
    `(${classification.status}, confidence ${classification.confidence})\n`);
  const top = classification.ranking[0];
  process.stdout.write(`      top terms: ${top.hits.strong.slice(0, 5).map((h) => `"${h.term}"x${h.occurrences}`).join(', ') || '(none)'}\n`);
  process.stdout.write(`      holds without hostname: ${classification.wouldHoldWithoutHostname ? 'yes' : 'NO'}\n`);

  // ---- Stage A.4: create the project ----------------------------------
  const { projectDir, resumed } = initProject({
    category: classification.category,
    normalizedHostname: normalized.normalizedHostname,
  });
  const rel = path.relative(process.cwd(), projectDir);
  process.stdout.write(`[4/8] Project directory ${resumed ? '(resumed)' : '(created)'}: ${rel}\n`);

  const logger = makeLogger(projectDir, runId);
  logger.info('init', 'pipeline start', { input: opts.domain, normalized, category: classification.category });

  writeJson(projectDir, 'analysis/classification_evidence.json', {
    generatedAt: new Date().toISOString(),
    ...classification,
    samplesUsed: probeSamples.map((s) => ({
      url: s.url, title: s.title, headingCount: s.headings.length,
      navLabelCount: s.navLabels.length, textLength: (s.text || '').length, error: s.error || null,
    })),
    note: 'Classification is driven by page content. `wouldHoldWithoutHostname` records whether ' +
          'the same verdict is reached from content alone, with the hostname bonus removed.',
  });

  // ---- Stage B: crawl ---------------------------------------------------
  process.stdout.write('[5/8] Exploring the website...\n');
  const prior = opts.resume ? readJson(projectDir, 'analysis/crawl_manifest.json') : null;
  if (prior) process.stdout.write(`      found a previous manifest (${Object.keys(prior.visited || {}).length} pages)\n`);

  const crawlResult = await crawl({
    startUrl: normalized.finalUrl,
    rootHost: normalized.hostname,
    projectDir,
    logger,
    resumeState: prior,
  });
  const captured = crawlResult.pages.filter((p) => p.crawlStatus === 'captured');
  process.stdout.write(`      captured ${captured.length} page(s) in ${Math.round(crawlResult.durationMs / 1000)}s` +
    `${crawlResult.limitHit ? `, stopped at ${crawlResult.limitHit}` : ', queue exhausted'}\n`);
  if ((crawlResult.aliases || []).length) {
    process.stdout.write(`      ${crawlResult.aliases.length} URL alias(es) merged (case / .aspx spellings of the same page)\n`);
  }
  if (crawlResult.errors.length) process.stdout.write(`      ${crawlResult.errors.length} error(s)\n`);
  if (crawlResult.throttledHits) {
    process.stdout.write(`      backed off ${crawlResult.throttledHits} time(s) after a throttling response\n`);
  }

  // ---- Stage C: stack ---------------------------------------------------
  process.stdout.write('[6/8] Detecting technology stack...\n');
  const stackReport = detectStack({ pages: captured, normalized });
  process.stdout.write(`      ${stackReport.summary.confirmed} confirmed, ` +
    `${stackReport.summary.inferred} inferred, ${stackReport.summary.unknown} explicit unknown(s)\n`);
  for (const f of stackReport.findings.filter((x) => x.status === 'confirmed').slice(0, 8)) {
    process.stdout.write(`        - ${f.name} (${f.category})\n`);
  }

  // ---- Stage D: assets --------------------------------------------------
  process.stdout.write('[7/8] Collecting public assets...\n');
  const assetSummary = await collectAssets({
    pages: captured, projectDir, rootHost: normalized.hostname, logger,
    capturedAssets: crawlResult.capturedAssets,
  });
  process.stdout.write(`      ${assetSummary.downloaded}/${assetSummary.referenced} downloaded ` +
    `(${(assetSummary.totalBytes / 1024).toFixed(0)} KB), ${assetSummary.failed} failed, ` +
    `${assetSummary.capturedFromPageRender} kept from the page render, ` +
    `${assetSummary.unavailableByDesign} session-scoped .axd, ` +
    `${assetSummary.skippedExternal} external skipped\n`);

  // ---- Stages E/F/G: analysis artifacts ---------------------------------
  process.stdout.write('[8/8] Writing analysis artifacts...\n');
  const routes = analyze.buildRoutes({ pages: crawlResult.pages, skipped: crawlResult.skipped, startUrl: normalized.finalUrl });
  const componentInventory = analyze.buildComponentInventory({ pages: captured });
  const formsReport = analyze.buildFormsReport({ pages: captured });
  const apiInventory = analyze.buildApiInventory({ pages: captured, rootHost: normalized.hostname });
  const databaseFindings = analyze.buildDatabaseFindings({ stackReport });
  const overview = analyze.buildWebsiteOverview({
    normalized, classification, crawlResult, stackReport, assetSummary, workspace,
  });
  const manifest = analyze.buildCrawlManifest({ normalized, crawlResult, runId });
  const gaps = analyze.buildReplicationGaps({ crawlResult, stackReport, assetSummary, formsReport, apiInventory });

  const written = [
    ['analysis/website_overview.json', overview],
    ['analysis/technology_stack.json', stackReport],
    ['analysis/routes.json', routes],
    ['analysis/component_inventory.json', componentInventory],
    ['analysis/asset_manifest.json', assetSummary],
    ['analysis/forms_and_interactions.json', formsReport],
    ['analysis/api_inventory.json', apiInventory],
    ['analysis/database_findings.json', databaseFindings],
    ['analysis/replication_gaps.json', gaps],
    ['analysis/crawl_manifest.json', manifest],
  ];
  for (const [p, data] of written) {
    const r = writeJson(projectDir, p, data);
    process.stdout.write(`      ${r.changed ? 'wrote' : 'unchanged'} ${p}${r.backup ? ' (previous kept)' : ''}\n`);
  }

  logger.info('done', 'analysis stages complete', {
    pages: captured.length, assets: assetSummary.downloaded,
  });
  await logger.close();

  // ---- Summary ----------------------------------------------------------
  process.stdout.write(`
=== analysis complete ===
category:        ${classification.category} (${classification.status}, ${classification.confidence} confidence)
project path:    ${projectDir}
input url:       ${normalized.initialUrl}
final url:       ${normalized.finalUrl}
pages discovered:${String(crawlResult.pages.length).padStart(4)}  (captured ${captured.length}, failed ${crawlResult.pages.length - captured.length}, skipped ${crawlResult.skipped.length}, ${(crawlResult.aliases || []).length} alias URLs merged)
forms found:     ${String(formsReport.counts.forms).padStart(4)}  (${formsReport.counts.totalVisibleFields} visible fields, ${formsReport.counts.withCaptcha} CAPTCHA-protected)
assets:          ${String(assetSummary.downloaded).padStart(4)}  downloaded of ${assetSummary.referenced} referenced
technologies:    ${String(stackReport.summary.confirmed).padStart(4)}  confirmed, ${stackReport.summary.inferred} inferred
coverage:        ${overview.coverage.claim}
log:             ${path.relative(process.cwd(), logger.file)}

Next: build the replica under ${path.relative(process.cwd(), path.join(projectDir, 'replica'))}
`);
}

main().catch((e) => {
  process.stderr.write(`\nPipeline failed: ${e && e.stack ? e.stack : e}\n`);
  process.exit(1);
});
