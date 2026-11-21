'use strict';

/**
 * The person lookup: one identifier in, everything the five systems hold out.
 *
 *   search(text)   work out what was typed, find the person or people it names
 *   profile(ref)   ask every connector at once and put the answers together
 *
 * Each connector runs on its own, with its own time limit, so one system that
 * is slow or down never hides what the others returned. Every search and every
 * profile opened is written to the append-only audit log.
 */

const ids = require('./identifiers');
const store = require('./store');
const { CONNECTORS } = require('./connectors');
const { progress, journey, eventOf, WORKFLOWS } = require('./workflows');
const { dataset, VERSION, ANCHOR } = require('./dataset');

const TIMEOUT_MS = Number(process.env.LOOKUP_TIMEOUT_MS) || 4000;

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const e = new Error(`No answer within ${ms / 1000} seconds.`);
        e.code = 'TIMEOUT';
        reject(e);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Ask one connector; always resolves to an envelope, never throws. */
async function ask(connector, subject) {
  const started = Date.now();
  const base = {
    code: connector.code, name: connector.name, department: connector.department,
    hostname: connector.hostname, holds: connector.holds,
    attribution: connector.attribution, caveat: connector.caveat, empty: connector.empty,
    mode: 'mirror', retrievedAt: new Date().toISOString(),
  };
  try {
    const records = await withTimeout(Promise.resolve().then(() => connector.fetch(subject)), TIMEOUT_MS);
    const list = Array.isArray(records) ? records : [];
    for (const r of list) r.progress = WORKFLOWS[r.type] ? progress(r.type, r.status, r.history) : null;
    return { ...base, status: list.length ? 'found' : 'none', count: list.length, records: list, ms: Date.now() - started };
  } catch (err) {
    const status = err.code === 'UNAVAILABLE' || err.code === 'TIMEOUT' ? 'unavailable' : 'error';
    if (status === 'error') process.stderr.write(`[erp] lookup connector ${connector.code}: ${err.stack || err}\n`);
    return {
      ...base, status, count: 0, records: [], ms: Date.now() - started,
      message: status === 'unavailable' ? err.message : 'The ERP could not read this system’s answer. The error has been logged.',
    };
  }
}

const ageOn = (dob, on) => {
  const a = new Date(`${dob}T00:00:00Z`), b = new Date(`${on}T00:00:00Z`);
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) y -= 1;
  return y;
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-12-01 -> 1 Dec 2026, the form every date on the page takes. */
const fmt = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : String(d || '');
};
const today = () => new Date().toISOString().slice(0, 10);

/** One line per candidate when an identifier or a name matches several people. */
function candidate(s) {
  return {
    ref: s.subject_ref, name: s.full_name, gender: s.gender, birthYear: s.birth_year,
    district: s.district, aadhaar: store.maskedAadhaar(s.id), counts: store.countsOf(s.id),
  };
}

function bySystem(sources, code) {
  const s = sources.find((x) => x.code === code);
  return s ? s.records : [];
}

/** "0123/2026" and "123/2026" are the same FIR number. */
const firKey = (no, ps) => `${String(no || '').trim().replace(/^0+(?=\d)/, '')}|${String(ps || '').trim().toLowerCase()}`;

/**
 * Journeys: one per FIR. Its later stages are found by the references the records
 * share: the links an FIR carries, or else the FIR number and police station that
 * the forensic submission, the court case and the custody record each quote.
 */
function journeys(sources) {
  const firs = bySystem(sources, 'cctns').filter((r) => r.type === 'fir');
  const fsl = bySystem(sources, 'eforensics');
  const courts = bySystem(sources, 'ecourts');
  const custody = bySystem(sources, 'eprisons').filter((r) => r.type === 'custody');
  return firs.map((f) => {
    const d = f.data;
    const key = firKey(d.fir_no, d.police_station);
    const forensic = fsl.find((x) => x.ref === (d.links && d.links.forensic))
      || fsl.find((x) => x.data.case && firKey(x.data.case.fir_number, x.data.case.police_station) === key) || null;
    const court = courts.find((x) => x.ref === (d.links && d.links.cnr) || (d.links && d.links.cnr && x.data.cnr === d.links.cnr))
      || courts.find((x) => x.data.fir_no && firKey(x.data.fir_no, x.data.police_station) === key) || null;
    const cust = custody.find((x) => x.data.fir && firKey(x.data.fir.fir_no, x.data.fir.police_station) === key) || null;
    const j = journey(
      { fir_no: d.fir_no, police_station: d.police_station, registered_on: d.registered_on, role: f.role },
      {
        forensic: forensic && { status: forensic.status, deposited_on: (forensic.data.dates || {}).deposited || null, laboratory: forensic.data.laboratory, division: forensic.data.division },
        court: court && { status: court.status, outcome: court.data.outcome, filed_on: court.data.filed_on, case_type: court.data.case_type, case_no: court.data.case_no, court: court.data.court },
        custody: cust && { status: cust.status, admitted_on: cust.data.admitted_on, prison: cust.data.prison, prisoner_no: cust.data.prisoner_no },
      },
    );
    j.role = f.role;
    j.offence = d.offence;
    j.policeStation = d.police_station;
    return j;
  });
}

