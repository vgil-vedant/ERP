#!/usr/bin/env node
'use strict';

/**
 * Stage H: build a local demonstration replica from a project's analysis
 * artifacts.
 *
 *   node bin/build-replica.js <projectDir> [--port 4174]
 *
 * The replica is an independent reimplementation on Express + EJS. Where the
 * original's stack is known it is recorded in analysis/technology_stack.json
 * and in the README; nothing here claims to be recovered source code.
 *
 * What is generated:
 *   replica/backend/site.json   the whole site model, from the captured data
 *   replica/frontend/...        kit views and static assets
 *   replica/database/...        schema + seed, synthetic data only
 *
 * Site-specific behaviour is data, not code: one generic server (replica-kit)
 * renders every replica.
 */

const fs = require('fs');
const path = require('path');

const KIT = path.resolve(__dirname, '..', 'replica-kit');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/** rgb(a,b,c) -> #rrggbb, so the measured colours land in CSS as tokens. */
function toHex(rgb) {
  // Alpha matters: `rgba(0, 0, 0, 0)` is "no background", not black. Treating
  // it as black made every site look like a black page, because that is the
  // computed value of every element that simply has no background set.
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/.exec(rgb || '');
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : Number(m[4]);
  if (!Number.isFinite(alpha) || alpha < 0.12) return null;   // effectively transparent
  return '#' + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('');
}

