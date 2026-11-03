'use strict';

/**
 * Unofficial local demonstration replica of eprisons.nic.in.
 *
 * NOT AN OFFICIAL GOVERNMENT SERVICE. This server never contacts
 * eprisons.nic.in or any other government system. Every form posts to this
 * process and is stored in a local SQLite file holding synthetic data only.
 *
 * Stack note: the original is ASP.NET Web Forms on IIS (confirmed -- see
 * analysis/technology_stack.json). That source is not available and .NET is not
 * required here, so this replica is an independent reimplementation on Express
 * with server-rendered EJS, which preserves the original's server-rendered,
 * full-page-post model. It does not claim to be the original source.
 */

const path = require('path');
const express = require('express');
const db = require('./db');
const { validateVisitRequest, validateGrievance, RULES } = require('./validation');

const app = express();
const PORT = Number(process.env.PORT) || 4173;

// frontend/portals/eprisons is the home of this portal's views and static files;
// the copy next to this backend is only used if that does not exist.
const FRONTEND = (() => {
  const home = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'frontend', 'portals', 'eprisons');
  return require('fs').existsSync(home) ? home : path.join(__dirname, '..', 'frontend');
})();
const PROJECT = path.resolve(__dirname, '..', '..');

app.set('view engine', 'ejs');
app.set('views', path.join(FRONTEND, 'views'));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(express.json({ limit: '256kb' }));

// Nothing here may reach out to the original site; a strict CSP keeps even an
// accidental absolute URL from loading.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Replica-Notice', 'Unofficial local demonstration - not an official government service');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
    "script-src 'self'; font-src 'self' data:; form-action 'self'; " +
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
  next();
});

app.use('/static', express.static(path.join(FRONTEND, 'public'), { maxAge: '1h' }));
// Assets collected from the original, served locally so no request leaves this
// machine. See analysis/asset_manifest.json for provenance and licensing notes.
app.use('/original-assets', express.static(path.join(PROJECT, 'original_assets'), { maxAge: '1h' }));

// --- shared view state ------------------------------------------------------
const NAV = [
  { label: 'eMulakat', href: '/public/MyVisitRegistration' },
  { label: 'eMulakat Status', href: '/public/MyVisitStatus' },
  { label: 'DashBoard', href: '/public/DashBoard' },
  { label: 'Prisons Map', href: '/NPIPDashboard' },
  {
    label: 'Reports',
    children: [
      { label: 'ePrisons Live', href: '/public/ePrisonsLiveStatus' },
      { label: 'eMulakat Statistics', href: '/public/ePrisonsLiveVisitorsStatus' },
      { label: 'Parole Jumper', href: '/public/ParoleJumper' },
      { label: 'Absconder', href: '/public/Absconder' },
      { label: 'Foreigner Prisoners', href: '/public/DashBoardForeigner' },
    ],
  },
  { label: 'Grievance', href: '/public/grievance' },
  { label: 'About Us', href: '/public/About' },
  { label: 'Contact Us', href: '/public/ContactUs' },
];

const TOP_LINKS = [
  { label: 'ePrisons MIS', href: '/Login/Secure/Login' },
  { label: 'Citizen Service', href: '/citizenservice' },
  { label: 'Legal Aid', href: '/Legalaid/Secure/Login' },
  { label: 'Other Stakeholders', href: '/Login/Secure/Login' },
];

app.use((req, res, next) => {
  res.locals.nav = NAV;
  res.locals.topLinks = TOP_LINKS;
  res.locals.currentPath = req.path;
  res.locals.ref = db.ref;
  res.locals.rules = RULES;
  res.locals.title = 'Welcome to National Prison Portal';
  res.locals.pageTitle = null;
  next();
});

/** A small arithmetic challenge that stands in for the original's CAPTCHA. */
function makeChallenge() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  return { question: `What is ${a} + ${b}?`, expected: String(a + b) };
}

// --- home -------------------------------------------------------------------
/**
 * Write-through hook.
 *
 * Standalone, this is a no-op and the portal behaves as it always did. When the
 * shared platform mounts this app it installs a real one, which mirrors the
 * record into the ERP's own database and reports whether the ERP took it. A
 * false result means the handler must undo its local write, so the two
 * databases never disagree.
 *
 * `req` is passed along so the platform can tell who, if anyone, is signed in.
 */
let mirror = async () => ({ ok: true, erpRef: null });
function setMirror(fn) { mirror = fn; }

