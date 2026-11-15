'use strict';

/**
 * The ERP backend. The final product's server, with its own database.
 *
 * It exposes two things:
 *   POST /api/intake   the one door the portals hand records through
 *   /                  a console for watching what has arrived
 *
 * It never calls a portal and never opens a portal's database. Data moves one
 * way, portal -> ERP, and only through the API below.
 */

const path = require('path');
const express = require('express');
const store = require('./db');
const pg    = require('./pg');

const app = express();
const PORT = Number(process.env.ERP_PORT) || 4200;
// 127.0.0.1 unless told otherwise; a container sets HOST=0.0.0.0 so its published port works.
const HOST = process.env.HOST || '127.0.0.1';

app.set('view engine', 'ejs');
app.set('views', require('./config/paths').ERP_VIEWS);
const ui = require('./ui-react');
ui.mountAssets(app);
// rawBody is kept for the integration bus, whose deliveries are signed over the exact bytes sent
app.use(express.json({ limit: '4mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Replica-Notice',
    'Unofficial local demonstration - not an official government service');
  next();
});

// --- the intake API -------------------------------------------------------
/**
 * A portal hands over one record.
 *
 * The portal holds its own transaction open while this call is in flight, so a
 * rejection here means the portal rolls its row back too. Either both
 * databases have the record or neither does.
 */
app.post('/api/intake', (req, res) => {
  const b = req.body || {};
  const missing = ['sourceSystem', 'sourceForm', 'sourceReference']
    .filter((k) => !b[k]);
  if (missing.length) {
    return res.status(400).json({ error: `missing: ${missing.join(', ')}` });
  }
  if (!store.systems().some((s) => s.code === b.sourceSystem)) {
    return res.status(400).json({ error: `unknown source system: ${b.sourceSystem}` });
  }
  try {
    const result = store.receive(b);
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (err) {
    process.stderr.write(`[erp] intake failed: ${err.message}\n`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/summary', (req, res) => res.json(store.summary()));
/** ?limit= as a whole number between 1 and MAX_ROWS; anything else uses the default. */
const MAX_ROWS = 5000;
function limitOf(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_ROWS) : fallback;
}

app.get('/api/citizens', (req, res) => res.json({
  citizens: store.citizens(limitOf(req.query.limit, 200)),
}));
app.get('/api/intake', (req, res) => res.json({
  intake: store.recentIntake(limitOf(req.query.limit, 50), req.query.system || null),
}));
// Read-only. The audit log is append-only: nothing here, or anywhere, updates or deletes it.
app.get('/api/audit', (req, res) => res.json({
  audit: store.auditTail(limitOf(req.query.limit, 200)),
}));
app.get('/api/database', (req, res) => res.json(store.database()));
app.get('/api/health', async (req, res) => {
  let sqlite = { status: 'ok' };
  try { store.db.prepare('SELECT 1').get(); } catch (err) { sqlite = { status: 'down', detail: err.message }; }
  // PostgreSQL is only used by the console's /sync and /integration pages; say so plainly.
  let postgres = { status: 'unavailable', detail: 'no PostgreSQL client in this process' };
  try {
    const pg = require('./pg');
    postgres = (await pg.pgOnline())
      ? { status: 'ok' }
      : { status: 'down', detail: 'PostgreSQL did not answer' };
  } catch { /* pg module absent: stays unavailable */ }
  res.status(sqlite.status === 'ok' ? 200 : 503).json({
    status: sqlite.status === 'ok' ? 'ok' : 'down', sqlite, postgres,
  });
});

// --- the person lookup ----------------------------------------------------
/**
 * One identifier in, everything UIDAI, CCTNS, e-Forensics, eCourts and
 * ePrisons hold about the person out. See backend/erp-api/src/lookup.
 *
 *   GET /api/lookup?q=          search by Aadhaar, EID, mobile, CNR, FIR, prisoner no., ... or name
 *   GET /api/lookup/person/:ref one person's full profile
 *   GET /api/lookup/samples     the synthetic demonstration identities
 *   GET /api/lookup/sources     the connected systems and what the mirror holds
 */
const lookup = require('./lookup/service');
require('./lookup/store').ensureLoaded();
const { LOOKUP_UI } = require('./config/paths');
// Who asked, for the audit log. The hub passes its signed-in user; the console has no sign-in yet.
const actorOf = (req) => (String(req.get('X-ERP-Actor') || 'erp-console').replace(/[^\w:@.-]/g, '').slice(0, 60) || 'erp-console');
const lookupFailed = (res, err) => {
  process.stderr.write(`[erp] lookup failed: ${err.stack || err}\n`);
  res.status(500).json({ error: 'The lookup could not be completed. The error has been logged; try again.' });
};

app.get('/api/lookup', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json(await lookup.search(String(req.query.q || ''), actorOf(req))); } catch (err) { lookupFailed(res, err); }
});
// The integration bus: the departments push their record changes here (signed; see lookup/ingest.js).
const ingest = require('./lookup/ingest');
const live = require('./lookup/live');
// Aadhaar-first identity: split any person an earlier rule left holding two different Aadhaar numbers.
try {
  const fixed = ingest.repair();
  if (fixed.split || fixed.review.length) process.stdout.write(`[erp] identity repair: ${fixed.split} department share(s) moved to their own Aadhaar holder; ${fixed.review.length} left for review${fixed.review.length ? ` (${fixed.review.join(', ')})` : ''}\n`);
} catch (err) { process.stderr.write(`[erp] identity repair failed (lookup still works): ${err.stack || err}\n`); }
app.post('/api/ingest/events', (req, res) => {
  try { ingest.receive(req, res); } catch (err) { lookupFailed(res, err); }
});
// Live: open lookup pages hear about every delivered record at once.
app.get('/api/lookup/stream', (req, res) => live.stream(req, res));
app.get('/api/lookup/recent', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json({ recent: ingest.recent(Math.min(50, Number(req.query.limit) || 12)) }); } catch (err) { lookupFailed(res, err); }
});
app.get('/api/lookup/samples', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json({ synthetic: true, samples: lookup.samples() }); } catch (err) { lookupFailed(res, err); }
});
app.get('/api/lookup/sources', (req, res) => {
  try { res.json(lookup.sources()); } catch (err) { lookupFailed(res, err); }
});
app.get('/api/lookup/person/:ref', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const p = await lookup.profile(req.params.ref, actorOf(req));
    if (!p) return res.status(404).json({ error: 'No person has this reference.' });
    res.json(p);
  } catch (err) { lookupFailed(res, err); }
});
// The hub admin's "show full Aadhaar": audited here, the number itself is read from UIDAI by the hub.
app.post('/api/lookup/person/:ref/aadhaar-reveal', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const r = lookup.aadhaarReveal(req.params.ref, actorOf(req));
    if (!r) return res.status(404).json({ error: 'No person has this reference.' });
    res.json(r);
  } catch (err) { lookupFailed(res, err); }
});
app.use('/ui/lookup', express.static(LOOKUP_UI, { maxAge: '5m', index: false }));

