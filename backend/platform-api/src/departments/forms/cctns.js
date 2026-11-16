'use strict';

/**
 * CCTNS: FIR registration and police verification requests.
 *
 * FIR particulars are the ones the eCourts Case Information Format and the
 * e-Forensics CESF ask for (police station, FIR number and year, sections, the
 * investigating officer). Verification requests follow the CCTNS report's
 * request model (section 11): purpose and lawful basis first, consent for a
 * person, the vehicle triple for a vehicle check, and the statuses of table 11.4.
 */

const { LISTS, CRIMES, RANK_NAME, sectionsFor, personFields, personInput, opt, pad, yearOf, editAction } = require('./common');

const SERVICES = [opt('Antecedent verification'), opt('Police clearance certificate (state portal)'), opt('Generate vehicle NOC')];
const PURPOSES = ['Employee verification', 'Tenant verification', 'Domestic help verification', 'Employment abroad', 'Passport', 'Pre-purchase vehicle verification', 'Other'].map((v) => opt(v));
const REQUESTERS = [opt('citizen', 'The subject (self)'), opt('employer', 'Employer'), opt('landlord', 'Landlord'), opt('insurer', 'Insurer'), opt('agency', 'Government agency')];
const OUTCOMES = [opt('no_record_found', 'No record found'), opt('record_found', 'Record found')];
const splitStation = (s) => { const [ps, district] = String(s).split(/,\s*/); return { ps, district }; };

/** Extra sections typed as "420 IPC, 66D IT Act". */
function parseSections(text) {
  return String(text || '').split(/[,;]+/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const m = x.match(/^([\dA-Za-z()]+)\s+(.+)$/);
    return m ? { section: m[1], act: m[2] } : { section: x, act: '' };
  });
}

