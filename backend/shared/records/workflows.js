'use strict';

/**
 * Status models of the records the lookup shows, and the step-by-step progress
 * each status stands for.
 *
 * The statuses are the ones the research reports define for each system:
 *   UIDAI update request     Aadhaar report, table 11.4
 *   CCTNS verification       CCTNS report, table 11.4
 *   eCourts matter           eCourts report, table 11.4
 *   e-Forensics submission   e-Forensics report, table 11.4
 *   e-Mulakat visit          ePrisons report, section 9.1 (steps 8 to 12)
 *   Grievance                ePrisons report, section 9.2 (steps 6 to 8)
 *
 * A status maps to one letter per step:
 *   C completed   A active (in progress)   P pending
 *   B blocked     F failed                 S skipped (not applicable)
 * so the progress a page shows is always read from a record's real status,
 * never drawn by hand.
 */

const STATE = { C: 'completed', A: 'active', P: 'pending', B: 'blocked', F: 'failed', S: 'skipped' };
const DEFAULT_LABEL = {
  completed: 'Completed', active: 'In Progress', pending: 'Pending',
  blocked: 'Blocked', failed: 'Failed', skipped: 'Not applicable',
};

const WORKFLOWS = {
  aadhaar_update: {
    title: 'Aadhaar update request',
    steps: [
      { key: 'submitted', title: 'Request submitted', event: 'Aadhaar update requested', description: 'Update request accepted at an enrolment centre or on myAadhaar.' },
      { key: 'under_review', title: 'Document review', description: 'Documents and cross-field rules checked against Schedule II.' },
      { key: 'verified', title: 'Identity verified', description: 'Identity confirmed through an authorised channel.' },
      { key: 'approved', title: 'Decision', event: 'Aadhaar update approved', description: 'Update accepted and the record changed.' },
      { key: 'closed', title: 'Closed', description: 'No further action; the retention clock starts.' },
    ],
    status: {
      draft: { s: 'APPPP', label: 'Draft' },
      submitted: { s: 'CAPPP', label: 'Queued for review' },
      under_review: { s: 'CAPPP' },
      needs_info: { s: 'CBPPP', label: 'Information requested' },
      verified: { s: 'CCCAP' },
      approved: { s: 'CCCCA', label: 'Awaiting closure' },
      rejected: { s: 'CCSFP', label: 'Rejected' },
      closed: { s: 'CCCCC' },
    },
  },
  verification_request: {
    title: 'Police verification request',
    steps: [
      { key: 'submitted', title: 'Request submitted', event: 'Police verification requested', description: 'Purpose and lawful basis recorded; queued for checking.' },
      { key: 'in_progress', title: 'Official check', description: 'The check is performed on the official channel.' },
      { key: 'completed', title: 'Outcome recorded', event: 'Verification outcome recorded', description: 'The result and its artefact are recorded with attribution.' },
      { key: 'closed', title: 'Closed', description: 'No further action; the retention clock starts.' },
    ],
    status: {
      draft: { s: 'APPP', label: 'Draft' },
      submitted: { s: 'CAPP', label: 'Queued' },
      in_progress: { s: 'CAPP' },
      deferred: { s: 'CBPP', label: 'Deferred: service unavailable' },
      blocked: { s: 'BPPP', label: 'Information or consent missing' },
      completed: { s: 'CCCA', label: 'Awaiting closure' },
      rechecked: { s: 'CCCA', label: 'Rechecked' },
      closed: { s: 'CCCC' },
    },
  },
  court_case: {
    title: 'Court case',
    steps: [
      { key: 'filed', title: 'Filed', event: 'Case filed', description: 'Lodged at the court; filing number recorded.' },
      { key: 'registered', title: 'Registered', event: 'Case registered; CNR assigned', description: 'Case number and CNR assigned.' },
      { key: 'pending', title: 'Hearings', event: 'First hearing', description: 'Live before the court; hearings and orders tracked.' },
      { key: 'disposed', title: 'Disposed', event: 'Case disposed; final order', description: 'Decided; final order recorded.' },
    ],
    status: {
      filed: { s: 'CAPP', label: 'Awaiting registration' },
      objected: { s: 'BPPP', label: 'Objected by the registry' },
      registered: { s: 'CCAP', label: 'Awaiting first hearing' },
      pending: { s: 'CCAP' },
      disposed: { s: 'CCCC' },
      closed: { s: 'CCCC' },
      in_appeal: {
        s: 'CCCCA', label: 'Appeal pending',
        extra: [{ key: 'in_appeal', title: 'Appeal', event: 'Appeal filed', description: 'An appeal or revision has been filed.' }],
      },
    },
  },
  forensic_submission: {
    title: 'Forensic examination',
    steps: [
      { key: 'dispatched', title: 'Dispatched', event: 'Exhibits dispatched to the laboratory', description: 'Sealed parcels handed to the messenger with the forwarding letter.' },
      { key: 'deposited', title: 'Deposited', event: 'Exhibits deposited; receipt issued', description: 'Accepted at the laboratory counter; receipt issued.' },
      { key: 'registered', title: 'Registered', event: 'Laboratory case registered', description: 'Laboratory case number assigned.' },
      { key: 'under_examination', title: 'Examination', event: 'Examination started', description: 'Allocated to a division and in progress.' },
      { key: 'report_ready', title: 'Report ready', description: 'Report produced and awaiting collection or dispatch.' },
      { key: 'closed', title: 'Closed', event: 'Report dispatched to the police', description: 'Report collected or dispatched.' },
    ],
    status: {
      ready: { s: 'APPPPP', label: 'Ready to dispatch' },
      dispatched: { s: 'CAPPPP', label: 'In transit' },
      returned: { s: 'BPPPPP', label: 'Returned by the laboratory' },
      deposited: { s: 'CCAPPP', label: 'Awaiting registration' },
      registered: { s: 'CCCAPP', label: 'Awaiting allocation' },
      under_examination: { s: 'CCCAPP' },
      deficient: { s: 'CCCBPP', label: 'Deficiency raised' },
      reopened: { s: 'CCCAPP', label: 'Re-examination' },
      report_ready: { s: 'CCCCCA', label: 'Awaiting collection' },
      closed: { s: 'CCCCCC' },
    },
  },
  visit_request: {
    title: 'e-Mulakat visit',
    steps: [
      { key: 'registered', title: 'Registration issued', event: 'Visit registered', description: 'OTP confirmed; registration number sent by SMS and e-mail.' },
      { key: 'verification', title: 'Prison verification', event: 'Sent for prison verification', description: 'The officer concerned verifies the request.' },
      { key: 'approved', title: 'Approval and slot', event: 'Visit approved; slot allotted', description: 'Visit date and time window allotted by the prison department.' },
      { key: 'visited', title: 'Visit', event: 'Visit completed', description: 'Physical visit at the reception counter, or video conference with the PIN.' },
    ],
    status: {
      registered: { s: 'CAPP', label: 'Awaiting verification' },
      approved: { s: 'CCCA', label: 'Scheduled' },
      rejected: { s: 'CCFS', label: 'Not approved' },
      visited: { s: 'CCCC' },
    },
  },
  grievance: {
    title: 'Prison grievance',
    steps: [
      { key: 'submitted', title: 'Submitted', event: 'Grievance submitted', description: 'Complaint sent with one of the four fixed categories.' },
      { key: 'acknowledged', title: 'Request number issued', event: 'Grievance acknowledged', description: 'Status communicated by SMS and e-mail.' },
      { key: 'verification', title: 'Officer verification', event: 'Grievance under verification', description: 'The grievance is authenticated and verified by the officer concerned.' },
      { key: 'disposed', title: 'Disposed', event: 'Grievance disposed', description: 'The prison has recorded its action on the grievance.' },
    ],
    status: {
      submitted: { s: 'CAPP' },
      acknowledged: { s: 'CCAP', label: 'Awaiting verification' },
      under_verification: { s: 'CCAP' },
      disposed: { s: 'CCCC' },
    },
  },
  custody: {
    title: 'Custody',
    steps: [
      { key: 'admission', title: 'Admission', event: 'Admitted to prison', from: ['undertrial'], description: 'Admitted on a remand or committal warrant.' },
      { key: 'trial', title: 'Trial', from: ['undertrial'], description: 'Held as an undertrial while the court case is heard.' },
      { key: 'sentence', title: 'Sentence', event: 'Convicted; serving the sentence', from: ['convict'], description: 'Serving the sentence the court imposed.' },
      { key: 'release', title: 'Release', event: 'Released from prison', from: ['released_bail', 'released_acquitted', 'released_sentence'], description: 'Released on bail, on acquittal or on completing the sentence.' },
    ],
    status: {
      undertrial: { s: 'CAPP', label: 'Undertrial' },
      convict: { s: 'CCAP', label: 'Serving sentence' },
      released_bail: { s: 'CAPC', label: 'Released on bail', labelAt: 3, activeLabel: 'Trial continues' },
      released_acquitted: { s: 'CCSC', label: 'Released on acquittal', labelAt: 3 },
      released_sentence: { s: 'CCCC', label: 'Sentence completed', labelAt: 3 },
    },
  },
};

