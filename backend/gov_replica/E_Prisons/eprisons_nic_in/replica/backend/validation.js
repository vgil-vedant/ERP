'use strict';

/**
 * Local validation rules.
 *
 * Where the original form states a rule in its markup (a `maxlength`, a
 * required marker, an option list), the rule here mirrors it and says so.
 * Where the original enforces something on the server that is not publicly
 * visible, this file makes its own reasonable choice and marks it `[REC]` --
 * a recommendation of this replica, not a rule of eprisons.nic.in.
 *
 * The labelling convention follows the research reports in docs/research_reports/:
 *   [OBS] observed in the live form's markup
 *   [REC] this replica's own design decision
 */

const RULES = {
  visitorName: { maxLength: 30, required: true, source: '[OBS] maxlength=30 on txtVisitorName',
                 pattern: /^[A-Za-z][A-Za-z .'-]*$/,
                 patternSource: '[REC] letters, spaces and . \' - only' },
  visitorFatherName: { maxLength: 30, required: true, source: '[OBS] maxlength=30 on txtVisitorFatherName',
                 pattern: /^[A-Za-z][A-Za-z .'-]*$/, patternSource: '[REC]' },
  visitorAddress: { maxLength: 150, required: true, source: '[OBS] maxlength=150 on txtVisitorAddress' },
  visitorAge: { required: true, min: 1, max: 120,
                source: '[OBS] required marker on Age *',
                rangeSource: '[REC] the live field carries maxlength=14, which is a text-length ' +
                             'limit, not an age range; no age range is published' },
  idNumber: { maxLength: 20, required: false, source: '[OBS] maxlength=20 on txtIdentityProof',
              conditional: '[OBS] the ID Proof list includes "NOT AVAILABLE", so an ID number ' +
                           'cannot be required for every choice' },
  email: { maxLength: 50, required: false, source: '[OBS] maxlength=50 on txteMail',
           pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternSource: '[REC]' },
  mobileNo: { required: true, source: '[OBS] required marker on Mobile No *',
              pattern: /^[6-9][0-9]{9}$/,
              patternSource: '[REC] 10-digit Indian mobile. The live field carries maxlength=24, ' +
                             'which does not express the real rule' },
  additionalVisitors: { min: 0, max: 9, source: '[OBS] maxlength=1 on txtAdditionalVisitors ' +
                        'implies a single digit' },
  additionalVisitorNames: { maxLength: 150, source: '[OBS] maxlength=150 on txtAddnlVisName' },
  prisonerName: { maxLength: 30, required: true, source: '[OBS] maxlength=30 on txtPrisonerName',
                  pattern: /^[A-Za-z][A-Za-z .'-]*$/, patternSource: '[REC]' },
  prisonerFatherName: { maxLength: 100, required: true,
                        source: '[OBS] maxlength=100 on txtPrisonerFatherName' },
  prisonerAge: { required: true, min: 1, max: 120, source: '[OBS] required marker on Prisoner Age *' },
  captcha: { maxLength: 6, required: true, source: '[OBS] maxlength=6 on txtCaptchaEntered' },
  grievanceSubject: { maxLength: 150, required: true, source: '[REC]' },
  grievanceDescription: { maxLength: 2000, required: true, source: '[REC]' },
  registrationNo: { maxLength: 30, required: true, source: '[OBS] maxlength=30 on txtregno' },
};

function fail(errors, field, message) {
  errors[field] = message;
}

function checkText(errors, field, value, rule, label) {
  const v = (value == null ? '' : String(value)).trim();
  if (rule.required && !v) { fail(errors, field, `${label} is required.`); return null; }
  if (!v) return null;
  if (rule.maxLength && v.length > rule.maxLength) {
    fail(errors, field, `${label} must be ${rule.maxLength} characters or fewer.`);
    return v;
  }
  if (rule.pattern && !rule.pattern.test(v)) {
    fail(errors, field, `${label} is not in the expected format.`);
  }
  return v;
}

function checkInt(errors, field, value, rule, label) {
  const raw = (value == null ? '' : String(value)).trim();
  if (rule.required && !raw) { fail(errors, field, `${label} is required.`); return null; }
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) { fail(errors, field, `${label} must be a whole number.`); return null; }
  const n = Number(raw);
  if (rule.min != null && n < rule.min) { fail(errors, field, `${label} must be at least ${rule.min}.`); return n; }
  if (rule.max != null && n > rule.max) { fail(errors, field, `${label} must be at most ${rule.max}.`); return n; }
  return n;
}

/** Validate an e-Mulakat visit request. Returns { value, errors }. */
function validateVisitRequest(body, ref, jailsForState) {
  const errors = {};
  const v = {};

  v.visitor_name = checkText(errors, 'visitor_name', body.visitor_name, RULES.visitorName, 'Visitor Name');
  v.visitor_father_name = checkText(errors, 'visitor_father_name', body.visitor_father_name,
    RULES.visitorFatherName, 'Father / Husband Name');
  v.visitor_address = checkText(errors, 'visitor_address', body.visitor_address,
    RULES.visitorAddress, 'Address');
  v.visitor_age = checkInt(errors, 'visitor_age', body.visitor_age, RULES.visitorAge, 'Age');
  v.mobile_no = checkText(errors, 'mobile_no', body.mobile_no, RULES.mobileNo, 'Mobile No');
  v.email = checkText(errors, 'email', body.email, RULES.email, 'Email ID');

  const inSet = (id, set) => set.some((x) => String(x.id) === String(id));

  v.visitor_gender_id = body.visitor_gender_id || null;
  if (!v.visitor_gender_id) fail(errors, 'visitor_gender_id', 'Gender is required.');
  else if (!inSet(v.visitor_gender_id, ref.genders)) fail(errors, 'visitor_gender_id', 'Unknown gender.');

  v.relationship_id = body.relationship_id || null;
  if (v.relationship_id && !inSet(v.relationship_id, ref.relationships)) {
    fail(errors, 'relationship_id', 'Unknown relationship.');
  }

  v.id_proof_type_id = body.id_proof_type_id || null;
  if (!v.id_proof_type_id) fail(errors, 'id_proof_type_id', 'Identity Proof is required.');
  else if (!inSet(v.id_proof_type_id, ref.idProofs)) fail(errors, 'id_proof_type_id', 'Unknown identity proof.');

  v.id_number = checkText(errors, 'id_number', body.id_number, RULES.idNumber, 'ID Number');
  // Conditional rule: an ID number is required unless the chosen proof is the
  // one that explicitly says none is available.
  const proof = ref.idProofs.find((p) => String(p.id) === String(v.id_proof_type_id));
  if (proof && proof.requires_number && !v.id_number) {
    fail(errors, 'id_number', `ID Number is required when Identity Proof is "${proof.name}".`);
  }

  v.is_international = body.is_international ? 1 : 0;

  v.state_id = body.state_id || null;
  if (!v.state_id) fail(errors, 'state_id', 'State is required.');
  else if (!inSet(v.state_id, ref.states)) fail(errors, 'state_id', 'Unknown state.');

  v.jail_id = body.jail_id || null;
  if (!v.jail_id) {
    fail(errors, 'jail_id', 'Jail is required.');
  } else if (v.state_id && !jailsForState.some((j) => String(j.id) === String(v.jail_id))) {
    // The cascade is enforced on the server too, not only in the browser.
    fail(errors, 'jail_id', 'The chosen jail does not belong to the chosen state.');
  }

  const dateRaw = (body.visit_date || '').trim();
  if (!dateRaw) {
    fail(errors, 'visit_date', 'Visit Date is required.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    fail(errors, 'visit_date', 'Visit Date must be a valid date.');
  } else {
    const d = new Date(`${dateRaw}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      fail(errors, 'visit_date', 'Visit Date must be a valid date.');
    } else {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (d < today) fail(errors, 'visit_date', 'Visit Date cannot be in the past.'); // [REC]
      v.visit_date = dateRaw;
    }
  }

  v.additional_visitor_count = checkInt(errors, 'additional_visitor_count',
    body.additional_visitor_count || '0', RULES.additionalVisitors, 'Additional Visitors') || 0;
  const names = (body.additional_visitor_names || '').trim();
  if (names.length > RULES.additionalVisitorNames.maxLength) {
    fail(errors, 'additional_visitor_names',
      `Additional Visitors Name must be ${RULES.additionalVisitorNames.maxLength} characters or fewer.`);
  }
  v.additional_visitor_names = names
    ? names.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  if (v.additional_visitor_count > 0 && v.additional_visitor_names.length !== v.additional_visitor_count) {
    fail(errors, 'additional_visitor_names',
      `Give ${v.additional_visitor_count} name(s), separated by commas.`); // [REC]
  }

  v.prisoner_name = checkText(errors, 'prisoner_name', body.prisoner_name, RULES.prisonerName, 'Prisoner Name');
  v.prisoner_father_name = checkText(errors, 'prisoner_father_name', body.prisoner_father_name,
    RULES.prisonerFatherName, 'Father Name');
  v.prisoner_age = checkInt(errors, 'prisoner_age', body.prisoner_age, RULES.prisonerAge, 'Prisoner Age');

  v.prisoner_gender_id = body.prisoner_gender_id || null;
  if (!v.prisoner_gender_id) fail(errors, 'prisoner_gender_id', 'Prisoner Gender is required.');
  else if (!inSet(v.prisoner_gender_id, ref.genders)) fail(errors, 'prisoner_gender_id', 'Unknown gender.');

  // The original's last field is a "Physical" checkbox under "Visit Mode" (its id is chkPH). There is no
  // handicap field on that form, so this column stays 0. The page posts a hidden VIDEO first and the box's
  // PHYSICAL after it, so a ticked box sends both and an unticked one sends VIDEO; a post with no
  // visit_mode at all still means PHYSICAL, as before.
  const modes = [].concat(body.visit_mode || []);
  v.physically_handicapped = 0;
  v.visit_mode = modes.includes('PHYSICAL') ? 'PHYSICAL' : (modes.includes('VIDEO') ? 'VIDEO' : 'PHYSICAL');

  // The original protects this form with a CAPTCHA. The replica asks for a
  // simple local challenge instead: it demonstrates the step without
  // reproducing, solving or bypassing anyone's CAPTCHA.
  const challenge = (body.challenge_answer || '').trim();
  if (!challenge) {
    fail(errors, 'challenge_answer', 'Please answer the verification question.');
  } else if (String(challenge) !== String(body.challenge_expected)) {
    fail(errors, 'challenge_answer', 'The verification answer is not correct.');
  }

  return { value: v, errors, ok: Object.keys(errors).length === 0 };
}

function validateGrievance(body, ref, jailsForState) {
  const errors = {};
  const v = {};
  v.complainant_name = checkText(errors, 'complainant_name', body.complainant_name,
    RULES.visitorName, 'Complainant Name');
  v.complainant_mobile = checkText(errors, 'complainant_mobile', body.complainant_mobile,
    RULES.mobileNo, 'Mobile No');
  v.complainant_email = checkText(errors, 'complainant_email', body.complainant_email,
    RULES.email, 'Email ID');
  v.complainant_address = checkText(errors, 'complainant_address', body.complainant_address,
    RULES.visitorAddress, 'Address');

  const inSet = (id, set) => set.some((x) => String(x.id) === String(id));
  v.relationship_id = body.relationship_id || null;
  if (v.relationship_id && !inSet(v.relationship_id, ref.relationships)) {
    fail(errors, 'relationship_id', 'Unknown relationship.');
  }
  v.inmate_name = checkText(errors, 'inmate_name', body.inmate_name, RULES.prisonerName, 'Inmate Name');
  v.inmate_father_name = checkText(errors, 'inmate_father_name', body.inmate_father_name,
    RULES.prisonerFatherName, 'Inmate Father Name');

  v.state_id = body.state_id || null;
  if (!v.state_id) fail(errors, 'state_id', 'State is required.');
  v.jail_id = body.jail_id || null;
  if (!v.jail_id) fail(errors, 'jail_id', 'Jail is required.');
  else if (v.state_id && !jailsForState.some((j) => String(j.id) === String(v.jail_id))) {
    fail(errors, 'jail_id', 'The chosen jail does not belong to the chosen state.');
  }

  v.category = (body.category || '').trim() || null;
  v.subject = checkText(errors, 'subject', body.subject, RULES.grievanceSubject, 'Subject');
  v.description = checkText(errors, 'description', body.description,
    RULES.grievanceDescription, 'Grievance Details');

  const challenge = (body.challenge_answer || '').trim();
  if (!challenge) fail(errors, 'challenge_answer', 'Please answer the verification question.');
  else if (String(challenge) !== String(body.challenge_expected)) {
    fail(errors, 'challenge_answer', 'The verification answer is not correct.');
  }

  return { value: v, errors, ok: Object.keys(errors).length === 0 };
}

module.exports = { RULES, validateVisitRequest, validateGrievance, checkText, checkInt };
