'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');
const { limits, viewports, userAgent } = require('./config');
const { EXTRACTOR } = require('./extract');

/**
 * Stage B: explore the accessible website, with a resumable crawl manifest
 * (spec section 6 stage B, section 10).
 *
 * Certificate verification stays on: `ignoreHTTPSErrors` is never set. See
 * certs/README.md for why that works here.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Canonical form for duplicate detection: drop fragment, sort query, lowercase host. */
function canonicalize(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return null; }
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();
  if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
    u.port = '';
  }
  // Work on the raw query text, never through URLSearchParams.
  //
  // Round-tripping a query through URLSearchParams re-encodes it: on
  // services.ecourts.gov.in, `?p=casestatus/index` comes back as
  // `?p=casestatus%2Findex`. That is a different string to the server, and we
  // would be requesting a URL the site never published. Dedupe must not alter
  // what we ask for, so pairs are split, filtered and sorted as text.
  const rawQuery = u.search.startsWith('?') ? u.search.slice(1) : u.search;
  const pairs = rawQuery
    ? rawQuery.split('&').filter(Boolean)
        .filter((p) => !/^(utm_|_ga|fbclid|gclid)/i.test(p.split('=')[0]))
        .sort()
    : [];
  u.search = pairs.length ? `?${pairs.join('&')}` : '';

  // A trailing slash on a directory-looking path is usually the same page --
  // but only when there is no query. `/app/?p=x` and `/app?p=x` are routed
  // differently by some servers, and this one is strict about it.
  if (!pairs.length && u.pathname.length > 1 && u.pathname.endsWith('/') &&
      !/\.[a-z0-9]+$/i.test(u.pathname)) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }
  return u.href;
}

/**
 * A case-folded, extension-neutral key for the same resource. IIS and ASP.NET
 * routing treat `/NPIP/public/Home`, `/npip/public/home` and `/Home.aspx` as
 * one page. Used only together with a content signature, so a genuinely
 * case-sensitive server never gets two different pages merged.
 */
function aliasKey(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return null; }
  const p = u.pathname.toLowerCase()
    .replace(/\.(aspx?|html?|jsp|php)$/, '')
    .replace(/\/(index|default|home)$/, '/')
    .replace(/\/+$/, '');
  return `${u.hostname.toLowerCase()}${p || '/'}?${u.search.toLowerCase()}`;
}

/**
 * Signature of what a page actually *is*. Two URLs with the same alias key and
 * the same signature are the same page reached by a different spelling.
 */
function contentSignature(data) {
  const formShape = (data.forms || [])
    .map((f) => `${f.method}:${(f.fields || []).map((x) => x.name || x.id || x.type).sort().join(',')}`)
    .sort().join('|');
  const text = (data.text || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  return crypto.createHash('sha1')
    .update([data.title || '', formShape, text].join('\u0000'))
    .digest('hex');
}

/** Is this URL inside the authorized scope (same registrable host)? */
function inScope(url, rootHost) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const h = u.hostname.toLowerCase();
  const root = rootHost.toLowerCase();
  // Same host, or a subdomain of the same registrable domain.
  const bare = root.replace(/^www\./, '');
  return h === root || h === bare || h === `www.${bare}` || h.endsWith(`.${bare}`);
}

const SKIP_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|csv|jpe?g|png|gif|svg|webp|ico|bmp|tiff?|mp[34]|avi|mov|wmv|woff2?|ttf|eot|otf|exe|msi|apk|rtf|odt|xml|json|txt)(\?|$)/i;

function urlToSlug(url, rootUrl) {
  let u;
  try { u = new URL(url); } catch { return 'invalid'; }
  let p = u.pathname.replace(/^\/+|\/+$/g, '') || 'index';
  let q = '';
  if (u.search) {
    q = '__' + crypto.createHash('sha1').update(u.search).digest('hex').slice(0, 8);
  }
  let slug = (p + q).replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  if (slug.length > 90) {
    slug = slug.slice(0, 74) + '_' + crypto.createHash('sha1').update(slug).digest('hex').slice(0, 10);
  }
  return slug.toLowerCase() || 'index';
}

/**
 * Ordered substring rules matched against the LAST path segment.
 *
 * Word boundaries are deliberately not used: these portals concatenate words in
 * a single segment (`contactus`, `grievancelogin`, `myvisitstatus`,
 * `termsofuse`), where `\bcontact\b` would never match. Order is significant --
 * the most specific segment wins, so `livestatus` is read as a statistics page
 * before the generic `status` rule can claim it.
 */