// An enrolment is an application with the same statuses as an update (Aadhaar report, table 11.4).
WORKFLOWS.aadhaar_enrolment = {
  ...WORKFLOWS.aadhaar_update,
  title: 'Aadhaar enrolment',
  steps: WORKFLOWS.aadhaar_update.steps.map((s) => (
    s.key === 'submitted' ? { ...s, description: 'Enrolment accepted at the centre; EID printed on the acknowledgement.', event: 'Aadhaar enrolment submitted' }
      : s.key === 'approved' ? { ...s, description: 'Enrolment accepted and the Aadhaar number generated.', event: 'Aadhaar number generated' } : s)),
};

/** The date each step was reached, read from a record's status history. */
function datesFrom(history) {
  const out = {};
  for (const h of history || []) if (h && h.status && !out[h.status]) out[h.status] = h.at;
  return out;
}

/**
 * Progress of one record: the steps with their state, label and date.
 * Unknown workflows or statuses return null, so nothing is ever guessed.
 */
function progress(workflow, status, history) {
  const wf = WORKFLOWS[workflow];
  const st = wf && wf.status[status];
  if (!st) return null;
  const defs = wf.steps.concat(st.extra || []);
  const dates = datesFrom(history);
  const steps = defs.map((d, i) => {
    const state = STATE[st.s[i]] || 'pending';
    const date = dates[d.key] || (d.from || []).map((k) => dates[k]).find(Boolean) || null;
    return { key: d.key, title: d.title, description: d.description, state, label: DEFAULT_LABEL[state], date };
  });
  // The label of the step the status is about: the first that is not completed,
  // unless the status names its own step.
  let at = st.labelAt != null ? st.labelAt : steps.findIndex((s) => s.state !== 'completed');
  if (at < 0) at = steps.length - 1;
  if (st.label) steps[at].label = st.label;
  if (st.activeLabel) {
    const a = steps.findIndex((s) => s.state === 'active');
    if (a >= 0) steps[a].label = st.activeLabel;
  }
  const current = steps.findIndex((s) => s.state === 'active' || s.state === 'blocked' || s.state === 'failed');
  const done = steps.filter((s) => s.state === 'completed').length;
  const counted = steps.filter((s) => s.state !== 'skipped').length;
  return {
    workflow, title: wf.title, status,
    statusLabel: st.label || (current >= 0 ? steps[current].label : 'Completed'),
    steps, current, completed: done, total: counted,
  };
}

