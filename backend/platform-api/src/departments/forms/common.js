'use strict';

/**
 * The form engine shared by every department.
 *
 * A form is data: sections of fields, each with a type, a label, whether it is
 * required, its limits and when it applies. The same definition draws the form
 * in the browser and validates what comes back, so the two can never disagree.
 * This is the "field dictionary" the research reports recommend (section 11 of
 * each), rather than a hand-written form per page.
 *
 * Field types: text, textarea, number, date, datetime, select, multiselect,
 * checkbox, checkboxes, aadhaar, mobile, email, pin, group (repeatable).
 * `when: { field, is | in | truthy }` makes a field apply only in some cases.
 */

const { DISTRICTS, CRIMES, RANK_NAME, PRESERVATIVE, DOCUMENTS } = require('../../../../shared/records/catalogue');
const { isAadhaar, verhoeffDigit } = require('../../../../shared/records/verhoeff');

// --- reference lists ---------------------------------------------------------
const uniq = (a) => Array.from(new Set(a));
const DISTRICT_LIST = Object.values(DISTRICTS);
const opt = (value, label) => ({ value, label: label || value });

const LISTS = {
  gender: [opt('M', 'Male'), opt('F', 'Female'), opt('T', 'Third gender / Transgender')],
  districts: DISTRICT_LIST.map((d) => opt(d.name)),
  policeStations: uniq(DISTRICT_LIST.flatMap((d) => d.localities.map((l) => `${l.ps} Police Station, ${d.name}`))).map((v) => opt(v)),
  courts: DISTRICT_LIST.map((d) => opt(d.court)),
  prisons: uniq(DISTRICT_LIST.flatMap((d) => [d.prison.name, d.womenPrison.name])).map((v) => opt(v)),
  labs: uniq(DISTRICT_LIST.map((d) => d.lab.name)).map((v) => opt(v)),
  divisions: [
    ['DNA', 'Biology and DNA'], ['BIO', 'Biology and Serology'], ['TOX', 'Toxicology'], ['BAL', 'Ballistics'],
    ['NAR', 'Narcotics (Chemistry)'], ['CYB', 'Computer Forensics'], ['QDE', 'Questioned Documents'], ['PHY', 'Physics'],
  ].map(([v, l]) => opt(v, l)),
  offences: Object.entries(CRIMES).map(([k, c]) => opt(k, c.title)).concat([opt('other', 'Other offence')]),
  ioRanks: ['PSI', 'API', 'PI'].map((r) => opt(r, `${RANK_NAME[r]} (${r})`)),
  authorityRanks: ['ACP', 'DCP'].map((r) => opt(r, `${RANK_NAME[r]} (${r})`)),
  preservatives: Object.values(PRESERVATIVE).map((v) => opt(v)),
  units: ['items', 'g', 'kg', 'ml', 'sheets'].map((v) => opt(v)),
  poi: [DOCUMENTS.passport, DOCUMENTS.voter, DOCUMENTS.ration, DOCUMENTS.driving, DOCUMENTS.service, DOCUMENTS.marksheet, DOCUMENTS.pid].map((v) => opt(v)),
  poa: [DOCUMENTS.passport, DOCUMENTS.voter, DOCUMENTS.ration, DOCUMENTS.electricity, DOCUMENTS.rent, DOCUMENTS.pid].map((v) => opt(v)),
  pdb: [DOCUMENTS.birth, DOCUMENTS.passport, DOCUMENTS.marksheet].map((v) => opt(v)),
  idProof: ['AADHAAR', 'DRIVING LICENSE', 'NOT AVAILABLE', 'OTHERS', 'PAN', 'PASSPORT', 'VOTER ID'].map((v) => opt(v)),
  // ePrisons e-Mulakat relation list (report section 5.1), the common values
  relations: ['Father', 'Mother', 'Wife', 'Husband', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother',
    'Uncle', 'Aunt', 'Cousin', 'Father-in-law', 'Mother-in-law', 'Brother-in-law', 'Sister-in-law', 'Friend', 'Neighbour',
    'Lawyer', 'Doctor', 'NGO', 'Others'].map((v) => opt(v)),
  grievance: ['Ill treated by the prison authorities', 'Basic facilities not provided inside prison', 'Manhandling by co prisoners', 'Others'].map((v) => opt(v)),
};

/** Sections of law for an offence, as written on an FIR registered on `date`. */
function sectionsFor(offence, date) {
  const c = CRIMES[offence];
  if (!c) return [];
  return (date >= '2024-07-01' ? c.bns : c.ipc).map(([act, section]) => ({ act, section }));
}

