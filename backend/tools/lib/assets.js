'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { limits, caBundle, userAgent } = require('./config');
const { inScope } = require('./crawl');

/**
 * Stage D: collect and map public assets (spec section 6 stage D).
 *
 * Downloads run through curl with the project CA bundle so certificate
 * verification stays enabled. Only assets referenced by a captured page are
 * fetched; nothing is guessed or enumerated.
 */

const CATEGORY_DIR = {
  images: 'original_assets/images',
  icons: 'original_assets/icons',
  fonts: 'original_assets/fonts',
  stylesheets: 'original_assets/stylesheets',
  scripts: 'original_assets/scripts',
  documents: 'original_assets/documents',
};

const EXT_CATEGORY = [
  [/\.(png|jpe?g|gif|webp|bmp|tiff?|avif)(\?|$)/i, 'images'],
  [/\.(svg)(\?|$)/i, 'icons'],
  [/\.(ico)(\?|$)/i, 'icons'],
  [/\.(woff2?|ttf|eot|otf)(\?|$)/i, 'fonts'],
  [/\.(css)(\?|$)/i, 'stylesheets'],
  [/\.(js|mjs)(\?|$)/i, 'scripts'],
  [/\.(pdf|docx?|xlsx?|pptx?|csv|zip|rtf|odt|txt|xml|json)(\?|$)/i, 'documents'],
];

function categoryFor(url, declared, contentType) {
  for (const [re, cat] of EXT_CATEGORY) if (re.test(url)) return cat;
  if (contentType) {
    if (/^image\/svg/i.test(contentType)) return 'icons';
    if (/^image\//i.test(contentType)) return 'images';
    if (/^font\/|application\/(x-)?font/i.test(contentType)) return 'fonts';
    if (/text\/css/i.test(contentType)) return 'stylesheets';
    if (/javascript|ecmascript/i.test(contentType)) return 'scripts';
    if (/application\/pdf|msword|spreadsheet|presentation|^text\/plain|xml|json/i.test(contentType)) return 'documents';
  }
  if (declared && CATEGORY_DIR[declared]) return declared;
  return 'documents';
}

function safeFilename(url) {
  let u;
  try { u = new URL(url); } catch { return 'asset.bin'; }
  let base = path.basename(decodeURIComponent(u.pathname)) || 'index';
  base = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+/, '');
  if (!base || base === '_') base = 'asset';
  // Keep the query distinguishable without putting it in the name verbatim.
  if (u.search) {
    const h = crypto.createHash('sha1').update(u.search).digest('hex').slice(0, 8);
    const ext = path.extname(base);
    base = `${path.basename(base, ext)}__${h}${ext}`;
  }
  if (base.length > 120) {
    const ext = path.extname(base);
    base = path.basename(base, ext).slice(0, 100) + '__' +
      crypto.createHash('sha1').update(base).digest('hex').slice(0, 8) + ext;
  }
  return base;
}

function curlDownload(url, dest) {
  return new Promise((resolve) => {
    const args = [
      '-sS', '-L',
      '--cacert', caBundle,
      '-A', userAgent,
      '--max-time', String(Math.round(limits.assetTimeoutMs / 1000)),
      '--max-filesize', String(limits.maxAssetBytes),
      '--max-redirs', '5',
      '-w', '%{http_code}\t%{content_type}\t%{size_download}\n',
      '-o', dest,
      url,
    ];
    execFile('curl', args, { timeout: limits.assetTimeoutMs + 5000 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return resolve({ ok: false, error: (stderr || err.message).trim().split('\n')[0] });
      }
      const [code, ctype, size] = (stdout || '').trim().split('\t');
      resolve({
        ok: Number(code) >= 200 && Number(code) < 300,
        status: Number(code) || null,
        contentType: (ctype || '').split(';')[0] || null,
        size: Number(size) || 0,
        error: Number(code) >= 400 ? `HTTP ${code}` : null,
      });
    });
  });
}

