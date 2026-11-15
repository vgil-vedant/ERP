'use strict';

/**
 * ePrisons: custody of prisoners, and the two public journeys the ePrisons
 * report describes field by field: e-Mulakat visit registration (section 5.1
 * to 5.3, journey 9.1) and the grievance about an inmate (5.5, 5.6, journey 9.2).
 *
 * The visit and grievance forms list only prisoners actually in custody in
 * this department, so a visit can never be booked for someone who is not there.
 */

const { LISTS, CRIMES, DISTRICT_LIST, sectionsFor, personFields, personInput, opt, pad, yearOf } = require('./common');

const MODES = [opt('Physical'), opt('Video conference')];
const prisonCode = (name) => {
  for (const d of DISTRICT_LIST) {
    if (d.prison.name === name) return d.prison.code;
    if (d.womenPrison.name === name) return d.womenPrison.code;
  }
  return 'MHP';
};

/** Prisoners in custody, for the visit and grievance forms. */
function inmates(store) {
  return store.db.prepare(
    `SELECT p.person_ref, p.full_name, json_extract(r.data, '$.prisoner_no') AS no, json_extract(r.data, '$.prison') AS prison
     FROM record r JOIN record_party rp ON rp.record_id = r.id JOIN person p ON p.id = rp.person_id
     WHERE r.record_type = 'custody' AND r.status IN ('undertrial', 'convict') ORDER BY p.full_name`).all()
    .map((x) => ({ value: x.person_ref, label: `${x.full_name} · ${x.no} · ${x.prison}`, prison: x.prison }));
}
function custodyOf(store, personRef) {
  return store.db.prepare(
    `SELECT r.id FROM record r JOIN record_party rp ON rp.record_id = r.id JOIN person p ON p.id = rp.person_id
     WHERE r.record_type = 'custody' AND r.status IN ('undertrial', 'convict') AND p.person_ref = ?`).get(personRef);
}
const ageNow = (p) => (p.dob ? Math.floor((Date.now() - Date.parse(p.dob)) / 31557600000) : (p.profile && p.profile.age_declared) || null);
const genderWord = (g) => ({ M: 'Male', F: 'Female', T: 'Transgender' }[g] || g || '');

