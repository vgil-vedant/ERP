#!/usr/bin/env node
'use strict';

/**
 * Automated tests for the local demonstration replica (spec section 6, stage J).
 *
 * Starts the replica server on its own port, exercises it, and writes
 * tests/test-report.json. Exits non-zero if any test fails.
 *
 *   node tests/run-tests.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT = path.resolve(__dirname, '..');
const BACKEND = path.join(PROJECT, 'replica', 'backend');
const PORT = Number(process.env.TEST_PORT) || 4199;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
let server = null;

function record(name, group, passed, detail) {
  results.push({ name, group, passed, detail: detail || null });
  process.stdout.write(`  ${passed ? 'PASS' : 'FAIL'}  ${name}${passed ? '' : `\n          ${detail}`}\n`);
}

function check(name, group, condition, detail) {
  record(name, group, !!condition, condition ? null : detail);
}

function request(method, urlPath, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body == null ? null
      : (typeof body === 'string' ? body : new URLSearchParams(body).toString());
    const req = http.request(`${BASE}${urlPath}`, {
      method,
      headers: Object.assign(
        data ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {},
        headers || {}
      ),
    }, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { chunks += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: chunks }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn(process.execPath, ['server.js'], {
      cwd: BACKEND,
      env: Object.assign({}, process.env, { PORT: String(PORT) }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const onData = (c) => {
      out += c.toString();
      if (out.includes(`:${PORT}/`)) resolve();
    };
    server.stdout.on('data', onData);
    server.stderr.on('data', (c) => { out += c.toString(); });
    server.on('exit', (code) => {
      if (code !== 0 && code !== null) reject(new Error(`server exited with ${code}:\n${out}`));
    });
    setTimeout(() => resolve(), 6000);
  });
}

function stopServer() {
  if (server && !server.killed) server.kill('SIGTERM');
}

async function main() {
  const dbFile = path.join(PROJECT, 'replica', 'database', 'replica.sqlite');
  if (!fs.existsSync(dbFile)) {
    process.stderr.write('Database missing. Run: cd replica/backend && npm run seed\n');
    process.exit(2);
  }

  process.stdout.write(`Starting replica on ${BASE}\n\n`);
  await startServer();
  await new Promise((r) => setTimeout(r, 1200));

  const routesFile = path.join(PROJECT, 'analysis', 'routes.json');
  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8')).routes
    .filter((r) => r.localReplicaRoute && r.crawlStatus === 'captured');

  // --- 1. every implemented route loads ----------------------------------
  process.stdout.write('Routes\n');
  const seenPaths = new Set();
  for (const r of routes) {
    if (seenPaths.has(r.localReplicaRoute)) continue;
    seenPaths.add(r.localReplicaRoute);
    const res = await request('GET', r.localReplicaRoute);
    // /Test reproduces the original's own 404 on purpose.
    const expected = r.localReplicaRoute === '/Test' ? 404 : 200;
    check(`GET ${r.localReplicaRoute} -> ${expected}`, 'routes',
      res.status === expected, `got HTTP ${res.status}`);
  }

  // --- 2. internal links point at real local routes ----------------------
  process.stdout.write('\nInternal links\n');
  const home = await request('GET', '/');
  const hrefs = Array.from(home.body.matchAll(/href="([^"]+)"/g)).map((m) => m[1])
    .filter((h) => h.startsWith('/') && !h.startsWith('//'));
  const uniqueHrefs = Array.from(new Set(hrefs));
  let brokenLinks = [];
  for (const h of uniqueHrefs) {
    const res = await request('GET', h);
    if (res.status >= 400) brokenLinks.push(`${h} -> ${res.status}`);
  }
  check(`all ${uniqueHrefs.length} link target(s) on the home page resolve`, 'links',
    brokenLinks.length === 0, `broken: ${brokenLinks.join(', ')}`);

  // --- 3. local assets load ----------------------------------------------
  process.stdout.write('\nAssets\n');
  for (const a of ['/static/css/replica.css', '/static/js/replica.js',
                   '/static/img/demo-mark.svg', '/static/css/dashboard.css',
                   '/static/js/dashboard.js']) {
    const res = await request('GET', a);
    check(`asset ${a}`, 'assets', res.status === 200, `got HTTP ${res.status}`);
  }

  // --- 4. nothing points at the original site ----------------------------
  process.stdout.write('\nIsolation from the original site\n');
  let leaks = [];
  for (const r of routes.slice(0, 40)) {
    const res = await request('GET', r.localReplicaRoute);
    const m = res.body.match(/https?:\/\/(?!127\.0\.0\.1|localhost)[^"'\s)]+/g) || [];
    const external = m.filter((u) => !/w3\.org|example\.invalid/.test(u));
    if (external.length) leaks.push(`${r.localReplicaRoute}: ${external.slice(0, 3).join(', ')}`);
  }
  check('no page references an off-host URL', 'isolation',
    leaks.length === 0, leaks.slice(0, 5).join(' | '));

  const formPages = ['/public/MyVisitRegistration', '/public/grievance', '/public/MyVisitStatus'];
  let badActions = [];
  for (const p of formPages) {
    const res = await request('GET', p);
    const actions = Array.from(res.body.matchAll(/<form[^>]*action="([^"]*)"/g)).map((m) => m[1]);
    for (const a of actions) {
      if (a && !a.startsWith('/')) badActions.push(`${p} -> ${a}`);
    }
  }
  check('every form posts to a local path', 'isolation',
    badActions.length === 0, badActions.join(', '));

  const csp = home.headers['content-security-policy'] || '';
  check('Content-Security-Policy restricts form-action to self', 'isolation',
    csp.includes("form-action 'self'"), `got: ${csp}`);

  // --- 5. form validation -------------------------------------------------
  process.stdout.write('\nForm validation\n');
  const empty = await request('POST', '/public/MyVisitRegistration',
    { visitor_name: '', mobile_no: '123', challenge_answer: '0', challenge_expected: '5' });
  check('empty visit request is rejected with 400', 'validation',
    empty.status === 400, `got HTTP ${empty.status}`);
  check('rejection names the missing required fields', 'validation',
    /Visitor Name is required/.test(empty.body), 'expected a "Visitor Name is required" message');
  check('rejection reports a malformed mobile number', 'validation',
    /Mobile No is not in the expected format/.test(empty.body), 'expected a mobile format message');
  check('wrong verification answer is rejected', 'validation',
    /verification answer is not correct/.test(empty.body), 'expected a verification message');

  // reference data for the happy path
  const ref = JSON.parse((await request('GET', '/api/reference')).body);
  const stateId = ref.states[0].id;
  const jails = JSON.parse((await request('GET', `/api/jails?state_id=${stateId}`)).body).jails;
  check('State -> Jail cascade returns jails for a state', 'api',
    jails.length > 0, 'no jails returned');

  const otherState = ref.states[1].id;
  const otherJails = JSON.parse((await request('GET', `/api/jails?state_id=${otherState}`)).body).jails;
  const proofRequiring = ref.idProofs.find((p) => p.requires_number);
  const proofNotRequiring = ref.idProofs.find((p) => !p.requires_number);

  const base = {
    visitor_name: 'Demo Visitor', visitor_father_name: 'Demo Father',
    visitor_address: '1 Demo Street', visitor_gender_id: ref.genders[0].id,
    visitor_age: '30', relationship_id: ref.relationships[0].id,
    mobile_no: '9876543210', state_id: stateId, jail_id: jails[0].id,
    visit_date: '2027-01-15', prisoner_name: 'Demo Inmate',
    prisoner_father_name: 'Demo Father', prisoner_age: '40',
    prisoner_gender_id: ref.genders[0].id,
    challenge_answer: '9', challenge_expected: '9',
  };

  const crossState = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, { id_proof_type_id: proofNotRequiring.id, jail_id: otherJails[0].id }));
  check('a jail from another state is rejected server-side', 'validation',
    crossState.status === 400 && /does not belong to the chosen state/.test(crossState.body),
    `got HTTP ${crossState.status}`);

  const needsId = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, { id_proof_type_id: proofRequiring.id, id_number: '' }));
  check(`ID number is required for "${proofRequiring.name}"`, 'validation',
    needsId.status === 400 && /ID Number is required/.test(needsId.body),
    `got HTTP ${needsId.status}`);

  const noIdNeeded = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, { id_proof_type_id: proofNotRequiring.id }));
  check(`ID number is optional for "${proofNotRequiring.name}"`, 'validation',
    noIdNeeded.status === 200 && /EMDEMO/.test(noIdNeeded.body),
    `got HTTP ${noIdNeeded.status}`);

  const pastDate = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, { id_proof_type_id: proofNotRequiring.id, visit_date: '2020-01-01' }));
  check('a visit date in the past is rejected', 'validation',
    pastDate.status === 400 && /cannot be in the past/.test(pastDate.body),
    `got HTTP ${pastDate.status}`);

  const tooLong = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, { id_proof_type_id: proofNotRequiring.id, visitor_name: 'x'.repeat(40) }));
  check('a visitor name over 30 characters is rejected', 'validation',
    tooLong.status === 400 && /30 characters or fewer/.test(tooLong.body),
    `got HTTP ${tooLong.status}`);

  // --- 6. happy path round-trip ------------------------------------------
  process.stdout.write('\nSubmission round-trip\n');
  const good = await request('POST', '/public/MyVisitRegistration',
    Object.assign({}, base, {
      id_proof_type_id: proofRequiring.id, id_number: 'DEMO-998877',
      additional_visitor_count: '2', additional_visitor_names: 'Demo A, Demo B',
    }));
  const regNo = (good.body.match(/EMDEMO\d+/) || [])[0];
  check('a valid visit request is accepted', 'roundtrip',
    good.status === 200 && !!regNo, `got HTTP ${good.status}`);

  if (regNo) {
    const status = await request('POST', '/public/MyVisitStatus',
      { registration_no: regNo, challenge_answer: '3', challenge_expected: '3' });
    check('the new request is found by its registration number', 'roundtrip',
      status.status === 200 && status.body.includes(regNo), `got HTTP ${status.status}`);
    check('the stored additional visitors are returned', 'roundtrip',
      /Demo A, Demo B/.test(status.body), 'additional visitor names missing');
    check('the stored identity proof is returned', 'roundtrip',
      status.body.includes('DEMO-998877'), 'ID number missing');
  }

  const missing = await request('POST', '/public/MyVisitStatus',
    { registration_no: 'NOSUCHREF000', challenge_answer: '3', challenge_expected: '3' });
  check('an unknown registration number reports "not found"', 'roundtrip',
    missing.status === 200 && /No request found/.test(missing.body), `got HTTP ${missing.status}`);

  // grievance round-trip
  const griev = await request('POST', '/public/grievance', {
    complainant_name: 'Demo Citizen', complainant_mobile: '9876543210',
    complainant_address: '2 Demo Road', relationship_id: ref.relationships[0].id,
    inmate_name: 'Demo Inmate', inmate_father_name: 'Demo Father',
    state_id: stateId, jail_id: jails[0].id, category: 'Legal aid',
    subject: 'Test grievance', description: 'Synthetic test grievance.',
    challenge_answer: '5', challenge_expected: '5',
  });
  const grievRef = (griev.body.match(/GRVDEMO\d+/) || [])[0];
  check('a valid grievance is accepted', 'roundtrip',
    griev.status === 200 && !!grievRef, `got HTTP ${griev.status}`);
  if (grievRef) {
    const look = await request('POST', '/public/grievancelogin', { reference_no: grievRef });
    check('the grievance is retrievable by reference', 'roundtrip',
      look.status === 200 && look.body.includes(grievRef), `got HTTP ${look.status}`);
    check('the grievance shows an attributed action trail', 'roundtrip',
      /Action trail/.test(look.body) && /RECEIVED/.test(look.body), 'action trail missing');
  }

  // --- 6b. Citizen Services registration ---------------------------------
  // The two portals publish different relationship vocabularies: the NPIP
  // visit form offers 33 values, this one 20, and only 18 are shared. The
  // replica must keep them apart.
  process.stdout.write('\nCitizen Services registration\n');
  check('the two portals expose different relationship lists', 'citizen-service',
    Array.isArray(ref.csRelationships) &&
    ref.csRelationships.length > 0 &&
    ref.csRelationships.length !== ref.relationships.length,
    `NPIP ${ref.relationships.length}, Citizen Services ${
      ref.csRelationships ? ref.csRelationships.length : 'missing'}`);

  const npipOnly = ref.relationships.find(
    (r) => !ref.csRelationships.some((c) => c.name.toLowerCase() === r.name.toLowerCase()));
  const csRel = ref.csRelationships[0];
  // A fresh mobile number per run, so the suite is idempotent against a
  // database that persists between runs.
  const csMobile = '9' + String(Date.now()).slice(-9);
  const csBase = {
    full_name: 'Demo Citizen', father_name: 'Demo Father',
    address: '3 Demo Lane', gender_id: ref.genders[0].id, age: '34',
    relationship_id: csRel.id, email: 'demo@example.invalid',
    mobile_no: csMobile, password: 'not-stored',
    challenge_answer: '8', challenge_expected: '8',
  };

  const csBad = await request('POST', '/CitiZenService/Visitor/Registration',
    Object.assign({}, csBase, { relationship_id: npipOnly.id }));
  check(`a relationship only the NPIP form offers ("${npipOnly.name}") is rejected here`,
    'citizen-service',
    csBad.status === 400 && /not offered by the Citizen Services form/.test(csBad.body),
    `got HTTP ${csBad.status}`);

  const csMissing = await request('POST', '/CitiZenService/Visitor/Registration',
    Object.assign({}, csBase, { full_name: '', father_name: '', age: '' }));
  check('missing required Citizen Services fields are reported', 'citizen-service',
    csMissing.status === 400 &&
    /Visitor Name is required/.test(csMissing.body) &&
    /Father Name is required/.test(csMissing.body) &&
    /Age is required/.test(csMissing.body),
    `got HTTP ${csMissing.status}`);

  const csOk = await request('POST', '/CitiZenService/Visitor/Registration', csBase);
  check('a valid Citizen Services registration is accepted', 'citizen-service',
    csOk.status === 200 && /Demonstration account created/.test(csOk.body),
    `got HTTP ${csOk.status}`);

  const csDup = await request('POST', '/CitiZenService/Visitor/Registration', csBase);
  check('a duplicate mobile number is rejected', 'citizen-service',
    csDup.status === 400 && /already exists/.test(csDup.body), `got HTTP ${csDup.status}`);

  // --- 7. listings, filters and pagination -------------------------------
  process.stdout.write('\nListings\n');
  const list1 = await request('GET', '/public/Absconder');
  check('absconder listing renders a data table', 'listings',
    list1.status === 200 && /<table class="data">/.test(list1.body), `got HTTP ${list1.status}`);
  const page2 = await request('GET', '/public/Absconder?page=2');
  check('absconder listing paginates', 'listings',
    page2.status === 200 && /page 2 of/.test(page2.body), 'page 2 did not render');
  const filtered = await request('GET', `/public/Absconder?state_id=${stateId}`);
  check('absconder listing filters by state', 'listings',
    filtered.status === 200 && filtered.body.includes('selected'), 'filter did not apply');
  const parole = await request('GET', '/public/ParoleJumper');
  check('parole jumper listing renders', 'listings',
    parole.status === 200 && /<table class="data">/.test(parole.body), `got HTTP ${parole.status}`);

  // --- 8. local API -------------------------------------------------------
  process.stdout.write('\nLocal API\n');
  for (const [p, key] of [['/api/stats/headline', 'statesCovered'],
                          ['/api/stats/by-state?metric=inmates_in_custody', 'rows'],
                          ['/api/absconders', 'rows'],
                          ['/api/parole-jumpers', 'rows'],
                          ['/api/lockup-report', 'rows']]) {
    const res = await request('GET', p);
    let ok = false;
    try { ok = res.status === 200 && key in JSON.parse(res.body); } catch { ok = false; }
    check(`GET ${p} returns JSON with "${key}"`, 'api', ok, `got HTTP ${res.status}`);
  }
  const badMetric = await request('GET', '/api/stats/by-state?metric=nonsense');
  check('an unknown metric is rejected with 400', 'api',
    badMetric.status === 400, `got HTTP ${badMetric.status}`);
  const noState = await request('GET', '/api/jails');
  check('jails endpoint requires state_id', 'api',
    noState.status === 400, `got HTTP ${noState.status}`);

  // --- 9. the dashboard single-page application --------------------------
  process.stdout.write('\nClient-routed dashboard\n');
  for (const p of ['/NPIPDashboard', '/NPIPDashboard/lockupReport', '/NPIPDashboard/absconder',
                   '/NPIPDashboard/siteMap']) {
    const res = await request('GET', p);
    check(`${p} serves the application shell`, 'spa',
      res.status === 200 && /id="root"/.test(res.body), `got HTTP ${res.status}`);
  }

  // --- 10. error handling -------------------------------------------------
  process.stdout.write('\nError handling\n');
  const nf = await request('GET', '/no/such/page');
  check('an unknown path returns 404', 'errors', nf.status === 404, `got HTTP ${nf.status}`);
  check('the 404 page renders the replica layout', 'errors',
    /Not found/i.test(nf.body), '404 body did not render');

  // --- 11. audit trail ----------------------------------------------------
  process.stdout.write('\nAudit trail\n');
  const Database = require(path.join(BACKEND, 'node_modules', 'better-sqlite3'));
  const db = new Database(dbFile, { readonly: false });
  const auditCount = db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n;
  check('submissions write an audit entry', 'audit', auditCount > 0, 'audit_log is empty');
  let appendOnly = false;
  try { db.prepare('UPDATE audit_log SET maker = ? WHERE id = 1').run('tampered'); }
  catch (e) { appendOnly = /append-only/.test(e.message); }
  check('the audit trail cannot be rewritten', 'audit', appendOnly,
    'an UPDATE against audit_log was allowed');
  let noDelete = false;
  try { db.prepare('DELETE FROM audit_log WHERE id = 1').run(); }
  catch (e) { noDelete = /append-only/.test(e.message); }
  check('the audit trail cannot be deleted from', 'audit', noDelete,
    'a DELETE against audit_log was allowed');

  // The Citizen Services form asks for a password. The replica authenticates
  // nobody, so it must not be keeping one.
  const accountCols = db.prepare('PRAGMA table_info(citizen_account)').all().map((c) => c.name);
  check('no password column exists on citizen_account', 'citizen-service',
    !accountCols.some((c) => /pass|pwd|secret|hash/i.test(c)),
    `columns: ${accountCols.join(', ')}`);
  const storedPasswords = db.prepare(
    "SELECT COUNT(*) AS n FROM citizen_account WHERE full_name LIKE '%Demo Citizen%'").get().n;
  check('the registration was stored without a password', 'citizen-service',
    storedPasswords > 0, 'the test registration was not persisted');
  db.close();

  // --- 12. restart ---------------------------------------------------------
  process.stdout.write('\nRestart\n');
  stopServer();
  await new Promise((r) => setTimeout(r, 900));
  await startServer();
  await new Promise((r) => setTimeout(r, 1400));
  const afterRestart = await request('GET', '/');
  check('the replica serves again after a restart', 'restart',
    afterRestart.status === 200, `got HTTP ${afterRestart.status}`);
  if (regNo) {
    const persisted = await request('POST', '/public/MyVisitStatus',
      { registration_no: regNo, challenge_answer: '3', challenge_expected: '3' });
    check('data submitted before the restart is still present', 'restart',
      persisted.body.includes(regNo), 'the record did not survive the restart');
  }

  stopServer();

  // --- report --------------------------------------------------------------
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const byGroup = {};
  for (const r of results) {
    byGroup[r.group] = byGroup[r.group] || { passed: 0, failed: 0 };
    byGroup[r.group][r.passed ? 'passed' : 'failed']++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    totals: { tests: results.length, passed, failed: failed.length },
    byGroup,
    failures: failed,
    results,
    notes: [
      'These tests exercise the LOCAL replica only. No request in this suite reaches ' +
      'eprisons.nic.in or any other external host.',
      'The /Test route is expected to answer 404: the original links to it and it 404s ' +
      'there too, so the replica reproduces that deliberately.',
      'Pages and behaviour that are not reproduced are listed in ' +
      'analysis/replication_gaps.json, not here.',
    ],
  };
  fs.mkdirSync(path.join(PROJECT, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(PROJECT, 'tests', 'test-report.json'),
    JSON.stringify(report, null, 2) + '\n');

  process.stdout.write(`\n=== test summary ===\n`);
  process.stdout.write(`${passed}/${results.length} passed, ${failed.length} failed\n`);
  for (const [g, v] of Object.entries(byGroup)) {
    process.stdout.write(`  ${g.padEnd(12)} ${v.passed} passed, ${v.failed} failed\n`);
  }
  if (failed.length) {
    process.stdout.write('\nfailures:\n');
    for (const f of failed) process.stdout.write(`  - ${f.name}: ${f.detail}\n`);
  }
  process.stdout.write(`\nreport: tests/test-report.json\n`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  stopServer();
  process.stderr.write(`\nTest run failed: ${e && e.stack ? e.stack : e}\n`);
  process.exit(1);
});
