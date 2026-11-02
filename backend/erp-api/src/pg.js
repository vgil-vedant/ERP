'use strict';

/**
 * PostgreSQL client for demo_replica (Docker: ERP_postgres, 127.0.0.1:7432).
 *
 * All five portal tables store JSONB rows keyed by record_type.
 * We query record_type = 'platform_erp_sync' across all five to build
 * the sync ledger shown on the Sync Activity page.
 *
 * Falls back gracefully (empty arrays) if pg is not installed yet or
 * the container is unreachable — the rest of the ERP keeps working.
 *
 * Credential resolution order (first wins):
 *   1. PGPASSWORD environment variable
 *   2. /run/secrets/ERP_pg_password   (Docker secret)
 *   3. PGPASSWORD= in the root .env file
 */

let Pool;
try { Pool = require('pg').Pool; } catch (_) { Pool = null; }

const path = require('path');
const fs   = require('fs');

/* ── connection settings ─────────────────────────────────────────────────── */
function loadEnv() {
  const env = { ...process.env };

  // Load .env file — values only fill in keys not already set by shell / Docker
  const file = path.resolve(__dirname, '..', '..', '..', '..', '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !line.trim().startsWith('#') && env[m[1]] === undefined)
        env[m[1]] = m[2].replace(/^(['"])(.*)\\1$/, '$2');
    }
  }

  // Docker secret — used when PGPASSWORD is not set in env or .env
  if (!env.PGPASSWORD) {
    const secret = '/run/secrets/ERP_pg_password';
    if (fs.existsSync(secret)) env.PGPASSWORD = fs.readFileSync(secret, 'utf8').trim();
  }

  return env;
}

let pool = null;
function getPool() {
  if (!Pool) return null;
  if (pool) return pool;
  const e = loadEnv();
  pool = new Pool({
    host:     e.PGHOST     || '127.0.0.1',
    port:     Number(e.PGPORT || 7432),
    user:     e.PGUSER     || 'ams',
    database: e.PGDATABASE || 'demo_replica',
    password: e.PGPASSWORD || '',
    max: 4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });
  pool.on('error', (err) => {
    process.stderr.write(`[erp/pg] pool error: ${err.message}\n`);
  });
  return pool;
}

/* ── known portal tables ─────────────────────────────────────────────────── */
const SITE_TABLE = {
  eprisons:   'eprisons_data',
  cctns:      'cctns_data',
  ecourts:    'ecourts_data',
  eforensics: 'eforensics_data',
  uidai:      'aadhaar_data',
};

const SITE_LABEL = {
  eprisons:   'ePrisons',
  cctns:      'CCTNS',
  ecourts:    'eCourts',
  eforensics: 'e-Forensics',
  uidai:      'UIDAI / Aadhaar',
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
async function query(sql, params) {
  const p = getPool();
  if (!p) return { rows: [] };
  try {
    return await p.query(sql, params);
  } catch (err) {
    process.stderr.write(`[erp/pg] query error: ${err.message}\n`);
    return { rows: [] };
  }
}

/* ── public API ──────────────────────────────────────────────────────────── */

/**
 * Returns all platform_erp_sync rows from every portal table,
 * newest-first, limited to `limit` rows (default 300).
 *
 * Each row: { site_code, site_label, entity, local_ref, status,
 *             http_status, erp_ref, message, attempted_at }
 */
async function syncLedger(limit = 300, siteFilter = null) {
  const parts = Object.entries(SITE_TABLE)
    .filter(([code]) => !siteFilter || code === siteFilter)
    .map(([code, tbl]) => `
      SELECT
        '${code}'                       AS site_code,
        '${SITE_LABEL[code]}'           AS site_label,
        data->>'entity'                 AS entity,
        data->>'local_ref'              AS local_ref,
        data->>'status'                 AS status,
        (data->>'http_status')::int     AS http_status,
        data->>'erp_ref'                AS erp_ref,
        data->>'message'                AS message,
        data->>'attempted_at'           AS attempted_at
      FROM ${tbl}
      WHERE record_type = 'platform_erp_sync'`);

  if (!parts.length) return [];
  const sql = `
    SELECT * FROM (${parts.join('\n      UNION ALL\n')}) t
    ORDER BY attempted_at DESC NULLS LAST
    LIMIT $1`;
  const result = await query(sql, [limit]);
  return result.rows;
}

/**
 * Returns per-portal sync summary counts:
 * { site_code, site_label, total, kept, duplicate, rolled_back, failed }
 */
async function syncSummary() {
  const parts = Object.entries(SITE_TABLE).map(([code, tbl]) => `
    SELECT
      '${code}'                   AS site_code,
      '${SITE_LABEL[code]}'       AS site_label,
      COUNT(*)::int                AS total,
      COUNT(*) FILTER (WHERE data->>'status' = 'kept')::int        AS kept,
      COUNT(*) FILTER (WHERE data->>'status' = 'duplicate')::int   AS duplicate,
      COUNT(*) FILTER (WHERE data->>'status' = 'rolled_back')::int AS rolled_back,
      COUNT(*) FILTER (WHERE (data->>'http_status')::int >= 400)::int AS failed
    FROM ${tbl}
    WHERE record_type = 'platform_erp_sync'`);

  const sql = `${parts.join('\n  UNION ALL\n')} ORDER BY site_code`;
  const result = await query(sql, []);
  return result.rows;
}

/**
 * Returns one sample sync row for a given erp_ref (to show in drawer).
 */
async function syncRow(erpRef) {
  const parts = Object.entries(SITE_TABLE).map(([code, tbl]) => `
    SELECT '${code}' AS site_code, data
    FROM ${tbl}
    WHERE record_type = 'platform_erp_sync' AND data->>'erp_ref' = $1`);
  const sql = `${parts.join('\n  UNION ALL\n')} LIMIT 1`;
  const result = await query(sql, [erpRef]);
  return result.rows[0] || null;
}

/** True if the pg pool connected successfully (used for health display). */
async function pgOnline() {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query('SELECT 1');
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { syncLedger, syncSummary, syncRow, pgOnline, SITE_LABEL };
