'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { viewports, visualTolerance, userAgent } = require('./config');

/**
 * Stage I: capture the replica at matching viewports and compare it with the
 * reference screenshots captured from the original.
 *
 * The score is a measured pixel-difference ratio, not an impression. Where the
 * replica deliberately differs -- a placeholder mark instead of the official
 * emblem, a demonstration banner the original does not have -- that is recorded
 * as an expected difference rather than quietly excluded.
 */

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

/** Pad both images to a common canvas so differing heights can be compared. */
function padTo(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  // White background, so padding does not read as a difference against a
  // white page.
  out.data.fill(0xff);
  PNG.bitblt(png, out, 0, 0, Math.min(png.width, width), Math.min(png.height, height), 0, 0);
  return out;
}

async function captureReplica({ baseUrl, routes, outDir, logger, reuseShots }) {
  fs.mkdirSync(outDir, { recursive: true });

  // Re-screenshotting hundreds of routes to re-measure the same build wastes
  // minutes. With reuseShots, a route whose images are all already on disk is
  // skipped; anything missing is still captured.
  const haveAll = (slug) => viewports.every(
    (vp) => fs.existsSync(path.join(outDir, `${slug}.${vp.name}.png`)));
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--disable-gpu'] });
  const context = await browser.newContext({
    userAgent, viewport: { width: viewports[0].width, height: viewports[0].height }, locale: 'en-IN',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const consoleIssues = {};
  const failedRequests = {};
  let currentSlug = null;
  page.on('console', (m) => {
    if (!currentSlug || (m.type() !== 'error' && m.type() !== 'warning')) return;
    (consoleIssues[currentSlug] = consoleIssues[currentSlug] || []).push({ type: m.type(), text: m.text().slice(0, 300) });
  });
  page.on('pageerror', (e) => {
    if (!currentSlug) return;
    (consoleIssues[currentSlug] = consoleIssues[currentSlug] || []).push({ type: 'pageerror', text: String(e.message).slice(0, 300) });
  });
  page.on('requestfailed', (r) => {
    if (!currentSlug) return;
    (failedRequests[currentSlug] = failedRequests[currentSlug] || []).push({
      url: r.url(), failure: (r.failure() && r.failure().errorText) || 'unknown',
    });
  });
  page.on('response', (r) => {
    if (!currentSlug || r.status() < 400) return;
    (failedRequests[currentSlug] = failedRequests[currentSlug] || []).push({
      url: r.url(), failure: `HTTP ${r.status()}`,
    });
  });

  // The demonstration banner is the same height on every page, so when shots
  // are reused one real page load is enough to measure it. Without this the
  // banner-aligned figure silently degrades to the raw one and gets reported
  // under the wrong name.
  let sharedGeometry = null;
  if (reuseShots && routes.length) {
    try {
      await page.goto(baseUrl.replace(/\/+$/, '') + routes[0].localReplicaRoute,
        { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(500);
      sharedGeometry = await page.evaluate(() => {
        const el = document.querySelector('.demo-banner');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { demoBanner: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
      });
      if (logger) logger.info('compare', `measured demo banner height for reused shots`, sharedGeometry);
    } catch (e) {
      if (logger) logger.warn('compare', 'could not measure the demo banner; the aligned figure will equal the raw one', { error: e.message.split('\n')[0] });
    }
  }

  const captured = [];
  let reused = 0;
  for (const r of routes) {
    if (reuseShots && haveAll(r.slug)) {
      const shots = {};
      for (const vp of viewports) shots[vp.name] = path.join(outDir, `${r.slug}.${vp.name}.png`);
      captured.push({ slug: r.slug, route: r.localReplicaRoute,
                      url: baseUrl.replace(/\/+$/, '') + r.localReplicaRoute,
                      shots, status: 200, reusedShots: true, geometry: sharedGeometry });
      reused++;
      continue;
    }
    currentSlug = r.slug;
    const target = baseUrl.replace(/\/+$/, '') + r.localReplicaRoute;
    const entry = { slug: r.slug, route: r.localReplicaRoute, url: target, shots: {}, status: null };
    try {
      const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
      entry.status = resp ? resp.status() : null;
      try { await page.waitForLoadState('networkidle', { timeout: 4000 }); } catch { /* fine */ }
      await page.waitForTimeout(700);
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(400);
        const file = path.join(outDir, `${r.slug}.${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        entry.shots[vp.name] = file;
      }
      await page.setViewportSize({ width: viewports[0].width, height: viewports[0].height });
      // Geometry of the replica's own key components, for the measured comparison.
      entry.geometry = await page.evaluate(() => {
        const g = {};
        const take = (key, sel) => {
          const el = document.querySelector(sel);
          if (!el) { g[key] = null; return; }
          const r = el.getBoundingClientRect();
          g[key] = { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
        };
        take('header', 'header.site-header, header.spa-header');
        take('nav', '.primary-nav, .spa-nav');
        take('main', 'main');
        take('footer', 'footer.site-footer, footer.spa-footer');
        take('firstForm', 'form');
        take('firstTable', 'table.data');
        take('demoBanner', '.demo-banner');
        take('pageTitleBar', '.page-title-bar');
        g.document = { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight };
        return g;
      });
    } catch (e) {
      entry.error = e.message.split('\n')[0];
      if (logger) logger.warn('compare', `replica capture failed: ${target}`, { error: entry.error });
    }
    captured.push(entry);
  }
  currentSlug = null;
  await context.close();
  await browser.close();
  if (reused && logger) logger.info('compare', `reused ${reused} existing screenshot set(s)`);
  return { captured, consoleIssues, failedRequests, reused };
}

/**
 * Crop `rows` pixels off the top of a PNG.
 *
 * The replica carries a demonstration banner that the original has no
 * equivalent of. Left in, it displaces every row below it, and a full-page
 * pixel diff then reports a large difference for a page that is actually well
 * aligned. Cropping it is not hiding the difference -- the uncropped ratio is
 * reported alongside -- it just separates "we deliberately added a banner"
 * from "the layout underneath is wrong".
 */
function cropTop(png, rows) {
  if (!rows || rows <= 0 || rows >= png.height) return png;
  const out = new PNG({ width: png.width, height: png.height - rows });
  PNG.bitblt(png, out, 0, rows, png.width, png.height - rows, 0, 0);
  return out;
}

/**
 * Diffing is the memory-hungry part: each padded canvas is width x height x 4
 * bytes, so a 1366x6000 page costs ~33MB and one comparison holds three of
 * them. Across hundreds of routes that was enough to get the process OOM-killed
 * (uidai.gov.in, 249 routes, SIGKILL). Capping the canvas and writing a diff
 * image only when it is worth looking at keeps it bounded.
 */
const MAX_DIFF_HEIGHT = Number(process.env.GOVREPLICA_DIFF_HEIGHT) || 2200;

function diffPair(a, b, diffFile) {
  const width = Math.max(a.width, b.width);
  const height = Math.min(Math.max(a.height, b.height), MAX_DIFF_HEIGHT);
  const pa = padTo(a, width, height);
  const pb = padTo(b, width, height);
  const diff = new PNG({ width, height });
  const differing = pixelmatch(pa.data, pb.data, diff.data, width, height, {
    threshold: 0.18, includeAA: false,
  });
  const total = width * height;
  const ratio = differing / total;
  // Writing a near-empty diff for every route costs far more than it tells
  // anyone. Keep the ones that show a real difference.
  let written = null;
  if (diffFile && ratio >= 0.02) {
    fs.mkdirSync(path.dirname(diffFile), { recursive: true });
    fs.writeFileSync(diffFile, PNG.sync.write(diff));
    written = diffFile;
  }
  return { differing, total, ratio: Number(ratio.toFixed(4)), width, height, diffImage: written };
}

function compareOne(referenceFile, replicaFile, diffFile, bannerHeight) {
  if (!fs.existsSync(referenceFile) || !fs.existsSync(replicaFile)) {
    return { comparable: false, reason: !fs.existsSync(referenceFile)
      ? 'no reference screenshot' : 'no replica screenshot' };
  }
  let a, b;
  try { a = readPng(referenceFile); b = readPng(replicaFile); } catch (e) {
    return { comparable: false, reason: `could not read PNG: ${e.message}` };
  }
  // Raw: exactly as the two pages render, banner included. No image kept for
  // this one -- the banner-aligned diff below is the one worth looking at.
  const raw = diffPair(a, b, null);
  // Drop the decoded source pixels we no longer need before building the
  // aligned pair. Without this the retained buffers add up across hundreds of
  // routes and the process gets OOM-killed.
  const aSize = { w: a.width, h: a.height };
  const bSize = { w: b.width, h: b.height };

  // Banner-aligned: the replica's demonstration banner cropped off, so the
  // comparison reflects the layout rather than the deliberate addition.
  let aligned = null;
  if (bannerHeight > 0) {
    let bCropped = cropTop(b, bannerHeight);
    aligned = diffPair(a, bCropped, diffFile.replace(/\.png$/, '.aligned.png'));
    bCropped = null;
  }
  a.data = null; b.data = null;   // release the decoded pixels

  const headline = aligned || raw;
  return {
    comparable: true,
    width: raw.width, height: raw.height,
    referenceSize: { w: aSize.w, h: aSize.h },
    replicaSize: { w: bSize.w, h: bSize.h },
    bannerHeightPx: bannerHeight || 0,
    heightDeltaPx: bSize.h - aSize.h,
    heightDeltaExcludingBanner: (bSize.h - (bannerHeight || 0)) - aSize.h,
    raw: {
      differingPixels: raw.differing,
      totalPixels: raw.total,
      differenceRatio: raw.ratio,
      diffImage: null,
    },
    bannerAligned: aligned ? {
      differingPixels: aligned.differing,
      totalPixels: aligned.total,
      differenceRatio: aligned.ratio,
      diffImage: aligned.diffImage,
    } : null,
    // The headline figure is the banner-aligned one where available.
    differenceRatio: headline.ratio,
    similarity: Number((1 - headline.ratio).toFixed(4)),
    heightCapped: Math.max(aSize.h, bSize.h) > MAX_DIFF_HEIGHT,
  };
}

module.exports = { captureReplica, compareOne, visualTolerance };
