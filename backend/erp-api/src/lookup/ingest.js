'use strict';

/**
 * The ERP end of the integration bus: POST /api/ingest/events.
 *
 * The departments push their record changes here; the ERP never calls them.
 * For each event:
 *
 *   1. Authenticity: an HMAC-SHA256 over "<timestamp>.<body>" with the shared
 *      INTEGRATION_SECRET, and a timestamp within five minutes.
 *   2. Idempotency: an event id already in ingest_event is acknowledged as a
 *      duplicate and not applied again.
 *   3. Identity resolution, per person the record names. Aadhaar comes first:
 *      it is the one number that identifies a person uniquely across India.
 *        a) The person carries a valid Aadhaar (12 digits, Verhoeff check):
 *           the ERP person holding that Aadhaar, whoever the department link
 *           pointed at before. If the department person had been filed under
 *           a person with no Aadhaar, that person is merged into the holder;
 *           if it had been filed under a person with a different Aadhaar, it
 *           is moved, never merged. Nobody holds the Aadhaar yet: the linked
 *           person (if it has no Aadhaar of its own), else the same enrolment
 *           ID (same rule), else a new ERP person.
 *        b) No Aadhaar: the department's own reference seen before
 *           (lookup_link), else the same enrolment ID, else the same mobile
 *           number and name together, but only with a person who has no
 *           Aadhaar either (never for UIDAI, whose people are identified by
 *           enrolment ID and Aadhaar; LOOKUP_MATCH_NO_AADHAAR=off turns this
 *           step off), else a new ERP person.
 *      Two different Aadhaar numbers are never merged into one person.
 *      Record numbers (FIR, CNR ...) are indexed but never used to merge two
 *      people: an FIR names its accused and its complainant.
 *      How each link was made is kept in lookup_link_basis.
 *   4. The record is filed under each person (one row per person), replacing
 *      the earlier version; its numbers become searchable.
 *   5. Live: an event goes out to every open lookup page (./live.js).
 *
 * Each event is applied in one transaction: all of it or none of it.
 */

const crypto = require('crypto');
const { db } = require('../db');
const ids = require('./identifiers');
const live = require('./live');

const sec = require('../../../shared/security');
// the key the departments sign their deliveries with; never a built-in value (shared/security.js)
const SECRET = sec.requireOrExit(() => sec.secret('INTEGRATION_SECRET'));
const SKEW_MS = 5 * 60 * 1000;
const SOURCES = ['uidai', 'cctns', 'eforensics', 'ecourts', 'eprisons'];
const PERSON_IDS = ['aadhaar', 'eid', 'mobile'];
const CASE_IDS = ['fir', 'cnr', 'fsl', 'prisoner', 'visit', 'pcc'];
// people without an Aadhaar: matched by mobile number and name (the earlier rule), unless switched off
const MATCH_NO_AADHAAR = process.env.LOOKUP_MATCH_NO_AADHAAR === 'off' ? 'off' : 'mobile_name';

