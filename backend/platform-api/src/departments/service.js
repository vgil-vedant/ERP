'use strict';

/**
 * What an officer can do in a department, independent of HTTP:
 * create a record from a form, move a record along its workflow, list and read.
 *
 * Every change happens in one transaction together with its outbox event and
 * its activity-log line, so a record is never saved without the ERP being told,
 * and never announced without being saved.
 */

const { validate, applies, stamp, today, pad } = require('./forms/common');
const { progress, WORKFLOWS } = require('../../../shared/records/workflows');
const events = require('./events');
const bus = require('./bus');

class FormError extends Error {
  constructor(errors, message) { super(message || 'Some fields need attention.'); this.errors = errors; this.status = 422; }
}
class ActionError extends Error {
  constructor(message, status) { super(message); this.status = status || 409; }
}

/** The context a department's form builders and actions work with. */
function context(store, dept, officer) {
  return {
    store, officer, dept,
    today, stamp, pad,
    now: () => new Date().toISOString(),
    seq: (name, floor) => store.next(name, floor),
    fail: (field, message) => { throw new FormError({ [field]: message }); },

    /**
     * The department's own record of a person: found by Aadhaar, or by mobile
     * number and name together, or created. Missing details are filled in;
     * nothing already held is overwritten.
     */
    person(input) {
      const ids = input.identifiers || {};
      let row = null;
      if (ids.aadhaar) row = store.db.prepare("SELECT * FROM person WHERE json_extract(identifiers, '$.aadhaar') = ?").get(ids.aadhaar);
      if (!row && ids.mobile) {
        // Same mobile and name: the same person only if the Aadhaar numbers do not disagree.
        // Two different Aadhaar numbers are always two people (Aadhaar is unique across India).
        row = store.db.prepare("SELECT * FROM person WHERE json_extract(identifiers, '$.mobile') = ? AND name_key = ? ORDER BY id")
          .all(ids.mobile, store.nameKey(input.name))
          .find((r) => {
            let held = null;
            try { held = (JSON.parse(r.identifiers || '{}') || {}).aadhaar || null; } catch { held = null; }
            return !held || !ids.aadhaar || held === ids.aadhaar;
          }) || null;
      }
      if (row) {
        const p = store.person(row.id);
        store.savePerson({
          ref: p.ref, name: p.name || input.name, gender: p.gender || input.gender, dob: p.dob || input.dob,
          district: p.district || input.district,
          identifiers: { ...input.identifiers, ...p.identifiers },
          profile: { ...input.profile, ...p.profile },
        });
        return row.id;
      }
      const ref = `${dept.personPrefix}-${pad(store.next('person'), 6)}`;
      return store.savePerson({ ref, ...input });
    },
  };
}

function formsOf(dept, store) {
  return dept.forms(store).map((f) => ({ ...f, recordType: f.recordType }));
}

/** Create the records a form describes. Returns the main record. */
function create(dept, store, officer, formKey, input) {
  const form = formsOf(dept, store).find((f) => f.key === formKey);
  if (!form) throw new ActionError('This form does not exist.', 404);
  const v = validate(form, input);
  if (!v.ok) throw new FormError(v.errors);
  const ctx = context(store, dept, officer);
  let mainId = null;
  store.db.transaction(() => {
    const out = form.build(v.values, ctx);
    for (const r of out.records) {
      // a new record never takes over an existing one's reference
      if (store.recordByRef(r.ref)) throw new ActionError(`A record numbered ${r.ref} already exists. Submit again to be given the next number.`);
      const id = store.saveRecord({ ...r, parties: (r.parties || []).map((p) => ({ ...p, personId: p.personId })) }, officer.username);
      events.publish(store, id);
      if (!mainId) mainId = id;
    }
    for (const id of out.touched || []) events.publish(store, id);
    const main = store.record(mainId);
    store.log(officer.username, 'CREATE', main.ref, `${form.title}: ${main.ref}${via(officer)}`);
  })();
  bus.schedule(store.code);
  return store.record(mainId);
}

/** The actions open to a record in its current status. */
function actionsFor(dept, record) {
  return (dept.actions[record.type] || []).filter((a) => a.from.includes(record.status));
}

