'use strict';

/**
 * The figures behind the hub's dashboard and its /api/* JSON routes.
 *
 * Everything here is read from the platform database (the one this process
 * owns). The ERP is only ever reached over HTTP, for the health check; its
 * database is never opened.
 */

const fs = require('fs');
const http = require('http');
const net = require('net');
const store = require('../db');
const erp = require('./erp-client');
const { SITES } = require('../config/sites');

const { db } = store;

/** ?days=7|30|90 (any whole number up to ten years); anything else means "all time". */
function parseDays(value) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 && n <= 3650 ? n : null;
}

/** SQL fragment and parameter that limit a created_at-style column to the window. */
function windowOf(column, days) {
  return days
    ? { sql: `${column} >= datetime('now', ?)`, args: [`-${days} days`] }
    : { sql: '1 = 1', args: [] };
}

function portals() {
  const bySite = new Map(store.summary().bySite.map((b) => [b.code, b]));
  return SITES.map((s) => {
    const b = bySite.get(s.code) || {};
    return {
      code: s.code,
      name: s.name,
      hostname: s.hostname,
      category: s.category,
      port: s.port,
      logo: `/logo/${s.code}`,
      submissions: b.n || 0,
      mirrored: b.synced || 0,
    };
  });
}

function overview(days) {
  const sub = windowOf('created_at', days);
  const per = windowOf('created_at', days);
  const one = (sql, args) => db.prepare(sql).get(...args);
  const daily = db.prepare(
    `SELECT date(created_at) AS day, COUNT(*) AS submissions,
            SUM(erp_intake_ref IS NOT NULL) AS mirrored
       FROM submission WHERE ${sub.sql} GROUP BY day ORDER BY day`).all(...sub.args);
  const bySite = db.prepare(
    `SELECT site_code AS code, COUNT(*) AS submissions
       FROM submission WHERE ${sub.sql} GROUP BY site_code ORDER BY submissions DESC`).all(...sub.args);
  return {
    days: days || 'all',
    people: one(`SELECT COUNT(*) AS n FROM person WHERE ${per.sql}`, per.args).n,
    submissions: one(`SELECT COUNT(*) AS n FROM submission WHERE ${sub.sql}`, sub.args).n,
    mirrored: one(`SELECT COUNT(*) AS n FROM submission WHERE erp_intake_ref IS NOT NULL AND ${sub.sql}`, sub.args).n,
    daily,
    bySite,
  };
}

function integration(days) {
  const w = windowOf('attempted_at', days);
  const rows = db.prepare(
    `SELECT status, COUNT(*) AS n FROM erp_sync WHERE ${w.sql} GROUP BY status`).all(...w.args);
  const count = (status) => (rows.find((r) => r.status === status) || { n: 0 }).n;
  const total = rows.reduce((t, r) => t + r.n, 0);
  const byEntity = db.prepare(
    `SELECT entity, status, COUNT(*) AS n FROM erp_sync WHERE ${w.sql}
      GROUP BY entity, status ORDER BY entity, status`).all(...w.args);
  const byHttp = db.prepare(
    `SELECT http_status AS httpStatus, COUNT(*) AS n FROM erp_sync WHERE ${w.sql}
      GROUP BY http_status ORDER BY n DESC`).all(...w.args);
  const last = db.prepare(
    `SELECT attempted_at AS at, status, entity FROM erp_sync WHERE ${w.sql}
      ORDER BY id DESC LIMIT 1`).get(...w.args) || null;
  return {
    days: days || 'all',
    attempts: total,
    synced: count('synced'),
    failed: count('failed'),
    successRate: total ? Math.round((count('synced') / total) * 1000) / 10 : null,
    byEntity,
    byHttp,
    last,
  };
}

function database() {
  const tables = db.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all()
    .map((t) => ({
      name: t.name,
      rows: db.prepare(`SELECT COUNT(*) AS n FROM "${t.name.replace(/"/g, '""')}"`).get().n,
    }));
  let bytes = null;
  try { bytes = fs.statSync(store.DB_PATH).size; } catch { /* in-memory or moved */ }
  return {
    engine: 'SQLite',
    file: store.DB_PATH,
    bytes,
    tables,
    totalRows: tables.reduce((t, x) => t + x.rows, 0),
  };
}

function timed(name, fn) {
  const start = Date.now();
  return Promise.resolve()
    .then(fn)
    .then((detail) => ({ name, status: 'ok', detail, ms: Date.now() - start }))
    .catch((err) => ({ name, status: 'down', detail: String(err.message || err), ms: Date.now() - start }));
}

/** Can a TCP connection be made to this local listener? */
function listening(port) {
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: '127.0.0.1', port, timeout: 1500 });
    s.once('connect', () => { s.destroy(); resolve(`listening on :${port}`); });
    s.once('timeout', () => { s.destroy(); reject(new Error(`no answer on :${port}`)); });
    s.once('error', (e) => { s.destroy(); reject(e); });
  });
}

/** GET the ERP's summary over HTTP, as the write-through would. */
function erpReachable() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${erp.target()}/api/summary`, { timeout: 2500 }, (res) => {
      res.resume();
      if (res.statusCode === 200) resolve(`HTTP 200 from ${erp.target()}`);
      else reject(new Error(`HTTP ${res.statusCode}`));
    });
    req.once('timeout', () => req.destroy(new Error('timed out')));
    req.once('error', reject);
  });
}

async function health() {
  const checks = await Promise.all([
    timed('Platform database', () => `${db.prepare('SELECT 1 AS ok').get().ok === 1 ? 'answers queries' : 'unexpected reply'}`),
    timed('ERP backend', erpReachable),
    ...SITES.map((s) => timed(`${s.name} listener`, () => listening(s.port))),
  ]);
  return {
    status: checks.every((c) => c.status === 'ok') ? 'ok' : 'degraded',
    checkedAt: new Date().toISOString(),
    checks,
  };
}

function endpoints() {
  return [
    { method: 'GET', path: '/api/summary', description: 'Totals and per-portal counts' },
    { method: 'GET', path: '/api/portals', description: 'The five portals with their ports and counts' },
    { method: 'GET', path: '/api/overview?days=30', description: 'Registrations and submissions over a window, with a daily series' },
    { method: 'GET', path: '/api/integration?days=30', description: 'Write-through attempts, success rate and HTTP statuses' },
    { method: 'GET', path: '/api/database', description: 'Tables and row counts of the platform database' },
    { method: 'GET', path: '/api/health', description: 'Database, ERP and portal listener checks' },
    { method: 'GET', path: '/api/people', description: 'Registered people' },
    { method: 'GET', path: '/api/submissions', description: 'Latest submissions' },
    { method: 'GET', path: '/api/sync', description: 'Write-through ledger' },
    { method: 'GET', path: '/api/audit', description: 'Audit log' },
  ];
}

module.exports = { parseDays, portals, overview, integration, database, health, endpoints };
