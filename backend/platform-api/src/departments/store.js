'use strict';

/**
 * Each department's own database.
 *
 * Every portal (UIDAI, CCTNS, e-Forensics, eCourts, ePrisons) keeps its
 * department records in a SQLite file of its own:
 *
 *   <platform data dir>/departments/<code>.sqlite     (DEPARTMENT_DB_DIR overrides)
 *
 * No department opens another's file, and none opens the ERP's. What a
 * department records reaches the ERP only through the outbox in its own file,
 * which the integration bus (./bus.js) delivers over HTTP.
 *
 * Tables
 *   officer, officer_session   who may sign in to this department's office
 *   person                     the people this department holds records about
 *   record, record_party       the records, and who each one is about (and in what role)
 *   outbox                     record changes waiting for, or already given to, the ERP
 *   activity                   append-only log of what officers did
 *   counter, meta              reference-number sequences; seed version
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const { PLATFORM_DB } = require('../config/paths');

const DIR = process.env.DEPARTMENT_DB_DIR || path.join(path.dirname(PLATFORM_DB), 'departments');

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS counter (name TEXT PRIMARY KEY, value INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS officer (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  designation   TEXT NOT NULL,
  office        TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS officer_session (
  token_hash  TEXT PRIMARY KEY,
  officer_id  INTEGER NOT NULL REFERENCES officer(id) ON DELETE CASCADE,
  expires_ms  INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS person (
  id          INTEGER PRIMARY KEY,
  person_ref  TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  name_key    TEXT NOT NULL,
  gender      TEXT,
  dob         TEXT,
  district    TEXT,
  identifiers TEXT NOT NULL DEFAULT '{}',
  profile     TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_person_name ON person(name_key);

CREATE TABLE IF NOT EXISTS record (
  id          INTEGER PRIMARY KEY,
  record_ref  TEXT NOT NULL UNIQUE,
  record_type TEXT NOT NULL,
  status      TEXT,
  record_date TEXT,
  data        TEXT NOT NULL,
  history     TEXT NOT NULL DEFAULT '[]',
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  version     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_record_type ON record(record_type, status);

CREATE TABLE IF NOT EXISTS record_party (
  record_id INTEGER NOT NULL REFERENCES record(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES person(id),
  role      TEXT NOT NULL,
  relation  TEXT,
  label     TEXT,
  PRIMARY KEY (record_id, person_id)
);

CREATE TABLE IF NOT EXISTS outbox (
  id              INTEGER PRIMARY KEY,
  event_id        TEXT NOT NULL UNIQUE,
  record_id       INTEGER REFERENCES record(id),
  record_ref      TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  attempts        INTEGER NOT NULL DEFAULT 0,
  created_ms      INTEGER NOT NULL,
  next_attempt_ms INTEGER NOT NULL,
  delivered_ms    INTEGER,
  last_error      TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_due ON outbox(status, next_attempt_ms);

CREATE TABLE IF NOT EXISTS activity (
  id         INTEGER PRIMARY KEY,
  at         TEXT NOT NULL DEFAULT (datetime('now')),
  officer    TEXT NOT NULL,
  action     TEXT NOT NULL,
  record_ref TEXT,
  details    TEXT
);
CREATE TRIGGER IF NOT EXISTS activity_no_update BEFORE UPDATE ON activity
BEGIN SELECT RAISE(ABORT, 'activity is append-only'); END;
CREATE TRIGGER IF NOT EXISTS activity_no_delete BEFORE DELETE ON activity
BEGIN SELECT RAISE(ABORT, 'activity is append-only'); END;
`;

const nameKey = (s) => String(s || '').normalize('NFC').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim();
const parse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

const opened = new Map();

/** The store of one department; opened once per process. */
function open(code) {
  if (opened.has(code)) return opened.get(code);
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${code}.sqlite`);
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 3000');
  db.exec(SCHEMA);

  const q = {
    meta: db.prepare('SELECT value FROM meta WHERE key = ?'),
    setMeta: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    counterGet: db.prepare('SELECT value FROM counter WHERE name = ?'),
    counterSet: db.prepare('INSERT INTO counter (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value'),
    personById: db.prepare('SELECT * FROM person WHERE id = ?'),
    personByRef: db.prepare('SELECT * FROM person WHERE person_ref = ?'),
    insertPerson: db.prepare(
      `INSERT INTO person (person_ref, full_name, name_key, gender, dob, district, identifiers, profile)
       VALUES (@person_ref, @full_name, @name_key, @gender, @dob, @district, @identifiers, @profile)`),
    updatePerson: db.prepare(
      `UPDATE person SET full_name = @full_name, name_key = @name_key, gender = @gender, dob = @dob,
         district = @district, identifiers = @identifiers, profile = @profile, updated_at = datetime('now') WHERE id = @id`),
    recordByRef: db.prepare('SELECT * FROM record WHERE record_ref = ?'),
    recordById: db.prepare('SELECT * FROM record WHERE id = ?'),
    insertRecord: db.prepare(
      `INSERT INTO record (record_ref, record_type, status, record_date, data, history, created_by)
       VALUES (@record_ref, @record_type, @status, @record_date, @data, @history, @created_by)`),
    updateRecord: db.prepare(
      `UPDATE record SET status = @status, record_date = @record_date, data = @data, history = @history,
         updated_at = datetime('now'), version = version + 1 WHERE id = @id`),
    partiesOf: db.prepare(
      `SELECT rp.role, rp.relation, rp.label, p.* FROM record_party rp JOIN person p ON p.id = rp.person_id
       WHERE rp.record_id = ? ORDER BY rp.rowid`),
    insertParty: db.prepare(
      `INSERT INTO record_party (record_id, person_id, role, relation, label) VALUES (?,?,?,?,?)
       ON CONFLICT(record_id, person_id) DO UPDATE SET role = excluded.role, relation = excluded.relation, label = excluded.label`),
    recordsOfPerson: db.prepare(
      `SELECT r.*, rp.role AS party_role FROM record_party rp JOIN record r ON r.id = rp.record_id
       WHERE rp.person_id = ? ORDER BY COALESCE(r.record_date, '') DESC`),
    activity: db.prepare('INSERT INTO activity (officer, action, record_ref, details) VALUES (?,?,?,?)'),
    enqueue: db.prepare(
      `INSERT INTO outbox (event_id, record_id, record_ref, event_type, payload, created_ms, next_attempt_ms)
       VALUES (?,?,?,?,?,?,?)`),
  };

  /** The next number in a named sequence, starting after `floor`. */
  function next(name, floor = 0) {
    const cur = q.counterGet.get(name);
    const value = Math.max(cur ? cur.value : 0, floor) + 1;
    q.counterSet.run(name, value);
    return value;
  }

  const store = {
    code, db, file, q, next, nameKey, parse,
    meta: (k) => (q.meta.get(k) || {}).value || null,
    setMeta: (k, v) => q.setMeta.run(k, String(v)),
    log: (officer, action, ref, details) => q.activity.run(officer, action, ref || null, details || null),
    person: (id) => hydratePerson(q.personById.get(id)),
    personByRef: (ref) => hydratePerson(q.personByRef.get(ref)),
    record: (id) => hydrateRecord(q.recordById.get(id)),
    recordByRef: (ref) => hydrateRecord(q.recordByRef.get(ref)),
    partiesOf: (recordId) => q.partiesOf.all(recordId).map((p) => ({ ...hydratePerson(p), role: p.role, relation: p.relation, label: p.label })),
    recordsOfPerson: (personId) => q.recordsOfPerson.all(personId).map((r) => ({ ...hydrateRecord(r), partyRole: r.party_role })),

    /** Create a person, or update the one with this reference. */
    savePerson(p) {
      const row = {
        person_ref: p.ref, full_name: p.name, name_key: nameKey(p.name), gender: p.gender || null, dob: p.dob || null,
        district: p.district || null, identifiers: JSON.stringify(p.identifiers || {}), profile: JSON.stringify(p.profile || {}),
      };
      const existing = q.personByRef.get(p.ref);
      if (existing) { q.updatePerson.run({ ...row, id: existing.id }); return existing.id; }
      return Number(q.insertPerson.run(row).lastInsertRowid);
    },

    /** Insert or replace a record and its parties. Returns its id. */
    saveRecord(r, by) {
      const existing = q.recordByRef.get(r.ref);
      const row = {
        record_ref: r.ref, record_type: r.type, status: r.status || null, record_date: r.date || null,
        data: JSON.stringify(r.data), history: JSON.stringify(r.history || []), created_by: by,
      };
      let id;
      if (existing) { id = existing.id; q.updateRecord.run({ ...row, id }); } else id = Number(q.insertRecord.run(row).lastInsertRowid);
      for (const party of r.parties || []) q.insertParty.run(id, party.personId, party.role, party.relation || null, party.label || null);
      return id;
    },

    /** Put an event in the outbox, in the caller's transaction. */
    enqueue(recordId, ref, type, payload) {
      const now = Date.now();
      const id = crypto.randomUUID();
      q.enqueue.run(id, recordId, ref, type, JSON.stringify({ ...payload, id }), now, now);
      return id;
    },
  };

  function hydratePerson(p) {
    if (!p) return null;
    return {
      id: p.id, ref: p.person_ref, name: p.full_name, gender: p.gender, dob: p.dob, district: p.district,
      identifiers: parse(p.identifiers, {}), profile: parse(p.profile, {}), createdAt: p.created_at, updatedAt: p.updated_at,
    };
  }
  function hydrateRecord(r) {
    if (!r) return null;
    return {
      id: r.id, ref: r.record_ref, type: r.record_type, status: r.status, date: r.record_date,
      data: parse(r.data, {}), history: parse(r.history, []), createdBy: r.created_by,
      createdAt: r.created_at, updatedAt: r.updated_at, version: r.version,
    };
  }

  opened.set(code, store);
  return store;
}

module.exports = { open, DIR, nameKey };