/** Facts worth seeing first, each read from a record. */
function alerts(sources) {
  const out = [];
  for (const r of bySystem(sources, 'eprisons')) {
    if (r.type === 'custody' && r.data.in_custody) {
      out.push({ tone: 'danger', system: 'eprisons', title: `In custody at ${r.data.prison}`, detail: `${r.data.category}, prisoner no. ${r.data.prisoner_no}, admitted ${fmt(r.data.admitted_on)}` });
    }
  }
  for (const r of bySystem(sources, 'ecourts')) {
    if (r.data.next_hearing) out.push({ tone: 'info', system: 'ecourts', title: `Next hearing on ${fmt(r.data.next_hearing.date)}`, detail: `${r.data.case_no}: ${r.data.next_hearing.purpose} (${r.data.next_hearing.mode})` });
  }
  for (const r of bySystem(sources, 'eforensics')) {
    if (r.status === 'deficient') out.push({ tone: 'warning', system: 'eforensics', title: 'Forensic submission returned with a deficiency', detail: `${r.ref}: ${r.data.deficiency}` });
  }
  for (const r of bySystem(sources, 'cctns')) {
    if (r.type === 'verification_request' && ['deferred', 'blocked'].includes(r.status)) {
      out.push({ tone: 'warning', system: 'cctns', title: `${r.data.service} ${r.status === 'deferred' ? 'deferred' : 'blocked'}`, detail: r.data.deferred_reason || r.data.blocked_reason });
    }
  }
  for (const r of bySystem(sources, 'uidai')) {
    if (r.type === 'aadhaar_update' && r.status === 'needs_info') out.push({ tone: 'warning', system: 'uidai', title: 'Aadhaar update needs information', detail: r.data.deficiency });
  }
  return out;
}

