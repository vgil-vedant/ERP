/* ==========================================================================
   Department office: the officer workspace of one portal (/office).
   Talks only to its own portal's /office/api. Every value is escaped before
   it is drawn; every request failure is shown, never swallowed.
   ========================================================================== */
(function () {
  'use strict';

  var boot;
  try { boot = JSON.parse(document.getElementById('office-boot').textContent); } catch (e) { boot = null; }
  var root = document.getElementById('office');
  if (!boot || !root) return;

  // ---------------------------------------------------------------- helpers
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : String(v || '');
  }
  function fmtStamp(v) {
    if (!v) return '';
    if (/Z$/.test(v) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
      var d = new Date(/Z$/.test(v) ? v : v.replace(' ', 'T') + 'Z');
      if (!isNaN(d)) return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    }
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(String(v));
    return m ? fmtDate(m[1]) + ', ' + m[2] + ':' + m[3] : fmtDate(v);
  }
  function ago(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return '';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return s + ' s ago';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return fmtStamp(iso);
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function cap(s) { s = String(s || '').replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function ms(n) { return n == null ? '' : n < 1000 ? n + ' ms' : (n / 1000).toFixed(1) + ' s'; }

  var I = {
    dash: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bus: '<path d="M4 12h4l3-7 4 14 3-7h2"/>',
    log: '<path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    retry: '<path d="M4 4v6h6"/><path d="M20 12a8 8 0 0 0-14.9-4L4 10m16 10v-6h-6"/><path d="M4 12a8 8 0 0 0 14.9 4l1.1-2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>'; }

  // ---------------------------------------------------------------- network
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    if (init.method !== 'GET') init.headers['X-Office-Request'] = '1';
    return fetch('/office/api' + path, init).then(function (res) {
      return res.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
        if (res.status === 401) { location.href = '/office/login'; throw { status: 401, message: 'Your session has ended.' }; }
        if (!res.ok) throw { status: res.status, message: (body && body.error) || ('The office answered HTTP ' + res.status + '.'), errors: body && body.errors };
        if (!body) throw { status: res.status, message: 'The office sent an unreadable answer.' };
        return body;
      });
    }, function () {
      throw { status: 0, message: 'The office could not be reached. Check the connection and try again.' };
    });
  }

  // ---------------------------------------------------------------- shell
  var state = { types: [], forms: [], counts: {} };
  var skin = boot.skin || '';
  var meOffice = skin === 'cctns' ? '<span class="of-me-office">' + esc(boot.officer.office) + '</span>' : '';
  var rightHtml = ''
    + '<a class="of-erp-chip" href="#/integration" id="erpChip" title="Delivery of this department’s records to the ERP"><i></i><span>ERP link</span></a>'
    + '<div class="of-me"><b>' + esc(boot.officer.name) + '</b><span>' + esc(boot.officer.designation) + '</span>' + meOffice + '</div>'
    + '<form method="post" action="/office/logout"><button class="of-btn of-btn--sm" type="submit">' + svg('out') + '<span>Sign out</span></button></form>';
  var footHtml = '<footer class="of-foot">' + esc(boot.officer.office) + ' · signed in as ' + esc(boot.officer.username) + ' · records of this department are delivered to the ERP through the integration bus</footer>';
  var menuBtn = '<button class="of-btn of-btn--sm of-menu-btn" type="button" aria-label="Open the menu" data-menu>' + svg('menu') + '</button>';
  if (skin) {
    // A department whose office wears its portal's header: a notice, the logo bar and a navigation bar.
    // Some portals keep the officer's tools in a strip above the logo (UIDAI); others in the logo bar itself.
    var toolsInHeader = skin === 'eforensics' || skin === 'cctns';
    var sidebarNav = skin === 'cctns';   // CCTNS keeps the navigation as a left sidebar, the others as a bar under the header
    root.innerHTML = ''
      + '<div class="u-banner" role="note"><strong>Unofficial Local Demonstration — Not an Official Government Service.</strong> <span>Synthetic data only. Nothing here is submitted to any government system.</span></div>'
      + '<div class="of-app" id="ofApp">'
      + (toolsInHeader ? '' : '<div class="u-top"><div class="u-shell u-top-in"><span class="u-top-label">Officer workspace</span><div class="of-top-right">' + rightHtml + '</div></div></div>')
      + '<header class="of-top"><div class="u-shell u-brand-in">' + menuBtn
      + '<a class="of-top-logo" href="#/" aria-label="Dashboard"><img src="' + esc(boot.logo) + '" alt="' + esc(boot.portal) + '"></a>'
      + '<div class="of-top-title"' + (boot.seal ? ' style="--seal:url(' + esc(boot.seal) + ')"' : '') + '><b>' + esc(boot.title) + '</b><span>Officer workspace · ' + esc(boot.tagline) + '</span></div>'
      + (toolsInHeader ? '<div class="of-top-right">' + rightHtml + '</div>' : '')
      + '</div></header>'
      + (sidebarNav
        ? '<div class="of-body"><nav class="of-nav" id="ofNav" aria-label="Office navigation"></nav><main class="of-main" id="ofMain" tabindex="-1"></main></div>'
        : '<div class="u-navbar"><div class="u-shell"><nav class="of-nav" id="ofNav" aria-label="Office navigation"></nav></div></div>'
          + '<div class="of-body"><main class="of-main" id="ofMain" tabindex="-1"></main></div>')
      + footHtml
      + '</div><div class="of-toasts" aria-live="polite" id="ofToasts"></div>';
  } else {
    root.innerHTML = ''
      + '<div class="of-notice">Unofficial local demonstration — not an official government service. Synthetic data only.</div>'
      + '<div class="of-app" id="ofApp">'
      + '<header class="of-top">' + menuBtn
      + '<a class="of-top-logo" href="#/" aria-label="Dashboard"><img src="' + esc(boot.logo) + '" alt="' + esc(boot.portal) + '"></a>'
      + '<div class="of-top-title"><b>' + esc(boot.title) + '</b><span>Officer workspace · ' + esc(boot.tagline) + '</span></div>'
      + '<div class="of-top-right">' + rightHtml + '</div></header>'
      + '<div class="of-body"><nav class="of-nav" id="ofNav" aria-label="Office navigation"></nav>'
      + '<main class="of-main" id="ofMain" tabindex="-1"></main></div>'
      + footHtml
      + '</div><div class="of-toasts" aria-live="polite" id="ofToasts"></div>';
  }
  var app = document.getElementById('ofApp');
  var nav = document.getElementById('ofNav');
  var main = document.getElementById('ofMain');
  var toasts = document.getElementById('ofToasts');
  var erpChip = document.getElementById('erpChip');

  function toast(title, body, tone) {
    var t = document.createElement('div');
    t.className = 'of-toast of-toast--' + (tone || 'ok');
    t.innerHTML = '<b>' + esc(title) + '</b>' + (body ? esc(body) : '');
    toasts.appendChild(t);
    setTimeout(function () { t.remove(); }, 5200);
  }

  function renderNav() {
    var h = location.hash || '#/';
    var link = function (href, icon, label, n, extra) {
      var active = href === '#/' ? (h === '#/' || h === '#' || h === '') : h.indexOf(href) === 0;
      var cls = (active ? 'is-active ' : '') + (extra || '');
      return '<a href="' + href + '"' + (cls ? ' class="' + cls.trim() + '"' : '') + (active ? ' aria-current="page"' : '') + '>' + svg(icon) + '<span>' + esc(label) + '</span>' + (n != null ? '<span class="of-nav-n">' + n + '</span>' : '') + '</a>';
    };
    nav.innerHTML = '<div class="of-nav-group">Office</div>' + link('#/', 'dash', 'Dashboard')
      + '<div class="of-nav-group">Records</div>'
      + state.types.map(function (t) { return link('#/records?type=' + t.key, 'list', t.plural, state.counts[t.key]); }).join('')
      + link('#/records?all', 'list', 'All records')
      + '<div class="of-nav-group">New entry</div>'
      + state.forms.map(function (f) { return link('#/new/' + f.key, 'plus', f.title, null, 'of-nav-new'); }).join('')
      + '<div class="of-nav-group">Integration</div>' + link('#/integration', 'bus', 'Delivery to the ERP') + link('#/activity', 'log', 'Activity log');
  }

  function setErpChip(stats) {
    erpChip.classList.remove('is-ok', 'is-warn', 'is-down');
    if (!stats) { erpChip.classList.add('is-down'); erpChip.title = 'The delivery status could not be read.'; return; }
    var cls = stats.lastError ? 'is-down' : stats.pending || stats.rejected ? 'is-warn' : 'is-ok';
    erpChip.classList.add(cls);
    erpChip.querySelector('span').textContent = stats.lastError ? 'ERP unreachable' : stats.pending ? stats.pending + ' to deliver' : 'ERP in sync';
    erpChip.title = stats.lastError ? 'Last error: ' + stats.lastError : (stats.lastDeliveredAt ? 'Last delivery ' + ago(stats.lastDeliveredAt) : 'Nothing delivered yet');
  }
  function pollErp() {
    api('/integration?events=0').then(function (b) { setErpChip(b.stats); }, function () { setErpChip(null); });
  }

  // ---------------------------------------------------------------- routing
  var current = 0;
  function route() {
    var token = ++current;
    app.classList.remove('nav-open');
    var scrim = document.querySelector('.of-scrim');
    if (scrim) scrim.remove();
    closeDialog();
    renderNav();
    var h = (location.hash || '#/').slice(1);
    var path = h.split('?')[0] || '/';
    var params = new URLSearchParams(h.split('?')[1] || '');
    var m;
    main.innerHTML = '<div class="of-card"><div class="of-skel" style="width:40%"></div><div class="of-skel"></div><div class="of-skel" style="width:70%"></div></div>';
    var done = function (p) {
      return Promise.resolve(p).then(function () {
        if (token !== current) return;
        var h1 = main.querySelector('h1');
        if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      }, function (e) { if (token === current) failure(e); });
    };
    if (path === '/' || path === '') return done(dashboard(token));
    if (path === '/records') return done(records(params, token));
    if ((m = /^\/record\/(\d+)$/.exec(path))) return done(recordView(Number(m[1]), token));
    if ((m = /^\/new\/([\w-]+)$/.exec(path))) return done(newForm(m[1], token));
    if (path === '/integration') return done(integration(token));
    if (path === '/activity') return done(activity(token));
    main.innerHTML = page('Page not found', 'There is no page at this address.', '') + '<div class="of-card"><a class="of-btn" href="#/">Go to the dashboard</a></div>';
  }
  function failure(e) {
    main.innerHTML = '<div class="of-card"><div class="of-alert of-alert--danger" role="alert"><b>' + esc((e && e.message) || 'Something went wrong.') + '</b></div>'
      + '<button class="of-btn" type="button" data-reload>' + svg('retry') + 'Try again</button></div>';
  }
  function page(title, desc, actions, kicker) {
    return '<div class="of-head"><div>' + (kicker ? '<div class="of-kicker">' + esc(kicker) + '</div>' : '') + '<h1>' + esc(title) + '</h1>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>'
      + (actions ? '<div class="of-head-actions">' + actions + '</div>' : '') + '</div>';
  }
  function pill(text, tone) { return '<span class="of-pill of-pill--' + (tone || 'neutral') + '">' + esc(text) + '</span>'; }
  function stateTone(p, status) {
    if (!p) return 'neutral';
    var s = p.current >= 0 ? p.steps[p.current].state : 'completed';
    return { completed: 'ok', active: 'info', blocked: 'warn', failed: 'danger' }[s] || 'neutral';
  }
  function bar(p) {
    if (!p || !p.steps) return '';
    return '<div class="of-bar" aria-hidden="true">' + p.steps.map(function (s) { return '<i class="' + esc(typeof s === 'string' ? s : s.state) + '"></i>'; }).join('') + '</div>';
  }
  /** A delivery dot; `quiet` when the words next to it already say the same. */
  function erpDot(status, quiet) {
    var label = { delivered: 'Delivered to the ERP', pending: 'Waiting to be delivered', rejected: 'Refused by the ERP' }[status] || 'Not sent';
    return '<span class="of-dot of-dot--' + esc(status || 'none') + '"' + (quiet ? ' aria-hidden="true"' : ' title="' + esc(label) + '"') + '></span>' + (quiet ? '' : '<span class="of-sr">' + esc(label) + '</span>');
  }

  // ---------------------------------------------------------------- dashboard
  function dashboard(token) {
    return api('/summary').then(function (s) {
      if (token !== current) return;
      s.types.forEach(function (t) { state.counts[t.type] = t.total; });
      renderNav();
      setErpChip(s.integration);
      var kpis = s.types.map(function (t) {
        return '<a class="of-kpi" href="#/records?type=' + esc(t.type) + '"><span>' + esc(t.plural) + '</span><b>' + t.total + '</b><em>' + (t.open != null ? t.open + ' open' : 'on record') + '</em></a>';
      }).join('') + '<div class="of-kpi"><span>People</span><b>' + s.people + '</b><em>' + s.createdThisWeek + ' records added this week</em></div>';
      var attn = (s.attention || []).map(function (a) {
        var href = a.status ? '#/records?status=' + encodeURIComponent(a.status) : '#/records?all';
        return '<li class="' + (a.tone === 'warning' && a.n ? 'is-warn' : '') + '"><a href="' + href + '"><span>' + esc(a.label) + '</span><b>' + a.n + '</b></a></li>';
      }).join('');
      var recent = s.recent.length ? '<div class="of-table-wrap"><table class="of-table"><thead><tr><th scope="col">Record</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span class="of-sr">ERP</span></th></tr></thead><tbody>'
        + s.recent.map(function (r) {
          return '<tr class="is-link" data-href="#/record/' + r.id + '"><td class="of-cell-main"><a href="#/record/' + r.id + '">' + esc(r.title) + '</a><span>' + esc(r.typeLabel + ' · ' + r.subtitle) + '</span></td>'
            + '<td>' + pill(r.statusLabel || 'Recorded', 'neutral') + '</td><td class="of-muted">' + esc(fmtStamp(r.updatedAt)) + '</td><td>' + erpDot(r.erp) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="of-empty"><b>No records yet</b>Use New entry to record the first one.</div>';
      var i = s.integration;
      main.innerHTML = page('Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') + ', ' + boot.officer.name.split(' ')[0],
        boot.officer.designation + ', ' + boot.officer.office + '. What this department holds today, and what needs attention.',
        state.forms.slice(0, 2).map(function (f, k) { return '<a class="of-btn' + (k === 0 ? ' of-btn--primary' : '') + '" href="#/new/' + esc(f.key) + '">' + svg('plus') + esc(f.title) + '</a>'; }).join(''), boot.title)
        + '<div class="of-grid of-grid--kpi">' + kpis + '</div>'
        + '<div class="of-grid of-grid--2" style="margin-top:16px">'
        + '<section class="of-card"><div class="of-card-head"><div><h2>Recently updated</h2><p>The latest changes in this office.</p></div><a class="of-btn of-btn--sm" href="#/records?all">All records</a></div>' + recent + '</section>'
        + '<div>'
        + (attn ? '<section class="of-card"><div class="of-card-head"><div><h2>Needs attention</h2><p>Open work, by stage.</p></div></div><ul class="of-attn">' + attn + '</ul></section>' : '')
        + '<section class="of-card"><div class="of-card-head"><div><h2>Delivery to the ERP</h2><p>Every record change is sent to the ERP as it is saved.</p></div>'
        + pill(i.lastError ? 'Retrying' : i.pending ? 'Delivering' : 'In sync', i.lastError ? 'danger' : i.pending ? 'warn' : 'ok') + '</div>'
        + '<dl class="of-kv"><div><dt>Delivered</dt><dd>' + i.delivered + '</dd></div><div><dt>Waiting</dt><dd>' + i.pending + '</dd></div>'
        + '<div><dt>Median delivery time</dt><dd>' + (i.medianLatencyMs != null ? esc(ms(i.medianLatencyMs)) : '—') + '</dd></div><div><dt>Last delivery</dt><dd>' + (i.lastDeliveredAt ? esc(ago(i.lastDeliveredAt)) : '—') + '</dd></div>'
        + (i.lastError ? '<div class="is-wide"><dt>Last error</dt><dd class="of-error">' + esc(i.lastError) + '</dd></div>' : '') + '</dl>'
        + '<div style="margin-top:12px"><a class="of-btn of-btn--sm" href="#/integration">Open the delivery log</a></div></section>'
        + '</div></div>';
    });
  }

  // ---------------------------------------------------------------- records list
  var statusOptions = {};
  function records(params, token) {
    var type = params.get('type') || '';
    var status = params.get('status') || '';
    var q = params.get('q') || '';
    var pg = Number(params.get('page')) || 1;
    var qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (status) qs.set('status', status);
    if (q) qs.set('q', q);
    qs.set('page', pg);
    return api('/records?' + qs.toString()).then(function (b) {
      if (token !== current) return;
      var t = state.types.find(function (x) { return x.key === type; });
      b.rows.forEach(function (r) { if (r.status) statusOptions[r.status] = r.statusLabel || cap(r.status); });
      if (status && !statusOptions[status]) statusOptions[status] = cap(status);
      var typeSel = '<select class="of-select" id="fType" aria-label="Kind of record"><option value="">All kinds</option>' + state.types.map(function (x) { return '<option value="' + esc(x.key) + '"' + (x.key === type ? ' selected' : '') + '>' + esc(x.plural) + '</option>'; }).join('') + '</select>';
      var stSel = '<select class="of-select" id="fStatus" aria-label="Status"><option value="">Any status</option>' + Object.keys(statusOptions).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === status ? ' selected' : '') + '>' + esc(statusOptions[k]) + '</option>'; }).join('') + '</select>';
      var rows = b.rows.map(function (r) {
        return '<tr class="is-link" data-href="#/record/' + r.id + '"><td class="of-cell-main"><a href="#/record/' + r.id + '">' + esc(r.title) + '</a><span>' + esc(r.subtitle) + '</span></td>'
          + '<td>' + esc(r.typeLabel) + '</td><td>' + pill(r.statusLabel || 'Recorded', stateTone(r.progress && { current: r.progress.current, steps: r.progress.steps.map(function (s) { return { state: s }; }) })) + bar(r.progress) + '</td>'
          + '<td class="of-muted">' + esc(fmtStamp(r.updatedAt)) + '</td><td>' + erpDot(r.erp) + '</td></tr>';
      }).join('');
      main.innerHTML = page(t ? t.plural : 'All records', 'Search by name, record number, Aadhaar or mobile number. Select a record to open it.', state.forms.filter(function (f) { return !type || f.recordType === type; }).slice(0, 2).map(function (f) { return '<a class="of-btn of-btn--primary" href="#/new/' + esc(f.key) + '">' + svg('plus') + esc(f.title) + '</a>'; }).join(''))
        + '<section class="of-card"><form class="of-toolbar" id="fForm" role="search">'
        + '<div class="of-field of-field--search"><label class="of-label" for="fQ">Search</label><input class="of-input" id="fQ" type="search" maxlength="80" value="' + esc(q) + '" placeholder="Name, number, Aadhaar or mobile"></div>'
        + '<div class="of-field"><label class="of-label" for="fType">Kind</label>' + typeSel + '</div>'
        + '<div class="of-field"><label class="of-label" for="fStatus">Status</label>' + stSel + '</div>'
        + '<button class="of-btn of-btn--primary" type="submit">Search</button></form>'
        + (b.rows.length ? '<div class="of-table-wrap"><table class="of-table"><thead><tr><th scope="col">Record</th><th scope="col">Kind</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span class="of-sr">Delivered to the ERP</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="of-empty"><b>No records match</b>' + (q || status ? 'Change the search or the filters.' : 'Nothing has been recorded here yet.') + '</div>')
        + (b.pages > 1 ? '<div class="of-pager"><span>' + esc(plural(b.total, 'record')) + ' · page ' + b.page + ' of ' + b.pages + '</span><div>'
          + '<button class="of-btn of-btn--sm" type="button" data-page="' + (b.page - 1) + '"' + (b.page <= 1 ? ' disabled' : '') + '>Previous</button>'
          + '<button class="of-btn of-btn--sm" type="button" data-page="' + (b.page + 1) + '"' + (b.page >= b.pages ? ' disabled' : '') + '>Next</button></div></div>'
          : '<div class="of-pager"><span>' + esc(plural(b.total, 'record')) + '</span></div>')
        + '</section>';
      var go = function (page) {
        var p = new URLSearchParams();
        var tv = document.getElementById('fType').value;
        var sv = document.getElementById('fStatus').value;
        var qv = document.getElementById('fQ').value.trim();
        if (tv) p.set('type', tv);
        if (sv) p.set('status', sv);
        if (qv) p.set('q', qv);
        if (page > 1) p.set('page', page);
        var s = p.toString();
        location.hash = '#/records' + (s ? '?' + s : '?all');
      };
      document.getElementById('fForm').addEventListener('submit', function (e) { e.preventDefault(); go(1); });
      document.getElementById('fType').addEventListener('change', function () { go(1); });
      document.getElementById('fStatus').addEventListener('change', function () { go(1); });
      Array.prototype.forEach.call(main.querySelectorAll('[data-page]'), function (btn) { btn.addEventListener('click', function () { go(Number(btn.getAttribute('data-page'))); }); });
    });
  }

  // ---------------------------------------------------------------- record detail
  var LABEL = {
    fir_no: 'FIR number', fir_year: 'FIR year', police_station: 'Police station', district: 'District', state: 'State', registered_on: 'Registered on',
    offence: 'Offence', sections: 'Sections of law', acts: 'Acts and sections', investigating_officer: 'Investigating officer', accused: 'Accused', complainants: 'Complainants',
    request_id: 'Request number', service: 'Service', purpose: 'Purpose', requester_role: 'Requested by', lawful_basis: 'Lawful basis', consent: 'Consent',
    subject: 'Subject', certificate_no: 'Certificate number', outcome: 'Outcome', service_available: 'Service available', blocked_reason: 'Blocked because', deferred_reason: 'Deferred because',
    lab_case_no: 'Laboratory case number', laboratory: 'Laboratory', division: 'Division', receipt: 'Counter receipt', case: 'Case', case_number: 'Case number', case_date: 'Case date',
    fir_number: 'FIR number', mlc_number: 'Medico-legal case no.', post_mortem_number: 'Post-mortem no.', hospital: 'Hospital', history: 'History of the case', subject_category: 'Category of the person',
    forwarding_authority: 'Forwarding authority', memo_number: 'Forwarding memo', exhibits: 'Exhibits', questions: 'Questions for the laboratory', seal: 'Seal', transport: 'Transport',
    custody_events: 'Chain of custody', declaration: 'Declaration', storage_device_supplied: 'Storage device supplied', report: 'Report', deficiency: 'Deficiency', dates: 'Dates',
    cnr: 'CNR', case_type: 'Case type', case_no: 'Case number', filing_no: 'Filing number', court: 'Court', court_complex: 'Court complex', case_state: 'Case state',
    filed_on: 'Filed on', disposed_on: 'Disposed on', judgment: 'Judgment', appeal: 'Appeal', nature: 'Nature of the suit', parties: 'Parties', petitioner: 'Petitioner',
    respondent: 'Respondent', witnesses: 'Witnesses', prosecutor: 'Prosecutor', defence_advocate: 'Advocate', hearings: 'Hearing history', next_hearing: 'Next hearing', orders: 'Orders', last_order: 'Last order',
    prisoner_no: 'Prisoner number', earlier_numbers: 'Earlier prisoner numbers', prison: 'Prison', category: 'Category', in_custody: 'In custody', inmate: 'Prisoner as recorded',
    admitted_on: 'Admitted on', warrant: 'Warrant', fir: 'FIR', sentence: 'Sentence', expected_release: 'Expected release', released_on: 'Released on', release_reason: 'Release reason',
    next_production: 'Next court production', aadhaar_linked: 'Aadhaar linked', furlough: 'Furlough and parole', visits_received: 'Visits received',
    registration_no: 'Registration number', visit_date: 'Visit date', visit_mode: 'Visit mode', prisoner: 'Prisoner', visitor: 'Visitor', relationship: 'Relationship',
    identity_proof: 'Identity proof', international_visitor: 'International visitor', additional_visitors: 'Additional visitors', additional_names: 'Names of additional visitors', slot: 'Slot', rejection_reason: 'Rejection reason',
    message: 'Message', relation: 'Relation', action: 'Action taken',
    aadhaar_masked: 'Aadhaar number', uid_token: 'UID token', poi: 'Proof of identity data', poa: 'Address', resident_status: 'Resident status', enrolment: 'Enrolment', biometrics: 'Biometrics',
    contact: 'Contact', aadhaar_status: 'Aadhaar status', last_updated_on: 'Last updated', verification: 'Verification', eid: 'Enrolment ID', basis: 'Basis', applicant: 'Applicant',
    address: 'Address', documents: 'Documents', hof: 'Head of Family', centre: 'Enrolment centre', submitted_at: 'Submitted', urn: 'Update request number', update_items: 'Information to update',
    channel: 'Channel', applicant_name: 'Applicant', fee: 'Fee', requested: 'Requested changes', verification_note: 'Verification', rejection_reason_text: 'Reason', resubmission: 'Resubmission',
    name: 'Name', gender: 'Gender', dob: 'Date of birth', dob_basis: 'Date of birth is', care_of: 'Care of', age: 'Age', father_name: 'Father’s name', father_or_husband: 'Father / husband',
    rank_name: 'Rank', objection: 'Objection', reopened_on: 'Reopened on', outcome_text: 'Outcome', mobile: 'Mobile', email: 'E-mail', date: 'Date', mode: 'Mode', business: 'Business',
    type: 'Type', title: 'Title', serial: 'No.', description: 'Description', quantity: 'Quantity', preservative: 'Preservative', source: 'Source', collected_by: 'Collected by', collected_at: 'Collected at',
    seq: '#', at: 'When', from: 'From', to: 'To', seal_state: 'Seal', receipt_no: 'Receipt', reg_no: 'Registration', days: 'Days', kind: 'Kind', returned: 'Returned',
    ready_on: 'Ready on', dispatched_on: 'Dispatched on', note: 'Note', number: 'Number', issued_at: 'Issued at', status: 'Status', text: 'Result', performed_at: 'Performed at', method: 'Method', artefact: 'Artefact',
  };
  var HIDE = { role: 1, est: 1, year: 1, case_abbr: 1, links: 1, party_role: 1, subject_category: 1, offence_key: 1, petitioner_ref: 1, respondent_ref: 1 };
  var GENDER = { M: 'Male', F: 'Female', T: 'Third gender' };

  function value(key, v) {
    if (v == null || v === '') return null;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (key === 'gender' && GENDER[v]) return esc(GENDER[v]);
    if (typeof v === 'number') return esc(v);
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return esc(fmtDate(v));
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return esc(fmtStamp(v));
      return esc(v);
    }
    if (Array.isArray(v)) {
      if (!v.length) return null;
      if (v[0] && typeof v[0] === 'object' && 'act' in v[0] && 'section' in v[0]) return v.map(function (s) { return pill(s.section + ' ' + s.act); }).join(' ');
      if (typeof v[0] !== 'object') return v.map(esc).join(', ');
      return null;
    }
    if (typeof v === 'object') {
      if ('rank_name' in v && 'name' in v) return esc(v.rank_name + ' ' + v.name) + (v.rank_rule_satisfied ? ' ' + pill('Rank rule met', 'ok') : '');
      if ('value' in v && 'unit' in v) return esc(v.value + ' ' + v.unit);
      if ('house' in v && ('pc' in v || 'pin' in v)) return esc([v.co, v.house, v.street, v.lm, v.loc, v.vtc, v.dist, v.state, v.pc].filter(Boolean).join(', '));
      if ('date' in v && 'purpose' in v && Object.keys(v).length <= 4) return esc(fmtDate(v.date) + ' · ' + v.purpose + (v.mode ? ' · ' + v.mode : ''));
      return null;
    }
    return esc(v);
  }
  function kv(obj, depth) {
    var simple = [], subs = [];
    Object.keys(obj || {}).forEach(function (k) {
      if (HIDE[k] || /(^|_)ref$/.test(k)) return;
      var v = obj[k];
      var shown = value(k, v);
      if (shown != null) { simple.push('<div' + (String(v).length > 80 ? ' class="is-wide"' : '') + '><dt>' + esc(LABEL[k] || cap(k)) + '</dt><dd>' + shown + '</dd></div>'); return; }
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') subs.push(table(LABEL[k] || cap(k), v));
      else if (v && typeof v === 'object' && !Array.isArray(v) && depth < 2) {
        var inner = kv(v, depth + 1);
        if (inner) subs.push('<h3 class="of-sub-h">' + esc(LABEL[k] || cap(k)) + '</h3>' + inner);
      }
    });
    return (simple.length ? '<dl class="of-kv">' + simple.join('') + '</dl>' : '') + subs.join('');
  }
  function table(title, rows) {
    var cols = [];
    rows.forEach(function (r) { Object.keys(r || {}).forEach(function (k) { if (cols.indexOf(k) < 0 && !/(^|_)ref$/.test(k)) cols.push(k); }); });
    return '<h3 class="of-sub-h">' + esc(title) + ' (' + rows.length + ')</h3><div class="of-table-wrap"><table class="of-table"><thead><tr>'
      + cols.map(function (c) { return '<th scope="col">' + esc(LABEL[c] || cap(c)) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rows.map(function (r) { return '<tr>' + cols.map(function (c) { var x = value(c, r[c]); return '<td>' + (x == null ? '<span class="of-muted">—</span>' : x) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table></div>';
  }

  function recordView(id, token) {
    return api('/records/' + id).then(function (r) {
      if (token !== current) return;
      drawRecord(r);
    });
  }
  function drawRecord(r) {
    var tone = stateTone(r.progress, r.status);
    var erp = r.erp
      ? (r.erp.status === 'delivered' ? '<span class="of-erp-line">' + erpDot('delivered', true) + 'Delivered to the ERP' + (r.erp.latencyMs != null ? ' in ' + esc(ms(r.erp.latencyMs)) : '') + (r.erp.deliveredAt ? ', ' + esc(ago(r.erp.deliveredAt)) : '') + '</span>'
        : r.erp.status === 'pending' ? '<span class="of-erp-line">' + erpDot('pending', true) + 'Waiting to be delivered to the ERP' + (r.erp.error ? ': ' + esc(r.erp.error) : '') + '</span>'
          : '<span class="of-erp-line">' + erpDot('rejected', true) + 'The ERP refused this record: ' + esc(r.erp.error || '') + '</span>')
      : '';
    var actions = r.actions.length ? '<div class="of-actions"><span class="of-actions-label">Next step</span>' + r.actions.map(function (a) {
      return '<button class="of-btn of-btn--' + esc(a.tone === 'neutral' ? 'ghost' : a.tone) + '" type="button" data-action="' + esc(a.key) + '">' + esc(a.label) + '</button>';
    }).join('') + '</div>' : '';
    var parties = r.parties.map(function (p) {
      var ids = Object.keys(p.identifiers || {}).map(function (k) { return esc(cap(k)) + ' <span class="of-mono">' + esc(p.identifiers[k]) + '</span>'; }).join(' · ');
      return '<div class="of-party"><b>' + esc(p.name) + '</b><span>' + esc(cap(p.label || p.role)) + (p.relation ? ' · ' + esc(p.relation) : '') + (p.gender ? ' · ' + esc(GENDER[p.gender] || p.gender) : '') + '</span>'
        + (ids ? '<span>' + ids + '</span>' : '') + '<span class="of-muted of-mono">' + esc(p.ref) + '</span></div>';
    }).join('');
    var hist = (r.history || []).slice().reverse().map(function (h) { return '<li><time>' + esc(fmtDate(h.at)) + '</time><i></i><span>' + esc(cap(h.status)) + '</span></li>'; }).join('');
    var acts = (r.activity || []).map(function (a) { return '<li><time>' + esc(fmtStamp(a.at)) + '</time><i></i><span><b>' + esc(cap(a.action.toLowerCase())) + '</b> by ' + esc(a.officer) + (a.details ? ': ' + esc(a.details) : '') + '</span></li>'; }).join('');
    main.innerHTML = '<div class="of-head"><div><a class="of-btn of-btn--sm of-btn--ghost" href="#/records?type=' + esc(r.type) + '">' + svg('back') + 'Back to the list</a></div></div>'
      + '<section class="of-card"><div class="of-rec-head"><div><div class="of-kicker">' + esc(r.typeLabel) + '</div><h1 class="of-rec-title">' + esc(r.title) + '</h1><p class="of-rec-sub">' + esc(r.subtitle) + '</p></div>'
      + '<div class="of-rec-chips">' + pill(r.statusLabel || 'Recorded', tone) + '</div></div>'
      + '<div style="margin-top:10px">' + erp + '</div>'
      + (r.progress ? '<div class="of-stepper-wrap" id="ofStepper"></div>' : '')
      + actions + '</section>'
      + '<section class="of-card"><div class="of-card-head"><div><h2>People on this record</h2></div></div><div class="of-parties">' + (parties || '<p class="of-muted">No person is linked.</p>') + '</div></section>'
      + '<section class="of-card"><div class="of-card-head"><div><h2>Details</h2><p>Record ' + esc(r.ref) + ' · created by ' + esc(r.createdBy) + ' · version ' + esc(r.version) + '</p></div></div>' + kv(r.data, 0) + '</section>'
      + '<div class="of-grid of-grid--2" style="margin-top:16px">'
      + '<section class="of-card"><div class="of-card-head"><div><h2>Status history</h2></div></div>' + (hist ? '<ol class="of-timeline">' + hist + '</ol>' : '<p class="of-muted">This kind of record has no status history.</p>') + '</section>'
      + '<section class="of-card"><div class="of-card-head"><div><h2>Activity</h2></div></div>' + (acts ? '<ol class="of-timeline">' + acts + '</ol>' : '<p class="of-muted">No officer has acted on this record yet.</p>') + '</section>'
      + '</div>';
    if (r.progress && window.WorkflowProgressCard) {
      document.getElementById('ofStepper').appendChild(window.WorkflowProgressCard.create({ flat: true, title: r.progress.title, statusLabel: r.progress.statusLabel, steps: r.progress.steps }));
    }
    Array.prototype.forEach.call(main.querySelectorAll('[data-action]'), function (b) {
      b.addEventListener('click', function () {
        var a = r.actions.find(function (x) { return x.key === b.getAttribute('data-action'); });
        if (a) openAction(r, a, b);
      });
    });
  }

  // ---------------------------------------------------------------- forms
  var VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  var VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  function verhoeff(n) { var c = 0, a = String(n).split('').reverse(); for (var i = 0; i < a.length; i++) c = VD[c][VP[i % 8][Number(a[i])]]; return c === 0; }

  function applies(f, vals) {
    var w = f.when;
    if (!w) return true;
    var v = vals[w.field];
    if (w.is !== undefined) return v === w.is;
    if (w.in) return w.in.indexOf(v) >= 0;
    if (w.truthy) return !!v && !(Array.isArray(v) && !v.length);
    if (w.includes !== undefined) return Array.isArray(v) && v.indexOf(w.includes) >= 0;
    if (w.not !== undefined) return v != null && v !== '' && String(v) !== String(w.not);
    return true;
  }
  function opts(f) { return (f.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; }); }
  var uid = 0;

  function fieldHTML(f, name, value) {
    var id = 'f' + (++uid);
    var req = f.required && f.type !== 'checkbox';
    var w = f.width ? ' of-field--' + f.width : '';
    var common = ' id="' + id + '" data-name="' + esc(name) + '" aria-describedby="' + id + '-e' + (f.help ? ' ' + id + '-h' : '') + '"' + (req ? ' aria-required="true"' : '');
    var v = value == null ? (f.defaultToday ? today() : f.default != null ? f.default : '') : value;
    var control;
    switch (f.type) {
      case 'textarea':
        control = '<textarea class="of-textarea"' + common + ' rows="' + (f.rows || 3) + '" maxlength="' + (f.max || 2000) + '">' + esc(v) + '</textarea>'; break;
      case 'select': {
        var list = opts(f);
        control = '<select class="of-select"' + common + (list.length ? '' : ' disabled') + '><option value="">' + (list.length ? 'Choose…' : esc(f.empty || 'Nothing to choose from')) + '</option>'
          + list.map(function (o) { return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(v) ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select>';
        break;
      }
      case 'checkbox':
        return '<div class="of-field' + w + '" data-wrap="' + esc(name) + '"><label class="of-check"><input type="checkbox"' + common + (v === true ? ' checked' : '') + '><span>' + esc(f.label) + '</span></label><div class="of-error" id="' + id + '-e" hidden></div></div>';
      case 'checkboxes': case 'multiselect': {
        var sel = Array.isArray(v) ? v : [];
        control = '<div class="of-checks" role="group" aria-labelledby="' + id + '-l"' + ' id="' + id + '" data-name="' + esc(name) + '" data-multi="1">'
          + opts(f).map(function (o) { return '<label class="of-check"><input type="checkbox" value="' + esc(o.value) + '"' + (sel.indexOf(o.value) >= 0 ? ' checked' : '') + '><span>' + esc(o.label) + '</span></label>'; }).join('') + '</div>';
        break;
      }
      case 'number':
        control = '<input class="of-input" type="number" inputmode="numeric"' + common + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.integer === false ? ' step="any"' : ' step="1"') + ' value="' + esc(v) + '">'; break;
      case 'date':
        control = '<input class="of-input" type="date"' + common + (f.notFuture ? ' max="' + today() + '"' : '') + (f.notPast ? ' min="' + today() + '"' : '') + ' value="' + esc(v) + '">'; break;
      case 'datetime':
        control = '<input class="of-input" type="datetime-local"' + common + (f.notFuture ? ' max="' + today() + 'T23:59"' : '') + ' value="' + esc(v) + '">'; break;
      case 'aadhaar':
        control = '<input class="of-input of-mono" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="12 digits"' + common + ' value="' + esc(v) + '">'; break;
      case 'mobile':
        control = '<input class="of-input" type="tel" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="10 digits"' + common + ' value="' + esc(v) + '">'; break;
      case 'pin':
        control = '<input class="of-input" inputmode="numeric" maxlength="6"' + common + ' value="' + esc(v) + '">'; break;
      case 'email':
        control = '<input class="of-input" type="email" maxlength="254"' + common + ' value="' + esc(v) + '">'; break;
      default:
        control = '<input class="of-input" type="text" maxlength="' + (f.max || 120) + '"' + common + ' value="' + esc(v) + '">';
    }
    return '<div class="of-field' + w + '" data-wrap="' + esc(name) + '"><label class="of-label" id="' + id + '-l" for="' + id + '">' + esc(f.label) + (req ? '<span class="of-req" aria-hidden="true">*</span>' : '') + '</label>'
      + control + (f.help ? '<div class="of-help" id="' + id + '-h">' + esc(f.help) + '</div>' : '') + '<div class="of-error" id="' + id + '-e" hidden></div></div>';
  }

  /** Draw a form into `host`; returns { values, showErrors, clearErrors }. */
  function mountForm(host, sections) {
    var html = sections.map(function (s, si) {
      return '<section class="of-form-section" data-section="' + si + '">' + (s.title ? '<h3>' + esc(s.title) + '</h3>' : '') + '<div class="of-fields">'
        + s.fields.map(function (f) {
          if (f.type !== 'group') return fieldHTML(f, f.name);
          return '<div class="of-field" data-wrap="' + esc(f.name) + '" data-group="' + esc(f.name) + '"><div class="of-label">' + esc(f.label) + (f.required ? '<span class="of-req" aria-hidden="true">*</span>' : '') + '</div>'
            + '<div class="of-group-list" data-list></div><div class="of-error" hidden data-group-error></div>'
            + '<button class="of-btn of-btn--sm" type="button" data-add style="margin-top:10px">' + svg('plus') + 'Add ' + esc(f.itemLabel || 'entry') + '</button></div>';
        }).join('') + '</div></section>';
    }).join('');
    host.innerHTML = html;
    var groups = {};
    sections.forEach(function (s) { s.fields.forEach(function (f) { if (f.type === 'group') groups[f.name] = f; }); });

    function addRow(g, wrap) {
      var list = wrap.querySelector('[data-list]');
      var n = list.children.length;
      if (g.max && n >= g.max) return;
      var row = document.createElement('div');
      row.className = 'of-group-item';
      row.setAttribute('data-row', '');
      row.innerHTML = '<div class="of-group-head"><span>' + esc(cap(g.itemLabel || 'entry')) + ' <span data-num>' + (n + 1) + '</span></span>'
        + '<button class="of-btn of-btn--sm of-btn--ghost" type="button" data-remove aria-label="Remove this ' + esc(g.itemLabel || 'entry') + '">' + svg('trash') + 'Remove</button></div>'
        + '<div class="of-fields">' + g.fields.map(function (f) { return fieldHTML(f, f.name); }).join('') + '</div>';
      list.appendChild(row);
      renumber(g, wrap);
    }
    function renumber(g, wrap) {
      var rows = wrap.querySelectorAll('[data-row]');
      var min = g.min == null ? (g.required ? 1 : 0) : g.min;
      Array.prototype.forEach.call(rows, function (r, i) {
        r.querySelector('[data-num]').textContent = i + 1;
        r.querySelector('[data-remove]').hidden = rows.length <= min;
      });
      wrap.querySelector('[data-add]').disabled = !!(g.max && rows.length >= g.max);
    }
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      var wrap = host.querySelector('[data-group="' + k + '"]');
      var min = g.min == null ? (g.required ? 1 : 0) : g.min;
      for (var i = 0; i < Math.max(1, min); i++) addRow(g, wrap);
      wrap.querySelector('[data-add]').addEventListener('click', function () { addRow(g, wrap); var last = wrap.querySelector('[data-row]:last-child input, [data-row]:last-child textarea, [data-row]:last-child select'); if (last) last.focus(); });
      wrap.addEventListener('click', function (e) {
        var b = e.target.closest('[data-remove]');
        if (!b) return;
        b.closest('[data-row]').remove();
        renumber(g, wrap);
      });
    });

    function read(scope) {
      var out = {};
      Array.prototype.forEach.call(scope.querySelectorAll('[data-name]'), function (el) {
        if (scope === host && el.closest('[data-row]')) return;
        var name = el.getAttribute('data-name');
        if (el.getAttribute('data-multi')) out[name] = Array.prototype.filter.call(el.querySelectorAll('input'), function (i) { return i.checked; }).map(function (i) { return i.value; });
        else if (el.type === 'checkbox') out[name] = el.checked;
        else out[name] = el.value;
      });
      return out;
    }
    function values() {
      var v = read(host);
      Object.keys(groups).forEach(function (k) {
        v[k] = Array.prototype.map.call(host.querySelectorAll('[data-group="' + k + '"] [data-row]'), function (r) { return read(r); });
      });
      return v;
    }
    function sync() {
      var v = read(host);
      sections.forEach(function (s, si) {
        var sec = host.querySelector('[data-section="' + si + '"]');
        sec.hidden = !applies(s, v);
        s.fields.forEach(function (f) {
          var w = sec.querySelector('[data-wrap="' + f.name + '"]');
          if (w) w.hidden = !applies(f, v);
        });
      });
    }
    host.addEventListener('change', sync);
    host.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') { e.target.setAttribute('aria-invalid', 'false'); var err = document.getElementById(e.target.id + '-e'); if (err) err.hidden = true; }
    });
    sync();

    function clearErrors() {
      Array.prototype.forEach.call(host.querySelectorAll('.of-error'), function (e) { e.hidden = true; e.textContent = ''; });
      Array.prototype.forEach.call(host.querySelectorAll('[aria-invalid="true"]'), function (e) { e.setAttribute('aria-invalid', 'false'); });
    }
    function showErrors(errors) {
      clearErrors();
      var first = null;
      Object.keys(errors || {}).forEach(function (path) {
        var parts = path.split('.');
        var el = null, errEl = null;
        if (parts.length === 3) {
          var row = host.querySelectorAll('[data-group="' + parts[0] + '"] [data-row]')[Number(parts[1])];
          el = row && row.querySelector('[data-name="' + parts[2] + '"]');
        } else {
          el = host.querySelector('[data-name="' + path + '"]');
          if (!el && groups[path]) errEl = host.querySelector('[data-group="' + path + '"] [data-group-error]');
        }
        if (el) { el.setAttribute('aria-invalid', 'true'); errEl = document.getElementById(el.id + '-e'); }
        if (errEl) { errEl.textContent = errors[path]; errEl.hidden = false; }
        if (!first) first = el || errEl;
      });
      if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (first.focus) first.focus({ preventScroll: true }); }
    }
    /** The checks the browser can make before sending; the server checks everything again. */
    function check() {
      var errors = {};
      var v = read(host);
      var test = function (f, val, path, scopeVals) {
        if (!applies(f, scopeVals)) return;
        var empty = val == null || val === '' || (Array.isArray(val) && !val.length);
        if (f.type === 'checkbox' || f.type === 'group') return;
        if (empty) { if (f.required) errors[path] = f.label + ' is required.'; return; }
        var s = String(val).trim();
        if (f.type === 'aadhaar') { var d = s.replace(/[\s-]/g, ''); if (!/^[2-9]\d{11}$/.test(d) || !verhoeff(d)) errors[path] = f.label + ' is not a valid Aadhaar number.'; }
        if (f.type === 'mobile' && !/^(\+?91|0)?[6-9]\d{9}$/.test(s.replace(/[\s-]/g, ''))) errors[path] = f.label + ' must be ten digits beginning with 6, 7, 8 or 9.';
        if (f.type === 'pin' && !/^[1-9]\d{5}$/.test(s)) errors[path] = f.label + ' must be six digits.';
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors[path] = f.label + ' is not a valid e-mail address.';
        if (f.pattern && (f.type === 'text' || !f.type) && !new RegExp(f.pattern).test(s)) errors[path] = f.patternMessage || f.label + ' is not in the expected format.';
      };
      sections.forEach(function (sec) {
        if (!applies(sec, v)) return;
        sec.fields.forEach(function (f) {
          if (f.type === 'group') {
            Array.prototype.forEach.call(host.querySelectorAll('[data-group="' + f.name + '"] [data-row]'), function (row, i) {
              var rv = read(row);
              f.fields.forEach(function (sf) { test(sf, rv[sf.name], f.name + '.' + i + '.' + sf.name, rv); });
            });
          } else test(f, v[f.name], f.name, v);
        });
      });
      return errors;
    }
    return { values: values, showErrors: showErrors, clearErrors: clearErrors, check: check };
  }

  function newForm(key, token) {
    var f = state.forms.find(function (x) { return x.key === key; });
    if (!f) { main.innerHTML = page('Form not found', 'There is no such form in this office.', '<a class="of-btn" href="#/">Dashboard</a>'); return Promise.resolve(); }
    return api('/forms').then(function (b) {
      if (token !== current) return;
      state.forms = b.forms;
      f = b.forms.find(function (x) { return x.key === key; });
      main.innerHTML = page(f.title, f.description, '', 'New entry')
        + '<form class="of-card" id="ofForm" novalidate><div class="of-alert of-alert--danger" id="ofFormErr" role="alert" hidden></div><div id="ofFields"></div>'
        + '<div class="of-form-foot"><a class="of-btn" href="#/">Cancel</a><button class="of-btn of-btn--primary" type="submit" id="ofSubmit">' + esc(f.submitLabel || 'Save') + '</button></div></form>';
      var form = mountForm(document.getElementById('ofFields'), f.sections);
      var errBox = document.getElementById('ofFormErr');
      var btn = document.getElementById('ofSubmit');
      document.getElementById('ofForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        errBox.hidden = true;
        var local = form.check();
        if (Object.keys(local).length) {
          errBox.textContent = plural(Object.keys(local).length, 'field needs', 'fields need') + ' attention.';
          errBox.hidden = false;
          form.showErrors(local);
          return;
        }
        btn.disabled = true; btn.classList.add('is-busy');
        api('/records', { method: 'POST', body: { form: key, values: form.values() } }).then(function (res) {
          toast('Saved: ' + res.record.title, 'Sent to the ERP through the integration bus.', 'ok');
          state.counts[res.record.type] = (state.counts[res.record.type] || 0) + 1;
          location.hash = '#/record/' + res.record.id;
        }, function (err) {
          btn.disabled = false; btn.classList.remove('is-busy');
          errBox.textContent = err.message + (err.errors ? ' ' + plural(Object.keys(err.errors).length, 'field needs', 'fields need') + ' attention.' : '');
          errBox.hidden = false;
          if (err.errors) form.showErrors(err.errors); else errBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      });
    });
  }

  // ---------------------------------------------------------------- action dialog
  var dialog = null;
  function closeDialog() {
    if (!dialog) return;
    var back = dialog.back, opener = dialog.opener;
    dialog = null;
    back.remove();
    document.removeEventListener('keydown', onDialogKey, true);
    if (opener && document.body.contains(opener)) opener.focus();
  }
  function onDialogKey(e) {
    if (!dialog) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (e.key !== 'Tab') return;
    var f = dialog.box.querySelectorAll('button, input, select, textarea, a[href]');
    var list = Array.prototype.filter.call(f, function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openAction(record, action, opener) {
    closeDialog();
    var back = document.createElement('div');
    back.className = 'of-dialog-back';
    back.innerHTML = '<div class="of-dialog" role="dialog" aria-modal="true" aria-labelledby="dlgT" tabindex="-1"><h2 id="dlgT">' + esc(action.label) + '</h2>'
      + '<p>' + esc(action.description || 'For ' + record.title + '.') + '</p><div class="of-alert of-alert--danger" id="dlgErr" role="alert" hidden></div><form id="dlgForm" novalidate><div id="dlgFields"></div>'
      + '<div class="of-form-foot"><button class="of-btn" type="button" data-cancel>Cancel</button><button class="of-btn of-btn--' + esc(action.tone === 'neutral' ? 'primary' : action.tone === 'primary' ? 'primary' : action.tone) + '" type="submit" id="dlgOk">' + esc(action.fields.length ? 'Save' : 'Confirm') + '</button></div></form></div>';
    document.body.appendChild(back);
    var box = back.querySelector('.of-dialog');
    dialog = { back: back, box: box, opener: opener };
    document.addEventListener('keydown', onDialogKey, true);
    back.addEventListener('mousedown', function (e) { if (e.target === back) closeDialog(); });
    back.querySelector('[data-cancel]').addEventListener('click', closeDialog);
    var form = action.fields.length ? mountForm(back.querySelector('#dlgFields'), [{ fields: action.fields }]) : null;
    var first = back.querySelector('#dlgFields input, #dlgFields select, #dlgFields textarea');
    (first || back.querySelector('#dlgOk')).focus();
    var err = back.querySelector('#dlgErr');
    var ok = back.querySelector('#dlgOk');
    back.querySelector('#dlgForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (ok.disabled) return;
      err.hidden = true;
      if (form) { var local = form.check(); if (Object.keys(local).length) { form.showErrors(local); return; } }
      ok.disabled = true; ok.classList.add('is-busy');
      api('/records/' + record.id + '/actions/' + encodeURIComponent(action.key), { method: 'POST', body: { values: form ? form.values() : {} } }).then(function (res) {
        closeDialog();
        toast(action.label + ': done', 'The ERP is being updated now.', 'ok');
        drawRecord(res.record);
        var h1 = main.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      }, function (er) {
        ok.disabled = false; ok.classList.remove('is-busy');
        err.textContent = er.message; err.hidden = false;
        if (er.errors && form) form.showErrors(er.errors);
        if (er.status === 409) setTimeout(function () { closeDialog(); route(); }, 2500);
      });
    });
  }

  // ---------------------------------------------------------------- integration
  function integration(token) {
    return api('/integration').then(function (b) {
      if (token !== current) return;
      var s = b.stats;
      setErpChip(s);
      var rows = b.events.map(function (e) {
        return '<tr><td>' + erpDot(e.status) + ' ' + esc(cap(e.status)) + '</td><td class="of-mono">' + esc(e.recordRef) + '</td><td>' + esc(fmtStamp(e.createdAt)) + '</td>'
          + '<td>' + (e.latencyMs != null ? esc(ms(e.latencyMs)) : '<span class="of-muted">—</span>') + '</td><td>' + esc(e.attempts) + '</td><td>' + (e.error ? '<span class="of-error">' + esc(e.error) + '</span>' : '') + '</td></tr>';
      }).join('');
      main.innerHTML = page('Delivery to the ERP', 'How this department’s records reach the ERP: every change is written with an outbox event in one transaction, and the integration bus delivers it at once, signed, in order and with retries.',
        '<button class="of-btn" type="button" id="ofRetry"' + (s.pending || s.rejected ? '' : ' disabled') + '>' + svg('retry') + 'Deliver waiting events now</button>', 'Integration')
        + '<section class="of-card"><div class="of-flow">'
        + '<div><b>1. Officer saves</b><span>A record is created or moves to its next step here.</span></div>'
        + '<div><b>2. Outbox</b><span>The change and its event are written together in this department’s own database.</span></div>'
        + '<div><b>3. Integration bus</b><span>Delivered at once in signed batches; retried with back-off if the ERP is away.</span></div>'
        + '<div><b>4. ERP ingest</b><span>Applied once (duplicates ignored), the person matched across departments.</span></div>'
        + '<div><b>5. ERP lookup</b><span>Visible in Person Lookup, and pushed live to open pages.</span></div>'
        + '</div></section>'
        + '<div class="of-grid of-grid--kpi" style="margin-top:16px">'
        + '<div class="of-kpi"><span>Delivered</span><b>' + s.delivered + '</b><em>events acknowledged by the ERP</em></div>'
        + '<div class="of-kpi"><span>Waiting</span><b>' + s.pending + '</b><em>' + (s.oldestPendingAt ? 'oldest ' + esc(ago(s.oldestPendingAt)) : 'nothing waiting') + '</em></div>'
        + '<div class="of-kpi"><span>Refused</span><b>' + s.rejected + '</b><em>events the ERP could not accept</em></div>'
        + '<div class="of-kpi"><span>Median delivery</span><b>' + (s.medianLatencyMs != null ? esc(ms(s.medianLatencyMs)) : '—') + '</b><em>from save to acknowledgement</em></div>'
        + '</div>'
        + (s.lastError ? '<div class="of-alert of-alert--danger" style="margin-top:16px"><b>The ERP is not answering.</b> ' + esc(s.lastError) + ' Records are kept and will be delivered automatically when it is back.</div>' : '')
        + '<section class="of-card"><div class="of-card-head"><div><h2>Latest events</h2><p>Target: <span class="of-mono">' + esc(s.target) + '</span></p></div></div>'
        + (rows ? '<div class="of-table-wrap"><table class="of-table"><thead><tr><th scope="col">Status</th><th scope="col">Record</th><th scope="col">Saved</th><th scope="col">Delivered in</th><th scope="col">Attempts</th><th scope="col">Error</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="of-empty"><b>No events yet</b>Save a record to see it travel to the ERP.</div>') + '</section>';
      var rb = document.getElementById('ofRetry');
      rb.addEventListener('click', function () {
        rb.disabled = true; rb.classList.add('is-busy');
        api('/integration/retry', { method: 'POST', body: {} }).then(function (r) {
          toast(plural(r.queued, 'event') + ' queued for delivery', '', 'ok');
          setTimeout(route, 800);
        }, function (e) { rb.disabled = false; rb.classList.remove('is-busy'); toast('Could not queue the events', e.message, 'danger'); });
      });
    });
  }

  function activity(token) {
    return api('/activity').then(function (b) {
      if (token !== current) return;
      main.innerHTML = page('Activity log', 'What officers did in this office, newest first. The log is append-only: it cannot be edited or deleted.', '', 'Integration')
        + '<section class="of-card">' + (b.activity.length ? '<div class="of-table-wrap"><table class="of-table"><thead><tr><th scope="col">When</th><th scope="col">Officer</th><th scope="col">Action</th><th scope="col">Record</th><th scope="col">Details</th></tr></thead><tbody>'
          + b.activity.map(function (a) { return '<tr><td class="of-muted">' + esc(fmtStamp(a.at)) + '</td><td>' + esc(a.officer) + '</td><td>' + esc(cap(a.action.toLowerCase())) + '</td><td class="of-mono">' + esc(a.ref || '') + '</td><td>' + esc(a.details || '') + '</td></tr>'; }).join('')
          + '</tbody></table></div>' : '<div class="of-empty"><b>Nothing logged yet</b></div>') + '</section>';
    });
  }

  // ---------------------------------------------------------------- events
  window.addEventListener('hashchange', route);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-reload]')) { route(); return; }
    if (e.target.closest('[data-menu]')) {
      app.classList.add('nav-open');
      var s = document.createElement('div'); s.className = 'of-scrim';
      s.addEventListener('click', function () { app.classList.remove('nav-open'); s.remove(); });
      document.body.appendChild(s);
      var first = nav.querySelector('a'); if (first) first.focus();
      return;
    }
    var row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a, button')) location.hash = row.getAttribute('data-href');
  });

  Promise.all([api('/types'), api('/forms')]).then(function (r) {
    state.types = r[0].types;
    state.forms = r[1].forms;
    route();
    pollErp();
    setInterval(pollErp, 15000);
  }, function (e) { failure(e); });
})();