// --- validation ----------------------------------------------------------------
const squash = (v) => String(v == null ? '' : v).normalize('NFC').replace(/\s+/g, ' ').trim();
const digits = (v) => String(v == null ? '' : v).replace(/[\s-]/g, '');
const today = () => new Date().toISOString().slice(0, 10);

function applies(field, values) {
  const w = field.when;
  if (!w) return true;
  const v = values[w.field];
  if (w.is !== undefined) return v === w.is;
  if (w.in) return w.in.includes(v);
  if (w.truthy) return !!v && !(Array.isArray(v) && !v.length);
  if (w.includes !== undefined) return Array.isArray(v) && v.includes(w.includes);
  if (w.not !== undefined) return v != null && v !== '' && v !== w.not;
  return true;
}
const allowed = (field) => (field.options || []).map((o) => (typeof o === 'string' ? o : o.value));

/** Check one value. Returns [cleanValue, errorMessage|null]. */
function check(field, raw) {
  const empty = raw == null || raw === '' || (Array.isArray(raw) && !raw.length);
  if (field.type === 'checkbox') return [raw === true || raw === 'true' || raw === 'on', null];
  if (empty) return [null, field.required ? `${field.label} is required.` : null];
  switch (field.type) {
    case 'text': case 'textarea': {
      const v = field.type === 'textarea' ? String(raw).normalize('NFC').trim() : squash(raw);
      const max = field.max || (field.type === 'textarea' ? 2000 : 120);
      if (v.length > max) return [v, `${field.label} can be at most ${max} characters.`];
      if (field.min && v.length < field.min) return [v, `${field.label} needs at least ${field.min} characters.`];
      if (field.pattern && !new RegExp(field.pattern).test(v)) return [v, field.patternMessage || `${field.label} is not in the expected format.`];
      return [v, null];
    }
    case 'number': {
      const n = Number(raw);
      if (!Number.isFinite(n)) return [raw, `${field.label} must be a number.`];
      if (field.integer !== false && !Number.isInteger(n)) return [raw, `${field.label} must be a whole number.`];
      if (field.min != null && n < field.min) return [n, `${field.label} must be at least ${field.min}.`];
      if (field.max != null && n > field.max) return [n, `${field.label} can be at most ${field.max}.`];
      return [n, null];
    }
    case 'date': {
      const v = squash(raw);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) return [v, `${field.label} is not a valid date.`];
      if (field.notFuture && v > today()) return [v, `${field.label} cannot be in the future.`];
      if (field.notPast && v < today()) return [v, `${field.label} cannot be in the past.`];
      if (v < '1900-01-01') return [v, `${field.label} is too far in the past.`];
      return [v, null];
    }
    case 'datetime': {
      const v = squash(raw);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) || Number.isNaN(Date.parse(`${v}:00Z`))) return [v, `${field.label} is not a valid date and time.`];
      if (field.notFuture && v.slice(0, 10) > today()) return [v, `${field.label} cannot be in the future.`];
      return [v, null];
    }
    case 'select': {
      const v = squash(raw);
      return allowed(field).includes(v) ? [v, null] : [v, `Choose a value for ${field.label} from the list.`];
    }
    case 'multiselect': case 'checkboxes': {
      const list = (Array.isArray(raw) ? raw : [raw]).map(squash).filter(Boolean);
      const bad = list.filter((x) => !allowed(field).includes(x));
      if (bad.length) return [list, `${field.label} has a value that is not on the list.`];
      if (field.required && !list.length) return [list, `Choose at least one ${field.label.toLowerCase()}.`];
      return [uniq(list), null];
    }
    case 'aadhaar': {
      const v = digits(raw);
      if (!/^\d{12}$/.test(v)) return [v, `${field.label} must have 12 digits.`];
      if (!isAadhaar(v)) return [v, `${field.label} is not valid: an Aadhaar number never begins with 0 or 1, and its last digit is a check digit.`];
      return [v, null];
    }
    case 'mobile': {
      let v = digits(raw).replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
      if (!/^[6-9]\d{9}$/.test(v)) return [v, `${field.label} must be ten digits beginning with 6, 7, 8 or 9.`];
      return [v, null];
    }
    case 'email': {
      const v = squash(raw).toLowerCase();
      if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return [v, `${field.label} is not a valid e-mail address.`];
      return [v, null];
    }
    case 'pin': {
      const v = digits(raw);
      return /^[1-9]\d{5}$/.test(v) ? [v, null] : [v, `${field.label} must be six digits.`];
    }
    default: return [squash(raw), null];
  }
}

/**
 * Validate a submission against a form. Returns { ok, errors: { path: message }, values }.
 * Fields that do not apply are dropped, so a hidden field can never smuggle a value in.
 */
