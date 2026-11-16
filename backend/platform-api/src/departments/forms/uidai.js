'use strict';

/**
 * UIDAI: enrolment and update, as on Forms 1 and 2 (Aadhaar report, section 5)
 * and through the application statuses of table 11.4.
 *
 * Approving an enrolment issues an Aadhaar number (synthetic, 9999 series) and
 * creates the resident's identity record; approving an update applies the
 * requested changes to it. Both reach the ERP at once through the outbox.
 */

const { LISTS, DISTRICTS, opt, issueAadhaar, yearOf, pad, editAction } = require('./common');
const { uidToken } = require('../../../../shared/records/dataset');

const RESIDENT = [opt('Resident Indian'), opt('Non-Resident Indian (NRI)')];
const BASIS = [opt('Document verification'), opt('Confirmation by Head of Family')];
const DOB_BASIS = [opt('verified', 'Verified'), opt('declared', 'Declared'), opt('approximate', 'Approximate')];
const CARE = [opt('S/O'), opt('D/O'), opt('W/O'), opt('C/O')];
const HOF_REL = [opt('Mother'), opt('Father'), opt('Legal guardian')];
const ITEMS = ['Name', 'Date of Birth', 'Gender', 'Address', 'Mobile', 'E-mail', 'Biometric (photo, fingerprints and irises)'].map((v) => opt(v));
const CHANNEL = [opt('Aadhaar Seva Kendra (Update Client Standard)'), opt('myAadhaar portal')];
const VERIFY = [opt('Documents checked against Schedule II'), opt('Biometric de-duplication completed'), opt('Head of Family authenticated')];

const addressFields = (p, req) => [
  { name: `${p}house`, label: 'House / building / flat no.', type: 'text', required: req, max: 80, width: 'half' },
  { name: `${p}street`, label: 'Street / road / lane', type: 'text', max: 80, width: 'half' },
  { name: `${p}landmark`, label: 'Landmark', type: 'text', max: 80, width: 'half' },
  { name: `${p}locality`, label: 'Area / locality / sector', type: 'text', required: req, max: 80, width: 'half' },
  { name: `${p}vtc`, label: 'Village / town / city', type: 'text', required: req, max: 60, width: 'third' },
  { name: `${p}po`, label: 'Post office', type: 'text', required: req, max: 60, width: 'third' },
  { name: `${p}pin`, label: 'PIN code', type: 'pin', required: req, width: 'third' },
  { name: `${p}subdist`, label: 'Sub-district', type: 'text', max: 60, width: 'third' },
  { name: `${p}district`, label: 'District', type: 'select', required: req, options: LISTS.districts, width: 'third' },
  { name: `${p}state`, label: 'State', type: 'select', required: req, options: [opt('Maharashtra')], default: 'Maharashtra', width: 'third' },
];
const addressOf = (v, p, co) => ({
  co: co || '', house: v[`${p}house`] || '', street: v[`${p}street`] || '', lm: v[`${p}landmark`] || '',
  loc: v[`${p}locality`] || '', vtc: v[`${p}vtc`] || '', subdist: v[`${p}subdist`] || v[`${p}district`] || '',
  dist: v[`${p}district`] || '', state: v[`${p}state`] || 'Maharashtra', country: 'India', pc: v[`${p}pin`] || '', po: v[`${p}po`] || '',
});
const centreFor = (district) => {
  const d = Object.values(DISTRICTS).find((x) => x.name === district);
  return d ? d.asks : `Aadhaar Seva Kendra, ${district}`;
};

const DOCUMENT_OPTIONS = LISTS.poi.concat(LISTS.poa.filter((o) => !LISTS.poi.some((p) => p.value === o.value)));
const REVIEWING = ['submitted', 'under_review', 'needs_info', 'verified', 'approved', 'rejected'];

/** Correct the address on an enrolment before it is decided; approval copies it to the identity record. */
const editEnrolment = editAction({
  from: ['submitted', 'under_review', 'needs_info'],
  description: 'Correct the address on the application. The Aadhaar identity is created from these details on approval.',
  fields: addressFields('', true),
  prefill: (r) => {
    const a = r.data.address || {};
    return { house: a.house, street: a.street, landmark: a.lm, locality: a.loc, vtc: a.vtc, po: a.po, pin: a.pc, subdist: a.subdist, district: a.dist, state: a.state };
  },
  apply: (r, v) => ({ data: { ...r.data, address: addressOf(v, '', (r.data.address || {}).co), centre: centreFor(v.district) } }),
});

