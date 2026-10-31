#!/usr/bin/env node
'use strict';

/**
 * Stage I runner: compare the running replica against the captured reference.
 *
 *   node bin/compare-replica.js <projectDir> [baseUrl]
 */

const fs = require('fs');
const path = require('path');
const { captureReplica, compareOne } = require('../lib/compare');
const { viewports, visualTolerance } = require('../lib/config');
const { writeJson, makeLogger } = require('../lib/project');

/**
 * Differences the replica is *meant* to have. Recorded, never hidden: they are
 * listed in the report so a reader can see what the score includes.
 */
const EXPECTED_DIFFERENCES = [
  'A demonstration banner runs across the top of every replica page. The original has ' +
  'no such banner, so every page differs by that strip and everything below it is ' +
  'displaced downwards.',
  'The official NPIP wordmark, the National Emblem and the NIC logo are replaced by a ' +
  'neutral placeholder mark, deliberately, so the replica cannot be mistaken for the ' +
  'official service.',
  'The home page hero on the original is a photographic carousel. The replica uses a ' +
  'flat gradient: the photograph is government material that is not ours to redistribute.',
  'Figures differ because the replica reports its own synthetic database, not the ' +
  'original\'s live statistics.',
  'The original renders its select controls through the Chosen jQuery widget. The replica ' +
  'uses native selects, which the browser paints differently.',
];

