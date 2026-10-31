'use strict';

/**
 * Generic store for a generated local demonstration replica.
 *
 * THIS IS NOT THE ORIGINAL SCHEMA. The original's database is not publicly
 * observable and was never accessed. The tables here are the replica's own
 * design, derived from the captured public field inventory. Every row is
 * synthetic. See analysis/database_findings.json.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'database', 'replica.sqlite');
if (!fs.existsSync(DB_PATH)) {
  throw new Error(`Local demonstration database not found at ${DB_PATH}.\nCreate it first:  npm run seed`);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const q = {
  refList: db.prepare('SELECT value, label FROM reference_option WHERE list = ? ORDER BY sort_order'),
  cascade: db.prepare(
    'SELECT value, label FROM cascade_option WHERE list = ? AND parent_value = ? ORDER BY sort_order'),
  listExists: db.prepare('SELECT COUNT(*) AS n FROM reference_option WHERE list = ?'),
  cascadeListExists: db.prepare('SELECT COUNT(*) AS n FROM cascade_option WHERE list = ?'),
  insertSubmission: db.prepare(
    'INSERT INTO submission (form_id, reference_no, payload) VALUES (?, ?, ?)'),
  submissions: db.prepare(
    'SELECT reference_no, payload, created_at FROM submission WHERE form_id = ? ORDER BY id DESC LIMIT 50'),
  countSubmissions: db.prepare('SELECT COUNT(*) AS n FROM submission'),
  insertAudit: db.prepare(
    'INSERT INTO audit_log (entity, entity_id, action, maker, approver, details) VALUES (?,?,?,?,?,?)'),
  tableRows: db.prepare(
    'SELECT cells FROM demo_table_row WHERE table_id = ? ORDER BY sort_order LIMIT 25'),
};

function referenceList(list) {
  if (!q.listExists.get(list).n) return null;
  return q.refList.all(list);
}

function cascadeOptions(list, parentValue) {
  if (!list) return [];
  if (!q.cascadeListExists.get(list).n) return null;
  return q.cascade.all(list, String(parentValue));
}

function tableRows(tableId, columnCount) {
  return q.tableRows.all(tableId).map((r) => {
    let cells = [];
    try { cells = JSON.parse(r.cells); } catch { cells = []; }
    while (cells.length < columnCount) cells.push('—');
    return cells.slice(0, columnCount);
  });
}

/** Store a local submission and write an append-only audit entry. */
function recordSubmission(formSpec, value) {
  const n = q.countSubmissions.get().n + 1;
  const reference = `${formSpec.referencePrefix || 'DEMO'}${String(Date.now()).slice(-6)}${String(n).padStart(4, '0')}`;
  // Never persist anything that looks like a secret, even locally: this
  // demonstration authenticates nobody, so a stored password is a liability
  // with no purpose.
  const safe = {};
  for (const [k, v] of Object.entries(value)) {
    if (/pass|pwd|secret|otp|pin|captcha|token/i.test(k)) continue;
    safe[k] = v;
  }
  const info = q.insertSubmission.run(formSpec.id, reference, JSON.stringify(safe));
  q.insertAudit.run('submission', info.lastInsertRowid, 'CREATE', 'local-demo-user', null,
    `${formSpec.id} recorded in the local demonstration as ${reference}`);
  return reference;
}

function submissionsFor(formId) {
  return q.submissions.all(formId).map((r) => {
    let payload = {};
    try { payload = JSON.parse(r.payload); } catch { /* leave empty */ }
    return { reference: r.reference_no, createdAt: r.created_at, payload };
  });
}

module.exports = { db, referenceList, cascadeOptions, tableRows, recordSubmission, submissionsFor };
