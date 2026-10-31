'use strict';

/**
 * Generic local demonstration replica server.
 *
 * NOT AN OFFICIAL GOVERNMENT SERVICE. This process never contacts the site it
 * replicates, or any other remote host. Every form posts here and is stored in
 * a local SQLite file holding synthetic data only.
 *
 * Everything site-specific lives in site.json, which the generator
 * (tools/bin/build-replica.js) writes from the captured analysis artifacts.
 * The original's stack is recorded in analysis/technology_stack.json; this
 * replica is an independent reimplementation on Express and does not claim to
 * be recovered source.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

const HERE = __dirname;
const PROJECT = path.resolve(HERE, '..', '..');
const SITE = JSON.parse(fs.readFileSync(path.join(HERE, 'site.json'), 'utf8'));
const store = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || SITE.port || 4174;
// frontend/portals/eforensics is the home of this portal's views and static files;
// the copy next to this backend is only used if that does not exist.
const FRONTEND = (() => {
  const home = path.resolve(HERE, '..', '..', '..', '..', '..', '..', 'frontend', 'portals', 'eforensics');
  return require('fs').existsSync(home) ? home : path.join(HERE, '..', 'frontend');
})();

app.set('view engine', 'ejs');
app.set('views', path.join(FRONTEND, 'views'));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(express.json({ limit: '256kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Replica-Notice',
    'Unofficial local demonstration - not an official government service');
  // Nothing may reach the original site, even by accident.
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
    "script-src 'self'; font-src 'self' data:; form-action 'self'; " +
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
  next();
});

app.use('/static', express.static(path.join(FRONTEND, 'public'), { maxAge: '1h' }));
app.use('/original-assets', express.static(path.join(PROJECT, 'original_assets'), { maxAge: '1h' }));

app.use((req, res, next) => {
  res.locals.site = SITE.site;
  res.locals.nav = SITE.nav;
  res.locals.currentPath = req.path;
  res.locals.title = SITE.site.name;
  res.locals.pageTitle = null;
  res.locals.form = {};
  res.locals.errors = {};
  res.locals.submitted = null;
  res.locals.tables = [];
  next();
});

/** Stands in for the original's CAPTCHA without reproducing or bypassing one. */
function makeChallenge() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  return { question: `What is ${a} + ${b}?`, expected: String(a + b) };
}

// --- validation driven by the captured field rules -------------------------
function validateForm(formSpec, body) {
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

  // Cascade: a child value must belong to its parent, enforced server-side and
  // not only in the browser.
  for (const f of formSpec.fields) {
    if (!f.cascadeChild || !value[f.name]) continue;
    const parent = formSpec.fields.find((p) => p.cascadeTarget === f.name);
    if (!parent) continue;
    const parentValue = value[parent.name];
    if (!parentValue) continue;
    const allowed = store.cascadeOptions(f.cascadeList, parentValue).map((o) => String(o.value));
    if (!allowed.includes(String(value[f.name]))) {
      errors[f.name] = `${f.label} does not belong to the selected ${parent.label}.`;
    }
  }

  const answer = (body.challenge_answer || '').trim();
  if (!answer) errors.challenge_answer = 'Please answer the verification question.';
  else if (answer !== String(body.challenge_expected)) {
    errors.challenge_answer = 'The verification answer is not correct.';
  }

  return { value, errors, ok: Object.keys(errors).length === 0 };
}

// --- page rendering --------------------------------------------------------
/**
 * A hand-written view for one route, if the project has one.
 *
 * The generator reproduces structure and fields for every page. Where a page
 * deserves closer visual work than a generic template can give, a view dropped
 * in views/custom/ takes over for that route alone. The generator never
 * overwrites that directory, so hand work survives a rebuild.
 */
const CUSTOM_DIR = path.join(FRONTEND, 'views', 'custom');
function customViewFor(route) {
  const slug = route === '/' ? 'index' : route.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  const file = path.join(CUSTOM_DIR, `${slug}.ejs`);
  return fs.existsSync(file) ? `custom/${slug}` : null;
}