/** Every dated event from every system, newest first. */
function timeline(sources) {
  const ev = [];
  const push = (date, system, title, detail, ref) => { if (date) ev.push({ date: String(date).slice(0, 10), system, title, detail: detail || '', ref: ref || null }); };
  for (const src of sources) {
    for (const r of src.records) {
      const wf = WORKFLOWS[r.type];
      if (r.type === 'aadhaar_identity') push(r.data.enrolment.enrolled_on, src.code, 'Aadhaar enrolment', r.data.enrolment.centre, r.ref);
      if (r.type === 'fir') push(r.data.registered_on, src.code, `FIR registered (${r.role})`, `${r.data.police_station}, FIR ${r.data.fir_no}: ${r.data.offence}`, r.ref);
      if (wf) {
        const seen = new Set();
        for (const h of r.history || []) {
          const what = eventOf(r.type, h.status);
          // custody steps share a date (admission and trial); name the moment once
          if (!what || seen.has(`${h.at}:${what}`)) continue;
          seen.add(`${h.at}:${what}`);
          push(h.at, src.code, what, `${wf.title} \u00b7 ${r.ref}`, r.ref);
        }
      }
      if (r.type === 'court_case' && r.data.next_hearing) push(r.data.next_hearing.date, src.code, 'Next hearing (scheduled)', `${r.data.case_no}: ${r.data.next_hearing.purpose}`, r.ref);
    }
  }
  return ev.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const DEPT_REF = /^(UID-R|CCT-P|EFS-S|ECT-L|EPR-P)-\d{6}$/;
/**
 * A department names the people in its records by its own references; an ERP page
 * links people by the ERP's. Swap one for the other, or drop the link when that
 * person has not reached the ERP yet.
 */
function linkRefs(source, value, key) {
  if (typeof value === 'string') return key && /(^|_)ref$/.test(key) && DEPT_REF.test(value) ? store.refFor(source, value) : value;
  if (Array.isArray(value)) return value.map((v) => linkRefs(source, v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = linkRefs(source, v, k);
    return out;
  }
  return value;
}

/** Everything the five systems hold about one person. */
async function profileOf(subject) {
  const sources = await Promise.all(CONNECTORS.map((c) => ask(c, subject)));
  for (const src of sources) for (const r of src.records) r.data = linkRefs(src.code, r.data, null);
  const uid = bySystem(sources, 'uidai').find((r) => r.type === 'aadhaar_identity');
  const inmate = bySystem(sources, 'eprisons').find((r) => r.type === 'custody');
  const dob = uid ? uid.data.poi.dob : null;
  return {
    subject: {
      ref: subject.subject_ref,
      name: uid ? uid.data.poi.name : subject.full_name,
      gender: subject.gender,
      dob, dobBasis: uid ? uid.data.poi.dob_basis : null,
      age: dob ? ageOn(dob, today()) : inmate ? inmate.data.inmate.age : (subject.birth_year ? new Date().getFullYear() - subject.birth_year : null),
      district: subject.district,
      aadhaar: uid ? uid.data.aadhaar_masked : null,
      verified: uid ? uid.data.verification : null,
      address: uid ? uid.data.poa : null,
      identifiers: store.identifiersOf(subject.id).map((i) => ({ type: i.id_type, label: ids.LABEL[i.id_type] || i.id_type, value: i.masked, system: i.source_system })),
      matchedBy: store.matchesOf(subject.id),
    },
    sources,
    journeys: journeys(sources),
    alerts: alerts(sources),
    timeline: timeline(sources),
    summary: {
      found: sources.filter((s) => s.status === 'found').length,
      none: sources.filter((s) => s.status === 'none').length,
      unavailable: sources.filter((s) => s.status === 'unavailable' || s.status === 'error').length,
      records: sources.reduce((a, s) => a + s.count, 0),
    },
    generatedAt: new Date().toISOString(),
    dataset: { version: VERSION, anchor: ANCHOR, synthetic: true },
  };
}

async function search(text, actor) {
  const query = ids.detect(text);
  const q = { type: query.type, label: query.label, display: query.ok ? query.display : null };
  if (!query.ok) return { status: 'invalid', query: q, error: query.error };

  const subjects = query.type === 'name' ? store.findByName(query.value) : store.findByIdentifier(query.type, query.value);
  store.audit('SEARCH', actor, `${query.label} ${query.display}: ${subjects.length} match${subjects.length === 1 ? '' : 'es'}`);
  if (!subjects.length) return { status: 'not_found', query: q };
  if (subjects.length === 1) {
    store.audit('READ', actor, `profile ${subjects[0].subject_ref} opened from a search by ${query.label}`);
    return { status: 'found', query: q, profile: await profileOf(subjects[0]) };
  }
  return { status: 'multiple', query: q, candidates: subjects.map(candidate) };
}

async function profile(ref, actor) {
  const s = store.subjectByRef(ref);
  if (!s) return null;
  store.audit('READ', actor, `profile ${s.subject_ref} opened`);
  return profileOf(s);
}

/** The demonstration identities, for the "try one" list. Synthetic test numbers only. */
function samples() {
  if (process.env.LOOKUP_DEMO_SAMPLES === 'off') return [];
  const SCENARIO = {
    convict: 'Convicted, in custody', undertrial: 'Undertrial, in custody', acquitted: 'Acquitted and released',
    bail: 'On bail, trial pending', served: 'Released after sentence', appeal: 'Convicted, appeal pending',
    complainant: 'Complainant or victim', visitor: 'Prison visitor', civil: 'Civil litigant',
    verification: 'Police verification', clean: 'Aadhaar only',
  };
  const local = store.mode() === 'local';
  return dataset().subjects.map((s) => {
    const first = (t) => (s.identifiers.find((i) => i.type === t) || {}).value || null;
    // with the departments filling the ERP, the person's ERP reference is whatever the ERP gave them
    let ref = s.ref;
    if (!local) {
      const hit = (s.demo.aadhaar && store.findByIdentifier('aadhaar', s.demo.aadhaar)[0])
        || store.findByIdentifier('mobile', s.demo.mobile).find((x) => x.name_key === ids.nameKey(s.name));
      ref = hit ? hit.subject_ref : null;
    }
    return {
      ref, name: s.name, district: s.district, scenario: SCENARIO[s.scenario] || s.scenario,
      aadhaar: s.demo.aadhaar, mobile: s.demo.mobile,
      cnr: first('cnr'), fir: first('fir'), prisoner: first('prisoner'), fsl: first('fsl'),
    };
  });
}

function sources() {
  const st = store.stats();
  const count = (code) => (st.records.find((r) => r.system === code) || {}).n || 0;
  const people = (code) => (st.records.find((r) => r.system === code) || {}).people || 0;
  const delivered = require('./ingest').deliveries();
  return {
    dataset: st.dataset,
    mode: store.mode(),
    sources: CONNECTORS.map((c) => ({
      code: c.code, name: c.name, department: c.department, hostname: c.hostname, holds: c.holds, records: count(c.code), people: people(c.code),
      mode: store.mode() === 'local' ? 'mirror' : 'bus',
      lastReceivedAt: (delivered[c.code] || {}).lastReceivedAt || null,
      events: (delivered[c.code] || {}).events || 0,
    })),
  };
}

/**
 * An admin asked to see a person's full Aadhaar number. The ERP does not hold it (only a keyed hash and a mask),
 * so it records the request in the append-only audit log and names the UIDAI person references the caller may
 * ask UIDAI about. The number itself never passes through the ERP.
 */
function aadhaarReveal(ref, actor) {
  const s = store.subjectByRef(ref);
  if (!s) return null;
  const masked = store.maskedAadhaar(s.id);
  const uidaiRefs = masked ? store.linksOf(s.id, 'uidai') : [];
  store.audit('REVEAL', actor, `full Aadhaar of ${s.subject_ref} (${s.full_name}) shown${masked ? `, ${masked}` : ''}`);
  return { ref: s.subject_ref, name: s.full_name, masked, uidaiRefs };
}

/** The people held in the ERP, a page at a time; `total` is the true count. */
function people(opts) { return store.people(opts); }

/** All the changes sent about one person's records (not a lookup, so not audited). */
function changes(ref) { return { changes: store.changesOf(ref) }; }

module.exports = { search, profile, samples, people, changes, sources, aadhaarReveal };
