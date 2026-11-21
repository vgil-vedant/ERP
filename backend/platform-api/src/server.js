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
const sec = require('../../shared/security');

// Public form posts per address: generous for a person, a wall for a script filling both databases.
const postBudget = sec.limiter({ max: 120, windowMs: 10 * 60 * 1000 });
const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

const { PLATFORM_VIEWS } = require('./config/paths');
const dashboard = require('./services/hub-dashboard');
const edge = require('./services/edge');
const HUB_STATIC = path.join(PLATFORM_VIEWS, '..', 'static');
const HUB_PORT = Number(process.env.PLATFORM_PORT) || 4100;
// 127.0.0.1 unless told otherwise; a container sets HOST=0.0.0.0 so its published ports work.
const HOST = process.env.HOST || '127.0.0.1';

store.registerSites(SITES);

/** Build the app for one portal. */
// The landing page of each portal (UIDAI answers on / and on both language homes).
const OFFICE_LANDING = { uidai: ['/', '/en', '/hi'] };
const departments = require('./departments');

function buildPortal(site) {
  const app = express();
  // Behind the public edge (deploy/edge) req.ip is the visitor's, not the proxy's.
  app.set('trust proxy', edge.trustProxy);

  app.set('view engine', 'ejs');
  // Its own views first, the shared identity views second. Express resolves a
  // view name against each directory in turn, so one set of identity pages
  // serves all five portals without being copied into any of them.
  app.set('views', [site.views, PLATFORM_VIEWS]);
  // React draws the portals' converted views (server-side) unless UI_ENGINE=ejs; the shared identity views are handled by ui-engine.
  require('../../shared/portal-ui').install(app, require('ejs'), express);

  app.disable('x-powered-by');
  app.use(sec.headers());
  // a form on another site cannot post here (Origin / Sec-Fetch-Site), and one address cannot flood the portal
  app.use(sec.sameOriginOnly);
  app.use((req, res, next) => {
    if (req.method !== 'POST' || req.path.startsWith('/office/')) return next();
    if (postBudget.hit(req.ip)) return next();
    res.set('Retry-After', '600');
    return res.status(429).type('text/plain').send('Too many requests from this address. Please wait a few minutes and try again.');
  });
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(express.json({ limit: '256kb' }));

  app.use((req, res, next) => {
    // Links to the other portals reuse the address the visitor typed (the LAN
    // address or 127.0.0.1), so they resolve on the visitor's side, not the server's.
    res.locals.linkHost = req.hostname;
    // ...and the port the visitor can reach (the public one when they came through the edge).
    res.locals.portalOrigin = edge.originFor(req);
    res.setHeader('X-Replica-Notice',
      'Unofficial local demonstration - not an official government service');
    res.setHeader('X-Replica-Backend', 'shared');
    // The portal may reach its own origin and nothing else. The ERP is called
    // from the server, never from the browser, so it is not listed here.
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
      "script-src 'self'; font-src 'self' data:; form-action 'self'; " +
      "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
    // "Office login" link to /office/login: on this portal's landing page only
    const office = departments.DEPARTMENTS[site.code];
    res.locals.officeButton = !!office && (OFFICE_LANDING[site.code] || ['/']).includes(req.path);
    next();
  });

  app.use('/static', express.static(site.publicDir, { maxAge: '1h' }));
  app.use('/original-assets', express.static(site.assets, { maxAge: '1h' }));

  // The department's own office: officer sign-in, workspace and records, in its
  // own database; every change reaches the ERP through the integration bus.
  require('./departments').install(app, site);

  // One registration, on every portal.
  app.use(sessionMiddleware);
  app.use(identityRouter(site));

  // Where this portal's data went, for anyone who wants to check rather than
  // take it on trust.
  app.get('/__platform', (req, res) => {
    // process id and database path: for the machine's own operator only (the edge hides it as well)
    if (!isLoopback(req)) return res.status(404).type('text/plain').send('Not found');
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
    if (res.headersSent) return next(err);
    // a bad request (malformed or oversized body) says so; anything else is logged and answered plainly
    res.status(sec.statusOf(err)).render('pages/error',
      { title: 'Something went wrong', pageTitle: null, message: sec.publicMessage(err) });
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
  app.set('trust proxy', edge.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', PLATFORM_VIEWS);
  app.disable('x-powered-by');
  // The hub loads only its own scripts, styles, fonts and images, and talks only to itself (nothing is fetched from a CDN).
  app.use(sec.headers({ frame: 'SAMEORIGIN', csp:
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
    "font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" }));
  app.use(sec.sameOriginOnly);
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  // Same reason as in buildPortal: link back to the address (and port) the visitor used.
  app.use((req, res, next) => {
    res.locals.linkHost = req.hostname;
    res.locals.portalOrigin = edge.originFor(req);
    next();
  });

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

  /**
   * The hub is one page, and every page of it has an address.
   *
   * The dashboard keeps the view it is showing in the URL (#citizens, #queue,
   * #dept:cctns ...) and adds a history entry for each move, so Back and
   * Forward walk through the views instead of leaving the hub. These routes are
   * the other half of that: a plain path - /citizens, /queue, /dept/cctns, or
   * the older /portals link - opens the hub on that view rather than 404ing.
   * The list is the navigation of the dashboard (frontend/web/src/apps/hub).
   */
  const HUB_VIEWS = [
    'dashboard', 'overview', 'intake', 'lookup', 'citizens', 'audit', 'portals', 'sync', 'integration',
    'submissions', 'database', 'health', 'docs',
    'records', 'queue', 'failures', 'recon', 'officers', 'lookupaudit', 'activity',
  ];
  for (const view of HUB_VIEWS) {
    app.get(`/${view}`, (req, res) => res.redirect(302, `/#${view}`));
  }
  // one department's office, as the hub shows it
  app.get('/dept/:code', (req, res) => {
    if (!SITES.some((x) => x.code === req.params.code)) return res.status(404).json({ error: 'not found' });
    res.redirect(302, `/#dept:${req.params.code}`);
  });

  // The dashboard: the reference markup and styles, with its script reading real
  // data from /api/dashboard. Nothing in it is generated in the browser.
  // The person lookup: its page module here, its API (passed through to the ERP) below.
  const hubLookup = require('./services/hub-lookup');
  hubLookup.installAssets(app);
  // The department offices as the admin sees them (read-only, plus "retry" of a department's waiting events).
  require('./services/hub-offices').install(app);
  // apply, approve and correct records of every department from the hub (same department databases)
  require('./services/hub-workbench').install(app);
  app.use('/assets', express.static(HUB_STATIC, { maxAge: '5m' }));
  app.get('/', (req, res) => {
    res.set('X-Replica-Notice', 'Unofficial local demonstration - not an official government service');
    // Never from the cache: after signing out, Back must ask the server again
    // (which sends the visitor to /login) instead of redrawing the dashboard.
    require('./services/hub-auth').noStore(res);
    if (require('./services/ui-engine').sendHub(res)) return;
    res.sendFile(path.join(HUB_STATIC, 'erp-hub.html'));
  });
  // Who is signed in, for the profile card of the sidebar. The hub has one administrator account.
  app.get('/api/me', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ name: require('./services/hub-auth').USER, role: 'Administrator' });
  });
  app.get('/api/dashboard', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      // publicPorts: the ports the browser must use for portal links (null on a direct visit).
      res.json({ ...(await dashboard.build()), publicPorts: edge.publicPorts(req) });
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

  hubLookup.installApi(app);

  app.use((req, res) => res.status(404).json({ error: 'not found' }));
  app.use((err, req, res, next) => {
    process.stderr.write(`[hub] ${err.stack || err}\n`);
    if (res.headersSent) return next(err);
    res.status(sec.statusOf(err)).json({ error: sec.publicMessage(err) });
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
  require('./departments').start();

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
