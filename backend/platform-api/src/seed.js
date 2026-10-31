#!/usr/bin/env node
'use strict';

/**
 * Fill the one shared database with every portal's reference data.
 *
 * Option lists, dependent-dropdown lists and demo table rows come from each
 * project's generated site.json, which the analysis pipeline wrote from the
 * captured public form markup. ePrisons keeps its own generator - it builds a
 * real domain model (State -> Jail, two relationship vocabularies, conditional
 * ID-proof numbering) and there is no reason to write that twice, so it is
 * invoked here pointed at this database.
 *
 * No person and no submission is seeded. Those arrive by someone using a
 * portal, which is the whole demonstration.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const store = require('./db');
const { SITES } = require('./config/sites');

const SENSITIVE = /pass|pwd|secret|otp|pin|captcha|token|challenge/i;

// Deterministic pseudo-random, so re-seeding reproduces the same demonstration
// data. Carried over from the per-site kit seed this replaces.
let rndSeed = 20261027;
function rnd() { rndSeed = (rndSeed * 1103515245 + 12345) & 0x7fffffff; return rndSeed / 0x7fffffff; }
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Deliberately generic placeholders: no real person is described anywhere here.
const FIRST = ['Demo', 'Sample', 'Test', 'Example', 'Placeholder', 'Specimen', 'Trial'];
const LAST = ['Applicant', 'Citizen', 'Person', 'Resident', 'Party', 'Subject', 'Record'];
const nameOf = () => `${pick(FIRST)} ${pick(LAST)} ${int(100, 999)}`;
const dateOf = (off) => {
  const d = new Date(Date.UTC(2026, 9, 27));
  d.setUTCDate(d.getUTCDate() + off);
  return d.toISOString().slice(0, 10);
};

/** A plausible synthetic cell, inferred from the captured column heading. */
function cellFor(column) {
  const label = String(column).toLowerCase();
  if (/date|on$|from|to$|dob/.test(label)) return dateOf(-int(1, 700));
  if (/no\.?$|number|count|total|qty|amount|sr|s\.no/.test(label)) return String(int(1, 9999));
  if (/name|party|petitioner|respondent|applicant/.test(label)) return nameOf();
  if (/status|stage/.test(label)) return pick(['Pending', 'Disposed', 'Listed', 'Under process']);
  if (/state|district|court|jail|lab|centre|center/.test(label)) return `Demo ${column} ${int(1, 40)}`;
  return `Demo value ${int(100, 999)}`;
}

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

/**
 * A form is treated as a login when it carries a password field.
 *
 * The originals each have their own login. In this demonstration they all
 * authenticate the single shared registration instead, which is what lets one
 * account work on five portals.
 */
function looksLikeLogin(form) {
  return (form.fields || []).some(
    (f) => f.type === 'password' || f.inputType === 'password' || /password|passwd/i.test(f.name));
}

function seedGenericSite(site) {
  const cfg = readJson(site.siteJson, null);
  if (!cfg) return { skipped: 'no site.json' };

  const refIns = store.db.prepare(
    `INSERT INTO reference_option (site_code, list, value, label, sort_order) VALUES (?,?,?,?,?)
     ON CONFLICT(site_code, list, value) DO UPDATE SET label = excluded.label,
       sort_order = excluded.sort_order`);
  const casIns = store.db.prepare(
    `INSERT INTO cascade_option (site_code, list, parent_value, value, label, sort_order)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(site_code, list, parent_value, value) DO UPDATE SET label = excluded.label`);
  const rowIns = store.db.prepare(
    'INSERT INTO demo_table_row (site_code, table_id, cells, sort_order) VALUES (?,?,?,?)');
  const clearRows = store.db.prepare('DELETE FROM demo_table_row WHERE site_code = ?');

  const counts = { refOptions: 0, cascadeOptions: 0, tableRows: 0, forms: 0, loginForms: 0 };
  const forms = [];

  for (const page of cfg.pages || []) {
    (page.forms || []).forEach((f) => {
      const isLogin = looksLikeLogin(f);
      if (isLogin) counts.loginForms += 1;
      forms.push({
        id: store.formKey(site.code, page.route, f.id),
        site_code: site.code,
        route: page.route,
        local_id: f.id,
        heading: f.heading || page.title || null,
        reference_prefix: (f.referencePrefix || 'DEMO').replace(/[^A-Z0-9]/gi, '').toUpperCase()
          || 'DEMO',
        field_count: (f.fields || []).length,
        is_login: isLogin ? 1 : 0,
      });
      // A field's own inline options are reference data too.
      for (const field of f.fields || []) {
        if (!Array.isArray(field.options) || !field.options.length) continue;
        const list = `${f.id}.${field.name}`;
        field.options.forEach((o, i) => {
          refIns.run(site.code, list, String(o.value), String(o.label || o.value), i);
          counts.refOptions += 1;
        });
      }
    });
  }

  store.db.transaction(() => {
    for (const [list, options] of Object.entries(cfg.referenceLists || {})) {
      (options || []).forEach((o, i) => {
        refIns.run(site.code, list, String(o.value), String(o.label || o.value), i);
        counts.refOptions += 1;
      });
    }

    // The originals populate a child list only once its parent is chosen, so
    // the real pairs were never published. These are synthetic, derived from
    // the parent list that WAS published. A chained list is seeded after the
    // level above it, because its parents are generated, not captured.
    const generated = {};
    const entries = Object.entries(cfg.cascadeLists || {});
    const ordered = entries.filter(([, c]) => !c.parentIsCascade)
      .concat(entries.filter(([, c]) => c.parentIsCascade));
    for (const [list, spec] of ordered) {
      const parents = spec.parentIsCascade
        ? (generated[spec.parentList] || [])
        : ((cfg.referenceLists || {})[spec.parentList] || []);
      for (const parent of parents) {
        const count = int(2, 5);
        for (let i = 0; i < count; i += 1) {
          const value = `${parent.value}-${i + 1}`;
          const label = `${spec.childLabel || 'Option'} ` +
            `${['North', 'South', 'East', 'West', 'Central'][i % 5]} (demo)`;
          casIns.run(site.code, list, String(parent.value), value, label, i);
          (generated[list] = generated[list] || []).push({ value, label });
          counts.cascadeOptions += 1;
        }
      }
    }

    // site.json declares each captured table's columns but no rows: the
    // originals' table contents were never copied. Rows are synthesised from
    // the column headings instead.
    clearRows.run(site.code);
    for (const t of Object.values(cfg.tables || {})) {
      if (!t || !Array.isArray(t.columns) || !t.columns.length) continue;
      const rows = int(8, 18);
      for (let r = 0; r < rows; r += 1) {
        rowIns.run(site.code, t.id, JSON.stringify(t.columns.map(cellFor)), r);
        counts.tableRows += 1;
      }
    }
  })();

  counts.forms = store.registerForms(site.code, forms).length;
  return counts;
}

