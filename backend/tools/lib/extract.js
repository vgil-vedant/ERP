'use strict';

/**
 * Browser-side extraction. Everything in EXTRACTOR runs inside the page, so it
 * must be a single self-contained function with no closure over Node scope.
 *
 * Collected here: metadata, component inventory, geometry, forms, assets and
 * link graph (spec section 6 stages B, E and G).
 */

const EXTRACTOR = function () {
  const abs = (u) => {
    if (!u) return null;
    try { return new URL(u, document.baseURI).href; } catch { return null; }
  };
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x + window.scrollX),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  // A page's dominant colour is often a CSS gradient, which lives in
  // background-image, not background-color. Reading only background-color
  // reports a purple marketing page as whatever its header happens to be.
  const gradientOf = (cs) => {
    const bi = cs.backgroundImage;
    if (!bi || bi === 'none' || !/gradient\(/i.test(bi)) return null;
    return bi.length > 600 ? bi.slice(0, 600) : bi;
  };
  /** Representative colour of a gradient: its first colour stop. */
  const gradientFirstColor = (grad) => {
    const m = /(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i.exec(grad || '');
    return m ? m[1] : null;
  };

  const selectorFor = (el) => {
    if (!el || el.nodeType !== 1) return null;
    if (el.id) return `#${el.id}`;
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift(`#${node.id}`); break; }
      const cls = (node.className && typeof node.className === 'string')
        ? node.className.trim().split(/\s+/).filter((c) => c && !/^\d/.test(c)).slice(0, 2)
        : [];
      if (cls.length) part += '.' + cls.join('.');
      const parent = node.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ');
  };

  // ---- metadata -----------------------------------------------------------
  const meta = {};
  document.querySelectorAll('meta[name], meta[property], meta[http-equiv]').forEach((m) => {
    const k = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv');
    if (k) meta[k.toLowerCase()] = clean(m.getAttribute('content'));
  });

  const headings = [];
  document.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
    if (!visible(h)) return;
    const t = clean(h.textContent);
    if (t) headings.push({ level: Number(h.tagName[1]), text: t.slice(0, 200) });
  });

  const breadcrumbs = [];
  document.querySelectorAll(
    '[class*="breadcrumb" i] a, [class*="breadcrumb" i] li, nav[aria-label*="breadcrumb" i] a'
  ).forEach((a) => {
    const t = clean(a.textContent);
    if (t) breadcrumbs.push(t.slice(0, 120));
  });

  // ---- navigation ---------------------------------------------------------
  const navLabels = [];
  document.querySelectorAll('nav a, header a, [class*="menu" i] a, [class*="nav" i] a, ul.nav a')
    .forEach((a) => {
      const t = clean(a.textContent);
      if (t && t.length < 90) navLabels.push(t);
    });

  // ---- link graph ---------------------------------------------------------
  const links = [];
  document.querySelectorAll('a[href]').forEach((a) => {
    const raw = a.getAttribute('href');
    if (!raw) return;
    const low = raw.trim().toLowerCase();
    if (low.startsWith('javascript:') || low.startsWith('mailto:') ||
        low.startsWith('tel:') || low === '#') {
      links.push({
        href: null, raw, text: clean(a.textContent).slice(0, 150),
        kind: low.startsWith('javascript:') ? 'script-trigger' : 'non-navigational',
        target: a.getAttribute('target') || null,
      });
      return;
    }
    const href = abs(raw);
    if (!href) return;
    links.push({
      href, raw,
      text: clean(a.textContent).slice(0, 150),
      title: clean(a.getAttribute('title')) || null,
      target: a.getAttribute('target') || null,
      kind: 'navigational',
      rel: a.getAttribute('rel') || null,
    });
  });

  // ---- assets -------------------------------------------------------------
  const assets = [];
  const pushAsset = (url, category, extra) => {
    const u = abs(url);
    if (!u || u.startsWith('data:') || u.startsWith('blob:')) return;
    assets.push(Object.assign({ url: u, category }, extra || {}));
  };
  document.querySelectorAll('img[src]').forEach((i) => pushAsset(i.getAttribute('src'), 'images', {
    alt: clean(i.getAttribute('alt')),
    natural: { w: i.naturalWidth || null, h: i.naturalHeight || null },
    rendered: box(i),
    loading: i.getAttribute('loading') || null,
  }));
  document.querySelectorAll('img[srcset], source[srcset]').forEach((i) => {
    (i.getAttribute('srcset') || '').split(',').forEach((c) => {
      const u = c.trim().split(/\s+/)[0];
      if (u) pushAsset(u, 'images', { fromSrcset: true });
    });
  });
  document.querySelectorAll('link[rel]').forEach((l) => {
    const rel = (l.getAttribute('rel') || '').toLowerCase();
    const href = l.getAttribute('href');
    if (!href) return;
    if (rel.includes('stylesheet')) pushAsset(href, 'stylesheets', { media: l.getAttribute('media') || null });
    else if (rel.includes('icon')) pushAsset(href, 'icons', { rel, sizes: l.getAttribute('sizes') || null });
    else if (rel.includes('preload') && (l.getAttribute('as') === 'font')) pushAsset(href, 'fonts', { rel });
    else if (rel.includes('manifest')) pushAsset(href, 'documents', { rel });
  });
  document.querySelectorAll('script[src]').forEach((s) => pushAsset(s.getAttribute('src'), 'scripts', {
    async: s.async, defer: s.defer, type: s.getAttribute('type') || null,
  }));
  // Background images declared in computed style.
  document.querySelectorAll('*').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
      const m = /url\(["']?(.*?)["']?\)/.exec(bg);
      if (m && m[1]) pushAsset(m[1], 'images', { fromCss: true, selector: selectorFor(el) });
    }
  });
  // Linked documents.
  document.querySelectorAll('a[href]').forEach((a) => {
    const h = abs(a.getAttribute('href'));
    if (h && /\.(pdf|docx?|xlsx?|pptx?|csv|zip|rtf|odt)(\?|#|$)/i.test(h)) {
      pushAsset(h, 'documents', { text: clean(a.textContent).slice(0, 150) });
    }
  });

  // ---- fonts actually used ------------------------------------------------
  const fontFamilies = {};
  document.querySelectorAll('body, h1, h2, h3, p, a, td, th, input, button, span, div')
    .forEach((el) => {
      if (!visible(el)) return;
      const cs = getComputedStyle(el);
      const key = cs.fontFamily;
      if (!key) return;
      fontFamilies[key] = (fontFamilies[key] || 0) + 1;
    });

  // ---- design tokens ------------------------------------------------------
  const colorCount = {};
  const bgCount = {};
  document.querySelectorAll('*').forEach((el) => {
    if (!visible(el)) return;
    const cs = getComputedStyle(el);
    if (cs.color) colorCount[cs.color] = (colorCount[cs.color] || 0) + 1;
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      bgCount[bg] = (bgCount[bg] || 0) + 1;
    }
  });
  const topN = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([value, count]) => ({ value, count }));

  // Backgrounds weighted by the AREA they cover, which is what a visitor sees,
  // rather than by how many elements use them.
  const bgArea = {};
  const gradArea = {};
  document.querySelectorAll('*').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    const a = Math.round(r.width) * Math.round(r.height);
    if (a <= 0) return;
    const cs = getComputedStyle(el);
    const g = gradientOf(cs);
    if (g) {
      const key = gradientFirstColor(g) || g;
      gradArea[key] = (gradArea[key] || 0) + a;
      return;
    }
    const bg = cs.backgroundColor;
    if (!bg || bg === 'transparent') return;
    const am = /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(bg);
    if (am && Number(am[1]) < 0.12) return;
    bgArea[bg] = (bgArea[bg] || 0) + a;
  });
  const topArea = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([value, area]) => ({ value, area }));

  const bodyStyle = (() => {
    const cs = getComputedStyle(document.body);
    return {
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, lineHeight: cs.lineHeight,
      color: cs.color, backgroundColor: cs.backgroundColor,
    };
  })();

  // ---- component inventory ------------------------------------------------
  const componentSpecs = [
    { type: 'header', sel: 'header, [class*="header" i]:not(body), #header, .site-header' },
    { type: 'footer', sel: 'footer, [class*="footer" i]:not(body), #footer' },
    { type: 'nav', sel: 'nav, [role="navigation"], ul.nav, [class*="navbar" i]' },
    { type: 'sidebar', sel: 'aside, [class*="sidebar" i], [class*="side-bar" i]' },
    { type: 'form', sel: 'form' },
    { type: 'table', sel: 'table' },
    { type: 'card', sel: '[class*="card" i], [class*="panel" i], [class*="box" i], [class*="tile" i]' },
    { type: 'banner', sel: '[class*="banner" i], [class*="carousel" i], [class*="slider" i], [class*="hero" i]' },
    { type: 'tabs', sel: '[role="tablist"], [class*="tab" i]:not([class*="table" i])' },
    { type: 'accordion', sel: '[class*="accordion" i], [class*="collapse" i], details' },
    { type: 'modal', sel: '[class*="modal" i], [role="dialog"], dialog' },
    { type: 'alert', sel: '[class*="alert" i], [role="alert"], [class*="notice" i], [class*="marquee" i], marquee' },
    { type: 'breadcrumb', sel: '[class*="breadcrumb" i]' },
    { type: 'chart', sel: 'canvas, svg[class*="chart" i], [class*="chart" i], [id*="chart" i]' },
    { type: 'map', sel: 'iframe[src*="map" i], [class*="map" i], [id*="map" i]' },
    { type: 'iframe', sel: 'iframe' },
    { type: 'list', sel: 'ul:not(.nav):not([class*="nav" i]), ol' },
    { type: 'button', sel: 'button, input[type="submit"], input[type="button"], [role="button"], a[class*="btn" i]' },
  ];
  const components = [];
  for (const spec of componentSpecs) {
    let nodes = [];
    try { nodes = Array.from(document.querySelectorAll(spec.sel)); } catch { continue; }
    nodes.slice(0, 40).forEach((el) => {
      if (!visible(el)) return;
      const b = box(el);
      if (b.w < 4 || b.h < 4) return;
      const cs = getComputedStyle(el);
      components.push({
        type: spec.type,
        selector: selectorFor(el),
        tag: el.tagName.toLowerCase(),
        classes: (typeof el.className === 'string' ? el.className : '').trim().slice(0, 240) || null,
        id: el.id || null,
        box: b,
        text: clean(el.textContent).slice(0, 180),
        childCount: el.children.length,
        style: {
          backgroundColor: cs.backgroundColor, color: cs.color,
          backgroundGradient: gradientOf(cs),
          backgroundGradientColor: gradientFirstColor(gradientOf(cs)),
          fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily,
          padding: cs.padding, margin: cs.margin,
          border: cs.border, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow,
          display: cs.display, position: cs.position,
          flexDirection: cs.display.includes('flex') ? cs.flexDirection : undefined,
          gridTemplateColumns: cs.display.includes('grid') ? cs.gridTemplateColumns : undefined,
          textAlign: cs.textAlign, zIndex: cs.zIndex,
        },
      });
    });
  }

  // ---- forms and interactions --------------------------------------------

  /**
   * Read an element's label text without the ASP.NET validator messages that
   * share its container. A cell holding "Visitor Name *" plus a hidden
   * <span id="rfvVisitorName">Visitor Name is required</span> must yield
   * "Visitor Name *", not both strings run together.
   */
  const labelText = (el) => {
    if (!el) return null;
    let clone;
    try { clone = el.cloneNode(true); } catch { return clean(el.textContent); }
    const junk = clone.querySelectorAll(
      'span[id*="rfv" i], span[id*="rev" i], span[id*="cv" i], span[id*="valid" i], ' +
      '[class*="valid" i], [class*="error" i], [role="alert"], ' +
      'span[style*="display:none" i], span[style*="visibility:hidden" i], ' +
      'input, select, textarea, button, script, style'
    );
    junk.forEach((n) => n.remove());
    let t = clean(clone.textContent);
    // Anything after the required marker is almost always validator prose.
    const star = t.indexOf('*');
    if (star > 0 && t.length > star + 2) t = t.slice(0, star + 1);
    return clean(t) || null;
  };

  const labelFor = (el) => {
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) return labelText(l);
    }
    const wrap = el.closest('label');
    if (wrap) return labelText(wrap);
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    const labelled = el.getAttribute('aria-labelledby');
    if (labelled) {
      const t = document.getElementById(labelled);
      if (t) return clean(t.textContent);
    }
    // ASP.NET table layouts frequently put the label in the preceding cell.
    const cell = el.closest('td,th');
    if (cell && cell.previousElementSibling) {
      const t = labelText(cell.previousElementSibling);
      if (t && t.length < 120) return t;
    }
    const prev = el.previousElementSibling;
    if (prev && /^(label|span|b|strong|td|th|div|p)$/i.test(prev.tagName)) {
      const t = labelText(prev);
      if (t && t.length < 120) return t;
    }
    // Bootstrap form-group: the label is a sibling inside the same group.
    const group = el.closest('.form-group, .form-row, .row, .field, .mb-3');
    if (group) {
      const lab = group.querySelector('label, .control-label');
      if (lab && !lab.contains(el)) {
        const t = labelText(lab);
        if (t && t.length < 120) return t;
      }
    }
    return null;
  };

  /**
   * Is this control the real data field even though it is not painted?
   *
   * Widget libraries (Chosen, Select2, selectize) hide the native <select> with
   * `display:none` and render their own markup beside it. The hidden select is
   * still the field that holds the options and that posts the value, so it must
   * be inventoried rather than dismissed as invisible.
   */
  const WIDGET_CLASS = /\b(chosen-select|chosen|select2|selectized|selectpicker|js-example)\b/i;
  const replacedByWidget = (el) => {
    if (el.tagName.toLowerCase() !== 'select') return false;
    const cls = typeof el.className === 'string' ? el.className : '';
    if (WIDGET_CLASS.test(cls)) return true;
    const parent = el.parentElement;
    if (parent && WIDGET_CLASS.test(
      typeof parent.className === 'string' ? parent.className : ''
    )) return true;
    const sib = el.nextElementSibling;
    if (sib && /chosen-container|select2|selectize-control/i.test(
      typeof sib.className === 'string' ? sib.className : ''
    )) return true;
    return false;
  };

  const describeControl = (el) => {
    const tag = el.tagName.toLowerCase();
    const type = tag === 'input' ? (el.getAttribute('type') || 'text').toLowerCase() : tag;
    const d = {
      tag,
      type,
      name: el.getAttribute('name') || null,
      id: el.id || null,
      selector: selectorFor(el),
      label: labelFor(el),
      placeholder: el.getAttribute('placeholder') || null,
      required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
      disabled: el.disabled || false,
      readOnly: el.readOnly || false,
      maxLength: el.getAttribute('maxlength') ? Number(el.getAttribute('maxlength')) : null,
      minLength: el.getAttribute('minlength') ? Number(el.getAttribute('minlength')) : null,
      pattern: el.getAttribute('pattern') || null,
      min: el.getAttribute('min') || null,
      max: el.getAttribute('max') || null,
      step: el.getAttribute('step') || null,
      autocomplete: el.getAttribute('autocomplete') || null,
      defaultValue: null,
      visible: visible(el),
      replacedByWidget: replacedByWidget(el),
      // The field a user actually fills in, whether or not the native control
      // is the thing painted on screen.
      functionalField: visible(el) || replacedByWidget(el),
      box: visible(el) ? box(el) : null,
      ariaDescribedBy: el.getAttribute('aria-describedby') || null,
      onchangeAttr: el.getAttribute('onchange') ? true : false,
      cssClasses: (typeof el.className === 'string' ? el.className : '').trim() || null,
    };
    if (tag === 'select') {
      d.multiple = el.multiple;
      d.options = Array.from(el.options).slice(0, 200).map((o) => ({
        value: o.value, text: clean(o.textContent), selected: o.defaultSelected,
      }));
      d.optionCount = el.options.length;
      // A dependent dropdown is usually empty until its parent is chosen.
      d.looksDependent = el.options.length <= 1;
      const sel = el.options[el.selectedIndex];
      d.defaultValue = sel ? sel.value : null;
    } else if (type === 'checkbox' || type === 'radio') {
      d.value = el.getAttribute('value');
      d.checkedByDefault = el.defaultChecked;
    } else if (tag === 'textarea') {
      d.rows = el.rows; d.cols = el.cols;
      d.defaultValue = el.defaultValue || null;
    } else if (type === 'file') {
      d.accept = el.getAttribute('accept') || null;
      d.multiple = el.multiple;
    } else {
      // Do not record a value that looks like a live token or session secret.
      const v = el.defaultValue || '';
      d.defaultValue = v.length > 80 ? `[${v.length} chars omitted]` : (v || null);
    }
    return d;
  };

  const forms = [];
  document.querySelectorAll('form').forEach((f, idx) => {
    const controls = Array.from(
      f.querySelectorAll('input, select, textarea, button')
    ).filter((el) => {
      const t = (el.getAttribute('type') || '').toLowerCase();
      // ASP.NET viewstate/eventvalidation are machinery, not user fields.
      const n = el.getAttribute('name') || '';
      if (t === 'hidden' && /^__(VIEWSTATE|EVENTVALIDATION|VIEWSTATEGENERATOR|EVENTTARGET|EVENTARGUMENT|LASTFOCUS|SCROLLPOSITION)/i.test(n)) {
        return false;
      }
      // Search boxes that Chosen/Select2 inject next to the native select are
      // widget chrome, not fields: they have no name and post nothing.
      if (!n && !el.id && el.closest('.chosen-container, .select2-container, .selectize-control')) {
        return false;
      }
      return true;
    });
    const fields = controls
      .filter((el) => el.tagName.toLowerCase() !== 'button' &&
                      (el.getAttribute('type') || '').toLowerCase() !== 'submit' &&
                      (el.getAttribute('type') || '').toLowerCase() !== 'button')
      .map(describeControl);
    const buttons = controls
      .filter((el) => el.tagName.toLowerCase() === 'button' ||
                      ['submit', 'button', 'image', 'reset'].includes((el.getAttribute('type') || '').toLowerCase()))
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || null,
        name: el.getAttribute('name') || null,
        id: el.id || null,
        text: clean(el.value || el.textContent) || null,
        selector: selectorFor(el),
        box: visible(el) ? box(el) : null,
        hasOnClick: !!el.getAttribute('onclick'),
      }));

    const hiddenMachinery = Array.from(f.querySelectorAll('input[type="hidden"]'))
      .map((h) => h.getAttribute('name')).filter(Boolean);

    const captcha = !!f.querySelector(
      'img[src*="captcha" i], img[id*="captcha" i], [class*="captcha" i], [id*="captcha" i], iframe[src*="recaptcha" i]'
    ) || /captcha/i.test(f.textContent || '');

    forms.push({
      index: idx,
      name: f.getAttribute('name') || null,
      id: f.id || null,
      selector: selectorFor(f),
      action: abs(f.getAttribute('action')) || null,
      actionRaw: f.getAttribute('action') || null,
      method: (f.getAttribute('method') || 'get').toLowerCase(),
      enctype: f.getAttribute('enctype') || null,
      target: f.getAttribute('target') || null,
      heading: (() => {
        const h = f.querySelector('h1,h2,h3,h4,legend,caption');
        return h ? clean(h.textContent).slice(0, 160) : null;
      })(),
      fieldCount: fields.length,
      fields,
      buttons,
      hiddenMachinery,
      hasCaptcha: captcha,
      hasFileInput: !!f.querySelector('input[type="file"]'),
      visibleText: clean(f.textContent).slice(0, 600),
      box: visible(f) ? box(f) : null,
    });
  });

  // Controls that sit outside any <form> (common on ASP.NET pages that post
  // through a single page-level form, and on JS-driven widgets).
  const orphanControls = Array.from(document.querySelectorAll('input, select, textarea'))
    .filter((el) => !el.closest('form'))
    .map(describeControl);

  // ---- tables -------------------------------------------------------------
  const tables = [];
  document.querySelectorAll('table').forEach((t) => {
    if (!visible(t)) return;
    const b = box(t);
    if (b.w < 40) return;
    const headers = Array.from(t.querySelectorAll('thead th, tr:first-child th'))
      .map((th) => clean(th.textContent)).filter(Boolean);
    const rows = Array.from(t.querySelectorAll('tbody tr, tr'));
    tables.push({
      selector: selectorFor(t),
      id: t.id || null,
      caption: t.caption ? clean(t.caption.textContent) : null,
      headers,
      columnCount: headers.length || (rows[0] ? rows[0].children.length : 0),
      rowCount: rows.length,
      sampleRows: rows.slice(0, 5).map((r) =>
        Array.from(r.children).map((c) => clean(c.textContent).slice(0, 120))),
      box: b,
      isLayoutTable: headers.length === 0,
    });
  });

  // ---- client-side routing hints -----------------------------------------
  const spaHints = {
    hasHistoryPushState: typeof history.pushState === 'function',
    hashRoutingLinks: Array.from(document.querySelectorAll('a[href^="#/"]')).length,
    reactRoot: !!document.querySelector('#root, #app, [data-reactroot]'),
    frameworkGlobals: ['React', 'ReactDOM', 'Vue', 'angular', 'ng', 'jQuery', '$',
                       '__NEXT_DATA__', '__NUXT__', 'Alpine', 'htmx', 'Backbone',
                       'Ember', 'Svelte', 'bootstrap', 'DataTable', 'Chart',
                       'WebForm_DoPostBackWithOptions', 'Sys', '__doPostBack']
      .filter((g) => {
        try { return typeof window[g] !== 'undefined'; } catch { return false; }
      }),
  };

  return {
    url: location.href,
    title: document.title || '',
    lang: document.documentElement.getAttribute('lang') || null,
    charset: document.characterSet,
    meta,
    description: meta.description || '',
    keywords: meta.keywords || '',
    headings,
    breadcrumbs: Array.from(new Set(breadcrumbs)),
    navLabels: Array.from(new Set(navLabels)),
    text: clean(document.body ? document.body.innerText : '').slice(0, 24000),
    textLength: (document.body ? document.body.innerText.length : 0),
    links,
    assets,
    components,
    forms,
    orphanControls,
    tables,
    fontFamilies: topN(fontFamilies, 10),
    colors: {
      text: topN(colorCount, 12),
      background: topN(bgCount, 12),
      // By area, not element count; gradients listed separately.
      backgroundByArea: topArea(bgArea, 10),
      gradientsByArea: topArea(gradArea, 6),
    },
    bodyStyle,
    spaHints,
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    htmlLength: document.documentElement.outerHTML.length,
    iframeCount: document.querySelectorAll('iframe').length,
    imageCount: document.querySelectorAll('img').length,
  };
};

module.exports = { EXTRACTOR };
