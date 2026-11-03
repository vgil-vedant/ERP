/* Client-routed dashboard for the local demonstration replica.
   Mirrors the original's single-page behaviour: one shell, routes resolved in
   the browser, data fetched from the local API. Nothing leaves this machine. */
(function () {
  'use strict';

  var root = document.getElementById('root');
  if (!root) return;

  var BASE = '/NPIPDashboard';
  var NAV = [
    { path: '', label: 'Jail Location' },
    { path: '/lockupReport', label: 'Lockup Report' },
    { path: '/paroleJumper', label: 'Parole Jumper' },
    { path: '/absconder', label: 'Absconder' },
    { path: '/ePrisonsLiveStatus', label: 'ePrisons Live' },
    { path: '/siteMap', label: 'Site Map' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function num(n) { return Number(n || 0).toLocaleString('en-IN'); }

  function get(url) {
    return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function currentPath() {
    var p = location.pathname.replace(/\/+$/, '');
    if (p === BASE || p === '') return '';
    return p.indexOf(BASE) === 0 ? p.slice(BASE.length) : '';
  }

  function shell(title, body) {
    var path = currentPath();
    return '' +
      '<header class="spa-header"><div class="spa-header__inner">' +
        '<a class="spa-brand" href="/"><img src="/static/img/demo-mark.svg" alt="" width="104" height="28">' +
        '<span>Prisons Dashboard</span></a>' +
        '<nav class="spa-nav" aria-label="Dashboard">' +
          NAV.map(function (n) {
            var active = n.path === path;
            return '<a href="' + BASE + n.path + '" class="spa-nav__link' + (active ? ' is-active' : '') + '"' +
              (active ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a>';
          }).join('') +
        '</nav>' +
      '</div></header>' +
      '<main class="spa-main" id="spa-main" tabindex="-1">' +
        '<h1 class="spa-title">' + esc(title) + '</h1>' + body +
      '</main>' +
      '<footer class="spa-footer"><p>Unofficial local demonstration. Synthetic data only. ' +
      'Not an official government service. <a href="/">Main replica</a></p></footer>';
  }

  function loading(title) {
    root.innerHTML = shell(title, '<p class="spa-loading" role="status">Loading…</p>');
  }

  function table(caption, headers, rows) {
    return '<div class="table-wrap"><table class="data">' +
      (caption ? '<caption>' + esc(caption) + '</caption>' : '') +
      '<thead><tr>' + headers.map(function (h) {
        return '<th scope="col"' + (h.num ? ' class="num"' : '') + '>' + esc(h.label || h) + '</th>';
      }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.join('') : '<tr><td colspan="' + headers.length + '">No records.</td></tr>') +
      '</tbody></table></div>';
  }

  function meterCell(value, max) {
    var pct = Math.round((value / (max || 1)) * 100);
    return '<td><span class="meter" role="img" aria-label="' + pct + ' percent of the highest value">' +
      '<span class="meter__fill" style="width:' + pct + '%"></span></span></td>';
  }

  // --- route renderers ----------------------------------------------------
  var views = {
    '': function () {
      loading('Jail Location');
      return Promise.all([get('/api/stats/headline'), get('/api/stats/by-state?metric=inmates_in_custody')])
        .then(function (res) {
          var s = res[0], byState = res[1].rows;
          var max = byState.reduce(function (m, r) { return Math.max(m, r.value); }, 0);
          var tiles = '<div class="tile-grid">' +
            '<div class="tile tile--purple"><span class="tile__label">States covered</span>' +
            '<span class="tile__value">' + num(s.statesCovered) + '</span></div>' +
            '<div class="tile tile--teal"><span class="tile__label">Prisons on-board</span>' +
            '<span class="tile__value">' + num(s.prisonsOnBoard) + '</span></div>' +
            '<div class="tile tile--blue"><span class="tile__label">Inmates in custody</span>' +
            '<span class="tile__value">' + num(s.inmatesInCustody) + '</span></div></div>';
          var rows = byState.map(function (r) {
            return '<tr><th scope="row">' + esc(r.state_name) + '</th>' +
              '<td class="num">' + num(r.value) + '</td>' + meterCell(r.value, max) + '</tr>';
          });
          root.innerHTML = shell('Jail Location',
            '<p class="spa-intro">Synthetic figures from the local demonstration database.</p>' +
            tiles + table('Inmates in custody by state.',
              ['State / UT', { label: 'Inmates', num: true }, 'Relative'], rows));
        });
    },

    '/lockupReport': function () {
      loading('Lockup Report');
      return get('/api/lockup-report').then(function (d) {
        var rows = d.rows.slice(0, 120).map(function (r) {
          return '<tr><td>' + esc(r.report_date) + '</td><th scope="row">' + esc(r.state_name) + '</th>' +
            '<td>' + esc(r.jail_name) + '</td>' +
            '<td class="num">' + num(r.male_count) + '</td>' +
            '<td class="num">' + num(r.female_count) + '</td>' +
            '<td class="num">' + num(r.trans_count) + '</td>' +
            '<td class="num">' + num(r.total_count) + '</td></tr>';
        });
        root.innerHTML = shell('Lockup Report',
          '<p class="spa-intro">Insights into lockup reports. Synthetic demonstration data.</p>' +
          table('Showing ' + rows.length + ' of ' + d.rows.length + ' rows.',
            ['Date', 'State', 'Jail', { label: 'Male', num: true }, { label: 'Female', num: true },
             { label: 'Transgender', num: true }, { label: 'Total', num: true }], rows));
      });
    },

    '/paroleJumper': function () {
      loading('Parole Jumper');
      return get('/api/parole-jumpers').then(function (d) {
        var rows = d.rows.map(function (r) {
          return '<tr><th scope="row">' + esc(r.name) + '</th><td>' + esc(r.father_name) + '</td>' +
            '<td>' + esc(r.state_name) + '</td><td>' + esc(r.jail_name || '—') + '</td>' +
            '<td>' + esc(r.parole_from) + '</td><td>' + esc(r.due_back_on) + '</td></tr>';
        });
        root.innerHTML = shell('Parole Jumper',
          '<p class="spa-intro">Synthetic records. These do not describe real people.</p>' +
          table(d.total + ' record(s), page ' + d.page + ' of ' + d.pages + '.',
            ['Name', 'Father Name', 'State', 'Jail', 'Parole From', 'Due Back On'], rows));
      });
    },

    '/absconder': function () {
      loading('Absconder');
      return get('/api/absconders').then(function (d) {
        var rows = d.rows.map(function (r) {
          return '<tr><th scope="row">' + esc(r.name) + '</th><td>' + esc(r.father_name) + '</td>' +
            '<td>' + esc(r.state_name) + '</td><td>' + esc(r.jail_name || '—') + '</td>' +
            '<td>' + esc(r.absconded_on) + '</td></tr>';
        });
        root.innerHTML = shell('Absconder',
          '<p class="spa-intro">Synthetic records. These do not describe real people.</p>' +
          table(d.total + ' record(s), page ' + d.page + ' of ' + d.pages + '.',
            ['Name', 'Father Name', 'State', 'Jail', 'Absconded On'], rows));
      });
    },

    '/ePrisonsLiveStatus': function () {
      loading('ePrisons Live');
      return Promise.all([
        get('/api/stats/by-state?metric=inmates_in_custody'),
        get('/api/stats/by-state?metric=sanctioned_capacity')
      ]).then(function (res) {
        var held = res[0].rows, cap = res[1].rows;
        var capBy = {};
        cap.forEach(function (r) { capBy[r.state_name] = r.value; });
        var rows = held.map(function (r) {
          var c = capBy[r.state_name] || 0;
          var occ = c ? Math.round((r.value / c) * 100) : 0;
          return '<tr><th scope="row">' + esc(r.state_name) + '</th>' +
            '<td class="num">' + num(r.value) + '</td><td class="num">' + num(c) + '</td>' +
            '<td class="num">' + occ + '%</td>' + meterCell(occ, 150) + '</tr>';
        });
        root.innerHTML = shell('ePrisons Live',
          '<p class="spa-intro">Occupancy against sanctioned capacity. Synthetic data.</p>' +
          table('All states and union territories.',
            ['State / UT', { label: 'In custody', num: true }, { label: 'Capacity', num: true },
             { label: 'Occupancy', num: true }, 'Relative'], rows));
      });
    },

    '/siteMap': function () {
      var links = NAV.filter(function (n) { return n.path !== '/siteMap'; })
        .map(function (n) { return '<li><a href="' + BASE + n.path + '">' + esc(n.label) + '</a></li>'; })
        .join('');
      root.innerHTML = shell('Site Map',
        '<div class="prose"><h3>Dashboard routes</h3><ul>' + links + '</ul>' +
        '<h3>Main replica</h3><ul>' +
        '<li><a href="/">Home</a></li>' +
        '<li><a href="/public/MyVisitRegistration">eMulakat &mdash; visit registration</a></li>' +
        '<li><a href="/public/MyVisitStatus">eMulakat &mdash; visit status</a></li>' +
        '<li><a href="/public/grievance">Grievance</a></li>' +
        '<li><a href="/public/DashBoard">Server-rendered dashboard</a></li>' +
        '</ul></div>');
      return Promise.resolve();
    }
  };

  function render() {
    var path = currentPath();
    var view = views[path];
    if (!view) {
      root.innerHTML = shell('Not found',
        '<div class="prose"><p>No dashboard route matches <code>' + esc(location.pathname) + '</code>.</p>' +
        '<p><a href="' + BASE + '">Back to the dashboard</a></p></div>');
      return;
    }
    view().catch(function (e) {
      root.innerHTML = shell('Could not load',
        '<div class="notice notice--error" role="alert">The local API did not respond: ' +
        esc(e.message) + '</div>');
    });
  }

  // Intercept in-app links so routing happens in the browser, like the original.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.indexOf(BASE) !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (href !== location.pathname) history.pushState({}, '', href);
    render();
    var main = document.getElementById('spa-main');
    if (main) main.focus();
  });

  window.addEventListener('popstate', render);
  render();
})();
