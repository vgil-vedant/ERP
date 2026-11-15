'use strict';

/**
 * The demonstration dataset behind the person lookup: fifty synthetic people
 * and the records five department systems would hold about them.
 *
 * Every field follows the field inventories and sample structures of the
 * research reports (info/docs/research_reports):
 *   UIDAI        e-KYC attributes (table 5.2), enrolment and update forms (table 5.1)
 *   CCTNS        verification request, vehicle subject and outcome (section 12)
 *   e-Forensics  submission, parcels, exhibits and custody ledger (section 12)
 *   eCourts      matter, parties and observation; case-status outputs (sections 5, 12)
 *   ePrisons     inmate reference, e-Mulakat visit and grievance fields (section 5)
 * FIR particulars (police station, FIR number and year, sections, investigating
 * officer) are the ones the eCourts Case Information Format and the e-Forensics
 * CESF ask for.
 *
 * Nothing here is real. Aadhaar numbers are drawn from the 9999 test series with
 * a valid Verhoeff check digit; they are stored only as keyed hashes and masks.
 * The build is deterministic: the same version always yields the same data.
 */

const { DISTRICTS, CRIMES, OFFICER_NAMES, IO_RANKS, RANK_NAME, ADVOCATES, PROSECUTORS, PRESERVATIVE, DOCUMENTS } = require('./catalogue');
const crypto = require('crypto');
const { verhoeffDigit } = require('./verhoeff');

// UIDAI issues each agency its own token for a resident; it is keyed so that it
// cannot be turned back into the Aadhaar number by trying every number.
const TOKEN_KEY = process.env.UIDAI_TOKEN_KEY || 'uidai-agency-token-demo-v1';
const uidToken = (aadhaar) => crypto.createHmac('sha256', TOKEN_KEY).update(String(aadhaar)).digest('hex').slice(0, 24).toUpperCase();

const VERSION = 'demo-2026.11-v3';     // v2: keyed UID token; v3: generator shared with the department backends
const ANCHOR = '2026-11-01';             // the dataset's "today"; next hearings fall after it
const BNS_FROM = '2024-07-01';

// --- deterministic helpers -------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    digits: (n) => Array.from({ length: n }, () => Math.floor(next() * 10)).join(''),
  };
}

const DAY = 86400000;
const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const add = (isoDate, days) => iso(new Date(toDate(isoDate).getTime() + days * DAY));
const between = (r, from, to) => add(from, r.int(0, Math.max(0, Math.round((toDate(to) - toDate(from)) / DAY))));
const minDate = (a, b) => (a < b ? a : b);
const stamp = (isoDate, hh = 11, mm = 0) => `${isoDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`;
const yearOf = (isoDate) => Number(isoDate.slice(0, 4));
const pad = (n, w) => String(n).padStart(w, '0');
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
/** A hearing gap that spreads about `count` hearings evenly over `from`..`to`. */
const gapFor = (r, from, to, count) => {
  const avg = Math.max(26, Math.round(daysBetween(from, to) / count));
  return r.int(Math.round(avg * 0.7), Math.round(avg * 1.3));
};
const ageOn = (dob, on) => {
  const a = toDate(dob), b = toDate(on);
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) y -= 1;
  return y;
};
const initials = (name) => name.split(' ').map((w) => w[0]).join('');
const sections = (list) => list.map(([act, sec]) => ({ act, section: sec }));
const sectionText = (list) => list.map(([act, sec]) => `${sec} ${act}`).join(', ');

// --- the roster ------------------------------------------------------------
// [name, gender, district, scenario, crime or detail, link]
const ROSTER = [
  ['Rahul Shinde', 'M', 'pune', 'convict', 'murder'],
  ['Sachin Jadhav', 'M', 'mumbai', 'undertrial', 'ndps'],
  ['Imran Shaikh', 'M', 'thane', 'undertrial', 'robbery'],
  ['Amol Pawar', 'M', 'nagpur', 'convict', 'attempt'],
  ['Vikas Gaikwad', 'M', 'nashik', 'undertrial', 'cyber'],
  ['Prashant Kale', 'M', 'sambhajinagar', 'bail', 'cheating'],
  ['Santosh More', 'M', 'kolhapur', 'acquitted', 'attempt'],
  ['Nitin Deshmukh', 'M', 'amravati', 'undertrial', 'arms'],
  ['Ganesh Chavan', 'M', 'solapur', 'convict', 'robbery'],
  ['Sunita Waghmare', 'F', 'pune', 'undertrial', 'poison'],
  ['Rohit Bhosale', 'M', 'pune', 'bail', 'theft'],
  ['Akash Sonawane', 'M', 'mumbai', 'convict', 'ndps'],
  ['Joseph Fernandes', 'M', 'mumbai', 'acquitted', 'cyber'],
  ['Yogesh Thorat', 'M', 'nashik', 'undertrial', 'murder'],
  ['Salim Pathan', 'M', 'sambhajinagar', 'convict', 'robbery'],
  ['Tushar Salunkhe', 'M', 'kolhapur', 'undertrial', 'theft', { noAadhaar: true }],
  ['Mahesh Kadam', 'M', 'thane', 'bail', 'attempt'],
  ['Swapnil Mane', 'M', 'nagpur', 'undertrial', 'robbery'],
  ['Kavita Sawant', 'F', 'mumbai', 'undertrial', 'cheating'],
  ['Dattatray Bansode', 'M', 'solapur', 'served', 'theft'],
  ['Arjun Naik', 'M', 'pune', 'appeal', 'attempt'],
  ['Vijay Kamble', 'M', 'amravati', 'acquitted', 'robbery'],
  ['Pravin Wagh', 'M', 'pune', 'convict', 'attempt'],
  ['Ajay Kulkarni', 'M', 'nagpur', 'bail', 'cruelty'],
  ['Priya Deshpande', 'F', 'pune', 'complainant', 'informant', { of: 1, relation: 'Sister of the deceased' }],
  ['Ramesh Gokhale', 'M', 'nagpur', 'complainant', 'injured', { of: 4 }],
  ['Snehal Joshi', 'F', 'nashik', 'complainant', 'victim', { of: 5 }],
  ['Anil Patil', 'M', 'sambhajinagar', 'complainant', 'victim', { of: 6 }],
  ['Manisha Kulkarni', 'F', 'thane', 'complainant', 'victim', { of: 3, noAadhaar: true }],
  ['Mary D\'Souza', 'F', 'mumbai', 'complainant', 'victim', { of: 13 }],
  ['Rekha Shinde', 'F', 'pune', 'visitor', 'Mother', { of: 1 }],
  ['Pooja Jadhav', 'F', 'mumbai', 'visitor', 'Wife', { of: 2, grievance: 'facilities' }],
  ['Nazia Shaikh', 'F', 'thane', 'visitor', 'Sister', { of: 3 }],
  ['Suresh Deshmukh', 'M', 'amravati', 'visitor', 'Father', { of: 8 }],
  ['Shital Waghmare', 'F', 'pune', 'visitor', 'Daughter', { of: 10, grievance: 'others' }],
  ['Kiran Chavan', 'M', 'solapur', 'visitor', 'Brother', { of: 9 }],
  ['Ashwini Pawar', 'F', 'pune', 'civil', 'maintenance'],
  ['Sunil Jadhav', 'M', 'nashik', 'civil', 'property'],
  ['Vaishali More', 'F', 'kolhapur', 'civil', 'recovery'],
  ['Rahul Patil', 'M', 'mumbai', 'civil', 'tenancy'],
  ['Rahul Patil', 'M', 'pune', 'verification', 'tenant'],
  ['Sagar Kadam', 'M', 'thane', 'verification', 'vehicle'],
  ['Anjali Gaikwad', 'F', 'nagpur', 'verification', 'pcc'],
  ['Sayali Thorat', 'F', 'sambhajinagar', 'verification', 'deferred'],
  ['Imran Pathan', 'M', 'nashik', 'verification', 'blocked'],
  ['Rupali Salunkhe', 'F', 'kolhapur', 'clean', 'under_review'],
  ['Shivaji Bhosale', 'M', 'pune', 'clean', 'none'],
  ['Kavita Naik', 'F', 'amravati', 'clean', 'approved'],
  ['Nitin Kamble', 'M', 'solapur', 'clean', 'needs_info'],
  ['Sandeep Mane', 'M', 'nagpur', 'clean', 'closed'],
];

