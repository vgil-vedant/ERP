'use strict';

/**
 * e-Forensics: the forensic case-submission data set (CESF), field by field
 * from the e-Forensics report (section 5, groups B to M), and the laboratory
 * workflow of table 11.4: dispatched, deposited, registered, under examination,
 * report ready, closed, with deficient, returned and reopened.
 *
 * Rules mirrored from the report (table 11.3): exhibits are expected at the
 * laboratory within seven days of collection; a computer-forensics submission
 * must bring a blank storage device; the forwarding authority must hold the
 * laboratory's minimum rank.
 */

const { LISTS, CRIMES, DISTRICT_LIST, RANK_NAME, sectionsFor, personFields, personInput, opt, pad, yearOf } = require('./common');

const CATEGORIES = ['Accused', 'Suspect', 'Witness', 'Complainant', 'Complainant (injured)'].map((v) => opt(v));
const SEALS = [opt('Metallic seal'), opt('Brass seal')];
const TRANSPORT = [opt('Special messenger'), opt('Registered post')];
const labOf = (name) => DISTRICT_LIST.map((d) => d.lab).find((l) => l.name === name);
const DIVISION = Object.fromEntries(LISTS.divisions.map((d) => [d.value, d.label]));

function custodyEvent(r, type, from, to, extra) {
  const events = (r.data.custody_events || []).slice();
  events.push({ seq: events.length + 1, type, at: new Date().toISOString().slice(0, 16) + ':00+05:30', from, to, seal_state: 'Intact', ...(extra || {}) });
  return events;
}