const q = {
  seen: db.prepare('SELECT 1 FROM ingest_event WHERE event_id = ?'),
  link: db.prepare('SELECT subject_id FROM lookup_link WHERE source_system = ? AND source_ref = ?'),
  addLink: db.prepare('INSERT OR IGNORE INTO lookup_link (source_system, source_ref, subject_id) VALUES (?,?,?)'),
  byId: db.prepare(
    `SELECT DISTINCT s.id, s.name_key FROM lookup_identifier i JOIN lookup_subject s ON s.id = i.subject_id
     WHERE i.id_type = ? AND i.value_hash = ? ORDER BY s.id`),
  subject: db.prepare('SELECT * FROM lookup_subject WHERE id = ?'),
  maxRef: db.prepare("SELECT MAX(CAST(substr(subject_ref, 5) AS INTEGER)) AS n FROM lookup_subject WHERE subject_ref LIKE 'PSN-%'"),
  insertSubject: db.prepare(
    `INSERT INTO lookup_subject (subject_ref, full_name, name_key, gender, birth_year, district, dataset)
     VALUES (?,?,?,?,?,?, 'departments')`),
  updateSubject: db.prepare(
    'UPDATE lookup_subject SET full_name = ?, name_key = ?, gender = ?, birth_year = ?, district = ? WHERE id = ?'),
  addId: db.prepare(
    'INSERT OR IGNORE INTO lookup_identifier (subject_id, id_type, value_hash, masked, source_system) VALUES (?,?,?,?,?)'),
  upsertRecord: db.prepare(
    `INSERT INTO lookup_record (subject_id, source_system, record_type, record_ref, status, role, record_date, payload, history, observed_at)
     VALUES (@subject_id, @source, @type, @ref, @status, @role, @date, @payload, @history, datetime('now'))
     ON CONFLICT(source_system, record_type, record_ref, subject_id) DO UPDATE SET
       status = excluded.status, role = excluded.role, record_date = excluded.record_date,
       payload = excluded.payload, history = excluded.history, observed_at = excluded.observed_at`),
  markSeen: db.prepare(
    'INSERT INTO ingest_event (event_id, source_system, record_type, record_ref, parties, occurred_at) VALUES (?,?,?,?,?,?)'),
  existed: db.prepare('SELECT 1 FROM lookup_record WHERE source_system = ? AND record_type = ? AND record_ref = ? LIMIT 1'),
  // Aadhaar-first resolution
  setLink: db.prepare(
    `INSERT INTO lookup_link (source_system, source_ref, subject_id) VALUES (?,?,?)
     ON CONFLICT(source_system, source_ref) DO UPDATE SET subject_id = excluded.subject_id, linked_at = datetime('now')`),
  setBasis: db.prepare(
    `INSERT INTO lookup_link_basis (source_system, source_ref, basis) VALUES (?,?,?)
     ON CONFLICT(source_system, source_ref) DO UPDATE SET basis = excluded.basis, matched_at = datetime('now')`),
  aadhaarsOf: db.prepare("SELECT DISTINCT value_hash FROM lookup_identifier WHERE subject_id = ? AND id_type = 'aadhaar'"),
  linksOf: db.prepare('SELECT source_system, source_ref FROM lookup_link WHERE subject_id = ?'),
  moveLinks: db.prepare('UPDATE lookup_link SET subject_id = ? WHERE subject_id = ?'),
  moveIds: db.prepare('UPDATE OR IGNORE lookup_identifier SET subject_id = ? WHERE subject_id = ?'),
  moveIdsFrom: db.prepare('UPDATE OR IGNORE lookup_identifier SET subject_id = ? WHERE subject_id = ? AND source_system = ? AND id_type != \'mobile\''),
  copyMobilesFrom: db.prepare(
    `INSERT OR IGNORE INTO lookup_identifier (subject_id, id_type, value_hash, masked, source_system)
     SELECT ?, id_type, value_hash, masked, source_system FROM lookup_identifier WHERE subject_id = ? AND source_system = ? AND id_type = 'mobile'`),
  dropIds: db.prepare('DELETE FROM lookup_identifier WHERE subject_id = ?'),
  moveIdsFromKeepAadhaar: db.prepare("UPDATE OR IGNORE lookup_identifier SET subject_id = ? WHERE subject_id = ? AND source_system = ? AND id_type NOT IN ('mobile', 'aadhaar')"),
  dropIdsFromKeepAadhaar: db.prepare("DELETE FROM lookup_identifier WHERE subject_id = ? AND source_system = ? AND id_type NOT IN ('mobile', 'aadhaar')"),
  countRecords: db.prepare('SELECT COUNT(*) AS n FROM lookup_record WHERE subject_id = ?'),
  dropIdsFrom: db.prepare('DELETE FROM lookup_identifier WHERE subject_id = ? AND source_system = ? AND id_type != \'mobile\''),
  moveRecords: db.prepare('UPDATE OR IGNORE lookup_record SET subject_id = ? WHERE subject_id = ?'),
  moveRecordsFrom: db.prepare('UPDATE OR IGNORE lookup_record SET subject_id = ? WHERE subject_id = ? AND source_system = ?'),
  dropRecords: db.prepare('DELETE FROM lookup_record WHERE subject_id = ?'),
  dropRecordsFrom: db.prepare('DELETE FROM lookup_record WHERE subject_id = ? AND source_system = ?'),
  dropSubject: db.prepare('DELETE FROM lookup_subject WHERE id = ?'),
  addMerge: db.prepare('INSERT OR REPLACE INTO lookup_merge (from_ref, into_subject_id, reason) VALUES (?,?,?)'),
  redirectMerges: db.prepare('UPDATE lookup_merge SET into_subject_id = ? WHERE into_subject_id = ?'),
  conflicted: db.prepare(
    "SELECT subject_id FROM lookup_identifier WHERE id_type = 'aadhaar' GROUP BY subject_id HAVING COUNT(DISTINCT value_hash) > 1"),
  aadhaarRows: db.prepare("SELECT value_hash, masked, source_system FROM lookup_identifier WHERE subject_id = ? AND id_type = 'aadhaar' ORDER BY id"),

  audit: db.prepare('INSERT INTO audit_log (entity, entity_id, action, maker, approver, details) VALUES (?,?,?,?,?,?)'),
};

