'use strict';

/**
 * The portals' one link to the ERP.
 *
 * This is the only code in the platform that talks to the ERP, and it talks to
 * it over HTTP. The platform never opens database/sqlite/erp/data/erp.sqlite, which is
 * what keeps "two separate backends with two separate databases" true rather
 * than decorative.
 */

const http = require('http');

const ERP_HOST = process.env.ERP_HOST || '127.0.0.1';
const ERP_PORT = Number(process.env.ERP_PORT) || 4200;
const TIMEOUT_MS = Number(process.env.ERP_TIMEOUT_MS) || 5000;

function post(pathname, body) {
  return new Promise((resolve) => {
    const payload = Buffer.from(JSON.stringify(body), 'utf8');
    const req = http.request({
      host: ERP_HOST,
      port: ERP_PORT,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
      timeout: TIMEOUT_MS,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch { /* keep the raw text below */ }
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        resolve({
          ok,
          status: res.statusCode,
          body: json,
          message: ok ? null : (json && json.error) || text.slice(0, 200) || `HTTP ${res.statusCode}`,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: null, message: `ERP did not answer within ${TIMEOUT_MS}ms` });
    });
    req.on('error', (err) => {
      resolve({ ok: false, status: 0, body: null, message: `ERP unreachable: ${err.message}` });
    });

    req.end(payload);
  });
}

/** Mirror one submission into the ERP. Resolves to {ok, status, erpRef, message}. */
async function sendSubmission(payload) {
  const r = await post('/api/intake', payload);
  return {
    ok: r.ok,
    status: r.status,
    erpRef: r.ok && r.body ? r.body.intakeRef : null,
    citizenRef: r.ok && r.body ? r.body.citizenRef : null,
    message: r.message,
  };
}

/**
 * Mirror a registration into the ERP.
 *
 * A registration carries no form of its own, so it is handed over as an intake
 * record of form "registration". The ERP upserts the citizen from person and
 * the record gives the audit trail something to point at.
 */
async function sendRegistration(person, siteCode) {
  const r = await post('/api/intake', {
    sourceSystem: siteCode,
    sourceForm: 'registration',
    sourceRoute: '/account/register',
    sourceReference: person.personRef,
    subject: 'Citizen registration',
    person,
    fields: [
      { name: 'full_name', label: 'Full name', value: person.fullName },
      { name: 'email', label: 'Email', value: person.email },
      { name: 'mobile', label: 'Mobile', value: person.mobile || '' },
    ],
    payload: {
      fullName: person.fullName, email: person.email,
      mobile: person.mobile || null, registeredVia: siteCode,
    },
  });
  return {
    ok: r.ok,
    status: r.status,
    erpRef: r.ok && r.body ? r.body.intakeRef : null,
    citizenRef: r.ok && r.body ? r.body.citizenRef : null,
    message: r.message,
  };
}

function target() { return `http://${ERP_HOST}:${ERP_PORT}`; }

module.exports = { sendSubmission, sendRegistration, target };
