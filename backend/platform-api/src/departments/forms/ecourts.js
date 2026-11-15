'use strict';

/**
 * eCourts: filing and the life of a case, from the Filing Form and the Case
 * Information Format (eCourts report, section 5, groups N and O) through the
 * matter statuses of table 11.4: filed, objected, registered (CNR and case
 * number recorded), pending with its hearings, disposed, in appeal, closed.
 */

const { LISTS, CRIMES, DISTRICT_LIST, sectionsFor, personFields, personInput, opt, pad } = require('./common');

const CRIMINAL_TYPES = [
  ['Sessions Case', 'S.C.', true], ['Regular Criminal Case', 'R.C.C.', false], ['Special Case (NDPS)', 'NDPS Spl. Case', true],
  ['Criminal Bail Application', 'B.A.', true], ['Criminal Miscellaneous Application (maintenance)', 'Cri. M.A.', false],
];
const CIVIL_TYPES = [['Regular Civil Suit', 'R.C.S.'], ['Special Civil Suit', 'S.C.S.'], ['Marriage Petition', 'M.J. Pet.'], ['Regular Civil Appeal', 'R.C.A.']];
const ABBR = Object.fromEntries(CRIMINAL_TYPES.map(([t, a]) => [t, a]).concat(CIVIL_TYPES));
const BENCHES = ['Additional Sessions Judge', 'Judicial Magistrate First Class', 'Civil Judge Senior Division', 'Civil Judge Junior Division', 'Family Court'].map((v) => opt(v));
const MODES = [opt('Physical'), opt('Video conference')];
const OUTCOMES = [opt('convicted', 'Convicted'), opt('acquitted', 'Acquitted'), opt('discharged', 'Discharged'), opt('compounded', 'Compounded'), opt('decreed', 'Decreed'), opt('dismissed', 'Dismissed')];
const districtOf = (name) => DISTRICT_LIST.find((d) => d.name === name);

