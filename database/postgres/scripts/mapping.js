'use strict';

/**
 * Reads every SQLite source read-only and decides which website each row
 * belongs to. Returns { site -> [ {record_type, source_id, source_key, data} ] }.
 *
 * Nothing is guessed: a table this file does not know about, or a row it cannot
 * route to a website, is reported in `unrouted` and makes the migration stop.
 * The only rows deliberately left out are the login `session` tokens, and the
 * password hash/salt columns of `person`.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..', '..', '..');

/** The five tables and the site code each one holds. */
const SITE_TABLE = {
  uidai: 'aadhaar_data',
  cctns: 'cctns_data',
  ecourts: 'ecourts_data',
  eforensics: 'eforensics_data',
  eprisons: 'eprisons_data',
};

/** gov_replica project directory -> site code. */
const REPLICAS = {
  uidai: 'Aadhaar/uidai_gov_in',
  cctns: 'CCTNS/www_digitalpolicecitizenservices_gov_in',
  ecourts: 'E_Courts/ecourts_gov_in',
  eforensics: 'E_Forensics/eforensics_gov_in',
  eprisons: 'E_Prisons/eprisons_nic_in',
};

/** Tables of the hand-built ePrisons domain inside platform.sqlite. */
const EPRISONS_DOMAIN = [
  'absconder', 'additional_visitor', 'citizen_account', 'gender', 'grievance',
  'grievance_action', 'id_proof_type', 'jail', 'lockup_report', 'parole_jumper',
  'relationship', 'state', 'statistic_snapshot', 'visit_request',
];
/** audit_log rows with no site_code are ePrisons rows when about these entities. */
const EPRISONS_ENTITIES = new Set(EPRISONS_DOMAIN);

const SITE_SCOPED = ['submission', 'form', 'audit_log', 'reference_option', 'demo_table_row', 'cascade_option'];
const SKIPPED = { session: 'login tokens are not copied' };
const SECRET_COLUMNS = { person: ['password_hash', 'password_salt'] };
const JSON_COLUMNS = new Set(['payload', 'cells', 'details']);

/** First existing path wins: the new location, then where the live servers still read it. */
function firstExisting(...candidates) {
  const hit = candidates.find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`database not found, looked in:\n  ${candidates.join('\n  ')}`);
  return hit;
}

function open(file) {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  db.exec('BEGIN'); // one snapshot for the whole read, even if a server writes meanwhile
  return db;
}

function tables(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all().map((t) => t.name);
}

function pkOf(db, table) {
  const pk = db.prepare(`PRAGMA table_info("${table}")`).all().filter((c) => c.pk);
  if (pk.length !== 1) return { id: null, key: null };
  return /INT/i.test(pk[0].type) ? { id: pk[0].name, key: null } : { id: null, key: pk[0].name };
}

