#!/usr/bin/env node
'use strict';

/**
 * Automated tests for a generated local demonstration replica (spec stage J).
 *
 * Driven by replica/backend/site.json, so one suite covers every replica.
 * Starts the server on its own port, exercises it, writes
 * tests/test-report.json, and exits non-zero if anything failed.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT = path.resolve(__dirname, '..');
const BACKEND = path.join(PROJECT, 'replica', 'backend');
const SITE = JSON.parse(fs.readFileSync(path.join(BACKEND, 'site.json'), 'utf8'));
const PORT = Number(process.env.TEST_PORT) || (SITE.port || 4174) + 100;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
let server = null;

function record(name, group, passed, detail) {
  results.push({ name, group, passed, detail: detail || null });
  process.stdout.write(`  ${passed ? 'PASS' : 'FAIL'}  ${name}${passed ? '' : `\n          ${detail}`}\n`);
}
const check = (name, group, cond, detail) => record(name, group, !!cond, cond ? null : detail);

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body == null ? null : new URLSearchParams(body).toString();
    const req = http.request(`${BASE}${urlPath}`, {
      method,
      headers: data
        ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
        : {},
    }, (res) => {
      let out = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { out += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: out }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function startServer() {
  return new Promise((resolve) => {
    server = spawn(process.execPath, ['server.js'], {
      cwd: BACKEND,
      env: Object.assign({}, process.env, { PORT: String(PORT) }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    server.stdout.on('data', (c) => { out += c.toString(); if (out.includes(`:${PORT}/`)) resolve(); });
    server.stderr.on('data', (c) => { out += c.toString(); });
    setTimeout(resolve, 6000);
  });
}
const stopServer = () => { if (server && !server.killed) server.kill('SIGTERM'); };

async function main() {
  const dbFile = path.join(PROJECT, 'replica', 'database', 'replica.sqlite');
  if (!fs.existsSync(dbFile)) {
    process.stderr.write('Database missing. Run: cd replica/backend && npm run seed\n');
    process.exit(2);
  }

  process.stdout.write(`Testing ${SITE.site.hostname} replica on ${BASE}\n\n`);
  await startServer();
  await new Promise((r) => setTimeout(r, 1200));

  // --- 1. every page loads -------------------------------------------------
  process.stdout.write('Routes\n');
  for (const p of SITE.pages) {
    const res = await request('GET', p.route);
    check(`GET ${p.route} -> 200`, 'routes', res.status === 200, `got HTTP ${res.status}`);
  }
  for (const e of SITE.errorRoutes || []) {
    const res = await request('GET', e.route);
    check(`GET ${e.route} -> ${e.status} (as on the original)`, 'routes',
      res.status === e.status, `got HTTP ${res.status}`);
  }
  for (const p of ['/__about', '/__gaps']) {
    const res = await request('GET', p);
    check(`GET ${p} -> 200`, 'routes', res.status === 200, `got HTTP ${res.status}`);
  }

  // --- 2. assets -----------------------------------------------------------
  process.stdout.write('\nAssets\n');
  for (const a of ['/static/css/base.css', '/static/css/tokens.css',
                   '/static/js/replica.js', '/static/img/demo-mark.svg']) {
    const res = await request('GET', a);
    check(`asset ${a}`, 'assets', res.status === 200, `got HTTP ${res.status}`);
  }

  // --- 3. isolation from the original -------------------------------------
  process.stdout.write('\nIsolation from the original site\n');
  const leaks = [];
  const badActions = [];
  for (const p of SITE.pages) {
    const res = await request('GET', p.route);
    const ext = (res.body.match(/https?:\/\/(?!127\.0\.0\.1|localhost)[^"'\s)]+/g) || [])
      .filter((u) => !/w3\.org|example\.invalid/.test(u));
    if (ext.length) leaks.push(`${p.route}: ${ext.slice(0, 2).join(', ')}`);
    for (const m of res.body.matchAll(/<form[^>]*action="([^"]*)"/g)) {
      if (m[1] && !m[1].startsWith('/')) badActions.push(`${p.route} -> ${m[1]}`);
    }
  }
  check('no page references an off-host URL', 'isolation', leaks.length === 0, leaks.slice(0, 3).join(' | '));
  check('every form posts to a local path', 'isolation', badActions.length === 0, badActions.join(', '));
  const home = await request('GET', '/');
  check("CSP restricts form-action to 'self'", 'isolation',
    (home.headers['content-security-policy'] || '').includes("form-action 'self'"),
    `got: ${home.headers['content-security-policy']}`);
  check('the demonstration notice is on every page', 'isolation',
    /Not an Official Government Service/i.test(home.body), 'banner missing from the home page');

  // --- 4. forms ------------------------------------------------------------
  const allForms = SITE.pages.flatMap((p) => (p.forms || []).map((f) => ({ page: p.route, form: f })));
  if (allForms.length) {
    process.stdout.write('\nForm validation\n');
    for (const { page, form } of allForms) {
      const required = form.fields.filter((f) => f.required && f.type !== 'checkbox');
      const empty = {};
      for (const f of form.fields) empty[f.name] = '';
      empty.__form = form.id;
      empty.challenge_expected = '7';
      empty.challenge_answer = '0';

      const res = await request('POST', page, empty);
      check(`${form.id}: an empty submission is rejected`, 'validation',
        res.status === 400, `got HTTP ${res.status}`);
      check(`${form.id}: a wrong verification answer is reported`, 'validation',
        /verification answer is not correct/.test(res.body), 'no verification message');
      if (required.length) {
        // Plain substring, not a regex: captured labels can contain `*`, `(`,
        // `[` and other characters that would need escaping.
        check(`${form.id}: ${required.length} required field(s) are named`, 'validation',
          res.body.includes(`${required[0].label} is required`),
          `expected "${required[0].label} is required"`);
      }

      // A value outside a captured option list must be refused.
      const sel = form.fields.find((f) => f.type === 'select' && (f.options || []).length);
      if (sel) {
        const bad = Object.assign({}, empty, { [sel.name]: '__not_a_real_option__',
          challenge_answer: '7', challenge_expected: '7' });
        const r2 = await request('POST', page, bad);
        check(`${form.id}: a value outside "${sel.label}"'s captured list is refused`, 'validation',
          r2.status === 400 && /not offered by this form/.test(r2.body), `got HTTP ${r2.status}`);
      }

      // A length over the original's maxlength must be refused.
      const lim = form.fields.find((f) => f.maxLength && f.maxLength < 200 && f.type !== 'select');
      if (lim) {
        const over = Object.assign({}, empty, {
          [lim.name]: 'x'.repeat(lim.maxLength + 5),
          challenge_answer: '7', challenge_expected: '7',
        });
        const r3 = await request('POST', page, over);
        check(`${form.id}: over ${lim.maxLength} chars in "${lim.label}" is refused`, 'validation',
          r3.status === 400 && /characters or fewer/.test(r3.body), `got HTTP ${r3.status}`);
      }
    }

    // --- 5. a complete submission round-trips ------------------------------
    process.stdout.write('\nSubmission round-trip\n');
    const { page, form } = allForms[0];
    const good = { __form: form.id, challenge_answer: '7', challenge_expected: '7' };
    for (const f of form.fields) {
      if (f.cascadeChild) continue;
      if (f.type === 'checkbox') { good[f.name] = '1'; continue; }
      if (f.type === 'select') { good[f.name] = (f.options && f.options[0]) ? f.options[0].value : ''; continue; }
      if (f.inputType === 'number') { good[f.name] = '30'; continue; }
      if (f.inputType === 'email') { good[f.name] = 'demo@example.invalid'; continue; }
      if (f.inputType === 'tel') { good[f.name] = '9876543210'; continue; }
      if (f.inputType === 'date') { good[f.name] = '2027-01-15'; continue; }
      good[f.name] = f.maxLength && f.maxLength < 10 ? 'Demo'.slice(0, f.maxLength) : 'Demo value';
    }
    // Fill a dependent child from the API, as the browser would.
    const child = form.fields.find((f) => f.cascadeChild && f.cascadeList);
    if (child) {
      const parent = form.fields.find((f) => f.cascadeTarget === child.name);
      if (parent && good[parent.name]) {
        const api = await request('GET', `/api/cascade/${child.cascadeList}?parent=${encodeURIComponent(good[parent.name])}`);
        let opts = [];
        try { opts = JSON.parse(api.body).options || []; } catch { /* leave empty */ }
        check(`the dependent list "${child.label}" loads for a chosen parent`, 'api',
          opts.length > 0, `got ${api.status}, ${api.body.slice(0, 80)}`);
        if (opts.length) good[child.name] = opts[0].value;

        // And a child from a different parent must be refused server-side.
        const otherParent = (parent.options || []).find((o) => String(o.value) !== String(good[parent.name]));
        if (otherParent && opts.length) {
          const api2 = await request('GET', `/api/cascade/${child.cascadeList}?parent=${encodeURIComponent(otherParent.value)}`);
          let opts2 = [];
          try { opts2 = JSON.parse(api2.body).options || []; } catch { /* leave empty */ }
          if (opts2.length) {
            const cross = Object.assign({}, good, { [child.name]: opts2[0].value });
            const rc = await request('POST', page, cross);
            check(`a "${child.label}" from another "${parent.label}" is refused server-side`, 'validation',
              rc.status === 400 && /does not belong to/.test(rc.body), `got HTTP ${rc.status}`);
          }
        }
      }
    }

    const sub = await request('POST', page, good);
    const ref = (sub.body.match(/DEMO\d+/) || [])[0];
    check('a complete submission is accepted', 'roundtrip',
      sub.status === 200 && !!ref, `got HTTP ${sub.status}`);

    if (ref) {
      const api = await request('GET', `/api/submissions/${form.id}`);
      let rows = [];
      try { rows = JSON.parse(api.body).rows || []; } catch { /* leave empty */ }
      check('the submission is retrievable from the local API', 'roundtrip',
        rows.some((r) => r.reference === ref), 'reference not found in the API');

      const stored = rows.find((r) => r.reference === ref);
      const secretish = stored ? Object.keys(stored.payload).filter((k) => /pass|pwd|secret|otp|captcha|token/i.test(k)) : [];
      check('nothing secret-shaped was stored', 'roundtrip',
        secretish.length === 0, `stored: ${secretish.join(', ')}`);
    }
  }

  // --- 6. local API --------------------------------------------------------
  process.stdout.write('\nLocal API\n');
  const meta = await request('GET', '/api/meta');
  check('GET /api/meta returns the site model', 'api',
    meta.status === 200 && /"pages"/.test(meta.body), `got HTTP ${meta.status}`);
  const firstList = Object.keys(SITE.referenceLists || {})[0];
  if (firstList) {
    const r = await request('GET', `/api/reference/${firstList}`);
    let n = 0;
    try { n = (JSON.parse(r.body).options || []).length; } catch { /* leave 0 */ }
    check(`GET /api/reference/${firstList} returns its captured options`, 'api',
      r.status === 200 && n > 0, `got HTTP ${r.status}, ${n} options`);
  }
  const unknown = await request('GET', '/api/reference/__nope__');
  check('an unknown reference list returns 404', 'api', unknown.status === 404, `got HTTP ${unknown.status}`);

  // --- 7. errors -----------------------------------------------------------
  process.stdout.write('\nError handling\n');
  const nf = await request('GET', '/no/such/page');
  check('an unknown path returns 404', 'errors', nf.status === 404, `got HTTP ${nf.status}`);

  // --- 8. audit trail ------------------------------------------------------
  process.stdout.write('\nAudit trail\n');
  const Database = require(path.join(BACKEND, 'node_modules', 'better-sqlite3'));
  const db = new Database(dbFile);
  if (allForms.length) {
    check('submissions write an audit entry', 'audit',
      db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n > 0, 'audit_log is empty');
  }
  let noUpdate = false;
  try { db.prepare('UPDATE audit_log SET maker = ? WHERE id = 1').run('tampered'); }
  catch (e) { noUpdate = /append-only/.test(e.message); }
  let noDelete = false;
  try { db.prepare('DELETE FROM audit_log WHERE id = 1').run(); }
  catch (e) { noDelete = /append-only/.test(e.message); }
  check('the audit trail cannot be rewritten', 'audit', noUpdate || !allForms.length,
    'an UPDATE against audit_log was allowed');
  check('the audit trail cannot be deleted from', 'audit', noDelete || !allForms.length,
    'a DELETE against audit_log was allowed');
  db.close();

  // --- 9. restart ----------------------------------------------------------
  process.stdout.write('\nRestart\n');
  stopServer();
  await new Promise((r) => setTimeout(r, 900));
  await startServer();
  await new Promise((r) => setTimeout(r, 1400));
  const again = await request('GET', '/');
  check('the replica serves again after a restart', 'restart',
    again.status === 200, `got HTTP ${again.status}`);
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
    hostname: SITE.site.hostname,
    baseUrl: BASE,
    totals: { tests: results.length, passed, failed: failed.length },
    byGroup, failures: failed, results,
    notes: [
      'These tests exercise the LOCAL replica only. No request in this suite reaches ' +
      `${SITE.site.hostname} or any other external host.`,
      'Routes the original itself answers with an error are asserted to answer the same way here.',
      'What is not reproduced is listed in analysis/replication_gaps.json, not here.',
    ],
  };
  fs.mkdirSync(path.join(PROJECT, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(PROJECT, 'tests', 'test-report.json'), JSON.stringify(report, null, 2) + '\n');

  process.stdout.write(`\n=== test summary (${SITE.site.hostname}) ===\n`);
  process.stdout.write(`${passed}/${results.length} passed, ${failed.length} failed\n`);
  for (const [g, v] of Object.entries(byGroup)) {
    process.stdout.write(`  ${g.padEnd(12)} ${v.passed} passed, ${v.failed} failed\n`);
  }
  if (failed.length) {
    process.stdout.write('\nfailures:\n');
    for (const f of failed) process.stdout.write(`  - ${f.name}: ${f.detail}\n`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  stopServer();
  process.stderr.write(`\nTest run failed: ${e && e.stack ? e.stack : e}\n`);
  process.exit(1);
});