app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Welcome to National Prison Portal',
    stats: db.headlineStats(),
  });
});

// --- e-Mulakat: visit registration -----------------------------------------
/** Today in India as YYYY-MM-DD: the original fills Visit Date with today's date. */
function todayInIndia() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** A fresh arithmetic question for the "Refresh" control next to the answer box. */
app.get('/api/challenge', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(makeChallenge());
});

/** What the "Click here for help" link opens: this replica's own summary, kept on this host. */
app.get('/public/eMulakatHelp', (req, res) => {
  res.render('pages/emulakat-help', { title: 'eMulakat - Help', pageTitle: 'eMulakat Help' });
});

app.get('/public/MyVisitRegistration', (req, res) => {
  const challenge = makeChallenge();
  res.render('pages/visit-registration', {
    title: 'eMulakat - New Visitor Registration', pageTitle: 'New Visitor Registration',
    form: { visit_date: todayInIndia(), additional_visitor_count: 0 }, errors: {}, challenge, submitted: null,
  });
});

app.post('/public/MyVisitRegistration', async (req, res) => {
  const stateId = req.body.state_id;
  const jails = stateId ? db.q.jailsByState.all(stateId) : [];
  const { value, errors, ok } = validateVisitRequest(req.body, db.ref, jails);

  if (!ok) {
    const challenge = makeChallenge();
    return res.status(400).render('pages/visit-registration', {
      title: 'eMulakat - New Visitor Registration', pageTitle: 'New Visitor Registration',
      form: req.body, errors, challenge, submitted: null,
    });
  }

  const registrationNo = db.nextSequence('EMDEMO', 'visit_request');
  const info = db.q.insertVisit.run({
    registration_no: registrationNo,
    visitor_name: value.visitor_name,
    visitor_father_name: value.visitor_father_name,
    visitor_address: value.visitor_address,
    visitor_gender_id: value.visitor_gender_id,
    visitor_age: value.visitor_age,
    relationship_id: value.relationship_id,
    id_proof_type_id: value.id_proof_type_id,
    id_number: value.id_number,
    is_international: value.is_international,
    email: value.email,
    mobile_no: value.mobile_no,
    state_id: value.state_id,
    jail_id: value.jail_id,
    visit_date: value.visit_date,
    additional_visitor_count: value.additional_visitor_count,
    prisoner_name: value.prisoner_name,
    prisoner_father_name: value.prisoner_father_name,
    prisoner_age: value.prisoner_age,
    prisoner_gender_id: value.prisoner_gender_id,
    physically_handicapped: value.physically_handicapped,
    visit_mode: value.visit_mode,
  });
  for (const n of value.additional_visitor_names) {
    db.q.insertAdditionalVisitor.run(info.lastInsertRowid, n);
  }
  db.audit('visit_request', info.lastInsertRowid, 'CREATE', 'local-demo-visitor', null,
    `visit request ${registrationNo} created in the local demonstration`);

  const sync = await mirror({
    form: 'visit_registration', route: '/public/MyVisitRegistration',
    reference: registrationNo, subject: 'Visitor registration (NPIP)',
    table: 'visit_request', rowId: info.lastInsertRowid, value, req,
  });
  if (!sync.ok) {
    return res.status(503).render('pages/visit-registration', {
      title: 'eMulakat - Visit Registration', pageTitle: 'Visit Registration',
      form: req.body, errors: { __form: sync.message }, challenge: makeChallenge(),
      submitted: null,
    });
  }

  res.render('pages/visit-registration', {
    title: 'eMulakat - Visit Registration', pageTitle: 'Visit Registration',
    form: {}, errors: {}, challenge: makeChallenge(),
    submitted: { registrationNo, erpRef: sync.erpRef },
  });
});

// --- e-Mulakat: status enquiry ---------------------------------------------
app.get('/public/MyVisitStatus', (req, res) => {
  res.render('pages/visit-status', {
    title: 'eMulakat - Visit Status', pageTitle: 'Visit Status',
    challenge: makeChallenge(), result: null, errors: {}, query: '',
  });
});

