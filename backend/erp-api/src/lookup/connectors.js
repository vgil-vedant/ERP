'use strict';

/**
 * One connector per department system.
 *
 * A connector answers one question: what does this system hold about this
 * person? Today each one reads the ERP's source mirror (lookup_record). To
 * connect a real department API, replace `fetch` with a client for it and
 * leave the rest alone: the service, the page and the stepper only ever see
 * the records a connector returns.
 *
 * The attribution and caveat of each system travel with its records, as the
 * research reports require (CCTNS report 12.3, eCourts report 12.3).
 *
 * LOOKUP_UNAVAILABLE=cctns,ecourts makes the named connectors report their
 * system as unavailable, to show how the page handles a system that is down.
 */

const store = require('./store');

class SourceUnavailable extends Error {
  constructor(message) { super(message); this.code = 'UNAVAILABLE'; }
}

const unavailable = () => String(process.env.LOOKUP_UNAVAILABLE || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

function mirror(code) {
  return async (subject) => {
    if (unavailable().includes(code)) throw new SourceUnavailable('The system did not answer. Try again later.');
    return store.recordsOf(subject.id, code);
  };
}

const CONNECTORS = [
  {
    code: 'uidai',
    name: 'UIDAI / Aadhaar',
    department: 'Unique Identification Authority of India',
    hostname: 'uidai.gov.in',
    holds: 'Identity (e-KYC attributes) and update requests',
    attribution: 'Source: UIDAI, Government of India, through offline Aadhaar verification',
    caveat: 'Demographic attributes as returned by verification. The Aadhaar number is held only as a masked reference.',
    empty: {
      title: 'No Aadhaar record linked',
      hint: 'This person has not been verified through Aadhaar, or verification was not consented to. Identity rests on the other systems’ records.',
    },
    fetch: mirror('uidai'),
  },
  {
    code: 'cctns',
    name: 'CCTNS',
    department: 'Crime and Criminal Tracking Network and Systems, NCRB',
    hostname: 'digitalpolicecitizenservices.gov.in',
    holds: 'FIRs and police verification requests',
    attribution: 'Source: NCRB Digital Police Citizen Services',
    caveat: 'Not a statement of law; verify with the authority concerned.',
    empty: {
      title: 'No police records',
      hint: 'No FIR names this person, and no police verification has been requested about them.',
    },
    fetch: mirror('cctns'),
  },
  {
    code: 'eforensics',
    name: 'e-Forensics',
    department: 'Forensic Science Laboratories (e-Forensics)',
    hostname: 'eforensics.gov.in',
    holds: 'Exhibits sent for examination, custody chain and report status',
    attribution: 'Source: e-Forensics, Directorate of Forensic Science Laboratories, Maharashtra',
    caveat: 'Case status as recorded by the laboratory. Examination findings are released only to the forwarding authority.',
    empty: {
      title: 'No forensic submissions',
      hint: 'No exhibits connected with this person have been sent to a forensic laboratory.',
    },
    fetch: mirror('eforensics'),
  },
  {
    code: 'ecourts',
    name: 'eCourts',
    department: 'eCourts Services, e-Committee, Supreme Court of India',
    hostname: 'ecourts.gov.in',
    holds: 'Cases, hearings and orders',
    attribution: 'Source: eCourts Services, e-Committee, Supreme Court of India',
    caveat: 'Not meant for legal evidence; verify with the court record.',
    empty: {
      title: 'No court cases',
      hint: 'This person is not a party to any case recorded in the district courts.',
    },
    fetch: mirror('ecourts'),
  },
  {
    code: 'eprisons',
    name: 'ePrisons',
    department: 'National Prisons Information Portal (ePrisons), NIC',
    hostname: 'eprisons.nic.in',
    holds: 'Custody, e-Mulakat visits and grievances',
    attribution: 'Source: ePrisons, National Prisons Information Portal',
    caveat: 'Visit approval and slots are decided by the prison department; the status shown is the last one recorded.',
    empty: {
      title: 'No prison records',
      hint: 'This person has never been held in a prison, and has not registered a visit or a grievance.',
    },
    fetch: mirror('eprisons'),
  },
];

module.exports = { CONNECTORS, SourceUnavailable };
