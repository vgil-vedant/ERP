'use strict';

/**
 * What a department tells the ERP when one of its records is created or changes.
 *
 * One event per change, carrying the record once for every person it is about
 * (an FIR names its accused and its complainant). Each person's copy has that
 * person's role in it, so the ERP can file the record under each of them.
 *
 *   {
 *     type: 'record.upserted', source: 'cctns', occurredAt,
 *     record:  { type, ref, status, date, history },
 *     parties: [ { role, person: { ref, name, gender, dob, district, identifiers[] },
 *                  identifiers[], data } ]
 *   }
 *
 * person.identifiers are what identify the human (Aadhaar, enrolment ID,
 * mobile); the party's identifiers are the record's own numbers (FIR, CNR,
 * prisoner number ...) by which the ERP can also find the person.
 */

const PERSON_IDS = ['aadhaar', 'eid', 'mobile'];

/** The record's own numbers, by which a person can be searched in the ERP. */
const CASE_IDS = {
  fir: (d) => [['fir', d.fir_no]],
  court_case: (d) => [['cnr', d.cnr]],
  forensic_submission: (d) => [['fsl', d.lab_case_no]],
  custody: (d) => [['prisoner', d.prisoner_no]].concat((d.earlier_numbers || []).map((n) => ['prisoner', n])),
  visit_request: (d) => [['visit', d.registration_no]],
  verification_request: (d) => (d.certificate_no ? [['pcc', d.certificate_no]] : []),
};

/** The record as one party sees it: their role in it, in the fields the ERP shows. */
function partyView(type, data, party) {
  const d = JSON.parse(JSON.stringify(data));
  if (type === 'fir') { d.role = party.role; d.relation = party.relation || null; }
  if (type === 'forensic_submission' && party.label) d.subject_category = party.label;
  if (type === 'court_case' && party.label) d.party_role = party.label;
  return d;
}

function personPayload(p) {
  const ids = p.identifiers || {};
  return {
    ref: p.ref, name: p.name, gender: p.gender || null, dob: p.dob || null, district: p.district || null,
    identifiers: PERSON_IDS.filter((t) => ids[t]).map((t) => ({ type: t, value: String(ids[t]) })),
  };
}

function build(store, record) {
  const parties = store.partiesOf(record.id);
  const caseIds = (CASE_IDS[record.type] || (() => []))(record.data).filter(([, v]) => v);
  return {
    type: 'record.upserted',
    source: store.code,
    occurredAt: new Date().toISOString(),
    record: { type: record.type, ref: record.ref, status: record.status, date: record.date, history: record.history },
    parties: parties.map((p) => ({
      role: p.role,
      person: personPayload(p),
      identifiers: caseIds.map(([type, value]) => ({ type, value: String(value) })),
      data: partyView(record.type, record.data, p),
    })),
  };
}

/** Queue the record's current state for the ERP. Call inside the transaction that changed it. */
function publish(store, recordId) {
  const record = store.record(recordId);
  return store.enqueue(record.id, record.ref, 'record.upserted', build(store, record));
}

module.exports = { publish, build, partyView, PERSON_IDS };