/** Correct how an update request came in and the document presented; what is to be changed needs a new request. */
const editUpdate = editAction({
  from: ['submitted', 'under_review', 'needs_info'],
  fields: [
    { name: 'channel', label: 'Channel', type: 'select', required: true, options: CHANNEL, width: 'half' },
    { name: 'document', label: 'Document presented', type: 'select', options: DOCUMENT_OPTIONS, width: 'half' },
  ],
  prefill: (r) => ({ channel: r.data.channel, document: (r.data.documents || [])[0] }),
  apply: (r, v) => ({ data: { ...r.data, channel: v.channel, documents: v.document ? [v.document] : [] } }),
});

const reviewActions = [
  { key: 'start_review', label: 'Start document review', from: ['submitted'], to: 'under_review', description: 'Check the documents and cross-field rules against Schedule II.' },
  {
    key: 'request_info', label: 'Request information', tone: 'warning', from: ['under_review'], to: 'needs_info',
    description: 'Return the application to the resident with the deficiency stated.',
    fields: [{ name: 'deficiency', label: 'What is missing or wrong', type: 'textarea', required: true, max: 300 }],
    apply: (r, v) => ({ data: { ...r.data, deficiency: v.deficiency }, note: v.deficiency }),
  },
  {
    key: 'resubmit', label: 'Record resubmission', from: ['needs_info'], to: 'under_review',
    fields: [{ name: 'note', label: 'What the resident supplied', type: 'textarea', required: true, max: 300 }],
    apply: (r, v) => ({ data: { ...r.data, deficiency: null, resubmission: v.note }, note: v.note }),
  },
  {
    key: 'verify', label: 'Mark identity verified', from: ['under_review'], to: 'verified',
    fields: [{ name: 'how', label: 'Verification', type: 'select', required: true, options: VERIFY }],
    apply: (r, v) => ({ data: { ...r.data, verification_note: v.how }, note: v.how }),
  },
  {
    key: 'reject', label: 'Reject', tone: 'danger', from: ['under_review', 'verified'], to: 'rejected',
    fields: [{ name: 'reason', label: 'Reason for rejection', type: 'textarea', required: true, max: 300 }],
    apply: (r, v) => ({ data: { ...r.data, rejection_reason: v.reason }, note: v.reason }),
  },
  { key: 'close', label: 'Close the application', tone: 'neutral', from: ['approved', 'rejected'], to: 'closed' },
];