/**
 * Whether two versions of a record's data say the same thing: key order does not
 * matter, and a key that is missing is the same as one that is null.
 */
function canonical(x) {
  if (Array.isArray(x)) return x.map(canonical);
  if (x && typeof x === 'object') {
    const out = {};
    for (const k of Object.keys(x).sort()) if (x[k] !== null && x[k] !== undefined) out[k] = canonical(x[k]);
    return out;
  }
  return x;
}
const sameData = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** " (via ERP Hub)" when the change was made from the hub rather than in the office. */
function via(officer) {
  return officer && officer.channel === 'erp-hub' ? ' (via ERP Hub)' : '';
}

/**
 * An action's fields as a form shows them. An action with `prefill(record)`
 * (the "Edit details" actions) opens with the record's current values, so the
 * person corrects what is there instead of typing everything again.
 */
function actionFields(action, record) {
  const fields = action.fields || [];
  if (typeof action.prefill !== 'function') return fields;
  let values = {};
  try { values = action.prefill(record) || {}; } catch { values = {}; }
  return fields.map((f) => (values[f.name] === undefined || values[f.name] === null ? f : { ...f, default: values[f.name] }));
}

/**
 * Whether a record is waiting for a decision: its type lists the statuses in
 * which someone has to act (`awaiting`), and an action is open to it.
 */
function isAwaiting(dept, record) {
  const t = dept.types[record.type];
  if (!t || !Array.isArray(t.awaiting) || !t.awaiting.includes(record.status)) return false;
  return actionsFor(dept, record).some((a) => a.kind !== 'edit');
}

/** Records waiting for a decision, oldest first (first come, first served). */
function awaiting(dept, store, { type, limit = 200 } = {}) {
  const pairs = [];
  for (const [key, t] of Object.entries(dept.types)) {
    if (type && key !== type) continue;
    for (const s of t.awaiting || []) pairs.push([key, s]);
  }
  if (!pairs.length) return { total: 0, rows: [] };
  const where = pairs.map(() => '(record_type = ? AND status = ?)').join(' OR ');
  const args = pairs.flat();
  const total = store.db.prepare(`SELECT COUNT(*) AS n FROM record WHERE ${where}`).get(...args).n;
  const max = Math.min(500, Math.max(1, Number(limit) || 200));
  const rows = store.db.prepare(`SELECT id FROM record WHERE ${where} ORDER BY updated_at ASC, id ASC LIMIT ?`).all(...args, max)
    .map((r) => store.record(r.id))
    .filter((r) => r && isAwaiting(dept, r))
    .map((r) => {
      const v = view(dept, store, r);
      return {
        id: v.id, ref: v.ref, type: v.type, typeLabel: v.typeLabel, title: v.title, subtitle: v.subtitle,
        status: v.status, statusLabel: v.statusLabel, date: v.date, createdAt: v.createdAt, updatedAt: v.updatedAt,
        createdBy: v.createdBy, version: v.version, erp: v.erp && v.erp.status,
        actions: v.actions.filter((a) => a.kind !== 'edit'),
      };
    });
  return { total, rows };
}

/**
 * Apply one action to a record.
 *
 * `opts.expectedVersion` is the version of the record the person was looking at
 * when they chose the action. When it is given and the record has moved on since
 * (an officer and the ERP Hub acting on the same record), nothing is changed and
 * the caller is told to reload, so no one overwrites a change they never saw.
 */
