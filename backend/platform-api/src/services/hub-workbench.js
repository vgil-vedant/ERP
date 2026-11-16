'use strict';

/**
 * The ERP Hub workbench: apply, approve and correct records of all five
 * departments from one place.
 *
 * The hub does not keep records of its own. Every change goes through the same
 * department service the officers use (departments/service.js), so it is
 *
 *   - validated by the department's own form definition;
 *   - saved in the department's own database, in one transaction with its outbox
 *     event and its activity-log line;
 *   - seen at once in the department office on the portal (same database), and
 *     delivered to the ERP by the integration bus within milliseconds.
 *
 * An officer acting in the office and the hub acting here are therefore working on
 * the same record; the record's version stops either from overwriting a change it
 * has not seen (409, reload and try again).
 *
 *   GET  /api/workbench                                   departments, their forms and record types, counts
 *   GET  /api/workbench/inbox?code=&type=&limit=          records waiting for a decision, all departments
 *   GET  /api/workbench/:code/forms/:key                  one application form, drawn by the hub
 *   POST /api/workbench/:code/records                     { form, values, requestId } -> 201 { record }
 *   GET  /api/workbench/:code/records?type=&status=&q=&page=&size=
 *   GET  /api/workbench/:code/records/:id                 one record: parties, progress, actions, activity
 *   POST /api/workbench/:code/records/:id/actions/:key    { values, version, requestId } -> { record }
 *
 * Behind the hub's sign-in like every other /api path. Writes must also carry
 * X-Hub-Request: 1 and a JSON body, which a form or link on another site cannot
 * send, and are recorded in the platform's append-only audit log.
 */

const express = require('express');
const { open } = require('../departments/store');
const service = require('../departments/service');
const { publicForm } = require('../departments/forms/common');
const { THEMES } = require('../departments/themes');
const { DEPARTMENTS } = require('../departments');
const { SITES } = require('../config/sites');
const platform = require('../db');
const hubAuth = require('./hub-auth');

const ACTIVITY_LIMIT = 50;
const REPLAY_TTL_MS = 10 * 60 * 1000;
const REPLAY_MAX = 2000;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Who acts when the hub acts: shown in the department's activity log as such. */
function actor() {
  const user = hubAuth.USER || 'admin';
  return { username: `erp-hub:${user}`, name: 'ERP Hub administrator', designation: 'ERP Hub', office: 'ERP Hub', channel: 'erp-hub' };
}

/** A department this hub can act for, or a 404. */
function department(code) {
  const site = SITES.find((s) => s.code === code);
  const dept = site && DEPARTMENTS[site.code];
  if (!dept) throw new HttpError(404, 'There is no such department.');
  return { site, dept, store: open(site.code) };
}

function recordId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'This record does not exist.');
  return id;
}

const deptInfo = ({ site, dept }) => ({
  code: site.code, name: site.name, title: dept.title, short: dept.short, port: site.port,
  color: (THEMES[site.code] || {}).primary || '#0E9F6B',
});

// --- replay protection ------------------------------------------------------------
// A request carries a requestId chosen by the page. The same id again (a double
// click, a retry after a dropped connection) gets the first answer back instead of
// creating a second application or applying an action twice.
const replays = new Map();
function replayKey(code, requestId) {
  if (requestId == null || requestId === '') return null;
  const id = String(requestId);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new HttpError(400, 'The request id is not valid. Reload the page and try again.');
  return `${code}:${id}`;
}
function replayed(key) {
  if (!key) return null;
  const hit = replays.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > REPLAY_TTL_MS) { replays.delete(key); return null; }
  return hit;
}
function remember(key, status, body) {
  if (!key) return;
  replays.set(key, { at: Date.now(), status, body });
  if (replays.size > REPLAY_MAX) {
    const now = Date.now();
    for (const [k, v] of replays) if (now - v.at > REPLAY_TTL_MS || replays.size > REPLAY_MAX) replays.delete(k);
  }
}

/** The platform audit log: who did what to which department record, from the hub. Never fails the request. */
function audit(code, ref, action, details) {
  try { platform.audit(code, 'department_record', ref, action, actor().username, null, details); } catch (err) {
    process.stderr.write(`[workbench] audit entry not written for ${code} ${ref}: ${err.message}\n`);
  }
}

function recordView(d, record) {
  const v = service.view(d.dept, d.store, record);
  v.activity = d.store.db.prepare('SELECT at, officer, action, details FROM activity WHERE record_ref = ? ORDER BY id DESC LIMIT ?').all(record.ref, ACTIVITY_LIMIT);
  v.department = deptInfo(d);
  return v;
}

// --- reads ------------------------------------------------------------------------
function overview() {
  const departments = SITES.filter((s) => DEPARTMENTS[s.code]).map((site) => {
    const d = department(site.code);
    const forms = service.formsOf(d.dept, d.store).map((f) => ({ key: f.key, title: f.title, description: f.description || '', recordType: f.recordType, submitLabel: f.submitLabel || 'Submit' }));
    return {
      ...deptInfo(d),
      types: Object.entries(d.dept.types).map(([key, t]) => ({ key, label: t.label, plural: t.plural || t.label, awaiting: Array.isArray(t.awaiting) && t.awaiting.length > 0 })),
      forms,
      awaiting: service.awaiting(d.dept, d.store, { limit: 500 }).rows.length,
      totalRecords: d.store.db.prepare('SELECT COUNT(*) AS n FROM record').get().n,
    };
  });
  return { actor: actor(), departments };
}

