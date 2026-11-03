'use strict';

/**
 * One backend for every replicated portal.
 *
 * NOT AN OFFICIAL GOVERNMENT SERVICE. This process never contacts any site it
 * replicates. It talks to exactly two things: the shared SQLite file in
 * database/sqlite/platform, and the ERP's HTTP API.
 *
 * Each portal keeps the port it has always had, so every URL that worked
 * before still works. They are five listeners belonging to one server, sharing
 * one database, one registration and one write-through to the ERP - which is
 * the difference from the five separate servers this replaces.
 */

const path = require('path');
const express = require('express');
const store = require('./db');
const erp = require('./services/erp-client');
const stats = require('./services/hub-stats');
const { SITES } = require('./config/sites');
const { identityRouter, sessionMiddleware } = require('./services/identity');
const { genericRouter } = require('./drivers/generic');
const { eprisonsRouter } = require('./drivers/eprisons');

const { PLATFORM_VIEWS } = require('./config/paths');
const dashboard = require('./services/hub-dashboard');
const HUB_STATIC = path.join(PLATFORM_VIEWS, '..', 'static');
const HUB_PORT = Number(process.env.PLATFORM_PORT) || 4100;
// 127.0.0.1 unless told otherwise; a container sets HOST=0.0.0.0 so its published ports work.
const HOST = process.env.HOST || '127.0.0.1';

store.registerSites(SITES);

/** Build the app for one portal. */
function buildPortal(site) {
  const app = express();

  app.set('view engine', 'ejs');
  // Its own views first, the shared identity views second. Express resolves a
  // view name against each directory in turn, so one set of identity pages
  // serves all five portals without being copied into any of them.
  app.set('views', [site.views, PLATFORM_VIEWS]);

  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(express.json({ limit: '256kb' }));

  app.use((req, res, next) => {
    // Links to the other portals reuse the address the visitor typed (the LAN
    // address or 127.0.0.1), so they resolve on the visitor's side, not the server's.
    res.locals.linkHost = req.hostname;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Replica-Notice',
      'Unofficial local demonstration - not an official government service');
    res.setHeader('X-Replica-Backend', 'shared');
    // The portal may reach its own origin and nothing else. The ERP is called
    // from the server, never from the browser, so it is not listed here.
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
      "script-src 'self'; font-src 'self' data:; form-action 'self'; " +
      "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
    next();
  });

  app.use('/static', express.static(site.publicDir, { maxAge: '1h' }));
  app.use('/original-assets', express.static(site.assets, { maxAge: '1h' }));

  // One registration, on every portal.
  app.use(sessionMiddleware);
  app.use(identityRouter(site));

  // Where this portal's data went, for anyone who wants to check rather than
  // take it on trust.
  app.get('/__platform', (req, res) => {
    const s = store.summary();
    res.json({
      portal: site.code,
      sharedBackend: {
        process: process.pid,
        database: store.DB_PATH,
        portals: s.sites.map((x) => ({ code: x.code, port: x.port })),
      },
      erp: { target: erp.target(), note: 'reached over HTTP; its database is never opened here' },
      totals: { people: s.people, submissions: s.submissions, mirroredToErp: s.synced },
      thisPortal: s.bySite.find((x) => x.code === site.code) || null,
    });
  });

  app.use(site.driver === 'eprisons' ? eprisonsRouter(site) : genericRouter(site));

  app.use((req, res) => {
    res.status(404).render('pages/not-found',
      { title: '404 - Not found', pageTitle: null, note: null });
  });

  app.use((err, req, res, next) => {
    process.stderr.write(`[${site.code}] ${err.stack || err}\n`);
    res.status(500).render('pages/error',
      { title: 'Something went wrong', pageTitle: null, message: err.message });
  });

  return app;
}

/**
 * Each portal's own logo, served from the captured originals without copying or
 * editing them. Fixed map: a request can only ever name one of these files.
 */
const SITE_LOGOS = {
  eprisons: 'images/eprisons_logo.png',
  cctns: 'images/cctnsLogoNew.png',
  eforensics: 'images/logo.png',
  uidai: 'icons/logoWithTitle.svg',
  ecourts: 'images/ecourts-logo.png',
};