module.exports = {
  code: 'ecourts',
  personPrefix: 'ECT-L',
  title: 'eCourts Registry',
  short: 'eCourts',
  officer: { username: 'ecourts.officer', name: 'Mohan Lokhande', designation: 'Registrar (Judicial)', office: 'District and Sessions Court, Pune' },

  types: {
    court_case: {
      label: 'Case', plural: 'Cases', closed: ['disposed', 'closed'],
      title: (r) => `${r.data.case_no || `Filing ${r.data.filing_no}`}`,
      subtitle: (r) => `${r.data.parties.petitioner} v. ${r.data.parties.respondent}`,
    },
  },

  forms: () => [{
    key: 'case', recordType: 'court_case', title: 'Case filing',
    description: 'A case lodged at the filing counter. The filing number is issued now; the CNR and the case number on registration.',
    submitLabel: 'File the case',
    sections: [
      { title: 'Court', fields: [
        { name: 'category', label: 'Category', type: 'select', required: true, options: [opt('Criminal'), opt('Civil')], default: 'Criminal', width: 'quarter' },
        { name: 'crim_type', label: 'Case type', type: 'select', required: true, options: CRIMINAL_TYPES.map(([t]) => opt(t)), when: { field: 'category', is: 'Criminal' }, width: 'half' },
        { name: 'civil_type', label: 'Case type', type: 'select', required: true, options: CIVIL_TYPES.map(([t]) => opt(t)), when: { field: 'category', is: 'Civil' }, width: 'half' },
        { name: 'district', label: 'District', type: 'select', required: true, options: LISTS.districts, width: 'quarter' },
        { name: 'bench', label: 'Court', type: 'select', required: true, options: BENCHES, width: 'half' },
        { name: 'court_no', label: 'Court no.', type: 'number', required: true, min: 1, max: 40, width: 'quarter' },
        { name: 'nature', label: 'Nature of the suit / relief sought', type: 'text', required: true, max: 200, when: { field: 'category', is: 'Civil' }, width: 'full' },
      ] },
      { title: 'Criminal particulars', when: { field: 'category', is: 'Criminal' }, fields: [
        { name: 'police_station', label: 'Police station', type: 'select', required: true, options: LISTS.policeStations, when: { field: 'category', is: 'Criminal' }, width: 'half' },
        { name: 'fir_no', label: 'FIR number / year', type: 'text', required: true, pattern: '^\\d{1,5}/\\d{4}$', patternMessage: 'Use number/year, for example 0123/2026.', when: { field: 'category', is: 'Criminal' }, width: 'quarter' },
        { name: 'fir_date', label: 'FIR date', type: 'date', required: true, notFuture: true, when: { field: 'category', is: 'Criminal' }, width: 'quarter' },
        { name: 'offence', label: 'Offence', type: 'select', required: true, options: LISTS.offences.filter((o) => o.value !== 'other'), when: { field: 'category', is: 'Criminal' }, width: 'half' },
        { name: 'prosecutor', label: 'Public prosecutor', type: 'text', max: 100, when: { field: 'category', is: 'Criminal' }, width: 'half' },
      ] },
      { title: 'Accused / respondent', fields: [
        ...personFields('respondent_', { nameLabel: 'Name' }),
      ] },
      { title: 'Petitioner / plaintiff', when: { field: 'category', is: 'Civil' }, fields: personFields('petitioner_', { nameLabel: 'Name' }).map((f) => ({ ...f, when: { field: 'category', is: 'Civil' }, required: f.required })) },
      { title: 'Informant (criminal, optional)', when: { field: 'category', is: 'Criminal' }, fields: personFields('informant_', { nameLabel: 'Name of the informant' }).map((f) => ({ ...f, when: { field: 'category', is: 'Criminal' }, required: false })) },
      { title: 'Advocate', fields: [
        { name: 'advocate', label: 'Advocate name', type: 'text', max: 100, width: 'half' },
        { name: 'bar', label: 'Bar registration (state/number/year)', type: 'text', max: 20, pattern: '^[A-Z]{2}/\\d{1,6}/\\d{4}$', patternMessage: 'Use the form MH/1234/2010.', width: 'half' },
      ] },
    ],
    build(v, ctx) {
      const d = districtOf(v.district);
      const criminal = v.category === 'Criminal';
      const type = criminal ? v.crim_type : v.civil_type;
      const year = new Date().getFullYear();
      const est = v.bench === 'Additional Sessions Judge' ? '01' : v.bench === 'Judicial Magistrate First Class' ? '02' : '03';
      const filing = `${pad(ctx.seq(`filing:${d.cnr}${est}:${year}`, 4000), 4)}/${year}`;
      const court = v.bench === 'Family Court' ? `Family Court No. ${v.court_no}, ${d.name}`
        : `${v.bench}, Court No. ${v.court_no}, ${v.bench === 'Additional Sessions Judge' ? d.court : d.court.replace('District and Sessions Court', 'Court Complex')}`;
      const respondentId = ctx.person(personInput(v, 'respondent_', d.name));
      const respondent = ctx.store.person(respondentId);
      const parties = [{ personId: respondentId, role: criminal ? 'accused' : 'respondent', label: criminal ? 'Accused No. 1' : 'Respondent' }];
      let petitioner = null;
      if (!criminal) {
        const pid = ctx.person(personInput(v, 'petitioner_', d.name));
        if (pid === respondentId) ctx.fail('petitioner_name', 'The petitioner and the respondent cannot be the same person.');
        petitioner = ctx.store.person(pid);
        parties.push({ personId: pid, role: 'plaintiff', label: 'Plaintiff' });
      }
      const witnesses = [];
      if (criminal && v.informant_name) {
        const iid = ctx.person(personInput(v, 'informant_', d.name));
        if (iid !== respondentId) {
          const p = ctx.store.person(iid);
          parties.push({ personId: iid, role: 'complainant', label: 'Informant (prosecution witness)' });
          witnesses.push({ name: p.name, ref: p.ref, role: 'complainant' });
        }
      }
      const [ps] = criminal ? v.police_station.split(/,\s*/) : [null];
      return { records: [{
        type: 'court_case', ref: `FIL-${d.cnr}${est}-${filing.replace('/', '-')}`, status: 'filed', date: ctx.today(),
        data: {
          cnr: null, case_type: type, case_abbr: ABBR[type], case_no: null, filing_no: filing,
          court, court_complex: d.complex, district: d.name, state: 'Maharashtra', est,
          case_state: 'Pending', filed_on: ctx.today(), registered_on: null, disposed_on: null,
          outcome: null, judgment: null, appeal: null, nature: criminal ? null : v.nature,
          parties: {
            petitioner: criminal ? `State of Maharashtra (through ${ps})` : petitioner.name,
            petitioner_ref: criminal ? null : petitioner.ref,
            respondent: respondent.name, respondent_ref: respondent.ref, witnesses,
          },
          party_role: criminal ? 'Accused No. 1' : 'Respondent',
          acts: criminal ? sectionsFor(v.offence, v.fir_date) : [],
          offence: criminal ? CRIMES[v.offence].title : null,
          police_station: criminal ? ps : null, fir_no: criminal ? v.fir_no : null,
          prosecutor: criminal && v.prosecutor ? `Adv. ${v.prosecutor.replace(/^Adv\.?\s*/i, '')}, Additional Public Prosecutor` : null,
          defence_advocate: v.advocate ? { name: `Adv. ${v.advocate.replace(/^Adv\.?\s*/i, '')}`, bar: v.bar || '' } : null,
          hearings: [], next_hearing: null, orders: [], last_order: null,
        },
        history: [{ status: 'filed', at: ctx.today() }],
        parties,
      }] };
    },
  }],

  actions: {
    court_case: [
      {
        key: 'register', label: 'Register the case', from: ['filed'], to: 'registered',
        description: 'Assigns the case number and the 16-character CNR.',
        apply(r, v, ctx) {
          const d = districtOf(r.data.district);
          const year = new Date().getFullYear();
          const est = r.data.est || '02';
          const no = `${ctx.seq(`case:${d.cnr}${est}:${year}`, 1000)}/${year}`;
          const cnr = `MH${d.cnr}${est}${pad(ctx.seq(`cnr:${d.cnr}${est}`, 10000), 6)}${year}`;
          return { data: { ...r.data, cnr, case_no: `${r.data.case_abbr} ${no}`, registered_on: ctx.today() }, note: `CNR ${cnr}` };
        },
      },
      {
        key: 'object', label: 'Object to the filing', tone: 'warning', from: ['filed'], to: 'objected',
        fields: [{ name: 'reason', label: 'Objection', type: 'textarea', required: true, max: 300 }],
        apply: (r, v) => ({ data: { ...r.data, objection: v.reason }, note: v.reason }),
      },
      { key: 'refile', label: 'Record re-filing', from: ['objected'], to: 'filed', apply: (r) => ({ data: { ...r.data, objection: null } }) },
      {
        key: 'first_hearing', label: 'List for first hearing', from: ['registered'], to: 'pending',
        fields: [
          { name: 'date', label: 'Hearing date', type: 'date', required: true, notPast: true, width: 'half' },
          { name: 'mode', label: 'Mode', type: 'select', required: true, options: MODES, width: 'half' },
          { name: 'purpose', label: 'Purpose', type: 'text', required: true, max: 120, default: 'Appearance of the parties' },
        ],
        apply: (r, v) => ({ data: { ...r.data, next_hearing: { date: v.date, purpose: v.purpose, mode: v.mode } }, at: v.date <= new Date().toISOString().slice(0, 10) ? v.date : undefined, note: `${v.date}: ${v.purpose}` }),
      },
      {
        key: 'hearing', label: 'Record a hearing', from: ['pending', 'in_appeal'],
        description: 'Records the business done and lists the next date.',
        fields: [
          { name: 'date', label: 'Hearing date', type: 'date', required: true, notFuture: true, width: 'half' },
          { name: 'mode', label: 'Mode', type: 'select', required: true, options: MODES, width: 'half' },
          { name: 'purpose', label: 'Purpose', type: 'text', required: true, max: 120 },
          { name: 'business', label: 'Business done', type: 'text', required: true, max: 160, default: 'Proceedings recorded' },
          { name: 'next_date', label: 'Next date', type: 'date', notPast: true, width: 'half' },
          { name: 'next_purpose', label: 'Next purpose', type: 'text', max: 120, when: { field: 'next_date', truthy: true }, required: true, width: 'half' },
          { name: 'order', label: 'Interim order passed (optional)', type: 'text', max: 160 },
        ],
        apply(r, v) {
          const hearings = [{ date: v.date, purpose: v.purpose, business: v.business, mode: v.mode }].concat(r.data.hearings || []);
          const orders = v.order ? [{ date: v.date, type: 'interim', title: v.order }].concat(r.data.orders || []) : r.data.orders || [];
          return {
            data: { ...r.data, hearings, orders, last_order: v.order ? orders[0] : r.data.last_order, next_hearing: v.next_date ? { date: v.next_date, purpose: v.next_purpose, mode: v.mode } : null },
            note: `${v.date}: ${v.business}`,
          };
        },
      },
      {
        key: 'dispose', label: 'Dispose of the case', from: ['pending'], to: 'disposed',
        fields: [
          { name: 'outcome', label: 'Outcome', type: 'select', required: true, options: OUTCOMES, width: 'half' },
          { name: 'date', label: 'Date of judgment', type: 'date', required: true, notFuture: true, width: 'half' },
          { name: 'judgment', label: 'Operative part of the judgment', type: 'textarea', required: true, max: 600 },
        ],
        apply(r, v) {
          const orders = [{ date: v.date, type: 'final', title: `Judgment: ${v.outcome}` }].concat(r.data.orders || []);
          const hearings = [{ date: v.date, purpose: 'Judgment', business: v.judgment.slice(0, 120), mode: 'Physical' }].concat(r.data.hearings || []);
          return { data: { ...r.data, outcome: v.outcome, judgment: v.judgment, disposed_on: v.date, case_state: 'Disposed', next_hearing: null, orders, hearings, last_order: orders[0] }, at: v.date, note: v.outcome };
        },
      },
      {
        key: 'appeal', label: 'Record an appeal', from: ['disposed'], to: 'in_appeal',
        fields: [
          { name: 'court', label: 'Appellate court', type: 'text', required: true, max: 120, default: 'High Court of Judicature at Bombay' },
          { name: 'number', label: 'Appeal number', type: 'text', required: true, max: 60, width: 'half' },
          { name: 'filed_on', label: 'Filed on', type: 'date', required: true, notFuture: true, width: 'half' },
        ],
        apply: (r, v) => ({ data: { ...r.data, appeal: { court: v.court, number: v.number, filed_on: v.filed_on, status: 'Pending' } }, at: v.filed_on, note: v.number }),
      },
      { key: 'close', label: 'Close the file', tone: 'neutral', from: ['disposed'], to: 'closed' },
    ],
  },

  attention(store) {
    const n = (s) => store.db.prepare('SELECT COUNT(*) AS n FROM record WHERE status = ?').get(s).n;
    const soon = store.db.prepare("SELECT COUNT(*) AS n FROM record WHERE status = 'pending' AND json_extract(data, '$.next_hearing.date') BETWEEN date('now') AND date('now', '+7 days')").get().n;
    return [
      { label: 'Filings to register', n: n('filed'), status: 'filed' },
      { label: 'Objected filings', n: n('objected'), status: 'objected', tone: 'warning' },
      { label: 'Hearings in the next 7 days', n: soon, status: 'pending' },
      { label: 'Pending cases', n: n('pending'), status: 'pending' },
    ];
  },
};
