'use strict';

/**
 * The source mirror behind the person lookup: the lookup_* tables of erp.sqlite.
 *
 * On start the ERP loads the demonstration dataset into them, once per dataset
 * version; a restart with the same version changes nothing. LOOKUP_DATASET=off
 * leaves the mirror empty, so every search shows the "no records" state.
 */

const { db } = require('../db');
const ids = require('./identifiers');
const { dataset, VERSION } = require('./dataset');

const q = {
  countVersion: db.prepare('SELECT COUNT(*) AS n FROM lookup_subject WHERE dataset = ?'),
  insertSubject: db.prepare(
    `INSERT INTO lookup_subject (subject_ref, full_name, name_key, gender, birth_year, district, dataset)
     VALUES (?,?,?,?,?,?,?)`),
  insertIdentifier: db.prepare(
    `INSERT OR IGNORE INTO lookup_identifier (subject_id, id_type, value_hash, masked, source_system)
     VALUES (?,?,?,?,?)`),
  insertRecord: db.prepare(
    `INSERT INTO lookup_record (subject_id, source_system, record_type, record_ref, status, role, record_date, payload, history)
     VALUES (?,?,?,?,?,?,?,?,?)`),
  byIdentifier: db.prepare(
    `SELECT DISTINCT s.* FROM lookup_identifier i JOIN lookup_subject s ON s.id = i.subject_id
     WHERE i.id_type = ? AND i.value_hash = ? ORDER BY s.id`),
  byRef: db.prepare('SELECT * FROM lookup_subject WHERE subject_ref = ?'),
  identifiersOf: db.prepare(
    'SELECT id_type, masked, source_system FROM lookup_identifier WHERE subject_id = ? ORDER BY id'),
  recordsOf: db.prepare(
    `SELECT * FROM lookup_record WHERE subject_id = ? AND source_system = ?
     ORDER BY COALESCE(record_date, '') DESC, id`),
  countsOf: db.prepare(
    'SELECT source_system, COUNT(*) AS n FROM lookup_record WHERE subject_id = ? GROUP BY source_system'),
  maskedAadhaar: db.prepare(
    "SELECT masked FROM lookup_identifier WHERE subject_id = ? AND id_type = 'aadhaar' LIMIT 1"),
  audit: db.prepare(
    'INSERT INTO audit_log (entity, entity_id, action, maker, approver, details) VALUES (?,?,?,?,?,?)'),
};

/** Say so, once, when a production process runs with the demonstration defaults. */
function warnDefaults() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!process.env.LOOKUP_PEPPER) process.stderr.write('[erp] WARNING: LOOKUP_PEPPER is not set; identifier hashes use the public demonstration key.\n');
  if (!process.env.INTEGRATION_SECRET) process.stderr.write('[erp] WARNING: INTEGRATION_SECRET is not set; department deliveries are checked against the public demonstration key.\n');
  if (process.env.LOOKUP_DEMO_SAMPLES !== 'off') process.stderr.write('[erp] WARNING: the demo identities list is on (/api/lookup/samples); set LOOKUP_DEMO_SAMPLES=off outside a demonstration.\n');
}

/**
 * Where the mirror's rows come from:
 *   departments (default)  the department portals deliver them through the integration bus
 *   local                  the ERP loads the demonstration dataset itself (to run the ERP alone)
 *   off                    nothing; every search shows the "no records" state
 */
const mode = () => (['local', 'off'].includes(process.env.LOOKUP_DATASET) ? process.env.LOOKUP_DATASET : 'departments');

/** Load the dataset if this version is not already in place (local mode only). Never throws. */
function ensureLoaded() {
  warnDefaults();
  if (mode() !== 'local') return { loaded: false, reason: mode() === 'off' ? 'LOOKUP_DATASET=off' : 'filled by the departments through the integration bus' };
  try {
    const data = dataset();
    if (q.countVersion.get(VERSION).n === data.subjects.length) return { loaded: false, reason: 'already loaded' };
    db.transaction(() => {
      // Only the mirror is replaced. The audit log is never touched.
      db.prepare('DELETE FROM lookup_record').run();
      db.prepare('DELETE FROM lookup_link').run();
      db.prepare('DELETE FROM ingest_event').run();
      db.prepare('DELETE FROM lookup_identifier').run();
      db.prepare('DELETE FROM lookup_subject').run();
      for (const s of data.subjects) {
        const info = q.insertSubject.run(s.ref, s.name, ids.nameKey(s.name), s.gender, Number(s.dob.slice(0, 4)), s.district, VERSION);
        const sid = info.lastInsertRowid;
        for (const i of s.identifiers) {
          q.insertIdentifier.run(sid, i.type, ids.hash(i.type, i.value), ids.mask(i.type, i.value), i.system);
        }
        for (const r of s.records) {
          q.insertRecord.run(sid, r.system, r.type, r.ref, r.status || null, r.role || null, r.date || null,
            JSON.stringify(r.data), JSON.stringify(r.history || []));
        }
      }
      q.audit.run('lookup_dataset', VERSION, 'LOAD', 'erp', null,
        `person-lookup source mirror loaded: ${data.subjects.length} synthetic people`);
    })();
    return { loaded: true, subjects: data.subjects.length };
  } catch (err) {
    process.stderr.write(`[erp] lookup dataset not loaded: ${err.message}\n`);
    return { loaded: false, reason: err.message };
  }
}