const MALE_FIRST = ['Ramesh', 'Suresh', 'Dnyaneshwar', 'Vasant', 'Prakash', 'Shankar', 'Baban', 'Madhukar', 'Ashok', 'Vitthal', 'Raghunath', 'Anwar', 'Yusuf', 'Anthony', 'Narayan', 'Dilip'];
const STREETS = ['Station Road', 'Tilak Road', 'M. G. Road', 'Ganesh Peth Lane 2', 'Shivaji Chowk Road', 'Ambedkar Nagar Lane 4', 'Gandhi Road', 'Sant Tukaram Marg', 'Laxmi Road', 'Market Yard Road'];
const LANDMARKS = ['Near Hanuman Mandir', 'Opposite Zilla Parishad School', 'Behind Bus Stand', 'Near Water Tank', 'Next to Post Office', 'Near Ganesh Mandal', ''];
const BUILDINGS = ['Sai Krupa Apartment', 'Shree Ganesh Niwas', 'Om Sai Residency', 'Gulmohar Society', 'Laxmi Chawl', 'Sankalp Heights', 'Tulsi Park', 'Ashirwad Bungalow'];

/** Build the whole dataset. */
function build() {
  const people = ROSTER.map((row, i) => ({
    idx: i + 1, name: row[0], gender: row[1], district: row[2], scenario: row[3], detail: row[4], opts: row[5] || {},
    r: rng(7919 * (i + 1)),
    ref: `PSN-${pad(i + 1, 6)}`,
    identifiers: [], records: [],
  }));
  const byIdx = (n) => people[n - 1];
  const usedMobiles = new Set();
  const seq = { fir: {}, fsl: {}, prisoner: {}, cnr: {}, case: {}, filing: {} };
  const nextSeq = (bucket, key, r, lo, hi) => {
    const m = seq[bucket];
    if (m[key] == null) m[key] = r.int(lo, hi);
    m[key] += r.int(3, 41);
    return m[key];
  };

  // identity basics for everyone
  for (const p of people) {
    const { r } = p;
    const D = DISTRICTS[p.district];
    const ageBand = ['visitor', 'civil'].includes(p.scenario) ? [28, 64] : p.scenario === 'complainant' ? [24, 58] : [21, 48];
    const age = r.int(ageBand[0], ageBand[1]);
    p.dob = add(`${yearOf(ANCHOR) - age - 1}-01-01`, r.int(0, 364));
    p.dobBasis = r.chance(0.82) ? 'verified' : 'declared';
    const surname = p.name.split(' ').slice(-1)[0];
    p.fatherName = `${r.pick(MALE_FIRST)} ${surname}`;
    p.careOf = p.gender === 'F' && r.chance(0.35) ? `W/O ${r.pick(MALE_FIRST)} ${surname}` : `${p.gender === 'F' ? 'D/O' : 'S/O'} ${p.fatherName}`;
    const L = r.pick(D.localities);
    p.locality = L;
    p.address = {
      co: p.careOf,
      house: `${r.int(1, 48)}${r.chance(0.4) ? `/${r.int(1, 12)}` : ''}, ${r.pick(BUILDINGS)}`,
      street: r.pick(STREETS),
      lm: r.pick(LANDMARKS),
      loc: L.loc,
      vtc: L.dist === 'Mumbai Suburban' || L.dist === 'Mumbai' ? 'Mumbai' : D.name,
      subdist: L.subdist,
      dist: L.dist || D.name,
      state: 'Maharashtra',
      country: 'India',
      pc: L.pc,
      po: L.po,
    };
    let mobile;
    do { mobile = `${r.pick(['9', '8', '7'])}${r.digits(9)}`; } while (usedMobiles.has(mobile));
    usedMobiles.add(mobile);
    p.mobile = mobile;
    if (!p.opts.noAadhaar) {
      const body = `9999${r.digits(7)}`;
      p.aadhaar = `${body}${verhoeffDigit(body)}`;
      p.eid = `${pad(r.int(1000, 2999), 4)}${pad(r.int(10000, 99999), 5)}${pad(r.int(10000, 99999), 5)}`;
      p.identifiers.push({ type: 'aadhaar', value: p.aadhaar, system: 'uidai' });
      p.identifiers.push({ type: 'eid', value: p.eid, system: 'uidai' });
    }
    p.identifiers.push({ type: 'mobile', value: p.mobile, system: p.opts.noAadhaar ? 'cctns' : 'uidai' });
  }

  // case files: one per accused person, built first so others can link to them
  const cases = {};
  for (const p of people) {
    if (!['convict', 'undertrial', 'acquitted', 'bail', 'served', 'appeal'].includes(p.scenario)) continue;
    cases[p.idx] = caseFile(p, nextSeq);
  }

  // complainants and visitors attach to an accused person's case file
  for (const p of people) {
    if (p.scenario === 'complainant') attachComplainant(p, cases[p.opts.of], byIdx(p.opts.of));
  }

  // record everything for the accused
  for (const p of people) {
    const cf = cases[p.idx];
    if (!cf) continue;
    p.records.push(firRecord(cf, 'accused', p, null));
    if (cf.forensic) p.records.push(forensicRecord(cf, 'accused'));
    p.records.push(courtRecord(cf, 'accused', p));
    if (cf.custody) p.records.push(custodyRecord(cf, p));
    p.identifiers.push({ type: 'fir', value: cf.fir.fir_no, system: 'cctns' });
    p.identifiers.push({ type: 'cnr', value: cf.court.cnr, system: 'ecourts' });
    if (cf.forensic) p.identifiers.push({ type: 'fsl', value: cf.forensic.lab_case_no, system: 'eforensics' });
    if (cf.custody) for (const no of cf.custody.numbers) p.identifiers.push({ type: 'prisoner', value: no, system: 'eprisons' });
  }
  for (const p of people) {
    if (p.scenario !== 'complainant') continue;
    const accused = byIdx(p.opts.of);
    const cf = cases[accused.idx];
    p.records.push(firRecord(cf, p.role, accused, p.opts.relation || null));
    if (cf.forensic && p.forensicSubject) p.records.push(forensicRecord(cf, p.role));
    p.records.push(courtRecord(cf, p.role, accused));
    p.identifiers.push({ type: 'fir', value: cf.fir.fir_no, system: 'cctns' });
    p.identifiers.push({ type: 'cnr', value: cf.court.cnr, system: 'ecourts' });
  }

  // visitors and the visits each inmate received
  for (const p of people) {
    if (p.scenario !== 'visitor') continue;
    const inmate = byIdx(p.opts.of);
    const cf = cases[inmate.idx];
    const visits = visitRecords(p, inmate, cf);
    for (const v of visits) {
      p.records.push(v);
      p.identifiers.push({ type: 'visit', value: v.ref, system: 'eprisons' });
      cf.custody.visits.push({ reg_no: v.ref, date: v.data.visit_date, mode: v.data.visit_mode, status: v.status, visitor: p.name, visitor_ref: p.ref, relation: v.data.relationship });
    }
    if (p.opts.grievance) p.records.push(grievanceRecord(p, inmate, cf));
  }
  // the inmate's custody record lists its visits, newest first
  for (const p of people) {
    const cf = cases[p.idx];
    const rec = cf && cf.custody && p.records.find((x) => x.type === 'custody');
    if (rec) rec.data.visits_received = cf.custody.visits.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  for (const p of people) {
    if (p.scenario === 'civil') p.records.push(civilRecord(p, nextSeq));
    if (p.scenario === 'verification') for (const v of verificationRecords(p)) p.records.push(v);
  }
  // released and on-bail accused people have antecedent checks done on them later
  for (const p of people) {
    if (['served', 'acquitted'].includes(p.scenario)) {
      p.records.push(verificationRequest(p, {
        kind: 'antecedent', purpose: 'Employment verification', requester: 'employer',
        date: add(ANCHOR, -p.r.int(20, 160)), status: 'closed',
        result: p.scenario === 'served' ? 'record_found' : 'record_found_disposed',
      }));
    }
  }

  // UIDAI: identity and update requests for everyone who has an Aadhaar
  for (const p of people) {
    if (!p.aadhaar) continue;
    p.records.unshift(identityRecord(p, cases[p.idx]));
    for (const u of updateRequests(p)) p.records.splice(1, 0, u);
  }

  return {
    version: VERSION,
    anchor: ANCHOR,
    subjects: people.map((p) => ({
      ref: p.ref, name: p.name, gender: p.gender, dob: p.dob,
      district: DISTRICTS[p.district].name, scenario: p.scenario,
      identifiers: dedupe(p.identifiers), records: p.records,
      demo: { aadhaar: p.aadhaar || null, mobile: p.mobile },
    })),
  };

  // ======================================================================
  function caseFile(p, nextSeqFn) {
    const { r } = p;
    const D = DISTRICTS[p.district];
    const crime = CRIMES[p.detail];
    const ps = p.locality.ps;
    const window = {
      convict: ['2022-04-01', '2025-01-31'],
      acquitted: ['2023-01-01', '2024-12-31'],
      appeal: ['2023-06-01', '2024-10-31'],
      served: ['2019-02-01', '2019-10-31'],
      bail: ['2025-03-01', '2025-12-31'],
      undertrial: ['2025-05-01', '2026-07-31'],
    }[p.scenario];
    // a convict still in prison must have a sentence that has not yet run out
    let lo = window[0];
    if (['convict', 'appeal'].includes(p.scenario) && crime.years) {
      const earliest = add(ANCHOR, -(crime.years * 365) + 330);
      if (earliest > lo) lo = earliest;
    }
    const firDate = between(r, lo, window[1]);
    const law = firDate >= BNS_FROM ? crime.bns : crime.ipc;
    const firNo = `${pad(nextSeqFn('fir', ps + yearOf(firDate), r, 40, 900), 4)}/${yearOf(firDate)}`;
    const io = { name: r.pick(OFFICER_NAMES), rank: r.pick(IO_RANKS) };
    const arrested = add(firDate, r.int(1, 5));

    const fir = {
      fir_no: firNo, police_station: `${ps} Police Station`, ps_short: ps, district: D.name,
      registered_on: firDate, sections: law, offence: crime.title,
      io, arrested_on: arrested,
    };

    // forensic submission
    let forensic = null;
    if (crime.division) {
      const collected = add(firDate, r.int(0, 1));
      const dispatched = add(collected, r.int(2, 6));
      const deposited = add(dispatched, r.int(0, 1));
      const registered = add(deposited, r.int(1, 3));
      const examStart = add(registered, r.int(6, 25));
      const reportReady = add(examStart, r.int(35, 110));
      const closed = add(reportReady, r.int(3, 10));
      let status;
      if (['convict', 'acquitted', 'served', 'appeal'].includes(p.scenario)) status = 'closed';
      else if (p.scenario === 'bail') status = 'report_ready';
      else {
        status = r.pick(['under_examination', 'under_examination', 'report_ready', 'registered', 'deficient', 'closed']);
      }
      // a status may not be dated in the future: fall back to the stage reached by the anchor
      const order = [['dispatched', dispatched], ['deposited', deposited], ['registered', registered], ['under_examination', examStart], ['report_ready', reportReady], ['closed', closed]];
      const reachable = order.filter(([, d]) => d <= ANCHOR).map(([s]) => s);
      if (status !== 'deficient' && !reachable.includes(status)) status = reachable[reachable.length - 1] || 'dispatched';
      if (status === 'deficient' && examStart > ANCHOR) status = reachable[reachable.length - 1] || 'dispatched';
      const lab = D.lab;
      const labNo = `${lab.prefix}-${lab.code}/${crime.division.code}/${yearOf(deposited)}/${pad(nextSeqFn('fsl', lab.code + crime.division.code + yearOf(deposited), r, 100, 900), 4)}`;
      const history = [];
      const reached = status === 'deficient' ? 'under_examination' : status;
      for (const [s, d] of order) {
        history.push({ status: s, at: d });
        if (s === reached) break;
      }
      if (status === 'deficient') history.push({ status: 'deficient', at: minDate(add(examStart, r.int(2, 12)), ANCHOR) });
      const authority = { name: r.pick(OFFICER_NAMES), rank: r.chance(0.7) ? 'ACP' : 'DCP' };
      forensic = {
        lab_case_no: labNo, laboratory: lab.name, division: crime.division.name, status, history,
        collected_on: collected, dispatched_on: dispatched, deposited_on: deposited,
        receipt_no: `${lab.code}/RCPT/${yearOf(deposited)}/${pad(r.int(1000, 9999), 5)}`,
        memo_no: `${initials(ps).toUpperCase()}PS/FSL/${pad(r.int(100, 999), 3)}/${yearOf(dispatched)}`,
        authority,
        mlc_no: crime.injury ? `MLC/${pad(r.int(100, 2999), 4)}/${yearOf(firDate)}` : null,
        pm_no: crime.death ? `PM-${pad(r.int(100, 1999), 4)}/${yearOf(firDate)}` : null,
        hospital: D.hospital,
        exhibits: crime.exhibits.map((e, i) => ({
          serial: i + 1, description: e.description,
          quantity: { value: e.qty[0], unit: e.qty[1] },
          preservative: e.preservative ? PRESERVATIVE[e.preservative] : null,
          source: e.source, parcels: 1,
          collected_by: `${io.rank} ${io.name}`,
          collected_at: stamp(collected, r.int(10, 18), r.pick([0, 15, 30, 45])),
        })),
        questions: crime.questions,
        seal: { type: 'Metallic seal', identifier: `${initials(ps).toUpperCase()}PS-SEAL-${pad(r.int(1, 40), 2)}`, specimen_supplied: true, attested_by: 'Station House Officer', matches_specimen: true },
        transport: r.chance(0.8) ? 'Special messenger' : 'Registered post',
        messenger: `Police Constable ${r.pick(OFFICER_NAMES)}, buckle no. ${r.int(1000, 9999)}`,
        computer: !!crime.computer,
        report: ['report_ready', 'closed'].includes(status) ? {
          ready_on: reportReady,
          dispatched_on: status === 'closed' ? closed : null,
          note: `Examination report forwarded to the investigating officer under memo ${labNo}/R.`,
        } : null,
        deficiency: status === 'deficient' ? 'Specimen seal impression not supplied with the forwarding letter; resubmission requested.' : null,
      };
    }

    // court case
    const filed = add(arrested, r.int(55, 85));             // charge-sheet within the statutory period
    const registered = add(filed, r.int(2, 9));
    const year = yearOf(filed);
    const est = crime.sessions ? '01' : '02';
    const caseNo = `${nextSeqFn('case', D.cnr + est + year, r, 30, 600)}/${year}`;
    const filingNo = `${nextSeqFn('filing', D.cnr + est + year, r, 900, 3000)}/${year}`;
    const cnr = `MH${D.cnr}${est}${pad(nextSeqFn('cnr', D.cnr + est, r, 1000, 9000), 6)}${year}`;
    const courtNo = r.int(1, 9);
    const court = crime.sessions
      ? `Additional Sessions Judge, Court No. ${courtNo}, ${D.court}`
      : `${D.magistrate}, Court No. ${courtNo}, ${D.court.replace('District and Sessions Court', 'Court Complex')}`;
    const disposedWindow = {
      convict: [add(registered, 300), add(ANCHOR, -40)],
      acquitted: [add(registered, 280), add(ANCHOR, -30)],
      appeal: [add(registered, 300), add(ANCHOR, -120)],
      served: [add(registered, 380), add(registered, 700)],
    }[p.scenario];
    const disposed = disposedWindow ? between(r, disposedWindow[0], disposedWindow[1]) : null;
    const status = p.scenario === 'appeal' ? 'in_appeal' : disposed ? 'disposed' : (registered <= ANCHOR ? 'pending' : 'filed');
    const outcome = { convict: 'convicted', served: 'convicted', appeal: 'convicted', acquitted: 'acquitted' }[p.scenario] || null;
    const inCustody = ['convict', 'undertrial', 'appeal'].includes(p.scenario);
    const hearings = hearingsFor(r, registered, disposed, crime, inCustody, firDate >= BNS_FROM, outcome);
    const defence = r.pick(ADVOCATES);
    const history = [{ status: 'filed', at: filed }];
    if (registered <= ANCHOR) history.push({ status: 'registered', at: registered });
    if (hearings.past.length) history.push({ status: 'pending', at: hearings.past[0].date });
    if (disposed) history.push({ status: 'disposed', at: disposed });
    const appealFiled = p.scenario === 'appeal' ? add(disposed, r.int(25, 60)) : null;
    if (appealFiled) history.push({ status: 'in_appeal', at: appealFiled });
    const courtCase = {
      cnr, case_type: crime.courtType, case_abbr: crime.courtAbbr, case_no: caseNo, filing_no: filingNo,
      court, court_complex: D.complex, district: D.name, state: 'Maharashtra',
      status, outcome, filed_on: filed, registered_on: registered, disposed_on: disposed, history,
      acts: law, police_station: fir.police_station, fir_no: firNo,
      prosecutor: `Adv. ${r.pick(PROSECUTORS)}, Additional Public Prosecutor`,
      defence: { name: `Adv. ${defence[0]}`, bar: defence[1] },
      hearings: hearings.past, next_hearing: status === 'pending' ? hearings.next : null,
      orders: hearings.orders,
      judgment: disposed ? (outcome === 'convicted'
        ? `Convicted under ${sectionText(law.slice(0, 2))}; sentenced to ${crime.sentence.toLowerCase()}.`
        : 'Acquitted of all charges; the prosecution did not prove the case beyond reasonable doubt.') : null,
      appeal: appealFiled ? { court: 'High Court of Judicature at Bombay', filed_on: appealFiled, number: `Criminal Appeal No. ${r.int(200, 1400)}/${yearOf(appealFiled)}`, status: 'Admitted; sentence not suspended' } : null,
    };

    // custody
    let custody = null;
    {
      const prison = p.gender === 'F' ? D.womenPrison : D.prison;
      const admitted = add(arrested, 1);
      const utNo = `${prison.code}/UT/${yearOf(admitted)}/${pad(nextSeqFn('prisoner', prison.code + yearOf(admitted), r, 1000, 6000), 5)}`;
      const numbers = [utNo];
      let cstatus = 'undertrial';
      let released = null;
      let releaseReason = null;
      let ctNo = null;
      if (outcome === 'convicted') {
        ctNo = `${prison.code}/CT/${yearOf(disposed)}/${pad(nextSeqFn('prisoner', prison.code + 'CT' + yearOf(disposed), r, 100, 900), 5)}`;
        numbers.push(ctNo);
        cstatus = 'convict';
      }
      if (p.scenario === 'acquitted') { cstatus = 'released_acquitted'; released = disposed; releaseReason = 'Acquitted by the court'; }
      if (p.scenario === 'bail') {
        released = add(admitted, r.int(25, 110));
        cstatus = 'released_bail'; releaseReason = `Bail granted by the ${crime.sessions ? 'Sessions Court' : 'Magistrate'}`;
      }
      let expected = null;
      if (outcome === 'convicted' && crime.years) {
        expected = add(add(admitted, crime.years * 365), -r.int(120, 300)); // set-off and remission
        if (p.scenario === 'served') cstatus = 'released_sentence';
        if (p.scenario === 'served') { released = minDate(expected, add(ANCHOR, -r.int(200, 500))); releaseReason = 'Sentence completed, with set-off and remission'; }
      }
      const chistory = [{ status: 'undertrial', at: admitted }];
      if (outcome === 'convicted') chistory.push({ status: 'convict', at: disposed });
      if (released) chistory.push({ status: cstatus, at: released });
      custody = {
        prison: prison.name, prison_code: prison.code, prisoner_no: ctNo || utNo, numbers,
        status: cstatus, admitted_on: admitted,
        warrant: `Remand warrant of the ${D.magistrate}, ${D.name}`,
        released_on: released, release_reason: releaseReason,
        expected_release: cstatus === 'convict' ? expected : null,
        sentence: outcome === 'convicted' ? crime.sentence : null,
        history: chistory, visits: [],
        next_production: courtCase.next_hearing,
        furlough: cstatus === 'convict' && r.chance(0.5) ? [{ kind: 'Furlough', from: add(disposed, r.int(200, 260)), days: 14, returned: 'On time' }].filter((f) => f.from < ANCHOR) : [],
      };
      if (p.scenario === 'served' && !custody.released_on) custody.released_on = add(ANCHOR, -300);
    }
    return { fir, forensic, court: courtCase, custody, crime, district: D, law, accused: p };
  }

  function hearingsFor(r, from, disposed, crime, inCustody, bnss, outcome) {
    const end = disposed || ANCHOR;
    const flow = [
      'Appearance of the accused', 'Supply of police papers', crime.sessions ? 'Committal and framing of charge' : 'Framing of charge',
      'Prosecution evidence (PW-1)', 'Prosecution evidence (PW-2)', 'Prosecution evidence (PW-3)',
      bnss ? 'Statement of the accused under section 351 BNSS' : 'Statement of the accused under section 313 CrPC',
      'Defence evidence', 'Final arguments',
    ];
    const past = [];
    const orders = [];
    let d = add(from, r.int(10, 30));
    let i = 0;
    const target = r.int(9, 13);
    while (d < end && past.length < 16) {
      const purpose = flow[Math.min(i, flow.length - 1)];
      const adjourned = r.chance(0.3);
      past.push({
        date: d, purpose,
        business: adjourned ? r.pick(['Adjourned: witness absent', 'Adjourned at the request of the defence', 'Adjourned: presiding officer on leave']) : 'Proceedings recorded',
        mode: inCustody && r.chance(0.55) ? 'Video conference' : 'Physical',
      });
      if (!adjourned) i += 1;
      if (i === 1 && !orders.length) orders.push({ date: d, type: 'interim', title: inCustody ? 'Bail application rejected' : 'Bail granted on personal bond' });
      d = add(d, gapFor(r, from, end, target));
    }
    if (disposed) {
      past.push({ date: disposed, purpose: 'Judgment', business: outcome === 'convicted' ? 'Accused convicted; sentence pronounced' : 'Accused acquitted', mode: 'Physical' });
      orders.push({ date: disposed, type: 'final', title: outcome === 'convicted' ? 'Judgment: conviction and sentence' : 'Judgment: acquittal' });
    }
    const next = disposed ? null : {
      date: add(ANCHOR, r.int(6, 58)),
      purpose: flow[Math.min(i, flow.length - 1)],
      mode: inCustody && r.chance(0.6) ? 'Video conference' : 'Physical',
    };
    return { past, next, orders };
  }

  function attachComplainant(p, cf, accused) {
    p.role = p.detail === 'informant' ? 'complainant' : p.detail === 'injured' ? 'victim' : 'complainant';
    p.forensicSubject = p.detail === 'injured';
    cf.complainants = (cf.complainants || []).concat([{ ref: p.ref, name: p.name, role: p.role, relation: p.opts.relation || null }]);
    cf.accusedName = accused.name;
  }

  function firRecord(cf, role, accused, relation) {
    const f = cf.fir;
    return {
      system: 'cctns', type: 'fir', ref: `${f.police_station} · FIR ${f.fir_no}`, status: null, role,
      date: f.registered_on,
      data: {
        fir_no: f.fir_no, fir_year: yearOf(f.registered_on), police_station: f.police_station,
        district: f.district, state: 'Maharashtra', registered_on: f.registered_on,
        offence: f.offence, sections: sections(f.sections),
        investigating_officer: { name: f.io.name, rank: f.io.rank, rank_name: RANK_NAME[f.io.rank] },
        role,
        relation,
        accused: [{ name: accused.name, ref: accused.ref, arrested_on: f.arrested_on }],
        complainants: (cf.complainants || []).map((c) => ({ name: c.name, ref: c.ref, role: c.role })),
        links: { forensic: cf.forensic ? cf.forensic.lab_case_no : null, cnr: cf.court.cnr, prisoner_no: cf.custody ? cf.custody.prisoner_no : null },
      },
    };
  }

  function forensicRecord(cf, role) {
    const fs = cf.forensic;
    const f = cf.fir;
    const custodyEvents = [
      { seq: 1, type: 'Collected', at: fs.exhibits[0].collected_at, from: null, to: `${f.io.rank} ${f.io.name}`, seal_state: 'Applied' },
      { seq: 2, type: 'Handed to messenger', at: stamp(fs.dispatched_on, 9, 40), from: `${f.io.rank} ${f.io.name}`, to: fs.messenger, seal_state: 'Intact' },
    ];
    if (fs.history.some((h) => h.status === 'deposited')) {
      custodyEvents.push({ seq: 3, type: 'Deposited at the counter', at: stamp(fs.deposited_on, 11, 5), from: fs.messenger, to: fs.laboratory, seal_state: 'Intact', receipt_no: fs.receipt_no });
    }
    if (fs.report && fs.report.dispatched_on) {
      custodyEvents.push({ seq: custodyEvents.length + 1, type: 'Report and parcels returned', at: stamp(fs.report.dispatched_on, 15, 30), from: fs.laboratory, to: f.police_station, seal_state: 'Resealed by the laboratory' });
    }
    return {
      system: 'eforensics', type: 'forensic_submission', ref: fs.lab_case_no, status: fs.status, role,
      date: fs.deposited_on,
      data: {
        lab_case_no: fs.lab_case_no, laboratory: fs.laboratory, division: fs.division,
        receipt: fs.history.some((h) => h.status === 'deposited') ? { number: fs.receipt_no, issued_at: stamp(fs.deposited_on, 11, 5) } : { number: null, issued_at: null },
        case: {
          police_station: f.police_station, case_number: f.fir_no, case_date: f.registered_on, fir_number: f.fir_no,
          sections: sections(f.sections), mlc_number: fs.mlc_no, post_mortem_number: fs.pm_no,
          hospital: fs.mlc_no || fs.pm_no ? fs.hospital : null,
        },
        subject_category: role === 'accused' ? 'Accused' : role === 'victim' ? 'Complainant (injured)' : 'Complainant',
        investigating_officer: { name: f.io.name, rank: f.io.rank, rank_name: RANK_NAME[f.io.rank] },
        forwarding_authority: { name: fs.authority.name, rank: fs.authority.rank, rank_name: RANK_NAME[fs.authority.rank], rank_rule_satisfied: true },
        memo_number: fs.memo_no,
        exhibits: fs.exhibits, questions: fs.questions, seal: fs.seal,
        transport: fs.transport, custody_events: custodyEvents,
        declaration: { guidelines_read: true, signed_at: stamp(fs.dispatched_on, 9, 15) },
        storage_device_supplied: fs.computer ? true : null,
        report: fs.report, deficiency: fs.deficiency,
        dates: { collected: fs.collected_on, dispatched: fs.dispatched_on, deposited: fs.deposited_on },
      },
      history: fs.history,
    };
  }

  function courtRecord(cf, role, accused) {
    const c = cf.court;
    const roleLabel = role === 'accused' ? 'Accused No. 1' : role === 'victim' ? 'Injured witness (prosecution)' : 'Informant (prosecution witness)';
    return {
      system: 'ecourts', type: 'court_case', ref: c.cnr, status: c.status, role,
      date: c.filed_on,
      data: {
        cnr: c.cnr, case_type: c.case_type, case_no: `${c.case_abbr} ${c.case_no}`, filing_no: c.filing_no,
        court: c.court, court_complex: c.court_complex, district: c.district, state: c.state,
        case_state: ['disposed', 'closed'].includes(c.status) ? 'Disposed' : 'Pending',
        filed_on: c.filed_on, registered_on: c.registered_on, disposed_on: c.disposed_on,
        outcome: c.outcome, judgment: c.judgment, appeal: c.appeal,
        parties: {
          petitioner: `State of Maharashtra (through ${c.police_station})`,
          respondent: accused.name, respondent_ref: accused.ref,
          witnesses: (cf.complainants || []).map((x) => ({ name: x.name, ref: x.ref, role: x.role })),
        },
        party_role: roleLabel,
        acts: sections(c.acts), police_station: c.police_station, fir_no: c.fir_no,
        prosecutor: c.prosecutor, defence_advocate: c.defence,
        hearings: c.hearings.slice().reverse(), next_hearing: c.next_hearing, orders: c.orders.slice().reverse(),
        last_order: c.orders.length ? c.orders[c.orders.length - 1] : null,
      },
      history: c.history,
    };
  }

  function custodyRecord(cf, p) {
    const k = cf.custody;
    return {
      system: 'eprisons', type: 'custody', ref: k.prisoner_no, status: k.status, role: 'inmate',
      date: k.admitted_on,
      data: {
        prisoner_no: k.prisoner_no, earlier_numbers: k.numbers.filter((n) => n !== k.prisoner_no),
        prison: k.prison, state: 'Maharashtra',
        category: { undertrial: 'Undertrial prisoner', convict: 'Convicted prisoner', released_bail: 'Released (undertrial on bail)', released_acquitted: 'Released (acquitted)', released_sentence: 'Released (sentence completed)' }[k.status],
        in_custody: ['undertrial', 'convict'].includes(k.status),
        inmate: { name: p.name, father_name: p.fatherName, age: ageOn(p.dob, ANCHOR), gender: p.gender === 'F' ? 'Female' : 'Male' },
        admitted_on: k.admitted_on, warrant: k.warrant,
        fir: { police_station: cf.fir.police_station, fir_no: cf.fir.fir_no }, cnr: cf.court.cnr,
        sections: sections(cf.fir.sections), court: cf.court.court,
        sentence: k.sentence, expected_release: k.expected_release,
        released_on: k.released_on, release_reason: k.release_reason,
        next_production: k.status === 'undertrial' ? k.next_production : null,
        aadhaar_linked: !!p.aadhaar,
        furlough: k.furlough,
        visits_received: [],
      },
      history: k.history,
    };
  }

  function visitRecords(p, inmate, cf) {
    const { r } = p;
    const k = cf.custody;
    const out = [];
    const n = r.int(2, 4);
    let d = add(ANCHOR, -r.int(240, 330));
    if (d < k.admitted_on) d = add(k.admitted_on, 20);
    const dates = [];
    while (dates.length < n && d <= add(ANCHOR, -7)) { dates.push(d); d = add(d, r.int(45, 80)); }
    if (!dates.length) dates.push(add(ANCHOR, -7));
    const tail = r.pick(['approved', 'registered', 'visited']);
    for (let i = 0; i < dates.length; i += 1) {
      const last = i === dates.length - 1;
      let status = last ? tail : 'visited';
      if (p.idx === 36 && i === 0) status = 'rejected';
      const visitDate = last && status !== 'visited' ? add(ANCHOR, r.int(3, 12)) : dates[i];
      const reg = `MUL${yearOf(visitDate)}MH${r.digits(7)}`;
      // nothing is dated after the dataset's "today", even for a visit still to come
      const regDate = minDate(add(visitDate, -r.int(3, 9)), add(ANCHOR, -r.int(2, 4)));
      const mode = r.chance(0.45) ? 'Video conference' : 'Physical';
      const history = [{ status: 'registered', at: regDate }, { status: 'verification', at: minDate(add(regDate, 1), ANCHOR) }];
      if (['approved', 'visited'].includes(status)) history.push({ status: 'approved', at: minDate(add(regDate, 2), ANCHOR) });
      if (status === 'visited') history.push({ status: 'visited', at: visitDate });
      out.push({
        system: 'eprisons', type: 'visit_request', ref: reg, status, role: 'visitor', date: regDate,
        data: {
          registration_no: reg, visit_date: visitDate, visit_mode: mode, prison: k.prison, state: 'Maharashtra',
          prisoner: { name: inmate.name, father_name: inmate.fatherName, age: ageOn(inmate.dob, ANCHOR), gender: inmate.gender === 'F' ? 'Female' : 'Male', ref: inmate.ref },
          visitor: { name: p.name, father_or_husband: p.careOf.replace(/^[A-Z]\/O /, ''), gender: p.gender === 'F' ? 'Female' : 'Male', age: ageOn(p.dob, ANCHOR), address: `${p.address.house}, ${p.address.street}, ${p.address.loc}, ${p.address.vtc}` },
          relationship: p.detail,
          identity_proof: p.aadhaar ? { type: 'AADHAAR', number_masked: `XXXXXXXX${p.aadhaar.slice(-4)}` } : { type: 'NOT AVAILABLE', number_masked: null },
          international_visitor: false,
          additional_visitors: status === 'rejected' ? 3 : r.int(0, 2),
          slot: ['approved', 'visited'].includes(status) ? (mode === 'Video conference' ? `${r.pick(['11:00', '12:30', '15:00'])} to ${r.pick(['11:20', '12:50', '15:20'])}, PIN sent by e-mail` : `${r.pick(['10:00', '11:30', '14:00'])} to ${r.pick(['10:30', '12:00', '14:30'])}`) : null,
          rejection_reason: status === 'rejected' ? 'More than the permitted number of visitors requested for one visit.' : null,
        },
        history,
      });
    }
    return out;
  }

  function grievanceRecord(p, inmate, cf) {
    const { r } = p;
    const cat = p.opts.grievance === 'facilities' ? 'Basic facilities not provided inside prison' : 'Others';
    const msg = p.opts.grievance === 'facilities'
      ? `My husband ${inmate.name} is diabetic and has not received his regular medicines for two weeks. Request a check-up at the prison hospital and regular supply of medicines.`
      : `Request that video conference visits with my mother ${inmate.name} be allowed on Saturdays, as I work on weekdays and cannot attend the morning slots.`;
    const at = add(ANCHOR, -r.int(20, 90));
    const status = p.opts.grievance === 'facilities' ? 'disposed' : 'acknowledged';
    const history = [{ status: 'submitted', at }, { status: 'acknowledged', at }];
    if (status === 'disposed') history.push({ status: 'verification', at: add(at, 3) }, { status: 'disposed', at: add(at, r.int(8, 15)) });
    return {
      system: 'eprisons', type: 'grievance', ref: `GRV/MH/${yearOf(at)}/${pad(r.int(100, 9999), 5)}`, status, role: 'complainant', date: at,
      data: {
        category: cat, message: msg.slice(0, 250), relation: p.detail,
        prison: cf.custody.prison, state: 'Maharashtra',
        prisoner: { name: inmate.name, gender: inmate.gender === 'F' ? 'Female' : 'Male', age: ageOn(inmate.dob, ANCHOR), ref: inmate.ref },
        action: status === 'disposed' ? 'Inmate examined by the prison medical officer; medicines issued from the prison hospital pharmacy.' : null,
      },
      history,
    };
  }

  function civilRecord(p, nextSeqFn) {
    const { r } = p;
    const D = DISTRICTS[p.district];
    const kinds = {
      maintenance: { type: 'Criminal Miscellaneous Application (maintenance)', abbr: 'Cri. M.A.', act: [['BNSS', '144']], role: 'Applicant', other: `${r.pick(MALE_FIRST)} ${p.name.split(' ')[1]}`, status: 'pending', court: 'Family Court, Pune', nature: 'Maintenance for wife and minor child' },
      property: { type: 'Regular Civil Suit', abbr: 'R.C.S.', act: [['Specific Relief Act', '34'], ['CPC', 'Order VII Rule 1']], role: 'Plaintiff', other: `${r.pick(MALE_FIRST)} ${r.pick(['Gholap', 'Bhamre', 'Aher'])}`, status: 'pending', court: `Civil Judge Junior Division, Court No. ${r.int(1, 6)}, ${D.name}`, nature: 'Declaration and permanent injunction over agricultural land' },
      recovery: { type: 'Special Civil Suit', abbr: 'S.C.S.', act: [['CPC', 'Order XXXVII']], role: 'Plaintiff', other: 'Shree Mahalaxmi Traders', status: 'disposed', court: `Civil Judge Senior Division, Court No. ${r.int(1, 4)}, ${D.name}`, nature: 'Recovery of Rs. 8,40,000 with interest' },
      tenancy: { type: 'Regular Civil Appeal', abbr: 'R.C.A.', act: [['Maharashtra Rent Control Act', '16']], role: 'Respondent', other: 'Shantaram Desai', status: 'in_appeal', court: 'Court of Small Causes, Mumbai', nature: 'Eviction of a tenant for bona fide requirement' },
    }[p.detail];
    const filed = add(ANCHOR, -r.int(240, 900));
    const registered = add(filed, r.int(3, 12));
    const year = yearOf(filed);
    const cnr = `MH${D.cnr}03${pad(nextSeqFn('cnr', D.cnr + '03', r, 1000, 9000), 6)}${year}`;
    const hearings = [];
    let d = add(registered, r.int(15, 40));
    const flow = ['Appearance of the parties', 'Written statement', 'Framing of issues', 'Evidence of the plaintiff', 'Cross-examination', 'Evidence of the defendant', 'Arguments'];
    let i = 0;
    const disposed = kinds.status !== 'pending' ? add(ANCHOR, -r.int(90, 200)) : null;
    const civilEnd = disposed || ANCHOR;
    while (d < civilEnd && hearings.length < 12) {
      const adj = r.chance(0.35);
      hearings.push({ date: d, purpose: flow[Math.min(i, flow.length - 1)], business: adj ? 'Adjourned at the request of a party' : 'Proceedings recorded', mode: 'Physical' });
      if (!adj) i += 1;
      d = add(d, gapFor(r, registered, civilEnd, 9));
    }
    if (disposed) hearings.push({ date: disposed, purpose: 'Judgment', business: 'Suit decreed', mode: 'Physical' });
    const history = [{ status: 'filed', at: filed }, { status: 'registered', at: registered }];
    if (hearings.length) history.push({ status: 'pending', at: hearings[0].date });
    if (disposed) history.push({ status: 'disposed', at: disposed });
    let appeal = null;
    if (kinds.status === 'in_appeal') {
      appeal = { court: 'Appellate Bench, Court of Small Causes, Mumbai', filed_on: add(disposed, 30), number: `Appeal No. ${r.int(100, 600)}/${yearOf(disposed)}`, status: 'Pending' };
      history.push({ status: 'in_appeal', at: appeal.filed_on });
    }
    const adv = r.pick(ADVOCATES);
    const mine = p.name;
    const isPlaintiff = kinds.role !== 'Respondent';
    p.identifiers.push({ type: 'cnr', value: cnr, system: 'ecourts' });
    return {
      system: 'ecourts', type: 'court_case', ref: cnr, status: kinds.status, role: kinds.role.toLowerCase(), date: filed,
      data: {
        cnr, case_type: kinds.type, case_no: `${kinds.abbr} ${nextSeqFn('case', D.cnr + '03' + year, r, 50, 800)}/${year}`, filing_no: `${r.int(1000, 5000)}/${year}`,
        court: kinds.court, court_complex: D.complex, district: D.name, state: 'Maharashtra',
        case_state: ['disposed', 'closed'].includes(kinds.status) ? 'Disposed' : 'Pending',
        filed_on: filed, registered_on: registered, disposed_on: disposed, outcome: disposed ? 'decreed' : null,
        judgment: disposed ? 'Suit decreed with costs.' : null, appeal,
        nature: kinds.nature,
        parties: { petitioner: isPlaintiff ? mine : kinds.other, respondent: isPlaintiff ? kinds.other : mine, witnesses: [] },
        party_role: kinds.role,
        acts: sections(kinds.act), police_station: null, fir_no: null,
        prosecutor: null, defence_advocate: { name: `Adv. ${adv[0]}`, bar: adv[1] },
        hearings: hearings.slice().reverse(),
        next_hearing: kinds.status === 'pending' ? { date: add(ANCHOR, r.int(7, 45)), purpose: flow[Math.min(i, flow.length - 1)], mode: 'Physical' } : null,
        orders: disposed ? [{ date: disposed, type: 'final', title: 'Judgment and decree' }] : [{ date: hearings.length ? hearings[0].date : registered, type: 'interim', title: 'Notice issued to the other side' }],
        last_order: null,
      },
      history,
    };
  }

  function verificationRecords(p) {
    const { r } = p;
    const D = DISTRICTS[p.district];
    switch (p.detail) {
      case 'tenant': return [verificationRequest(p, { kind: 'antecedent', purpose: 'Tenant verification', requester: 'landlord', date: add(ANCHOR, -r.int(15, 60)), status: 'completed', result: 'no_record_found' })];
      case 'vehicle': return [
        verificationRequest(p, { kind: 'vehicle', purpose: 'Pre-purchase vehicle verification', requester: 'citizen', date: add(ANCHOR, -r.int(30, 120)), status: 'closed', result: 'no_record_found', vehicle: { reg: `MH04${r.pick(['GH', 'JK', 'EF'])}${r.int(1000, 9999)}`, chassis: `MA3${r.digits(2)}${r.pick(['FB', 'EW', 'ER'])}${r.digits(9)}`, engine: `K12M${r.digits(7)}` } }),
        verificationRequest(p, { kind: 'antecedent', purpose: 'Employee verification', requester: 'employer', date: add(ANCHOR, -r.int(5, 25)), status: 'in_progress', result: null }),
      ];
      case 'pcc': return [verificationRequest(p, { kind: 'pcc', purpose: 'Employment abroad', requester: 'citizen', date: add(ANCHOR, -r.int(20, 70)), status: 'closed', result: 'no_record_found', district: D.name })];
      case 'deferred': return [verificationRequest(p, { kind: 'antecedent', purpose: 'Domestic help verification', requester: 'employer', date: add(ANCHOR, -r.int(2, 9)), status: 'deferred', result: null })];
      case 'blocked': return [verificationRequest(p, { kind: 'antecedent', purpose: 'Employee verification', requester: 'employer', date: add(ANCHOR, -r.int(3, 12)), status: 'blocked', result: null })];
      default: return [];
    }
  }

  function verificationRequest(p, o) {
    const { r } = p;
    const reqId = `REQ-${yearOf(o.date)}-${pad(r.int(1000, 99999), 6)}`;
    const performed = add(o.date, r.int(1, 6));
    const history = [{ status: 'submitted', at: o.date }];
    if (['in_progress', 'completed', 'closed', 'deferred'].includes(o.status)) history.push({ status: 'in_progress', at: add(o.date, 1) });
    if (['completed', 'closed'].includes(o.status)) history.push({ status: 'completed', at: performed });
    if (o.status === 'closed') history.push({ status: 'closed', at: add(performed, r.int(1, 5)) });
    if (o.status === 'deferred') history.push({ status: 'deferred', at: add(o.date, 1) });
    if (o.status === 'blocked') history.push({ status: 'blocked', at: o.date });
    const service = { antecedent: 'Antecedent verification', vehicle: 'Generate vehicle NOC', pcc: 'Police clearance certificate (state portal)' }[o.kind];
    const certificate = o.kind === 'pcc' && o.result ? `PCC/MH/${yearOf(performed)}/${pad(r.int(1000, 999999), 6)}` : null;
    if (certificate) p.identifiers.push({ type: 'pcc', value: certificate, system: 'cctns' });
    const resultText = {
      no_record_found: 'No record found',
      record_found: 'Record found: one FIR on record, case disposed with conviction',
      record_found_disposed: 'Record found: one FIR on record, case disposed with acquittal',
    }[o.result] || null;
    return {
      system: 'cctns', type: 'verification_request', ref: certificate || reqId, status: o.status, role: 'subject', date: o.date,
      data: {
        request_id: reqId, service, purpose: o.purpose, requester_role: o.requester,
        lawful_basis: o.requester === 'citizen' ? 'Request made by the subject' : 'Consent of the subject, recorded',
        consent: o.status === 'blocked' ? null : { text_version: '2026-10-01', given_at: stamp(o.date, 10, 5), method: 'OTP on the subject\'s mobile' },
        subject: o.vehicle ? { type: 'vehicle', registration_number: o.vehicle.reg, chassis_number: o.vehicle.chassis, engine_number: o.vehicle.engine, identity_complete: true } : { type: 'person' },
        state: o.kind === 'pcc' ? 'Maharashtra' : null,
        certificate_no: certificate,
        outcome: resultText ? {
          status: o.result, text: resultText, performed_at: stamp(performed, 15, 10),
          channel: o.kind === 'pcc' ? 'State citizen portal' : 'Digital Police Citizen Services',
          method: 'Manual browser session', artefact: o.kind === 'antecedent' ? 'Response by e-mail' : 'PDF certificate',
        } : null,
        service_available: o.status !== 'deferred',
        blocked_reason: o.status === 'blocked' ? 'The subject\'s consent has not been recorded.' : null,
        deferred_reason: o.status === 'deferred' ? 'The official service was unavailable during the scheduled check; a retry is scheduled.' : null,
      },
      history,
    };
  }

  function identityRecord(p, cf) {
    const { r } = p;
    const D = DISTRICTS[p.district];
    const inPrison = !!(cf && cf.custody);
    const pid = inPrison && r.chance(0.5);
    const enrolled = pid ? add(cf.custody.admitted_on, r.int(20, 60)) : between(r, '2011-03-01', '2017-12-31');
    const updated = add(enrolled, r.int(400, 3000)) < ANCHOR ? add(enrolled, r.int(400, 3000)) : enrolled;
    const basis = r.chance(0.9) ? 'Document verification' : 'Confirmation by Head of Family';
    const docs = pid
      ? { poi: DOCUMENTS.pid, poa: DOCUMENTS.pid, pdb: null }
      : { poi: r.pick([DOCUMENTS.voter, DOCUMENTS.passport, DOCUMENTS.driving, DOCUMENTS.service]), poa: r.pick([DOCUMENTS.voter, DOCUMENTS.ration, DOCUMENTS.electricity, DOCUMENTS.rent]), pdb: r.pick([DOCUMENTS.birth, DOCUMENTS.marksheet, DOCUMENTS.passport]) };
    const verifiedAt = add(ANCHOR, -r.int(1, 120));
    return {
      system: 'uidai', type: 'aadhaar_identity', ref: `XXXX XXXX ${p.aadhaar.slice(-4)}`, status: 'active', role: 'resident', date: enrolled,
      data: {
        aadhaar_masked: `XXXX XXXX ${p.aadhaar.slice(-4)}`,
        // keyed (HMAC), so the token cannot be turned back into the Aadhaar number by trying every number
        uid_token: `UTK-${uidToken(p.aadhaar)}`,
        poi: { name: p.name, dob: p.dob, dob_basis: p.dobBasis, gender: p.gender },
        poa: p.address,
        resident_status: 'Resident Indian',
        enrolment: {
          eid_masked: `${p.eid.slice(0, 4)} XXXX XXXX ${p.eid.slice(-2)}`, enrolled_on: enrolled,
          centre: pid ? `In-prison enrolment camp, ${cf.custody.prison}` : D.asks,
          basis, documents: docs,
        },
        biometrics: { photo: 'Captured', fingerprints: 'Captured', iris: 'Captured', last_update: updated },
        contact: { mobile_linked: true, mobile_masked: `XXXXXX${p.mobile.slice(-4)}`, email_linked: r.chance(0.6) },
        aadhaar_status: 'Active',
        last_updated_on: updated,
        verification: {
          channel: r.chance(0.6) ? 'Offline e-KYC (XML)' : 'Aadhaar verifiable credential (offline)',
          performed_at: stamp(verifiedAt, r.int(9, 17), r.pick([0, 10, 25, 40])),
          signature_valid: true, signature_algorithm: 'RSA-SHA256',
          proof_of_presence: 'Face match',
          aadhaar_number_received: false,
          retention: { delete_after: add(verifiedAt, 365), basis: 'Purpose exhausted' },
        },
      },
    };
  }

  function updateRequests(p) {
    const { r } = p;
    let status = null;
    if (p.scenario === 'clean') status = p.detail === 'none' ? null : p.detail;
    else if (r.chance(0.3)) status = r.pick(['closed', 'closed', 'under_review', 'approved']);
    if (!status) return [];
    const items = {
      under_review: ['Address'], approved: ['Mobile'], needs_info: ['Name'], closed: ['Biometric (photo, fingerprints and irises)'],
    }[status] || [r.pick(['Address', 'Mobile', 'E-mail', 'Date of Birth'])];
    const submitted = add(ANCHOR, -(status === 'closed' ? r.int(120, 600) : r.int(4, 40)));
    const history = [{ status: 'submitted', at: submitted }];
    if (status !== 'submitted') history.push({ status: 'under_review', at: add(submitted, 1) });
    if (['verified', 'approved', 'closed'].includes(status)) history.push({ status: 'verified', at: add(submitted, 3) });
    if (['approved', 'closed'].includes(status)) history.push({ status: 'approved', at: add(submitted, r.int(5, 12)) });
    if (status === 'closed') history.push({ status: 'closed', at: add(submitted, r.int(14, 30)) });
    if (status === 'needs_info') history.push({ status: 'needs_info', at: add(submitted, 4) });
    const urn = `URN-${yearOf(submitted)}${r.digits(10)}`;
    return [{
      system: 'uidai', type: 'aadhaar_update', ref: urn, status, role: 'resident', date: submitted,
      data: {
        urn, purpose: 'Update', update_items: items,
        channel: items[0].startsWith('Biometric') || items[0] === 'Mobile' ? 'Aadhaar Seva Kendra (Update Client Standard)' : 'myAadhaar portal',
        submitted_at: stamp(submitted, r.int(9, 17), 0),
        documents: items[0] === 'Address' ? [DOCUMENTS.electricity] : items[0] === 'Name' ? [DOCUMENTS.marksheet] : [],
        deficiency: status === 'needs_info' ? 'The name on the supporting document does not match the requested spelling; submit a document showing the requested name.' : null,
        fee: items[0].startsWith('Biometric') ? 'Rs. 125' : 'Rs. 75',
      },
      history,
    }];
  }
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((x) => {
    const k = `${x.type}:${x.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

let cached = null;
/** The dataset, built once per process. */
function dataset() {
  if (!cached) cached = build();
  return cached;
}

module.exports = { dataset, VERSION, ANCHOR, uidToken };