function validate(form, input) {
  const errors = {};
  const out = {};
  const src = input && typeof input === 'object' ? input : {};
  const fields = form.sections.flatMap((s) => s.fields);
  for (const f of fields) {
    if (!applies(f, src)) continue;
    if (f.type === 'group') {
      const rows = Array.isArray(src[f.name]) ? src[f.name] : [];
      const min = f.min == null ? (f.required ? 1 : 0) : f.min;
      if (rows.length < min) errors[f.name] = `Add at least ${min} ${f.itemLabel || 'entry'}${min === 1 ? '' : 's'}.`;
      if (f.max && rows.length > f.max) errors[f.name] = `At most ${f.max} ${f.itemLabel || 'entries'} can be added.`;
      out[f.name] = rows.slice(0, f.max || 50).map((row, i) => {
        const clean = {};
        for (const sub of f.fields) {
          if (!applies(sub, row || {})) continue;
          const [v, e] = check(sub, (row || {})[sub.name]);
          if (e) errors[`${f.name}.${i}.${sub.name}`] = e;
          clean[sub.name] = v;
        }
        return clean;
      });
      continue;
    }
    const [v, e] = check(f, src[f.name]);
    if (e) errors[f.name] = e;
    out[f.name] = v;
  }
  if (!Object.keys(errors).length && typeof form.rules === 'function') Object.assign(errors, form.rules(out) || {});
  return { ok: !Object.keys(errors).length, errors, values: out };
}

/** The definition sent to the browser: everything but the server-side functions. */
function publicForm(form) {
  return { key: form.key, title: form.title, description: form.description, recordType: form.recordType, submitLabel: form.submitLabel, sections: form.sections };
}

// --- shared building blocks -----------------------------------------------------
const pad = (n, w) => String(n).padStart(w, '0');
const yearOf = (d) => Number(String(d).slice(0, 4));
const stamp = (d) => (d && d.length === 16 ? `${d}:00+05:30` : `${d || today()}T${new Date().toTimeString().slice(0, 5)}:00+05:30`);

/** Person fields used on most forms. `prefix` namespaces them, e.g. "accused_". */
function personFields(prefix, opts = {}) {
  const f = (name, def) => ({ name: `${prefix}${name}`, ...def });
  return [
    f('name', { label: opts.nameLabel || 'Full name', type: 'text', required: true, max: 100, pattern: "^[A-Za-z][A-Za-z .'-]*$", patternMessage: 'Use letters, spaces, dots, hyphens and apostrophes only.', width: 'half' }),
    f('father', { label: opts.fatherLabel || 'Father / husband name', type: 'text', required: !!opts.fatherRequired, max: 100, width: 'half' }),
    f('gender', { label: 'Gender', type: 'select', required: true, options: LISTS.gender, width: 'third' }),
    opts.dob ? f('dob', { label: 'Date of birth', type: 'date', required: !!opts.dobRequired, notFuture: true, width: 'third' })
      : f('age', { label: 'Age in years', type: 'number', min: opts.minAge || 1, max: 120, required: !!opts.ageRequired, width: 'third' }),
    f('mobile', { label: 'Mobile number', type: 'mobile', required: !!opts.mobileRequired, width: 'third' }),
    f('aadhaar', { label: 'Aadhaar number', type: 'aadhaar', required: !!opts.aadhaarRequired, width: 'half', help: opts.aadhaarHelp || 'Optional. Used only to match this person with other departments’ records.' }),
    ...(opts.address === false ? [] : [f('address', { label: 'Address', type: 'textarea', max: 250, required: !!opts.addressRequired, rows: 2, width: 'full' })]),
  ];
}

/** A person as typed on a form, in the shape the store keeps. */
function personInput(values, prefix, district) {
  const g = (k) => values[`${prefix}${k}`];
  const age = g('age');
  return {
    name: g('name'), gender: g('gender') || null,
    dob: g('dob') || null,
    age: age == null ? null : age,
    district: district || null,
    identifiers: { ...(g('aadhaar') ? { aadhaar: g('aadhaar') } : {}), ...(g('mobile') ? { mobile: g('mobile') } : {}) },
    profile: { ...(g('father') ? { father_name: g('father') } : {}), ...(g('address') ? { address: g('address') } : {}), ...(age != null ? { age_declared: age, age_on: today() } : {}) },
  };
}

/** A synthetic Aadhaar number in the 9999 test series with a valid check digit. */
function issueAadhaar(seq) {
  const body = `9999${pad(seq % 10000000, 7)}`;
  return `${body}${verhoeffDigit(body)}`;
}

module.exports = {
  LISTS, CRIMES, DISTRICTS, DISTRICT_LIST, RANK_NAME, DOCUMENTS, PRESERVATIVE,
  sectionsFor, validate, applies, publicForm, personFields, personInput, issueAadhaar,
  pad, yearOf, stamp, today, opt,
};