/** True when the signature matches the body and the timestamp is fresh. */
function verify(req) {
  const ts = Number(req.get('X-Integration-Timestamp'));
  const sig = String(req.get('X-Integration-Signature') || '').replace(/^sha256=/, '');
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > SKEW_MS) return 'The request is too old or its timestamp is missing.';
  if (!req.rawBody || !/^[0-9a-f]{64}$/.test(sig)) return 'The request is not signed.';
  const want = crypto.createHmac('sha256', SECRET).update(`${ts}.`).update(req.rawBody).digest();
  return crypto.timingSafeEqual(want, Buffer.from(sig, 'hex')) ? null : 'The signature does not match.';
}

/** A valid Aadhaar number (12 digits, first 2-9, Verhoeff check digit), or null. */
function validAadhaar(v) {
  const n = String(v == null ? '' : v).replace(/[\s-]/g, '');
  return /^[2-9]\d{11}$/.test(n) && ids.verhoeffValid(n) ? n : null;
}

const aadhaarsOf = (sid) => q.aadhaarsOf.all(sid).map((r) => r.value_hash);
const subjectRef = (sid) => (q.subject.get(sid) || {}).subject_ref || `#${sid}`;

function newSubject(person) {
  const ref = `PSN-${String((q.maxRef.get().n || 0) + 1).padStart(6, '0')}`;
  return Number(q.insertSubject.run(ref, person.name, ids.nameKey(person.name), person.gender || null,
    person.dob ? Number(String(person.dob).slice(0, 4)) : null, person.district || null).lastInsertRowid);
}

function link(source, ref, sid, basis) {
  q.setLink.run(source, ref, sid);
  q.setBasis.run(source, ref, basis);
}

/** Fold ERP person `from` into `into`: links, identifiers, records; the old reference keeps opening `into`. */
function mergeSubjects(from, into, reason) {
  if (from === into) return;
  const fromRef = subjectRef(from);
  q.moveLinks.run(into, from);
  q.moveIds.run(into, from);
  q.dropIds.run(from);            // what is left is already held by `into`
  q.moveRecords.run(into, from);
  q.dropRecords.run(from);        // the same record is already filed under `into`
  q.redirectMerges.run(into, from);
  q.addMerge.run(fromRef, into, reason);
  q.dropSubject.run(from);
  q.audit.run('lookup', fromRef, 'MERGE', 'erp:identity', null, `${fromRef} merged into ${subjectRef(into)}: ${reason}`);
}

/**
 * Move one department's share of ERP person `from` to `into`: its records, its enrolment and case numbers (mobile
 * numbers are copied, a mobile can be shared), its Aadhaar only when `withAadhaar` (the repair), and the links given.
 * The rest of `from` stays; a `from` left with no link and no record is removed and redirected to `into`.
 */
