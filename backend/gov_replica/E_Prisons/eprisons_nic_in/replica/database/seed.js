#!/usr/bin/env node
'use strict';

/**
 * Build and populate the local demonstration database.
 *
 * Reference lists (states, relationships, ID proof types, genders) are taken
 * from the option values captured in analysis/forms_and_interactions.json, so
 * the replica validates against the same value domain as the original form.
 *
 * Every *record* -- visit requests, grievances, absconders, statistics -- is
 * synthetic, generated here from a fixed seed. No data from the original system
 * is copied, and nothing here describes a real person.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const PROJECT = path.resolve(__dirname, '..', '..');
const ANALYSIS = path.join(PROJECT, 'analysis', 'forms_and_interactions.json');
// Targetable, so the shared platform database can reuse this generator instead
// of a second copy of it. Unset, it behaves exactly as it always did.
const DB_PATH = process.env.SEED_DB || path.join(__dirname, 'replica.sqlite');
const SCHEMA = process.env.SEED_SCHEMA || path.join(__dirname, 'schema.sql');

// --- deterministic pseudo-random, so re-seeding gives the same demo data ----
let seed = 20261026;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Pull a captured <select>'s options out of the analysis artifacts. */
function capturedOptions(forms, namePart) {
  for (const f of forms) {
    for (const field of f.fields || []) {
      const n = field.htmlName || field.id || '';
      if (!n.toLowerCase().includes(namePart.toLowerCase())) continue;
      if (!Array.isArray(field.options) || field.options.length === 0) continue;
      return field.options
        .map((o) => (o.text || '').trim())
        .filter((t) => t && !/^select$/i.test(t) && !/^--/.test(t));
    }
  }
  return [];
}