app.post('/public/MyVisitStatus', (req, res) => {
  const errors = {};
  const regNo = (req.body.registration_no || '').trim();
  if (!regNo) errors.registration_no = 'Registration Number is required.';
  else if (regNo.length > RULES.registrationNo.maxLength) {
    errors.registration_no = `Registration Number must be ${RULES.registrationNo.maxLength} characters or fewer.`;
  }
  const answer = (req.body.challenge_answer || '').trim();
  if (!answer) errors.challenge_answer = 'Please answer the verification question.';
  else if (answer !== String(req.body.challenge_expected)) {
    errors.challenge_answer = 'The verification answer is not correct.';
  }

  let result = null;
  if (Object.keys(errors).length === 0) {
    const row = db.q.visitByRegNo.get(regNo);
    if (!row) {
      result = { found: false, registrationNo: regNo };
    } else {
      result = {
        found: true, visit: row,
        additionalVisitors: db.q.additionalVisitors.all(row.id).map((r) => r.name),
      };
    }
  }
  res.status(Object.keys(errors).length ? 400 : 200).render('pages/visit-status', {
    title: 'eMulakat - Visit Status', pageTitle: 'Visit Status',
    challenge: makeChallenge(), result, errors, query: regNo,
  });
});

// --- grievance --------------------------------------------------------------
app.get('/public/grievance', (req, res) => {
  res.render('pages/grievance', {
    title: 'Grievance', pageTitle: 'Grievance',
    form: {}, errors: {}, challenge: makeChallenge(), submitted: null,
  });
});

app.post('/public/grievance', async (req, res) => {
  const stateId = req.body.state_id;
  const jails = stateId ? db.q.jailsByState.all(stateId) : [];
  const { value, errors, ok } = validateGrievance(req.body, db.ref, jails);

  if (!ok) {
    return res.status(400).render('pages/grievance', {
      title: 'Grievance', pageTitle: 'Grievance',
      form: req.body, errors, challenge: makeChallenge(), submitted: null,
    });
  }

  const referenceNo = db.nextSequence('GRVDEMO', 'grievance');
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const info = db.q.insertGrievance.run({
    reference_no: referenceNo,
    complainant_name: value.complainant_name,
    complainant_mobile: value.complainant_mobile,
    complainant_email: value.complainant_email,
    complainant_address: value.complainant_address,
    relationship_id: value.relationship_id,
    inmate_name: value.inmate_name,
    inmate_father_name: value.inmate_father_name,
    state_id: value.state_id,
    jail_id: value.jail_id,
    category: value.category,
    subject: value.subject,
    description: value.description,
    due_at: due.toISOString().slice(0, 10),
  });
  db.q.insertGrievanceAction.run(info.lastInsertRowid, 'RECEIVED',
    'Logged by the local demonstration portal', 'citizen');
  db.audit('grievance', info.lastInsertRowid, 'CREATE', 'local-demo-citizen', null,
    `grievance ${referenceNo} created in the local demonstration`);

  const sync = await mirror({
    form: 'grievance', route: '/public/grievance',
    reference: referenceNo, subject: 'Grievance',
    table: 'grievance', rowId: info.lastInsertRowid, value, req,
  });
  if (!sync.ok) {
    return res.status(503).render('pages/grievance', {
      title: 'Grievance', pageTitle: 'Grievance',
      form: req.body, errors: { __form: sync.message },
      challenge: makeChallenge(), submitted: null,
    });
  }

  res.render('pages/grievance', {
    title: 'Grievance', pageTitle: 'Grievance',
    form: {}, errors: {}, challenge: makeChallenge(),
    submitted: { referenceNo, erpRef: sync.erpRef },
  });
});

app.get('/public/grievancelogin', (req, res) => {
  res.render('pages/grievance-login', { title: 'Grievance Status Login', pageTitle: 'Grievance Status', notice: null });
});

app.post('/public/grievancelogin', (req, res) => {
  const ref = (req.body.reference_no || '').trim();
  if (!ref) {
    return res.status(400).render('pages/grievance-login', {
      title: 'Grievance Status Login',
      notice: { kind: 'error', text: 'Enter the grievance reference number issued when you submitted it.' },
    });
  }
  const row = db.q.grievanceByRef.get(ref);
  if (!row) {
    return res.status(404).render('pages/grievance-login', {
      title: 'Grievance Status Login',
      notice: { kind: 'error', text: `No grievance in this local demonstration carries the reference "${ref}".` },
    });
  }
  res.render('pages/grievance-status', {
    title: 'Grievance Status', pageTitle: 'Grievance Status',
    grievance: row, actions: db.q.grievanceActions.all(row.id),
  });
});

