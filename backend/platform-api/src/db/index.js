'use strict';

/**
 * The one shared store behind every portal.
 *
 * Rows that belong to a single portal carry site_code. person and session do
 * not: one registration is accepted everywhere precisely because every portal
 * reads this same table.
 *
 * THIS IS NOT ANY ORIGINAL'S SCHEMA. No government database was accessed. The
 * field sets come from public form markup captured under each project's
 * analysis/ directory, and every row is synthetic.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const { PLATFORM_DB: DB_PATH, PLATFORM_SCHEMA } = require('../config/paths');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
// Idempotent, so it is safe on every open and the prepared statements below
// can never meet an empty database.
db.exec(fs.readFileSync(PLATFORM_SCHEMA, 'utf8'));

const SENSITIVE = /pass|pwd|secret|otp|pin|captcha|token|cvv|challenge/i;

const q = {
  upsertSite: db.prepare(
    `INSERT INTO site (code, name, hostname, category, port) VALUES (?,?,?,?,?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, hostname = excluded.hostname,
       category = excluded.category, port = excluded.port`),
  sites: db.prepare('SELECT * FROM site ORDER BY port'),

  upsertForm: db.prepare(
    `INSERT INTO form (id, site_code, route, local_id, heading, reference_prefix, field_count, is_login)
     VALUES (@id,@site_code,@route,@local_id,@heading,@reference_prefix,@field_count,@is_login)
     ON CONFLICT(id) DO UPDATE SET heading = excluded.heading,
       reference_prefix = excluded.reference_prefix, field_count = excluded.field_count,
       is_login = excluded.is_login`),
  form: db.prepare('SELECT * FROM form WHERE id = ?'),
  formsForSite: db.prepare('SELECT * FROM form WHERE site_code = ? ORDER BY route'),

  personByEmail: db.prepare('SELECT * FROM person WHERE email = ?'),
  personById: db.prepare('SELECT * FROM person WHERE id = ?'),
  personByRef: db.prepare('SELECT * FROM person WHERE person_ref = ?'),
  insertPerson: db.prepare(
    `INSERT INTO person (person_ref, full_name, email, mobile, password_hash,
                         password_salt, registered_on, registered_via)
     VALUES (@person_ref,@full_name,@email,@mobile,@password_hash,
             @password_salt,@registered_on,@registered_via)`),
  setPersonErpRef: db.prepare('UPDATE person SET erp_citizen_ref = ? WHERE id = ?'),
  deletePerson: db.prepare('DELETE FROM person WHERE id = ?'),
  countPeople: db.prepare('SELECT COUNT(*) AS n FROM person'),
  people: db.prepare('SELECT * FROM person ORDER BY id DESC LIMIT ?'),

  insertSession: db.prepare(
    'INSERT INTO session (token, person_id, issued_by, expires_at) VALUES (?,?,?,?)'),
  sessionPerson: db.prepare(
    `SELECT p.* FROM session s JOIN person p ON p.id = s.person_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`),
  deleteSession: db.prepare('DELETE FROM session WHERE token = ?'),

  refList: db.prepare(
    'SELECT value, label FROM reference_option WHERE site_code = ? AND list = ? ORDER BY sort_order'),
  refListExists: db.prepare(
    'SELECT COUNT(*) AS n FROM reference_option WHERE site_code = ? AND list = ?'),
  cascade: db.prepare(
    `SELECT value, label FROM cascade_option
     WHERE site_code = ? AND list = ? AND parent_value = ? ORDER BY sort_order`),
  cascadeExists: db.prepare(
    'SELECT COUNT(*) AS n FROM cascade_option WHERE site_code = ? AND list = ?'),
  tableRows: db.prepare(
    'SELECT cells FROM demo_table_row WHERE site_code = ? AND table_id = ? ORDER BY sort_order LIMIT 25'),

  insertSubmission: db.prepare(
    `INSERT INTO submission (site_code, form_id, reference_no, person_id, payload)
     VALUES (?,?,?,?,?)`),
  setSubmissionErp: db.prepare(
    `UPDATE submission SET erp_intake_ref = ?, erp_synced_at = datetime('now') WHERE id = ?`),
  deleteSubmission: db.prepare('DELETE FROM submission WHERE id = ?'),
  insertSubField: db.prepare(
    'INSERT INTO submission_field (submission_id, name, label, value) VALUES (?,?,?,?)'),
  nextSubmissionId: db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM submission'),
  submissionsFor: db.prepare(
    `SELECT reference_no, payload, created_at, erp_intake_ref FROM submission
     WHERE form_id = ? ORDER BY id DESC LIMIT 50`),
  submissionsForPerson: db.prepare(
    `SELECT s.*, f.heading, f.route FROM submission s JOIN form f ON f.id = s.form_id
     WHERE s.person_id = ? ORDER BY s.id DESC LIMIT 100`),
  allSubmissions: db.prepare(
    `SELECT s.*, f.route, f.heading FROM submission s JOIN form f ON f.id = s.form_id
     ORDER BY s.id DESC LIMIT ?`),
  countSubmissions: db.prepare('SELECT COUNT(*) AS n FROM submission'),
  countSynced: db.prepare('SELECT COUNT(*) AS n FROM submission WHERE erp_intake_ref IS NOT NULL'),
  bySite: db.prepare(
    `SELECT st.code, st.name, COUNT(s.id) AS n,
            SUM(CASE WHEN s.erp_intake_ref IS NOT NULL THEN 1 ELSE 0 END) AS synced
     FROM site st LEFT JOIN submission s ON s.site_code = st.code
     GROUP BY st.code ORDER BY st.port`),

  insertSync: db.prepare(
    `INSERT INTO erp_sync (entity, local_ref, status, http_status, erp_ref, message)
     VALUES (?,?,?,?,?,?)`),
  syncTail: db.prepare('SELECT * FROM erp_sync ORDER BY id DESC LIMIT ?'),

  insertAudit: db.prepare(
    `INSERT INTO audit_log (site_code, entity, entity_id, action, maker, approver, details)
     VALUES (?,?,?,?,?,?,?)`),
  auditTail: db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?'),
};

function audit(siteCode, entity, entityId, action, maker, approver, details) {
  q.insertAudit.run(siteCode, entity, String(entityId), action, maker, approver || null, details || null);
}

function registerSites(sites) {
  db.transaction(() => {
    for (const s of sites) q.upsertSite.run(s.code, s.name, s.hostname, s.category, s.port);
  })();
}

/** Namespaced form key: eCourts reuses "index_form0" across pages. */
function formKey(siteCode, route, localId) {
  return `${siteCode}:${route}:${localId}`;
}