function act(dept, store, officer, recordId, key, input, opts = {}) {
  const record = store.record(recordId);
  if (!record) throw new ActionError('This record does not exist.', 404);
  const action = (dept.actions[record.type] || []).find((a) => a.key === key);
  if (!action) throw new ActionError('This action does not exist for this record.', 404);
  const expected = opts.expectedVersion == null || opts.expectedVersion === '' ? null : Number(opts.expectedVersion);
  if (expected != null && (!Number.isInteger(expected) || expected !== record.version)) {
    throw new ActionError('This record was changed after you opened it. Reload to see its current state, then try again.');
  }
  if (!action.from.includes(record.status)) {
    throw new ActionError(`This record is ${statusLabel(record)} now, so "${action.label}" is no longer possible. Reload to see its current state.`);
  }
  const form = { sections: [{ fields: action.fields || [] }], rules: action.rules };
  const v = validate(form, input);
  if (!v.ok) throw new FormError(v.errors);
  const ctx = context(store, dept, officer);
  store.db.transaction(() => {
    // re-read inside the transaction: the record may have moved since the page was drawn
    const fresh = store.record(recordId);
    if (fresh.version !== record.version) throw new ActionError('Someone else changed this record a moment ago. Reload to see its current state.');
    // most actions only move the record on; some also change its data or create records
    const out = (typeof action.apply === 'function' ? action.apply(fresh, v.values, ctx) : null) || {};
    // an edit that changes nothing would only add a version and an event the ERP does not need
    if (action.kind === 'edit' && sameData(out.data || fresh.data, fresh.data) && !(out.records || []).length) {
      throw new ActionError('Nothing was changed, so nothing was saved.', 422);
    }
    const status = out.status || action.to || fresh.status;
    const history = fresh.history.slice();
    if (action.to && action.to !== fresh.status) history.push({ status: action.to, at: out.at || today() });
    store.saveRecord({ ref: fresh.ref, type: fresh.type, status, date: fresh.date, data: out.data || fresh.data, history }, fresh.createdBy);
    events.publish(store, fresh.id);
    for (const r of out.records || []) { const id = store.saveRecord(r, officer.username); events.publish(store, id); }
    for (const id of out.touched || []) events.publish(store, id);
    store.log(officer.username, action.kind === 'edit' ? 'EDIT' : 'ACTION', fresh.ref, `${action.label}${out.note ? `: ${out.note}` : ''}${via(officer)}`);
  })();
  bus.schedule(store.code);
  return store.record(recordId);
}

function statusLabel(record) {
  const p = progress(record.type, record.status, record.history);
  return p ? `"${p.statusLabel}"` : `"${record.status || 'recorded'}"`;
}

/** A record as the office shows it: with parties, progress and the actions open to it. */
function view(dept, store, record) {
  const parties = store.partiesOf(record.id).map((p) => ({
    ref: p.ref, name: p.name, gender: p.gender, dob: p.dob, role: p.role, relation: p.relation, label: p.label,
    identifiers: mask(p.identifiers),
  }));
  const type = dept.types[record.type] || { label: record.type };
  const delivery = store.db.prepare(
    'SELECT status, created_ms, delivered_ms, last_error, attempts FROM outbox WHERE record_id = ? ORDER BY id DESC LIMIT 1').get(record.id);
  return {
    ...record,
    typeLabel: type.label,
    title: type.title ? type.title(record) : record.ref,
    subtitle: type.subtitle ? type.subtitle(record, parties) : parties.map((p) => p.name).join(', '),
    parties,
    progress: WORKFLOWS[record.type] ? progress(record.type, record.status, record.history) : null,
    statusLabel: WORKFLOWS[record.type] ? (progress(record.type, record.status, record.history) || {}).statusLabel : (type.statusLabel ? type.statusLabel(record) : 'Recorded'),
    actions: actionsFor(dept, record).map((a) => ({ key: a.key, label: a.label, tone: a.tone || 'primary', description: a.description || '', fields: actionFields(a, record), kind: a.kind || 'workflow', to: a.to || null })),
    erp: delivery ? {
      status: delivery.status, attempts: delivery.attempts, error: delivery.last_error,
      latencyMs: delivery.delivered_ms ? delivery.delivered_ms - delivery.created_ms : null,
      deliveredAt: delivery.delivered_ms ? new Date(delivery.delivered_ms).toISOString() : null,
    } : null,
  };
}

/** Identity numbers as an officer sees them in lists: masked. */
function mask(ids) {
  const out = {};
  for (const [k, v] of Object.entries(ids || {})) {
    const s = String(v);
    out[k] = k === 'aadhaar' ? `XXXX XXXX ${s.slice(-4)}` : k === 'mobile' ? `XXXXXX${s.slice(-4)}` : k === 'eid' ? `${s.slice(0, 4)} XXXX XXXX ${s.slice(-2)}` : s;
  }
  return out;
}

