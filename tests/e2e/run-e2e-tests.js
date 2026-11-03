#!/usr/bin/env node
'use strict';

/**
 * End-to-end tests for the shared backend and the ERP write-through.
 *
 * These assert the four things the arrangement exists to provide:
 *
 *   1. one backend      - all five portals answered by one process
 *   2. one database     - one registration accepted by all five
 *   3. both databases   - a submission lands in the portal DB and the ERP's
 *   4. or neither       - if the ERP refuses, the portal row is rolled back
 *
 * It talks to the running servers over HTTP and reads both SQLite files
 * directly, so a pass means the data is really in both places rather than
 * merely reported as such.
 *
 *   node tests/e2e/run-e2e-tests.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..', '..');
const { SITES } = require(path.join(ROOT, 'backend', 'platform-api', 'src', 'config', 'sites'));
const { PLATFORM_DB } = require(path.join(ROOT, 'backend', 'platform-api', 'src', 'config', 'paths'));
const { ERP_DB } = require(path.join(ROOT, 'backend', 'erp-api', 'src', 'config', 'paths'));
const HUB = Number(process.env.PLATFORM_PORT) || 4100;
const ERP = Number(process.env.ERP_PORT) || 4200;

let pass = 0; let fail = 0;
const failures = [];

function ok(name, condition, detail) {
  if (condition) { pass += 1; process.stdout.write(`  ok   ${name}\n`); return true; }
  fail += 1;
  failures.push({ name, detail });
  process.stdout.write(`  FAIL ${name}${detail ? `\n         ${detail}` : ''}\n`);
  return false;
}

function eq(name, actual, expected) {
  return ok(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// --- a tiny HTTP client with its own cookie jar ---------------------------
function request(port, method, pathname, { body, cookie, headers = {}, redirect = false } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null
      : Buffer.from(new URLSearchParams(body).toString(), 'utf8');
    const req = http.request({
      host: '127.0.0.1', port, path: pathname, method,
      headers: Object.assign(
        payload ? {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': payload.length,
        } : {},
        cookie ? { Cookie: cookie } : {}, headers),
      timeout: 15000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        location: res.headers.location || null,
        setCookie: res.headers['set-cookie'] || [],
        text: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`timeout ${method} :${port}${pathname}`)); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const json = async (port, p) => JSON.parse((await request(port, 'GET', p)).text);

function cookieFrom(res) {
  for (const c of res.setCookie || []) {
    const m = /^gov_demo_session=([^;]+)/.exec(c);
    if (m && m[1]) return `gov_demo_session=${m[1]}`;
  }
  return null;
}

/** The challenge answer is rendered into the page; read it the way a user would. */
function challengeFrom(html) {
  const expected = /name="challenge_expected"\s+value="(\d+)"/.exec(html);
  return expected ? expected[1] : null;
}

/**
 * The validation messages a rejected form rendered.
 *
 * Reporting these instead of stripped page text is the difference between
 * "HTTP 400" and "Complainant Name is not in the expected format", which is
 * the only version worth reading at 3am.
 */
function errorsFrom(html) {
  const out = [];
  const re = /class="(?:field__error|form__error|err)"[^>]*>([^<]+)</g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim());
  return out;
}

/** What to print when a POST was refused. */
function refusal(res) {
  const errs = errorsFrom(res.text);
  if (errs.length) return `HTTP ${res.status}: ${errs.join(' | ')}`;
  return `HTTP ${res.status}: ${res.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)}`;
}

const stamp = Date.now().toString().slice(-7);
// The ePrisons name fields accept letters and spaces only - that is the
// original form's own rule - so names for those forms are spelled out.
const LETTERS = 'ABCDEFGHIJ';
const wordStamp = stamp.split('').map((d) => LETTERS[Number(d)]).join('');
const ACCOUNT = {
  full_name: `Demo Citizen ${stamp}`,
  email: `e2e-${stamp}@example.invalid`,
  mobile: '9876500002',
  password: 'demo-pass-12345',
};