// --- public listings --------------------------------------------------------
app.get('/public/Absconder', (req, res) => {
  const stateId = req.query.state_id ? Number(req.query.state_id) : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  res.render('pages/listing', {
    title: 'Absconders', pageTitle: 'Absconder',
    heading: 'Absconders',
    intro: 'Synthetic demonstration records. These do not describe real people.',
    columns: ['Name', 'Father Name', 'State', 'Jail', 'Absconded On', 'Remarks'],
    data: db.listAbsconders({ stateId, page }),
    rowFields: ['name', 'father_name', 'state_name', 'jail_name', 'absconded_on', 'remarks'],
    stateId, basePath: '/public/Absconder',
  });
});

app.get('/public/ParoleJumper', (req, res) => {
  const stateId = req.query.state_id ? Number(req.query.state_id) : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  res.render('pages/listing', {
    title: 'Parole Jumpers', pageTitle: 'Parole Jumper',
    heading: 'Parole Jumpers',
    intro: 'Synthetic demonstration records. These do not describe real people.',
    columns: ['Name', 'Father Name', 'State', 'Jail', 'Parole From', 'Due Back On', 'Remarks'],
    data: db.listParoleJumpers({ stateId, page }),
    rowFields: ['name', 'father_name', 'state_name', 'jail_name', 'parole_from', 'due_back_on', 'remarks'],
    stateId, basePath: '/public/ParoleJumper',
  });
});

// --- statistics -------------------------------------------------------------
app.get('/public/DashBoard', (req, res) => {
  const states = db.ref.states;
  const chosen = states.find((st) => String(st.id) === String(req.query.state)) || null;
  res.render('pages/dashboard', {
    // the page draws its own "Dashboard" bar, so the shared title strip stays off
    title: 'DashBoard', pageTitle: null,
    stats: db.headlineStats(),
    states, chosen,
    kpis: db.dashboardKpis(chosen ? chosen.id : 0),
    charts: db.dashboardCharts(new Date()),
    asOf: new Date(),
    byState: db.statsByState('inmates_in_custody'),
    visitStatus: db.visitStatusBreakdown(),
    grievance: db.grievancePendency(),
  });
});

app.get('/public/DashBoardForeigner', (req, res) => {
  res.render('pages/stat-table', {
    title: 'Foreigner Prisoners', pageTitle: 'Foreigner Prisoners',
    heading: 'Foreigner Prisoners',
    metricLabel: 'Foreign inmates',
    rows: db.statsByState('foreign_inmates'),
  });
});

app.get('/public/ePrisonsLiveStatus', (req, res) => {
  res.render('pages/stat-table', {
    title: 'ePrisons Live Status', pageTitle: 'ePrisons Live Status',
    heading: 'ePrisons Live Status',
    metricLabel: 'Inmates in custody',
    rows: db.statsByState('inmates_in_custody'),
  });
});

app.get('/public/ePrisonsLiveVisitorsStatus', (req, res) => {
  res.render('pages/stat-table', {
    title: 'eMulakat Statistics', pageTitle: 'eMulakat Statistics',
    heading: 'eMulakat Statistics',
    metricLabel: 'Visits registered today',
    rows: db.statsByState('visits_registered_today'),
  });
});

app.get('/public/SelectMISState', (req, res) => {
  res.render('pages/select-state', { title: 'Select State', pageTitle: 'Select State' });
});

// --- static content pages ---------------------------------------------------
const CONTENT_PAGES = {
  '/public/About': { view: 'about', title: 'About Us' },
  '/public/ContactUs': { view: 'contact', title: 'Contact Us' },
  '/public/PrivacyPolicy': { view: 'privacy-policy', title: 'Privacy Policy' },
  '/public/TermsofUse': { view: 'terms-of-use', title: 'Terms of Use' },
  '/public/CodeofConduct': { view: 'code-of-conduct', title: 'Code of Conduct' },
};
for (const [route, cfg] of Object.entries(CONTENT_PAGES)) {
  app.get(route, (req, res) => res.render(`pages/${cfg.view}`, { title: cfg.title, pageTitle: cfg.title }));
}

// --- login screens (demonstration only; no authentication is implemented) ---
app.get('/Login/Secure/Login', (req, res) => {
  res.render('pages/login', { title: 'ePrisons MIS Login', pageTitle: 'ePrisons MIS Login', portal: 'ePrisons MIS', notice: null });
});
app.get('/Legalaid/Secure/Login', (req, res) => {
  res.render('pages/login', { title: 'Legal Aid Login', pageTitle: 'Legal Aid Login', portal: 'Legal Aid', notice: null });
});
app.post(['/Login/Secure/Login', '/Legalaid/Secure/Login'], (req, res) => {
  const portal = req.path.includes('Legalaid') ? 'Legal Aid' : 'ePrisons MIS';
  res.status(200).render('pages/login', {
    title: `${portal} Login`, pageTitle: `${portal} Login`, portal,
    notice: {
      kind: 'info',
      text: 'This local demonstration does not authenticate anyone. The original portal\'s ' +
            'authenticated area is out of scope: it was never accessed, and nothing behind ' +
            'it is reproduced here.',
    },
  });
});