const SEGMENT_RULES = [
  [/livevisitorsstatus|livestatus/, 'statistics'],
  [/visitregistration/, 'visit-service'],
  [/visitstatus/, 'status-enquiry'],
  [/mulakat|appointment/, 'visit-service'],
  [/login|signin|sign-in|logon/, 'login'],
  [/registration|register|signup|enrol/, 'registration'],
  [/contact|feedback/, 'contact'],
  [/faq|help|manual|guide|download/, 'help'],
  [/privacy|terms|disclaimer|copyright|hyperlink|accessibility|codeofconduct|policy/, 'policy'],
  [/about/, 'about'],
  [/sitemap/, 'sitemap'],
  [/dashboard|statistic|lockupreport|selectmisstate/, 'statistics'],
  [/absconder|parolejumper|jumper/, 'listing'],
  [/grievance|complaint/, 'grievance'],
  [/status|enquiry|enquire|track/, 'status-enquiry'],
  [/search|locate/, 'search'],
  [/report/, 'statistics'],
];

function guessPageType(rec) {
  const raw = rec.finalUrl || rec.url || '';
  const title = (rec.title || '').toLowerCase();
  const status = rec.httpStatus;

  // An error page is decided by the status line, not by words in the body: a
  // genuine contact page may well contain the phrase "not found".
  if (typeof status === 'number' && status >= 400) return 'error';
  if (/^\s*(404|403|500)\b|file or directory not found|server error/.test(title)) return 'error';

  let pathname = '/';
  try { pathname = new URL(raw).pathname; } catch { /* keep default */ }
  const segments = pathname.toLowerCase()
    .replace(/\.(aspx?|html?|jsp|php)$/, '')
    .split('/')
    .filter(Boolean);
  const last = segments[segments.length - 1] || '';
  const isRootish = segments.length === 0 ||
    (segments.length <= 2 && /^(home|index|default)$/.test(last)) ||
    /^(home|index|default)$/.test(last);

  // The site root, or an explicit Home/Index/Default document.
  if (isRootish && (/home|welcome|portal/.test(title) || segments.length === 0)) {
    // A root-level dashboard application is still a statistics page.
    if (/dashboard/.test(pathname.toLowerCase())) return 'statistics';
    return 'home';
  }

  for (const [re, type] of SEGMENT_RULES) {
    if (re.test(last)) return type;
  }
  // Nothing in the last segment: let an earlier segment speak.
  const joined = segments.join('/');
  for (const [re, type] of SEGMENT_RULES) {
    if (re.test(joined)) return type;
  }

  const realFormFields = (rec.forms || [])
    .reduce((n, f) => n + (f.fields || []).filter((x) => x.visible).length, 0);
  if (realFormFields >= 4) return 'form';
  if ((rec.tables || []).some((t) => !t.isLayoutTable && t.rowCount > 2)) return 'listing';
  return 'content';
}

/**
 * Reach a client-side route the way a visitor does.
 *
 * A single-page application mounted at a sub-path (here a Create React App
 * build under /NPIPDashboard/) has no server-side file for its inner routes, so
 * IIS answers a direct request for one with 403 or 404. The route is real; it is
 * just rendered by the bundle after the shell has loaded. Loading the mount and
 * clicking the in-app link is what a browser does and what the application
 * expects -- it is not a bypass of anything.
 */
async function navigateViaSpa(page, mountUrl, targetUrl, settleMs) {
  await page.goto(mountUrl, { waitUntil: 'domcontentloaded', timeout: limits.navTimeoutMs });
  try { await page.waitForLoadState('networkidle', { timeout: settleMs }); } catch { /* fine */ }
  await new Promise((r) => setTimeout(r, 1200));

  const targetPath = new URL(targetUrl).pathname.replace(/\/+$/, '');
  const clicked = await page.evaluate((wanted) => {
    const norm = (h) => {
      try { return new URL(h, document.baseURI).pathname.replace(/\/+$/, ''); } catch { return null; }
    };
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      if (norm(a.getAttribute('href')) === wanted) { a.click(); return true; }
    }
    return false;
  }, targetPath);

  if (!clicked) return { ok: false, reason: 'no in-app link to this route was present on the mount page' };

  // Give the router and its data fetches time to resolve.
  try { await page.waitForFunction(
    (wanted) => location.pathname.replace(/\/+$/, '') === wanted,
    targetPath, { timeout: 12000 }
  ); } catch { /* router may normalise the path differently */ }
  try { await page.waitForLoadState('networkidle', { timeout: settleMs }); } catch { /* fine */ }
  await new Promise((r) => setTimeout(r, 1800));

  const landed = new URL(page.url()).pathname.replace(/\/+$/, '');
  return { ok: landed === targetPath, landedPath: landed, reason: landed === targetPath ? null : 'router did not settle on the requested path' };
}

