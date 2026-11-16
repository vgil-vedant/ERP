#!/usr/bin/env node
'use strict';

/**
 * Tests for the ERP Hub workbench: applying, approving and correcting records of
 * the five departments from the hub, and the same records being changed in the
 * department offices.
 *
 * Starts its own ERP and platform (separate ports, databases in a temporary
 * directory), so nothing here touches the real data or the running stack.
 *
 *   node tests/workbench/run-workbench-tests.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'erp-workbench-test-'));
const OFFSET = 6500;
const ERP_PORT = 10790;
const HUB_PORT = 10600;
const PORT = { eprisons: 4173 + OFFSET, cctns: 4175 + OFFSET, eforensics: 4176 + OFFSET, uidai: 4177 + OFFSET, ecourts: 4178 + OFFSET };
const ERP_DB = path.join(TMP, 'erp.sqlite');
const PLATFORM_DB = path.join(TMP, 'platform.sqlite');
const DEPT_DIR = path.join(TMP, 'departments');
const HUB_AUTH = `Basic ${Buffer.from('admin:test-pass-123').toString('base64')}`;

let pass = 0; let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass += 1; process.stdout.write(`  ok   ${name}\n`); return; }
  fail += 1; process.stdout.write(`  FAIL ${name}${detail ? `\n         ${detail}` : ''}\n`);
}
const eq = (name, a, b) => ok(name, a === b, `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const rid = () => crypto.randomUUID();

function req(port, method, p, { json, form, cookie, headers = {}, raw } = {}) {
  return new Promise((resolve) => {
    const body = raw != null ? raw : form ? new URLSearchParams(form).toString() : json !== undefined ? JSON.stringify(json) : null;
    const r = http.request({
      host: '127.0.0.1', port, path: p, method,
      headers: {
        ...(body != null ? { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(cookie ? { Cookie: cookie } : {}), ...headers,
      },
    }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* not json */ } resolve({ status: res.statusCode, headers: res.headers, json: j, text: b }); });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body != null) r.write(body);
    r.end();
  });
}

const hub = {
  get: (p) => req(HUB_PORT, 'GET', `/api/workbench${p}`, { headers: { Authorization: HUB_AUTH } }),
  post: (p, json, extra = {}) => req(HUB_PORT, 'POST', `/api/workbench${p}`, { json, headers: { Authorization: HUB_AUTH, 'X-Hub-Request': '1', ...extra } }),
};