const findByIdentifier = (type, value) => q.byIdentifier.all(type, ids.hash(type, value));

/** Every word typed must appear in the name, in any order. */
function findByName(key, limit = 25) {
  const words = key.split(' ').filter(Boolean).slice(0, 5);
  if (!words.length) return [];
  const where = words.map(() => "(' ' || name_key || ' ') LIKE ?").join(' AND ');
  return db.prepare(`SELECT * FROM lookup_subject WHERE ${where} ORDER BY full_name, id LIMIT ?`)
    .all(...words.map((w) => `% ${w}%`), limit);
}

const qMerged = db.prepare('SELECT s.* FROM lookup_merge m JOIN lookup_subject s ON s.id = m.into_subject_id WHERE m.from_ref = ?');
/** An ERP person by reference; a reference that was merged into another person opens that person. */
const subjectByRef = (ref) => q.byRef.get(String(ref || '')) || qMerged.get(String(ref || ''));
const qBasis = db.prepare(
  `SELECT l.source_system AS system, b.basis, COUNT(*) AS n FROM lookup_link l
   LEFT JOIN lookup_link_basis b ON b.source_system = l.source_system AND b.source_ref = l.source_ref
   WHERE l.subject_id = ? GROUP BY l.source_system, b.basis ORDER BY l.source_system`);
/** How each department's people were matched to this ERP person (Aadhaar, enrolment ID, mobile and name ...). */
const matchesOf = (sid) => qBasis.all(sid).map((r) => ({ system: r.system, basis: r.basis || 'earlier', count: r.n }));

const qLink = db.prepare(
  'SELECT s.subject_ref FROM lookup_link l JOIN lookup_subject s ON s.id = l.subject_id WHERE l.source_system = ? AND l.source_ref = ?');
/** The ERP person reference of a department's own person reference, if it has been delivered. */
const refFor = (source, sourceRef) => (qLink.get(source, String(sourceRef)) || {}).subject_ref || null;
const identifiersOf = (sid) => q.identifiersOf.all(sid);
const qLinksOf = db.prepare('SELECT source_ref FROM lookup_link WHERE subject_id = ? AND source_system = ? ORDER BY linked_at');
/** A department's own person references for one ERP person (the ERP never holds the full Aadhaar; UIDAI does). */
const linksOf = (sid, source) => qLinksOf.all(sid, source).map((r) => r.source_ref);
const maskedAadhaar = (sid) => (q.maskedAadhaar.get(sid) || {}).masked || null;

function recordsOf(sid, system) {
  return q.recordsOf.all(sid, system).map((r) => ({
    type: r.record_type, ref: r.record_ref, status: r.status, role: r.role, date: r.record_date,
    data: JSON.parse(r.payload), history: JSON.parse(r.history || '[]'), observedAt: r.observed_at,
  }));
}

function countsOf(sid) {
  const out = {};
  for (const r of q.countsOf.all(sid)) out[r.source_system] = r.n;
  return out;
}

function stats() {
  return {
    dataset: (db.prepare('SELECT dataset, MIN(loaded_at) AS loaded_at, COUNT(*) AS n FROM lookup_subject GROUP BY dataset').get()) || null,
    records: db.prepare('SELECT source_system AS system, COUNT(*) AS n, COUNT(DISTINCT subject_id) AS people FROM lookup_record GROUP BY source_system').all(),
  };
}

/**
 * The people the ERP actually holds, newest activity first, with how many records each has and from which systems.
 * `total` is the real count (it matches `q` when one is given), so the page never shows a made-up number.
 */
function people({ limit = 50, offset = 0, q = '' } = {}) {
  const like = '%' + String(q || '').trim().replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const where = q ? "WHERE s.full_name LIKE ? ESCAPE '\\'" : '';
  const args = q ? [like] : [];
  const total = db.prepare(`SELECT COUNT(*) AS n FROM lookup_subject s ${where}`).get(...args).n;
  const rows = db.prepare(
    `SELECT s.subject_ref AS ref, s.full_name AS name, s.gender, s.birth_year AS birthYear, s.district,
            COUNT(r.id) AS records, group_concat(DISTINCT r.source_system) AS systems, MAX(r.observed_at) AS last
       FROM lookup_subject s LEFT JOIN lookup_record r ON r.subject_id = s.id ${where}
      GROUP BY s.id ORDER BY (MAX(r.observed_at) IS NULL), MAX(r.observed_at) DESC, s.id DESC LIMIT ? OFFSET ?`)
    .all(...args, Math.max(1, Math.min(500, limit | 0)), Math.max(0, offset | 0));
  return {
    total,
    people: rows.map((r) => ({ ref: r.ref, name: r.name, gender: r.gender, birthYear: r.birthYear, district: r.district, records: r.records, systems: String(r.systems || '').split(',').filter(Boolean), lastReceivedAt: r.last || null })),
  };
}

function audit(action, maker, details) {
  try { q.audit.run('lookup', 'person', action, maker, null, details); } catch (err) {
    process.stderr.write(`[erp] lookup audit failed: ${err.message}\n`);
  }
}

module.exports = {
  mode, ensureLoaded, refFor, linksOf, matchesOf, findByIdentifier, findByName, subjectByRef, identifiersOf, maskedAadhaar,
  recordsOf, countsOf, stats, people, audit,
};