function jsonify(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (JSON_COLUMNS.has(k) && typeof v === 'string' && /^\s*[[{]/.test(v)) {
      try { out[k] = JSON.parse(v); continue; } catch { /* keep as text */ }
    }
    out[k] = v;
  }
  return out;
}

function makeSink() {
  const rows = Object.fromEntries(Object.keys(SITE_TABLE).map((s) => [s, []]));
  const unrouted = [];
  const skipped = {};
  return {
    rows, unrouted, skipped,
    add(site, recordType, row, pk) {
      if (!rows[site]) { unrouted.push({ recordType, row: JSON.stringify(row).slice(0, 120) }); return; }
      const clean = jsonify(row);
      rows[site].push({
        record_type: recordType,
        source_id: pk.id ? Number(row[pk.id]) : null,
        source_key: pk.key ? String(row[pk.key]) : null,
        data: clean,
      });
    },
  };
}

function readTable(db, table) {
  return db.prepare(`SELECT * FROM "${table}"`).all();
}

// ---- 1. each site's own replica database -----------------------------------
function fromReplicas(sink) {
  for (const [site, dir] of Object.entries(REPLICAS)) {
    const file = path.join(ROOT, 'backend', 'gov_replica', dir, 'replica', 'database', 'replica.sqlite');
    const db = open(file);
    for (const t of tables(db)) {
      const pk = pkOf(db, t);
      for (const row of readTable(db, t)) sink.add(site, t, row, pk);
    }
    db.close();
  }
}

// ---- 2. platform.sqlite -----------------------------------------------------
function fromPlatform(sink) {
  const file = firstExisting(
    path.join(ROOT, 'database', 'sqlite', 'platform', 'data', 'platform.sqlite'),
    path.join(ROOT, 'platform', 'database', 'platform.sqlite'));
  const db = open(file);

  const subSite = new Map(db.prepare('SELECT id, reference_no, site_code FROM submission').all()
    .map((s) => [s.id, s]));
  const refSite = new Map([...subSite.values()].map((s) => [s.reference_no, s.site_code]));
  const personSite = new Map(db.prepare('SELECT person_ref, registered_via FROM person').all()
    .map((p) => [p.person_ref, p.registered_via]));

  for (const t of tables(db)) {
    const pk = pkOf(db, t);
    const rt = `platform_${t}`;
    if (SKIPPED[t]) { sink.skipped[rt] = { reason: SKIPPED[t], rows: readTable(db, t).length }; continue; }

    for (const row of readTable(db, t)) {
      let site;
      if (t === 'site') site = row.code;
      else if (t === 'audit_log') site = row.site_code || (EPRISONS_ENTITIES.has(row.entity) ? 'eprisons' : null);
      else if (SITE_SCOPED.includes(t)) site = row.site_code;
      else if (t === 'submission_field') site = (subSite.get(row.submission_id) || {}).site_code;
      else if (EPRISONS_DOMAIN.includes(t)) site = 'eprisons';
      else if (t === 'person') site = row.registered_via;
      else if (t === 'erp_sync') site = row.entity === 'person' ? personSite.get(row.local_ref) : refSite.get(row.local_ref);
      else { sink.unrouted.push({ recordType: rt, row: `unknown table ${t}` }); break; }

      let out = row;
      if (SECRET_COLUMNS[t]) {
        out = { ...row };
        for (const c of SECRET_COLUMNS[t]) delete out[c];
      }
      sink.add(site, rt, out, pk);
    }
  }
  db.close();
}

// ---- 3. erp.sqlite ----------------------------------------------------------
function fromErp(sink) {
  const file = firstExisting(
    path.join(ROOT, 'database', 'sqlite', 'erp', 'data', 'erp.sqlite'),
    path.join(ROOT, 'erp', 'database', 'erp.sqlite'));
  const db = open(file);

  const intakeSite = new Map(db.prepare('SELECT id, source_system FROM intake').all().map((i) => [i.id, i.source_system]));
  const citizenSite = new Map(db.prepare('SELECT id, first_seen_in FROM citizen').all().map((c) => [c.id, c.first_seen_in]));

  for (const t of tables(db)) {
    const pk = pkOf(db, t);
    const rt = `erp_${t}`;
    for (const row of readTable(db, t)) {
      let site;
      if (t === 'source_system') site = row.code;
      else if (t === 'intake') site = row.source_system;
      else if (t === 'intake_field') site = intakeSite.get(row.intake_id);
      else if (t === 'citizen') site = row.first_seen_in;
      else if (t === 'audit_log') {
        const id = Number(row.entity_id);
        site = row.entity === 'intake' ? intakeSite.get(id) : row.entity === 'citizen' ? citizenSite.get(id) : null;
      } else { sink.unrouted.push({ recordType: rt, row: `unknown table ${t}` }); break; }
      sink.add(site, rt, row, pk);
    }
  }
  db.close();
}

function extractAll() {
  const sink = makeSink();
  fromReplicas(sink);
  fromPlatform(sink);
  fromErp(sink);
  return sink;
}

/** { site: { record_type: count } } */
function countsOf(rows) {
  const out = {};
  for (const [site, list] of Object.entries(rows)) {
    out[site] = {};
    for (const r of list) out[site][r.record_type] = (out[site][r.record_type] || 0) + 1;
  }
  return out;
}

module.exports = { SITE_TABLE, extractAll, countsOf };