async function crawl({ startUrl, rootHost, projectDir, logger, resumeState }) {
  const started = Date.now();
  const stage = 'crawl';

  const visited = new Map();   // canonical -> record
  const queue = [];
  const enqueued = new Set();
  const skipped = [];
  const errors = [];
  const networkByPage = new Map();
  // aliasKey -> { signature, canonical } for pages already captured.
  const byAlias = new Map();
  const aliasesFound = [];
  // Mount path -> mount URL for every single-page application found.
  const spaMounts = new Map();
  const spaRoutes = [];
  // Hosts a redirect tried to take us to, outside the authorized scope.
  const externalRedirects = new Map();
  let throttledHits = 0;

  const pushQueue = (url, depth, via) => {
    const c = canonicalize(url);
    if (!c) return;
    if (enqueued.has(c)) return;
    if (!inScope(c, rootHost)) return;
    // Already captured under a different spelling of the same path.
    const ak = aliasKey(c);
    if (ak && byAlias.has(ak)) {
      const prior = byAlias.get(ak);
      aliasesFound.push({ url: c, sameAs: prior.canonical, basis: 'alias key matched a captured page', via });
      const rec = visited.get(prior.canonical);
      if (rec) {
        rec.aliases = rec.aliases || [];
        if (!rec.aliases.includes(c)) rec.aliases.push(c);
      }
      enqueued.add(c);
      return;
    }
    if (SKIP_EXT.test(new URL(c).pathname + new URL(c).search)) {
      skipped.push({ url: c, reason: 'non-HTML resource (collected as an asset instead)', via });
      enqueued.add(c);
      return;
    }
    if (depth > limits.maxDepth) {
      skipped.push({ url: c, reason: `beyond maxDepth=${limits.maxDepth}`, via });
      enqueued.add(c);
      return;
    }
    enqueued.add(c);
    queue.push({ url: c, depth, via });
  };

  // Resume: keep pages already captured, re-queue what was pending.
  if (resumeState && resumeState.visited) {
    let restored = 0;
    let dropped = 0;
    for (const [c, summary] of Object.entries(resumeState.visited)) {
      // The manifest holds only a slim summary. The full record -- forms,
      // assets, components, headers, spaHints -- lives in the per-page
      // metadata file, and every later stage needs it. Resume from that file,
      // not from the summary, or stack detection and the asset collector see
      // an empty page and silently produce nothing.
      const metaPath = path.join(projectDir, 'reference_pages/page_metadata', `${summary.slug}.json`);
      if (!fs.existsSync(metaPath)) { dropped++; continue; }
      let full;
      try {
        full = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {
        logger.warn(stage, `could not re-read page metadata for ${summary.slug}; will re-crawl`, {
          error: e.message,
        });
        dropped++;
        continue;
      }
      if (!full || full.crawlStatus !== 'captured' || !Array.isArray(full.links)) {
        dropped++;
        continue;
      }
      full.resumedFromDisk = true;
      visited.set(c, full);
      enqueued.add(c);
      const ak = aliasKey(c);
      if (ak && full.contentSignature) byAlias.set(ak, { signature: full.contentSignature, canonical: c });
      // Re-register a resumed single-page application mount.
      if (full.spaHints && full.spaHints.reactRoot) {
        const u = new URL(full.finalUrl || full.url);
        const mountPath = (u.pathname.endsWith('/')
          ? u.pathname.slice(0, -1)
          : u.pathname.replace(/\/[^/]*$/, '')) || '';
        if (mountPath && !spaMounts.has(mountPath)) spaMounts.set(mountPath, full.finalUrl || full.url);
      }
      restored++;
    }
    logger.info(stage, `resumed ${restored} page(s) from disk` +
      (dropped ? `, ${dropped} incomplete record(s) will be re-crawled` : ''));
    process.stdout.write(`      resumed ${restored} page(s) from disk` +
      (dropped ? `, re-crawling ${dropped}\n` : '\n'));

    // Restoring pages is not enough: the frontier has to come back too.
    // Without this a resumed run has nothing to do -- every restored page is
    // already marked visited, the start URL among them -- so it reports the
    // queue as "exhausted" in zero seconds while in-scope URLs are still
    // waiting. Re-queue what was pending, and re-expand the links of every
    // page we restored, so raising the page limit actually crawls further.
    let requeued = 0;
    for (const url of resumeState.pending || []) {
      const before = queue.length;
      pushQueue(url, 1, 'pending from the previous run');
      if (queue.length > before) requeued++;
    }
    for (const rec of visited.values()) {
      for (const l of rec.links || []) {
        if (l.kind !== 'navigational' || !l.href) continue;
        if (!inScope(l.href, rootHost)) continue;
        const before = queue.length;
        pushQueue(l.href, (rec.depth || 0) + 1, rec.finalUrl || rec.url);
        if (queue.length > before) requeued++;
      }
    }
    if (requeued) {
      logger.info(stage, `re-queued ${requeued} URL(s) not yet captured`);
      process.stdout.write(`      re-queued ${requeued} URL(s) still to visit\n`);
    }
  }

  pushQueue(startUrl, 0, 'start URL');

  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--disable-gpu'],
  });
  const context = await browser.newContext({
    userAgent,
    viewport: { width: viewports[0].width, height: viewports[0].height },
    locale: 'en-IN',
    // Certificate errors are NOT ignored.
  });
  context.setDefaultTimeout(limits.navTimeoutMs);

  // Assets the browser receives while rendering a page are saved straight from
  // that response. The page has already been fetched legitimately, so there is
  // no reason to ask the server for each file a second time: it halves the
  // load we put on the target, and it works where a later bare request would
  // not -- services.ecourts.gov.in answers a standalone image request with
  // HTTP 405, while serving the same file perfectly to the page that needs it.
  const assetCacheDir = path.join(projectDir, 'logs', '.asset-cache');
  fs.mkdirSync(assetCacheDir, { recursive: true });
  const capturedAssets = new Map();   // url -> { file, contentType, bytes }
  let capturedBytes = 0;
  const CAPTURE_TYPES = new Set(['image', 'stylesheet', 'script', 'font']);
  const CAPTURE_BUDGET = 80 * 1024 * 1024;

  // Stage F: observe network traffic, recording no credentials or cookies.
  let currentPageKey = null;
  const SENSITIVE_HEADER = /^(cookie|set-cookie|authorization|x-csrf|x-xsrf|proxy-authorization)/i;
  context.on('response', async (resp) => {
    if (!currentPageKey) return;
    const req = resp.request();
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    const arr = networkByPage.get(currentPageKey) || [];
    if (arr.length > 250) return;
    const headers = resp.headers();
    const safeHeaders = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!SENSITIVE_HEADER.test(k)) safeHeaders[k] = v;
    }
    arr.push({
      url,
      method: req.method(),
      status: resp.status(),
      resourceType: req.resourceType(),
      contentType: headers['content-type'] || null,
      fromServiceWorker: resp.fromServiceWorker(),
      headers: safeHeaders,
      isXhr: req.resourceType() === 'xhr' || req.resourceType() === 'fetch',
      postDataPresent: !!req.postData(),
    });
    networkByPage.set(currentPageKey, arr);

    // Keep the bytes the page legitimately received.
    if (!CAPTURE_TYPES.has(req.resourceType())) return;
    if (resp.status() < 200 || resp.status() >= 300) return;
    if (capturedAssets.has(url) || capturedBytes > CAPTURE_BUDGET) return;
    if (!inScope(url, rootHost)) return;
    try {
      const buf = await resp.body();
      if (!buf || !buf.length || buf.length > limits.maxAssetBytes) return;
      const file = path.join(assetCacheDir,
        crypto.createHash('sha1').update(url).digest('hex') + '.bin');
      fs.writeFileSync(file, buf);
      capturedAssets.set(url, {
        file,
        contentType: (headers['content-type'] || '').split(';')[0] || null,
        bytes: buf.length,
        resourceType: req.resourceType(),
      });
      capturedBytes += buf.length;
    } catch {
      // A body can be gone by the time we ask (redirects, aborted requests).
      // The asset collector will fall back to requesting it.
    }
  });

  const page = await context.newPage();
  const consoleByPage = new Map();
  page.on('console', (m) => {
    if (!currentPageKey) return;
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const arr = consoleByPage.get(currentPageKey) || [];
    if (arr.length < 40) arr.push({ type: m.type(), text: m.text().slice(0, 400) });
    consoleByPage.set(currentPageKey, arr);
  });
  page.on('pageerror', (e) => {
    if (!currentPageKey) return;
    const arr = consoleByPage.get(currentPageKey) || [];
    if (arr.length < 40) arr.push({ type: 'pageerror', text: String(e.message).slice(0, 400) });
    consoleByPage.set(currentPageKey, arr);
  });

  const shotDir = path.join(projectDir, 'reference_pages/screenshots');
  const metaDir = path.join(projectDir, 'reference_pages/page_metadata');
  const domDir = path.join(projectDir, 'reference_pages/dom');

  let processed = 0;
  let limitHit = null;

  while (queue.length) {
    if (visited.size >= limits.maxPages) { limitHit = `maxPages=${limits.maxPages}`; break; }
    if (Date.now() - started > limits.maxTotalRuntimeMs) { limitHit = 'maxTotalRuntimeMs'; break; }

    const job = queue.shift();
    if (visited.has(job.url)) continue;

    const slug = urlToSlug(job.url, startUrl);
    currentPageKey = job.url;
    networkByPage.set(job.url, []);
    consoleByPage.set(job.url, []);

    let attempt = 0;
    let navigated = false;
    let response = null;
    let navError = null;
    let throttleWaits = [];

    // Statuses these portals use when they want us to slow down. Treating them
    // as a hard failure produced a whole crawl of bogus "error" pages once:
    // services.ecourts.gov.in answered 405 to every request during a fast
    // crawl, and 200 to the same URLs a few minutes later. Back off and retry
    // instead, and let the crawl take longer.
    const THROTTLE = new Set([403, 405, 429, 503]);

    while (attempt <= limits.retriesPerUrl + 2 && !navigated) {
      attempt++;
      try {
        await page.setViewportSize({ width: viewports[0].width, height: viewports[0].height });
        response = await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: limits.navTimeoutMs });

        if (response && THROTTLE.has(response.status()) && attempt <= limits.retriesPerUrl + 2) {
          const wait = Math.min(limits.throttleBackoffMs * Math.pow(2, attempt - 1), 30000);
          throttleWaits.push({ status: response.status(), waitedMs: wait, attempt });
          logger.warn(stage, `HTTP ${response.status()} looks like throttling; backing off ${wait}ms`, {
            url: job.url, attempt,
          });
          throttledHits++;
          await sleep(wait);
          continue;   // try the same URL again after the pause
        }
        navigated = true;
      } catch (e) {
        navError = e.message.split('\n')[0];
        if (attempt <= limits.retriesPerUrl) await sleep(1200 * attempt);
      }
    }
    // Ran out of retries while still being throttled: keep the last response.
    if (!navigated && response) navigated = true;

    if (!navigated) {
      errors.push({ url: job.url, stage: 'navigate', error: navError, attempts: attempt });
      logger.error(stage, `navigate failed: ${job.url}`, { error: navError });
      visited.set(job.url, {
        url: job.url, slug, depth: job.depth, via: job.via,
        crawlStatus: 'failed', error: navError, httpStatus: null,
      });
      await sleep(limits.perRequestDelayMs);
      continue;
    }

    // A redirect can carry us off the host we are authorized to crawl: on
    // eforensics.gov.in, /Login redirects to the JanParichay SSO on
    // janparichay.meripehchaan.gov.in. Scope was checked when this URL was
    // enqueued, but the server decided where we actually landed, so it has to
    // be checked again here. Capturing a third-party page would put someone
    // else's site into this project.
    const landedUrlNow = page.url();
    if (!inScope(landedUrlNow, rootHost)) {
      let landedHost = 'unknown';
      try { landedHost = new URL(landedUrlNow).hostname; } catch { /* keep default */ }
      skipped.push({
        url: job.url,
        reason: `redirected off-scope to ${landedHost}; not captured`,
        landedOn: landedUrlNow,
        via: job.via,
      });
      const ext = externalRedirects.get(landedHost) || { host: landedHost, fromUrls: [], landedOn: landedUrlNow };
      if (!ext.fromUrls.includes(job.url)) ext.fromUrls.push(job.url);
      externalRedirects.set(landedHost, ext);
      visited.set(job.url, {
        url: job.url, slug, depth: job.depth, via: job.via,
        crawlStatus: 'off-scope-redirect',
        httpStatus: response ? response.status() : null,
        redirectedToHost: landedHost,
        error: `redirected to ${landedHost}, which is outside the authorized scope`,
      });
      logger.warn(stage, `off-scope redirect, not captured: ${job.url} -> ${landedHost}`);
      process.stdout.write(`  [>>] ${'off-scope'.padEnd(16)} ${job.url}  ->  ${landedHost} (not captured)\n`);
      await sleep(limits.perRequestDelayMs);
      continue;
    }

    // A 4xx on a path under a known SPA mount usually means the route exists
    // only client-side. Reach it the way a visitor would.
    let reachedViaSpa = null;
    let spaAttemptFailed = null;
    if (response && response.status() >= 400) {
      const jobPath = new URL(job.url).pathname.replace(/\/+$/, '');
      let mountEntry = null;
      for (const [mountPath, mountUrl] of spaMounts) {
        if (jobPath !== mountPath && jobPath.startsWith(mountPath + '/')) {
          mountEntry = { mountPath, mountUrl };
          break;
        }
      }
      if (mountEntry) {
        logger.info(stage, `direct request returned ${response.status()}; trying in-app navigation`, {
          url: job.url, mount: mountEntry.mountUrl,
        });
        const r = await navigateViaSpa(page, mountEntry.mountUrl, job.url, limits.settleTimeoutMs);
        if (r.ok) {
          reachedViaSpa = {
            mount: mountEntry.mountUrl,
            directStatus: response.status(),
            method: 'in-app link click from the application mount',
          };
          spaRoutes.push({ url: job.url, mount: mountEntry.mountUrl, directStatus: response.status() });
          process.stdout.write(`  [..] ${'spa-route'.padEnd(16)} ${job.url}  (direct ${response.status()}, reached in-app)\n`);
        } else {
          // The browser is now showing the mount, or whatever route was last
          // clicked -- NOT the page we asked for. Capturing here would file
          // another route's content under this URL, so stop and record it.
          spaAttemptFailed = r.reason || 'in-app navigation did not reach the route';
          logger.warn(stage, `in-app navigation failed: ${job.url}`, { reason: spaAttemptFailed });
        }
      }
    }

    if (spaAttemptFailed) {
      const detail = `direct request returned ${response.status()} and in-app navigation failed ` +
        `(${spaAttemptFailed})`;
      errors.push({ url: job.url, stage: 'spa-navigate', error: detail });
      visited.set(job.url, {
        url: job.url, slug, depth: job.depth, via: job.via,
        crawlStatus: 'failed', error: detail,
        httpStatus: response.status(),
        pageType: 'error',
      });
      process.stdout.write(`  [!!] ${'unreachable'.padEnd(16)} ${job.url}  (${detail})\n`);
      await sleep(limits.perRequestDelayMs);
      continue;
    }

    // Let late content settle; tolerate a never-idle page behind a WAF.
    try {
      await page.waitForLoadState('networkidle', { timeout: limits.settleTimeoutMs });
    } catch { /* expected on pages with polling or long-lived connections */ }

    // Nudge lazy content into existence.
    try {
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += Math.max(400, window.innerHeight * 0.8)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo(0, 0);
      });
      await sleep(350);
    } catch { /* non-fatal */ }

    // Pages that fetch their data after load show a "Loading…" or "Processing"
    // placeholder first. Screenshotting then captures the spinner instead of
    // the page, which later reads as a huge visual difference that is really a
    // capture defect. Wait for the text to stop changing and the loading
    // markers to clear.
    const contentSettle = await (async () => {
      const LOADING = /\b(loading|please wait|processing|fetching|kindly wait)\b/i;
      const deadline = Date.now() + 14000;
      let last = null;
      let stableFor = 0;
      let sawLoading = false;
      while (Date.now() < deadline) {
        let snap;
        try {
          snap = await page.evaluate(() => ({
            len: document.body ? document.body.innerText.length : 0,
            text: document.body ? document.body.innerText.slice(0, 600) : '',
          }));
        } catch { break; }
        const busy = LOADING.test(snap.text);
        if (busy) sawLoading = true;
        if (last !== null && snap.len === last && !busy) {
          stableFor++;
          if (stableFor >= 2) {
            return { settled: true, sawLoading, waitedMs: 14000 - (deadline - Date.now()) };
          }
        } else {
          stableFor = 0;
        }
        last = snap.len;
        await sleep(600);
      }
      return { settled: false, sawLoading, waitedMs: 14000, note:
        'content was still changing, or a loading indicator was still visible, when the ' +
        'wait expired; this capture may show a partially loaded page' };
    })();
    if (contentSettle.sawLoading) {
      logger.info(stage, `waited for async content: ${job.url}`, contentSettle);
    }
    if (!contentSettle.settled) {
      logger.warn(stage, `content did not settle before capture: ${job.url}`, contentSettle);
    }

    // A single-page application builds its navigation after hydration, and can
    // add links after the network has gone idle. Extracting too early silently
    // loses routes, so wait again before reading the DOM.
    let spaSettled = false;
    try {
      const isSpa = await page.evaluate(
        () => !!document.querySelector('#root, #app, [data-reactroot]')
      );
      if (isSpa) {
        const before = await page.evaluate(() => document.querySelectorAll('a[href]').length);
        await sleep(2600);
        try { await page.waitForLoadState('networkidle', { timeout: limits.settleTimeoutMs }); } catch { /* fine */ }
        const after = await page.evaluate(() => document.querySelectorAll('a[href]').length);
        spaSettled = true;
        if (after !== before) {
          logger.info(stage, `SPA navigation settled late: links ${before} -> ${after}`, { url: job.url });
        }
      }
    } catch { /* non-fatal */ }

    let data;
    try {
      data = await page.evaluate(EXTRACTOR);
    } catch (e) {
      errors.push({ url: job.url, stage: 'extract', error: e.message.split('\n')[0] });
      logger.error(stage, `extract failed: ${job.url}`, { error: e.message.split('\n')[0] });
      visited.set(job.url, {
        url: job.url, slug, depth: job.depth, via: job.via,
        crawlStatus: 'partial', error: e.message.split('\n')[0],
        httpStatus: response ? response.status() : null,
      });
      await sleep(limits.perRequestDelayMs);
      continue;
    }

    // A redirect or a differently-spelled path may have landed us on a page we
    // already have. Merge it as an alias instead of storing it twice.
    const landedCanonical = canonicalize(page.url()) || job.url;
    const landedAlias = aliasKey(landedCanonical);
    const signature = contentSignature(data);
    // Only a page we actually landed on counts as an alias. If we asked for X
    // and the browser is showing Y, that is a navigation failure, not two
    // spellings of one page -- merging them would file Y's content under X.
    const requestedAliasKey = aliasKey(job.url);
    const landedWhereAsked = landedAlias === requestedAliasKey;
    const serverRedirected = !!(response && response.request().redirectedFrom());
    const priorAlias = (landedAlias && (landedWhereAsked || serverRedirected))
      ? byAlias.get(landedAlias) : null;
    if (priorAlias && priorAlias.signature === signature && priorAlias.canonical !== job.url) {
      const rec = visited.get(priorAlias.canonical);
      if (rec) {
        rec.aliases = rec.aliases || [];
        for (const a of [job.url, landedCanonical]) {
          if (a !== priorAlias.canonical && !rec.aliases.includes(a)) rec.aliases.push(a);
        }
      }
      aliasesFound.push({
        url: job.url, landedOn: landedCanonical, sameAs: priorAlias.canonical,
        basis: 'identical title, text and form shape after navigation', via: job.via,
      });
      enqueued.add(job.url);
      logger.info(stage, `alias of ${priorAlias.canonical}: ${job.url}`);
      process.stdout.write(`  [--] ${'alias'.padEnd(16)} ${job.url}  ->  ${priorAlias.canonical}\n`);
      // Still follow its links: an alias page can surface new URLs.
      for (const l of data.links) {
        if (l.kind !== 'navigational' || !l.href) continue;
        if (!inScope(l.href, rootHost)) continue;
        pushQueue(l.href, job.depth + 1, job.url);
      }
      await sleep(limits.perRequestDelayMs);
      continue;
    }

    // Raw HTML, for stack detection and as evidence.
    let html = '';
    try { html = await page.content(); } catch { /* ignore */ }
    if (html) fs.writeFileSync(path.join(domDir, `${slug}.html`), html);

    // Screenshots at every viewport.
    const shots = {};
    for (const vp of viewports) {
      try {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await sleep(450);
        const full = path.join(shotDir, `${slug}.${vp.name}.png`);
        await page.screenshot({ path: full, fullPage: true });
        shots[vp.name] = path.relative(projectDir, full);
        if (vp.name === 'desktop') {
          const above = path.join(shotDir, `${slug}.desktop.viewport.png`);
          await page.screenshot({ path: above, fullPage: false });
          shots['desktop_viewport'] = path.relative(projectDir, above);
        }
      } catch (e) {
        logger.warn(stage, `screenshot failed (${vp.name}): ${job.url}`, { error: e.message.split('\n')[0] });
      }
    }
    await page.setViewportSize({ width: viewports[0].width, height: viewports[0].height });

    const finalUrl = page.url();
    const httpStatus = response ? response.status() : null;
    const respHeaders = response ? response.headers() : {};
    const safeRespHeaders = {};
    for (const [k, v] of Object.entries(respHeaders)) {
      if (!/^set-cookie/i.test(k)) safeRespHeaders[k] = v;
    }

    const record = {
      url: job.url,
      finalUrl,
      redirected: canonicalize(finalUrl) !== job.url,
      slug,
      depth: job.depth,
      via: job.via,
      httpStatus,
      crawlStatus: 'captured',
      title: data.title,
      lang: data.lang,
      charset: data.charset,
      description: data.description,
      keywords: data.keywords,
      headings: data.headings.map((h) => h.text),
      headingTree: data.headings,
      breadcrumbs: data.breadcrumbs,
      navLabels: data.navLabels,
      text: data.text,
      textLength: data.textLength,
      document: data.document,
      viewport: data.viewport,
      imageCount: data.imageCount,
      iframeCount: data.iframeCount,
      htmlLength: data.htmlLength,
      forms: data.forms,
      orphanControls: data.orphanControls,
      tables: data.tables,
      components: data.components,
      assets: data.assets,
      links: data.links,
      fontFamilies: data.fontFamilies,
      colors: data.colors,
      bodyStyle: data.bodyStyle,
      spaHints: data.spaHints,
      responseHeaders: safeRespHeaders,
      network: networkByPage.get(job.url) || [],
      consoleIssues: consoleByPage.get(job.url) || [],
      screenshots: shots,
      reachedViaSpa,
      throttleWaits,
      spaLateSettleApplied: spaSettled,
      contentSettle,
      accessMethod: reachedViaSpa ? 'client-side route via in-app navigation' : 'direct HTTP request',
      capturedAt: new Date().toISOString(),
    };
    // A client-side route answers 4xx to a direct request but renders real
    // content once the bundle routes to it. Judge it on what it rendered.
    record.pageType = guessPageType(
      reachedViaSpa ? { ...record, httpStatus: 200 } : record
    );
    if (reachedViaSpa) record.directRequestStatus = reachedViaSpa.directStatus;

    // Remember any single-page application so its inner routes can be reached.
    if (data.spaHints && data.spaHints.reactRoot) {
      const p = new URL(finalUrl).pathname;
      const mountPath = (p.endsWith('/') ? p.slice(0, -1) : p.replace(/\/[^/]*$/, '')) || '';
      if (mountPath && !spaMounts.has(mountPath)) {
        spaMounts.set(mountPath, finalUrl);
        logger.info(stage, `single-page application mount detected at ${mountPath}`, { url: finalUrl });
      }
    }

    fs.writeFileSync(path.join(metaDir, `${slug}.json`), JSON.stringify(record, null, 2) + '\n');

    record.contentSignature = signature;
    record.aliases = record.aliases || [];
    visited.set(job.url, record);
    if (landedAlias) byAlias.set(landedAlias, { signature, canonical: job.url });
    const requestedAlias = aliasKey(job.url);
    if (requestedAlias && requestedAlias !== landedAlias) {
      byAlias.set(requestedAlias, { signature, canonical: job.url });
    }
    processed++;
    logger.info(stage, `captured [${visited.size}/${limits.maxPages}] ${finalUrl}`, {
      status: httpStatus, type: record.pageType, forms: record.forms.length, links: record.links.length,
    });
    process.stdout.write(`  [${String(visited.size).padStart(2)}] ${record.pageType.padEnd(16)} ${finalUrl}\n`);

    // Enqueue onward links.
    for (const l of data.links) {
      if (l.kind !== 'navigational' || !l.href) continue;
      if (!inScope(l.href, rootHost)) continue;
      pushQueue(l.href, job.depth + 1, job.url);
    }

    await sleep(limits.perRequestDelayMs);
  }

  currentPageKey = null;
  await context.close();
  await browser.close();

  // Everything still queued when a limit stopped us.
  for (const q of queue) {
    skipped.push({ url: q.url, reason: `queued but not reached (${limitHit || 'queue ended'})`, via: q.via });
  }

  const externalLinks = new Map();
  for (const rec of visited.values()) {
    for (const l of rec.links || []) {
      if (l.kind !== 'navigational' || !l.href) continue;
      if (inScope(l.href, rootHost)) continue;
      const host = (() => { try { return new URL(l.href).hostname; } catch { return 'invalid'; } })();
      const e = externalLinks.get(l.href) || { url: l.href, host, texts: [], onPages: [] };
      if (l.text && !e.texts.includes(l.text)) e.texts.push(l.text);
      if (!e.onPages.includes(rec.finalUrl || rec.url)) e.onPages.push(rec.finalUrl || rec.url);
      externalLinks.set(l.href, e);
    }
  }

  return {
    pages: Array.from(visited.values()),
    skipped,
    errors,
    aliases: aliasesFound,
    externalRedirects: Array.from(externalRedirects.values()),
    throttledHits,
    capturedAssets: Object.fromEntries(capturedAssets),
    capturedAssetBytes: capturedBytes,
    spaMounts: Array.from(spaMounts.entries()).map(([mountPath, mountUrl]) => ({ mountPath, mountUrl })),
    spaRoutes,
    externalLinks: Array.from(externalLinks.values()),
    limitHit,
    pending: queue.map((q) => q.url),
    durationMs: Date.now() - started,
    exhaustedQueue: queue.length === 0 && !limitHit,
  };
}

module.exports = { crawl, canonicalize, aliasKey, inScope, urlToSlug, guessPageType };
