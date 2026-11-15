'use strict';
/**
 * Chooses how the sign-in pages are drawn.
 *
 *   default (UI_ENGINE unset or "react") -> the React build in frontend/web/dist
 *   UI_ENGINE=ejs                          -> the EJS templates, as before
 *
 * Both draw the same page from the same data; only the presentation layer differs. If the build is missing the
 * EJS page is used, so switching the variable on can never leave a sign-in page blank.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');

const DIST = path.join(__dirname, '..', '..', '..', '..', 'frontend', 'web', 'dist');
const BASE = '/account/ui/app';

const enabled = () => process.env.UI_ENGINE !== 'ejs' && fs.existsSync(path.join(DIST, 'auth.js'));

/** Static files of the React build. Mount next to the existing /account/ui mount. */
function mountAssets(app) {
  app.use(BASE, express.static(DIST, { maxAge: '5m', index: false }));
}

// JSON in a <script> block: "<" is escaped so the data can never close the tag.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function shell(title, boot, app = 'auth') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<script src="${BASE}/theme-init.js"></script>
<link rel="stylesheet" href="${BASE}/${app}.css">
<script type="module" src="${BASE}/${app}.js"></script>
</head>
<body>
<div id="root"></div>
<script type="application/json" id="boot">${json(boot)}</script>
</body>
</html>`;
}

/** Builds the page data from the same locals the EJS templates receive. */
function authBoot(view, l, origin) {
  const q = l.next ? '?next=' + encodeURIComponent(l.next) : '';
  const form = l.form || {};
  const errors = l.errors || {};
  const base = { next: l.next || null, values: {}, errors: {}, serverError: '', fatal: '' };
  if (view === 'platform/hub-login') {
    return { ...base, page: 'hub-login', action: '/login' + q, altHref: '', footer: 'ERP Hub · Maharashtra Prisons',
      values: { username: form.username || '' }, serverError: l.error || '',
      portals: l.portals.map((p) => ({ name: p.name })) };
  }
  const portals = l.portals.map((p) => ({ name: p.name, href: `${origin(p.port)}/account`, here: p.code === l.site.code }));
  const footer = `${l.site.hostname} · replica`;
  if (view === 'platform/login') {
    return { ...base, page: 'login', action: '/account/login' + q, altHref: '/account/register', footer, portals,
      values: { email: form.email || '' }, serverError: errors.email || '' };
  }
  return { ...base, page: 'register', action: '/account/register' + q, altHref: '/account/login', footer, portals,
    values: { full_name: form.full_name || '', email: form.email || '', mobile: form.mobile || '' },
    errors: { full_name: errors.full_name || '', email: errors.email || '', mobile: errors.mobile || '',
      password: errors.password || '', confirm_password: errors.confirm_password || '' },
    fatal: l.fatal || '' };
}

/**
 * port -> origin of that portal as the visitor reaches it. The server sets
 * res.locals.portalOrigin (services/edge.js: the public port behind the edge);
 * without it, the address the visitor used and the internal port, as before.
 */
function linkOrigin(res, locals) {
  if (typeof res.locals.portalOrigin === 'function') return res.locals.portalOrigin;
  const host = res.locals.linkHost || locals.linkHost || '127.0.0.1';
  return (port) => `http://${host}:${port}`;
}

/** Drop-in for res.status(n).render(view, locals) on the three sign-in pages. */
function renderAuth(res, status, view, locals) {
  if (!enabled()) return res.status(status).render(view, locals);
  return res.status(status).type('html').send(shell(locals.title, authBoot(view, locals, linkOrigin(res, locals))));
}

// Pages that really exist on each portal; the first link of every portal is its home (same list the EJS nav used).
const PORTAL_LINKS = {
  eprisons:   [['Dashboard', '/public/DashBoard', 'dash'], ['Visit registration', '/public/MyVisitRegistration', 'doc'],
               ['Visit status', '/public/MyVisitStatus', 'doc'], ['Grievance', '/public/grievance', 'doc']],
  cctns:      [['Feedback', '/feedback.htm', 'doc'], ['Login', '/login.htm', 'doc']],
  eforensics: [['Log in', '/Login', 'doc'], ['Forgot password', '/Forget/ForgetPassword', 'doc']],
  uidai:      [['Check Aadhaar validity', '/check-aadhaar-validity/en', 'doc'], ['Check status', '/checkStatus/en', 'doc'],
               ['Grievance and feedback', '/grievance-feedback/en', 'doc']],
  ecourts:    [['Search by CNR number', '/ecourtindia_v6/v2', 'doc']],
};

/** Drop-in for res.render('platform/account', locals). */
function renderAccount(res, locals) {
  if (!enabled()) return res.render('platform/account', locals);
  const origin = linkOrigin(res, locals);
  const boot = {
    site: { code: locals.site.code, name: locals.site.name, hostname: locals.site.hostname },
    portals: locals.portals.map((p) => ({ code: p.code, name: p.name, hostname: p.hostname, port: p.port, href: `${origin(p.port)}/account` })),
    links: PORTAL_LINKS[locals.site.code] || [],
    person: locals.person, submissions: locals.submissions, activity: locals.activity,
    justRegistered: !!locals.justRegistered,
  };
  return res.type('html').send(shell(locals.title, boot, 'account'));
}

/** The hub dashboard shell (React). Returns false when the React build is off, so the caller sends the EJS-era page. */
function sendHub(res) {
  if (!enabled() || !fs.existsSync(path.join(DIST, 'hub.js'))) return false;
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>ERP Hub \u00b7 Maharashtra Prisons \u2014 ERP Console</title>
<meta name="description" content="ERP Hub: received records, citizens, append-only audit trail and write-through monitoring, read from the live ERP and platform services." />
<link rel="stylesheet" href="${BASE}/hub.css">
<script type="module" src="${BASE}/hub.js"></script>
</head>
<body>
<div id="root"></div>
</body>
</html>`);
  return true;
}

module.exports = { enabled, mountAssets, renderAuth, renderAccount, sendHub, BASE };