module.exports = {
  code: 'uidai',
  personPrefix: 'UID-R',
  title: 'UIDAI Enrolment and Update Office',
  short: 'UIDAI',
  officer: { username: 'uidai.officer', name: 'Archana Sutar', designation: 'Enrolment Supervisor', office: 'Regional Office, Mumbai' },

  types: {
    aadhaar_identity: {
      label: 'Aadhaar identity', plural: 'Residents',
      title: (r) => `Aadhaar ${r.data.aadhaar_masked}`,
      subtitle: (r) => `${r.data.poi.name} · ${r.data.poa.dist || r.data.poa.vtc}`,
      statusLabel: (r) => r.data.aadhaar_status || 'Active',
    },
    aadhaar_enrolment: {
      label: 'Enrolment', plural: 'Enrolments', closed: ['closed', 'rejected'], awaiting: REVIEWING,
      title: (r) => `Enrolment ${r.ref}`,
      subtitle: (r) => r.data.applicant.name,
    },
    aadhaar_update: {
      label: 'Update request', plural: 'Update requests', closed: ['closed', 'rejected'], awaiting: REVIEWING,
      title: (r) => `Update ${r.ref}`,
      subtitle: (r) => `${r.data.applicant_name || ''} · ${r.data.update_items.join(', ')}`,
    },
  },

  forms: () => [
    {
      key: 'enrolment', recordType: 'aadhaar_enrolment', title: 'New enrolment',
      description: 'Enrolment of a resident aged 18 or above (Form 1). The Aadhaar number is issued when the application is approved.',
      submitLabel: 'Submit enrolment',
      sections: [
        { title: 'Application', fields: [
          { name: 'resident_status', label: 'Resident status', type: 'select', required: true, options: RESIDENT, default: 'Resident Indian', width: 'half' },
          { name: 'basis', label: 'Basis of enrolment', type: 'select', required: true, options: BASIS, default: 'Document verification', width: 'half' },
        ] },
        { title: 'Personal information', fields: [
          { name: 'name', label: 'Name (as on the proof of identity)', type: 'text', required: true, max: 100, pattern: "^[A-Za-z][A-Za-z '-]*$", patternMessage: 'Use letters and spaces only; dots and titles are not allowed in an Aadhaar name.', width: 'full' },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: LISTS.gender, width: 'third' },
          { name: 'dob', label: 'Date of birth', type: 'date', required: true, notFuture: true, width: 'third' },
          { name: 'dob_basis', label: 'Date of birth is', type: 'select', required: true, options: DOB_BASIS, default: 'verified', width: 'third' },
          { name: 'care_of_type', label: 'Care of', type: 'select', options: CARE, width: 'third' },
          { name: 'care_of_name', label: 'Name of the person in care of', type: 'text', max: 100, when: { field: 'care_of_type', truthy: true }, required: true, width: 'half' },
          { name: 'mobile', label: 'Mobile number', type: 'mobile', width: 'third' },
          { name: 'email', label: 'E-mail', type: 'email', width: 'half' },
        ] },
        { title: 'Address', fields: addressFields('', true) },
        { title: 'Documents presented', when: { field: 'basis', is: 'Document verification' }, fields: [
          { name: 'poi', label: 'Proof of identity', type: 'select', required: true, options: LISTS.poi, when: { field: 'basis', is: 'Document verification' }, width: 'third' },
          { name: 'poa', label: 'Proof of address', type: 'select', required: true, options: LISTS.poa, when: { field: 'basis', is: 'Document verification' }, width: 'third' },
          { name: 'pdb', label: 'Proof of date of birth', type: 'select', options: LISTS.pdb, when: { field: 'basis', is: 'Document verification' }, width: 'third' },
        ] },
        { title: 'Head of Family', when: { field: 'basis', is: 'Confirmation by Head of Family' }, fields: [
          { name: 'hof_name', label: 'Head of Family name', type: 'text', required: true, max: 100, when: { field: 'basis', is: 'Confirmation by Head of Family' }, width: 'half' },
          { name: 'hof_aadhaar', label: 'Head of Family Aadhaar number', type: 'aadhaar', required: true, when: { field: 'basis', is: 'Confirmation by Head of Family' }, width: 'half' },
          { name: 'hof_relation', label: 'Relationship with the applicant', type: 'select', required: true, options: HOF_REL, when: { field: 'basis', is: 'Confirmation by Head of Family' }, width: 'half' },
        ] },
        { title: 'Declaration', fields: [
          { name: 'consent', label: 'The resident has signed the declaration and consented to electronic verification of the documents with their issuing authorities', type: 'checkbox', required: true },
        ] },
      ],
      rules: (v) => (v.consent ? {} : { consent: 'The declaration and consent are mandatory on Form 1.' }),
      build(v, ctx) {
        const co = v.care_of_type ? `${v.care_of_type} ${v.care_of_name}` : '';
        const personId = ctx.person({
          name: v.name, gender: v.gender, dob: v.dob, district: v.district,
          identifiers: { ...(v.mobile ? { mobile: v.mobile } : {}) },
          profile: { address: addressOf(v, '', co), ...(v.email ? { email: v.email } : {}) },
        });
        const year = new Date().getFullYear();
        const eid = `${pad(1000 + (ctx.seq('centre') % 9000), 4)}${pad(ctx.seq('eid', 10000) % 100000, 5)}${pad(Date.now() % 100000, 5)}`;
        return { records: [{
          type: 'aadhaar_enrolment', ref: eid, status: 'submitted', date: ctx.today(),
          data: {
            eid, purpose: 'Enrolment', resident_status: v.resident_status, basis: v.basis,
            applicant: { name: v.name, gender: v.gender, dob: v.dob, dob_basis: v.dob_basis, care_of: co },
            address: addressOf(v, '', co), contact: { mobile: v.mobile ? `XXXXXX${v.mobile.slice(-4)}` : null, email_given: !!v.email },
            documents: v.basis === 'Document verification' ? { poi: v.poi, poa: v.poa, pdb: v.pdb || null } : null,
            hof: v.basis === 'Confirmation by Head of Family' ? { name: v.hof_name, aadhaar_masked: `XXXX XXXX ${v.hof_aadhaar.slice(-4)}`, relation: v.hof_relation } : null,
            centre: centreFor(v.district), submitted_at: ctx.stamp(), year,
          },
          history: [{ status: 'submitted', at: ctx.today() }],
          parties: [{ personId, role: 'resident' }],
        }] };
      },
    },
    {
      key: 'update', recordType: 'aadhaar_update', title: 'Update request',
      description: 'Update of demographic or biometric details of an existing Aadhaar holder (Form 2). Changes apply when the request is approved.',
      submitLabel: 'Submit update request',
      sections: [
        { title: 'Aadhaar holder', fields: [
          { name: 'aadhaar', label: 'Aadhaar number of the applicant', type: 'aadhaar', required: true, width: 'half' },
          { name: 'channel', label: 'Channel', type: 'select', required: true, options: CHANNEL, default: 'Aadhaar Seva Kendra (Update Client Standard)', width: 'half' },
          { name: 'items', label: 'Information to be updated', type: 'checkboxes', required: true, options: ITEMS, width: 'full' },
        ] },
        { title: 'New details', fields: [
          { name: 'new_name', label: 'New name', type: 'text', required: true, max: 100, when: { field: 'items', includes: 'Name' }, width: 'half' },
          { name: 'new_dob', label: 'New date of birth', type: 'date', required: true, notFuture: true, when: { field: 'items', includes: 'Date of Birth' }, width: 'third' },
          { name: 'new_gender', label: 'New gender', type: 'select', required: true, options: LISTS.gender, when: { field: 'items', includes: 'Gender' }, width: 'third' },
          { name: 'new_mobile', label: 'New mobile number', type: 'mobile', required: true, when: { field: 'items', includes: 'Mobile' }, width: 'third' },
          { name: 'new_email', label: 'New e-mail', type: 'email', required: true, when: { field: 'items', includes: 'E-mail' }, width: 'half' },
          ...addressFields('new_', true).map((f) => ({ ...f, when: { field: 'items', includes: 'Address' } })),
        ] },
        { title: 'Supporting document', fields: [
          { name: 'document', label: 'Document presented', type: 'select', options: DOCUMENT_OPTIONS, width: 'half' },
        ] },
      ],
      build(v, ctx) {
        const id = ctx.store.db.prepare("SELECT id FROM person WHERE json_extract(identifiers, '$.aadhaar') = ?").get(v.aadhaar);
        if (!id) ctx.fail('aadhaar', 'No resident with this Aadhaar number is held by this office.');
        const person = ctx.store.person(id.id);
        const requested = {};
        if (v.items.includes('Name')) requested.name = v.new_name;
        if (v.items.includes('Date of Birth')) requested.dob = v.new_dob;
        if (v.items.includes('Gender')) requested.gender = v.new_gender;
        if (v.items.includes('Mobile')) requested.mobile = v.new_mobile;
        if (v.items.includes('E-mail')) requested.email = v.new_email;
        if (v.items.includes('Address')) requested.address = addressOf(v, 'new_', ((person.profile.address || {}).co) || '');
        const urn = `URN-${new Date().getFullYear()}${pad(ctx.seq('urn', 1000000000), 10)}`;
        const bio = v.items.some((i) => i.startsWith('Biometric'));
        return { records: [{
          type: 'aadhaar_update', ref: urn, status: 'submitted', date: ctx.today(),
          data: {
            urn, purpose: 'Update', update_items: v.items, channel: v.channel, applicant_name: person.name,
            submitted_at: ctx.stamp(), documents: v.document ? [v.document] : [], deficiency: null,
            fee: bio ? 'Rs. 125' : 'Rs. 75', requested,
          },
          history: [{ status: 'submitted', at: ctx.today() }],
          parties: [{ personId: person.id, role: 'resident' }],
        }] };
      },
    },
  ],

  actions: {
    aadhaar_enrolment: reviewActions.concat([{
      key: 'approve', label: 'Approve and generate Aadhaar', from: ['verified'], to: 'approved',
      description: 'Issues the Aadhaar number and creates the resident’s identity record.',
      apply(r, v, ctx) {
        let n; let aadhaar;
        do { n = ctx.seq('aadhaar', 5000000); aadhaar = issueAadhaar(n); }
        while (ctx.store.db.prepare("SELECT 1 FROM person WHERE json_extract(identifiers, '$.aadhaar') = ?").get(aadhaar));
        const party = ctx.store.partiesOf(r.id)[0];
        const person = ctx.store.person(party.id);
        ctx.store.savePerson({ ...person, identifiers: { ...person.identifiers, aadhaar, eid: r.ref } });
        const d = r.data;
        const identity = {
          type: 'aadhaar_identity', ref: `UID-${aadhaar.slice(-4)}-${pad(n, 7)}`, status: 'active', date: ctx.today(),
          data: {
            aadhaar_masked: `XXXX XXXX ${aadhaar.slice(-4)}`, uid_token: `UTK-${uidToken(aadhaar)}`,
            poi: { name: d.applicant.name, dob: d.applicant.dob, dob_basis: d.applicant.dob_basis, gender: d.applicant.gender },
            poa: d.address, resident_status: d.resident_status,
            enrolment: { eid_masked: `${r.ref.slice(0, 4)} XXXX XXXX ${r.ref.slice(-2)}`, enrolled_on: r.date, centre: d.centre, basis: d.basis, documents: d.documents || { poi: 'Head of Family confirmation', poa: 'Head of Family confirmation', pdb: null } },
            biometrics: { photo: 'Captured', fingerprints: 'Captured', iris: 'Captured', last_update: ctx.today() },
            contact: { mobile_linked: !!person.identifiers.mobile, mobile_masked: person.identifiers.mobile ? `XXXXXX${String(person.identifiers.mobile).slice(-4)}` : null, email_linked: !!person.profile.email },
            aadhaar_status: 'Active', last_updated_on: ctx.today(),
            verification: { channel: 'Issued by UIDAI on approval of enrolment', performed_at: ctx.stamp(), signature_valid: true, signature_algorithm: 'RSA-SHA256', proof_of_presence: 'Biometric capture at the centre', aadhaar_number_received: false, retention: { delete_after: `${yearOf(ctx.today()) + 1}${ctx.today().slice(4)}`, basis: 'Purpose exhausted' } },
          },
          history: [{ status: 'active', at: ctx.today() }],
          parties: [{ personId: person.id, role: 'resident' }],
        };
        return { data: { ...d, aadhaar_masked: identity.data.aadhaar_masked }, records: [identity], note: `Aadhaar ${identity.data.aadhaar_masked} issued` };
      },
    }, editEnrolment]),
    aadhaar_update: reviewActions.concat([{
      key: 'approve', label: 'Approve and apply the update', from: ['verified'], to: 'approved',
      description: 'Applies the requested changes to the resident’s identity record.',
      apply(r, v, ctx) {
        const party = ctx.store.partiesOf(r.id)[0];
        const person = ctx.store.person(party.id);
        const req = r.data.requested || {};
        const idRow = ctx.store.db.prepare(
          "SELECT r.id FROM record r JOIN record_party rp ON rp.record_id = r.id WHERE r.record_type = 'aadhaar_identity' AND rp.person_id = ?").get(person.id);
        const touched = [];
        const ids = { ...person.identifiers };
        if (req.mobile) ids.mobile = req.mobile;
        ctx.store.savePerson({
          ...person, name: req.name || person.name, dob: req.dob || person.dob, gender: req.gender || person.gender,
          district: req.address ? req.address.dist : person.district, identifiers: ids,
          profile: { ...person.profile, ...(req.address ? { address: req.address } : {}), ...(req.email ? { email: req.email } : {}) },
        });
        if (idRow) {
          const idr = ctx.store.record(idRow.id);
          const d = idr.data;
          if (req.name) d.poi.name = req.name;
          if (req.dob) { d.poi.dob = req.dob; d.poi.dob_basis = 'verified'; }
          if (req.gender) d.poi.gender = req.gender;
          if (req.address) d.poa = req.address;
          if (req.mobile) { d.contact.mobile_linked = true; d.contact.mobile_masked = `XXXXXX${req.mobile.slice(-4)}`; }
          if (req.email) d.contact.email_linked = true;
          if (r.data.update_items.some((i) => i.startsWith('Biometric'))) d.biometrics.last_update = ctx.today();
          d.last_updated_on = ctx.today();
          ctx.store.saveRecord({ ref: idr.ref, type: idr.type, status: idr.status, date: idr.date, data: d, history: idr.history }, idr.createdBy);
          touched.push(idr.id);
        }
        return { touched, note: `${r.data.update_items.join(', ')} updated` };
      },
    }, editUpdate]),
  },

  attention(store) {
    const n = (s) => store.db.prepare('SELECT COUNT(*) AS n FROM record WHERE record_type IN (\'aadhaar_enrolment\', \'aadhaar_update\') AND status = ?').get(s).n;
    return [
      { label: 'Awaiting review', n: n('submitted'), status: 'submitted' },
      { label: 'Information requested', n: n('needs_info'), status: 'needs_info', tone: 'warning' },
      { label: 'Verified, awaiting decision', n: n('verified'), status: 'verified' },
    ];
  },
};