function renderPage(page, req, res, extra) {
  const tables = (page.tables || []).map((t) => ({
    heading: t.heading,
    caption: t.caption,
    columns: t.columns,
    rows: store.tableRows(t.id, t.columns.length),
  }));
  const custom = customViewFor(page.route);
  // A hand-written view lays out its own hero, so the generic band in the
  // header partial must stand down or the page gets two of them.
  res.render(custom || 'pages/generic', Object.assign({
    isCustomView: !!custom,
    title: page.title,
    pageTitle: page.pageTitle || null,
    page,
    tables,
    challenge: makeChallenge(),
    form: {},
    errors: {},
    submitted: null,
  }, extra || {}));
}

for (const page of SITE.pages) {
  app.get(page.route, (req, res) => renderPage(page, req, res));

  if ((page.forms || []).length) {
    app.post(page.route, (req, res) => {
      const formSpec = (page.forms || []).find((f) => f.id === req.body.__form) || page.forms[0];
      const { value, errors, ok } = validateForm(formSpec, req.body);
      if (!ok) {
        return res.status(400).render(customViewFor(page.route) || 'pages/generic', {
          isCustomView: !!customViewFor(page.route),
          title: page.title, pageTitle: page.pageTitle || null, page,
          tables: (page.tables || []).map((t) => ({
            heading: t.heading, caption: t.caption, columns: t.columns,
            rows: store.tableRows(t.id, t.columns.length),
          })),
          challenge: makeChallenge(), form: req.body, errors, submitted: null,
        });
      }
      const reference = store.recordSubmission(formSpec, value);
      renderPage(page, req, res, { submitted: { reference } });
    });
  }
}

// --- local JSON API --------------------------------------------------------
// This is the replica's own API. The original publishes no public API: see
// analysis/api_inventory.json.
app.get('/api/cascade/:list', (req, res) => {
  const parent = req.query.parent;
  if (!parent) return res.status(400).json({ error: 'parent is required' });
  const options = store.cascadeOptions(req.params.list, parent);
  if (options === null) return res.status(404).json({ error: 'unknown list' });
  res.json({ list: req.params.list, parent, options });
});

app.get('/api/reference/:list', (req, res) => {
  const options = store.referenceList(req.params.list);
  if (options === null) return res.status(404).json({ error: 'unknown list' });
  res.json({ list: req.params.list, options });
});

app.get('/api/submissions/:formId', (req, res) => {
  res.json({ formId: req.params.formId, rows: store.submissionsFor(req.params.formId) });
});

app.get('/api/meta', (req, res) => res.json({
  site: SITE.site,
  pages: SITE.pages.map((p) => ({ route: p.route, title: p.title, forms: (p.forms || []).length })),
  note: 'This API belongs to the replica, not to the original site.',
}));

// --- project pages ---------------------------------------------------------
app.get('/__about', (req, res) => {
  res.render('pages/about', { title: 'About this replica', pageTitle: 'About this replica' });
});

app.get('/__gaps', (req, res) => {
  let gaps = { counts: {}, gaps: [] };
  try {
    gaps = JSON.parse(fs.readFileSync(path.join(PROJECT, 'analysis', 'replication_gaps.json'), 'utf8'));
  } catch { /* render an empty table rather than failing */ }
  res.render('pages/gaps', {
    title: 'What is not reproduced', pageTitle: 'What is not reproduced',
    gapCounts: gaps.counts || {},
    gapTotal: (gaps.gaps || []).length,
    gapMeanings: SITE.gapMeanings || {},
  });
});

// --- routes the original itself answers with an error ----------------------
for (const r of SITE.errorRoutes || []) {
  app.get(r.route, (req, res) => {
    res.status(r.status).render('pages/not-found', {
      title: r.title, pageTitle: null, note: r.note,
    });
  });
}

app.use((req, res) => {
  res.status(404).render('pages/not-found', { title: '404 - Not found', pageTitle: null, note: null });
});

app.use((err, req, res, next) => {
  process.stderr.write(`[replica] ${err.stack || err}\n`);
  res.status(500).render('pages/error', { title: 'Something went wrong', pageTitle: null, message: err.message });
});

if (require.main === module) {
  app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    process.stdout.write(
      `\nUnofficial local demonstration replica of ${SITE.site.hostname}\n` +
      `NOT an official government service.\n\n` +
      `  http://127.0.0.1:${PORT}/\n\n` +
      `Data: local SQLite, synthetic records only. No request leaves this machine.\n`
    );
  });
}

module.exports = app;