async function main() {
  const projectDir = process.argv[2];
  const baseUrl = (process.argv[3] && !process.argv[3].startsWith('--')) ? process.argv[3] : 'http://127.0.0.1:4173';
  const reuseShots = process.argv.includes('--reuse-shots');
  if (!projectDir) {
    process.stderr.write('Usage: node bin/compare-replica.js <projectDir> [baseUrl]\n');
    process.exit(2);
  }
  const abs = path.resolve(projectDir);
  const routesFile = path.join(abs, 'analysis', 'routes.json');
  if (!fs.existsSync(routesFile)) {
    process.stderr.write(`No routes.json under ${abs}. Run the analysis pipeline first.\n`);
    process.exit(2);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const logger = makeLogger(abs, `compare-${runId}`);
  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8')).routes
    .filter((r) => r.localReplicaRoute && r.crawlStatus === 'captured');

  process.stdout.write(`Comparing ${routes.length} route(s) against ${baseUrl}\n`);

  const outDir = path.join(abs, 'replica_screenshots');
  const { captured, consoleIssues, failedRequests } =
    await captureReplica({ baseUrl, routes, outDir, logger, reuseShots });

  const byRoute = [];
  for (const r of routes) {
    const cap = captured.find((c) => c.slug === r.slug) || {};
    const perViewport = {};
    // The demonstration banner is an addition the original has no counterpart
    // for; its height is measured so the comparison can report both the raw
    // difference and the difference with that offset aligned out.
    const bannerH = (cap.geometry && cap.geometry.demoBanner) ? cap.geometry.demoBanner.h : 0;
    for (const vp of viewports) {
      const reference = path.join(abs, 'reference_pages', 'screenshots', `${r.slug}.${vp.name}.png`);
      const replica = path.join(outDir, `${r.slug}.${vp.name}.png`);
      const diff = path.join(abs, 'comparison', `${r.slug}.${vp.name}.diff.png`);
      const res = compareOne(reference, replica, diff, bannerH);
      perViewport[vp.name] = res.comparable ? {
        ...res,
        referenceImage: path.relative(abs, reference),
        replicaImage: path.relative(abs, replica),
        diffImage: path.relative(abs, diff),
        withinTolerance: res.differenceRatio <= visualTolerance,
      } : res;
    }
    const desktop = perViewport.desktop;
    byRoute.push({
      slug: r.slug,
      demoBannerHeightPx: bannerH,
      route: r.localReplicaRoute,
      originalUrl: r.finalUrl || r.url,
      pageType: r.pageType,
      replicaStatus: cap.status || null,
      replicaError: cap.error || null,
      geometry: cap.geometry || null,
      consoleIssues: consoleIssues[r.slug] || [],
      failedRequests: failedRequests[r.slug] || [],
      viewports: perViewport,
      desktopDifferenceRatio: desktop && desktop.comparable ? desktop.differenceRatio : null,
      desktopRawDifferenceRatio: desktop && desktop.comparable ? desktop.raw.differenceRatio : null,
    });
  }

  const comparable = byRoute.filter((r) => r.desktopDifferenceRatio != null);
  const ratios = comparable.map((r) => r.desktopDifferenceRatio).sort((a, b) => a - b);
  const mean = ratios.length ? ratios.reduce((s, n) => s + n, 0) / ratios.length : null;
  const median = ratios.length ? ratios[Math.floor(ratios.length / 2)] : null;
  const rawRatios = comparable.map((r) => r.desktopRawDifferenceRatio).sort((a, b) => a - b);
  const rawMean = rawRatios.length ? rawRatios.reduce((s, n) => s + n, 0) / rawRatios.length : null;

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    method:
      'Each replica route was rendered in Chromium at the same three viewports used for the ' +
      'reference capture, screenshotted full-page, and compared pixel by pixel with ' +
      'pixelmatch (threshold 0.18, anti-aliasing ignored). Images of differing height are ' +
      'padded to a common canvas, so a longer or shorter page counts as a difference rather ' +
      'than being cropped away. Comparison height is capped at 6000px.',
    viewports,
    tolerance: visualTolerance,
    counts: {
      routesCompared: byRoute.length,
      comparable: comparable.length,
      withinTolerance: comparable.filter((r) => r.viewports.desktop.withinTolerance).length,
      outsideTolerance: comparable.filter((r) => !r.viewports.desktop.withinTolerance).length,
      replicaRoutesWithConsoleErrors: byRoute.filter((r) =>
        r.consoleIssues.some((c) => c.type === 'error' || c.type === 'pageerror')).length,
      replicaRoutesWithFailedRequests: byRoute.filter((r) => r.failedRequests.length).length,
    },
    rawDesktopDifferenceRatio: {
      mean: rawMean == null ? null : Number(rawMean.toFixed(4)),
      note: 'Measured with the replica\'s demonstration banner left in place, so every row ' +
            'below it is displaced relative to the original. Reported for completeness; the ' +
            'banner-aligned figure below is the better measure of layout fidelity.',
    },
    desktopDifferenceRatio: {
      mean: mean == null ? null : Number(mean.toFixed(4)),
      median: median == null ? null : Number(median.toFixed(4)),
      best: ratios.length ? ratios[0] : null,
      worst: ratios.length ? ratios[ratios.length - 1] : null,
    },
    expectedDifferences: EXPECTED_DIFFERENCES,
    honesty:
      'These are measured pixel ratios from the images in reference_pages/screenshots/ and ' +
      'replica_screenshots/, with the diffs in comparison/. No similarity figure in this ' +
      'project is asserted without one of these measurements behind it, and no page is ' +
      'claimed to match the original exactly.',
    routes: byRoute,
  };

  writeJson(abs, 'analysis/visual_comparison.json', report);
  await logger.close();

  process.stdout.write(`\n=== visual comparison ===\n`);
  process.stdout.write(`compared:        ${report.counts.comparable} route(s) at desktop\n`);
  process.stdout.write(`within ${(visualTolerance * 100).toFixed(0)}% tolerance: ${report.counts.withinTolerance}\n`);
  process.stdout.write(`outside:         ${report.counts.outsideTolerance}\n`);
  process.stdout.write(`raw difference mean ${report.rawDesktopDifferenceRatio.mean} (banner in place)\n`);
  process.stdout.write(`banner-aligned mean ${report.desktopDifferenceRatio.mean}, ` +
    `median ${report.desktopDifferenceRatio.median}, ` +
    `best ${report.desktopDifferenceRatio.best}, worst ${report.desktopDifferenceRatio.worst}\n`);
  process.stdout.write(`console errors:  ${report.counts.replicaRoutesWithConsoleErrors} route(s)\n`);
  process.stdout.write(`failed requests: ${report.counts.replicaRoutesWithFailedRequests} route(s)\n\n`);

  const worst = comparable.slice().sort((a, b) => b.desktopDifferenceRatio - a.desktopDifferenceRatio).slice(0, 8);
  process.stdout.write('largest differences (desktop):\n');
  for (const r of worst) {
    process.stdout.write(`  ${String(r.desktopDifferenceRatio).padStart(6)}  ${r.route}\n`);
  }
}

main().catch((e) => {
  process.stderr.write(`\nComparison failed: ${e && e.stack ? e.stack : e}\n`);
  process.exit(1);
});