function moveShare(from, into, source, refs, reason, withAadhaar = false) {
  if (from === into) return;
  for (const ref of refs) q.setLink.run(source, ref, into);
  const others = q.linksOf.all(from).filter((l) => l.source_system === source).length;
  if (!others) {           // nothing else from this department is left on `from`: its records and numbers go too
    q.moveRecordsFrom.run(into, from, source);
    q.dropRecordsFrom.run(from, source);
    if (withAadhaar) { q.moveIdsFrom.run(into, from, source); q.dropIdsFrom.run(from, source); } else {
      q.moveIdsFromKeepAadhaar.run(into, from, source); q.dropIdsFromKeepAadhaar.run(from, source);
    }
    q.copyMobilesFrom.run(into, from, source);
  }
  const fromRef = subjectRef(from);
  q.audit.run('lookup', fromRef, 'SPLIT', 'erp:identity', null,
    `${source} ${refs.join(', ')} moved from ${fromRef} to ${subjectRef(into)}: ${reason}`);
  if (!q.linksOf.all(from).length && !q.countRecords.get(from).n) {
    // nothing is left on it: an outdated entry, not a person
    q.dropIds.run(from);
    q.redirectMerges.run(into, from);
    q.addMerge.run(fromRef, into, `emptied: ${reason}`);
    q.dropSubject.run(from);
  }
}

/** The ERP person this department's person is, found or created. Aadhaar first; see the header. */
function resolve(source, person) {
  const linked = q.link.get(source, person.ref);
  const linkedId = linked ? linked.subject_id : null;
  const key = ids.nameKey(person.name);
  const values = Object.fromEntries((person.identifiers || []).map((i) => [i.type, i.value]));
  const aadhaar = validAadhaar(values.aadhaar);
  if (values.aadhaar && !aadhaar) {
    q.audit.run('lookup', `${source}:${person.ref}`, 'REJECT_ID', `bus:${source}`, null,
      `${source} ${person.ref}: an Aadhaar number that is not valid was ignored for matching`);
  }

  // a) Aadhaar decides
  if (aadhaar) {
    const h = ids.hash('aadhaar', aadhaar);
    const holder = q.byId.all('aadhaar', h)[0];
    if (holder) {
      if (linkedId && linkedId !== holder.id) {
        const own = aadhaarsOf(linkedId);
        const solo = q.linksOf.all(linkedId).length <= 1;
        if (!own.length && solo) mergeSubjects(linkedId, holder.id, `${source} ${person.ref} carries the Aadhaar ${ids.mask('aadhaar', aadhaar)} held by ${subjectRef(holder.id)}`);
        else moveShare(linkedId, holder.id, source, [person.ref], own.length ? 'its Aadhaar differs from the person it was filed under' : 'its Aadhaar belongs to another person');
      }
      link(source, person.ref, holder.id, 'aadhaar');
      return { id: holder.id, created: false, basis: 'aadhaar' };
    }
    if (linkedId) {
      if (!aadhaarsOf(linkedId).length) { link(source, person.ref, linkedId, 'aadhaar'); return { id: linkedId, created: false, basis: 'aadhaar' }; }
      // filed under a person with another Aadhaar: this is someone else
      const fresh = newSubject(person);
      moveShare(linkedId, fresh, source, [person.ref], 'its Aadhaar differs from the person it was filed under');
      link(source, person.ref, fresh, 'aadhaar');
      return { id: fresh, created: true, basis: 'aadhaar' };
    }
    if (values.eid) {
      const hit = q.byId.all('eid', ids.hash('eid', values.eid)).find((x) => !aadhaarsOf(x.id).length);
      if (hit) { link(source, person.ref, hit.id, 'aadhaar'); return { id: hit.id, created: false, basis: 'aadhaar' }; }
    }
    const fresh = newSubject(person);
    link(source, person.ref, fresh, 'aadhaar');
    return { id: fresh, created: true, basis: 'aadhaar' };
  }

  // b) no Aadhaar
  if (linkedId) return { id: linkedId, created: false, basis: null };
  let found = null; let basis = 'new';
  if (values.eid) {
    const hit = q.byId.all('eid', ids.hash('eid', values.eid))[0];
    if (hit) { found = hit.id; basis = 'eid'; }
  }
  if (!found && values.mobile && MATCH_NO_AADHAAR === 'mobile_name' && source !== 'uidai') {
    const hit = q.byId.all('mobile', ids.hash('mobile', values.mobile)).find((x) => x.name_key === key && !aadhaarsOf(x.id).length);
    if (hit) { found = hit.id; basis = 'mobile_name'; }
  }
  let created = false;
  if (!found) { found = newSubject(person); created = true; }
  link(source, person.ref, found, basis);
  return { id: found, created, basis };
}