const procs = {};
function startErp() {
  procs.erp = spawn(process.execPath, [path.join(ROOT, 'backend/erp-api/src/server.js')], {
    env: { ...process.env, ERP_DB, ERP_PORT: String(ERP_PORT), LOOKUP_DATASET: '' }, stdio: ['ignore', 'ignore', 'inherit'],
  });
}
function startPlatform() {
  procs.platform = spawn(process.execPath, [path.join(ROOT, 'backend/platform-api/src/server.js')], {
    env: { ...process.env, PLATFORM_DB, DEPARTMENT_DB_DIR: DEPT_DIR, PLATFORM_PORT: String(HUB_PORT), PORT_OFFSET: String(OFFSET), ERP_PORT: String(ERP_PORT), HUB_ADMIN_PASSWORD: 'test-pass-123' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}
async function waitFor(fn, ms = 15000, step = 100) {
  const end = Date.now() + ms;
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return null; await sleep(step); }
}
const up = (port, p) => waitFor(async () => (await req(port, 'GET', p)).status > 0);

async function login(code) {
  const r = await req(PORT[code], 'POST', '/office/login', { form: { username: `${code}.officer`, password: 'Office@2026' } });
  const c = (r.headers['set-cookie'] || [])[0];
  return c ? c.split(';')[0] : null;
}
const office = (code, cookie) => ({
  get: (p) => req(PORT[code], 'GET', `/office/api${p}`, { cookie }),
  post: (p, json) => req(PORT[code], 'POST', `/office/api${p}`, { cookie, json, headers: { 'X-Office-Request': '1' } }),
});

function deptDb(code) { return new Database(path.join(DEPT_DIR, `${code}.sqlite`), { readonly: true }); }
function outboxOf(code, ref) {
  const d = deptDb(code);
  const rows = d.prepare('SELECT status FROM outbox WHERE record_ref = ? ORDER BY id').all(ref);
  d.close();
  return rows;
}
const allDelivered = (code, ref) => waitFor(() => { const o = outboxOf(code, ref); return o.length > 0 && o.every((x) => x.status === 'delivered') ? o : null; }, 8000, 50);

(async () => {
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'backend/erp-api/src/seed.js')], { env: { ...process.env, ERP_DB }, stdio: 'ignore' });
  startErp();
  await up(ERP_PORT, '/api/summary');
  startPlatform();
  await up(HUB_PORT, '/login');
  await up(PORT.cctns, '/office/login');

  process.stdout.write('\n1. The workbench is behind the hub sign-in and refuses writes from elsewhere\n');
  eq('it needs a signed-in hub user', (await req(HUB_PORT, 'GET', '/api/workbench')).status, 401);
  const ov = await hub.get('');
  eq('the signed-in hub user reads it', ov.status, 200);
  eq('it covers the five departments', ov.json.departments.map((d) => d.code).sort().join(','), 'cctns,ecourts,eforensics,eprisons,uidai');
  ok('every department lists its application forms', ov.json.departments.every((d) => d.forms.length > 0));
  eq('the hub acts as itself', ov.json.actor.username, 'erp-hub:admin');
  eq('a write without the hub header is refused', (await req(HUB_PORT, 'POST', '/api/workbench/cctns/records', { json: {}, headers: { Authorization: HUB_AUTH } })).status, 403);
  eq('a write that is not JSON is refused', (await req(HUB_PORT, 'POST', '/api/workbench/cctns/records', { form: { form: 'fir' }, headers: { Authorization: HUB_AUTH, 'X-Hub-Request': '1' } })).status, 415);
  eq('a body that is not valid JSON is refused', (await req(HUB_PORT, 'POST', '/api/workbench/cctns/records', { raw: '{nope', headers: { Authorization: HUB_AUTH, 'X-Hub-Request': '1', 'Content-Type': 'application/json' } })).status, 400);
  eq('an unknown department is a 404', (await hub.get('/nowhere/records')).status, 404);
  eq('an unknown form is a 404', (await hub.get('/cctns/forms/nothing')).status, 404);
  eq('a record id that is not a number is a 404', (await hub.get('/cctns/records/abc')).status, 404);
  eq('a record that does not exist is a 404', (await hub.get('/cctns/records/999999')).status, 404);
  const form = await hub.get('/cctns/forms/verification');
  ok('a form comes with its sections and fields', form.status === 200 && form.json.form.sections.length > 0 && form.json.form.sections[0].fields.length > 0);
  ok('and without the server-side functions', form.json.form.build === undefined);

  process.stdout.write('\n2. An application made in the hub is saved in the department and reaches the ERP\n');
  const incomplete = await hub.post('/cctns/records', { form: 'verification', values: { service: 'Antecedent verification' }, requestId: rid() });
  ok('an incomplete application is refused field by field', incomplete.status === 422 && incomplete.json.errors.purpose && incomplete.json.errors.subject_name);
  eq('an application without a form is refused', (await hub.post('/cctns/records', { values: {}, requestId: rid() })).status, 400);
  eq('a request id that is not valid is refused', (await hub.post('/cctns/records', { form: 'verification', values: {}, requestId: 'x' })).status, 400);
  const applyId = rid();
  const values = {
    service: 'Antecedent verification', purpose: 'Tenant verification', requester: 'landlord', lawful_basis: 'Consent of the subject, recorded',
    consent: true, subject_name: 'Kavita Pawar', subject_gender: 'F', subject_mobile: '9811122233', subject_aadhaar: '',
  };
  const made = await hub.post('/cctns/records', { form: 'verification', values, requestId: applyId });
  eq('the application is created', made.status, 201);
  const vr = made.json.record;
  ok('it has the department\'s own reference', /^REQ-\d{4}-\d{6}$/.test(vr.ref), vr.ref);
  eq('it starts as submitted', vr.status, 'submitted');
  eq('it was created by the hub', vr.createdBy, 'erp-hub:admin');
  ok('the activity log says it came from the hub', vr.activity.some((a) => a.action === 'CREATE' && /via ERP Hub/.test(a.details)));
  const again = await hub.post('/cctns/records', { form: 'verification', values, requestId: applyId });
  ok('sending the same application again returns the first one, not a second', again.status === 201 && again.json.record.ref === vr.ref && again.headers['x-replayed'] === '1');
  const cdb = deptDb('cctns');
  eq('there is exactly one such record in the CCTNS database', cdb.prepare('SELECT COUNT(*) AS n FROM record WHERE record_ref = ?').get(vr.ref).n, 1);
  cdb.close();
  ok('it is delivered to the ERP', !!(await allDelivered('cctns', vr.ref)));
  const officer = office('cctns', await login('cctns'));
  const inOffice = await officer.get(`/records/${vr.id}`);
  ok('the CCTNS office sees it at once', inOffice.status === 200 && inOffice.json.ref === vr.ref);

  process.stdout.write('\n3. The hub approves; the office sees it; neither overwrites the other\n');
  const box = await hub.get('/inbox');
  const item = box.json.rows.find((r) => r.ref === vr.ref);
  ok('the application is waiting in the hub inbox', !!item);
  ok('with the department named and the decisions open to it', item && item.department.code === 'cctns' && item.actions.some((a) => a.key === 'start'));
  ok('the edit action is not a decision', item && !item.actions.some((a) => a.key === 'edit'));
  eq('the inbox can be narrowed to one department', (await hub.get('/inbox?code=eprisons')).json.rows.every((r) => r.department.code === 'eprisons'), true);
  eq('an action without the record version is refused', (await hub.post(`/cctns/records/${vr.id}/actions/start`, { values: {}, requestId: rid() })).status, 400);
  eq('an action that does not exist is a 404', (await hub.post(`/cctns/records/${vr.id}/actions/fly`, { values: {}, version: vr.version, requestId: rid() })).status, 404);
  const started = await hub.post(`/cctns/records/${vr.id}/actions/start`, { values: {}, version: vr.version, requestId: rid() });
  eq('the hub starts the check', started.status, 200);
  eq('the record moves on', started.json.record.status, 'in_progress');
  eq('its version goes up', started.json.record.version, vr.version + 1);
  eq('the office sees the new status', (await officer.get(`/records/${vr.id}`)).json.status, 'in_progress');
  const stale = await hub.post(`/cctns/records/${vr.id}/actions/defer`, { values: { reason: 'Portal down' }, version: vr.version, requestId: rid() });
  eq('an action on a version that has moved on is refused', stale.status, 409);
  eq('and nothing changed', (await hub.get(`/cctns/records/${vr.id}`)).json.status, 'in_progress');
  const staleOffice = await officer.post(`/records/${vr.id}/actions/defer`, { values: { reason: 'Portal down' }, version: vr.version });
  eq('the office is refused the same way when the hub moved the record first', staleOffice.status, 409);
  const oldClient = await officer.post(`/records/${vr.id}/actions/defer`, { values: { reason: 'Portal down' } });
  eq('an office page that sends no version still works as before', oldClient.status, 200);
  const resumed = await hub.post(`/cctns/records/${vr.id}/actions/resume`, { values: {}, version: oldClient.json.record.version, requestId: rid() });
  eq('the hub sees the office\'s change and acts on it', resumed.status, 200);
  const outcome = await hub.post(`/cctns/records/${vr.id}/actions/outcome`, { values: { result: 'record_found' }, version: resumed.json.record.version, requestId: rid() });
  ok('a decision missing a required detail is refused field by field', outcome.status === 422 && outcome.json.errors.detail);
  const done = await hub.post(`/cctns/records/${vr.id}/actions/outcome`, { values: { result: 'no_record_found' }, version: resumed.json.record.version, requestId: rid() });
  eq('the hub records the outcome', done.json.record.status, 'completed');
  ok('every change reached the ERP', !!(await allDelivered('cctns', vr.ref)));
  const acts = (await officer.get(`/records/${vr.id}`)).json.activity;
  ok('the office activity log names the hub for the hub\'s steps', acts.filter((a) => a.officer === 'erp-hub:admin').length >= 4);
  ok('and the officer for the officer\'s step', acts.some((a) => a.officer === 'cctns.officer'));

  process.stdout.write('\n4. Details are corrected from either side\n');
  const fresh = (await hub.get(`/cctns/records/${vr.id}`)).json;
  ok('a completed request can no longer be edited', !fresh.actions.some((a) => a.key === 'edit'));
  const vr2 = (await hub.post('/cctns/records', { form: 'verification', values: { ...values, subject_name: 'Sunil Gaikwad', subject_mobile: '9811122244' }, requestId: rid() })).json.record;
  const edit = vr2.actions.find((a) => a.key === 'edit');
  ok('an open request offers "Edit details"', !!edit && edit.kind === 'edit');
  eq('the edit form opens with the current values', edit.fields.find((f) => f.name === 'purpose').default, 'Tenant verification');
  const same = await hub.post(`/cctns/records/${vr2.id}/actions/edit`, { values: { purpose: 'Tenant verification', lawful_basis: 'Consent of the subject, recorded' }, version: vr2.version, requestId: rid() });
  eq('an edit that changes nothing is refused', same.status, 422);
  const edited = await hub.post(`/cctns/records/${vr2.id}/actions/edit`, { values: { purpose: 'Employee verification', lawful_basis: 'Consent of the subject, recorded' }, version: vr2.version, requestId: rid() });
  eq('the hub corrects the purpose', edited.status, 200);
  eq('the change is saved', edited.json.record.data.purpose, 'Employee verification');
  eq('the status does not move', edited.json.record.status, 'submitted');
  ok('the activity log names what changed', edited.json.record.activity.some((a) => a.action === 'EDIT' && /changed Purpose/.test(a.details) && /via ERP Hub/.test(a.details)));
  eq('the office sees the corrected purpose', (await officer.get(`/records/${vr2.id}`)).json.data.purpose, 'Employee verification');
  const officeEdit = await officer.post(`/records/${vr2.id}/actions/edit`, { values: { purpose: 'Passport', lawful_basis: 'Passport Act, 1967' }, version: edited.json.record.version });
  eq('the office corrects it in turn', officeEdit.status, 200);
  const seen = (await hub.get(`/cctns/records/${vr2.id}`)).json;
  eq('the hub sees the office\'s correction', seen.data.lawful_basis, 'Passport Act, 1967');
  eq('a field that is not allowed is refused', (await hub.post(`/cctns/records/${vr2.id}/actions/edit`, { values: { purpose: 'Bribery', lawful_basis: 'x' }, version: seen.version, requestId: rid() })).status, 422);
  ok('the corrections reached the ERP', !!(await allDelivered('cctns', vr2.ref)));

  process.stdout.write('\n5. UIDAI: an enrolment applied for and approved entirely from the hub\n');
  const ef = (await hub.get('/uidai/forms/enrolment')).json.form.sections.flatMap((s) => s.fields);
  const first = (name) => ef.find((f) => f.name === name).options[0].value;
  const enrol = await hub.post('/uidai/records', { form: 'enrolment', requestId: rid(), values: {
    resident_status: 'Resident Indian', basis: 'Document verification', name: 'Anita Deshmukh', gender: 'F', dob: '1991-04-12', dob_basis: 'verified',
    mobile: '9822233344', house: '14', locality: 'Kothrud', vtc: 'Pune', po: 'Kothrud', pin: '411038', district: 'Pune', state: 'Maharashtra',
    poi: first('poi'), poa: first('poa'), consent: true,
  } });
  ok('the enrolment is submitted', enrol.status === 201 && enrol.json.record.status === 'submitted', JSON.stringify(enrol.json && (enrol.json.errors || enrol.json.error)));
  let e = enrol.json.record;
  const editAddr = e.actions.find((a) => a.key === 'edit');
  eq('the address edit opens with the PIN on file', editAddr && editAddr.fields.find((f) => f.name === 'pin').default, '411038');
  const addrValues = Object.fromEntries(editAddr.fields.filter((f) => f.default != null).map((f) => [f.name, f.default]));
  const fixed = await hub.post(`/uidai/records/${e.id}/actions/edit`, { values: { ...addrValues, house: '14B' }, version: e.version, requestId: rid() });
  eq('the hub corrects the house number', fixed.status === 200 && fixed.json.record.data.address.house, '14B');
  e = fixed.json.record;
  for (const [key, vals] of [['start_review', {}], ['verify', { how: 'Documents checked against Schedule II' }], ['approve', {}]]) {
    const r = await hub.post(`/uidai/records/${e.id}/actions/${key}`, { values: vals, version: e.version, requestId: rid() });
    ok(`"${key}" from the hub`, r.status === 200, JSON.stringify(r.json));
    if (r.status === 200) e = r.json.record;
  }
  eq('the enrolment is approved', e.status, 'approved');
  ok('an Aadhaar number was issued', /^XXXX XXXX \d{4}$/.test(e.data.aadhaar_masked || ''));
  const udb = deptDb('uidai');
  const identity = udb.prepare("SELECT data FROM record WHERE record_type = 'aadhaar_identity' AND json_extract(data, '$.aadhaar_masked') = ?").get(e.data.aadhaar_masked);
  udb.close();
  ok('the identity record was created with the corrected address', identity && JSON.parse(identity.data).poa.house === '14B');
  ok('the enrolment is no longer editable once approved', !e.actions.some((a) => a.key === 'edit'));

  process.stdout.write('\n6. ePrisons: a visit applied for in the hub, edited, approved; the custody record follows\n');
  const vf = await hub.get('/eprisons/forms/visit');
  const prisoner = vf.json.form.sections.flatMap((s) => s.fields).find((f) => f.name === 'prisoner').options[0];
  ok('the visit form lists prisoners in custody', !!prisoner);
  const visit = await hub.post('/eprisons/records', { form: 'visit', requestId: rid(), values: {
    visitor_name: 'Ramesh Kale', visitor_father: 'Dattatray Kale', visitor_gender: 'M', visitor_age: 45, visitor_mobile: '9890011122',
    visitor_address: '12 MG Road, Pune', visitor_email: 'ramesh.kale@example.org', relation: 'Brother', id_proof: 'PAN', id_number: 'ABCDE1234F',
    prisoner: prisoner.value, visit_date: inDays(3), mode: 'Physical', additional: 0,
  } });
  ok('the visit is registered', visit.status === 201, JSON.stringify(visit.json && (visit.json.errors || visit.json.error)));
  let v = visit.json.record;
  const moved = await hub.post(`/eprisons/records/${v.id}/actions/edit`, { values: { visit_date: inDays(5), mode: 'Video conference', additional: 0 }, version: v.version, requestId: rid() });
  eq('the hub moves the visit', moved.status === 200 && moved.json.record.data.visit_date, inDays(5));
  v = moved.json.record;
  const pdb = deptDb('eprisons');
  const custody = pdb.prepare(`SELECT r.data FROM record r JOIN record_party rp ON rp.record_id = r.id JOIN person p ON p.id = rp.person_id
    WHERE r.record_type = 'custody' AND p.person_ref = ?`).get(prisoner.value);
  pdb.close();
  const listed = JSON.parse(custody.data).visits_received.find((x) => x.reg_no === v.ref);
  ok('the prisoner\'s custody record shows the new date and mode', listed && listed.date === inDays(5) && listed.mode === 'Video conference');
  const past = await hub.post(`/eprisons/records/${v.id}/actions/edit`, { values: { visit_date: '2020-01-01', mode: 'Physical', additional: 0 }, version: v.version, requestId: rid() });
  ok('a visit cannot be moved into the past', past.status === 422 && past.json.errors.visit_date);
  const approved = await hub.post(`/eprisons/records/${v.id}/actions/approve`, { values: { slot: '10:00 to 10:30' }, version: v.version, requestId: rid() });
  eq('the hub approves the visit', approved.status === 200 && approved.json.record.status, 'approved');
  ok('the eprisons office sees the approval', (await office('eprisons', await login('eprisons')).get(`/records/${v.id}`)).json.status === 'approved');
  ok('the approval reached the ERP', !!(await allDelivered('eprisons', v.ref)));

  process.stdout.write('\n8. Every "Edit details" form opens valid on every seeded record\n');
  for (const code of Object.keys(PORT)) {
    const ddb = deptDb(code);
    const ids = ddb.prepare('SELECT id FROM record ORDER BY id').all().map((r) => r.id);
    ddb.close();
    let editable = 0; const broken = [];
    for (const id of ids) {
      const r = (await hub.get(`/${code}/records/${id}`)).json;
      const ed = r.actions.find((a) => a.key === 'edit');
      if (!ed) continue;
      editable += 1;
      const vals = Object.fromEntries(ed.fields.filter((f) => f.default != null).map((f) => [f.name, f.default]));
      const res = await hub.post(`/${code}/records/${id}/actions/edit`, { values: vals, version: r.version, requestId: rid() });
      if (!(res.status === 422 && !res.json.errors && /Nothing was changed/.test(res.json.error))) broken.push(`${r.ref}: ${res.status} ${JSON.stringify(res.json)}`);
    }
    ok(`${code}: saving the edit form unchanged reports "nothing changed" on all ${editable} editable records`, editable > 0 && !broken.length, broken.slice(0, 3).join('\n         '));
  }

  process.stdout.write('\n7. Every hub change is in the platform audit log\n');
  const pl = new Database(PLATFORM_DB, { readonly: true });
  const rows = pl.prepare("SELECT action, site_code AS site FROM audit_log WHERE entity = 'department_record' AND maker = 'erp-hub:admin'").all();
  pl.close();
  ok('creations are audited', rows.filter((r) => r.action === 'CREATE').length >= 4);
  ok('decisions are audited', rows.filter((r) => r.action === 'ACTION').length >= 6);
  ok('corrections are audited', rows.filter((r) => r.action === 'EDIT').length >= 3);
  ok('refused requests are not audited as changes', rows.length === rows.filter((r) => ['CREATE', 'ACTION', 'EDIT'].includes(r.action)).length);
  ok('across departments', new Set(rows.map((r) => r.site)).size >= 3);

  for (const p of Object.values(procs)) p.kill('SIGTERM');
  await sleep(300);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  for (const p of Object.values(procs)) { try { p.kill('SIGTERM'); } catch { /* gone */ } }
  process.exit(1);
});