module.exports = {
  code: 'cctns',
  personPrefix: 'CCT-P',
  title: 'CCTNS Police Station Office',
  short: 'CCTNS',
  officer: { username: 'cctns.officer', name: 'Rajendra Shelar', designation: 'Station House Officer', office: 'Shivajinagar Police Station, Pune' },

  types: {
    fir: {
      label: 'FIR', plural: 'FIRs',
      title: (r) => `FIR ${r.data.fir_no}`,
      subtitle: (r) => `${r.data.police_station} · ${r.data.offence}`,
      statusLabel: () => 'Registered',
    },
    verification_request: {
      label: 'Verification request', plural: 'Verification requests', closed: ['closed'],
      awaiting: ['submitted', 'blocked', 'in_progress', 'deferred', 'completed'],
      title: (r) => r.data.service,
      subtitle: (r, parties) => `${r.data.purpose} · ${parties.map((p) => p.name).join(', ')}`,
    },
  },

  forms: () => [
    {
      key: 'fir', recordType: 'fir', title: 'Register an FIR',
      description: 'First Information Report. The FIR number is issued in sequence for the police station and year.',
      submitLabel: 'Register FIR',
      sections: [
        { title: 'Police station and offence', fields: [
          { name: 'police_station', label: 'Police station', type: 'select', required: true, options: LISTS.policeStations, width: 'half' },
          { name: 'registered_on', label: 'Date of registration', type: 'date', required: true, notFuture: true, defaultToday: true, width: 'quarter' },
          { name: 'offence', label: 'Offence', type: 'select', required: true, options: LISTS.offences, width: 'half' },
          { name: 'offence_other', label: 'Describe the offence', type: 'text', required: true, max: 120, when: { field: 'offence', is: 'other' }, width: 'half' },
          { name: 'extra_sections', label: 'Sections of law', type: 'text', max: 200, required: false, help: 'Added to the sections of the offence chosen above (BNS from 1 July 2024, IPC before). For example: 351(2) BNS, 66D IT Act.', width: 'full' },
        ] },
        { title: 'Investigating officer', fields: [
          { name: 'io_name', label: 'Name', type: 'text', required: true, max: 100, width: 'half' },
          { name: 'io_rank', label: 'Rank', type: 'select', required: true, options: LISTS.ioRanks, width: 'half' },
        ] },
        { title: 'Accused', fields: [
          ...personFields('accused_', { nameLabel: 'Name of the accused' }),
          { name: 'accused_arrested_on', label: 'Arrested on', type: 'date', notFuture: true, width: 'third' },
        ] },
        { title: 'Complainant / informant', fields: [
          ...personFields('complainant_', { nameLabel: 'Name of the complainant' }),
          { name: 'complainant_role', label: 'The complainant is', type: 'select', required: true, options: [opt('complainant', 'The informant'), opt('victim', 'The victim (injured)')], default: 'complainant', width: 'third' },
          { name: 'complainant_relation', label: 'Relation to the victim', type: 'text', max: 60, width: 'third', help: 'For example: sister of the deceased.' },
        ] },
      ],
      build(v, ctx) {
        const { ps, district } = splitStation(v.police_station);
        const station = ps;
        const year = yearOf(v.registered_on);
        const no = `${pad(ctx.seq(`fir:${ps}:${year}`, 2000), 4)}/${year}`;
        const sections = (v.offence === 'other' ? [] : sectionsFor(v.offence, v.registered_on)).concat(parseSections(v.extra_sections));
        if (!sections.length) ctx.fail('extra_sections', 'Give at least one section of law.');
        const offence = v.offence === 'other' ? v.offence_other : CRIMES[v.offence].title;
        const accusedId = ctx.person(personInput(v, 'accused_', district));
        const complainantId = ctx.person(personInput(v, 'complainant_', district));
        if (accusedId === complainantId) ctx.fail('complainant_name', 'The complainant and the accused cannot be the same person.');
        const accused = ctx.store.person(accusedId);
        const complainant = ctx.store.person(complainantId);
        return { records: [{
          type: 'fir', ref: `${station} · FIR ${no}`, status: null, date: v.registered_on,
          data: {
            fir_no: no, fir_year: year, police_station: station, district, state: 'Maharashtra',
            registered_on: v.registered_on, offence, sections,
            investigating_officer: { name: v.io_name, rank: v.io_rank, rank_name: RANK_NAME[v.io_rank] },
            role: 'accused', relation: null,
            accused: [{ name: accused.name, ref: accused.ref, arrested_on: v.accused_arrested_on || null }],
            complainants: [{ name: complainant.name, ref: complainant.ref, role: v.complainant_role }],
            links: { forensic: null, cnr: null, prisoner_no: null },
          },
          history: [],
          parties: [
            { personId: accusedId, role: 'accused' },
            { personId: complainantId, role: v.complainant_role, relation: v.complainant_relation || null },
          ],
        }] };
      },
    },
    {
      key: 'verification', recordType: 'verification_request', title: 'Police verification request',
      description: 'Antecedent verification, police clearance certificate or vehicle no-objection check. The purpose and lawful basis are recorded first.',
      submitLabel: 'Submit request',
      sections: [
        { title: 'Request', fields: [
          { name: 'service', label: 'Service', type: 'select', required: true, options: SERVICES, width: 'half' },
          { name: 'purpose', label: 'Purpose', type: 'select', required: true, options: PURPOSES, width: 'half' },
          { name: 'requester', label: 'Requested by', type: 'select', required: true, options: REQUESTERS, width: 'half' },
          { name: 'lawful_basis', label: 'Lawful basis', type: 'text', required: true, max: 160, default: 'Consent of the subject, recorded', width: 'half' },
          { name: 'consent', label: 'The subject’s consent has been recorded (text version 2026-10-01)', type: 'checkbox', when: { field: 'service', not: 'Generate vehicle NOC' } },
        ] },
        { title: 'Subject', fields: personFields('subject_', { nameLabel: 'Name of the person', address: false, mobileRequired: true }) },
        { title: 'Vehicle', when: { field: 'service', is: 'Generate vehicle NOC' }, fields: [
          { name: 'reg', label: 'Registration number', type: 'text', required: true, max: 13, pattern: '^[A-Za-z]{2}\\s?\\d{1,2}\\s?[A-Za-z]{0,3}\\s?\\d{1,4}$', patternMessage: 'Use the form MH12AB1234.', when: { field: 'service', is: 'Generate vehicle NOC' }, width: 'third' },
          { name: 'chassis', label: 'Chassis number', type: 'text', required: true, max: 20, min: 6, when: { field: 'service', is: 'Generate vehicle NOC' }, width: 'third' },
          { name: 'engine', label: 'Engine number', type: 'text', required: true, max: 20, min: 6, when: { field: 'service', is: 'Generate vehicle NOC' }, width: 'third' },
        ] },
      ],
      build(v, ctx) {
        const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const vehicle = v.service === 'Generate vehicle NOC';
        const needsConsent = !vehicle && v.requester !== 'citizen';
        const blocked = needsConsent && !v.consent;
        const personId = ctx.person(personInput(v, 'subject_', null));
        const year = new Date().getFullYear();
        const reqId = `REQ-${year}-${pad(ctx.seq('request', 100000), 6)}`;
        const status = blocked ? 'blocked' : 'submitted';
        return { records: [{
          type: 'verification_request', ref: reqId, status, date: ctx.today(),
          data: {
            request_id: reqId, service: v.service, purpose: v.purpose, requester_role: v.requester,
            lawful_basis: v.lawful_basis,
            consent: v.consent || v.requester === 'citizen' ? { text_version: '2026-10-01', given_at: ctx.stamp(), method: 'OTP on the subject’s mobile' } : null,
            subject: vehicle ? { type: 'vehicle', registration_number: norm(v.reg), chassis_number: norm(v.chassis), engine_number: norm(v.engine), identity_complete: true } : { type: 'person' },
            state: v.service.startsWith('Police clearance') ? 'Maharashtra' : null,
            certificate_no: null, outcome: null, service_available: true,
            blocked_reason: blocked ? 'The subject’s consent has not been recorded.' : null, deferred_reason: null,
          },
          history: [{ status: 'submitted', at: ctx.today() }].concat(blocked ? [{ status: 'blocked', at: ctx.today() }] : []),
          parties: [{ personId, role: 'subject' }],
        }] };
      },
    },
  ],

  actions: {
    fir: [
      editAction({
        from: [null],
        fields: [
          { name: 'io_name', label: 'Investigating officer', type: 'text', required: true, max: 100, width: 'half' },
          { name: 'io_rank', label: 'Rank', type: 'select', required: true, options: LISTS.ioRanks, width: 'half' },
          { name: 'accused_arrested_on', label: 'Accused arrested on', type: 'date', notFuture: true, width: 'half' },
        ],
        prefill: (r) => ({
          io_name: (r.data.investigating_officer || {}).name, io_rank: (r.data.investigating_officer || {}).rank,
          accused_arrested_on: ((r.data.accused || [])[0] || {}).arrested_on,
        }),
        apply: (r, v) => ({ data: {
          ...r.data,
          investigating_officer: { name: v.io_name, rank: v.io_rank, rank_name: RANK_NAME[v.io_rank] },
          accused: (r.data.accused || []).map((a, i) => (i === 0 ? { ...a, arrested_on: v.accused_arrested_on || null } : a)),
        } }),
      }),
    ],
    verification_request: [
      { key: 'start', label: 'Start the official check', from: ['submitted'], to: 'in_progress' },
      {
        key: 'consent', label: 'Record consent', from: ['blocked'], to: 'submitted',
        fields: [{ name: 'method', label: 'How consent was given', type: 'select', required: true, options: [opt('OTP on the subject’s mobile'), opt('Signed consent form')] }],
        apply: (r, v, ctx) => ({ data: { ...r.data, consent: { text_version: '2026-10-01', given_at: ctx.stamp(), method: v.method }, blocked_reason: null }, note: v.method }),
      },
      {
        key: 'defer', label: 'Defer: service unavailable', tone: 'warning', from: ['in_progress'], to: 'deferred',
        fields: [{ name: 'reason', label: 'What happened', type: 'textarea', required: true, max: 250, default: 'The official service was unavailable during the check; a retry is scheduled.' }],
        apply: (r, v) => ({ data: { ...r.data, service_available: false, deferred_reason: v.reason }, note: v.reason }),
      },
      { key: 'resume', label: 'Retry the check', from: ['deferred'], to: 'in_progress', apply: (r) => ({ data: { ...r.data, service_available: true, deferred_reason: null } }) },
      {
        key: 'outcome', label: 'Record the outcome', from: ['in_progress'], to: 'completed',
        fields: [
          { name: 'result', label: 'Result', type: 'select', required: true, options: OUTCOMES },
          { name: 'detail', label: 'Details', type: 'textarea', max: 250, when: { field: 'result', is: 'record_found' }, required: true },
        ],
        apply(r, v, ctx) {
          const pcc = r.data.service.startsWith('Police clearance');
          const certificate = pcc ? `PCC/MH/${new Date().getFullYear()}/${pad(ctx.seq('pcc', 1000000), 6)}` : null;
          const text = v.result === 'no_record_found' ? 'No record found' : `Record found: ${v.detail}`;
          return {
            data: {
              ...r.data, certificate_no: certificate,
              outcome: {
                status: v.result, text, performed_at: ctx.stamp(),
                channel: pcc ? 'State citizen portal' : 'Digital Police Citizen Services', method: 'Manual browser session',
                artefact: r.data.service.startsWith('Antecedent') ? 'Response by e-mail' : 'PDF certificate',
              },
            },
            note: text,
          };
        },
      },
      { key: 'close', label: 'Close the request', tone: 'neutral', from: ['completed'], to: 'closed' },
      editAction({
        from: ['submitted', 'blocked', 'deferred'],
        fields: [
          { name: 'purpose', label: 'Purpose', type: 'select', required: true, options: PURPOSES, width: 'half' },
          { name: 'lawful_basis', label: 'Lawful basis', type: 'text', required: true, max: 160, width: 'half' },
        ],
        prefill: (r) => ({ purpose: r.data.purpose, lawful_basis: r.data.lawful_basis }),
        apply: (r, v) => ({ data: { ...r.data, purpose: v.purpose, lawful_basis: v.lawful_basis } }),
      }),
    ],
  },

  attention(store) {
    const n = (s) => store.db.prepare("SELECT COUNT(*) AS n FROM record WHERE record_type = 'verification_request' AND status = ?").get(s).n;
    return [
      { label: 'Verifications to start', n: n('submitted'), status: 'submitted' },
      { label: 'Checks in progress', n: n('in_progress'), status: 'in_progress' },
      { label: 'Blocked: consent missing', n: n('blocked'), status: 'blocked', tone: 'warning' },
      { label: 'Deferred', n: n('deferred'), status: 'deferred', tone: 'warning' },
    ];
  },
};