/** Records, newest first, with optional type, status and text filters, paged. */
function list(dept, store, { type, status, q, page = 1, size = 20 } = {}) {
  const where = [];
  const args = [];
  if (type) { where.push('r.record_type = ?'); args.push(type); }
  if (status) { where.push('r.status = ?'); args.push(status); }
  if (q) {
    const text = String(q).trim().slice(0, 80);
    const key = store.nameKey(text);
    const digits = text.replace(/\D/g, '');
    const conds = ['r.record_ref LIKE ?'];
    args.push(`%${text.replace(/[%_]/g, '')}%`);
    if (key) { conds.push("EXISTS (SELECT 1 FROM record_party rp JOIN person p ON p.id = rp.person_id WHERE rp.record_id = r.id AND p.name_key LIKE ?)"); args.push(`%${key}%`); }
    if (digits.length >= 4) {
      conds.push("EXISTS (SELECT 1 FROM record_party rp JOIN person p ON p.id = rp.person_id WHERE rp.record_id = r.id AND (json_extract(p.identifiers, '$.aadhaar') = ? OR json_extract(p.identifiers, '$.mobile') = ?))");
      args.push(digits, digits);
    }
    conds.push('r.data LIKE ?'); args.push(`%${text.replace(/[%_]/g, '')}%`);
    where.push(`(${conds.join(' OR ')})`);
  }
  const sql = `FROM record r ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
  const total = store.db.prepare(`SELECT COUNT(*) AS n ${sql}`).get(...args).n;
  const pageSize = Math.min(100, Math.max(5, Number(size) || 20));
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(pages, Math.max(1, Number(page) || 1));
  const rows = store.db.prepare(`SELECT r.id ${sql} ORDER BY r.updated_at DESC, r.id DESC LIMIT ? OFFSET ?`)
    .all(...args, pageSize, (p - 1) * pageSize);
  return {
    total, page: p, pages, size: pageSize,
    rows: rows.map((r) => {
      const v = view(dept, store, store.record(r.id));
      return { id: v.id, ref: v.ref, type: v.type, typeLabel: v.typeLabel, title: v.title, subtitle: v.subtitle, status: v.status, statusLabel: v.statusLabel, progress: v.progress && { current: v.progress.current, steps: v.progress.steps.map((s) => s.state) }, date: v.date, updatedAt: v.updatedAt, erp: v.erp && v.erp.status };
    }),
  };
}

/** Figures for the department dashboard. */
function summary(dept, store) {
  const byType = store.db.prepare('SELECT record_type AS type, status, COUNT(*) AS n FROM record GROUP BY record_type, status').all();
  const types = Object.entries(dept.types).map(([key, t]) => {
    const rows = byType.filter((r) => r.type === key);
    const total = rows.reduce((a, r) => a + r.n, 0);
    const open = rows.filter((r) => !(t.closed || []).includes(r.status)).reduce((a, r) => a + r.n, 0);
    return {
      type: key, label: t.label, plural: t.plural || t.label, total, open: t.closed ? open : null,
      byStatus: rows.map((r) => ({ status: r.status, n: r.n, label: WORKFLOWS[key] && r.status ? ((WORKFLOWS[key].status[r.status] || {}).label || cap(r.status)) : 'Recorded' })),
    };
  });
  const recent = store.db.prepare('SELECT id FROM record ORDER BY updated_at DESC, id DESC LIMIT 8').all().map((r) => {
    const v = view(dept, store, store.record(r.id));
    return { id: v.id, ref: v.ref, typeLabel: v.typeLabel, title: v.title, subtitle: v.subtitle, statusLabel: v.statusLabel, updatedAt: v.updatedAt, erp: v.erp && v.erp.status };
  });
  const people = store.db.prepare('SELECT COUNT(*) AS n FROM person').get().n;
  const today7 = store.db.prepare("SELECT COUNT(*) AS n FROM record WHERE created_at >= datetime('now', '-7 days')").get().n;
  const attention = typeof dept.attention === 'function' ? dept.attention(store) : [];
  return { types, recent, people, createdThisWeek: today7, attention };
}

function cap(s) { s = String(s || '').replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = { create, act, view, list, summary, formsOf, actionsFor, awaiting, isAwaiting, FormError, ActionError, applies, mask };