function luminance(hex) {
  if (!hex) return 1;
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derive design tokens from the colours and fonts measured on the original.
 *
 * Only colours dark enough to carry white text become the brand/accent, so the
 * generated page stays readable whatever the source site used.
 */
/**
 * Which background colour actually dominates the page?
 *
 * Counting elements is the wrong measure: a full-bleed gradient is one element
 * and a nav bar may be thirty, so eforensics.gov.in reads as a white site when
 * most of what a visitor sees is purple. Weighting each colour by the area it
 * covers answers the question people actually see.
 *
 * Geometry and computed backgrounds are already in the captured component
 * inventory, so this needs no re-crawl.
 */
function areaWeightedBackgrounds(pages) {
  const area = new Map();
  const headerBg = new Map();
  const footerBg = new Map();
  let heroBest = null;
  let totalArea = 0;
  let gradientTop = null;
  let usedPreciseSurvey = false;

  for (const p of pages) {
    const docH = (p.document && p.document.scrollHeight) || 900;
    const colors = p.colors || {};

    // Preferred: the in-page survey, which measures every visible element and
    // understands CSS gradients. Captures made before that existed fall back
    // to the component boxes below.
    const byArea = colors.backgroundByArea || [];
    const grads = colors.gradientsByArea || [];
    if (byArea.length || grads.length) {
      usedPreciseSurvey = true;
      for (const g of grads) {
        const hex = toHex(g.value);
        if (!hex) continue;
        area.set(hex, (area.get(hex) || 0) + g.area);
        totalArea += g.area;
        if (!gradientTop || g.area > gradientTop.area) gradientTop = { hex, area: g.area };
      }
      for (const b of byArea) {
        const hex = toHex(b.value);
        if (!hex) continue;
        area.set(hex, (area.get(hex) || 0) + b.area);
        totalArea += b.area;
      }
    }

    for (const c of p.components || []) {
      const b = c.box || {};
      const a = (b.w || 0) * (b.h || 0);
      if (a <= 0) continue;
      const st = c.style || {};
      const hex = toHex(st.backgroundGradientColor) || toHex(st.backgroundColor);
      if (!hex) continue;

      if (!usedPreciseSurvey) {
        area.set(hex, (area.get(hex) || 0) + a);
        totalArea += a;
      }
      if (c.type === 'header') headerBg.set(hex, (headerBg.get(hex) || 0) + a);
      if (c.type === 'footer') footerBg.set(hex, (footerBg.get(hex) || 0) + a);

      const wide = (b.w || 0) >= 900;
      const nearTop = (b.y || 0) < docH * 0.45;
      if (wide && nearTop && c.type !== 'header' && c.type !== 'footer' && (b.h || 0) >= 180) {
        if (!heroBest || a > heroBest.area) heroBest = { hex, area: a, h: b.h };
      }
    }
  }

  const top = (m) => [...m.entries()].sort((x, y) => y[1] - x[1])[0];
  const dominant = top(area);

  // A full-bleed gradient is the page's identity even when a white content
  // card covers more rows of pixels further down.
  if (gradientTop && (!dominant || gradientTop.area >= dominant[1] * 0.75) && !heroBest) {
    heroBest = { hex: gradientTop.hex, area: gradientTop.area, h: 420 };
  }

  return {
    pageBg: dominant ? dominant[0] : null,
    pageBgShare: dominant && totalArea ? dominant[1] / totalArea : 0,
    headerBg: (top(headerBg) || [])[0] || null,
    footerBg: (top(footerBg) || [])[0] || null,
    hero: heroBest,
    measuredBy: usedPreciseSurvey ? 'in-page area survey (gradients included)'
                                  : 'component boxes (capture predates the area survey)',
    ranked: [...area.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8)
      .map(([hex, a]) => ({ hex, area: a, share: totalArea ? Number((a / totalArea).toFixed(3)) : 0 })),
  };
}

/**
 * Per-page visuals. One palette for a whole site is wrong when its pages
 * differ: eforensics.gov.in has a purple gradient home page and navy login
 * pages. Each replica page therefore carries its own measured background.
 */
/**
 * Turn a flat heading list into the section/card shape these portals actually
 * use.
 *
 * Every one of the five renders its landing content as a heading followed by a
 * row of feature cards ("Key Features" over three cards, "How It Works" over
 * five). Rendering the captured headings as a nested bullet list gets the words
 * right and the page wrong. Grouping each heading with the headings one level
 * below it reproduces the shape without inventing any copy.
 */
function outlineToSections(outline) {
  if (!outline || outline.length === 0) return [];
  const levels = [...new Set(outline.map((h) => h.level))].sort((a, b) => a - b);
  if (levels.length < 2) {
    return [{ heading: null, cards: outline.map((h) => ({ title: h.text })) }];
  }
  const parentLevel = levels[0];
  const childLevel = levels[1];

  const sections = [];
  let current = null;
  for (const h of outline) {
    if (h.level <= parentLevel) {
      if (current) sections.push(current);
      current = { heading: h.text, cards: [] };
    } else if (h.level === childLevel && current) {
      current.cards.push({ title: h.text });
    } else if (current) {
      // Deeper still: attach as a detail line on the last card.
      const last = current.cards[current.cards.length - 1];
      if (last) last.detail = (last.detail ? last.detail + ' · ' : '') + h.text;
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.heading || s.cards.length);
}

function pageVisual(meta) {
  if (!meta) return null;
  const a = areaWeightedBackgrounds([meta]);
  const bg = a.pageBg && a.pageBgShare >= 0.18 && luminance(a.pageBg) < 0.92 ? a.pageBg : null;
  return {
    pageBg: bg,
    pageBgShare: Number(a.pageBgShare.toFixed(3)),
    onDark: bg ? luminance(bg) < 0.5 : false,
    headerBg: a.headerBg || null,
    heroBg: a.hero ? a.hero.hex : null,
    heroHeight: a.hero ? Math.min(Math.max(a.hero.h, 140), 520) : 0,
    measuredBy: a.measuredBy,
  };
}

function deriveTokens(pages) {
  const bgCount = new Map();
  const fgCount = new Map();
  const fontCount = new Map();
  let bodyFont = null;
  let bodySize = null;
  let bodyLine = null;

  for (const p of pages) {
    for (const c of (p.colors && p.colors.background) || []) {
      const hex = toHex(c.value);
      if (hex) bgCount.set(hex, (bgCount.get(hex) || 0) + c.count);
    }
    for (const c of (p.colors && p.colors.text) || []) {
      const hex = toHex(c.value);
      if (hex) fgCount.set(hex, (fgCount.get(hex) || 0) + c.count);
    }
    for (const f of p.fontFamilies || []) {
      fontCount.set(f.value, (fontCount.get(f.value) || 0) + f.count);
    }
    if (!bodyFont && p.bodyStyle) {
      bodyFont = p.bodyStyle.fontFamily;
      bodySize = p.bodyStyle.fontSize;
      bodyLine = p.bodyStyle.lineHeight;
    }
  }

  const sortedBg = [...bgCount.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h);
  const strong = sortedBg.filter((h) => luminance(h) < 0.35);
  const mid = sortedBg.filter((h) => luminance(h) >= 0.35 && luminance(h) < 0.75);

  const brand = strong[0] || '#0f548d';
  const accent = strong[1] || mid[0] || brand;
  const titleBar = mid[0] || strong[1] || brand;
  const footerBg = strong.find((h) => h !== brand) || '#3d4548';

  const darkText = [...fgCount.entries()].sort((a, b) => b[1] - a[1])
    .map(([h]) => h).find((h) => luminance(h) < 0.5) || '#333333';
  const link = strong.find((h) => luminance(h) > 0.03 && luminance(h) < 0.3) || brand;

  const tiles = [strong[0], strong[1], strong[2], accent, '#578ebe']
    .filter(Boolean).slice(0, 3);
  while (tiles.length < 3) tiles.push(brand);

  const font = bodyFont && !/^-apple-system/.test(bodyFont)
    ? bodyFont
    : (([...fontCount.entries()].sort((a, b) => b[1] - a[1])[0] || [])[0] ||
       'Arial, Helvetica, sans-serif');

  // What the page actually looks like, by area rather than element count.
  const areas = areaWeightedBackgrounds(pages);

  // Adopt the dominant colour as the page background only when it really does
  // cover the page and is not just white; otherwise keep a white canvas.
  const dominantIsSubstantial = areas.pageBg && areas.pageBgShare >= 0.18 &&
    luminance(areas.pageBg) < 0.92;
  const pageBg = dominantIsSubstantial ? areas.pageBg : '#ffffff';
  const onDark = luminance(pageBg) < 0.5;

  const headerBg = areas.headerBg || (onDark ? pageBg : '#ffffff');
  const heroBg = areas.hero ? areas.hero.hex : null;
  const heroHeight = areas.hero ? Math.min(Math.max(areas.hero.h, 160), 560) : 0;

  return {
    brand, accent, titleBar, footerBg: areas.footerBg || footerBg, link, darkText,
    tileA: tiles[0], tileB: tiles[1], tileC: tiles[2],
    font,
    fontSize: bodySize || '13px',
    lineHeight: bodyLine && bodyLine !== 'normal' ? bodyLine : '19px',
    pageBg,
    onDark,
    headerBg,
    headerOnDark: luminance(headerBg) < 0.5,
    heroBg,
    heroHeight,
    backgroundEvidence: areas.ranked,
    pageBgShare: Number(areas.pageBgShare.toFixed(3)),
  };
}

function tokensCss(t, hostname) {
  return `/* ---------------------------------------------------------------------------
   Design tokens for the ${hostname} local demonstration replica.

   These values are MEASURED from the original's computed styles during the
   crawl (see the colour and font tables in reference_pages/page_metadata/).
   They are written here as tokens so the replica can be compared against the
   reference screenshots, and so base.css stays site-agnostic.

   The page background is the colour that covers the most AREA on the original,
   not the one used by the most elements -- a full-bleed gradient is one element
   and a nav bar may be thirty. Measured page background share here: ${t.pageBgShare}.

   The original's emblems and logos are NOT reproduced; a neutral placeholder
   mark stands in.
--------------------------------------------------------------------------- */

:root {
  --brand:      ${t.brand};
  --accent:     ${t.accent};
  --title-bar:  ${t.titleBar};
  --link:       ${t.link};
  --footer-bg:  ${t.footerBg};
  --footer-text:#c7d0d4;
  --mark-bg:    ${t.brand};

  --tile-a:     ${t.tileA};
  --tile-b:     ${t.tileB};
  --tile-c:     ${t.tileC};

  --body-text:  ${t.onDark ? '#f2f5f7' : t.darkText};
  --muted:      ${t.onDark ? '#aebac1' : '#8d989d'};
  --rule:       ${t.onDark ? 'rgba(255,255,255,.22)' : '#cccccc'};
  --page-bg:    ${t.pageBg};
  --header-bg:  ${t.headerBg};
  --header-fg:  ${t.headerOnDark ? '#ffffff' : t.darkText};
  --panel-bg:   ${t.onDark ? 'rgba(255,255,255,.08)' : '#f6f8fa'};
  --input-bg:   #ffffff;
  --surface:    ${t.onDark ? 'rgba(255,255,255,.10)' : '#ffffff'};

  --demo-amber:    #8a5a00;
  --demo-amber-bg: #fff4d6;
  --ok:            #1d6f42;
  --ok-bg:         #e6f4ea;
  --err:           #a3281f;
  --err-bg:        #fdeceb;

  --font:    ${t.font};
  --fs-base: ${t.fontSize};
  --lh-base: ${t.lineHeight};
  --shell:   1206px;
}

/* The original has no dark theme. These keep the demo legible if the viewer's
   OS is dark, without claiming to mirror anything upstream. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page-bg: #14181a; --panel-bg: #1c2124; --input-bg: #1c2124;
    --body-text: #e6e9ea; --muted: #93a0a5; --rule: #394246;
    --link: #7fb6e4; --footer-text: #b4bfc4;
    --demo-amber-bg: #3a2e10; --demo-amber: #f0c868;
    --ok-bg: #14301f; --ok: #7fd8a0;
    --err-bg: #3a1a17; --err: #f09a90;
  }
}
:root[data-theme="dark"] {
  --page-bg: #14181a; --panel-bg: #1c2124; --input-bg: #1c2124;
  --body-text: #e6e9ea; --muted: #93a0a5; --rule: #394246;
  --link: #7fb6e4; --footer-text: #b4bfc4;
  --demo-amber-bg: #3a2e10; --demo-amber: #f0c868;
  --ok-bg: #14301f; --ok: #7fd8a0;
  --err-bg: #3a1a17; --err: #f09a90;
}
`;
}

/** A stable, safe HTML name for a captured field. */
function fieldName(raw, idx) {
  const base = String(raw || `field_${idx}`)
    .split('$').pop()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return base || `field_${idx}`;
}

const IGNORED_FIELD = /^(__|ctl00$|viewstate|eventvalidation|eventtarget|eventargument|lastfocus|scrollposition)/i;

function humanLabel(f, fallback) {
  const l = (f.label || '').trim().replace(/\s*[:*]\s*$/, '').trim();
  if (l && l.length <= 70) return l;
  const n = String(f.htmlName || f.id || fallback).split('$').pop();
  return n.replace(/^(txt|ddl|chk|rbl|lbl|rfv)/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || fallback;
}

function inputTypeFor(f) {
  const t = (f.inputType || '').toLowerCase();
  if (t === 'select' || f.tag === 'select') return 'select';
  if (f.tag === 'textarea') return 'textarea';
  if (t === 'checkbox') return 'checkbox';
  if (t === 'password') return 'password';
  if (t === 'email') return 'email';
  if (t === 'tel') return 'tel';
  if (t === 'number') return 'number';
  if (t === 'date') return 'date';
  return 'text';
}

function build(projectDir, opts) {
  const abs = path.resolve(projectDir);
  const A = (f) => path.join(abs, 'analysis', f);

  const overview = readJson(A('website_overview.json'), null);
  const routes = readJson(A('routes.json'), { routes: [] });
  const formsReport = readJson(A('forms_and_interactions.json'), { forms: [] });
  const gaps = readJson(A('replication_gaps.json'), { counts: {} });
  const assets = readJson(A('asset_manifest.json'), { downloaded: 0 });
  if (!overview) {
    process.stderr.write(`No analysis under ${abs}. Run the pipeline first.\n`);
    process.exit(2);
  }

  const metaDir = path.join(abs, 'reference_pages', 'page_metadata');
  const pageMeta = fs.existsSync(metaDir)
    ? fs.readdirSync(metaDir).filter((f) => f.endsWith('.json'))
        .map((f) => readJson(path.join(metaDir, f), null)).filter(Boolean)
    : [];

  const tokens = deriveTokens(pageMeta);
  const captured = routes.routes.filter((r) => r.localReplicaRoute && r.crawlStatus === 'captured');
  // Routes whose redirect left the authorized host. Not captured, but the link
  // exists on the original, so the replica says where it goes instead of 404ing.
  const offScope = routes.routes.filter(
    (r) => r.localReplicaRoute && r.crawlStatus === 'off-scope-redirect');

  // ---- reference + cascade lists from the captured option markup ----------
  const referenceLists = {};
  const cascadeLists = {};
  const listKeyFor = (formId, fname) => `${fname}`;

  for (const form of formsReport.forms) {
    for (const f of form.fields || []) {
      if (!Array.isArray(f.options) || f.options.length === 0) continue;
      const name = fieldName(f.htmlName || f.id, 0);
      const key = listKeyFor(form.formId, name);
      if (referenceLists[key]) continue;
      const options = f.options
        .filter((o) => (o.text || '').trim() && !/^select$/i.test((o.text || '').trim()) &&
                       !/^--/.test((o.text || '').trim()))
        .map((o) => ({ value: o.value || o.text, label: (o.text || '').trim() }));
      if (options.length) referenceLists[key] = options;
    }
  }

  // ---- the site model -----------------------------------------------------
  const pages = [];
  const tables = [];
  const errorRoutes = [];
  const seenRoute = new Set();

  for (const r of captured) {
    if (seenRoute.has(r.localReplicaRoute)) continue;
    seenRoute.add(r.localReplicaRoute);

    const meta = pageMeta.find((m) => m.slug === r.slug);

    // Reproduce an error the original itself answers with.
    if (r.pageType === 'error' || (r.httpStatus && r.httpStatus >= 400 && !meta)) {
      errorRoutes.push({
        route: r.localReplicaRoute,
        status: r.httpStatus >= 400 ? r.httpStatus : 404,
        title: r.title || `${r.httpStatus} - Not found`,
        note: `The original answers ${r.httpStatus} at this path too. ` +
              'This is reproduced deliberately so the route inventory and the replica agree.',
      });
      continue;
    }

    const pageForms = formsReport.forms.filter(
      (f) => f.page === (r.finalUrl || r.url) && (f.functionalFieldCount || 0) > 0);

    const builtForms = [];
    for (const [fi, form] of pageForms.entries()) {
      const fields = [];
      const used = new Set();
      for (const [idx, f] of (form.fields || []).entries()) {
        if (!f.functionalField) continue;
        const rawName = f.htmlName || f.id;
        if (!rawName || IGNORED_FIELD.test(String(rawName).replace(/^ctl\d+\$/, ''))) continue;
        const type = inputTypeFor(f);
        if (type === 'password') {
          // Keep the field visible (the original asks for it) but it is never
          // stored: db.js strips anything secret-shaped before writing.
        }
        let name = fieldName(rawName, idx);
        if (used.has(name)) name = `${name}_${idx}`;
        used.add(name);

        const listKey = referenceLists[name] ? name : null;
        const spec = {
          name,
          originalName: rawName,
          label: humanLabel(f, `Field ${idx + 1}`),
          type,
          inputType: type === 'select' || type === 'textarea' || type === 'checkbox' ? type : type,
          required: !!f.requiredAttribute || /\*/.test(f.label || ''),
          maxLength: f.maxLength || null,
          pattern: f.pattern || null,
          options: listKey ? referenceLists[listKey] : null,
          wide: type === 'textarea' || (f.maxLength && f.maxLength > 100),
        };

        // A dependent dropdown: the original repopulated it on a parent change.
        if (type === 'select' && (!f.options || f.options.length === 0) && f.looksDependent) {
          spec.cascadeChild = true;
          spec.cascadeList = `${name}_by_parent`;
          spec.hint = 'Loads after the field above is chosen, as on the original.';
          spec.options = [];
        }
        if (f.hasOnChangeHandler && !spec.cascadeChild) spec.maybeCascadeParent = true;

        fields.push(spec);
      }
      if (!fields.length) continue;

      // Wire dependent dropdowns as a CHAIN, not a single pair.
      //
      // eCourts cascades three deep -- State -> District -> Court Complex --
      // and eprisons two (State -> Jail). Wiring only the first pair leaves the
      // rest as dead controls, so each dependent select takes the nearest
      // select before it as its parent, whether that parent is a plain list or
      // itself a dependent one.
      let previousSelect = null;
      for (const f of fields) {
        if (f.type !== 'select') continue;
        if (f.cascadeChild) {
          if (previousSelect) {
            f.cascadeParent = previousSelect.name;
            previousSelect.cascadeTarget = f.name;
            previousSelect.cascadeEndpoint = `/api/cascade/${f.cascadeList}?parent=`;
            cascadeLists[f.cascadeList] = {
              parentList: previousSelect.cascadeChild
                ? previousSelect.cascadeList      // chained: parent is another cascade
                : previousSelect.name,            // rooted: parent is a captured option list
              parentIsCascade: !!previousSelect.cascadeChild,
              childLabel: f.label,
            };
          } else {
            // Nothing to depend on: ship a plain control rather than a dead one.
            delete f.cascadeChild;
            delete f.cascadeList;
            f.hint = 'The original loads this list from its server once a related field is ' +
                     'chosen; the real values were never exposed publicly.';
          }
        }
        previousSelect = f;
      }

      builtForms.push({
        id: `${r.slug}_form${fi}`,
        heading: form.heading || `${r.title || 'Form'}`.slice(0, 70),
        submitLabel: (form.buttons || []).map((b) => b.text).find((t) => t && t.length < 24) || 'Submit',
        referencePrefix: 'DEMO',
        fields,
        captchaNote: form.hasCaptcha
          ? 'The original protects this form with a CAPTCHA. This demonstration asks a simple ' +
            'arithmetic question instead: no CAPTCHA was reproduced, solved or bypassed.'
          : null,
      });
    }

    // Data tables the original rendered.
    const pageTables = [];
    for (const [ti, t] of ((meta && meta.tables) || []).entries()) {
      if (t.isLayoutTable || !t.headers || t.headers.length < 2) continue;
      const id = `${r.slug}_t${ti}`;
      const columns = t.headers.slice(0, 8);
      pageTables.push({ id, heading: t.caption || 'Records', caption:
        'Synthetic demonstration rows. The original\'s data is not copied.', columns });
      tables.push({ id, columns });
    }

    const outline = ((meta && meta.headingTree) || []).slice(0, 14);
    const visual = pageVisual(meta);
    const sections = outlineToSections(outline);

    pages.push({
      route: r.localReplicaRoute,
      title: r.title || r.localReplicaRoute,
      pageTitle: r.pageType && r.pageType !== 'home'
        ? (r.title && r.title.length < 60 ? r.title : r.localReplicaRoute.replace(/^\//, ''))
        : null,
      heading: r.title || r.localReplicaRoute,
      pageType: r.pageType,
      originalUrl: r.finalUrl || r.url,
      forms: builtForms,
      tables: pageTables,
      outline,
      sections,
      visual,
      // One form, nothing else: the original almost certainly centres it.
      centred: builtForms.length === 1 && pageTables.length === 0 &&
               builtForms[0].fields.length <= 8,
      structureNote: builtForms.length
        ? 'The field names, lengths and option lists below are transcribed from the live ' +
          'form\'s markup, so this demonstration collects the same data in the same shape. ' +
          'It is never submitted anywhere but this local server.'
        : null,
      noContentNote: !builtForms.length && !pageTables.length
        ? 'This page carried text content on the original. Its prose is <strong>not copied ' +
          'here</strong>: this replica does not republish government material. The heading ' +
          'structure above shows what the page contained.'
        : null,
    });
  }

  for (const r of offScope) {
    if (seenRoute.has(r.localReplicaRoute)) continue;
    seenRoute.add(r.localReplicaRoute);
    pages.push({
      route: r.localReplicaRoute,
      title: r.title || r.localReplicaRoute,
      pageTitle: 'External sign-in',
      heading: r.title || r.localReplicaRoute,
      pageType: 'external-redirect',
      originalUrl: r.finalUrl || r.url,
      forms: [], tables: [], outline: [],
      structureNote: null,
      noContentNote:
        `On the original, this path redirects to <code>${r.redirectedToHost || 'another host'}</code>, ` +
        'a third-party sign-in service. That host is outside the scope this crawl was ' +
        'authorized for, so <strong>its page was deliberately not captured</strong> and nothing ' +
        'from it is reproduced here. This stand-in exists so the route inventory and the ' +
        'replica agree about what the original links to.',
    });
  }

  // Navigation: the most useful captured routes, labelled from their titles.
  const navCandidates = pages
    .filter((p) => p.route !== '/')
    .sort((a, b) => (b.forms.length - a.forms.length) || a.route.localeCompare(b.route))
    .slice(0, 9);
  const nav = [{ label: 'Home', href: '/' }].concat(navCandidates.map((p) => ({
    label: (p.pageTitle || p.title || p.route).replace(/\s*\|.*$/, '').slice(0, 26),
    href: p.route,
  })));

  const home = pages.find((p) => p.route === '/');
  if (!home) {
    pages.unshift({
      route: '/', title: overview.siteTitle || overview.hostname, pageTitle: null,
      heading: overview.siteTitle || overview.hostname, pageType: 'home',
      originalUrl: overview.finalUrl, forms: [], tables: [], outline: [],
      structureNote: null,
      noContentNote: 'The original\'s landing page redirected elsewhere; this index lists the ' +
        'routes that were captured.',
    });
  }

  const site = {
    port: opts.port,
    site: {
      name: (overview.siteTitle || overview.hostname || '').slice(0, 60),
      hostname: overview.hostname,
      finalUrl: overview.finalUrl,
      category: overview.category.selected,
      categoryStatus: overview.category.status,
      categoryConfidence: overview.category.confidence,
      analysedOn: (overview.generatedAt || '').slice(0, 10),
      pagesCaptured: overview.counts.pagesCaptured,
      formCount: formsReport.counts ? formsReport.counts.forms : 0,
      fieldCount: formsReport.counts ? (formsReport.counts.totalFunctionalFields || 0) : 0,
      assetCount: assets.downloaded || 0,
    },
    nav,
    pages,
    tables,
    referenceLists,
    cascadeLists,
    errorRoutes,
    gapMeanings: {
      'incomplete-interaction': 'A form on the original was never submitted, so its real success and error states were never observed.',
      'uncertain-technology': 'Detected by inference rather than direct evidence.',
      'missing-asset': 'A referenced asset could not be downloaded.',
      'platform-internal-asset': 'Framework plumbing the replica does not use.',
      'external-dependency': 'Hosted on another domain; recorded rather than downloaded.',
      'inaccessible-page': 'The page could not be captured.',
      'skipped-url': 'Not crawled as a page (a document, or beyond the configured depth).',
      'dynamic-navigation': 'The menu is built in the browser and can differ between loads.',
    },
  };

  // ---- write it out -------------------------------------------------------
  const backend = path.join(abs, 'replica', 'backend');
  const frontend = path.join(abs, 'replica', 'frontend');
  const database = path.join(abs, 'replica', 'database');
  fs.mkdirSync(backend, { recursive: true });
  fs.mkdirSync(database, { recursive: true });

  for (const f of ['server.js', 'db.js', 'seed.js', 'schema.sql']) {
    fs.copyFileSync(path.join(KIT, f), path.join(backend, f));
  }
  fs.writeFileSync(path.join(backend, 'site.json'), JSON.stringify(site, null, 2) + '\n');
  fs.writeFileSync(path.join(backend, 'package.json'), JSON.stringify({
    name: `${overview.normalizedHostname}-replica`,
    version: '1.0.0',
    private: true,
    description: `Unofficial local demonstration replica of ${overview.hostname}`,
    main: 'server.js',
    scripts: { start: 'node server.js', seed: 'node seed.js', test: 'node ../../tests/run-tests.js' },
    // Pinned so `npm install` in a fresh clone reproduces what was tested.
    dependencies: {
      express: '4.21.2',
      ejs: '3.1.10',
      'better-sqlite3': '11.7.0',
    },
  }, null, 2) + '\n');

  // Copy the kit views, but leave views/custom/ alone: that is where
  // hand-written per-route views live, and a rebuild must not discard them.
  copyDir(path.join(KIT, 'views'), path.join(frontend, 'views'));
  fs.mkdirSync(path.join(frontend, 'views', 'custom'), { recursive: true });
  copyDir(path.join(KIT, 'static'), path.join(frontend, 'public'));
  fs.writeFileSync(path.join(frontend, 'public', 'css', 'tokens.css'),
    tokensCss(tokens, overview.hostname));

  fs.mkdirSync(path.join(abs, 'tests'), { recursive: true });
  fs.copyFileSync(path.join(KIT, 'run-tests.js'), path.join(abs, 'tests', 'run-tests.js'));

  return { site, tokens, pages: pages.length, forms: pages.reduce((n, p) => n + p.forms.length, 0),
           tables: tables.length, referenceLists: Object.keys(referenceLists).length,
           cascadeLists: Object.keys(cascadeLists).length, errorRoutes: errorRoutes.length, abs };
}

function main() {
  const args = process.argv.slice(2);
  const projectDir = args.find((a) => !a.startsWith('-'));
  const portIdx = args.indexOf('--port');
  const port = portIdx >= 0 ? Number(args[portIdx + 1]) : 4174;
  if (!projectDir) {
    process.stderr.write('Usage: node bin/build-replica.js <projectDir> [--port N]\n');
    process.exit(2);
  }
  const r = build(projectDir, { port });
  process.stdout.write(
    `built replica for ${r.site.site.hostname}\n` +
    `  pages:           ${r.pages}\n` +
    `  forms:           ${r.forms}\n` +
    `  data tables:     ${r.tables}\n` +
    `  option lists:    ${r.referenceLists}\n` +
    `  dependent lists: ${r.cascadeLists}\n` +
    `  error routes:    ${r.errorRoutes}\n` +
    `  tokens:          brand ${r.tokens.brand}, accent ${r.tokens.accent}, font ${r.tokens.font.slice(0, 40)}\n` +
    `  port:            ${port}\n`
  );
}

if (require.main === module) main();
module.exports = { build, deriveTokens };