function main() {
  if (!fs.existsSync(ANALYSIS)) {
    console.error(`Cannot find ${ANALYSIS}.\nRun the analysis pipeline first:\n` +
      `  cd tools && node bin/gov-replica.js eprisons.nic.in`);
    process.exit(1);
  }
  const forms = JSON.parse(fs.readFileSync(ANALYSIS, 'utf8')).forms || [];

  const states = capturedOptions(forms, 'ddlState');
  const relationships = capturedOptions(forms, 'ddlVisRelationship');
  // The Citizen Services portal publishes its own, shorter relationship list.
  const csRelationships = capturedOptions(forms, 'Vis_Relation');
  const idProofs = capturedOptions(forms, 'ddlIdProof');
  const genders = capturedOptions(forms, 'ddlVis_gender');

  if (!states.length || !relationships.length || !idProofs.length) {
    console.error('The analysis artifacts do not contain the expected option lists. ' +
      'Re-run the pipeline so the reference data can be transcribed.');
    process.exit(1);
  }

  // SEED_KEEP is set when seeding into a database that holds other portals'
  // rows as well: dropping the file would take them with it.
  if (!process.env.SEED_KEEP && fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = new Database(DB_PATH);
  db.exec(fs.readFileSync(SCHEMA, 'utf8'));

  const insert = {
    state: db.prepare('INSERT INTO state (name, sort_order) VALUES (?, ?)'),
    jail: db.prepare('INSERT INTO jail (state_id, name, jail_type) VALUES (?, ?, ?)'),
    rel: db.prepare('INSERT INTO relationship (name, source_portal, sort_order) VALUES (?, ?, ?)'),
    idp: db.prepare('INSERT INTO id_proof_type (name, requires_number, sort_order) VALUES (?, ?, ?)'),
    gen: db.prepare('INSERT INTO gender (name, sort_order) VALUES (?, ?)'),
  };

  const tx = db.transaction(() => {
    states.forEach((s, i) => insert.state.run(s, i));
    relationships.forEach((r, i) => insert.rel.run(r, 'NPIP', i));
    csRelationships.forEach((r, i) => insert.rel.run(r, 'CITIZEN_SERVICE', i));
    // 'NOT AVAILABLE' is a real option on the live form, which is why an ID
    // number cannot be mandatory for every choice.
    idProofs.forEach((p, i) => insert.idp.run(p, /not available/i.test(p) ? 0 : 1, i));
    genders.forEach((g, i) => insert.gen.run(g, i));
  });
  tx();

  const stateRows = db.prepare('SELECT id, name FROM state ORDER BY sort_order').all();

  // --- synthetic jails ------------------------------------------------------
  // The live form loads the jail list only after a state is chosen, so the real
  // list was never exposed. These names are invented for the demonstration.
  const JAIL_TYPES = ['Central Jail', 'District Jail', 'Sub Jail', 'Open Jail',
                      'Women Jail', 'Borstal School', 'Special Jail'];
  const jailTx = db.transaction(() => {
    for (const st of stateRows) {
      const n = int(2, 6);
      const used = new Set();
      for (let i = 0; i < n; i++) {
        const type = pick(JAIL_TYPES);
        const nm = `${type} ${['North', 'South', 'East', 'West', 'Central'][i % 5]} (demo)`;
        if (used.has(nm)) continue;
        used.add(nm);
        insert.jail.run(st.id, nm, type);
      }
    }
  });
  jailTx();

  const jailRows = db.prepare('SELECT id, state_id, name FROM jail').all();
  const genderRows = db.prepare('SELECT id, name FROM gender').all();
  const relRows = db.prepare(
    "SELECT id, name FROM relationship WHERE source_portal = 'NPIP'").all();
  const idpRows = db.prepare('SELECT id, name, requires_number FROM id_proof_type').all();

  // --- synthetic people -----------------------------------------------------
  // Deliberately generic placeholder names: no real person is described.
  const FIRST = ['Demo', 'Sample', 'Test', 'Example', 'Placeholder', 'Specimen', 'Trial'];
  const LAST = ['Visitor', 'Citizen', 'Applicant', 'Person', 'Resident', 'Guardian', 'Relative'];
  const INMATE = ['Inmate', 'Detainee', 'Prisoner', 'Undertrial', 'Convict'];
  const nameOf = (pool) => `${pick(FIRST)} ${pick(pool)} ${int(100, 999)}`;
  const mobile = () => `9${int(100000000, 999999999)}`.slice(0, 10);
  const dateOffset = (days) => {
    const d = new Date(Date.UTC(2026, 9, 26));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const insVisit = db.prepare(`
    INSERT INTO visit_request (
      registration_no, visitor_name, visitor_father_name, visitor_address,
      visitor_gender_id, visitor_age, relationship_id, id_proof_type_id, id_number,
      is_international, email, mobile_no, state_id, jail_id, visit_date,
      additional_visitor_count, prisoner_name, prisoner_father_name, prisoner_age,
      prisoner_gender_id, physically_handicapped, status, visit_mode, created_at
    ) VALUES (
      @registration_no, @visitor_name, @visitor_father_name, @visitor_address,
      @visitor_gender_id, @visitor_age, @relationship_id, @id_proof_type_id, @id_number,
      @is_international, @email, @mobile_no, @state_id, @jail_id, @visit_date,
      @additional_visitor_count, @prisoner_name, @prisoner_father_name, @prisoner_age,
      @prisoner_gender_id, @physically_handicapped, @status, @visit_mode, @created_at
    )`);
  const insAddVis = db.prepare('INSERT INTO additional_visitor (visit_request_id, name) VALUES (?, ?)');
  const insAudit = db.prepare(`INSERT INTO audit_log (entity, entity_id, action, maker, approver, details)
                               VALUES (?, ?, ?, ?, ?, ?)`);

  const STATUSES = ['SUBMITTED', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'COMPLETED'];
  const visitTx = db.transaction(() => {
    for (let i = 1; i <= 120; i++) {
      const jail = pick(jailRows);
      const idp = pick(idpRows);
      const addl = int(0, 3);
      const regNo = `DEMO${String(20261026).slice(2)}${String(i).padStart(4, '0')}`;
      const status = pick(STATUSES);
      const info = insVisit.run({
        registration_no: regNo,
        visitor_name: nameOf(LAST),
        visitor_father_name: nameOf(LAST),
        visitor_address: `${int(1, 200)} Demo Street, Sample Locality`,
        visitor_gender_id: pick(genderRows).id,
        visitor_age: int(18, 75),
        relationship_id: pick(relRows).id,
        id_proof_type_id: idp.id,
        id_number: idp.requires_number ? `DEMO-${int(100000, 999999)}` : null,
        is_international: rnd() < 0.05 ? 1 : 0,
        email: rnd() < 0.6 ? `demo${i}@example.invalid` : null,
        mobile_no: mobile(),
        state_id: jail.state_id,
        jail_id: jail.id,
        visit_date: dateOffset(int(-20, 25)),
        additional_visitor_count: addl,
        prisoner_name: nameOf(INMATE),
        prisoner_father_name: nameOf(LAST),
        prisoner_age: int(19, 70),
        prisoner_gender_id: pick(genderRows).id,
        physically_handicapped: rnd() < 0.08 ? 1 : 0,
        status,
        visit_mode: rnd() < 0.25 ? 'VIDEO' : 'PHYSICAL',
        created_at: `${dateOffset(int(-30, 0))} ${String(int(9, 17)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00`,
      });
      for (let a = 0; a < addl; a++) insAddVis.run(info.lastInsertRowid, nameOf(LAST));
      insAudit.run('visit_request', info.lastInsertRowid, 'CREATE', 'public-portal',
        status === 'APPROVED' ? 'demo-superintendent' : null,
        `seeded demonstration record, status ${status}`);
    }
  });
  visitTx();

  // --- grievances -----------------------------------------------------------
  const insGriev = db.prepare(`
    INSERT INTO grievance (
      reference_no, complainant_name, complainant_mobile, complainant_email,
      complainant_address, relationship_id, inmate_name, inmate_father_name,
      state_id, jail_id, category, subject, description, status, created_at, due_at, disposed_at
    ) VALUES (
      @reference_no, @complainant_name, @complainant_mobile, @complainant_email,
      @complainant_address, @relationship_id, @inmate_name, @inmate_father_name,
      @state_id, @jail_id, @category, @subject, @description, @status, @created_at, @due_at, @disposed_at
    )`);
  const insGrievAct = db.prepare(`INSERT INTO grievance_action (grievance_id, action, remark, actor_role, acted_at)
                                  VALUES (?, ?, ?, ?, ?)`);
  const CATEGORIES = ['Medical attention', 'Legal aid', 'Food and diet', 'Family contact',
                      'Property and belongings', 'Transfer request', 'Other'];
  const G_STATUS = ['RECEIVED', 'UNDER_EXAMINATION', 'ESCALATED', 'DISPOSED', 'CLOSED'];
  const grievTx = db.transaction(() => {
    for (let i = 1; i <= 60; i++) {
      const jail = pick(jailRows);
      const status = pick(G_STATUS);
      const created = dateOffset(int(-60, -1));
      const disposed = ['DISPOSED', 'CLOSED'].includes(status) ? dateOffset(int(0, 10)) : null;
      const info = insGriev.run({
        reference_no: `GRVDEMO${String(i).padStart(5, '0')}`,
        complainant_name: nameOf(LAST),
        complainant_mobile: mobile(),
        complainant_email: rnd() < 0.5 ? `demo${i}@example.invalid` : null,
        complainant_address: `${int(1, 200)} Demo Road, Sample Town`,
        relationship_id: pick(relRows).id,
        inmate_name: nameOf(INMATE),
        inmate_father_name: nameOf(LAST),
        state_id: jail.state_id,
        jail_id: jail.id,
        category: pick(CATEGORIES),
        subject: `Demonstration grievance ${i}`,
        description: 'Synthetic grievance text used to demonstrate the local workflow. ' +
                     'It does not describe a real person or a real complaint.',
        status,
        created_at: `${created} 10:00:00`,
        due_at: dateOffset(int(1, 30)),
        disposed_at: disposed,
      });
      insGrievAct.run(info.lastInsertRowid, 'RECEIVED', 'Logged by the public portal',
        'citizen', `${created} 10:00:00`);
      if (status !== 'RECEIVED') {
        insGrievAct.run(info.lastInsertRowid, 'ASSIGNED', 'Assigned for examination',
          'demo-superintendent', `${dateOffset(int(-50, -1))} 11:00:00`);
      }
      if (disposed) {
        insGrievAct.run(info.lastInsertRowid, 'DISPOSED', 'Closed after examination',
          'demo-regional-dig', `${disposed} 16:00:00`);
      }
      insAudit.run('grievance', info.lastInsertRowid, 'CREATE', 'public-portal', null,
        `seeded demonstration grievance, status ${status}`);
    }
  });
  grievTx();

  // --- public listings ------------------------------------------------------
  const insAbs = db.prepare(`INSERT INTO absconder (name, father_name, state_id, jail_id, absconded_on, remarks)
                             VALUES (?,?,?,?,?,?)`);
  const insPar = db.prepare(`INSERT INTO parole_jumper (name, father_name, state_id, jail_id, parole_from, due_back_on, remarks)
                             VALUES (?,?,?,?,?,?,?)`);
  const insLock = db.prepare(`INSERT INTO lockup_report (state_id, jail_id, report_date, male_count, female_count, trans_count)
                              VALUES (?,?,?,?,?,?)`);
  const listTx = db.transaction(() => {
    for (let i = 0; i < 45; i++) {
      const j = pick(jailRows);
      insAbs.run(nameOf(INMATE), nameOf(LAST), j.state_id, j.id, dateOffset(-int(30, 900)),
        'Synthetic demonstration entry');
    }
    for (let i = 0; i < 38; i++) {
      const j = pick(jailRows);
      const from = -int(20, 400);
      insPar.run(nameOf(INMATE), nameOf(LAST), j.state_id, j.id, dateOffset(from),
        dateOffset(from + int(7, 30)), 'Synthetic demonstration entry');
    }
    // Seven days of lockup figures per jail.
    for (const j of jailRows) {
      for (let d = 0; d < 7; d++) {
        insLock.run(j.state_id, j.id, dateOffset(-d), int(40, 900), int(2, 90), int(0, 4));
      }
    }
  });
  listTx();

  // --- dashboard metrics ----------------------------------------------------
  const insStat = db.prepare(`INSERT INTO statistic_snapshot (snapshot_date, state_id, jail_id, metric, value)
                              VALUES (?,?,?,?,?)`);
  const statTx = db.transaction(() => {
    const today = dateOffset(0);
    for (const st of stateRows) {
      insStat.run(today, st.id, null, 'inmates_in_custody', int(400, 28000));
      insStat.run(today, st.id, null, 'sanctioned_capacity', int(500, 26000));
      insStat.run(today, st.id, null, 'visits_registered_today', int(10, 1400));
      insStat.run(today, st.id, null, 'court_hearings_today', int(5, 700));
      insStat.run(today, st.id, null, 'foreign_inmates', int(0, 450));
    }
  });
  statTx();

  const counts = {};
  for (const t of ['state', 'jail', 'relationship', 'id_proof_type', 'gender',
                   'visit_request', 'additional_visitor', 'grievance', 'grievance_action',
                   'absconder', 'parole_jumper', 'lockup_report', 'statistic_snapshot', 'audit_log']) {
    counts[t] = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  }
  db.close();

  console.log('Seeded local demonstration database (all records synthetic).');
  console.log(`  file: ${DB_PATH}`);
  console.log('  reference lists transcribed from the captured public form options:');
  console.log(`    states ${counts.state}, id proof types ${counts.id_proof_type}, ` +
              `genders ${counts.gender}`);
  const shared = relationships.filter((r) => csRelationships.includes(r)).length;
  console.log(`    relationships ${counts.relationship}: ${relationships.length} from the NPIP ` +
              `visit form, ${csRelationships.length} from the Citizen Services form ` +
              `(only ${shared} shared)`);
  console.log('  synthetic records:');
  for (const [t, n] of Object.entries(counts)) {
    if (['state', 'relationship', 'id_proof_type', 'gender'].includes(t)) continue;
    console.log(`    ${t.padEnd(20)} ${n}`);
  }
}

main();
