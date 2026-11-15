#!/usr/bin/env node
'use strict';

/**
 * Tests for the department offices and the integration bus.
 *
 * Starts its own ERP and platform (separate ports, databases in a temporary
 * directory), so nothing here touches the real data or the running stack.
 *
 *   node tests/departments/run-department-tests.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'erp-dept-test-'));
const OFFSET = 6000;
const ERP_PORT = 10290;
const HUB_PORT = 10100;
const PORT = { eprisons: 4173 + OFFSET, cctns: 4175 + OFFSET, eforensics: 4176 + OFFSET, uidai: 4177 + OFFSET, ecourts: 4178 + OFFSET };
const SECRET = 'erp-integration-demo-secret-v1';
const ERP_DB = path.join(TMP, 'erp.sqlite');
const PLATFORM_DB = path.join(TMP, 'platform.sqlite');
const DEPT_DIR = path.join(TMP, 'departments');

let pass = 0; let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass += 1; process.stdout.write(`  ok   ${name}\n`); return; }
  fail += 1; process.stdout.write(`  FAIL ${name}${detail ? `\n         ${detail}` : ''}\n`);
}
const eq = (name, a, b) => ok(name, a === b, `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  return { status: r.status, cookie: c ? c.split(';')[0] : null };
}
const office = (code, cookie) => ({
  get: (p) => req(PORT[code], 'GET', `/office/api${p}`, { cookie }),
  post: (p, json) => req(PORT[code], 'POST', `/office/api${p}`, { cookie, json, headers: { 'X-Office-Request': '1' } }),
});

(async () => {
  // the ERP database starts with its source systems, as the seed script makes it
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'backend/erp-api/src/seed.js')], { env: { ...process.env, ERP_DB }, stdio: 'ignore' });
  startErp();
  await up(ERP_PORT, '/api/summary');
  startPlatform();
  await up(PORT.cctns, '/office/login');

  process.stdout.write('\n1. Every department seeds its own database and delivers it to the ERP\n');
  for (const code of Object.keys(PORT)) ok(`${code} has its own database file`, fs.existsSync(path.join(DEPT_DIR, `${code}.sqlite`)));
  const delivered = await waitFor(() => {
    const pending = Object.keys(PORT).reduce((a, code) => {
      const d = new Database(path.join(DEPT_DIR, `${code}.sqlite`), { readonly: true });
      const n = d.prepare("SELECT COUNT(*) AS n FROM outbox WHERE status <> 'delivered'").get().n;
      d.close();
      return a + n;
    }, 0);
    return pending === 0;
  }, 20000);
  ok('every seeded record was delivered', !!delivered);
  const edb = new Database(ERP_DB, { readonly: true });
  eq('the ERP resolved the deliveries to fifty people', edb.prepare('SELECT COUNT(*) AS n FROM lookup_subject').get().n, 50);
  eq('the ERP filed every record under every person it names', edb.prepare('SELECT COUNT(*) AS n FROM lookup_record').get().n, 208);
  edb.close();

  process.stdout.write('\n2. Each department signs its own officers in\n');
  eq('a wrong password is refused', (await req(PORT.cctns, 'POST', '/office/login', { form: { username: 'cctns.officer', password: 'nope' } })).status, 401);
  const cc = await login('cctns');
  eq('the right password signs in', cc.status, 303);
  ok('the session cookie is HttpOnly and SameSite=Strict', /HttpOnly/i.test((await req(PORT.cctns, 'POST', '/office/login', { form: { username: 'cctns.officer', password: 'Office@2026' } })).headers['set-cookie'][0]) );
  eq('the API needs a session', (await req(PORT.cctns, 'GET', '/office/api/me')).status, 401);
  eq('a CCTNS session does not open the UIDAI office', (await req(PORT.uidai, 'GET', '/office/api/me', { cookie: cc.cookie })).status, 401);
  eq('a change without the office header is refused', (await req(PORT.cctns, 'POST', '/office/api/records', { cookie: cc.cookie, json: {} })).status, 403);
  const cctns = office('cctns', cc.cookie);
  eq('the dashboard answers', (await cctns.get('/summary')).status, 200);
  ok('the citizen pages are untouched', (await req(PORT.cctns, 'GET', '/')).status === 200);

  process.stdout.write('\n3. A record saved in an office reaches the ERP at once\n');
  const bad = await cctns.post('/records', { form: 'fir', values: { police_station: 'Kothrud Police Station, Pune' } });
  ok('an incomplete form is refused field by field', bad.status === 422 && bad.json.errors.offence && bad.json.errors.accused_name);
  const badAadhaar = await cctns.post('/records', { form: 'fir', values: { police_station: 'Kothrud Police Station, Pune', registered_on: new Date().toISOString().slice(0, 10), offence: 'theft', io_name: 'Test Officer', io_rank: 'PSI', accused_name: 'Test Accused', accused_gender: 'M', accused_aadhaar: '999964175738', complainant_name: 'Test Complainant', complainant_gender: 'F', complainant_role: 'complainant' } });
  ok('an Aadhaar number with a wrong check digit is refused', badAadhaar.status === 422 && /not valid/.test(badAadhaar.json.errors.accused_aadhaar));
  const before = (await req(ERP_PORT, 'GET', '/api/lookup?q=999964175739')).json.profile.subject.ref;
  const t0 = Date.now();
  const fir = await cctns.post('/records', { form: 'fir', values: {
    police_station: 'Kothrud Police Station, Pune', registered_on: new Date().toISOString().slice(0, 10), offence: 'robbery',
    io_name: 'Nilesh Bhujbal', io_rank: 'PI', accused_name: 'Rahul Shinde', accused_gender: 'M', accused_aadhaar: '999964175739',
    complainant_name: 'Meera Joshi', complainant_gender: 'F', complainant_mobile: '9822012345', complainant_role: 'victim',
  } });
  eq('the FIR is registered', fir.status, 200);
  ok('the FIR number is issued in sequence', /^FIR \d{4}\/\d{4}$/.test(fir.json.record.title));
  ok('the police station is named once', !/Police Station Police Station/.test(fir.json.record.ref));
  const seen = await waitFor(async () => {
    const r = await req(ERP_PORT, 'GET', '/api/lookup?q=9822012345');
    return r.json && r.json.status === 'found' ? r.json.profile : null;
  }, 5000, 20);
  ok(`the new complainant is in the ERP (${Date.now() - t0} ms)`, !!seen && Date.now() - t0 < 3000);
  const rahul = (await req(ERP_PORT, 'GET', '/api/lookup?q=999964175739')).json.profile;
  eq('the accused was matched to the existing person, not duplicated', rahul.subject.ref, before);
  eq('the person now has two FIRs', rahul.sources.find((s) => s.code === 'cctns').records.filter((r) => r.type === 'fir').length, 2);

  process.stdout.write('\n4. Workflows only allow the next step\n');
  const ver = await cctns.post('/records', { form: 'verification', values: { service: 'Antecedent verification', purpose: 'Tenant verification', requester: 'landlord', lawful_basis: 'Consent of the subject, recorded', consent: true, subject_name: 'Vinay Rao', subject_gender: 'M', subject_mobile: '9811122233' } });
  eq('a verification request is created', ver.status, 200);
  const id = ver.json.record.id;
  eq('closing it straight away is refused', (await cctns.post(`/records/${id}/actions/close`, { values: {} })).status, 409);
  eq('starting the check is allowed', (await cctns.post(`/records/${id}/actions/start`, { values: {} })).status, 200);
  const outcome = await cctns.post(`/records/${id}/actions/outcome`, { values: { result: 'no_record_found' } });
  eq('recording the outcome is allowed', outcome.status, 200);
  eq('the record moved to completed', outcome.json.record.status, 'completed');

  process.stdout.write('\n5. The ERP accepts only signed, fresh, new events\n');
  const body = JSON.stringify({ source: 'cctns', events: [] });
  eq('an unsigned delivery is refused', (await req(ERP_PORT, 'POST', '/api/ingest/events', { raw: body })).status, 401);
  const ts = String(Date.now());
  eq('a wrongly signed delivery is refused', (await req(ERP_PORT, 'POST', '/api/ingest/events', { raw: body, headers: { 'X-Integration-Timestamp': ts, 'X-Integration-Signature': `sha256=${'0'.repeat(64)}` } })).status, 401);
  const d = new Database(path.join(DEPT_DIR, 'cctns.sqlite'), { readonly: true });
  const event = JSON.parse(d.prepare("SELECT payload FROM outbox WHERE status = 'delivered' ORDER BY id DESC LIMIT 1").get().payload);
  d.close();
  const replay = JSON.stringify({ source: 'cctns', events: [event] });
  const sig = crypto.createHmac('sha256', SECRET).update(`${ts}.`).update(replay).digest('hex');
  const again = await req(ERP_PORT, 'POST', '/api/ingest/events', { raw: replay, headers: { 'X-Integration-Timestamp': ts, 'X-Integration-Signature': `sha256=${sig}` } });
  eq('a delivered event sent again is recognised as a duplicate', again.json && again.json.results[0].status, 'duplicate');
  const old = String(Date.now() - 10 * 60 * 1000);
  const oldSig = crypto.createHmac('sha256', SECRET).update(`${old}.`).update(replay).digest('hex');
  eq('a stale delivery is refused', (await req(ERP_PORT, 'POST', '/api/ingest/events', { raw: replay, headers: { 'X-Integration-Timestamp': old, 'X-Integration-Signature': `sha256=${oldSig}` } })).status, 401);

  process.stdout.write('\n6. If the ERP is down, records wait and are delivered when it is back\n');
  procs.erp.kill('SIGTERM');
  await waitFor(async () => (await req(ERP_PORT, 'GET', '/api/summary')).status === 0, 5000);
  const ep = await login('eprisons');
  const eprisons = office('eprisons', ep.cookie);
  const adm = await eprisons.post('/records', { form: 'admission', values: {
    prisoner_name: 'Outage Test', prisoner_father: 'Father Test', prisoner_gender: 'M', prisoner_age: 30, prisoner_mobile: '9800000001',
    prison: 'Yerawada Central Prison, Pune', admitted_on: new Date().toISOString().slice(0, 10), warrant: 'Remand warrant',
    police_station: 'Kothrud Police Station, Pune', fir_no: '0001/2026', fir_date: new Date().toISOString().slice(0, 10), offence: 'theft',
  } });
  eq('the office still saves while the ERP is down', adm.status, 200);
  await sleep(600);
  const waiting = (await eprisons.get('/integration?events=0')).json.stats;
  ok('the change waits in the outbox, with the reason', waiting.pending >= 1 && /unreachable|ERP/.test(waiting.lastError || ''), JSON.stringify(waiting));
  startErp();
  await up(ERP_PORT, '/api/summary');
  const caught = await waitFor(async () => (await eprisons.get('/integration?events=0')).json.stats.pending === 0, 20000, 250);
  ok('it is delivered automatically once the ERP is back', !!caught);
  eq('and the ERP has it', (await req(ERP_PORT, 'GET', '/api/lookup?q=9800000001')).json.status, 'found');

  process.stdout.write('\n7. The activity log cannot be altered\n');
  const w = new Database(path.join(DEPT_DIR, 'cctns.sqlite'));
  let blocked = false;
  try { w.prepare('UPDATE activity SET details = ?').run('x'); } catch (e) { blocked = /append-only/.test(e.message); }
  ok('activity refuses UPDATE', blocked);
  blocked = false;
  try { w.prepare('DELETE FROM activity').run(); } catch (e) { blocked = /append-only/.test(e.message); }
  ok('activity refuses DELETE', blocked);
  w.close();

  process.stdout.write('\n8. Aadhaar is the key: people are matched by Aadhaar, never by name against it\n');
  const { verhoeffDigit } = require(path.join(ROOT, 'backend/shared/records/verhoeff'));
  const ids8 = require(path.join(ROOT, 'backend/erp-api/src/lookup/identifiers'));
  const aad = (body) => `${body}${verhoeffDigit(body)}`;
  const A1 = aad('99997100001'); const A2 = aad('99997100002'); const A3 = aad('99997100003');
  const A4 = aad('99997100004'); const A5 = aad('99997100005'); const A6 = aad('99997100006');
  let n8 = 0;
  const send = async (source, ref, name, idents, recRef) => {
    n8 += 1;
    const ev = {
      id: crypto.randomUUID(), type: 'record.upserted', source, occurredAt: new Date().toISOString(),
      record: { type: 'test_record', ref: recRef || `T8-${source}-${n8}`, status: 'recorded', date: '2026-11-13', history: [] },
      parties: [{ role: 'subject', person: { ref, name, gender: 'M', dob: '1990-01-01', district: 'Pune', identifiers: Object.entries(idents).map(([type, value]) => ({ type, value })) }, identifiers: [], data: { note: 'test' } }],
    };
    const raw = JSON.stringify({ source, events: [ev] });
    const ts = String(Date.now());
    const sig = crypto.createHmac('sha256', SECRET).update(`${ts}.`).update(raw).digest('hex');
    const r = await req(ERP_PORT, 'POST', '/api/ingest/events', { raw, headers: { 'X-Integration-Timestamp': ts, 'X-Integration-Signature': `sha256=${sig}` } });
    return r.json && r.json.results && r.json.results[0] && r.json.results[0].status;
  };
  const who = (type, value) => {
    const d = new Database(ERP_DB, { readonly: true });
    const rows = d.prepare('SELECT DISTINCT s.subject_ref AS ref FROM lookup_identifier i JOIN lookup_subject s ON s.id = i.subject_id WHERE i.id_type = ? AND i.value_hash = ?').all(type, ids8.hash(type, value));
    d.close();
    return rows.map((r) => r.ref);
  };
  const linkOf = (source, ref) => {
    const d = new Database(ERP_DB, { readonly: true });
    const r = d.prepare('SELECT s.subject_ref AS ref, b.basis FROM lookup_link l JOIN lookup_subject s ON s.id = l.subject_id LEFT JOIN lookup_link_basis b ON b.source_system = l.source_system AND b.source_ref = l.source_ref WHERE l.source_system = ? AND l.source_ref = ?').get(source, ref);
    d.close();
    return r || {};
  };
  const aadhaarCount = (ref) => {
    const d = new Database(ERP_DB, { readonly: true });
    const n = d.prepare("SELECT COUNT(DISTINCT i.value_hash) AS n FROM lookup_identifier i JOIN lookup_subject s ON s.id = i.subject_id WHERE s.subject_ref = ? AND i.id_type = 'aadhaar'").get(ref).n;
    d.close();
    return n;
  };

  // the reported bug: same name and mobile, different people
  eq('a CCTNS person with an Aadhaar is accepted', await send('cctns', 'T8-C1', 'Amit Kale', { aadhaar: A1, mobile: '9700000001' }), 'accepted');
  await send('uidai', 'T8-U1', 'Amit Kale', { mobile: '9700000001' });
  ok('a UIDAI enrolment with the same name and mobile is NOT joined to that person', linkOf('uidai', 'T8-U1').ref !== linkOf('cctns', 'T8-C1').ref);
  await send('uidai', 'T8-U1', 'Amit Kale', { aadhaar: A2, mobile: '9700000001', eid: '10039999000001' });
  ok('once its own Aadhaar is issued it stays a different person', who('aadhaar', A1)[0] !== who('aadhaar', A2)[0] && who('aadhaar', A2).length === 1);
  eq('no ERP person holds two different Aadhaar numbers', aadhaarCount(who('aadhaar', A1)[0]), 1);

  // the same Aadhaar in different departments is one person, whatever the spelling of the name
  await send('uidai', 'T8-U2', 'Neha Patil', { aadhaar: A3, mobile: '9700000002' });
  await send('eprisons', 'T8-E2', 'Neha S. Patil', { aadhaar: A3 });
  eq('the same Aadhaar with a differently spelt name is the same person', linkOf('eprisons', 'T8-E2').ref, linkOf('uidai', 'T8-U2').ref);
  eq('and the link says it was made by Aadhaar', linkOf('eprisons', 'T8-E2').basis, 'aadhaar');

  // a department person first seen without an Aadhaar, later with it: merged into the Aadhaar holder
  await send('cctns', 'T8-C3', 'Neha Patil', { mobile: '9700000003' });
  const early = linkOf('cctns', 'T8-C3').ref;
  ok('a person without an Aadhaar is not joined by name to an Aadhaar holder', early !== linkOf('uidai', 'T8-U2').ref);
  await send('cctns', 'T8-C3', 'Neha Patil', { aadhaar: A3, mobile: '9700000003' });
  eq('when its Aadhaar arrives it is merged into the person holding it', linkOf('cctns', 'T8-C3').ref, linkOf('uidai', 'T8-U2').ref);
  eq('the earlier person reference still opens the merged person', (await req(ERP_PORT, 'GET', `/api/lookup/person/${early}`)).json.subject.ref, linkOf('uidai', 'T8-U2').ref);
  ok('the merged person carries the CCTNS record', (await req(ERP_PORT, 'GET', `/api/lookup/person/${early}`)).json.summary.records >= 3);

  // an officer files the same department person with another Aadhaar: moved, never merged
  await send('cctns', 'T8-C1', 'Amit Kale', { aadhaar: A4, mobile: '9700000001' });
  ok('a department person sent with a different Aadhaar is moved to its own person', who('aadhaar', A4)[0] && who('aadhaar', A4)[0] !== who('aadhaar', A1)[0]);
  eq('and nobody holds two Aadhaar numbers', aadhaarCount(who('aadhaar', A4)[0]), 1);

  // people with no Aadhaar at all keep the earlier rule (mobile and name), only among themselves
  await send('ecourts', 'T8-L5', 'Ravi Jadhav', { mobile: '9700000005' });
  await send('eprisons', 'T8-E5', 'Ravi Jadhav', { mobile: '9700000005' });
  eq('two departments with no Aadhaar are matched by mobile and name', linkOf('eprisons', 'T8-E5').ref, linkOf('ecourts', 'T8-L5').ref);
  eq('and the link says so', linkOf('eprisons', 'T8-E5').basis, 'mobile_name');

  // an invalid Aadhaar is never used to match or stored
  await send('cctns', 'T8-C6', 'Bad Number', { aadhaar: '999971000060' === A6 ? '999971000061' : '999971000060', mobile: '9700000006' });
  eq('an Aadhaar with a wrong check digit is not stored', who('aadhaar', '999971000060').length + who('aadhaar', '999971000061').length, 0);

  // the department office itself: same mobile and name, different Aadhaar -> two people
  const twinA = aad('99997200001'); const twinB = aad('99997200002');
  const firA = { police_station: 'Kothrud Police Station, Pune', registered_on: new Date().toISOString().slice(0, 10), offence: 'theft', io_name: 'Test Officer', io_rank: 'PSI', accused_name: 'Sagar Twin', accused_gender: 'M', accused_mobile: '9700000099', accused_aadhaar: twinA, complainant_name: 'Complainant One', complainant_gender: 'F', complainant_role: 'complainant' };
  const r1 = await cctns.post('/records', { form: 'fir', values: firA });
  const r2 = await cctns.post('/records', { form: 'fir', values: { ...firA, accused_aadhaar: twinB } });
  ok('the office registers both FIRs', r1.status === 200 && r2.status === 200, `${r1.status} ${r2.status} ${JSON.stringify((r1.json || {}).errors || (r2.json || {}).errors || '')}`);
  const cdb = new Database(path.join(DEPT_DIR, 'cctns.sqlite'), { readonly: true });
  eq('the office keeps two people for two different Aadhaar numbers', cdb.prepare("SELECT COUNT(*) AS n FROM person WHERE name_key = 'SAGAR TWIN'").get().n, 2);
  cdb.close();
  await waitFor(() => who('aadhaar', twinB).length > 0, 5000, 50);
  ok('and so does the ERP', who('aadhaar', twinA)[0] && who('aadhaar', twinB)[0] && who('aadhaar', twinA)[0] !== who('aadhaar', twinB)[0]);

  // repair: a person left holding two Aadhaar numbers by the earlier rule is split when the ERP starts
  procs.erp.kill('SIGTERM');
  await sleep(500);
  const wdb = new Database(ERP_DB);
  const zid = Number(wdb.prepare("INSERT INTO lookup_subject (subject_ref, full_name, name_key, gender, birth_year, district, dataset) VALUES ('PSN-900001', 'Rohan Old', 'ROHAN OLD', 'M', 1990, 'Pune', 'departments')").run().lastInsertRowid);
  const addI = wdb.prepare('INSERT INTO lookup_identifier (subject_id, id_type, value_hash, masked, source_system) VALUES (?,?,?,?,?)');
  addI.run(zid, 'aadhaar', ids8.hash('aadhaar', A5), ids8.mask('aadhaar', A5), 'cctns');
  addI.run(zid, 'aadhaar', ids8.hash('aadhaar', A6), ids8.mask('aadhaar', A6), 'uidai');
  addI.run(zid, 'mobile', ids8.hash('mobile', '9700000007'), ids8.mask('mobile', '9700000007'), 'cctns');
  wdb.prepare("INSERT INTO lookup_link (source_system, source_ref, subject_id) VALUES ('cctns', 'T8-CZ', ?), ('uidai', 'T8-UZ', ?)").run(zid, zid);
  const addR = wdb.prepare("INSERT INTO lookup_record (subject_id, source_system, record_type, record_ref, payload) VALUES (?, ?, 'test_record', ?, '{}')");
  addR.run(zid, 'cctns', 'T8-RZ-C'); addR.run(zid, 'uidai', 'T8-RZ-U');
  wdb.close();
  startErp();
  await up(ERP_PORT, '/api/summary');
  ok('after the repair the two Aadhaar numbers belong to two people', who('aadhaar', A5)[0] && who('aadhaar', A6)[0] && who('aadhaar', A5)[0] !== who('aadhaar', A6)[0]);
  eq('UIDAI keeps the original person', who('aadhaar', A6)[0], 'PSN-900001');
  eq('the CCTNS link moved with its Aadhaar', linkOf('cctns', 'T8-CZ').ref, who('aadhaar', A5)[0]);
  const rdb = new Database(ERP_DB, { readonly: true });
  eq('the CCTNS record moved with it', rdb.prepare("SELECT s.subject_ref AS r FROM lookup_record x JOIN lookup_subject s ON s.id = x.subject_id WHERE x.record_ref = 'T8-RZ-C'").get().r, who('aadhaar', A5)[0]);
  eq('no ERP person holds two Aadhaar numbers any more', rdb.prepare("SELECT COUNT(*) AS n FROM (SELECT subject_id FROM lookup_identifier WHERE id_type = 'aadhaar' GROUP BY subject_id HAVING COUNT(DISTINCT value_hash) > 1)").get().n, 0);
  ok('the split is in the audit log', rdb.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'SPLIT'").get().n >= 1);
  rdb.close();

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
