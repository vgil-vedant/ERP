'use strict';

/**
 * The department office of each portal: /office on the portal's own port.
 *
 *   GET  /office/login, POST /office/login, POST /office/logout
 *   GET  /office                          the officer workspace (signed in)
 *   /office/api/*                         its JSON API (signed in)
 *   /office/assets/*                      its scripts and styles
 *
 * Each department signs its officers in separately (its own accounts, its own
 * session cookie, its own database). The citizen pages of the portal, and its
 * shared citizen sign-in, are untouched.
 */

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { open } = require('./store');
const bus = require('./bus');
const service = require('./service');
const { seedOfficer, seedRecords, retireDemoPasswords } = require('./seed');
const sec = require('../../../shared/security');
const { publicForm } = require('./forms/common');
const { THEMES, cssVars } = require('./themes');
const skins = require('./skins');
const { ROOT } = require('../../../shared/paths');

const DEPARTMENTS = {
  uidai: require('./forms/uidai'),
  cctns: require('./forms/cctns'),
  eforensics: require('./forms/eforensics'),
  ecourts: require('./forms/ecourts'),
  eprisons: require('./forms/eprisons'),
};

const OFFICE_UI = path.join(ROOT, 'frontend', 'shared', 'department-office');
const STEPPER_UI = path.join(ROOT, 'frontend', 'shared', 'person-lookup');
const SESSION_HOURS = 10;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- sign-in -------------------------------------------------------------------
const verifyPassword = sec.verifyPassword;
// a real hash to compare against when the user name is unknown, so the time taken does not reveal which names exist
const DUMMY_HASH = sec.hashPassword(crypto.randomBytes(12).toString('hex'));
const tokenHash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const failures = new Map();
function tooMany(key) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > 10 * 60 * 1000) { failures.delete(key); return false; }
  return f.count >= 8;
}
function noteFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > 10 * 60 * 1000) failures.set(key, { first: Date.now(), count: 1 });
  else f.count += 1;
}
function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      let v = part.slice(i + 1).trim();
      try { v = decodeURIComponent(v); } catch { /* malformed escape: keep as sent, it will not match a session */ }
      out[part.slice(0, i).trim()] = v;
    }
  }
  return out;
}

// --- pages -----------------------------------------------------------------------
function loginPage(dept, site, { error, username } = {}) {
  const t = THEMES[dept.code];
  if (t.skin) return skins.loginPage(t.skin, { dept, site, theme: t, error, username, esc, vars: cssVars(dept.code) });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Officer sign-in \u00b7 ${esc(dept.title)}</title>
<link rel="stylesheet" href="/office/assets/office.css">
<style>:root{${cssVars(dept.code)}}</style>
</head>
<body class="of-login-body">
<div class="of-notice">Unofficial local demonstration \u2014 not an official government service. Synthetic data only.</div>
<main class="of-login">
  <section class="of-login-brand" aria-hidden="true">
    <div class="of-login-logo"><img src="/original-assets/${esc(t.logo)}" alt=""></div>
    <h2>${esc(dept.title)}</h2>
    <p>${esc(t.tagline)}</p>
    <ul>
      <li>Record and update the department\u2019s cases</li>
      <li>Every change reaches the ERP within seconds</li>
      <li>Separate sign-in, separate records, for this department only</li>
    </ul>
  </section>
  <section class="of-login-card">
    <div class="of-login-kicker">Officer workspace</div>
    <h1>Sign in</h1>
    <p class="of-login-sub">${esc(site.name)} \u00b7 department office</p>
    ${error ? `<div class="of-alert of-alert--danger" role="alert">${esc(error)}</div>` : ''}
    <form method="post" action="/office/login" novalidate>
      <label class="of-label" for="u">User name</label>
      <input class="of-input" id="u" name="username" autocomplete="username" required maxlength="80" value="${esc(username || '')}" ${username ? '' : 'autofocus'}>
      <label class="of-label" for="p">Password</label>
      <input class="of-input" id="p" name="password" type="password" autocomplete="current-password" required maxlength="200" ${username ? 'autofocus' : ''}>
      <button class="of-btn of-btn--primary of-btn--block" type="submit">Sign in</button>
    </form>
    <p class="of-login-foot">For officers of this department only. Citizens use the portal\u2019s own <a href="/account/login">sign-in</a>.</p>
  </section>
</main>
</body>
</html>`;
}

function shellPage(dept, site, officer) {
  const t = THEMES[dept.code];
  const boot = { code: dept.code, title: dept.title, short: dept.short, portal: site.name, logo: t.logoUrl || `/original-assets/${t.logo}`, seal: t.sealUrl || null, tagline: t.tagline, officer, skin: t.skin || null };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(dept.title)} \u00b7 Officer workspace</title>
<link rel="stylesheet" href="/office/assets/stepper/workflow-progress.css">
<link rel="stylesheet" href="/office/assets/office.css">
${t.skin ? `<link rel="stylesheet" href="/office/assets/office-${t.skin}.css">\n` : ''}<style>:root{${cssVars(dept.code)}}</style>
</head>
<body${t.skin ? ` class="of-skin-${t.skin}"` : ''}>
<div id="office"><noscript><p style="padding:24px">The officer workspace needs JavaScript. Enable it and reload the page.</p></noscript></div>
<script type="application/json" id="office-boot">${JSON.stringify(boot).replace(/</g, '\\u003c')}</script>
<script src="/office/assets/stepper/workflow-progress.js"></script>
<script src="/office/assets/office.js"></script>
</body>
</html>`;
}

