'use strict';

/**
 * The person lookup on the hub.
 *
 * The lookup belongs to the ERP: its data, its connectors and its audit trail
 * live there. The hub only passes the signed-in user's request through, over
 * HTTP, the same direction the dashboard already reads the ERP. It never opens
 * the ERP's database, and the page module it serves is the one the ERP console
 * uses (frontend/shared/person-lookup).
 *
 *   GET /api/lookup?q=            ->  ERP GET /api/lookup?q=
 *   GET /api/lookup/person/:ref   ->  ERP GET /api/lookup/person/:ref
 *   GET /api/lookup/samples       ->  ERP GET /api/lookup/samples
 *   GET /api/lookup/sources       ->  ERP GET /api/lookup/sources
 *   GET /api/lookup/recent        ->  ERP GET /api/lookup/recent
 *   GET /api/lookup/stream        ->  ERP GET /api/lookup/stream   (live; streamed through)
 *   POST /api/lookup/person/:ref/aadhaar   the admin's "show full Aadhaar": the ERP audits the request and names
 *                                 the UIDAI person; the number is read from the UIDAI office store in this process
 *   /assets/lookup/*              the page module (scripts and styles only)
 */

const http = require('http');
const path = require('path');
const express = require('express');
const erp = require('./erp-client');
const departmentStore = require('../departments/store');

const MODULE_DIR = path.join(__dirname, '..', '..', '..', '..', 'frontend', 'shared', 'person-lookup');
const TIMEOUT_MS = Number(process.env.LOOKUP_PROXY_TIMEOUT_MS) || 15000;
const MAX_BYTES = 8 * 1024 * 1024;

/** Forward one GET to the ERP and relay its JSON answer, or a clear error. */
function forward(erpPath, actor, res) {
  const req = http.get(`${erp.target()}${erpPath}`, {
    timeout: TIMEOUT_MS,
    headers: { Accept: 'application/json', 'X-ERP-Actor': actor },
  }, (up) => {
    const chunks = [];
    let size = 0;
    up.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) { up.destroy(new Error('answer too large')); return; }
      chunks.push(c);
    });
    up.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      try { JSON.parse(text); } catch {
        return res.status(502).json({ error: 'The ERP sent an answer that is not JSON.' });
      }
      res.status(up.statusCode || 502).type('application/json').send(text);
    });
    up.on('error', () => {
      if (!res.headersSent) res.status(502).json({ error: 'The answer from the ERP was cut off. Try again.' });
    });
  });
  req.once('timeout', () => req.destroy(new Error('timeout')));
  req.once('error', (err) => {
    if (res.headersSent) return;
    const timedOut = err.message === 'timeout';
    res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'The ERP did not answer in time. Try again.' : 'The ERP service could not be reached. Check that it is running.',
    });
  });
}

/** POST to the ERP and resolve its JSON answer (or reject with a status and message). */
function erpPost(erpPath, actor) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${erp.target()}${erpPath}`, {
      method: 'POST', timeout: TIMEOUT_MS,
      headers: { Accept: 'application/json', 'X-ERP-Actor': actor, 'Content-Length': 0 },
    }, (up) => {
      let body = '';
      up.setEncoding('utf8');
      up.on('data', (c) => { body += c; });
      up.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch { /* handled below */ }
        if (up.statusCode === 200 && json) resolve(json);
        else reject({ status: up.statusCode === 404 ? 404 : 502, error: (json && json.error) || 'The ERP refused the request.' });
      });
    });
    req.once('timeout', () => req.destroy(new Error('timeout')));
    req.once('error', () => reject({ status: 502, error: 'The ERP service could not be reached. Check that it is running.' }));
    req.end();
  });
}

/** The full Aadhaar number UIDAI holds for these UIDAI person references, if it matches the ERP's mask. */
function aadhaarFromUidai(uidaiRefs, masked) {
  const last4 = String(masked || '').replace(/\D/g, '').slice(-4);
  const store = departmentStore.open('uidai');
  for (const ref of uidaiRefs || []) {
    const p = store.personByRef(ref);
    const n = p && p.identifiers && String(p.identifiers.aadhaar || '');
    if (n && /^\d{12}$/.test(n) && n.endsWith(last4)) return n;
  }
  return null;
}

/** Pass the ERP's live stream through to the browser, for as long as the browser stays. */
function stream(req, res, actor) {
  const up = http.get(`${erp.target()}/api/lookup/stream`, { headers: { Accept: 'text/event-stream', 'X-ERP-Actor': actor } }, (u) => {
    if (u.statusCode !== 200) { u.resume(); if (!res.headersSent) res.status(502).json({ error: 'The ERP live stream is not available.' }); return; }
    res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    u.pipe(res);
    u.on('end', () => res.end());
  });
  up.on('error', () => { if (!res.headersSent) res.status(502).json({ error: 'The ERP service could not be reached.' }); else res.end(); });
  req.on('close', () => up.destroy());
}

/** Static module files: mount before the hub's own /assets. */
function installAssets(app) {
  app.use('/assets/lookup', express.static(MODULE_DIR, { maxAge: '5m', index: false }));
}

/** API routes: mount after the sign-in guard, so only a signed-in user reaches them. */
function installApi(app) {
  const actor = 'hub:' + (process.env.HUB_ADMIN_USER || 'admin');
  const noStore = (res) => res.set('Cache-Control', 'no-store');
  app.get('/api/lookup', (req, res) => {
    noStore(res);
    forward(`/api/lookup?q=${encodeURIComponent(String(req.query.q || '').slice(0, 200))}`, actor, res);
  });
  app.get('/api/lookup/samples', (req, res) => { noStore(res); forward('/api/lookup/samples', actor, res); });
  app.get('/api/lookup/sources', (req, res) => { noStore(res); forward('/api/lookup/sources', actor, res); });
  app.get('/api/lookup/recent', (req, res) => { noStore(res); forward('/api/lookup/recent', actor, res); });
  app.get('/api/lookup/stream', (req, res) => stream(req, res, actor));
  app.post('/api/lookup/person/:ref/aadhaar', async (req, res) => {
    noStore(res);
    const ref = String(req.params.ref).slice(0, 40);
    try {
      const r = await erpPost(`/api/lookup/person/${encodeURIComponent(ref)}/aadhaar-reveal`, actor);
      if (!r.masked) return res.status(404).json({ error: 'No Aadhaar is linked to this person.' });
      const aadhaar = aadhaarFromUidai(r.uidaiRefs, r.masked);
      if (!aadhaar) return res.status(404).json({ error: 'UIDAI holds no full Aadhaar number for this person.' });
      res.json({ ref: r.ref, aadhaar: aadhaar.replace(/(\d{4})(?=\d)/g, '$1 '), source: 'UIDAI' });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ error: (e && e.error) || 'The Aadhaar number could not be read.' });
    }
  });
  app.get('/api/lookup/person/:ref', (req, res) => {
    noStore(res);
    forward(`/api/lookup/person/${encodeURIComponent(String(req.params.ref).slice(0, 40))}`, actor, res);
  });
}

module.exports = { installAssets, installApi };