/**
 * Repair: an ERP person holding two or more different Aadhaar numbers (filed by the earlier mobile-and-name rule)
 * is split by department: the share of each department whose Aadhaar differs from the one kept (UIDAI's, else the
 * first seen) moves to the person holding that Aadhaar, or to a new person. A department with two Aadhaar numbers on
 * the same person cannot be split safely and is only reported. Idempotent; runs at start-up.
 */
const repair = db.transaction(() => {
  const out = { split: 0, review: [] };
  for (const { subject_id: sid } of q.conflicted.all()) {
    const rows = q.aadhaarRows.all(sid);
    const bySource = new Map();
    for (const r of rows) {
      if (!bySource.has(r.source_system)) bySource.set(r.source_system, new Set());
      bySource.get(r.source_system).add(r.value_hash);
    }
    if ([...bySource.values()].some((set) => set.size > 1)) {
      out.review.push(subjectRef(sid));
      q.audit.run('lookup', subjectRef(sid), 'REVIEW', 'erp:identity', null,
        `${subjectRef(sid)} holds several Aadhaar numbers from one department: left for manual review`);
      continue;
    }
    const keep = bySource.has('uidai') ? [...bySource.get('uidai')][0] : rows[0].value_hash;
    const s = q.subject.get(sid);
    for (const [source, set] of bySource) {
      const h = [...set][0];
      if (h === keep) continue;
      const masked = rows.find((r) => r.value_hash === h).masked;
      const holder = q.byId.all('aadhaar', h).find((x) => x.id !== sid);
      const into = holder ? holder.id : Number(q.insertSubject.run(
        `PSN-${String((q.maxRef.get().n || 0) + 1).padStart(6, '0')}`, s.full_name, s.name_key, s.gender, s.birth_year, s.district).lastInsertRowid);
      const refs = q.linksOf.all(sid).filter((l) => l.source_system === source).map((l) => l.source_ref);
      for (const ref of refs) q.setBasis.run(source, ref, 'repair');
      moveShare(sid, into, source, refs, `two different Aadhaar numbers were on one person; ${source} carries ${masked}`, true);
      out.split += 1;
    }
  }
  return out;
});

/** UIDAI is the authority on a person's name, gender and date of birth; others fill gaps only. */
function refresh(subjectId, source, person) {
  const s = q.subject.get(subjectId);
  const year = person.dob ? Number(String(person.dob).slice(0, 4)) : null;
  if (source === 'uidai') {
    q.updateSubject.run(person.name, ids.nameKey(person.name), person.gender || s.gender, year || s.birth_year, person.district || s.district, subjectId);
  } else {
    q.updateSubject.run(s.full_name, s.name_key, s.gender || person.gender || null, s.birth_year || year, s.district || person.district || null, subjectId);
  }
}

function check(e, source) {
  if (!e || typeof e !== 'object') return 'The event is not an object.';
  if (typeof e.id !== 'string' || !/^[0-9a-f-]{36}$/.test(e.id)) return 'The event has no valid id.';
  if (e.type !== 'record.upserted') return `Unknown event type: ${e.type}`;
  if (e.source !== source) return 'The event names a different source from the request.';
  const r = e.record || {};
  if (!r.type || !r.ref || typeof r.type !== 'string' || typeof r.ref !== 'string') return 'The record has no type or reference.';
  if (!Array.isArray(e.parties) || !e.parties.length) return 'The record names no person.';
  for (const p of e.parties) {
    if (!p.person || !p.person.ref || !p.person.name) return 'A person has no reference or name.';
    if (!p.data || typeof p.data !== 'object') return 'A person’s copy of the record has no data.';
  }
  return null;
}

