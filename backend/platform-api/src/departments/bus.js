'use strict';

/**
 * The integration bus: department outboxes -> the ERP.
 *
 * A department writes a record and its outbox event in one transaction, so an
 * event exists exactly when the change does (the transactional outbox). The
 * bus then delivers it:
 *
 *   - at once: a commit schedules a flush on the next tick, so a record usually
 *     reaches the ERP within milliseconds of being saved;
 *   - in order: one delivery in flight per department, oldest event first;
 *   - in batches of up to 50, signed with HMAC-SHA256 over the timestamp and body
 *     (X-Integration-Timestamp, X-Integration-Signature);
 *   - at least once: an event stays pending until the ERP acknowledges it; a
 *     failure is retried with exponential backoff (1 s, 2 s, 4 s ... 60 s), and
 *     the ERP ignores an event id it has already processed, so a retry never
 *     duplicates anything;
 *   - visibly: every attempt, error and delivery time is kept in the outbox and
 *     shown on the department's integration page.
 *
 * A sweep every 2 seconds picks up retries and anything a restart left behind.
 * The ERP is reached over HTTP only; its database is never opened here.
 */

const http = require('http');
const crypto = require('crypto');
const erp = require('../services/erp-client');

const sec = require('../../../shared/security');
// the key the deliveries are signed with; never a built-in value (shared/security.js)
const SECRET = sec.requireOrExit(() => sec.secret('INTEGRATION_SECRET'));
const BATCH = 50;
const TIMEOUT_MS = Number(process.env.INTEGRATION_TIMEOUT_MS) || 8000;
const SWEEP_MS = 2000;
const MAX_BACKOFF_MS = 60000;

const stores = new Map();      // code -> department store
const busy = new Map();        // code -> a delivery is in flight
const again = new Map();       // code -> something arrived while busy
const queued = new Set();      // codes with a flush scheduled for the next tick

function register(store) { stores.set(store.code, store); }

/** Ask for a flush of this department soon (coalesced). */
function schedule(code) {
  if (queued.has(code)) return;
  queued.add(code);
  setImmediate(() => { queued.delete(code); flush(code); });
}