// --- citizen service area ---------------------------------------------------
app.get(['/citizenservice', '/CitiZenService'], (req, res) => {
  res.render('pages/citizen-service', { title: 'Citizen Services', pageTitle: 'Citizen Services' });
});
app.get('/CitiZenService/Visitor/Registration', (req, res) => {
  res.render('pages/citizen-registration', {
    title: 'Citizen Services - Visitor Registration', pageTitle: 'Visitor Registration',
    form: {}, errors: {}, challenge: makeChallenge(), submitted: null,
  });
});
app.post('/CitiZenService/Visitor/Registration', async (req, res) => {
  const errors = {};
  const v = {};
  const t = (k) => (req.body[k] == null ? '' : String(req.body[k])).trim();

  // Field names and lengths mirror the live Citizen Services form
  // (VisitorProfile.Vis_*), captured in analysis/forms_and_interactions.json.
  v.full_name = t('full_name');
  if (!v.full_name) errors.full_name = 'Visitor Name is required.';
  else if (v.full_name.length > 60) errors.full_name = 'Visitor Name must be 60 characters or fewer.';

  v.father_name = t('father_name');
  if (!v.father_name) errors.father_name = 'Father Name is required.';

  v.address = t('address');
  if (!v.address) errors.address = 'Address is required.';
  else if (v.address.length > 150) errors.address = 'Address must be 150 characters or fewer.';

  v.gender_id = t('gender_id');
  if (!v.gender_id) errors.gender_id = 'Gender is required.';
  else if (!db.ref.genders.some((g) => String(g.id) === v.gender_id)) errors.gender_id = 'Unknown gender.';

  const ageRaw = t('age');
  if (!ageRaw) errors.age = 'Age is required.';
  else if (!/^\d+$/.test(ageRaw) || Number(ageRaw) < 1 || Number(ageRaw) > 120) {
    errors.age = 'Age must be a whole number between 1 and 120.';
  } else v.age = Number(ageRaw);

  v.relationship_id = t('relationship_id');
  if (!v.relationship_id) errors.relationship_id = 'Relation is required.';
  else if (!db.ref.csRelationships.some((r) => String(r.id) === v.relationship_id)) {
    // Guards against a value taken from the NPIP list, which this form does
    // not offer -- the two portals publish different vocabularies.
    errors.relationship_id = 'That relation is not offered by the Citizen Services form.';
  }

  v.email = t('email');
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'Email Id is not valid.';

  v.mobile_no = t('mobile_no');
  if (!/^[6-9][0-9]{9}$/.test(v.mobile_no)) errors.mobile_no = 'Enter a 10-digit mobile number.';

  // The live form has a Password field. The replica never stores one: it
  // authenticates nobody, so keeping a password would be a liability with no
  // purpose. See the README security notes.
  if (!t('password')) errors.password = 'Password is required.';

  if (t('challenge_answer') !== String(req.body.challenge_expected)) {
    errors.challenge_answer = 'The verification answer is not correct.';
  }

  const rerender = (extra) => res.status(400).render('pages/citizen-registration', Object.assign({
    title: 'Citizen Services - Visitor Registration', pageTitle: 'Visitor Registration',
    form: req.body, errors, challenge: makeChallenge(), submitted: null,
  }, extra || {}));

  if (Object.keys(errors).length) return rerender();

  let createdId = null;
  try {
    const info = db.db.prepare(
      'INSERT INTO citizen_account (mobile_no, full_name, father_name, gender_id, age, ' +
      'relationship_id, email, address, state_id) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(v.mobile_no, v.full_name, v.father_name, v.gender_id, v.age,
      v.relationship_id, v.email || null, v.address, req.body.state_id || null);
    createdId = info.lastInsertRowid;
    db.audit('citizen_account', createdId, 'CREATE', 'local-demo-citizen', null,
      'account created in the local demonstration; no password was stored');
  } catch (e) {
    errors.mobile_no = 'An account with this mobile number already exists in the local demonstration.';
    return rerender();
  }

  const sync = await mirror({
    form: 'citizen_registration', route: '/CitiZenService/Visitor/Registration',
    reference: `CSV-${v.mobile_no}`, subject: 'Visitor registration (Citizen Services)',
    table: 'citizen_account', rowId: createdId, value: v, req,
  });
  if (!sync.ok) {
    errors.__form = sync.message;
    return rerender();
  }

  res.render('pages/citizen-registration', {
    title: 'Citizen Services - Visitor Registration', pageTitle: 'Visitor Registration',
    form: {}, errors: {}, challenge: makeChallenge(),
    submitted: { mobile: v.mobile_no, erpRef: sync.erpRef },
  });
});