/** Apply one event. Returns { status, subjects[] }. */
const apply = db.transaction((e, source) => {
  if (q.seen.get(e.id)) return { status: 'duplicate', subjects: [] };
  const r = e.record;
  const change = q.existed.get(source, r.type, r.ref) ? 'updated' : 'new';
  const subjects = [];
  for (const p of e.parties) {
    const who = resolve(source, p.person);
    refresh(who.id, source, p.person);
    for (const i of (p.person.identifiers || []).filter((x) => PERSON_IDS.includes(x.type) && (x.type !== 'aadhaar' || validAadhaar(x.value)))) {
      q.addId.run(who.id, i.type, ids.hash(i.type, i.value), ids.mask(i.type, i.value), source);
    }
    for (const i of (p.identifiers || []).filter((x) => CASE_IDS.includes(x.type))) {
      q.addId.run(who.id, i.type, ids.hash(i.type, i.value), ids.mask(i.type, i.value), source);
    }
    q.upsertRecord.run({
      subject_id: who.id, source, type: r.type, ref: r.ref, status: r.status || null, role: p.role || null,
      date: r.date || null, payload: JSON.stringify(p.data), history: JSON.stringify(r.history || []),
    });
    subjects.push({ id: who.id, ref: q.subject.get(who.id).subject_ref, name: p.person.name, created: who.created });
  }
  q.markSeen.run(e.id, source, r.type, r.ref, e.parties.length, e.occurredAt || null);
  return { status: 'accepted', subjects, change };
});

/** Handle one delivery from the bus. */
function receive(req, res) {
  const problem = verify(req);
  if (problem) return res.status(401).json({ error: problem });
  const body = req.body || {};
  const source = String(body.source || '');
  if (!SOURCES.includes(source)) return res.status(400).json({ error: `Unknown source system: ${source}` });
  if (!Array.isArray(body.events) || body.events.length > 200) return res.status(400).json({ error: 'events must be a list of at most 200.' });
  const results = [];
  let accepted = 0;
  for (const e of body.events) {
    const bad = check(e, source);
    if (bad) { results.push({ id: e && e.id, status: 'rejected', error: bad }); continue; }
    try {
      const out = apply(e, source);
      results.push({ id: e.id, status: out.status });
      if (out.status === 'accepted') {
        accepted += 1;
        live.publish({
          source, type: e.record.type, ref: e.record.ref, status: e.record.status || null, change: out.change,
          occurredAt: e.occurredAt || null, receivedAt: new Date().toISOString(),
          subjects: out.subjects.map((s) => ({ ref: s.ref, name: s.name, created: s.created })),
        });
      }
    } catch (err) {
      process.stderr.write(`[erp] ingest ${source} ${e.id}: ${err.stack || err}\n`);
      results.push({ id: e.id, status: 'rejected', error: 'The ERP could not file this record.' });
    }
  }
  if (accepted) {
    try {
      q.audit.run('ingest', source, 'RECEIVE', `bus:${source}`, null, `${accepted} record change${accepted === 1 ? '' : 's'} received from ${source}`);
    } catch (err) { process.stderr.write(`[erp] ingest audit failed: ${err.message}\n`); }
  }
  res.json({ results });
}

/** What each department has delivered, for the sources list. */
function deliveries() {
  return Object.fromEntries(db.prepare(
    'SELECT source_system AS s, COUNT(*) AS n, MAX(received_at) AS last FROM ingest_event GROUP BY source_system').all()
    .map((r) => [r.s, { events: r.n, lastReceivedAt: r.last }]));
}

/** The latest arrivals, for the live feed on the lookup page. */
function recent(limit = 12) {
  return db.prepare(
    `SELECT e.source_system AS source, e.record_type AS type, e.record_ref AS ref, e.received_at AS receivedAt,
            (SELECT COUNT(*) FROM ingest_event p WHERE p.source_system = e.source_system AND p.record_type = e.record_type
               AND p.record_ref = e.record_ref AND p.received_at < e.received_at) AS earlier,
            (SELECT group_concat(s.subject_ref || '|' || s.full_name, ';')
               FROM lookup_record r JOIN lookup_subject s ON s.id = r.subject_id
              WHERE r.source_system = e.source_system AND r.record_type = e.record_type AND r.record_ref = e.record_ref) AS who
     FROM ingest_event e ORDER BY e.received_at DESC LIMIT ?`).all(limit).map((r) => ({
    source: r.source, type: r.type, ref: r.ref, receivedAt: r.receivedAt, change: r.earlier ? 'updated' : 'new',
    subjects: String(r.who || '').split(';').filter(Boolean).map((x) => { const [ref, name] = x.split('|'); return { ref, name }; }),
  }));
}

module.exports = { receive, deliveries, recent, repair, validAadhaar, SOURCES };