module.exports = {
  code: 'eforensics',
  personPrefix: 'EFS-S',
  title: 'e-Forensics Laboratory Office',
  short: 'e-Forensics',
  officer: { username: 'eforensics.officer', name: 'Smita Bhalerao', designation: 'Assistant Director', office: 'Regional Forensic Science Laboratory, Pune' },

  types: {
    forensic_submission: {
      label: 'Forensic case', plural: 'Forensic cases', closed: ['closed'],
      title: (r) => r.data.lab_case_no,
      subtitle: (r) => `${r.data.division} · ${r.data.case.police_station}, FIR ${r.data.case.fir_number}`,
    },
  },

  forms: () => [{
    key: 'submission', recordType: 'forensic_submission', title: 'Forensic case submission (CESF)',
    description: 'Exhibits forwarded by the police for examination. The laboratory case number is issued on submission.',
    submitLabel: 'Submit to the laboratory',
    sections: [
      { title: 'Laboratory', fields: [
        { name: 'laboratory', label: 'Laboratory', type: 'select', required: true, options: LISTS.labs, width: 'half' },
        { name: 'division', label: 'Division', type: 'select', required: true, options: LISTS.divisions, width: 'half' },
      ] },
      { title: 'Case identification', fields: [
        { name: 'police_station', label: 'Police station', type: 'select', required: true, options: LISTS.policeStations, width: 'half' },
        { name: 'fir_no', label: 'Case / FIR number', type: 'text', required: true, pattern: '^\\d{1,5}/\\d{4}$', patternMessage: 'Use number/year, for example 0123/2026.', width: 'quarter' },
        { name: 'case_date', label: 'Case date', type: 'date', required: true, notFuture: true, width: 'quarter' },
        { name: 'offence', label: 'Offence', type: 'select', required: true, options: LISTS.offences.filter((o) => o.value !== 'other'), width: 'half' },
        { name: 'mlc_no', label: 'Medico-legal case no.', type: 'text', max: 30, width: 'quarter' },
        { name: 'pm_no', label: 'Post-mortem no.', type: 'text', max: 30, width: 'quarter' },
        { name: 'hospital', label: 'Hospital', type: 'text', max: 120, when: { field: 'mlc_no', truthy: true }, width: 'half' },
        { name: 'memo_no', label: 'Forwarding letter (memo) no.', type: 'text', required: true, max: 40, width: 'half' },
        { name: 'history', label: 'History of the case', type: 'textarea', required: true, max: 1500, rows: 3, width: 'full' },
      ] },
      { title: 'Investigating officer and forwarding authority', fields: [
        { name: 'io_name', label: 'Investigating officer', type: 'text', required: true, max: 100, width: 'half' },
        { name: 'io_rank', label: 'Rank', type: 'select', required: true, options: LISTS.ioRanks, width: 'half' },
        { name: 'authority_name', label: 'Forwarding authority', type: 'text', required: true, max: 100, width: 'half' },
        { name: 'authority_rank', label: 'Rank', type: 'select', required: true, options: LISTS.authorityRanks, width: 'half', help: 'The laboratory accepts forwarding letters from ACP rank and above.' },
      ] },
      { title: 'Person examined or connected', fields: [
        ...personFields('subject_', { nameLabel: 'Name', address: false }),
        { name: 'subject_category', label: 'Category of the person', type: 'select', required: true, options: CATEGORIES, width: 'third' },
      ] },
      { title: 'Exhibits', fields: [{
        name: 'exhibits', label: 'Exhibits', type: 'group', required: true, min: 1, max: 20, itemLabel: 'exhibit',
        fields: [
          { name: 'description', label: 'Description, packing and sealing', type: 'textarea', required: true, max: 300, rows: 2, width: 'full' },
          { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0, max: 100000, integer: false, width: 'quarter' },
          { name: 'unit', label: 'Unit', type: 'select', required: true, options: LISTS.units, width: 'quarter' },
          { name: 'preservative', label: 'Preservative', type: 'select', options: LISTS.preservatives, width: 'half' },
          { name: 'source', label: 'Source of the exhibit', type: 'text', required: true, max: 160, width: 'half' },
          { name: 'collected_by', label: 'Collected by', type: 'text', required: true, max: 100, width: 'quarter' },
          { name: 'collected_at', label: 'Collected at', type: 'datetime', required: true, notFuture: true, width: 'quarter' },
        ],
      }] },
      { title: 'Examination, seal and transport', fields: [
        { name: 'questions', label: 'Questions to be answered (one per line)', type: 'textarea', required: true, max: 1000, rows: 3, width: 'full' },
        { name: 'seal_type', label: 'Seal', type: 'select', required: true, options: SEALS, width: 'third' },
        { name: 'seal_id', label: 'Seal identifier', type: 'text', required: true, max: 40, width: 'third' },
        { name: 'transport', label: 'Transport', type: 'select', required: true, options: TRANSPORT, width: 'third' },
        { name: 'messenger', label: 'Messenger (name and buckle no.)', type: 'text', required: true, max: 120, when: { field: 'transport', is: 'Special messenger' }, width: 'half' },
        { name: 'storage_device', label: 'A blank storage device of equal or greater capacity accompanies the exhibits', type: 'checkbox', when: { field: 'division', is: 'CYB' } },
        { name: 'authorisation', label: 'The forwarding authority has authorised the laboratory to open the seals and take portions of the exhibits', type: 'checkbox' },
        { name: 'declaration', label: 'The submission guidelines have been read and followed', type: 'checkbox' },
      ] },
    ],
    rules(v) {
      const e = {};
      if (!v.authorisation) e.authorisation = 'The authorisation to open the seals is mandatory on the CESF.';
      if (!v.declaration) e.declaration = 'The declaration is mandatory on the CESF.';
      if (v.division === 'CYB' && !v.storage_device) e.storage_device = 'Computer forensics: a blank storage device must accompany the exhibits.';
      const now = Date.now();
      (v.exhibits || []).forEach((x, i) => {
        const t = Date.parse(`${x.collected_at}:00+05:30`);
        if (Number.isFinite(t) && now - t > 7 * 86400000) e[`exhibits.${i}.collected_at`] = 'Exhibits are expected at the laboratory within seven days of collection.';
      });
      return e;
    },
    build(v, ctx) {
      const lab = labOf(v.laboratory);
      const [ps, district] = v.police_station.split(/,\s*/);
      const station = ps;
      const year = new Date().getFullYear();
      const labNo = `${lab.prefix}-${lab.code}/${v.division}/${year}/${pad(ctx.seq(`lab:${lab.code}:${v.division}:${year}`, 2000), 4)}`;
      const personId = ctx.person(personInput(v, 'subject_', district));
      const io = `${v.io_rank} ${v.io_name}`;
      const exhibits = v.exhibits.map((x, i) => ({
        serial: i + 1, description: x.description, quantity: { value: x.quantity, unit: x.unit },
        preservative: x.preservative || null, source: x.source, parcels: 1, collected_by: x.collected_by,
        collected_at: `${x.collected_at}:00+05:30`,
      }));
      const first = exhibits.map((x) => x.collected_at).sort()[0];
      const messenger = v.transport === 'Special messenger' ? v.messenger : 'India Post (registered)';
      return { records: [{
        type: 'forensic_submission', ref: labNo, status: 'dispatched', date: ctx.today(),
        data: {
          lab_case_no: labNo, laboratory: v.laboratory, division: DIVISION[v.division],
          receipt: { number: null, issued_at: null },
          case: {
            police_station: station, case_number: v.fir_no, case_date: v.case_date, fir_number: v.fir_no,
            sections: sectionsFor(v.offence, v.case_date), mlc_number: v.mlc_no || null, post_mortem_number: v.pm_no || null,
            hospital: v.mlc_no || v.pm_no ? (v.hospital || null) : null, history: v.history, offence: CRIMES[v.offence].title,
          },
          subject_category: v.subject_category,
          investigating_officer: { name: v.io_name, rank: v.io_rank, rank_name: RANK_NAME[v.io_rank] },
          forwarding_authority: { name: v.authority_name, rank: v.authority_rank, rank_name: RANK_NAME[v.authority_rank], rank_rule_satisfied: ['ACP', 'DCP'].includes(v.authority_rank) },
          memo_number: v.memo_no, exhibits,
          questions: v.questions.split(/\r?\n/).map((q) => q.trim()).filter(Boolean),
          seal: { type: v.seal_type, identifier: v.seal_id, specimen_supplied: true, attested_by: 'Station House Officer', matches_specimen: true },
          transport: v.transport,
          custody_events: [
            { seq: 1, type: 'Collected', at: first, from: null, to: io, seal_state: 'Applied' },
            { seq: 2, type: 'Handed to messenger', at: ctx.stamp(), from: io, to: messenger, seal_state: 'Intact' },
          ],
          declaration: { guidelines_read: true, signed_at: ctx.stamp() },
          storage_device_supplied: v.division === 'CYB' ? true : null,
          report: null, deficiency: null,
          dates: { collected: first.slice(0, 10), dispatched: ctx.today(), deposited: null },
        },
        history: [{ status: 'dispatched', at: ctx.today() }],
        parties: [{ personId, role: v.subject_category === 'Accused' || v.subject_category === 'Suspect' ? 'accused' : v.subject_category.startsWith('Complainant (') ? 'victim' : 'complainant', label: v.subject_category }],
      }] };
    },
  }],

  actions: {
    forensic_submission: [
      {
        key: 'deposit', label: 'Accept at the counter', from: ['dispatched'], to: 'deposited',
        description: 'Issues the counter receipt and records the deposit in the custody chain.',
        apply(r, v, ctx) {
          const lab = labOf(r.data.laboratory);
          const no = `${lab.code}/RCPT/${new Date().getFullYear()}/${pad(ctx.seq(`receipt:${lab.code}`, 10000), 5)}`;
          const last = r.data.custody_events[r.data.custody_events.length - 1];
          return {
            data: { ...r.data, receipt: { number: no, issued_at: ctx.stamp() }, dates: { ...r.data.dates, deposited: ctx.today() }, custody_events: custodyEvent(r, 'Deposited at the counter', last.to, r.data.laboratory, { receipt_no: no }) },
            note: `receipt ${no}`,
          };
        },
      },
      {
        key: 'return', label: 'Return the consignment', tone: 'danger', from: ['dispatched'], to: 'returned',
        fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true, max: 300 }],
        apply: (r, v) => ({ data: { ...r.data, deficiency: v.reason }, note: v.reason }),
      },
      { key: 'register', label: 'Register the laboratory case', from: ['deposited'], to: 'registered' },
      { key: 'allocate', label: 'Allocate and start examination', from: ['registered', 'reopened'], to: 'under_examination' },
      {
        key: 'deficiency', label: 'Raise a deficiency', tone: 'warning', from: ['under_examination'], to: 'deficient',
        fields: [{ name: 'reason', label: 'Deficiency', type: 'textarea', required: true, max: 300 }],
        apply: (r, v) => ({ data: { ...r.data, deficiency: v.reason }, note: v.reason }),
      },
      {
        key: 'cured', label: 'Deficiency cured', from: ['deficient'], to: 'under_examination',
        fields: [{ name: 'note', label: 'What was supplied', type: 'textarea', required: true, max: 300 }],
        apply: (r, v) => ({ data: { ...r.data, deficiency: null }, note: v.note }),
      },
      {
        key: 'report', label: 'Report ready', from: ['under_examination'], to: 'report_ready',
        fields: [{ name: 'memo', label: 'Report memo / note', type: 'textarea', required: true, max: 300, default: 'Examination report forwarded to the investigating officer.' }],
        apply: (r, v, ctx) => ({ data: { ...r.data, report: { ready_on: ctx.today(), dispatched_on: null, note: v.memo } }, note: v.memo }),
      },
      {
        key: 'dispatch', label: 'Dispatch the report', from: ['report_ready'], to: 'closed',
        apply: (r, v, ctx) => ({ data: { ...r.data, report: { ...r.data.report, dispatched_on: ctx.today() }, custody_events: custodyEvent(r, 'Report and parcels returned', r.data.laboratory, r.data.case.police_station, { seal_state: 'Resealed by the laboratory' }) } }),
      },
      {
        key: 'reopen', label: 'Reopen for re-examination', tone: 'warning', from: ['closed'], to: 'reopened',
        fields: [{ name: 'order', label: 'Court’s recommendation or order', type: 'text', required: true, max: 160 }],
        apply: (r, v) => ({ data: { ...r.data, reopened_on: v.order }, note: v.order }),
      },
    ],
  },

  attention(store) {
    const n = (s) => store.db.prepare("SELECT COUNT(*) AS n FROM record WHERE status = ?").get(s).n;
    return [
      { label: 'In transit to the laboratory', n: n('dispatched'), status: 'dispatched' },
      { label: 'Awaiting registration', n: n('deposited'), status: 'deposited' },
      { label: 'Under examination', n: n('under_examination'), status: 'under_examination' },
      { label: 'Deficient', n: n('deficient'), status: 'deficient', tone: 'warning' },
      { label: 'Reports awaiting dispatch', n: n('report_ready'), status: 'report_ready' },
    ];
  },
};