app.get('/CitiZenService/Login/ContactUs', (req, res) => {
  res.render('pages/contact', { title: 'Citizen Services - Contact Us', pageTitle: 'Contact Us' });
});
app.get('/CitiZenService/Login/FAQ', (req, res) => {
  res.render('pages/faq', { title: 'Citizen Services - FAQ', pageTitle: 'FAQ' });
});

// --- the client-routed dashboard -------------------------------------------
// The original mounts a React single-page application here, whose inner routes
// have no server-side path (a direct request to one returns 403 from IIS). The
// replica reproduces that shape: one shell, routed in the browser.
const DASHBOARD_ROUTES = ['', '/lockupReport', '/paroleJumper', '/absconder',
                          '/ePrisonsLiveStatus', '/siteMap'];
app.get(['/NPIPDashboard', '/NPIPDashboard/*'], (req, res) => {
  res.render('pages/dashboard-spa', {
    title: '| Dashboard',
    layout: false,
    routes: DASHBOARD_ROUTES,
  });
});

// --- local JSON API used by the pages ---------------------------------------
// This is the replica's own API. The original publishes no public API: see
// analysis/api_inventory.json.
app.get('/api/jails', (req, res) => {
  const stateId = Number(req.query.state_id);
  if (!stateId) return res.status(400).json({ error: 'state_id is required' });
  res.json({ stateId, jails: db.q.jailsByState.all(stateId) });
});

app.get('/api/stats/headline', (req, res) => res.json(db.headlineStats()));

app.get('/api/stats/by-state', (req, res) => {
  const metric = String(req.query.metric || 'inmates_in_custody');
  const allowed = ['inmates_in_custody', 'sanctioned_capacity', 'visits_registered_today',
                   'court_hearings_today', 'foreign_inmates'];
  if (!allowed.includes(metric)) {
    return res.status(400).json({ error: 'unknown metric', allowed });
  }
  res.json({ metric, rows: db.statsByState(metric) });
});

app.get('/api/lockup-report', (req, res) => {
  const stateId = req.query.state_id ? Number(req.query.state_id) : null;
  res.json({ stateId, rows: db.lockupReport({ stateId }).slice(0, 200) });
});

app.get('/api/absconders', (req, res) => {
  res.json(db.listAbsconders({
    stateId: req.query.state_id ? Number(req.query.state_id) : null,
    page: Math.max(1, Number(req.query.page) || 1),
  }));
});

app.get('/api/parole-jumpers', (req, res) => {
  res.json(db.listParoleJumpers({
    stateId: req.query.state_id ? Number(req.query.state_id) : null,
    page: Math.max(1, Number(req.query.page) || 1),
  }));
});

app.get('/api/reference', (req, res) => res.json(db.ref));

// --- the original's own broken link ----------------------------------------
// /Test is linked from the live site and answers 404 there. Reproduced so the
// route inventory and the replica agree.
app.get('/Test', (req, res) => {
  res.status(404).render('pages/not-found', {
    title: '404 - File or directory not found.',
    note: 'The original site links to /Test and it answers 404 there too. ' +
          'This is reproduced deliberately.',
  });
});

// --- errors -----------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('pages/not-found', {
    title: '404 - Not found',
    note: null,
  });
});

app.use((err, req, res, next) => {
  process.stderr.write(`[replica] ${err.stack || err}\n`);
  res.status(500).render('pages/error', { title: 'Something went wrong', message: err.message });
});

if (require.main === module) {
  app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    process.stdout.write(
      `\nUnofficial local demonstration replica of eprisons.nic.in\n` +
      `NOT an official government service.\n\n` +
      `  http://127.0.0.1:${PORT}/\n\n` +
      `Data: local SQLite, synthetic records only. No request leaves this machine.\n`
    );
  });
}

module.exports = app;
module.exports.setMirror = setMirror;