// --- the journey of one FIR across the four systems ------------------------
const COURT_OUTCOME = { convicted: 'Convicted', acquitted: 'Acquitted', discharged: 'Discharged', compounded: 'Compounded' };

/**
 * The journey of one FIR: police, forensics, court and prison, each step read
 * from the linked record's own status.
 */
function journey(fir, linked) {
  const { forensic, court, custody } = linked;
  const steps = [];
  steps.push({
    key: 'fir', system: 'cctns', title: 'FIR registered', state: 'completed', label: 'Completed',
    date: fir.registered_on, description: `${fir.police_station}, FIR ${fir.fir_no}`,
  });

  if (!forensic) {
    steps.push({ key: 'forensic', system: 'eforensics', title: 'Forensic examination', state: 'skipped', label: 'Not referred', date: null, description: 'No exhibits were sent to a laboratory for this FIR.' });
  } else {
    const s = forensic.status;
    const state = ['report_ready', 'closed'].includes(s) ? 'completed'
      : ['deficient', 'returned'].includes(s) ? 'blocked' : 'active';
    const label = { report_ready: 'Report ready', closed: 'Report issued', deficient: 'Deficiency raised', returned: 'Returned' }[s] || 'In Progress';
    steps.push({ key: 'forensic', system: 'eforensics', title: 'Forensic examination', state, label, date: forensic.deposited_on || null, description: `${forensic.laboratory}, ${forensic.division}` });
  }

  if (!court) {
    const accused = fir.role === 'accused';
    steps.push({
      key: 'court', system: 'ecourts', title: 'Court trial', state: accused ? 'pending' : 'skipped',
      label: accused ? 'Charge-sheet awaited' : 'Not applicable', date: null,
      description: accused ? 'No court case is linked to this FIR yet.' : 'No court case is linked to this FIR.',
    });
  } else {
    const s = court.status;
    const state = ['disposed', 'closed'].includes(s) ? 'completed' : s === 'objected' ? 'blocked' : 'active';
    const label = state === 'completed' ? (COURT_OUTCOME[court.outcome] || 'Disposed')
      : s === 'objected' ? 'Objected' : s === 'in_appeal' ? 'Appeal pending' : 'In Progress';
    steps.push({ key: 'court', system: 'ecourts', title: 'Court trial', state, label, date: court.filed_on || null, description: `${court.case_type} ${court.case_no}, ${court.court}` });
  }

  if (!custody) {
    steps.push({
      key: 'custody', system: 'eprisons', title: 'Prison custody', state: 'skipped',
      label: fir.role === 'accused' ? 'Not in custody' : 'Not applicable', date: null,
      description: 'No custody record is linked to this FIR.',
    });
  } else {
    const s = custody.status;
    const state = s.startsWith('released') ? 'completed' : 'active';
    const label = { undertrial: 'Undertrial', convict: 'Serving sentence', released_bail: 'Released on bail', released_acquitted: 'Released', released_sentence: 'Released' }[s] || 'In Progress';
    steps.push({ key: 'custody', system: 'eprisons', title: 'Prison custody', state, label, date: custody.admitted_on || null, description: `${custody.prison}, ${custody.prisoner_no}` });
  }

  const current = steps.findIndex((s) => s.state === 'active' || s.state === 'blocked' || s.state === 'failed');
  return {
    workflow: 'justice_journey', title: `FIR ${fir.fir_no}`, status: current >= 0 ? steps[current].state : 'completed',
    statusLabel: current >= 0 ? `${steps[current].title}: ${steps[current].label}` : 'Every linked stage is complete',
    steps, current,
    completed: steps.filter((s) => s.state === 'completed').length,
    total: steps.filter((s) => s.state !== 'skipped').length,
  };
}

/** The step a history entry belongs to, and how to name the event in a timeline. */
function eventOf(workflow, status) {
  const wf = WORKFLOWS[workflow];
  if (!wf) return null;
  const all = wf.steps.concat(...Object.values(wf.status).map((x) => x.extra || []));
  const step = all.find((s) => s.key === status) || all.find((s) => (s.from || []).includes(status));
  if (step && step.key === status) return step.event || step.title;
  const st = wf.status[status];
  if (step && st && st.label && step.key === 'release') return st.label;
  if (step) return step.event || step.title;
  return st && st.label ? st.label : null;
}

module.exports = { WORKFLOWS, progress, journey, eventOf, DEFAULT_LABEL };