function inbox({ code, type, limit }) {
  const codes = code ? [department(String(code)).site.code] : SITES.filter((s) => DEPARTMENTS[s.code]).map((s) => s.code);
  const max = Math.min(500, Math.max(1, Number(limit) || 200));
  let total = 0;
  const rows = [];
  for (const c of codes) {
    const d = department(c);
    const t = type && d.dept.types[type] ? type : null;
    if (type && !t) continue;
    const a = service.awaiting(d.dept, d.store, { type: t, limit: max });
    total += a.rows.length;
    const info = deptInfo(d);
    a.rows.forEach((r) => rows.push({ ...r, department: { code: info.code, name: info.name, short: info.short, color: info.color } }));
  }
  rows.sort((x, y) => String(x.updatedAt).localeCompare(String(y.updatedAt)) || x.id - y.id);
  return { total, rows: rows.slice(0, max) };
}

// --- writes -----------------------------------------------------------------------
function create(code, body) {
  const d = department(code);
  const formKey = String(body.form || '');
  if (!formKey) throw new HttpError(400, 'Choose the application form.');
  const values = body.values && typeof body.values === 'object' && !Array.isArray(body.values) ? body.values : null;
  if (!values) throw new HttpError(400, 'The application has no values.');
  const r = service.create(d.dept, d.store, actor(), formKey, values);
  const form = service.formsOf(d.dept, d.store).find((f) => f.key === formKey);
  audit(d.site.code, r.ref, 'CREATE', `${form ? form.title : formKey}: ${r.ref} (from the ERP Hub)`);
  return { record: recordView(d, r) };
}

function act(code, id, key, body) {
  const d = department(code);
  const values = body.values == null ? {} : body.values;
  if (typeof values !== 'object' || Array.isArray(values)) throw new HttpError(400, 'The values are not valid.');
  if (body.version == null || body.version === '') throw new HttpError(400, 'The record version is missing. Reload the record and try again.');
  const before = d.store.record(id);
  const action = before && (d.dept.actions[before.type] || []).find((a) => a.key === key);
  const r = service.act(d.dept, d.store, actor(), id, key, values, { expectedVersion: body.version });
  audit(d.site.code, r.ref, action && action.kind === 'edit' ? 'EDIT' : 'ACTION', `${action ? action.label : key}: ${r.ref} (from the ERP Hub)`);
  return { record: recordView(d, r) };
}

// --- HTTP -------------------------------------------------------------------------
function send(res, fn, okStatus = 200) {
  try {
    const out = fn();
    res.status(okStatus).json(out);
  } catch (err) { fail(res, err); }
}

function fail(res, err) {
  if (err instanceof service.FormError) return res.status(422).json({ error: err.message, errors: err.errors });
  if (err instanceof service.ActionError || err instanceof HttpError) return res.status(err.status || 409).json({ error: err.message });
  process.stderr.write(`[workbench] ${err.stack || err}\n`);
  return res.status(500).json({ error: 'The hub could not complete this. The error has been logged; try again.' });
}

/** A write: from the hub's own page (header), JSON, and answered once per request id. */
function write(req, res, code, okStatus, fn) {
  let key;
  try { key = replayKey(code, (req.body || {}).requestId); } catch (err) { return fail(res, err); }
  const hit = replayed(key);
  if (hit) return res.status(hit.status).set('X-Replayed', '1').json(hit.body);
  try {
    const out = fn();
    remember(key, okStatus, out);
    return res.status(okStatus).json(out);
  } catch (err) {
    // a refusal (validation, conflict) is not remembered: the person corrects and sends again with the same id
    return fail(res, err);
  }
}

function router() {
  const r = express.Router();
  r.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  r.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    // a page of the hub always sends this header; a form or an image on another site cannot
    if (req.get('X-Hub-Request') !== '1') return res.status(403).json({ error: 'Request refused.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Send the request as JSON.' });
    return next();
  });
  r.use(express.json({ limit: '256kb' }));

  r.get('/', (req, res) => send(res, overview));
  r.get('/inbox', (req, res) => send(res, () => inbox({ code: req.query.code || null, type: req.query.type ? String(req.query.type).slice(0, 40) : null, limit: req.query.limit })));

  r.get('/:code/forms/:key', (req, res) => send(res, () => {
    const d = department(req.params.code);
    const form = service.formsOf(d.dept, d.store).find((f) => f.key === req.params.key);
    if (!form) throw new HttpError(404, 'This form does not exist.');
    return { department: deptInfo(d), form: publicForm(form) };
  }));

  r.get('/:code/records', (req, res) => send(res, () => {
    const d = department(req.params.code);
    const out = service.list(d.dept, d.store, {
      type: d.dept.types[req.query.type] ? req.query.type : null,
      status: req.query.status ? String(req.query.status).slice(0, 40) : null,
      q: req.query.q, page: req.query.page, size: req.query.size,
    });
    return { department: deptInfo(d), ...out };
  }));

  r.get('/:code/records/:id', (req, res) => send(res, () => {
    const d = department(req.params.code);
    const rec = d.store.record(recordId(req.params.id));
    if (!rec) throw new HttpError(404, 'This record does not exist.');
    return recordView(d, rec);
  }));

  r.post('/:code/records', (req, res) => write(req, res, req.params.code, 201, () => create(req.params.code, req.body || {})));
  r.post('/:code/records/:id/actions/:key', (req, res) => write(req, res, req.params.code, 200,
    () => act(req.params.code, recordId(req.params.id), String(req.params.key).slice(0, 40), req.body || {})));

  r.use((req, res) => res.status(404).json({ error: 'not found' }));
  // a body that is not JSON, or too large
  // eslint-disable-next-line no-unused-vars
  r.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON.' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'The application is too large.' });
    return fail(res, err);
  });
  return r;
}

function install(app) {
  app.use('/api/workbench', router());
}

module.exports = { install, overview, inbox, actor };