/** A small hub, so there is one page that shows the whole arrangement. */
function buildHub() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', PLATFORM_VIEWS);
  app.use(express.urlencoded({ extended: false }));
  // Same reason as in buildPortal: link back to the address the visitor used.
  app.use((req, res, next) => { res.locals.linkHost = req.hostname; next(); });

  // One page, one navigation entry ("All portals"). It tells the shared shell
  // which entry is current; the /api/* JSON routes below feed the same figures.
  app.use((req, res, next) => { res.locals.currentPath = req.path; next(); });

  // Sign-in for the hub: /login, /logout, and a guard in front of everything below.
  require('./services/hub-auth').install(app);

  app.get('/logo/:code', (req, res) => {
    const site = SITES.find((x) => x.code === req.params.code);
    const rel = site && SITE_LOGOS[site.code];
    if (!rel) return res.status(404).end();
    res.set('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(site.assets, rel), (err) => { if (err && !res.headersSent) res.status(404).end(); });
  });

  // The hub is one page; older links to /portals land on it.
  app.get('/portals', (req, res) => res.redirect('/'));

  // The dashboard: the reference markup and styles, with its script reading real
  // data from /api/dashboard. Nothing in it is generated in the browser.
  app.use('/assets', express.static(HUB_STATIC, { maxAge: '5m' }));
  app.get('/', (req, res) => {
    res.set('X-Replica-Notice', 'Unofficial local demonstration - not an official government service');
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(HUB_STATIC, 'erp-hub.html'));
  });
  app.get('/api/dashboard', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      res.json(await dashboard.build());
    } catch (err) { next(err); }
  });

  app.get('/api/summary', (req, res) => res.json({
    ...store.summary(), erp: erp.target(), database: store.DB_PATH, pid: process.pid,
  }));
  app.get('/api/sync', (req, res) => res.json({ attempts: store.syncTail(200) }));
  app.get('/api/audit', (req, res) => res.json({ entries: store.auditTail(200) }));
  app.get('/api/portals', (req, res) => res.json({ portals: stats.portals() }));
  app.get('/api/overview', (req, res) => res.json(stats.overview(stats.parseDays(req.query.days))));
  app.get('/api/integration', (req, res) => res.json(stats.integration(stats.parseDays(req.query.days))));
  app.get('/api/database', (req, res) => res.json(stats.database()));
  app.get('/api/health', async (req, res, next) => {
    try { res.json(await stats.health()); } catch (err) { next(err); }
  });
  app.get('/api/endpoints', (req, res) => res.json({ endpoints: stats.endpoints() }));
  app.get('/api/people', (req, res) => res.json({
    people: store.people(200).map(store.personPublic),
  }));
  app.get('/api/submissions', (req, res) => res.json({
    submissions: store.allSubmissions(200),
  }));

  app.use((req, res) => res.status(404).json({ error: 'not found' }));
  app.use((err, req, res, next) => {
    process.stderr.write(`[hub] ${err.stack || err}\n`);
    res.status(500).json({ error: err.message });
  });
  return app;
}

function start() {
  const servers = [];
  for (const site of SITES) {
    const app = buildPortal(site);
    servers.push(app.listen(site.port, HOST));
  }
  servers.push(buildHub().listen(HUB_PORT, HOST));

  const s = store.summary();
  process.stdout.write(
    `\nShared portal backend - ONE process (pid ${process.pid}), ONE database\n` +
    `NOT an official government service.\n\n` +
    `  database  ${store.DB_PATH}\n` +
    `  ERP       ${erp.target()}  (over HTTP; its database is never opened here)\n` +
    `  hub       http://127.0.0.1:${HUB_PORT}/\n\n` +
    `  portals\n` +
    SITES.map((x) => `    ${x.name.padEnd(26)} http://127.0.0.1:${x.port}/`).join('\n') +
    `\n\n  holding   ${s.people} registration(s), ${s.submissions} submission(s), ` +
    `${s.synced} mirrored to the ERP\n` +
    `  Register once on any portal and the account works on all of them.\n\n`);

  const shutdown = () => {
    for (const srv of servers) srv.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return servers;
}

if (require.main === module) start();
module.exports = { buildPortal, buildHub, start };