// --- the console ----------------------------------------------------------
app.use((req, res, next) => {
  res.locals.systems = store.systems();
  res.locals.currentPath = req.path;
  next();
});

app.get('/', (req, res) => {
  ui.render(res, 'dashboard', {
    title: 'ERP - Intake Console',
    summary: store.summary(),
    recent: store.recentIntake(15),
    recentAudit: store.auditTail(8),
    dailyIntake: store.dailyIntake(30),
  });
});

app.get('/citizens', (req, res) => {
  ui.render(res, 'citizens', { title: 'ERP - Citizens', rows: store.citizens(200) });
});

app.get('/intake', (req, res) => {
  const system = req.query.system || null;
  ui.render(res, 'intake', {
    title: 'ERP - Received records',
    system,
    rows: store.recentIntake(200, system),
  });
});

app.get('/audit', (req, res) => {
  ui.render(res, 'audit', { title: 'ERP - Audit trail', rows: store.auditTail(200) });
});

// Drawn by EJS in both UI modes: the page is the shared lookup module inside the console layout.
app.get('/lookup', (req, res) => {
  res.render('lookup', { title: 'ERP - Person Lookup' });
});

app.get('/portals', (req, res) => {
  const filter = req.query.system || null;
  const sum = store.summary();
  /* form label per portal — matches the documented forms in the platform */
  const FORM_LABEL = {
    eprisons:   'Visit request',
    cctns:      'FIR verification',
    eforensics: 'Evidence request',
    uidai:      'Grievance / feedback',
    ecourts:    'Case status enquiry',
  };
  ui.render(res, 'portals', {
    title: 'ERP - Government Portals',
    filter,
    bySystem: sum.bySystem,
    recent: filter ? store.recentIntake(25, filter) : [],
    FORM_LABEL,
  });
});

app.get('/sync', async (req, res) => {
  const siteFilter = req.query.system || null;
  try {
    const [rows, summary] = await Promise.all([
      pg.syncLedger(300, siteFilter),
      pg.syncSummary(),
    ]);
    const total = summary.reduce((a, b) => a + (b.total || 0), 0);
    ui.render(res, 'sync', {
      title: 'ERP - Sync Activity',
      rows,
      summary,
      total,
      siteFilter,
      pgAvailable: rows.length > 0 || total === 0,
    });
  } catch (err) {
    process.stderr.write(`[erp] /sync error: ${err.message}\n`);
    ui.render(res, 'sync', {
      title: 'ERP - Sync Activity',
      rows: [], summary: [], total: 0, siteFilter,
      pgAvailable: false,
    });
  }
});

app.get('/integration', async (req, res) => {
  try {
    const [summary, pgUp] = await Promise.all([
      pg.syncSummary(),
      pg.pgOnline(),
    ]);
    const erp = store.summary();
    ui.render(res, 'integration', {
      title: 'ERP - Integration Status',
      summary,
      pgUp,
      erpSummary: erp,
    });
  } catch (err) {
    process.stderr.write(`[erp] /integration error: ${err.message}\n`);
    ui.render(res, 'integration', {
      title: 'ERP - Integration Status',
      summary: [], pgUp: false,
      erpSummary: store.summary(),
    });
  }
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));

app.use((err, req, res, next) => {
  process.stderr.write(`[erp] ${err.stack || err}\n`);
  res.status(500).json({ error: err.message });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    const s = store.summary();
    process.stdout.write(
      `\nERP backend (local demonstration - NOT an official government service)\n` +
      `  console   http://127.0.0.1:${PORT}/\n` +
      `  intake    POST http://127.0.0.1:${PORT}/api/intake\n` +
      `  database  ${store.DB_PATH}\n` +
      `  holding   ${s.citizens} citizen(s), ${s.intake} record(s)\n\n`);
  });
}

module.exports = app;