// --- install on one portal -------------------------------------------------------
const installed = [];

function install(app, site) {
  const dept = DEPARTMENTS[site.code];
  if (!dept) return;
  installed.push({ site, dept });
  const store = open(site.code);
  sec.requireOrExit(() => {
    seedOfficer(store, dept);
    const n = retireDemoPasswords(store, dept);
    if (n) process.stdout.write(`  ${site.code.padEnd(11)} department office: ${n} account(s) moved off the published demonstration password\n`);
  });
  const seeded = seedRecords(store, dept);
  bus.register(store);
  bus.schedule(site.code);
  if (seeded) process.stdout.write(`  ${site.code.padEnd(11)} department office: ${seeded} records seeded, queued for the ERP\n`);
  const COOKIE = `office_${site.code}`;
  const router = express.Router();
  router.use('/assets/stepper', express.static(STEPPER_UI, { maxAge: '5m', index: false }));
  router.use('/assets', express.static(OFFICE_UI, { maxAge: '5m', index: false }));
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex'); next(); });

  function officerOf(req) {
    const token = cookies(req)[COOKIE];
    if (!token) return null;
    const s = store.db.prepare('SELECT * FROM officer_session WHERE token_hash = ?').get(tokenHash(token));
    if (!s) return null;
    if (s.expires_ms < Date.now()) { store.db.prepare('DELETE FROM officer_session WHERE token_hash = ?').run(s.token_hash); return null; }
    const o = store.db.prepare('SELECT id, username, full_name, designation, office FROM officer WHERE id = ?').get(s.officer_id);
    return o ? { username: o.username, name: o.full_name, designation: o.designation, office: o.office } : null;
  }

  router.get('/login', (req, res) => {
    if (officerOf(req)) return res.redirect('/office');
    res.type('html').send(loginPage(dept, site, {}));
  });
  router.post('/login', express.urlencoded({ extended: false, limit: '8kb' }), (req, res) => {
    const origin = req.get('origin');
    let originHost = null;
    try { originHost = origin ? new URL(origin).host : null; } catch { originHost = 'invalid'; }
    if (origin && originHost !== req.get('host')) return res.status(403).type('html').send(loginPage(dept, site, { error: 'This sign-in did not come from this page. Reload and try again.' }));
    const username = String((req.body || {}).username || '').trim().slice(0, 80);
    const password = String((req.body || {}).password || '');
    const key = `${req.ip}|${site.code}`;
    if (tooMany(key)) return res.status(429).type('html').send(loginPage(dept, site, { username, error: 'Too many failed attempts. Wait ten minutes and try again.' }));
    if (!username || !password) return res.status(400).type('html').send(loginPage(dept, site, { username, error: 'Enter your user name and password.' }));
    const o = store.db.prepare('SELECT * FROM officer WHERE username = ?').get(username);
    // compare a hash even for an unknown user, so timing does not reveal which user names exist
    const ok = verifyPassword(o ? o.password_hash : DUMMY_HASH, password.slice(0, 200)) && !!o;
    if (!ok) {
      noteFailure(key);
      return res.status(401).type('html').send(loginPage(dept, site, { username, error: 'The user name or password is not correct.' }));
    }
    failures.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    store.db.prepare('INSERT INTO officer_session (token_hash, officer_id, expires_ms) VALUES (?,?,?)').run(tokenHash(token), o.id, Date.now() + SESSION_HOURS * 3600000);
    store.db.prepare("UPDATE officer SET last_login_at = datetime('now') WHERE id = ?").run(o.id);
    store.db.prepare('DELETE FROM officer_session WHERE expires_ms < ?').run(Date.now());
    store.log(o.username, 'SIGN_IN', null, null);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', path: '/office', secure: req.secure, maxAge: SESSION_HOURS * 3600000 });
    res.redirect(303, '/office');
  });
  router.post('/logout', (req, res) => {
    const token = cookies(req)[COOKIE];
    const o = officerOf(req);
    if (token) store.db.prepare('DELETE FROM officer_session WHERE token_hash = ?').run(tokenHash(token));
    if (o) store.log(o.username, 'SIGN_OUT', null, null);
    res.clearCookie(COOKIE, { path: '/office' });
    // signing out returns the officer to the portal's landing page, not to the office sign-in
    res.redirect(303, site.code === 'uidai' ? '/en' : '/');
  });

  router.get(['/', ''], (req, res) => {
    const o = officerOf(req);
    if (!o) return res.redirect('/office/login');
    res.type('html').send(shellPage(dept, site, o));
  });

  // --- API ---
  const api = express.Router();
  api.use(express.json({ limit: '256kb' }));
  api.use((req, res, next) => {
    req.officer = officerOf(req);
    if (!req.officer) return res.status(401).json({ error: 'Your session has ended. Sign in again.' });
    // a page of this office always sends this header; a form on another site cannot
    if (req.method !== 'GET' && req.get('X-Office-Request') !== '1') return res.status(403).json({ error: 'Request refused.' });
    next();
  });
  const handle = (fn) => (req, res) => {
    try { res.json(fn(req)); } catch (err) {
      if (err instanceof service.FormError) return res.status(422).json({ error: err.message, errors: err.errors });
      if (err instanceof service.ActionError) return res.status(err.status).json({ error: err.message });
      process.stderr.write(`[office:${site.code}] ${err.stack || err}\n`);
      res.status(500).json({ error: 'The office could not complete this. The error has been logged; try again.' });
    }
  };

  api.get('/me', handle((req) => ({ officer: req.officer, department: { code: dept.code, title: dept.title, short: dept.short } })));
  api.get('/summary', handle(() => ({ ...service.summary(dept, store), integration: bus.stats(site.code) })));
  api.get('/records', handle((req) => service.list(dept, store, {
    type: dept.types[req.query.type] ? req.query.type : null,
    status: req.query.status ? String(req.query.status).slice(0, 40) : null,
    q: req.query.q, page: req.query.page, size: req.query.size,
  })));
  api.get('/records/:id', handle((req) => {
    const r = store.record(Number(req.params.id));
    if (!r) throw new service.ActionError('This record does not exist.', 404);
    const v = service.view(dept, store, r);
    v.activity = store.db.prepare('SELECT at, officer, action, details FROM activity WHERE record_ref = ? ORDER BY id DESC LIMIT 50').all(r.ref);
    return v;
  }));
  api.get('/types', handle(() => ({ types: Object.entries(dept.types).map(([key, t]) => ({ key, label: t.label, plural: t.plural || t.label })) })));
  api.get('/forms', handle(() => ({ forms: service.formsOf(dept, store).map(publicForm) })));
  api.post('/records', handle((req) => {
    const body = req.body || {};
    const r = service.create(dept, store, req.officer, String(body.form || ''), body.values || {});
    return { record: service.view(dept, store, r) };
  }));
  api.post('/records/:id/actions/:key', handle((req) => {
    const body = req.body || {};
    const r = service.act(dept, store, req.officer, Number(req.params.id), String(req.params.key), body.values || {}, { expectedVersion: body.version });
    return { record: service.view(dept, store, r) };
  }));
  api.get('/integration', handle((req) => (req.query.events === '0'
    ? { stats: bus.stats(site.code) }
    : { stats: bus.stats(site.code), events: bus.events(site.code, 100) })));
  api.post('/integration/retry', handle((req) => {
    const n = bus.retry(site.code);
    store.log(req.officer.username, 'RETRY', null, `${n} events queued again for the ERP`);
    return { queued: n };
  }));
  api.get('/activity', handle(() => ({ activity: store.db.prepare('SELECT at, officer, action, record_ref AS ref, details FROM activity ORDER BY id DESC LIMIT 200').all() })));
  api.use((req, res) => res.status(404).json({ error: 'not found' }));

  router.use('/api', api);
  app.use('/office', router);
}

/** Start delivering every department's outbox; call once the portals are installed. */
function start() {
  bus.start();
  if (!installed.length) return;
  process.stdout.write('  department offices (each with its own sign-in and database)\n'
    + installed.map(({ site, dept }) => `    ${dept.title.padEnd(36)} http://127.0.0.1:${site.port}/office   user ${dept.officer.username}`).join('\n')
    + '\n  records saved there reach the ERP through the integration bus\n\n');
}

module.exports = { install, start, DEPARTMENTS };