async function collectAssets({ pages, projectDir, rootHost, logger, capturedAssets }) {
  const fromBrowser = capturedAssets || {};
  const stage = 'assets';
  // url -> { category, pages:[], meta }
  const wanted = new Map();

  for (const p of pages) {
    const pageUrl = p.finalUrl || p.url;
    for (const a of p.assets || []) {
      if (!a.url) continue;
      const rec = wanted.get(a.url) || {
        url: a.url, declaredCategory: a.category, pages: [], details: [],
      };
      if (!rec.pages.includes(pageUrl)) rec.pages.push(pageUrl);
      rec.details.push({ page: pageUrl, ...a });
      wanted.set(a.url, rec);
    }
    // Stylesheets and scripts that only showed up as network requests.
    for (const n of p.network || []) {
      if (!['stylesheet', 'script', 'font', 'image'].includes(n.resourceType)) continue;
      if (n.status >= 400) continue;
      const rec = wanted.get(n.url) || { url: n.url, declaredCategory: null, pages: [], details: [] };
      if (!rec.pages.includes(pageUrl)) rec.pages.push(pageUrl);
      rec.fromNetwork = true;
      rec.contentTypeHint = n.contentType;
      wanted.set(n.url, rec);
    }
  }

  const manifest = [];
  const byHash = new Map();
  let downloaded = 0;
  let failed = 0;
  let skippedExternal = 0;
  let notAvailableByDesign = 0;
  let fromRender = 0;
  let duplicates = 0;
  let bytes = 0;

  const seenNames = new Set();

  for (const rec of wanted.values()) {
    const external = !inScope(rec.url, rootHost);
    const category = categoryFor(rec.url, rec.declaredCategory, rec.contentTypeHint);
    const entry = {
      originalUrl: rec.url,
      localPath: null,
      category,
      mimeType: rec.contentTypeHint || null,
      bytes: null,
      sha256: null,
      usedOnPages: rec.pages,
      external,
      downloadStatus: 'pending',
      error: null,
      notes: null,
    };

    if (external) {
      // Spec stage B/D: do not pull unrelated external domains. Record the
      // reference so the replica can declare the dependency instead.
      entry.downloadStatus = 'skipped';
      entry.notes = 'External host: recorded as an external dependency, not downloaded. ' +
        'The replica must either vendor an equivalent locally or declare it as unreproducible offline.';
      skippedExternal++;
      manifest.push(entry);
      continue;
    }

    const browserCopy = fromBrowser[rec.url];
    let filename = safeFilename(rec.url);
    let rel = path.join(CATEGORY_DIR[category], filename);
    let i = 1;
    while (seenNames.has(rel)) {
      const ext = path.extname(filename);
      rel = path.join(CATEGORY_DIR[category], `${path.basename(filename, ext)}__${i}${ext}`);
      i++;
    }
    seenNames.add(rel);
    const dest = path.join(projectDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    // Prefer the copy the browser already received while rendering the page.
    let res;
    if (browserCopy && fs.existsSync(browserCopy.file)) {
      fs.copyFileSync(browserCopy.file, dest);
      res = { ok: true, status: 200, contentType: browserCopy.contentType, size: browserCopy.bytes };
      entry.source = 'captured from the page render';
    } else {
      res = await curlDownload(rec.url, dest);
      entry.source = 'requested separately';
    }
    if (!res.ok) {
      try { fs.unlinkSync(dest); } catch { /* nothing to remove */ }
      // ASP.NET serves WebResource.axd / ScriptResource.axd behind a `d=` token
      // tied to the live page's session and machine key. Re-requesting it
      // outside that session legitimately 404s. This is a property of the
      // platform, not a broken asset, so it is not counted as a failure.
      if (/\/(Web|Script)Resource\.axd/i.test(rec.url)) {
        entry.downloadStatus = 'unavailable-by-design';
        entry.error = res.error || `HTTP ${res.status}`;
        entry.notes =
          'ASP.NET embedded-resource endpoint. Its `d=` parameter is a session- and ' +
          'machine-key-scoped token, so the URL is only valid inside the originating page ' +
          'session and returns 404 when fetched separately. The script it serves is ASP.NET ' +
          'framework plumbing (WebForms postback, validators, ScriptManager), which the ' +
          'replica does not need because it does not use the WebForms postback model.';
        notAvailableByDesign++;
        logger.info(stage, `skipped session-scoped ASP.NET resource: ${rec.url}`);
        manifest.push(entry);
        continue;
      }
      entry.downloadStatus = 'failed';
      entry.error = res.error || `HTTP ${res.status}`;
      failed++;
      logger.warn(stage, `download failed: ${rec.url}`, { error: entry.error });
      manifest.push(entry);
      continue;
    }

    // A 2xx status does not guarantee a file on disk: curl can abort after the
    // status line (--max-filesize, a truncated body, a redirect it would not
    // follow) and leave nothing behind. Check before reading.
    if (!fs.existsSync(dest)) {
      entry.downloadStatus = 'failed';
      entry.error = `server answered ${res.status} but no body was written ` +
        '(likely over the size limit, or an empty/truncated response)';
      failed++;
      logger.warn(stage, `no body written: ${rec.url}`, { error: entry.error });
      manifest.push(entry);
      continue;
    }
    const buf = fs.readFileSync(dest);
    if (!buf.length) {
      try { fs.unlinkSync(dest); } catch { /* nothing to remove */ }
      entry.downloadStatus = 'failed';
      entry.error = `server answered ${res.status} with an empty body`;
      failed++;
      manifest.push(entry);
      continue;
    }
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    entry.sha256 = hash;
    entry.bytes = buf.length;
    entry.mimeType = res.contentType || entry.mimeType;
    entry.localPath = rel;
    entry.downloadStatus = 'downloaded';

    const prior = byHash.get(hash);
    if (prior) {
      entry.duplicateOf = prior;
      entry.notes = `Byte-identical to \`${prior}\`; kept for faithful per-URL mapping.`;
      duplicates++;
    } else {
      byHash.set(hash, rel);
    }

    // Re-file by sniffed type when the extension lied.
    const sniffed = categoryFor(rec.url, rec.declaredCategory, res.contentType);
    if (sniffed !== category && CATEGORY_DIR[sniffed]) {
      const newRel = path.join(CATEGORY_DIR[sniffed], path.basename(rel));
      if (!seenNames.has(newRel)) {
        const newDest = path.join(projectDir, newRel);
        fs.mkdirSync(path.dirname(newDest), { recursive: true });
        fs.renameSync(dest, newDest);
        seenNames.add(newRel);
        entry.localPath = newRel;
        entry.category = sniffed;
        entry.notes = (entry.notes ? entry.notes + ' ' : '') +
          `Re-filed from \`${category}\` to \`${sniffed}\` based on the served Content-Type.`;
      }
    }

    downloaded++;
    if (entry.source === 'captured from the page render') fromRender++;
    bytes += buf.length;
    manifest.push(entry);
  }

  // Licensing note: government material is not automatically reusable.
  const licensingNote =
    'Asset reuse is limited. Government of India websites generally reserve copyright in ' +
    'their content and emblems; the National Emblem and official seals are additionally ' +
    'protected by the State Emblem of India (Prohibition of Improper Use) Act, 2005. ' +
    'Assets are retained here as analysis evidence for an internal, clearly-labelled ' +
    'demonstration. The replica substitutes a neutral placeholder mark for official ' +
    'emblems and logos so it cannot be mistaken for an official service.';

  logger.info(stage, `assets: ${downloaded} downloaded, ${failed} failed, ` +
    `${notAvailableByDesign} session-scoped (.axd), ${skippedExternal} external skipped`);

  const summary = {
    generatedAt: new Date().toISOString(),
    referenced: wanted.size,
    downloaded,
    failed,
    skippedExternal,
    capturedFromPageRender: fromRender,
    unavailableByDesign: notAvailableByDesign,
    byteIdenticalDuplicates: duplicates,
    totalBytes: bytes,
    byCategory: Object.fromEntries(
      Object.keys(CATEGORY_DIR).map((c) => [c, manifest.filter((m) => m.category === c && m.downloadStatus === 'downloaded').length])
    ),
    licensingNote,
    method:
      'Only assets referenced by a captured page were collected, and no URL was guessed or ' +
      'enumerated. Where the browser already received a file while rendering the page, that ' +
      'copy is kept rather than asking the server for it again: it halves the requests made ' +
      'to the target, and some servers answer a standalone asset request with 405 while ' +
      'serving the same file to the page that needs it. Anything not seen during a render ' +
      'was requested separately, with certificate verification enabled.',
    assets: manifest,
  };
  return summary;
}

module.exports = { collectAssets, CATEGORY_DIR };
