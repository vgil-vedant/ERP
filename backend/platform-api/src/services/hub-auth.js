'use strict';

/**
 * Sign-in for the hub (the dashboard on :4100).
 *
 * One administrator account. The password is never stored here, only a salted
 * scrypt hash of it. Both can be replaced without touching the code:
 *
 *   HUB_ADMIN_USER             the user name (default "admin")
 *   HUB_ADMIN_PASSWORD_HASH    "scrypt$<salt hex>$<hash hex>"
 *   HUB_ADMIN_PASSWORD         a plain password, hashed when the process starts
 *                              (use the _HASH variable for anything shared)
 *
 * A browser signs in at /login and gets a session cookie. A script may send
 * HTTP Basic credentials instead. The health check of the container reaches
 * /api/summary from inside the container and needs no sign-in.
 */

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const store = require('../db');
const { parseCookies } = require('./identity');

const COOKIE = 'hub_session';
const SESSION_HOURS = 12;
const AUTH_UI_DIR = path.join(__dirname, '..', '..', '..', '..', 'frontend', 'platform-hub', 'auth');

const DEFAULT_HASH = 'scrypt$d5844a5b7c4a0a042e1c092bee04ee21$d80cc9ec6a93fe3025f96c61a4271cfb50d3268e22faa5fa74e0c0937dc4206e';

const USER = process.env.HUB_ADMIN_USER || 'admin';

function hashPassword(password, salt = crypto.randomBytes(16)) {
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
}

const STORED = process.env.HUB_ADMIN_PASSWORD_HASH
  || (process.env.HUB_ADMIN_PASSWORD ? hashPassword(process.env.HUB_ADMIN_PASSWORD) : DEFAULT_HASH);

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** True when the user name and password match. Constant-time on both. */
function verify(username, password) {
  const [scheme, saltHex, hashHex] = STORED.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, 'hex');
  const got = crypto.scryptSync(String(password || ''), Buffer.from(saltHex, 'hex'), want.length);
  const passOk = crypto.timingSafeEqual(got, want);
  const userOk = safeEqual(String(username || '').trim(), USER);
  return passOk && userOk;
}

// --- sessions, kept in memory: a restart signs everyone out ------------------
const sessions = new Map();
function newSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_HOURS * 3600 * 1000);
  return token;
}
function validSession(token) {
  const exp = token && sessions.get(token);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

// --- a small brake on guessing: 8 failures per address in 10 minutes ---------
const failures = new Map();
const WINDOW_MS = 10 * 60 * 1000, MAX_FAILS = 8;
function tooMany(ip) {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(ip); return false; }
  return f.count >= MAX_FAILS;
}
function noteFailure(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() });
  else f.count += 1;
}

function basicCredentials(req) {
  const m = /^Basic\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return null;
  const decoded = Buffer.from(m[1], 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  return i < 0 ? null : { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

function isAuthed(req) {
  if (validSession(parseCookies(req.headers.cookie)[COOKIE])) return true;
  const b = basicCredentials(req);
  if (!b) return false;
  if (tooMany(req.ip)) return false;
  if (verify(b.user, b.pass)) return true;
  noteFailure(req.ip);
  return false;
}

const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/');

/**
 * The sign-in page and everything behind it are never cached. Without this a
 * browser answers the Back button from its own cache: the visitor signs in,
 * reaches the dashboard, presses Back and is shown the sign-in form again even
 * though the session is still valid. With no-store the Back button re-asks the
 * server, which sends a signed-in visitor straight back to the page they were on.
 */
function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Vary', 'Cookie');
}

const HUB_SITE = { name: 'ERP Hub', hostname: 'Maharashtra Prisons' };
function renderLogin(res, status, locals) {
  noStore(res);
  require('./ui-engine').renderAuth(res, status, 'platform/hub-login', Object.assign({
    title: 'Sign in — ERP Hub', hubMode: true, site: HUB_SITE, portals: store.q.sites.all(), form: {}, error: '', next: null,
  }, locals));
}

/** Registers /login, /logout, the sign-in assets and the guard. Call it before the hub's other routes. */
function install(app) {
  app.use('/account/ui', express.static(AUTH_UI_DIR, { maxAge: '5m', index: false }));
  require('./ui-engine').mountAssets(app);

  app.get('/login', (req, res) => {
    // Already signed in (the Back button, or a bookmark): there is nothing to
    // ask for, so this is a redirect to the page wanted, not a second form.
    if (isAuthed(req)) { noStore(res); return res.redirect(303, safeNext(req.query.next)); }
    renderLogin(res, 200, { next: typeof req.query.next === 'string' ? safeNext(req.query.next) : null });
  });

  app.post('/login', (req, res) => {
    const body = req.body || {};
    const next = safeNext(req.query.next);
    if (tooMany(req.ip)) {
      return renderLogin(res, 429, { form: { username: body.username || '' }, next,
        error: 'Too many unsuccessful attempts. Please wait ten minutes and try again.' });
    }
    if (!verify(body.username, body.password)) {
      noteFailure(req.ip);
      return renderLogin(res, 401, { form: { username: String(body.username || '').slice(0, 80) }, next,
        error: 'Incorrect username or password.' });
    }
    failures.delete(req.ip);
    noStore(res);
    res.setHeader('Set-Cookie', `${COOKIE}=${newSession()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}`);
    // 303: the Back button must never repeat the sign-in POST.
    res.redirect(303, next);
  });

  app.post('/logout', (req, res) => {
    sessions.delete(parseCookies(req.headers.cookie)[COOKIE]);
    noStore(res);
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    // 303 for the same reason, and the signed-out dashboard behind it must not
    // be restored from the cache: the guard below answers it with a redirect.
    res.redirect(303, '/login');
  });

  // Everything else needs a session (or Basic credentials), except the static files of the page itself
  // and the container's own health check.
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/') || req.path.startsWith('/logo/')) return next();
    if (req.path === '/api/summary' && isLoopback(req)) return next();
    if (isAuthed(req)) return next();
    const wantsPage = req.method === 'GET' && (req.path === '/' || /text\/html/.test(req.headers.accept || ''));
    if (wantsPage) {
      noStore(res);
      return res.redirect('/login' + (req.path === '/' ? '' : `?next=${encodeURIComponent(req.originalUrl)}`));
    }
    return res.status(401).json({ error: 'sign in required' });
  });
}

module.exports = { install, verify, noStore, COOKIE, USER };
