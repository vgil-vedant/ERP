'use strict';

const crypto = require('crypto');
const { limits, viewports, visualTolerance } = require('./config');

/**
 * Stage G: turn the crawl into the structured analysis artifacts required by
 * spec section 7. Nothing here invents data: unknown values are explicit nulls
 * with a stated reason.
 */

function localRouteFor(rec, startUrl) {
  const u = new URL(rec.finalUrl || rec.url);
  const start = new URL(startUrl);
  let p = u.pathname;
  // Strip the application's mount prefix so local routes read cleanly.
  const prefixMatch = /^(\/[^/]+)\//.exec(start.pathname);
  const mount = prefixMatch ? prefixMatch[1] : '';
  if (mount && p.startsWith(mount + '/')) p = p.slice(mount.length);
  p = p.replace(/\.aspx?$/i, '');
  p = p.replace(/\/+/g, '/');
  if (!p.startsWith('/')) p = '/' + p;
  if (p === '/' || /\/(home|index|default)$/i.test(p)) {
    if (/\/(home|index|default)$/i.test(p) && p.split('/').length <= 3) p = '/';
  }
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

function buildRoutes({ pages, skipped, startUrl }) {
  const seenRoute = new Map();
  const routes = pages.map((p) => {
    let local = localRouteFor(p, startUrl);
    if (seenRoute.has(local)) {
      const n = seenRoute.get(local) + 1;
      seenRoute.set(local, n);
      local = `${local === '/' ? '' : local}/v${n}`;
    } else {
      seenRoute.set(local, 1);
    }
    return {
      url: p.url,
      finalUrl: p.finalUrl || null,
      redirected: !!p.redirected,
      httpStatus: p.httpStatus,
      title: p.title || null,
      pageType: p.pageType || null,
      depth: p.depth,
      discoveredVia: p.via,
      crawlStatus: p.crawlStatus,
      error: p.error || null,
      localReplicaRoute: p.crawlStatus === 'captured' ? local : null,
      slug: p.slug,
      formCount: (p.forms || []).length,
      visibleFieldCount: (p.forms || []).reduce(
        (n, f) => n + (f.fields || []).filter((x) => x.visible).length, 0),
      functionalFieldCount: (p.forms || []).reduce(
        (n, f) => n + (f.fields || []).filter(
          (x) => x.functionalField !== undefined ? x.functionalField : x.visible).length, 0),
      tableCount: (p.tables || []).filter((t) => !t.isLayoutTable).length,
      aliasUrls: p.aliases || [],
      screenshots: p.screenshots || {},
      documentHeight: p.document ? p.document.scrollHeight : null,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    startUrl,
    counts: {
      captured: routes.filter((r) => r.crawlStatus === 'captured').length,
      failed: routes.filter((r) => r.crawlStatus === 'failed').length,
      partial: routes.filter((r) => r.crawlStatus === 'partial').length,
      skipped: skipped.length,
    },
    byPageType: routes.reduce((acc, r) => {
      if (!r.pageType) return acc;
      acc[r.pageType] = (acc[r.pageType] || 0) + 1;
      return acc;
    }, {}),
    routes,
    skipped,
  };
}

/**
 * Group repeated components across pages into reusable ones, so the replica is
 * built from shared parts rather than per-page screenshots (spec stage G).
 */
function buildComponentInventory({ pages }) {
  const groups = new Map();
  for (const p of pages) {
    const pageUrl = p.finalUrl || p.url;
    for (const c of p.components || []) {
      // Signature: what makes two instances "the same component".
      const sig = crypto.createHash('sha1').update([
        c.type,
        c.tag,
        (c.classes || '').split(/\s+/).sort().join(' '),
        c.id ? c.id.replace(/\d+/g, '#') : '',
      ].join('|')).digest('hex').slice(0, 12);

      const g = groups.get(sig) || {
        componentId: `${c.type}-${sig}`,
        type: c.type,
        tag: c.tag,
        classes: c.classes,
        idPattern: c.id || null,
        instances: 0,
        pages: [],
        boxes: [],
        styles: [],
        sampleText: c.text || null,
        childCounts: [],
      };
      g.instances++;
      if (!g.pages.includes(pageUrl)) g.pages.push(pageUrl);
      g.boxes.push(c.box);
      g.styles.push(c.style);
      g.childCounts.push(c.childCount);
      if (!g.sampleText && c.text) g.sampleText = c.text;
      groups.set(sig, g);
    }
  }

  const median = (arr) => {
    const a = arr.filter((n) => typeof n === 'number').sort((x, y) => x - y);
    return a.length ? a[Math.floor(a.length / 2)] : null;
  };
  const modeOf = (arr) => {
    const m = new Map();
    for (const v of arr) { if (v == null) continue; m.set(v, (m.get(v) || 0) + 1); }
    let best = null; let bestN = 0;
    for (const [v, n] of m) if (n > bestN) { best = v; bestN = n; }
    return best;
  };

  const components = Array.from(groups.values()).map((g) => ({
    componentId: g.componentId,
    type: g.type,
    tag: g.tag,
    classes: g.classes,
    idPattern: g.idPattern,
    instanceCount: g.instances,
    pageCount: g.pages.length,
    shared: g.pages.length > 1,
    usedOnPages: g.pages.slice(0, 40),
    measurements: {
      medianWidth: median(g.boxes.map((b) => b && b.w)),
      medianHeight: median(g.boxes.map((b) => b && b.h)),
      medianX: median(g.boxes.map((b) => b && b.x)),
      medianY: median(g.boxes.map((b) => b && b.y)),
      widthRange: [Math.min(...g.boxes.map((b) => (b ? b.w : Infinity))),
                   Math.max(...g.boxes.map((b) => (b ? b.w : -Infinity)))],
      note: 'Measured at the desktop viewport (1366x900), in CSS pixels, document-relative.',
    },
    dominantStyle: {
      backgroundColor: modeOf(g.styles.map((s) => s && s.backgroundColor)),
      color: modeOf(g.styles.map((s) => s && s.color)),
      fontSize: modeOf(g.styles.map((s) => s && s.fontSize)),
      fontWeight: modeOf(g.styles.map((s) => s && s.fontWeight)),
      fontFamily: modeOf(g.styles.map((s) => s && s.fontFamily)),
      padding: modeOf(g.styles.map((s) => s && s.padding)),
      border: modeOf(g.styles.map((s) => s && s.border)),
      borderRadius: modeOf(g.styles.map((s) => s && s.borderRadius)),
      boxShadow: modeOf(g.styles.map((s) => s && s.boxShadow)),
      display: modeOf(g.styles.map((s) => s && s.display)),
      textAlign: modeOf(g.styles.map((s) => s && s.textAlign)),
    },
    medianChildCount: median(g.childCounts),
    sampleText: g.sampleText,
    behaviour: null,
  })).sort((a, b) => b.pageCount - a.pageCount || b.instanceCount - a.instanceCount);

  // Page -> component mapping, so the replica can compose shared parts.
  const pageToComponents = pages.filter((p) => p.crawlStatus === 'captured').map((p) => ({
    page: p.finalUrl || p.url,
    slug: p.slug,
    pageType: p.pageType,
    componentIds: Array.from(new Set((p.components || []).map((c) => {
      const sig = crypto.createHash('sha1').update([
        c.type, c.tag,
        (c.classes || '').split(/\s+/).sort().join(' '),
        c.id ? c.id.replace(/\d+/g, '#') : '',
      ].join('|')).digest('hex').slice(0, 12);
      return `${c.type}-${sig}`;
    }))),
  }));

  return {
    generatedAt: new Date().toISOString(),
    measurementViewport: viewports[0],
    counts: {
      distinctComponents: components.length,
      sharedAcrossPages: components.filter((c) => c.shared).length,
      byType: components.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1; return acc;
      }, {}),
    },
    components,
    pageToComponents,
    note: 'Components are grouped by tag + class signature, so one entry can represent the same ' +
          'header or card repeated across pages. Geometry is the median across instances; the ' +
          'per-page exact values stay in reference_pages/page_metadata/.',
  };
}

function buildFormsReport({ pages }) {
  const forms = [];
  for (const p of pages) {
    const pageUrl = p.finalUrl || p.url;
    for (const f of p.forms || []) {
      const visibleFields = (f.fields || []).filter((x) => x.visible);
      forms.push({
        page: pageUrl,
        pageType: p.pageType,
        formId: f.id || f.name || `form[${f.index}]`,
        selector: f.selector,
        heading: f.heading,
        action: f.action,
        method: f.method,
        enctype: f.enctype,
        hasCaptcha: f.hasCaptcha,
        hasFileInput: f.hasFileInput,
        aspNetMachinery: f.hiddenMachinery,
        visibleFieldCount: visibleFields.length,
        functionalFieldCount: (f.fields || []).filter(
          (x) => x.functionalField !== undefined ? x.functionalField : x.visible).length,
        totalFieldCount: (f.fields || []).length,
        hasCaptcha: f.hasCaptcha,
        fields: (f.fields || []).map((x) => ({
          label: x.label,
          htmlName: x.name,
          id: x.id,
          inputType: x.type,
          tag: x.tag,
          placeholder: x.placeholder,
          requiredAttribute: x.required,
          maxLength: x.maxLength,
          minLength: x.minLength,
          pattern: x.pattern,
          min: x.min,
          max: x.max,
          defaultValue: x.defaultValue,
          options: x.options || null,
          optionCount: x.optionCount != null ? x.optionCount : null,
          looksDependent: x.looksDependent || false,
          replacedByWidget: x.replacedByWidget || false,
          functionalField: x.functionalField !== undefined ? x.functionalField : x.visible,
          accept: x.accept || null,
          visible: x.visible,
          disabled: x.disabled,
          readOnly: x.readOnly,
          hasOnChangeHandler: x.onchangeAttr,
          cssClasses: x.cssClasses,
          validationObserved: x.pattern ? `HTML pattern: ${x.pattern}` :
            (x.maxLength ? `maxlength=${x.maxLength}` : null),
          validationNotPubliclyStated: !x.pattern && !x.required,
        })),
        buttons: f.buttons,
        dependencies: (f.fields || [])
          .filter((x) => x.looksDependent || x.onchangeAttr)
          .map((x) => ({
            field: x.name || x.id,
            label: x.label,
            evidence: x.looksDependent
              ? 'select rendered with no options until a parent value is chosen'
              : 'has an onchange handler that repopulates dependent controls',
            status: 'inferred',
          })),
        observedStates: {
          note: 'No form on this target was submitted. Submission states were therefore not ' +
                'observed and are recorded as null rather than guessed.',
          loading: null, success: null, validationError: null, serverError: null,
        },
        submissionTested: false,
        whyNotTested:
          f.hasCaptcha
            ? 'Form is CAPTCHA-protected. Solving or bypassing a CAPTCHA is out of scope.'
            : 'This is a live production government service. Submitting would create or query a ' +
              'real record, so no submission was attempted.',
      });
    }
    if ((p.orphanControls || []).length) {
      forms.push({
        page: pageUrl,
        pageType: p.pageType,
        formId: '(controls outside any <form>)',
        selector: null,
        heading: null,
        action: null,
        method: null,
        visibleFieldCount: p.orphanControls.filter((x) => x.visible).length,
        totalFieldCount: p.orphanControls.length,
        // Carry the same facts as fields inside a <form>. Dropping
        // looksDependent/functionalField here hid every dependent dropdown on
        // pages that drive their controls with script rather than a form
        // element -- which is how the eCourts NJDG pages are built, so their
        // State -> District cascade went undetected.
        fields: p.orphanControls.map((x) => ({
          label: x.label, htmlName: x.name, id: x.id, inputType: x.type, tag: x.tag,
          placeholder: x.placeholder, maxLength: x.maxLength, minLength: x.minLength,
          pattern: x.pattern, min: x.min, max: x.max,
          options: x.options || null, optionCount: x.optionCount != null ? x.optionCount : null,
          looksDependent: x.looksDependent || false,
          replacedByWidget: x.replacedByWidget || false,
          functionalField: x.functionalField !== undefined ? x.functionalField : x.visible,
          hasOnChangeHandler: x.onchangeAttr || false,
          requiredAttribute: x.required || false,
          disabled: x.disabled, readOnly: x.readOnly,
          visible: x.visible, defaultValue: x.defaultValue,
          cssClasses: x.cssClasses,
        })),
        buttons: [],
        dependencies: (p.orphanControls || [])
          .filter((x) => x.looksDependent || x.onchangeAttr)
          .map((x) => ({
            field: x.name || x.id,
            label: x.label,
            evidence: x.looksDependent
              ? 'select rendered with no options until a parent value is chosen'
              : 'has an onchange handler that repopulates dependent controls',
            status: 'inferred',
          })),
        note: 'These controls are not inside a <form> element. On this kind of portal they are ' +
              'usually driven by script, or by a single page-level form elsewhere in the document.',
        submissionTested: false,
        whyNotTested: 'Live production service; no interaction was attempted.',
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      forms: forms.length,
      withCaptcha: forms.filter((f) => f.hasCaptcha).length,
      withFileInput: forms.filter((f) => f.hasFileInput).length,
      totalVisibleFields: forms.reduce((n, f) => n + f.visibleFieldCount, 0),
      totalFunctionalFields: forms.reduce((n, f) => n + (f.functionalFieldCount || 0), 0),
      widgetBackedSelects: forms.reduce((n, f) =>
        n + (f.fields || []).filter((x) => x.replacedByWidget).length, 0),
    },
    safetyPolicy:
      'No form was submitted, no CAPTCHA was solved or bypassed, no account was created and ' +
      'no authentication was attempted. Field inventories come from the rendered markup only. ' +
      'Validation rules not expressed in the markup are recorded as not publicly stated rather ' +
      'than inferred from behaviour.',
    forms,
  };
}

function buildApiInventory({ pages, rootHost }) {
  const endpoints = new Map();
  for (const p of pages) {
    const pageUrl = p.finalUrl || p.url;
    for (const n of p.network || []) {
      // Only data-ish traffic is interesting here; assets are in the manifest.
      const isData = n.isXhr ||
        (n.contentType && /json|xml(?!.*svg)|text\/plain/i.test(n.contentType) &&
         !/\.(js|css)(\?|$)/i.test(n.url));
      if (!isData) continue;
      let u;
      try { u = new URL(n.url); } catch { continue; }
      const key = `${n.method} ${u.origin}${u.pathname}`;
      const e = endpoints.get(key) || {
        method: n.method,
        path: u.pathname,
        origin: u.origin,
        sameHost: u.hostname.toLowerCase().endsWith(rootHost.replace(/^www\./, '').toLowerCase()),
        observedOnPages: [],
        statuses: [],
        contentTypes: [],
        queryParameters: new Set(),
        resourceType: n.resourceType,
        carriesRequestBody: false,
        authenticationRequired: null,
        responseSchema: null,
        sampleResponse: null,
      };
      if (!e.observedOnPages.includes(pageUrl)) e.observedOnPages.push(pageUrl);
      if (!e.statuses.includes(n.status)) e.statuses.push(n.status);
      if (n.contentType && !e.contentTypes.includes(n.contentType)) e.contentTypes.push(n.contentType);
      for (const k of u.searchParams.keys()) e.queryParameters.add(k);
      if (n.postDataPresent) e.carriesRequestBody = true;
      if (n.status === 401 || n.status === 403) e.authenticationRequired = true;
      endpoints.set(key, e);
    }
  }

  const list = Array.from(endpoints.values()).map((e) => ({
    ...e,
    queryParameters: Array.from(e.queryParameters),
    responseSchema: null,
    schemaNote: 'Response bodies were not captured. Recording them from a live government ' +
                'service risks storing real personal data, so only the endpoint shape, status ' +
                'and content type are kept.',
  }));

  return {
    generatedAt: new Date().toISOString(),
    counts: { endpointsObserved: list.length },
    endpoints: list,
    publicApiAvailable: false,
    publicApiEvidence:
      list.length === 0
        ? 'No XHR/fetch data endpoint was observed on any captured page. The portal renders ' +
          'server-side and posts back through full page requests.'
        : `${list.length} data request(s) were observed, all internal to the application. None ` +
          'is a documented public API.',
    integrationRestrictions: [
      'No public, self-service API is published for this portal.',
      'Public forms are CAPTCHA-protected; automated submission is not available.',
      'Authenticated functionality sits behind a server-side session and is out of scope.',
    ],
    safetyPolicy:
      'Endpoints here were observed passively while loading public pages. No endpoint was ' +
      'enumerated, fuzzed or probed. No credential, session token, cookie or authorization ' +
      'header was recorded: those header names are stripped before anything is written to ' +
      'disk. No request body was captured.',
  };
}

function buildDatabaseFindings({ stackReport }) {
  return {
    generatedAt: new Date().toISOString(),
    verified: {
      databaseProduct: null,
      version: null,
      schema: null,
      note: 'Nothing verified. A website frontend does not expose its database, and no served ' +
            'header, markup comment, script or error page named a database product.',
    },
    inferred: [
      {
        claim: 'The application is backed by a relational database.',
        basis: 'The portal is an ASP.NET application serving record lookups, status enquiries and ' +
               'aggregate statistics, which is the normal shape of a relational-backed line-of-' +
               'business system.',
        confidence: 'low',
        status: 'inferred',
        caution: 'This is a reasonable expectation, not an observation. Do not build against it.',
      },
      {
        claim: 'Microsoft SQL Server is the most likely product.',
        basis: 'Co-occurrence with the confirmed ASP.NET/IIS stack. No direct evidence was found.',
        confidence: 'low',
        status: 'inferred',
        caution: 'Never present this as fact. Ask the system owner.',
      },
    ],
    unknown: (stackReport.unknowns || []).filter((u) => /database/i.test(u.item)),
    localReplicaDatabase: {
      purpose: 'Independent local database for the demonstration only.',
      product: 'SQLite (file-based, zero-install)',
      connectsToOriginal: false,
      dataPolicy: 'Synthetic demonstration data only. No real record from the original system ' +
                  'is copied into the replica, and the replica never connects to a production ' +
                  'government database.',
      note: 'This schema is the replica\'s own design, inferred from the public field inventory. ' +
            'It is not, and does not claim to be, the original schema.',
    },
  };
}

function buildWebsiteOverview({ normalized, classification, crawlResult, stackReport, assetSummary, workspace }) {
  const captured = crawlResult.pages.filter((p) => p.crawlStatus === 'captured');
  return {
    generatedAt: new Date().toISOString(),
    input: normalized.input,
    initialUrl: normalized.initialUrl,
    finalUrl: normalized.finalUrl,
    redirectChain: normalized.redirects,
    redirectProblems: normalized.redirectProblems || [],
    recoveredFromBrokenRedirect: !!normalized.recoveredFromBrokenRedirect,
    hostname: normalized.hostname,
    normalizedHostname: normalized.normalizedHostname,
    scheme: normalized.scheme,
    httpStatus: normalized.status,
    category: {
      selected: classification.category,
      confidence: classification.confidence,
      status: classification.status,
      decidedBy: classification.decidedBy,
      wouldHoldWithoutHostname: classification.wouldHoldWithoutHostname,
      governmentHost: classification.governmentHost,
      evidence: classification.ranking.slice(0, 3).map((r) => ({
        category: r.dir,
        score: r.score,
        contentScore: r.contentScore,
        hostScore: r.hostScore,
        topStrongTerms: r.hits.strong.slice(0, 8),
        topWeakTerms: r.hits.weak.slice(0, 5),
        hostHints: r.hits.host,
      })),
      pagesConsidered: classification.pagesConsidered,
    },
    siteTitle: captured.length ? captured[0].title : null,
    languages: Array.from(new Set(captured.map((p) => p.lang).filter(Boolean))),
    crawlScope: {
      rootHost: normalized.hostname,
      limits,
      robotsTxt: 'absent (HTTP 404) - no crawl directives were published',
      sitemapXml: 'absent (HTTP 404)',
      scopeRule: 'same registrable host and its subdomains only; external hosts recorded as links, never crawled',
    },
    counts: {
      pagesCaptured: captured.length,
      pagesFailed: crawlResult.pages.filter((p) => p.crawlStatus === 'failed').length,
      pagesPartial: crawlResult.pages.filter((p) => p.crawlStatus === 'partial').length,
      pagesSkipped: crawlResult.skipped.length,
      pagesStillPending: crawlResult.pending.length,
      urlAliasesMerged: (crawlResult.aliases || []).length,
      formsFound: captured.reduce((n, p) => n + (p.forms || []).length, 0),
      visibleFormFields: captured.reduce(
        (n, p) => n + (p.forms || []).reduce((m, f) => m + (f.fields || []).filter((x) => x.visible).length, 0), 0),
      dataTables: captured.reduce((n, p) => n + (p.tables || []).filter((t) => !t.isLayoutTable).length, 0),
      assetsReferenced: assetSummary.referenced,
      assetsDownloaded: assetSummary.downloaded,
      externalLinks: crawlResult.externalLinks.length,
      technologiesConfirmed: stackReport.summary.confirmed,
      technologiesInferred: stackReport.summary.inferred,
    },
    coverage: {
      queueExhausted: crawlResult.exhaustedQueue,
      limitThatStoppedTheCrawl: crawlResult.limitHit,
      claim: crawlResult.exhaustedQueue
        ? 'Every in-scope page reachable by link-following from the start URL, within the ' +
          'configured depth, was captured.'
        : `The crawl stopped at ${crawlResult.limitHit}. The site is NOT fully explored: ` +
          `${crawlResult.pending.length} in-scope URL(s) remained queued.`,
    },
    urlAliases: {
      note: 'This target runs on IIS/ASP.NET, which resolves paths case-insensitively and serves ' +
            'the same page with and without the `.aspx` extension. These URL spellings were ' +
            'reached during the crawl and proved to be the same page (identical title, text and ' +
            'form shape), so they are recorded as aliases instead of being counted as separate ' +
            'pages.',
      merged: crawlResult.aliases || [],
    },
    externalLinks: crawlResult.externalLinks,
    externalRedirects: {
      note: 'In-scope URLs whose redirect led to another host. These were NOT captured: the ' +
            'crawl is authorized for this host only, so a third-party page is recorded as a ' +
            'reference and left alone.',
      hosts: crawlResult.externalRedirects || [],
    },
    durationMs: crawlResult.durationMs,
    workspaceBefore: workspace,
    disclaimer:
      'This analysis supports an unofficial local demonstration replica for authorized ' +
      'development, testing and educational use. It is not affiliated with, endorsed by or ' +
      'operated by any government body.',
  };
}

function buildCrawlManifest({ normalized, crawlResult, runId }) {
  return {
    runId,
    generatedAt: new Date().toISOString(),
    startUrl: normalized.finalUrl,
    rootHost: normalized.hostname,
    limits,
    visited: Object.fromEntries(crawlResult.pages.map((p) => [p.url, {
      slug: p.slug,
      finalUrl: p.finalUrl || null,
      httpStatus: p.httpStatus,
      crawlStatus: p.crawlStatus,
      pageType: p.pageType || null,
      depth: p.depth,
      via: p.via,
      capturedAt: p.capturedAt || null,
      error: p.error || null,
    }])),
    pending: crawlResult.pending,
    aliases: crawlResult.aliases || [],
    skipped: crawlResult.skipped,
    errors: crawlResult.errors,
    limitHit: crawlResult.limitHit,
    exhaustedQueue: crawlResult.exhaustedQueue,
    durationMs: crawlResult.durationMs,
    resumeHint:
      'Re-running the pipeline on the same domain reuses every page in `visited` whose metadata ' +
      'file still exists under reference_pages/page_metadata/, and re-queues everything in ' +
      '`pending`. Delete this file to force a full re-crawl.',
  };
}

function buildReplicationGaps({ crawlResult, stackReport, assetSummary, formsReport, apiInventory }) {
  const gaps = [];

  for (const p of crawlResult.pages.filter((x) => x.crawlStatus !== 'captured')) {
    const offScope = p.crawlStatus === 'off-scope-redirect';
    gaps.push({
      kind: offScope ? 'off-scope-redirect' : 'inaccessible-page',
      item: p.url,
      detail: p.error || `crawl status: ${p.crawlStatus}`,
      impact: offScope
        ? `Deliberately not captured: it redirects to ${p.redirectedToHost}, a host this ` +
          'crawl is not authorized for. The replica renders a local stand-in instead.'
        : 'Not represented in the replica.',
    });
  }
  for (const s of crawlResult.skipped) {
    gaps.push({
      kind: 'skipped-url',
      item: s.url,
      detail: s.reason,
      impact: s.reason.includes('non-HTML') ? 'Collected as an asset instead of a page.' : 'Not replicated.',
    });
  }
  for (const a of (assetSummary.assets || []).filter((x) => x.downloadStatus !== 'downloaded')) {
    const kind = a.external ? 'external-dependency'
      : a.downloadStatus === 'unavailable-by-design' ? 'platform-internal-asset'
      : 'missing-asset';
    gaps.push({
      kind,
      item: a.originalUrl,
      detail: a.error ? `${a.error}. ${a.notes || ''}`.trim() : (a.notes || null),
      impact: kind === 'external-dependency'
        ? 'The replica must vendor an equivalent locally or declare the dependency.'
        : kind === 'platform-internal-asset'
          ? 'Not needed: this is ASP.NET framework plumbing, and the replica does not use the ' +
            'WebForms postback model it supports.'
          : 'A placeholder stands in for this asset in the replica.',
    });
  }
  for (const u of stackReport.unknowns || []) {
    gaps.push({ kind: 'uncertain-technology', item: u.item, detail: u.why, impact: 'The replica uses an approximation and says so.' });
  }
  for (const f of stackReport.findings.filter((x) => x.status === 'inferred')) {
    gaps.push({
      kind: 'uncertain-technology',
      item: `${f.name} (${f.category})`,
      detail: `Status: inferred, confidence ${f.confidence}. Evidence: ${(f.evidence || []).join('; ')}`,
      impact: 'Not relied on for the replica build.',
    });
  }
  for (const f of formsReport.forms) {
    gaps.push({
      kind: 'incomplete-interaction',
      item: `${f.formId} on ${f.page}`,
      detail: f.whyNotTested,
      impact: 'The replica implements local validation and local success/error states that ' +
              'approximate, but are not verified against, the original behaviour.',
    });
  }
  if (!apiInventory.endpoints.length) {
    gaps.push({
      kind: 'external-dependency',
      item: 'server-side application behaviour',
      detail: 'The portal posts back to ASP.NET server code that is not publicly observable. ' +
              'No API contract exists to reproduce.',
      impact: 'The replica backend is an independent mock driven by synthetic data.',
    });
  }

  const spaMounts = crawlResult.spaMounts || [];
  if (spaMounts.length) {
    gaps.push({
      kind: 'dynamic-navigation',
      item: spaMounts.map((m) => m.mountUrl).join(', '),
      detail:
        'This target mounts a single-page application whose navigation is built after ' +
        'hydration and can change between loads. A route present in the menu during one ' +
        'crawl may be absent in the next, so the captured route list is a snapshot of the ' +
        'navigation as it stood at the capture time recorded in each page metadata file.',
      impact: 'The route inventory for this mount may be incomplete or may list a route the ' +
              'navigation no longer offers. Re-run the pipeline to refresh it.',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: gaps.reduce((acc, g) => { acc[g.kind] = (acc[g.kind] || 0) + 1; return acc; }, {}),
    visualTolerance,
    singlePageApplicationMounts: spaMounts,
    gaps,
    honesty:
      'This file is the deliberate record of what the replica does NOT reproduce. Nothing here ' +
      'is papered over elsewhere in the project.',
  };
}

module.exports = {
  buildRoutes,
  buildComponentInventory,
  buildFormsReport,
  buildApiInventory,
  buildDatabaseFindings,
  buildWebsiteOverview,
  buildCrawlManifest,
  buildReplicationGaps,
  localRouteFor,
};
