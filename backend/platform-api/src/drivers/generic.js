'use strict';

/**
 * Routes for a portal described by a generated site.json.
 *
 * This is the old per-site replica-kit server, with three differences that
 * matter:
 *
 *  1. it reads the one shared database instead of a private one;
 *  2. a form carrying a password field no longer pretends to log anybody in -
 *     it authenticates the single shared registration, so one account works
 *     on every portal; and
 *  3. a submission is written to the portal database AND the ERP, or to
 *     neither.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const store = require('../db');
const erp = require('../services/erp-client');

/** Stands in for the original's CAPTCHA without reproducing or bypassing one. */
function makeChallenge() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  return { question: `What is ${a} + ${b}?`, expected: String(a + b) };
}

function validateForm(site, formSpec, body) {
  const errors = {};
  const value = {};

  for (const f of formSpec.fields) {
    const raw = body[f.name] == null ? '' : String(body[f.name]).trim();

    if (f.type === 'checkbox') { value[f.name] = raw ? 1 : 0; continue; }
    if (f.required && !raw) { errors[f.name] = `${f.label} is required.`; continue; }
    if (!raw) { value[f.name] = null; continue; }

    if (f.maxLength && raw.length > f.maxLength) {
      errors[f.name] = `${f.label} must be ${f.maxLength} characters or fewer.`;
      continue;
    }
    if (f.type === 'select') {
      const ok = (f.options || []).some((o) => String(o.value) === raw);
      if (!ok) { errors[f.name] = `${f.label}: that value is not offered by this form.`; continue; }
    }
    if (f.inputType === 'number' && !/^\d+$/.test(raw)) {
      errors[f.name] = `${f.label} must be a whole number.`; continue;
    }
    if (f.pattern) {
      let re = null;
      try { re = new RegExp('^(?:' + f.pattern + ')$'); } catch { re = null; }
      if (re && !re.test(raw)) { errors[f.name] = `${f.label} is not in the expected format.`; continue; }
    }
    value[f.name] = raw;
  }

  // A child value must belong to its parent, checked on the server and not
  // only in the browser.
  for (const f of formSpec.fields) {
    if (!f.cascadeChild || !value[f.name]) continue;
    const parent = formSpec.fields.find((p) => p.cascadeTarget === f.name);
    if (!parent) continue;
    const parentValue = value[parent.name];
    if (!parentValue) continue;
    const allowed = (store.cascadeOptions(site.code, f.cascadeList, parentValue) || [])
      .map((o) => String(o.value));
    if (!allowed.includes(String(value[f.name]))) {
      errors[f.name] = `${f.label} does not belong to the selected ${parent.label}.`;
    }
  }

  const answer = String(body.challenge_answer || '').trim();
  if (!answer) errors.challenge_answer = 'Please answer the verification question.';
  else if (answer !== String(body.challenge_expected)) {
    errors.challenge_answer = 'The verification answer is not correct.';
  }

  return { value, errors, ok: Object.keys(errors).length === 0 };
}

