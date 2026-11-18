'use strict';

/**
 * The department offices, as the hub's admin sees them.
 *
 * The offices live in this process (departments/), so the hub reads their stores directly; the ERP is reached over HTTP like
 * everywhere else. Read-only, except one action: "retry" asks a department's integration bus to send its waiting events again.
 *
 *   GET  /api/offices                 every department: figures, records, bus events, officers, activity, and what the ERP holds
 *   POST /api/offices/:code/retry     send that department's pending / rejected events again
 *
 * Behind the hub's sign-in like every other /api path.
 */

const http = require('http');
const { open } = require('../departments/store');
const bus = require('../departments/bus');
const service = require('../departments/service');
const { THEMES } = require('../departments/themes');
const { DEPARTMENTS } = require('../departments');
const { SITES } = require('../config/sites');
const erp = require('./erp-client');

const RECORD_LIMIT = 300;
const ACTIVITY_LIMIT = 60;
const EVENT_LIMIT = 80;

function erpGet(path) {
  return new Promise((resolve) => {
    const req = http.get(`${erp.target()}${path}`, { timeout: 4000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => { try { resolve(res.statusCode === 200 ? JSON.parse(body) : null); } catch { resolve(null); } });
    });
    req.once('timeout', () => req.destroy());
    req.once('error', () => resolve(null));
  });
}

function one(site) {
  const dept = DEPARTMENTS[site.code];
  if (!dept) return null;
  const store = open(site.code);
  const t = THEMES[site.code] || {};
  const db = store.db;
  const rows = service.list(dept, store, { size: 100 });
  const records = [];
  for (let page = 1; page <= Math.min(rows.pages, Math.ceil(RECORD_LIMIT / 100)); page += 1) {
    const r = page === 1 ? rows : service.list(dept, store, { size: 100, page });
    r.rows.forEach((x) => records.push({
      ref: x.ref, type: x.type, typeLabel: x.typeLabel, title: x.title, subtitle: x.subtitle, status: x.status,
      statusLabel: x.statusLabel, updatedAt: x.updatedAt, erp: x.erp || null,
    }));
  }
  return {
    code: site.code, name: site.name, title: dept.title, short: dept.short, port: site.port, hostname: site.hostname,
    color: t.primary || '#0E9F6B', tagline: t.tagline || '',
    summary: service.summary(dept, store),
    totalRecords: db.prepare('SELECT COUNT(*) AS n FROM record').get().n,
    integration: bus.stats(site.code),
    events: bus.events(site.code, EVENT_LIMIT),
    officers: db.prepare('SELECT username, full_name AS fullName, designation, office, created_at AS createdAt, last_login_at AS lastLoginAt FROM officer ORDER BY id').all(),
    activity: db.prepare('SELECT id, at, officer, action, record_ref AS ref, details FROM activity ORDER BY id DESC LIMIT ?').all(ACTIVITY_LIMIT),
    records,
    // per day, for the dashboard charts: records created, events the ERP has not accepted, and people added
    daily: {
      records: db.prepare('SELECT date(created_at) AS d, COUNT(*) AS n FROM record GROUP BY d ORDER BY d DESC LIMIT 400').all(),
      undelivered: db.prepare("SELECT date(created_ms / 1000, 'unixepoch') AS d, COUNT(*) AS n FROM outbox WHERE status != 'delivered' GROUP BY d ORDER BY d DESC LIMIT 400").all(),
      people: db.prepare('SELECT date(created_at) AS d, COUNT(*) AS n FROM person GROUP BY d ORDER BY d DESC LIMIT 400').all(),
    },
    file: `${site.code}.sqlite`,
  };
}

async function build() {
  const departments = SITES.map(one).filter(Boolean);
  const [sources, recent] = await Promise.all([erpGet('/api/lookup/sources'), erpGet('/api/lookup/recent?limit=50')]);
  return { generatedAt: new Date().toISOString(), departments, erp: { sources, recent: recent && recent.recent ? recent.recent : [] } };
}

function install(app) {
  app.get('/api/offices', async (req, res, next) => {
    try { res.set('Cache-Control', 'no-store'); res.json(await build()); } catch (err) { next(err); }
  });
  app.post('/api/offices/:code/retry', (req, res) => {
    const site = SITES.find((s) => s.code === req.params.code);
    if (!site || !DEPARTMENTS[site.code]) return res.status(404).json({ error: 'unknown department' });
    res.set('Cache-Control', 'no-store');
    res.json({ department: site.code, requeued: bus.retry(site.code) });
  });
}

module.exports = { install, build };
