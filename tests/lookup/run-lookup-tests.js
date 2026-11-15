#!/usr/bin/env node
'use strict';

/**
 * Tests for the person lookup (backend/erp-api/src/lookup).
 *
 * Runs on its own: it points the ERP at a fresh database in a temporary
 * directory, starts the ERP app on a free port and talks to it over HTTP.
 * Nothing it does touches database/sqlite/erp/data/erp.sqlite.
 *
 *   node tests/lookup/run-lookup-tests.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'erp-lookup-test-'));
process.env.ERP_DB = path.join(TMP, 'erp.sqlite');
// these tests check the lookup itself, so the ERP loads the dataset directly
process.env.LOOKUP_DATASET = 'local';

let pass = 0; let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass += 1; process.stdout.write(`  ok   ${name}\n`); return; }
  fail += 1; process.stdout.write(`  FAIL ${name}${detail ? `\n         ${detail}` : ''}\n`);
}
const eq = (name, a, b) => ok(name, a === b, `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

function get(port, p, headers) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: p, headers: headers || {} }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => { let json = null; try { json = JSON.parse(body); } catch { /* not json */ } resolve({ status: res.statusCode, json, body }); });
    }).on('error', reject);
  });
}

(async () => {
  const ids = require(path.join(ROOT, 'backend/erp-api/src/lookup/identifiers'));
  const wf = require(path.join(ROOT, 'backend/erp-api/src/lookup/workflows'));
  const { dataset, ANCHOR } = require(path.join(ROOT, 'backend/erp-api/src/lookup/dataset'));

  process.stdout.write('\n1. Identifiers\n');
  ok('Verhoeff accepts a valid number', ids.verhoeffValid('999964175739'));
  ok('Verhoeff rejects one wrong digit', !ids.verhoeffValid('999964175738'));
  eq('12 digits with a valid check digit is an Aadhaar number', ids.detect('9999 6417 5739').type, 'aadhaar');
  ok('an Aadhaar number starting with 0 or 1 is refused', !ids.detect('123456789012').ok);
  ok('a wrong check digit is refused with a reason', /check digit/.test(ids.detect('999964175738').error));
  ok('a Virtual ID is refused: no entity may store it', !ids.detect('1234567890123456').ok && ids.detect('1234567890123456').type === 'vid');
  eq('a +91 mobile number is recognised', ids.detect('+91 98765 43210').type, 'mobile');
  eq('91 followed by a mobile number is a mobile number', ids.detect('919876543210').type, 'mobile');
  eq('0 followed by a mobile number is a mobile number', ids.detect('09876543210').value, '9876543210');
  ok('a mobile number starting 1-5 is refused', !ids.detect('5876543210').ok);
  eq('a CNR is recognised', ids.detect('MHPU010012342024').type, 'cnr');
  eq('an FIR number is padded to four digits', ids.detect('FIR 123/2025').value, '0123/2025');
  eq('a forensic case number keeps its hyphen', ids.detect('RFSL-PUN/DNA/2025/0412').value, 'RFSL-PUN/DNA/2025/0412');
  eq('a prisoner number is recognised', ids.detect('YRW/UT/2025/01234').type, 'prisoner');
  eq('a name is recognised', ids.detect("Mary D'Souza").type, 'name');
  ok('two letters are too short for a name', !ids.detect('ab').ok);
  ok('an empty search is refused', !ids.detect('   ').ok);
  ok('an over-long input is refused', !ids.detect('x'.repeat(200)).ok);
  eq('an Aadhaar number is masked to its last four digits', ids.mask('aadhaar', '999964175739'), 'XXXX XXXX 5739');

  process.stdout.write('\n2. Status models\n');
  const d = dataset();
  let unmapped = 0;
  for (const s of d.subjects) for (const r of s.records) {
    if (wf.WORKFLOWS[r.type] && !wf.progress(r.type, r.status, r.history)) unmapped += 1;
  }
  eq('every record status maps to a stepper', unmapped, 0);
  const p1 = wf.progress('forensic_submission', 'deficient', []);
  eq('a deficient forensic case blocks the examination step', p1.steps[3].state, 'blocked');
  const p2 = wf.progress('court_case', 'in_appeal', []);
  eq('an appeal adds a fifth step', p2.steps.length, 5);
  eq('an unknown status draws nothing rather than guessing', wf.progress('court_case', 'nonsense', []), null);

  process.stdout.write('\n3. The demonstration dataset\n');
  eq('fifty people', d.subjects.length, 50);
  let future = 0;
  for (const s of d.subjects) for (const r of s.records) for (const h of r.history || []) if (h.at > ANCHOR) future += 1;
  eq('no status is dated after the dataset\'s today', future, 0);
  ok('every Aadhaar number is in the 9999 test series with a valid check digit',
    d.subjects.filter((s) => s.demo.aadhaar).every((s) => /^9999\d{8}$/.test(s.demo.aadhaar) && ids.verhoeffValid(s.demo.aadhaar)));
  ok('some people have no Aadhaar, to show that state', d.subjects.some((s) => !s.demo.aadhaar));

  process.stdout.write('\n4. The API\n');
  const app = require(path.join(ROOT, 'backend/erp-api/src/server'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const store = require(path.join(ROOT, 'backend/erp-api/src/db'));
  const dump = fs.readFileSync(process.env.ERP_DB).toString('latin1')
    + store.db.prepare('SELECT group_concat(payload) AS p FROM lookup_record').get().p;
  const someAadhaar = d.subjects.find((s) => s.demo.aadhaar).demo.aadhaar;
  ok('no Aadhaar number is stored in the clear', !dump.includes(someAadhaar));
  ok('no mobile number is stored in the clear', !dump.includes(d.subjects[0].demo.mobile));

  const a = await get(port, `/api/lookup?q=${d.subjects[0].demo.aadhaar}`);
  eq('an Aadhaar search finds the person', a.json && a.json.status, 'found');
  eq('all five systems answer', a.json.profile.sources.length, 5);
  ok('the profile carries a case journey', a.json.profile.journeys.length >= 1);
  ok('records carry their stepper progress', a.json.profile.sources.some((s) => s.records.some((r) => r.progress && r.progress.steps.length)));
  ok('the answer never contains the full Aadhaar number', !a.body.includes(d.subjects[0].demo.aadhaar));
  // a token made with a plain hash could be reversed by trying every Aadhaar number
  const crypto = require('crypto');
  const plain = crypto.createHash('sha256').update(`token:${d.subjects[0].demo.aadhaar}`).digest('hex').slice(0, 24).toUpperCase();
  const plainBare = crypto.createHash('sha256').update(d.subjects[0].demo.aadhaar).digest('hex');
  ok('the UID token is not an unkeyed hash of the Aadhaar number', !a.body.includes(plain) && !a.body.toLowerCase().includes(plainBare));
  eq('a name shared by several people lists them', (await get(port, '/api/lookup?q=Rahul%20Patil')).json.status, 'multiple');
  eq('an FIR shared by accused and complainant lists both', (await get(port, `/api/lookup?q=${encodeURIComponent(d.subjects[0].identifiers.find((i) => i.type === 'fir').value)}`)).json.status, 'multiple');
  eq('an unknown valid Aadhaar number is "not found"', (await get(port, '/api/lookup?q=999900000000')).json.status, 'not_found');
  eq('a malformed identifier is "invalid"', (await get(port, '/api/lookup?q=%40%40%40')).json.status, 'invalid');
  eq('an unknown person reference is 404', (await get(port, '/api/lookup/person/PSN-999999')).status, 404);
  const clean = (await get(port, '/api/lookup/person/PSN-000047')).json;
  ok('a person with Aadhaar only shows the other systems as empty', clean.sources.filter((s) => s.status === 'none').length === 4);
  eq('the samples list has fifty identities', (await get(port, '/api/lookup/samples')).json.samples.length, 50);

  process.env.LOOKUP_UNAVAILABLE = 'ecourts';
  const down = (await get(port, '/api/lookup/person/PSN-000001')).json;
  delete process.env.LOOKUP_UNAVAILABLE;
  eq('a system that is down is reported as unavailable', down.sources.find((s) => s.code === 'ecourts').status, 'unavailable');
  eq('the other systems still answer', down.sources.filter((s) => s.status === 'found').length, 4);

  await get(port, '/api/lookup/person/PSN-000002', { 'X-ERP-Actor': 'hub:admin' });
  const audit = store.db.prepare("SELECT * FROM audit_log WHERE entity = 'lookup' ORDER BY id DESC LIMIT 1").get();
  ok('every lookup is written to the audit trail with who asked', audit && audit.maker === 'hub:admin' && /PSN-000002/.test(audit.details));
  ok('the audit trail holds masked identifiers only', !store.db.prepare("SELECT group_concat(details) AS d FROM audit_log WHERE entity = 'lookup'").get().d.includes(d.subjects[0].demo.aadhaar));
  const before = store.db.prepare('SELECT COUNT(*) AS n FROM lookup_subject').get().n;
  require(path.join(ROOT, 'backend/erp-api/src/lookup/store')).ensureLoaded();
  eq('loading the dataset again changes nothing', store.db.prepare('SELECT COUNT(*) AS n FROM lookup_subject').get().n, before);

  server.close();
  store.db.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})().catch((err) => { process.stderr.write(`${err.stack || err}\n`); process.exit(1); });