function registerForms(siteCode, forms) {
  db.transaction(() => {
    for (const f of forms) q.upsertForm.run(f);
  })();
  return q.formsForSite.all(siteCode);
}

// --- identity --------------------------------------------------------------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function personPublic(p) {
  if (!p) return null;
  return {
    id: p.id, personRef: p.person_ref, fullName: p.full_name, email: p.email,
    mobile: p.mobile, registeredOn: p.registered_on, registeredVia: p.registered_via,
    erpCitizenRef: p.erp_citizen_ref,
  };
}

function findPersonByEmail(email) {
  return q.personByEmail.get(String(email || '').trim().toLowerCase()) || null;
}

/**
 * Create the one registration.
 *
 * Returns the raw row. The caller is responsible for the ERP write-through and
 * for calling removePerson if the ERP refuses, so the invariant "in both
 * databases or neither" holds.
 */
function createPerson({ fullName, email, mobile, password }, siteCode) {
  const salt = crypto.randomBytes(16).toString('hex');
  const n = q.countPeople.get().n + 1;
  const personRef = `CIT-${String(n).padStart(6, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const info = q.insertPerson.run({
    person_ref: personRef,
    full_name: fullName,
    email: String(email).trim().toLowerCase(),
    mobile: mobile || null,
    password_hash: hashPassword(password, salt),
    password_salt: salt,
    registered_on: new Date().toISOString().slice(0, 10),
    registered_via: siteCode,
  });
  return q.personById.get(info.lastInsertRowid);
}

function removePerson(id) { q.deletePerson.run(id); }

function confirmPersonErp(id, citizenRef) { q.setPersonErpRef.run(citizenRef, id); }

function verifyPassword(person, password) {
  if (!person) return false;
  const given = Buffer.from(hashPassword(password, person.password_salt), 'hex');
  const held = Buffer.from(person.password_hash, 'hex');
  return given.length === held.length && crypto.timingSafeEqual(given, held);
}

function createSession(personId, siteCode, hours = 12) {
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + hours * 3600_000).toISOString().replace('T', ' ').slice(0, 19);
  q.insertSession.run(token, personId, siteCode, expires);
  return token;
}

function personForToken(token) {
  if (!token) return null;
  return q.sessionPerson.get(token) || null;
}

function endSession(token) { if (token) q.deleteSession.run(token); }

// --- reference data --------------------------------------------------------
function referenceList(siteCode, list) {
  if (!list || !q.refListExists.get(siteCode, list).n) return null;
  return q.refList.all(siteCode, list);
}

function cascadeOptions(siteCode, list, parentValue) {
  if (!list) return [];
  if (!q.cascadeExists.get(siteCode, list).n) return null;
  return q.cascade.all(siteCode, list, String(parentValue));
}

function tableRows(siteCode, tableId, columnCount) {
  return q.tableRows.all(siteCode, tableId).map((r) => {
    let cells = [];
    try { cells = JSON.parse(r.cells); } catch { cells = []; }
    while (cells.length < columnCount) cells.push('—');
    return cells.slice(0, columnCount);
  });
}

// --- submissions -----------------------------------------------------------
/** Drop anything that looks like a secret before it is ever persisted. */
function safePayload(value) {
  const safe = {};
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE.test(k)) continue;
    safe[k] = v;
  }
  return safe;
}

/**
 * Phase one of the write-through: reserve the row locally.
 *
 * Writing first and asking the ERP second is what makes the reference number
 * unique - it is derived from the row id the database just handed out. If the
 * ERP then refuses, phase two deletes this row again.
 */
const reserveSubmission = db.transaction(({ siteCode, formId, prefix, personId, value, fields }) => {
  const nextId = q.nextSubmissionId.get().n;
  const reference = `${prefix || 'DEMO'}-${String(nextId).padStart(6, '0')}`;
  const payload = safePayload(value);
  const info = q.insertSubmission.run(
    siteCode, formId, reference, personId || null, JSON.stringify(payload));
  const id = Number(info.lastInsertRowid);
  for (const f of fields) {
    if (SENSITIVE.test(f.name)) continue;
    q.insertSubField.run(id, f.name, f.label || null, f.value == null ? null : String(f.value));
  }
  return { id, reference, payload };
});

/** Phase two, on success. */
const confirmSubmission = db.transaction(({ id, reference, siteCode, formId, erpRef, status }) => {
  q.setSubmissionErp.run(erpRef, id);
  q.insertSync.run('submission', reference, 'synced', status, erpRef, null);
  audit(siteCode, 'submission', id, 'CREATE', 'portal:' + siteCode, null,
    `${formId} recorded as ${reference} and mirrored to the ERP as ${erpRef}`);
});

/**
 * Phase two, on failure: take the local row back out.
 *
 * The audit entry stays. audit_log rejects DELETE, so a refused write-through
 * leaves a permanent mark even though the data row is gone.
 */
const rejectSubmission = db.transaction(({ id, reference, siteCode, formId, status, message }) => {
  q.deleteSubmission.run(id);
  q.insertSync.run('submission', reference, 'failed', status, null, message);
  audit(siteCode, 'submission', id, 'ROLLBACK', 'portal:' + siteCode, null,
    `${formId} ${reference} was rolled back: the ERP did not accept it (${message})`);
});

function recordSyncAttempt(entity, localRef, status, httpStatus, erpRef, message) {
  q.insertSync.run(entity, localRef, status, httpStatus, erpRef, message);
}

function submissionsFor(formId) {
  return q.submissionsFor.all(formId).map((r) => {
    let payload = {};
    try { payload = JSON.parse(r.payload); } catch { /* leave empty */ }
    return { reference: r.reference_no, createdAt: r.created_at, erpRef: r.erp_intake_ref, payload };
  });
}

function submissionsForPerson(personId) {
  return q.submissionsForPerson.all(personId).map((r) => {
    let payload = {};
    try { payload = JSON.parse(r.payload); } catch { /* leave empty */ }
    return {
      reference: r.reference_no, site: r.site_code, route: r.route,
      heading: r.heading, createdAt: r.created_at, erpRef: r.erp_intake_ref, payload,
    };
  });
}

function summary() {
  return {
    sites: q.sites.all(),
    people: q.countPeople.get().n,
    submissions: q.countSubmissions.get().n,
    synced: q.countSynced.get().n,
    bySite: q.bySite.all(),
  };
}

module.exports = {
  db, DB_PATH, q, audit, formKey,
  registerSites, registerForms,
  createPerson, removePerson, confirmPersonErp, findPersonByEmail, verifyPassword,
  personPublic, personForToken, createSession, endSession,
  people: (n = 100) => q.people.all(n),
  referenceList, cascadeOptions, tableRows,
  reserveSubmission, confirmSubmission, rejectSubmission, recordSyncAttempt,
  submissionsFor, submissionsForPerson, summary,
  allSubmissions: (n = 100) => q.allSubmissions.all(n),
  syncTail: (n = 100) => q.syncTail.all(n),
  auditTail: (n = 100) => q.auditTail.all(n),
};