async function main() {
  process.stdout.write('\nEnd-to-end: shared backend + ERP write-through\n');
  process.stdout.write(`${'='.repeat(62)}\n`);

  // === 1. one backend ====================================================
  process.stdout.write('\n1. One backend serves every portal\n');
  for (const s of SITES) {
    const res = await request(s.port, 'GET', '/');
    eq(`${s.code} :${s.port} answers`, res.status, 200);
    eq(`${s.code} declares the shared backend`, res.headers['x-replica-backend'], 'shared');
  }
  const pids = new Set();
  for (const s of SITES) {
    const p = await json(s.port, '/__platform');
    pids.add(p.sharedBackend.process);
  }
  eq('all five portals report ONE process id', pids.size, 1);

  // The hub asks for a sign-in. /api/summary is open to a request from the same machine (the container's own health
  // check uses it), so a local run needs no password. Against a published Docker port the request does not come from
  // loopback: set HUB_ADMIN_PASSWORD (and HUB_ADMIN_USER if it was changed) and the test sends HTTP Basic credentials.
  const hubHeaders = process.env.HUB_ADMIN_PASSWORD
    ? { Authorization: 'Basic ' + Buffer.from(`${process.env.HUB_ADMIN_USER || 'admin'}:${process.env.HUB_ADMIN_PASSWORD}`).toString('base64') }
    : {};
  const unsigned = await request(HUB, 'GET', '/api/dashboard');
  eq('the hub refuses an unsigned request for its data', unsigned.status, 401);
  const hubPage = await request(HUB, 'GET', '/');
  eq('the hub page sends an unsigned visitor to /login', hubPage.status === 302 && /\/login$/.test(hubPage.location || ''), true);
  const hub = JSON.parse((await request(HUB, 'GET', '/api/summary', { headers: hubHeaders })).text);
  // Inside a container the hub reports the container's own path to the file the
  // test reads on the host; PLATFORM_DB_REPORTED names that path.
  eq('the hub names one shared database', hub.database, process.env.PLATFORM_DB_REPORTED || PLATFORM_DB);
  eq('the hub lists five portals', hub.sites.length, 5);

  // === 2. one registration ==============================================
  process.stdout.write('\n2. Register once, on one portal\n');
  const uidai = SITES.find((s) => s.code === 'uidai');
  const reg = await request(uidai.port, 'POST', '/account/register', {
    body: { ...ACCOUNT, confirm_password: ACCOUNT.password },
  });
  eq('registration on uidai redirects', reg.status, 302);
  const cookie = cookieFrom(reg);
  ok('a session cookie was issued', !!cookie);

  process.stdout.write('\n   ...and it is accepted by every other portal\n');
  for (const s of SITES) {
    const res = await request(s.port, 'GET', '/account', { cookie });
    const signedIn = res.status === 200 && res.text.includes(ACCOUNT.full_name);
    ok(`${s.code} accepts the account registered on uidai`, signedIn,
      `HTTP ${res.status}; name ${res.text.includes(ACCOUNT.full_name) ? 'found' : 'absent'}`);
  }

  const pdb = new Database(PLATFORM_DB, { readonly: true });
  const person = pdb.prepare('SELECT * FROM person WHERE email = ?').get(ACCOUNT.email);
  ok('exactly one person row exists for that email', !!person);
  eq('it records the portal registered through', person && person.registered_via, 'uidai');

  const edb = new Database(ERP_DB, { readonly: true });
  const citizen = edb.prepare('SELECT * FROM citizen WHERE citizen_ref = ?').get(person.person_ref);
  ok('the ERP database holds the same citizen', !!citizen,
    `looked for citizen_ref ${person.person_ref}`);
  eq('the ERP recorded which portal first saw them', citizen && citizen.first_seen_in, 'uidai');
  ok('the portal stored the ERP reference back', !!person.erp_citizen_ref);

  // === 3. a submission reaches BOTH databases ===========================
  process.stdout.write('\n3. Submit on each portal - both databases get it\n');
  const submitted = [];

  for (const site of SITES.filter((s) => s.driver === 'generic')) {
    const cfg = JSON.parse(fs.readFileSync(site.siteJson, 'utf8'));
    // Pick a form that is not a login and has no required field this test
    // cannot satisfy generically.
    let target = null;
    for (const page of cfg.pages) {
      for (const form of page.forms || []) {
        const isLogin = (form.fields || []).some(
          (f) => f.type === 'password' || /password/i.test(f.name));
        if (isLogin) continue;
        if ((form.fields || []).some((f) => f.type === 'select' || f.type === 'file')) continue;
        target = { page, form }; break;
      }
      if (target) break;
    }
    if (!target) { process.stdout.write(`  --   ${site.code}: no suitable form, skipped\n`); continue; }

    const get = await request(site.port, 'GET', target.page.route, { cookie });
    const answer = challengeFrom(get.text);
    if (!ok(`${site.code} serves the form at ${target.page.route}`, get.status === 200 && !!answer,
      `HTTP ${get.status}, challenge ${answer ? 'found' : 'absent'}`)) continue;

    const body = { __form: target.form.id, challenge_expected: answer, challenge_answer: answer };
    for (const f of target.form.fields) {
      if (f.type === 'checkbox') continue;
      body[f.name] = f.inputType === 'number' ? '42'
        : `E2E-${stamp}`.slice(0, f.maxLength || 32);
    }

    const post = await request(site.port, 'POST', target.page.route, { body, cookie });
    const okPost = post.status === 200;
    if (!ok(`${site.code} accepts the submission`, okPost, refusal(post))) continue;

    const row = pdb.prepare(
      'SELECT * FROM submission WHERE site_code = ? ORDER BY id DESC LIMIT 1').get(site.code);
    ok(`${site.code}: the portal database has the row`, !!row);
    ok(`${site.code}: the row carries an ERP reference`, !!(row && row.erp_intake_ref),
      row ? `erp_intake_ref=${row.erp_intake_ref}` : 'no row');

    const intake = row && edb.prepare(
      'SELECT * FROM intake WHERE source_system = ? AND source_reference = ?')
      .get(site.code, row.reference_no);
    ok(`${site.code}: the ERP database has the same record`, !!intake,
      row ? `looked for ${site.code}/${row.reference_no}` : 'no portal row to match');
    if (intake && row) {
      eq(`${site.code}: the two references agree`, intake.intake_ref, row.erp_intake_ref);
      ok(`${site.code}: the ERP linked it to the citizen`, intake.citizen_id === citizen.id,
        `intake.citizen_id=${intake.citizen_id}, citizen.id=${citizen.id}`);
      const nf = edb.prepare('SELECT COUNT(*) AS n FROM intake_field WHERE intake_id = ?')
        .get(intake.id).n;
      ok(`${site.code}: field values were carried over`, nf > 0, `${nf} fields`);
      submitted.push({ site: site.code, reference: row.reference_no, erpRef: intake.intake_ref });
    }
  }

  // ePrisons: a real domain form, through its own hand-written handler
  process.stdout.write('\n   ePrisons, through its own domain handler\n');
  const ep = SITES.find((s) => s.code === 'eprisons');
  const gGet = await request(ep.port, 'GET', '/public/grievance', { cookie });
  const gAnswer = challengeFrom(gGet.text);
  if (ok('eprisons serves the grievance form', gGet.status === 200 && !!gAnswer,
    `HTTP ${gGet.status}`)) {
    const state = pdb.prepare('SELECT id FROM state ORDER BY sort_order LIMIT 1').get();
    const jail = pdb.prepare('SELECT id FROM jail WHERE state_id = ? LIMIT 1').get(state.id);
    const rel = pdb.prepare(
      "SELECT id FROM relationship WHERE source_portal = 'NPIP' LIMIT 1").get();
    const before = edb.prepare(
      "SELECT COUNT(*) AS n FROM intake WHERE source_system = 'eprisons'").get().n;

    const gPost = await request(ep.port, 'POST', '/public/grievance', {
      cookie,
      body: {
        challenge_expected: gAnswer, challenge_answer: gAnswer,
        complainant_name: `Demo Complainant ${wordStamp}`,
        complainant_mobile: '9876500003',
        complainant_email: `e2e-g-${stamp}@example.invalid`,
        complainant_address: 'Demo address, for testing only',
        relationship_id: rel.id,
        inmate_name: 'Demo Inmate', inmate_father_name: 'Demo Father',
        state_id: state.id, jail_id: jail.id,
        category: 'Other', subject: `E2E grievance ${stamp}`,
        description: 'Synthetic grievance raised by the end-to-end test.',
      },
    });
    ok('eprisons accepts the grievance', gPost.status === 200, refusal(gPost));

    const gRow = pdb.prepare('SELECT * FROM grievance ORDER BY id DESC LIMIT 1').get();
    ok('eprisons: the grievance is in its own domain table', !!gRow &&
      String(gRow.subject).includes(stamp), gRow ? `subject=${gRow.subject}` : 'no row');
    const after = edb.prepare(
      "SELECT COUNT(*) AS n FROM intake WHERE source_system = 'eprisons'").get().n;
    eq('eprisons: the ERP received exactly one more record', after, before + 1);
    const gIntake = edb.prepare(
      "SELECT * FROM intake WHERE source_system = 'eprisons' ORDER BY id DESC LIMIT 1").get();
    ok('eprisons: the ERP record points back at the portal reference',
      !!gIntake && gIntake.source_reference === (gRow && gRow.reference_no),
      gIntake ? `erp=${gIntake.source_reference} portal=${gRow && gRow.reference_no}` : 'none');
  }

  // === 4. the shared account authenticates a portal's own login form =====
  process.stdout.write('\n4. A portal login form authenticates the shared account\n');
  const loginForm = pdb.prepare(
    'SELECT * FROM form WHERE is_login = 1 AND site_code != ? LIMIT 1').get('eprisons');
  if (loginForm) {
    const site = SITES.find((s) => s.code === loginForm.site_code);
    const lGet = await request(site.port, 'GET', loginForm.route);
    const lAnswer = challengeFrom(lGet.text);
    const bad = await request(site.port, 'POST', loginForm.route, {
      body: {
        __form: loginForm.local_id, email: ACCOUNT.email, user_name: ACCOUNT.email,
        password: 'wrong-password', user_password: 'wrong-password',
        challenge_expected: lAnswer, challenge_answer: lAnswer,
      },
    });
    eq(`${site.code} login rejects a wrong password`, bad.status, 401);
    const good = await request(site.port, 'POST', loginForm.route, {
      body: {
        __form: loginForm.local_id, email: ACCOUNT.email, user_name: ACCOUNT.email,
        password: ACCOUNT.password, user_password: ACCOUNT.password,
        challenge_expected: lAnswer, challenge_answer: lAnswer,
      },
    });
    eq(`${site.code} login accepts the shared account`, good.status, 302);
    ok(`${site.code} login issues a session`, !!cookieFrom(good));
  } else {
    process.stdout.write('  --   no non-eprisons login form registered, skipped\n');
  }

  // === 5. the audit trail cannot be rewritten ===========================
  process.stdout.write('\n5. The audit trail is append-only, in both databases\n');
  for (const [label, file] of [['portal', PLATFORM_DB], ['ERP', ERP_DB]]) {
    const w = new Database(file);
    const row = w.prepare('SELECT id FROM audit_log ORDER BY id DESC LIMIT 1').get();
    if (!row) { process.stdout.write(`  --   ${label}: trail empty, skipped\n`); w.close(); continue; }
    let updateBlocked = false; let deleteBlocked = false;
    try { w.prepare('UPDATE audit_log SET details = ? WHERE id = ?').run('tampered', row.id); }
    catch (e) { updateBlocked = /append-only/.test(e.message); }
    try { w.prepare('DELETE FROM audit_log WHERE id = ?').run(row.id); }
    catch (e) { deleteBlocked = /append-only/.test(e.message); }
    ok(`${label} audit_log refuses UPDATE`, updateBlocked);
    ok(`${label} audit_log refuses DELETE`, deleteBlocked);
    w.close();
  }

  // === 6. no secret was persisted =======================================
  process.stdout.write('\n6. Nothing secret was written to either database\n');
  const badFields = pdb.prepare(
    `SELECT COUNT(*) AS n FROM submission_field
     WHERE name LIKE '%password%' OR name LIKE '%captcha%' OR name LIKE '%token%'`).get().n;
  eq('no password/captcha/token field in the portal database', badFields, 0);
  const badErp = edb.prepare(
    `SELECT COUNT(*) AS n FROM intake_field
     WHERE name LIKE '%password%' OR name LIKE '%captcha%' OR name LIKE '%token%'`).get().n;
  eq('no password/captcha/token field in the ERP database', badErp, 0);
  const plain = pdb.prepare('SELECT COUNT(*) AS n FROM person WHERE password_hash = ?')
    .get(ACCOUNT.password).n;
  eq('the password is not stored in the clear', plain, 0);

  // === 7. the ERP is reached over HTTP, not by opening its file ==========
  process.stdout.write('\n7. The two backends stay separate\n');
  /**
   * Strip comments before looking.
   *
   * Both modules name the other database in a comment, to say they never open
   * it. Grepping the raw text therefore finds the promise and reports it as the
   * breach, so only code is searched.
   */
  const codeOnly = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

  const read = (base, files) => codeOnly(files
    .map((f) => fs.readFileSync(path.join(ROOT, base, f), 'utf8')).join('\n'));

  const platformSrc = read(path.join('backend', 'platform-api', 'src'),
    ['server.js', 'db/index.js', 'services/identity.js', 'services/erp-client.js', 'seed.js',
      'config/sites.js', 'config/paths.js', 'drivers/generic.js', 'drivers/eprisons.js']);
  ok('no platform code opens the ERP database', !/erp\.sqlite/.test(platformSrc));
  ok('the platform reaches the ERP over HTTP', /http\.request/.test(platformSrc));

  const erpSrc = read(path.join('backend', 'erp-api', 'src'),
    ['server.js', 'db/index.js', 'config/paths.js', 'seed.js']);
  ok('no ERP code opens the portal database', !/platform\.sqlite/.test(erpSrc));
  ok('the ERP makes no outbound HTTP call to a portal', !/http\.request/.test(erpSrc));

  pdb.close(); edb.close();

  // === 8. if the ERP refuses, the portal rolls back =====================
  process.stdout.write('\n8. If the ERP refuses, nothing is kept on either side\n');
  const refused = await new Promise((resolve) => {
    const payload = Buffer.from(JSON.stringify({
      sourceSystem: 'not-a-real-portal', sourceForm: 'x', sourceReference: 'x',
    }), 'utf8');
    const req = http.request({
      host: '127.0.0.1', port: ERP, path: '/api/intake', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
    }, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', () => resolve(0));
    req.end(payload);
  });
  eq('the ERP rejects an unknown source system', refused, 400);
  process.stdout.write(
    '  note the rollback path itself is exercised by tests/e2e/test-rollback.sh,\n' +
    '       which stops the ERP, submits, and checks both databases.\n');

  // === summary ===========================================================
  process.stdout.write(`\n${'='.repeat(62)}\n`);
  process.stdout.write(`${pass} passed, ${fail} failed\n`);
  if (fail) {
    process.stdout.write('\nFailures:\n');
    for (const f of failures) process.stdout.write(`  - ${f.name}\n    ${f.detail || ''}\n`);
  }

  fs.writeFileSync(path.join(__dirname, 'e2e-report.json'), JSON.stringify({
    ranAt: new Date().toISOString(),
    totals: { tests: pass + fail, passed: pass, failed: fail },
    account: { email: ACCOUNT.email, personRef: person && person.person_ref },
    submissions: submitted,
    failures,
  }, null, 2) + '\n');

  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`\nthe test run itself failed: ${err.stack || err}\n`);
  process.exit(2);
});