/** ePrisons brings its own generator; point it at this database and run it. */
function seedEprisons(site) {
  const seedScript = path.join(site.project, 'replica', 'database', 'seed.js');
  if (!fs.existsSync(seedScript)) return { skipped: 'no seed.js' };

  execFileSync(process.execPath, [seedScript], {
    env: {
      ...process.env,
      SEED_DB: store.DB_PATH,
      SEED_SCHEMA: require('./config/paths').PLATFORM_SCHEMA,
      SEED_KEEP: '1',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  // Its routes are hand-written rather than described by a site.json, so its
  // forms are declared here.
  const forms = [
    { route: '/public/MyVisitRegistration', local_id: 'visit_registration',
      heading: 'Visitor registration (NPIP)', prefix: 'VIS', login: 0 },
    { route: '/public/grievance', local_id: 'grievance',
      heading: 'Lodge a grievance', prefix: 'GRV', login: 0 },
    { route: '/CitiZenService/Visitor/Registration', local_id: 'citizen_registration',
      heading: 'Visitor registration (Citizen Services)', prefix: 'CSV', login: 0 },
    { route: '/Login/Secure/Login', local_id: 'login', heading: 'Officer login', prefix: 'LGN', login: 1 },
    { route: '/public/grievancelogin', local_id: 'grievance_login',
      heading: 'Grievance login', prefix: 'GRL', login: 1 },
  ];
  const registered = store.registerForms(site.code, forms.map((f) => ({
    id: store.formKey(site.code, f.route, f.local_id),
    site_code: site.code, route: f.route, local_id: f.local_id,
    heading: f.heading, reference_prefix: f.prefix,
    field_count: 0, is_login: f.login,
  })));

  const n = (t) => store.db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  return {
    forms: registered.length,
    loginForms: forms.filter((f) => f.login).length,
    states: n('state'), jails: n('jail'), relationships: n('relationship'),
    visits: n('visit_request'), grievances: n('grievance'),
  };
}

function main() {
  store.registerSites(SITES);
  process.stdout.write(`shared database: ${store.DB_PATH}\n\n`);

  for (const site of SITES) {
    const counts = site.driver === 'eprisons' ? seedEprisons(site) : seedGenericSite(site);
    const parts = Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ');
    process.stdout.write(`  ${site.code.padEnd(11)} ${parts}\n`);
  }

  const s = store.summary();
  const forms = store.db.prepare('SELECT COUNT(*) AS n FROM form').get().n;
  const logins = store.db.prepare('SELECT COUNT(*) AS n FROM form WHERE is_login = 1').get().n;
  const refs = store.db.prepare('SELECT COUNT(*) AS n FROM reference_option').get().n;
  const cascades = store.db.prepare('SELECT COUNT(*) AS n FROM cascade_option').get().n;
  const rows = store.db.prepare('SELECT COUNT(*) AS n FROM demo_table_row').get().n;

  process.stdout.write(
    `\nOne database, ${s.sites.length} portals:\n` +
    `  ${forms} forms (${logins} of them logins, all authenticating the one shared account)\n` +
    `  ${refs} reference options, ${cascades} cascade options, ${rows} demo table rows\n` +
    `  ${s.people} people, ${s.submissions} submissions — these arrive by using a portal\n`);
}

if (require.main === module) main();
module.exports = { seedGenericSite, seedEprisons, looksLikeLogin };
