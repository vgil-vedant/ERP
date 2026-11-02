'use strict';

/**
 * The ERP's store. Opens the ERP database and nothing else.
 *
 * There is deliberately no path from here to database/sqlite/platform/data/platform.sqlite.
 * The portals hand data over through the ERP's HTTP API or not at all.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { ERP_DB: DB_PATH, ERP_SCHEMA } = require('../config/paths');

function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  // The schema applies itself. Every statement in it is IF NOT EXISTS, so this
  // is safe on every open, and it means the prepared statements below cannot
  // run against a database that has no tables yet.
  db.exec(fs.readFileSync(ERP_SCHEMA, 'utf8'));
  return db;
}

const db = open();

const q = {
  citizenByRef: db.prepare('SELECT * FROM citizen WHERE citizen_ref = ?'),
  insertCitizen: db.prepare(
    `INSERT INTO citizen (citizen_ref, full_name, email, mobile, first_seen_in, registered_on)
     VALUES (@citizen_ref, @full_name, @email, @mobile, @first_seen_in, @registered_on)`),
  updateCitizen: db.prepare(
    'UPDATE citizen SET full_name = ?, mobile = ? WHERE citizen_ref = ?'),
  intakeBySource: db.prepare(
    'SELECT * FROM intake WHERE source_system = ? AND source_reference = ?'),
  insertIntake: db.prepare(
    `INSERT INTO intake (intake_ref, source_system, source_form, source_route,
                         source_reference, citizen_id, subject, payload)
     VALUES (@intake_ref, @source_system, @source_form, @source_route,
             @source_reference, @citizen_id, @subject, @payload)`),
  insertField: db.prepare(
    'INSERT INTO intake_field (intake_id, name, label, value) VALUES (?,?,?,?)'),
  countIntake: db.prepare('SELECT COUNT(*) AS n FROM intake'),
  insertAudit: db.prepare(
    `INSERT INTO audit_log (entity, entity_id, action, maker, approver, details)
     VALUES (?,?,?,?,?,?)`),
  systems: db.prepare('SELECT * FROM source_system ORDER BY code'),
  fieldsFor: db.prepare(
    'SELECT name, label, value FROM intake_field WHERE intake_id = ? ORDER BY id'),
};

function audit(entity, entityId, action, maker, approver, details) {
  q.insertAudit.run(entity, String(entityId), action, maker, approver || null, details || null);
}

/** Create the citizen on first sight, refresh their details after that. */
function upsertCitizen(p, sourceSystem) {
  const existing = q.citizenByRef.get(p.personRef);
  if (existing) {
    if (existing.full_name !== p.fullName || existing.mobile !== (p.mobile || null)) {
      q.updateCitizen.run(p.fullName, p.mobile || null, p.personRef);
      audit('citizen', existing.id, 'UPDATE', sourceSystem, null,
        'details refreshed from a portal registration');
    }
    return { id: existing.id, ref: existing.citizen_ref, created: false };
  }
  const info = q.insertCitizen.run({
    citizen_ref: p.personRef,
    full_name: p.fullName,
    email: p.email,
    mobile: p.mobile || null,
    first_seen_in: sourceSystem,
    registered_on: p.registeredOn || new Date().toISOString().slice(0, 10),
  });
  audit('citizen', info.lastInsertRowid, 'CREATE', sourceSystem, null,
    `registered once on ${sourceSystem}, usable on every portal`);
  return { id: Number(info.lastInsertRowid), ref: p.personRef, created: true };
}

/**
 * Record one submission handed over by a portal.
 *
 * Idempotent on (source_system, source_reference): a retried write-through
 * returns the intake reference already issued instead of duplicating the row.
 */
const receive = db.transaction((body) => {
  const system = body.sourceSystem;
  let citizen = null;
  if (body.person && body.person.personRef) {
    citizen = upsertCitizen(body.person, system);
  }

  const already = q.intakeBySource.get(system, body.sourceReference);
  if (already) {
    return { intakeRef: already.intake_ref, citizenRef: citizen && citizen.ref, duplicate: true };
  }

  const n = q.countIntake.get().n + 1;
  const intakeRef = `ERP-${String(n).padStart(7, '0')}`;
  const info = q.insertIntake.run({
    intake_ref: intakeRef,
    source_system: system,
    source_form: body.sourceForm,
    source_route: body.sourceRoute || null,
    source_reference: body.sourceReference,
    citizen_id: citizen ? citizen.id : null,
    subject: body.subject || null,
    payload: JSON.stringify(body.payload || {}),
  });
  for (const f of body.fields || []) {
    q.insertField.run(info.lastInsertRowid, f.name, f.label || null,
      f.value == null ? null : String(f.value));
  }
  audit('intake', info.lastInsertRowid, 'CREATE', system, null,
    `${body.sourceForm} received from ${system} as ${body.sourceReference}`);
  return { intakeRef, citizenRef: citizen && citizen.ref, duplicate: false };
});

function summary() {
  return {
    citizens: db.prepare('SELECT COUNT(*) AS n FROM citizen').get().n,
    intake: db.prepare('SELECT COUNT(*) AS n FROM intake').get().n,
    fields: db.prepare('SELECT COUNT(*) AS n FROM intake_field').get().n,
    bySystem: db.prepare(
      `SELECT s.code, s.name, COUNT(i.id) AS n
       FROM source_system s LEFT JOIN intake i ON i.source_system = s.code
       GROUP BY s.code ORDER BY s.code`).all(),
  };
}

function recentIntake(limit = 50, system = null) {
  const rows = system
    ? db.prepare(
      `SELECT i.*, c.full_name, c.email FROM intake i LEFT JOIN citizen c ON c.id = i.citizen_id
       WHERE i.source_system = ? ORDER BY i.id DESC LIMIT ?`).all(system, limit)
    : db.prepare(
      `SELECT i.*, c.full_name, c.email FROM intake i LEFT JOIN citizen c ON c.id = i.citizen_id
       ORDER BY i.id DESC LIMIT ?`).all(limit);
  return rows.map((r) => ({ ...r, fields: q.fieldsFor.all(r.id) }));
}

function citizens(limit = 100) {
  return db.prepare(
    `SELECT c.*, COUNT(i.id) AS intake_count,
            (SELECT GROUP_CONCAT(DISTINCT source_system) FROM intake WHERE citizen_id = c.id) AS systems
     FROM citizen c LEFT JOIN intake i ON i.citizen_id = c.id
     GROUP BY c.id ORDER BY c.id DESC LIMIT ?`).all(limit);
}

function auditTail(limit = 100) {
  return db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
}

/**
 * Daily intake counts for the last `days` days, for the line chart.
 * Returns [{date:'2026-10-29', n:14}, ...] oldest-first.
 */
function dailyIntake(days = 30) {
  return db.prepare(
    `SELECT date(received_at) AS date, COUNT(*) AS n
     FROM intake
     WHERE received_at >= date('now', ? || ' days')
     GROUP BY date(received_at)
     ORDER BY date(received_at) ASC`).all(`-${days}`);
}

module.exports = {
  db, DB_PATH, open, receive, summary, recentIntake, citizens, auditTail, dailyIntake,
  systems: () => q.systems.all(),
};