module.exports = {
  code: 'eprisons',
  personPrefix: 'EPR-P',
  title: 'ePrisons Prison Office',
  short: 'ePrisons',
  officer: { username: 'eprisons.officer', name: 'Ashok Jagtap', designation: 'Jailor', office: 'Yerawada Central Prison, Pune' },

  types: {
    custody: {
      label: 'Custody', plural: 'Prisoners', closed: ['released_bail', 'released_acquitted', 'released_sentence'],
      title: (r) => `Prisoner ${r.data.prisoner_no}`,
      subtitle: (r) => `${r.data.inmate.name} · ${r.data.prison}`,
    },
    visit_request: {
      label: 'e-Mulakat visit', plural: 'Visits', closed: ['visited', 'rejected'],
      title: (r) => `Visit ${r.data.registration_no}`,
      subtitle: (r) => `${r.data.visitor.name} to meet ${r.data.prisoner.name} · ${r.data.visit_date}`,
    },
    grievance: {
      label: 'Grievance', plural: 'Grievances', closed: ['disposed'],
      title: (r) => `Grievance ${r.ref}`,
      subtitle: (r) => `${r.data.category} · ${r.data.prisoner.name}`,
    },
  },

  forms: (store) => {
    const list = inmates(store);
    return [
      {
        key: 'admission', recordType: 'custody', title: 'Prisoner admission',
        description: 'Admission on a remand or committal warrant. The prisoner number is issued on admission.',
        submitLabel: 'Admit the prisoner',
        sections: [
          { title: 'Prisoner', fields: personFields('prisoner_', { nameLabel: 'Prisoner name', fatherRequired: true, ageRequired: true, minAge: 18, mobileRequired: false, aadhaarHelp: 'Optional. Links the prisoner to Aadhaar, as provided for by the MHA notifications.' }) },
          { title: 'Admission', fields: [
            { name: 'prison', label: 'Prison', type: 'select', required: true, options: LISTS.prisons, width: 'half' },
            { name: 'admitted_on', label: 'Admitted on', type: 'date', required: true, notFuture: true, width: 'quarter' },
            { name: 'warrant', label: 'Warrant', type: 'text', required: true, max: 160, default: 'Remand warrant of the Judicial Magistrate First Class', width: 'full' },
          ] },
          { title: 'Case', fields: [
            { name: 'police_station', label: 'Police station', type: 'select', required: true, options: LISTS.policeStations, width: 'half' },
            { name: 'fir_no', label: 'FIR number / year', type: 'text', required: true, pattern: '^\\d{1,5}/\\d{4}$', patternMessage: 'Use number/year, for example 0123/2026.', width: 'quarter' },
            { name: 'fir_date', label: 'FIR date', type: 'date', required: true, notFuture: true, width: 'quarter' },
            { name: 'offence', label: 'Offence', type: 'select', required: true, options: LISTS.offences.filter((o) => o.value !== 'other'), width: 'half' },
            { name: 'cnr', label: 'CNR (if the case is registered)', type: 'text', max: 16, pattern: '^[A-Z]{4}\\d{12}$', patternMessage: 'A CNR has 16 characters, for example MHPU010012342026.', width: 'half' },
            { name: 'court', label: 'Court', type: 'text', max: 160, width: 'full' },
          ] },
        ],
        build(v, ctx) {
          const code = prisonCode(v.prison);
          const year = yearOf(v.admitted_on);
          const no = `${code}/UT/${year}/${pad(ctx.seq(`prisoner:${code}:UT:${year}`, 7000), 5)}`;
          const [ps, district] = v.police_station.split(/,\s*/);
          const personId = ctx.person(personInput(v, 'prisoner_', district));
          const p = ctx.store.person(personId);
          if (custodyOf(ctx.store, p.ref)) ctx.fail('prisoner_name', 'This person is already in custody.');
          return { records: [{
            type: 'custody', ref: no, status: 'undertrial', date: v.admitted_on,
            data: {
              prisoner_no: no, earlier_numbers: [], prison: v.prison, state: 'Maharashtra',
              category: 'Undertrial prisoner', in_custody: true,
              inmate: { name: p.name, father_name: v.prisoner_father, age: v.prisoner_age, gender: genderWord(v.prisoner_gender) },
              admitted_on: v.admitted_on, warrant: v.warrant,
              fir: { police_station: ps, fir_no: v.fir_no }, cnr: v.cnr || null,
              sections: sectionsFor(v.offence, v.fir_date), offence: CRIMES[v.offence].title, court: v.court || null,
              sentence: null, expected_release: null, released_on: null, release_reason: null,
              next_production: null, aadhaar_linked: !!v.prisoner_aadhaar, furlough: [], visits_received: [],
            },
            history: [{ status: 'undertrial', at: v.admitted_on }],
            parties: [{ personId, role: 'inmate' }],
          }] };
        },
      },
      {
        key: 'visit', recordType: 'visit_request', title: 'e-Mulakat visit registration',
        description: 'New visitor registration (e-Mulakat). The prison verifies the request before a slot is allotted.',
        submitLabel: 'Register the visit',
        sections: [
          { title: 'Visitor', fields: [
            ...personFields('visitor_', { nameLabel: 'Visitor name', fatherRequired: true, ageRequired: true, minAge: 1, mobileRequired: true, addressRequired: true }),
            { name: 'visitor_email', label: 'E-mail', type: 'email', required: true, width: 'half' },
            { name: 'relation', label: 'Relation with the prisoner', type: 'select', required: true, options: LISTS.relations, width: 'third' },
            { name: 'id_proof', label: 'Identity proof', type: 'select', required: true, options: LISTS.idProof, width: 'third' },
            { name: 'id_number', label: 'ID number', type: 'text', max: 20, pattern: '^[A-Za-z0-9 ]+$', patternMessage: 'Letters, digits and spaces only.', when: { field: 'id_proof', in: ['DRIVING LICENSE', 'OTHERS', 'PAN', 'PASSPORT', 'VOTER ID'] }, required: true, width: 'third' },
            { name: 'international', label: 'International visitor', type: 'checkbox' },
          ] },
          { title: 'To meet', fields: [
            { name: 'prisoner', label: 'Prisoner', type: 'select', required: true, options: list, width: 'full', empty: 'No prisoner is in custody in this department.' },
            { name: 'visit_date', label: 'Visit date', type: 'date', required: true, notPast: true, width: 'third' },
            { name: 'mode', label: 'Visit mode', type: 'select', required: true, options: MODES, width: 'third' },
            { name: 'additional', label: 'Additional visitors', type: 'number', min: 0, max: 9, default: 0, width: 'third' },
            { name: 'additional_names', label: 'Names of additional visitors', type: 'text', max: 150, when: { field: 'additional', not: 0 }, width: 'full' },
          ] },
        ],
        rules: (v) => (v.id_proof === 'AADHAAR' && !v.visitor_aadhaar ? { visitor_aadhaar: 'The identity proof chosen is Aadhaar: enter the Aadhaar number.' } : {}),
        build(v, ctx) {
          const c = custodyOf(ctx.store, v.prisoner);
          if (!c) ctx.fail('prisoner', 'This prisoner is no longer in custody. Choose again.');
          const custody = ctx.store.record(c.id);
          const inmate = ctx.store.partiesOf(c.id)[0];
          const visitorId = ctx.person(personInput(v, 'visitor_', null));
          if (visitorId === inmate.id) ctx.fail('visitor_name', 'A prisoner cannot register a visit to themselves.');
          const visitor = ctx.store.person(visitorId);
          const year = yearOf(v.visit_date);
          const reg = `MUL${year}MH${pad(ctx.seq(`visit:${year}`, 1000000), 7)}`;
          const masked = v.id_proof === 'AADHAAR' ? `XXXXXXXX${v.visitor_aadhaar.slice(-4)}` : v.id_number ? `${'X'.repeat(Math.max(0, v.id_number.length - 4))}${v.id_number.slice(-4)}` : null;
          const visit = {
            type: 'visit_request', ref: reg, status: 'registered', date: ctx.today(),
            data: {
              registration_no: reg, visit_date: v.visit_date, visit_mode: v.mode, prison: custody.data.prison, state: 'Maharashtra',
              prisoner: { name: inmate.name, father_name: custody.data.inmate.father_name, age: custody.data.inmate.age || ageNow(inmate), gender: custody.data.inmate.gender, ref: inmate.ref },
              visitor: { name: visitor.name, father_or_husband: v.visitor_father, gender: genderWord(v.visitor_gender), age: v.visitor_age, address: v.visitor_address },
              relationship: v.relation,
              identity_proof: { type: v.id_proof, number_masked: masked },
              international_visitor: !!v.international, additional_visitors: v.additional || 0,
              additional_names: v.additional ? v.additional_names : null,
              slot: null, rejection_reason: null,
            },
            history: [{ status: 'registered', at: ctx.today() }, { status: 'verification', at: ctx.today() }],
            parties: [{ personId: visitorId, role: 'visitor' }],
          };
          // the inmate's custody record lists the visit too
          const visits = (custody.data.visits_received || []).filter((x) => x.reg_no !== reg);
          visits.unshift({ reg_no: reg, date: v.visit_date, mode: v.mode, status: 'registered', visitor: visitor.name, visitor_ref: visitor.ref, relation: v.relation });
          ctx.store.saveRecord({ ref: custody.ref, type: custody.type, status: custody.status, date: custody.date, data: { ...custody.data, visits_received: visits }, history: custody.history }, custody.createdBy);
          return { records: [visit], touched: [custody.id] };
        },
      },
      {
        key: 'grievance', recordType: 'grievance', title: 'Grievance about a prisoner',
        description: 'A complaint about a prisoner’s treatment, under one of the four fixed categories (at most 250 characters).',
        submitLabel: 'Submit grievance',
        sections: [
          { title: 'Complainant', fields: [
            ...personFields('complainant_', { nameLabel: 'Name', mobileRequired: true, address: false }).filter((f) => !/age$/.test(f.name)),
            { name: 'complainant_email', label: 'E-mail', type: 'email', required: true, width: 'half' },
            { name: 'relation', label: 'Relation with the prisoner', type: 'select', required: true, options: LISTS.relations, width: 'half' },
          ] },
          { title: 'Grievance', fields: [
            { name: 'prisoner', label: 'Prisoner', type: 'select', required: true, options: list, width: 'full', empty: 'No prisoner is in custody in this department.' },
            { name: 'category', label: 'Category', type: 'select', required: true, options: LISTS.grievance, width: 'half' },
            { name: 'message', label: 'Message', type: 'textarea', required: true, max: 250, rows: 3, width: 'full' },
          ] },
        ],
        build(v, ctx) {
          const c = custodyOf(ctx.store, v.prisoner);
          if (!c) ctx.fail('prisoner', 'This prisoner is no longer in custody. Choose again.');
          const custody = ctx.store.record(c.id);
          const inmate = ctx.store.partiesOf(c.id)[0];
          const personId = ctx.person(personInput(v, 'complainant_', null));
          const year = new Date().getFullYear();
          const ref = `GRV/MH/${year}/${pad(ctx.seq(`grievance:${year}`, 10000), 5)}`;
          return { records: [{
            type: 'grievance', ref, status: 'acknowledged', date: ctx.today(),
            data: {
              category: v.category, message: v.message, relation: v.relation, prison: custody.data.prison, state: 'Maharashtra',
              prisoner: { name: inmate.name, gender: custody.data.inmate.gender, age: custody.data.inmate.age, ref: inmate.ref },
              action: null,
            },
            history: [{ status: 'submitted', at: ctx.today() }, { status: 'acknowledged', at: ctx.today() }],
            parties: [{ personId, role: 'complainant' }],
          }] };
        },
      },
    ];
  },

  actions: {
    custody: [
      {
        key: 'production', label: 'Set next court production', from: ['undertrial'],
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true, notPast: true, width: 'half' },
          { name: 'mode', label: 'Mode', type: 'select', required: true, options: MODES, width: 'half' },
          { name: 'purpose', label: 'Purpose', type: 'text', required: true, max: 120 },
        ],
        apply: (r, v) => ({ data: { ...r.data, next_production: { date: v.date, mode: v.mode, purpose: v.purpose } }, note: `${v.date} (${v.mode})` }),
      },
      {
        key: 'convict', label: 'Record conviction', tone: 'warning', from: ['undertrial'], to: 'convict',
        description: 'The prisoner becomes a convict and is given a new prisoner number.',
        fields: [
          { name: 'date', label: 'Date of conviction', type: 'date', required: true, notFuture: true, width: 'half' },
          { name: 'expected', label: 'Expected release', type: 'date', width: 'half' },
          { name: 'sentence', label: 'Sentence', type: 'text', required: true, max: 160 },
        ],
        apply(r, v, ctx) {
          const code = r.data.prisoner_no.split('/')[0];
          const year = yearOf(v.date);
          const ct = `${code}/CT/${year}/${pad(ctx.seq(`prisoner:${code}:CT:${year}`, 1000), 5)}`;
          return {
            data: { ...r.data, prisoner_no: ct, earlier_numbers: [r.data.prisoner_no].concat(r.data.earlier_numbers || []), category: 'Convicted prisoner', sentence: v.sentence, expected_release: v.expected || null, next_production: null },
            at: v.date, note: `new number ${ct}`,
          };
        },
      },
      {
        key: 'bail', label: 'Release on bail', from: ['undertrial'], to: 'released_bail',
        fields: [{ name: 'date', label: 'Released on', type: 'date', required: true, notFuture: true, width: 'half' }, { name: 'order', label: 'Bail order', type: 'text', required: true, max: 160, default: 'Bail granted by the Sessions Court' }],
        apply: (r, v) => ({ data: { ...r.data, in_custody: false, category: 'Released (undertrial on bail)', released_on: v.date, release_reason: v.order, next_production: null }, at: v.date, note: v.order }),
      },
      {
        key: 'acquit', label: 'Release on acquittal', from: ['undertrial'], to: 'released_acquitted',
        fields: [{ name: 'date', label: 'Released on', type: 'date', required: true, notFuture: true }],
        apply: (r, v) => ({ data: { ...r.data, in_custody: false, category: 'Released (acquitted)', released_on: v.date, release_reason: 'Acquitted by the court', next_production: null }, at: v.date }),
      },
      {
        key: 'complete', label: 'Release: sentence completed', from: ['convict'], to: 'released_sentence',
        fields: [{ name: 'date', label: 'Released on', type: 'date', required: true, notFuture: true }],
        apply: (r, v) => ({ data: { ...r.data, in_custody: false, category: 'Released (sentence completed)', released_on: v.date, release_reason: 'Sentence completed, with set-off and remission', expected_release: null }, at: v.date }),
      },
    ],
    visit_request: [
      {
        key: 'approve', label: 'Approve and allot a slot', from: ['registered'], to: 'approved',
        fields: [{ name: 'slot', label: 'Time window', type: 'text', required: true, max: 80, default: '11:00 to 11:30' }],
        apply: (r, v, ctx) => syncVisit(r, ctx, 'approved', { slot: r.data.visit_mode === 'Video conference' ? `${v.slot}, PIN sent by e-mail` : v.slot }),
      },
      {
        key: 'reject', label: 'Reject', tone: 'danger', from: ['registered'], to: 'rejected',
        fields: [{ name: 'reason', label: 'Reason', type: 'text', required: true, max: 200 }],
        apply: (r, v, ctx) => syncVisit(r, ctx, 'rejected', { rejection_reason: v.reason }),
      },
      { key: 'visited', label: 'Mark visit completed', from: ['approved'], to: 'visited', apply: (r, v, ctx) => syncVisit(r, ctx, 'visited', {}) },
    ],
    grievance: [
      { key: 'verify', label: 'Start verification', from: ['acknowledged'], to: 'under_verification' },
      {
        key: 'dispose', label: 'Dispose with action taken', from: ['under_verification'], to: 'disposed',
        fields: [{ name: 'action', label: 'Action taken', type: 'textarea', required: true, max: 300 }],
        apply: (r, v) => ({ data: { ...r.data, action: v.action }, note: v.action }),
      },
    ],
  },

  attention(store) {
    const n = (sql) => store.db.prepare(sql).get().n;
    return [
      { label: 'Prisoners in custody', n: n("SELECT COUNT(*) AS n FROM record WHERE record_type = 'custody' AND status IN ('undertrial', 'convict')") },
      { label: 'Visits awaiting verification', n: n("SELECT COUNT(*) AS n FROM record WHERE record_type = 'visit_request' AND status = 'registered'"), status: 'registered' },
      { label: 'Grievances open', n: n("SELECT COUNT(*) AS n FROM record WHERE record_type = 'grievance' AND status <> 'disposed'"), tone: 'warning' },
      { label: 'Court productions in 7 days', n: n("SELECT COUNT(*) AS n FROM record WHERE record_type = 'custody' AND json_extract(data, '$.next_production.date') BETWEEN date('now') AND date('now', '+7 days')") },
    ];
  },
};

/** A visit's new status, mirrored on the prisoner's custody record. */
function syncVisit(r, ctx, status, extra) {
  const touched = [];
  const ref = r.data.prisoner && r.data.prisoner.ref;
  const c = ref && ctx.store.db.prepare(
    `SELECT r.id FROM record r JOIN record_party rp ON rp.record_id = r.id JOIN person p ON p.id = rp.person_id
     WHERE r.record_type = 'custody' AND p.person_ref = ? ORDER BY r.id DESC`).get(ref);
  if (c) {
    const custody = ctx.store.record(c.id);
    const visits = (custody.data.visits_received || []).map((x) => (x.reg_no === r.ref ? { ...x, status } : x));
    ctx.store.saveRecord({ ref: custody.ref, type: custody.type, status: custody.status, date: custody.date, data: { ...custody.data, visits_received: visits }, history: custody.history }, custody.createdBy);
    touched.push(custody.id);
  }
  return { data: { ...r.data, ...extra }, touched };
}
