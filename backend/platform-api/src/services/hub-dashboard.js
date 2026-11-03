'use strict';

/**
 * One document for the dashboard at the hub's "/".
 *
 * Platform data comes straight from this process's own database. ERP data
 * comes over HTTP from the ERP's read-only API, the same direction the
 * write-through already uses. The ERP's database is never opened here and the
 * browser never talks to a database.
 *
 * Nothing is invented: when the ERP cannot be reached, `erp.ok` is false and
 * the ERP-derived lists are empty, so the page shows an error state.
 */

const http = require('http');
const store = require('../db');
const erp = require('./erp-client');
const stats = require('./hub-stats');
const { SITES } = require('../config/sites');

const { db } = store;
const MAX_ROWS = 5000;
const HUB_PORT = Number(process.env.PLATFORM_PORT) || 4100;

/** GET a JSON document from the ERP; never throws. */
function erpGet(pathAndQuery, timeoutMs = 4000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const done = (r) => resolve({ ms: Date.now() - started, ...r });
    const req = http.get(`${erp.target()}${pathAndQuery}`, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { done({ ok: res.statusCode === 200, status: res.statusCode, json: JSON.parse(body) }); }
        catch { done({ ok: false, status: res.statusCode, error: 'ERP sent a reply that is not JSON' }); }
      });
    });
    req.once('timeout', () => req.destroy(new Error('timed out')));
    req.once('error', (err) => done({ ok: false, error: err.message }));
  });
}

/**
 * The erp_sync ledger with the portal each attempt belongs to.
 *
 * The ledger itself has no site column, so the portal is found from the row the
 * attempt was about: the submission, the registered person, or, when the attempt
 * was refused and its row was taken back out, the permanent ROLLBACK audit entry.
 */
function syncRows() {
  return db.prepare(
    `SELECT e.id, e.entity, e.local_ref AS localRef, e.status, e.http_status AS httpStatus,
            e.erp_ref AS erpRef, e.message, e.attempted_at AS attemptedAt,
            COALESCE(s.site_code, p.registered_via,
              (SELECT a.site_code FROM audit_log a
                WHERE a.action = 'ROLLBACK' AND instr(a.details, e.local_ref) > 0
                ORDER BY a.id DESC LIMIT 1)) AS siteCode
       FROM erp_sync e
       LEFT JOIN submission s ON e.entity = 'submission' AND s.reference_no = e.local_ref
       LEFT JOIN person p ON e.entity = 'person' AND p.person_ref = e.local_ref
      ORDER BY e.id DESC LIMIT ?`).all(MAX_ROWS);
}

function submissionRows() {
  return db.prepare(
    `SELECT s.reference_no AS reference, s.site_code AS siteCode, s.erp_intake_ref AS erpRef,
            s.created_at AS createdAt, p.full_name AS person
       FROM submission s LEFT JOIN person p ON p.id = s.person_id
      ORDER BY s.id DESC LIMIT ?`).all(MAX_ROWS);
}

function portalRows() {
  const forms = new Map(db.prepare('SELECT site_code AS code, COUNT(*) AS n FROM form GROUP BY site_code')
    .all().map((r) => [r.code, r.n]));
  return stats.portals().map((p) => ({ ...p, forms: forms.get(p.code) || 0 }));
}

/** Service rows for the System Health view: only what has actually been probed. */
function serviceRows(health, erpHealth, erpReply) {
  const rows = [];
  const target = erp.target();
  rows.push({
    key: 'erp', name: 'ERP API and console', sub: target,
    status: erpReply.ok ? 'ok' : 'down', ms: erpReply.ms,
    detail: erpReply.ok ? 'GET /api/summary answered 200' : (erpReply.error || `HTTP ${erpReply.status}`),
  });
  rows.push({
    key: 'hub', name: 'Platform hub', sub: `:${HUB_PORT}`, status: 'ok', ms: 0,
    detail: 'answering this request',
  });
  for (const c of health.checks) {
    if (c.name === 'Platform database') {
      rows.push({ key: 'platform-db', name: 'Platform database (platform.sqlite)', sub: 'SQLite', status: c.status, ms: c.ms, detail: c.detail });
    } else if (c.name.endsWith(' listener')) {
      const site = SITES.find((s) => `${s.name} listener` === c.name);
      rows.push({
        key: `portal:${site ? site.code : c.name}`, name: `${site ? site.name : c.name} replica`,
        sub: site ? `:${site.port}` : '', status: c.status, ms: c.ms, detail: c.detail,
      });
    }
  }
  const sq = erpHealth.ok ? erpHealth.json.sqlite : null;
  rows.push({
    key: 'erp-db', name: 'ERP database (erp.sqlite)', sub: 'SQLite',
    status: sq ? sq.status : 'unknown', ms: erpHealth.ms,
    detail: sq ? 'answers queries' : 'the ERP did not report on its database',
  });
  const pg = erpHealth.ok ? erpHealth.json.postgres : null;
  rows.push({
    key: 'postgres', name: 'PostgreSQL demo_replica', sub: 'checked by the ERP service',
    status: pg ? pg.status : 'unknown', ms: erpHealth.ms,
    detail: pg ? (pg.detail || 'answers queries') : 'the ERP did not report on PostgreSQL',
  });
  rows.push({
    key: 'docker', name: 'Docker container health', sub: 'compose healthchecks', status: 'unavailable', ms: null,
    detail: 'container health is only visible from the Docker host (docker compose ps), not from inside a container',
  });
  return rows;
}

async function build() {
  const [summary, intake, citizens, audit, erpDb, erpHealth] = await Promise.all([
    erpGet('/api/summary'),
    erpGet(`/api/intake?limit=${MAX_ROWS}`, 15000),
    erpGet(`/api/citizens?limit=${MAX_ROWS}`, 15000),
    erpGet(`/api/audit?limit=${MAX_ROWS}`, 15000),
    erpGet('/api/database'),
    erpGet('/api/health'),
  ]);
  const health = await stats.health();
  const erpOk = summary.ok && intake.ok && citizens.ok && audit.ok;
  const total = erpOk ? summary.json : { citizens: 0, intake: 0 };
  const sync = syncRows();
  const submissions = submissionRows();
  const counts = store.summary();

  return {
    generatedAt: new Date().toISOString(),
    hub: { port: HUB_PORT },
    erp: {
      ok: erpOk,
      target: erp.target(),
      error: erpOk ? null : [summary, intake, citizens, audit].filter((r) => !r.ok)
        .map((r) => r.error || `HTTP ${r.status}`)[0] || 'unavailable',
      summary: summary.ok ? summary.json : null,
      // The raw payload repeats the field values already listed per record; it is not forwarded.
      intakes: intake.ok ? intake.json.intake.map(({ payload, ...row }) => row) : [],
      citizens: citizens.ok ? citizens.json.citizens : [],
      audit: audit.ok ? audit.json.audit : [],
      database: erpDb.ok ? erpDb.json : null,
    },
    platform: {
      portals: portalRows(),
      sync,
      submissions,
      totals: { people: counts.people, submissions: counts.submissions, mirrored: counts.synced },
      database: stats.database(),
    },
    services: serviceRows(health, erpHealth, summary),
    truncated: {
      intakes: erpOk && intake.json.intake.length < total.intake,
      citizens: erpOk && citizens.json.citizens.length < total.citizens,
      audit: erpOk && audit.json.audit.length >= MAX_ROWS,
      sync: sync.length >= MAX_ROWS,
      submissions: submissions.length >= MAX_ROWS,
    },
    limit: MAX_ROWS,
  };
}

module.exports = { build };
