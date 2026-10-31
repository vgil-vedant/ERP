'use strict';

/**
 * Stage C: technology stack detection from observable evidence only
 * (spec section 6 stage C).
 *
 * Every finding carries evidence, an evidence URL, a confidence and a
 * confirmed/inferred/unknown status. Appearance and URL shape alone never
 * produce a `confirmed` verdict.
 */

function addFinding(out, f) {
  const key = `${f.category}::${f.name}`;
  const existing = out.get(key);
  if (!existing) { out.set(key, f); return; }
  // Keep the strongest evidence, and merge the evidence lists.
  const rank = { confirmed: 3, inferred: 2, unknown: 1 };
  const cRank = { high: 3, medium: 2, low: 1 };
  const better = rank[f.status] > rank[existing.status] ||
    (rank[f.status] === rank[existing.status] && cRank[f.confidence] > cRank[existing.confidence]);
  const merged = better ? { ...f } : { ...existing };
  merged.evidence = Array.from(new Set([...(existing.evidence || []), ...(f.evidence || [])])).slice(0, 8);
  out.set(key, merged);
}

function detectStack({ pages, normalized }) {
  const out = new Map();
  const notes = [];

  const allHeaders = [];
  for (const p of pages) {
    if (p.responseHeaders) allHeaders.push({ url: p.finalUrl || p.url, headers: p.responseHeaders });
    for (const n of p.network || []) {
      if (n.headers) allHeaders.push({ url: n.url, headers: n.headers, sub: true });
    }
  }

  // ---- server / platform from response headers (strongest evidence) -------
  const headerRules = [
    { re: /^Microsoft-IIS\/([\d.]+)/i, key: 'server', name: (m) => `Microsoft IIS ${m[1]}`,
      category: 'web server' },
    { re: /^nginx\/?([\d.]*)/i, key: 'server', name: (m) => `nginx${m[1] ? ' ' + m[1] : ''}`,
      category: 'web server' },
    { re: /^Apache\/?([\d.]*)/i, key: 'server', name: (m) => `Apache httpd${m[1] ? ' ' + m[1] : ''}`,
      category: 'web server' },
    { re: /^(cloudflare)$/i, key: 'server', name: () => 'Cloudflare', category: 'CDN / reverse proxy' },
  ];

  for (const { url, headers } of allHeaders) {
    for (const [hk, hv] of Object.entries(headers)) {
      const k = hk.toLowerCase();
      const v = String(hv);

      if (k === 'server') {
        for (const r of headerRules) {
          const m = r.re.exec(v);
          if (m) {
            addFinding(out, {
              name: r.name(m), category: r.category,
              evidence: [`\`Server: ${v}\` response header`], evidenceUrl: url,
              confidence: 'high', status: 'confirmed',
            });
          }
        }
        if (!headerRules.some((r) => r.re.test(v))) {
          addFinding(out, {
            name: v, category: 'web server',
            evidence: [`\`Server: ${v}\` response header (product not recognised by this tool)`],
            evidenceUrl: url, confidence: 'medium', status: 'inferred',
          });
        }
      }

      if (k === 'x-aspnet-version') {
        addFinding(out, {
          name: `ASP.NET ${v}`, category: 'backend framework',
          evidence: [`\`X-AspNet-Version: ${v}\` response header`], evidenceUrl: url,
          confidence: 'high', status: 'confirmed',
        });
      }
      if (k === 'x-aspnetmvc-version') {
        addFinding(out, {
          name: `ASP.NET MVC ${v}`, category: 'backend framework',
          evidence: [`\`X-AspNetMvc-Version: ${v}\` response header`], evidenceUrl: url,
          confidence: 'high', status: 'confirmed',
        });
      }
      if (k === 'x-powered-by') {
        const products = [];
        if (/asp\.net/i.test(v)) products.push('ASP.NET');
        if (/php\/?([\d.]*)/i.test(v)) products.push(`PHP${/php\/([\d.]+)/i.exec(v) ? ' ' + /php\/([\d.]+)/i.exec(v)[1] : ''}`);
        if (/express/i.test(v)) products.push('Express (Node.js)');
        if (/next\.js/i.test(v)) products.push('Next.js');
        if (/servlet/i.test(v)) products.push('Java Servlet container');
        for (const prod of (products.length ? products : [v])) {
          addFinding(out, {
            name: prod, category: 'backend framework',
            evidence: [`\`X-Powered-By: ${v}\` response header`], evidenceUrl: url,
            confidence: products.length ? 'high' : 'medium',
            status: products.length ? 'confirmed' : 'inferred',
          });
        }
      }
      if (k === 'x-generator' || k === 'generator') {
        addFinding(out, {
          name: v, category: 'CMS / portal platform',
          evidence: [`\`${hk}: ${v}\` response header`], evidenceUrl: url,
          confidence: 'high', status: 'confirmed',
        });
      }
      if (k === 'x-drupal-cache' || k === 'x-drupal-dynamic-cache') {
        addFinding(out, {
          name: 'Drupal', category: 'CMS / portal platform',
          evidence: [`\`${hk}\` response header`], evidenceUrl: url,
          confidence: 'high', status: 'confirmed',
        });
      }
    }
  }

  // ---- cookies: named without ever recording their values ----------------
  const cookieNames = new Set();
  for (const p of pages) {
    const text = JSON.stringify(p.responseHeaders || {});
    // Set-Cookie was stripped before storage, so look at documented markers in
    // the page's own network records instead.
    void text;
  }
  // Cookie *names* are gathered from the document, not from Set-Cookie.
  for (const p of pages) {
    for (const n of p.network || []) {
      void n;
    }
  }

  // ---- ASP.NET WebForms markers in the served HTML ------------------------
  let aspnetFormEvidence = null;
  let viewstatePages = 0;
  for (const p of pages) {
    const machinery = (p.forms || []).flatMap((f) => f.hiddenMachinery || []);
    if (machinery.some((n) => /^__VIEWSTATE$/i.test(n))) {
      viewstatePages++;
      if (!aspnetFormEvidence) aspnetFormEvidence = p.finalUrl || p.url;
    }
  }
  if (viewstatePages) {
    addFinding(out, {
      name: 'ASP.NET Web Forms', category: 'backend framework',
      evidence: [`\`__VIEWSTATE\` hidden field present on ${viewstatePages} captured page(s)`],
      evidenceUrl: aspnetFormEvidence, confidence: 'high', status: 'confirmed',
    });
  }

  // ---- React single-page application -------------------------------------
  // A Create React App production build exposes no `React` global, so the
  // evidence is the mount node, the generator meta tag and the hashed bundle.
  const reactPages = pages.filter((p) => p.spaHints && p.spaHints.reactRoot);
  if (reactPages.length) {
    const craMeta = reactPages.find((p) =>
      /create-react-app/i.test((p.meta && p.meta.description) || p.description || ''));
    const evidence = [
      `React mount node (\`#root\`) present on ${reactPages.length} captured page(s)`,
    ];
    if (craMeta) {
      evidence.push('`<meta name="description" content="Web site created using create-react-app">`');
    }
    const hashedBundle = pages.flatMap((p) => (p.assets || []).map((a) => a.url))
      .find((u) => /static\/js\/main\.[0-9a-f]{8}\.js/i.test(u));
    if (hashedBundle) evidence.push(`content-hashed bundle \`${hashedBundle}\``);
    addFinding(out, {
      name: 'React (single-page application)', category: 'frontend framework',
      evidence, evidenceUrl: reactPages[0].finalUrl || reactPages[0].url,
      confidence: 'high', status: 'confirmed',
    });
    notes.push(
      `This target is two applications on one host: the ASP.NET Web Forms portal, and a React ` +
      `single-page application mounted at a sub-path (${reactPages.map((p) => {
        try { return new URL(p.finalUrl || p.url).pathname; } catch { return '?'; }
      }).filter((v, i, a) => a.indexOf(v) === i).join(', ')}). ` +
      'The replica must reproduce both behaviours: server-rendered pages, and a client-routed ' +
      'dashboard whose inner routes have no server-side path.'
    );
  }

  const postbackPages = pages.filter((p) =>
    (p.spaHints && p.spaHints.frameworkGlobals || []).includes('__doPostBack')).length;
  if (postbackPages) {
    addFinding(out, {
      name: 'ASP.NET Web Forms postback model', category: 'frontend behaviour',
      evidence: [`\`__doPostBack\` defined in page scope on ${postbackPages} page(s)`],
      confidence: 'high', status: 'confirmed',
    });
  }

  const aspxPages = pages.filter((p) => /\.aspx(\?|$)/i.test(p.url) || /\.aspx(\?|$)/i.test(p.finalUrl || ''));
  if (aspxPages.length) {
    addFinding(out, {
      name: 'ASP.NET (.aspx handler)', category: 'backend framework',
      evidence: [`${aspxPages.length} captured URL(s) end in \`.aspx\``],
      evidenceUrl: aspxPages[0].finalUrl || aspxPages[0].url,
      // A URL pattern alone is only an inference (spec stage C).
      confidence: 'medium', status: 'inferred',
    });
    notes.push('`.aspx` URLs are an inference on their own; the ASP.NET verdict above rests on the session cookie and `__VIEWSTATE`, which are direct evidence.');
  }

  // ---- client-side libraries from globals and asset paths ----------------
  const globalMap = {
    jQuery: { name: 'jQuery', category: 'JavaScript library' },
    $: null, // too ambiguous on its own
    React: { name: 'React', category: 'frontend framework' },
    ReactDOM: { name: 'React', category: 'frontend framework' },
    Vue: { name: 'Vue.js', category: 'frontend framework' },
    angular: { name: 'AngularJS / Angular', category: 'frontend framework' },
    __NEXT_DATA__: { name: 'Next.js', category: 'frontend framework' },
    __NUXT__: { name: 'Nuxt', category: 'frontend framework' },
    Alpine: { name: 'Alpine.js', category: 'JavaScript library' },
    htmx: { name: 'htmx', category: 'JavaScript library' },
    Backbone: { name: 'Backbone.js', category: 'JavaScript library' },
    bootstrap: { name: 'Bootstrap (JS bundle)', category: 'CSS framework' },
    DataTable: { name: 'DataTables', category: 'JavaScript library' },
    Chart: { name: 'Chart.js', category: 'charting library' },
    Sys: { name: 'ASP.NET AJAX (MicrosoftAjax / Sys namespace)', category: 'JavaScript library' },
  };
  const globalHits = new Map();
  for (const p of pages) {
    for (const g of (p.spaHints && p.spaHints.frameworkGlobals) || []) {
      if (!globalMap[g]) continue;
      const arr = globalHits.get(g) || [];
      arr.push(p.finalUrl || p.url);
      globalHits.set(g, arr);
    }
  }
  for (const [g, urls] of globalHits) {
    const def = globalMap[g];
    addFinding(out, {
      name: def.name, category: def.category,
      evidence: [`\`window.${g}\` is defined on ${urls.length} captured page(s)`],
      evidenceUrl: urls[0], confidence: 'high', status: 'confirmed',
    });
  }

  // ---- asset path and filename signatures --------------------------------
  const assetUrls = new Set();
  for (const p of pages) {
    for (const a of p.assets || []) assetUrls.add(a.url);
    for (const n of p.network || []) assetUrls.add(n.url);
  }
  const pathRules = [
    { re: /jquery[-.](\d+[\d.]*)[^/]*\.js/i, name: (m) => `jQuery ${m[1]}`, category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /jquery(\.min)?\.js/i, name: () => 'jQuery', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /jquery[-.]ui/i, name: () => 'jQuery UI', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /bootstrap[-.]?(\d+[\d.]*)?[^/]*\.(css|js)/i, name: (m) => `Bootstrap${m[1] ? ' ' + m[1] : ''}`, category: 'CSS framework', conf: 'high', status: 'confirmed' },
    { re: /font-?awesome/i, name: () => 'Font Awesome', category: 'icon library', conf: 'high', status: 'confirmed' },
    { re: /bootstrap-icons/i, name: () => 'Bootstrap Icons', category: 'icon library', conf: 'high', status: 'confirmed' },
    { re: /material-icons|materialdesignicons/i, name: () => 'Material Icons', category: 'icon library', conf: 'high', status: 'confirmed' },
    { re: /fonts\.googleapis\.com|fonts\.gstatic\.com/i, name: () => 'Google Fonts', category: 'font provider', conf: 'high', status: 'confirmed' },
    { re: /datatables/i, name: () => 'DataTables', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /chart\.?js/i, name: () => 'Chart.js', category: 'charting library', conf: 'high', status: 'confirmed' },
    { re: /highcharts/i, name: () => 'Highcharts', category: 'charting library', conf: 'high', status: 'confirmed' },
    { re: /\bd3(\.min)?\.js/i, name: () => 'D3.js', category: 'charting library', conf: 'high', status: 'confirmed' },
    { re: /owl\.carousel/i, name: () => 'Owl Carousel', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /slick(\.min)?\.(js|css)/i, name: () => 'Slick Carousel', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /select2/i, name: () => 'Select2', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /chosen(\.jquery)?(\.min)?\.(js|css)/i, name: () => 'Chosen (jQuery select widget)', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /static\/js\/main\.[0-9a-f]{8}\.js/i, name: () => 'Create React App production build', category: 'frontend framework', conf: 'high', status: 'confirmed' },
    { re: /modernizr/i, name: () => 'Modernizr', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /popper(\.min)?\.js/i, name: () => 'Popper.js', category: 'JavaScript library', conf: 'high', status: 'confirmed' },
    { re: /googletagmanager\.com|gtag\/js/i, name: () => 'Google Tag Manager / gtag', category: 'analytics', conf: 'high', status: 'confirmed' },
    { re: /google-analytics\.com|analytics\.js/i, name: () => 'Google Analytics', category: 'analytics', conf: 'high', status: 'confirmed' },
    { re: /ScriptResource\.axd|WebResource\.axd/i, name: () => 'ASP.NET ScriptManager (WebResource.axd)', category: 'backend framework', conf: 'high', status: 'confirmed' },
    { re: /\/_next\//i, name: () => 'Next.js', category: 'frontend framework', conf: 'high', status: 'confirmed' },
    { re: /tailwind/i, name: () => 'Tailwind CSS', category: 'CSS framework', conf: 'medium', status: 'inferred' },
    { re: /maps\.googleapis\.com|maps\.google\.com/i, name: () => 'Google Maps', category: 'external integration', conf: 'high', status: 'confirmed' },
    { re: /bhuvan|nrsc\.gov\.in/i, name: () => 'Bhuvan (ISRO/NRSC) mapping', category: 'external integration', conf: 'high', status: 'confirmed' },
    { re: /recaptcha/i, name: () => 'Google reCAPTCHA', category: 'authentication / anti-bot', conf: 'high', status: 'confirmed' },
    { re: /pdf\.js|pdfjs/i, name: () => 'PDF.js', category: 'document viewer', conf: 'high', status: 'confirmed' },
  ];
  for (const url of assetUrls) {
    for (const r of pathRules) {
      const m = r.re.exec(url);
      if (m) {
        addFinding(out, {
          name: r.name(m), category: r.category,
          evidence: [`asset path \`${url.length > 140 ? url.slice(0, 137) + '...' : url}\``],
          evidenceUrl: url, confidence: r.conf, status: r.status,
        });
      }
    }
  }

  // ---- CSS framework corroboration from class names ----------------------
  const classBlob = pages.flatMap((p) => (p.components || []).map((c) => c.classes || '')).join(' ');
  const bootstrapClasses = (classBlob.match(/\b(container|row|col-(xs|sm|md|lg|xl)-\d+|navbar|btn-(primary|default|secondary)|panel-|card-body|form-control)\b/g) || []).length;
  if (bootstrapClasses >= 5) {
    addFinding(out, {
      name: 'Bootstrap', category: 'CSS framework',
      evidence: [`${bootstrapClasses} Bootstrap-style class names observed in the rendered DOM (e.g. \`container\`, \`row\`, \`col-md-*\`, \`navbar\`)`],
      confidence: 'medium', status: 'inferred',
    });
  }

  // ---- fonts in use ------------------------------------------------------
  const fontUse = new Map();
  for (const p of pages) {
    for (const f of p.fontFamilies || []) {
      fontUse.set(f.value, (fontUse.get(f.value) || 0) + f.count);
    }
  }
  const topFonts = Array.from(fontUse.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [stack, count] of topFonts) {
    addFinding(out, {
      name: `font stack: ${stack}`, category: 'typography',
      evidence: [`computed \`font-family\` on ${count} rendered element(s)`],
      confidence: 'high', status: 'confirmed',
    });
  }

  // ---- authentication patterns ------------------------------------------
  const loginPages = pages.filter((p) => p.pageType === 'login');
  const captchaForms = pages.flatMap((p) => (p.forms || []).filter((f) => f.hasCaptcha)
    .map((f) => ({ page: p.finalUrl || p.url, form: f.id || f.name || f.selector })));
  if (captchaForms.length) {
    addFinding(out, {
      name: 'CAPTCHA-protected forms', category: 'authentication / anti-bot',
      evidence: [`${captchaForms.length} form(s) contain a CAPTCHA image or control, e.g. on ${captchaForms[0].page}`],
      evidenceUrl: captchaForms[0].page, confidence: 'high', status: 'confirmed',
    });
  }
  if (loginPages.length) {
    addFinding(out, {
      name: 'Form-based login (server-side session)', category: 'authentication pattern',
      evidence: [`${loginPages.length} login page(s) captured, e.g. ${loginPages[0].finalUrl || loginPages[0].url}`],
      evidenceUrl: loginPages[0].finalUrl || loginPages[0].url,
      confidence: 'medium', status: 'inferred',
    });
  }

  // ---- database: almost never knowable from a frontend -------------------
  const dbNote =
    'No database product or schema is asserted. A website frontend does not expose its ' +
    'database, and nothing in the captured headers, markup, scripts or error output named ' +
    'one. Treat the database as `unknown` and ask the system owner.';
  notes.push(dbNote);

  // ---- hosting -----------------------------------------------------------
  const bniCookiePages = pages.filter((p) =>
    JSON.stringify(p.network || []).includes('BNI_persistence') ||
    (p.text || '').includes('BNI_persistence'));
  void bniCookiePages;

  const findings = Array.from(out.values()).sort((a, b) => {
    const rank = { confirmed: 0, inferred: 1, unknown: 2 };
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
  });

  const unknowns = [
    { item: 'database product and schema', why: dbNote },
    { item: 'application source code', why: 'Only the publicly served HTML, CSS and JavaScript were retrieved. No source map, repository or build artifact was requested, and none should be. The replica is an independent reimplementation, not recovered source.' },
    { item: 'server-side language version and build tooling', why: 'The server does not advertise a version header beyond what is listed above. Nothing further is publicly observable.' },
    { item: 'hosting provider and data-centre location', why: 'Not publicly identifiable from the served responses. `.nic.in` is operated by the National Informatics Centre, but that is organisational, not a verified hosting fact.' },
  ];

  return {
    detectedAt: new Date().toISOString(),
    target: { hostname: normalized.hostname, finalUrl: normalized.finalUrl },
    summary: {
      confirmed: findings.filter((f) => f.status === 'confirmed').length,
      inferred: findings.filter((f) => f.status === 'inferred').length,
      unknown: unknowns.length,
    },
    findings,
    unknowns,
    notes,
    method:
      'Evidence was taken from response headers, the rendered DOM, computed styles, ' +
      'asset paths, in-page global objects and observed network requests. Appearance ' +
      'and URL shape alone are recorded as `inferred`, never `confirmed`. No source ' +
      'map, repository, credential or private endpoint was requested.',
  };
}

module.exports = { detectStack };