function post(body) {
  return new Promise((resolve) => {
    const payload = Buffer.from(body, 'utf8');
    const ts = String(Date.now());
    const sig = crypto.createHmac('sha256', SECRET).update(`${ts}.`).update(payload).digest('hex');
    const target = new URL('/api/ingest/events', erp.target());
    const req = http.request({
      host: target.hostname, port: target.port, path: target.pathname, method: 'POST', timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json', 'Content-Length': payload.length,
        'X-Integration-Timestamp': ts, 'X-Integration-Signature': `sha256=${sig}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* reported below */ }
        resolve({ status: res.statusCode, json });
      });
      res.on('error', (err) => resolve({ status: 0, error: err.message }));
    });
    req.on('timeout', () => req.destroy(new Error(`no answer within ${TIMEOUT_MS} ms`)));
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.end(payload);
  });
}

async function flush(code) {
  const store = stores.get(code);
  if (!store) return;
  if (busy.get(code)) { again.set(code, true); return; }
  busy.set(code, true);
  try {
    for (;;) {
      const now = Date.now();
      const rows = store.db.prepare(
        `SELECT * FROM outbox WHERE status = 'pending' AND next_attempt_ms <= ? ORDER BY id LIMIT ${BATCH}`).all(now);
      if (!rows.length) break;
      const events = rows.map((r) => JSON.parse(r.payload));
      const res = await post(JSON.stringify({ source: code, sentAt: new Date().toISOString(), events }));
      const done = Date.now();
      if (res.status === 200 && res.json && Array.isArray(res.json.results)) {
        const byId = new Map(res.json.results.map((x) => [x.id, x]));
        store.db.transaction(() => {
          for (const r of rows) {
            const out = byId.get(r.event_id);
            if (out && (out.status === 'accepted' || out.status === 'duplicate')) {
              store.db.prepare(`UPDATE outbox SET status = 'delivered', delivered_ms = ?, attempts = attempts + 1, last_error = NULL WHERE id = ?`).run(done, r.id);
            } else if (out && out.status === 'rejected') {
              // the ERP read the event and refused it: retrying the same bytes cannot succeed
              store.db.prepare(`UPDATE outbox SET status = 'rejected', attempts = attempts + 1, last_error = ? WHERE id = ?`).run(String(out.error || 'rejected').slice(0, 500), r.id);
            } else {
              backoff(store, r, 'The ERP did not report on this event.');
            }
          }
        })();
        continue;
      }
      const why = res.error ? `ERP unreachable: ${res.error}`
        : `ERP answered HTTP ${res.status}${res.json && res.json.error ? `: ${res.json.error}` : ''}`;
      store.db.transaction(() => { for (const r of rows) backoff(store, r, why); })();
      break;
    }
  } catch (err) {
    process.stderr.write(`[bus:${code}] ${err.stack || err}\n`);
  } finally {
    busy.set(code, false);
    if (again.get(code)) { again.set(code, false); schedule(code); }
  }
}

function backoff(store, row, error) {
  const attempts = row.attempts + 1;
  const wait = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempts - 1, 6));
  store.db.prepare('UPDATE outbox SET attempts = ?, next_attempt_ms = ?, last_error = ? WHERE id = ?')
    .run(attempts, Date.now() + wait, String(error).slice(0, 500), row.id);
}

let timer = null;
/** Start the sweep that retries and catches up; idempotent. */
function start() {
  if (timer) return;
  timer = setInterval(() => { for (const code of stores.keys()) flush(code); }, SWEEP_MS);
  timer.unref();
  for (const code of stores.keys()) schedule(code);
}

/** Put events that were refused back in the queue, e.g. after the ERP was fixed. */
function retry(code) {
  const store = stores.get(code);
  if (!store) return 0;
  const n = store.db.prepare(`UPDATE outbox SET status = 'pending', next_attempt_ms = ? WHERE status IN ('pending', 'rejected')`).run(Date.now()).changes;
  schedule(code);
  return n;
}

/** Figures for the integration page. */
function stats(code) {
  const store = stores.get(code);
  const db = store.db;
  const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM outbox GROUP BY status').all().map((r) => [r.status, r.n]));
  const last = db.prepare(`SELECT delivered_ms, created_ms FROM outbox WHERE status = 'delivered' ORDER BY delivered_ms DESC LIMIT 50`).all();
  const latencies = last.map((r) => r.delivered_ms - r.created_ms).filter((n) => n >= 0).sort((a, b) => a - b);
  const oldest = db.prepare(`SELECT MIN(created_ms) AS t FROM outbox WHERE status = 'pending'`).get().t;
  const failing = db.prepare(`SELECT last_error FROM outbox WHERE status = 'pending' AND attempts > 0 ORDER BY id DESC LIMIT 1`).get();
  return {
    delivered: counts.delivered || 0, pending: counts.pending || 0, rejected: counts.rejected || 0,
    lastDeliveredAt: last.length ? new Date(last[0].delivered_ms).toISOString() : null,
    medianLatencyMs: latencies.length ? latencies[Math.floor(latencies.length / 2)] : null,
    oldestPendingAt: oldest ? new Date(oldest).toISOString() : null,
    lastError: failing ? failing.last_error : null,
    healthy: !(counts.rejected) && !(failing && failing.last_error),
    target: `${erp.target()}/api/ingest/events`,
  };
}

function events(code, limit = 100) {
  const store = stores.get(code);
  return store.db.prepare(
    `SELECT event_id, record_ref, event_type, status, attempts, created_ms, delivered_ms, last_error
     FROM outbox ORDER BY id DESC LIMIT ?`).all(limit).map((r) => ({
    id: r.event_id, recordRef: r.record_ref, type: r.event_type, status: r.status, attempts: r.attempts,
    createdAt: new Date(r.created_ms).toISOString(),
    deliveredAt: r.delivered_ms ? new Date(r.delivered_ms).toISOString() : null,
    latencyMs: r.delivered_ms ? r.delivered_ms - r.created_ms : null,
    error: r.last_error,
  }));
}

module.exports = { register, schedule, start, retry, stats, events, flush };