function genericRouter(site) {
  const cfg = JSON.parse(fs.readFileSync(site.siteJson, 'utf8'));
  const r = express.Router();
  const CUSTOM_DIR = path.join(site.views, 'custom');

  /** A hand-written view for one route, if this project has one. */
  function customViewFor(route) {
    const slug = route === '/' ? 'index'
      : route.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
    return fs.existsSync(path.join(CUSTOM_DIR, `${slug}.ejs`)) ? `custom/${slug}` : null;
  }

  r.use((req, res, next) => {
    res.locals.site = cfg.site;
    res.locals.nav = cfg.nav;
    res.locals.currentPath = req.path;
    res.locals.title = cfg.site.name;
    res.locals.pageTitle = null;
    res.locals.form = {};
    res.locals.errors = {};
    res.locals.submitted = null;
    res.locals.tables = [];
    next();
  });

  function viewLocals(page, extra) {
    const custom = customViewFor(page.route);
    return {
      view: custom || 'pages/generic',
      locals: Object.assign({
        // A hand-written view lays out its own hero, so the generic band in the
        // header partial must stand down or the page gets two of them.
        isCustomView: !!custom,
        title: page.title,
        pageTitle: page.pageTitle || null,
        page,
        tables: (page.tables || []).map((t) => ({
          heading: t.heading, caption: t.caption, columns: t.columns,
          rows: store.tableRows(site.code, t.id, t.columns.length),
        })),
        challenge: makeChallenge(),
        form: {}, errors: {}, submitted: null,
      }, extra || {}),
    };
  }

  function renderPage(page, req, res, extra, status) {
    const { view, locals } = viewLocals(page, extra);
    res.status(status || 200).render(view, locals);
  }

  for (const page of cfg.pages) {
    r.get(page.route, (req, res) => renderPage(page, req, res));

    if (!(page.forms || []).length) continue;

    r.post(page.route, async (req, res) => {
      const formSpec = (page.forms || []).find((f) => f.id === req.body.__form) || page.forms[0];
      const formId = store.formKey(site.code, page.route, formSpec.id);
      const formRow = store.q.form.get(formId);

      // --- a login form authenticates the one shared account ---------------
      if (formRow && formRow.is_login) {
        const email = String(req.body.email || req.body.user_name || req.body.username || '')
          .trim().toLowerCase();
        const password = String(req.body.password || req.body.user_password || req.body.passwd || '');
        const person = email && store.findPersonByEmail(email);
        if (!person || !store.verifyPassword(person, password)) {
          return renderPage(page, req, res, {
            form: req.body,
            errors: {
              __form: 'No account matches that email and password. This portal accepts the ' +
                'one shared registration — register once and it works here and on every ' +
                'other portal.',
            },
          }, 401);
        }
        store.audit(site.code, 'session', person.id, 'LOGIN', 'portal:' + site.code, null,
          `${person.person_ref} signed in through the ${site.code} login form`);
        const identity = require('../services/identity');
        res.setHeader('Set-Cookie',
          `${identity.COOKIE}=${store.createSession(person.id, site.code)}; ` +
          `Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}`);
        return res.redirect('/account');
      }

      // --- an ordinary form is recorded, in both databases -----------------
      const { value, errors, ok } = validateForm(site, formSpec, req.body);
      if (!ok) {
        return renderPage(page, req, res, { form: req.body, errors }, 400);
      }

      const fields = formSpec.fields.map((f) => ({
        name: f.name, label: f.label, value: value[f.name],
      }));

      // Phase one: reserve the row here, which is also what allocates the
      // reference number.
      const reserved = store.reserveSubmission({
        siteCode: site.code,
        formId,
        prefix: formRow ? formRow.reference_prefix : 'DEMO',
        personId: req.person ? req.person.id : null,
        value,
        fields,
      });

      // Phase two: hand it to the ERP.
      const sync = await erp.sendSubmission({
        sourceSystem: site.code,
        sourceForm: formSpec.id,
        sourceRoute: page.route,
        sourceReference: reserved.reference,
        subject: formSpec.heading || page.title,
        person: req.person ? store.personPublic(req.person) : null,
        fields: fields.filter((f) => !/pass|pwd|secret|otp|captcha|token/i.test(f.name)),
        payload: reserved.payload,
      });

      if (!sync.ok) {
        store.rejectSubmission({
          id: reserved.id, reference: reserved.reference, siteCode: site.code,
          formId, status: sync.status, message: sync.message,
        });
        return renderPage(page, req, res, {
          form: req.body,
          errors: {
            __form: `Not saved. The ERP backend did not accept this record: ${sync.message}. ` +
              `Nothing was written on either side. Start the ERP (cd backend/erp-api && npm start) ` +
              `and submit again.`,
          },
        }, 503);
      }

      store.confirmSubmission({
        id: reserved.id, reference: reserved.reference, siteCode: site.code,
        formId, erpRef: sync.erpRef, status: sync.status,
      });
      renderPage(page, req, res, {
        submitted: { reference: reserved.reference, erpRef: sync.erpRef },
      });
    });
  }

  // --- this portal's own JSON API ------------------------------------------
  // The original publishes no public API: see analysis/api_inventory.json.
  r.get('/api/cascade/:list', (req, res) => {
    const parent = req.query.parent;
    if (!parent) return res.status(400).json({ error: 'parent is required' });
    const options = store.cascadeOptions(site.code, req.params.list, parent);
    if (options === null) return res.status(404).json({ error: 'unknown list' });
    res.json({ list: req.params.list, parent, options });
  });

  r.get('/api/reference/:list', (req, res) => {
    const options = store.referenceList(site.code, req.params.list);
    if (options === null) return res.status(404).json({ error: 'unknown list' });
    res.json({ list: req.params.list, options });
  });

  r.get('/api/submissions/:formId', (req, res) => {
    const formId = store.formKey(site.code, req.query.route || '/', req.params.formId);
    res.json({ formId, rows: store.submissionsFor(formId) });
  });

  r.get('/api/meta', (req, res) => res.json({
    site: cfg.site,
    pages: cfg.pages.map((p) => ({ route: p.route, title: p.title, forms: (p.forms || []).length })),
    sharedBackend: true,
    note: 'This API belongs to the replica, not to the original site. All five replicas ' +
      'are served by one backend reading one database.',
  }));

  // --- project pages -------------------------------------------------------
  r.get('/__about', (req, res) => {
    res.render('pages/about', { title: 'About this replica', pageTitle: 'About this replica' });
  });

  r.get('/__gaps', (req, res) => {
    let gaps = { counts: {}, gaps: [] };
    try {
      gaps = JSON.parse(fs.readFileSync(path.join(site.analysis, 'replication_gaps.json'), 'utf8'));
    } catch { /* render an empty table rather than failing */ }
    res.render('pages/gaps', {
      title: 'What is not reproduced', pageTitle: 'What is not reproduced',
      gapCounts: gaps.counts || {}, gapTotal: (gaps.gaps || []).length,
      gapMeanings: cfg.gapMeanings || {},
    });
  });

  // --- routes the original itself answers with an error --------------------
  for (const e of cfg.errorRoutes || []) {
    r.get(e.route, (req, res) => {
      res.status(e.status).render('pages/not-found', {
        title: e.title, pageTitle: null, note: e.note,
      });
    });
  }

  return r;
}

module.exports = { genericRouter, validateForm, makeChallenge };
