'use strict';

/**
 * Identifiers the person lookup accepts, and how each one is recognised,
 * validated, masked and hashed.
 *
 * Rules come from the research reports in info/docs/research_reports:
 *   Aadhaar   12 digits, Verhoeff check digit, never starts with 0 or 1 (UIDAI)
 *   VID       16 digits; no entity may store it, so it cannot be matched here (UIDAI)
 *   EID       14-digit enrolment number, optionally followed by a 14-digit timestamp (UIDAI)
 *   CNR       16 characters, entered without hyphen or space (eCourts)
 *   FIR       FIR number and year, the pair the eCourts FIR search asks for (eCourts, e-Forensics)
 *   Mobile    ten digits beginning 6, 7, 8 or 9 (ePrisons report, section 11.2)
 *
 * Identity numbers are never kept in the clear. Each one is stored as a keyed
 * hash for matching plus a masked display form (Aadhaar report, sections 11 and 12).
 */

const crypto = require('crypto');

// The key for the identifier hashes: set LOOKUP_PEPPER (or LOOKUP_PEPPER_FILE). There is no built-in value.
// Changing it later makes every stored hash unmatchable, so keep it with the database it belongs to.
const sec = require('../../../shared/security');
const PEPPER = sec.requireOrExit(() => sec.secret('LOOKUP_PEPPER'));

// --- Verhoeff, the check-digit scheme of the Aadhaar number ----------------
const { verhoeffValid, verhoeffDigit } = require('../../../shared/records/verhoeff');

// --- normalising -----------------------------------------------------------
const squash = (s) => String(s == null ? '' : s).normalize('NFC').trim().replace(/\s+/g, ' ');
const compact = (s) => squash(s).replace(/[\s-]/g, '').toUpperCase();
/** A name as it is compared: upper case, letters and single spaces only. */
const nameKey = (s) => squash(s).toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim();

// --- masking and hashing ---------------------------------------------------
function mask(type, value) {
  const v = String(value);
  switch (type) {
    case 'aadhaar': return `XXXX XXXX ${v.slice(-4)}`;
    case 'eid': return `${v.slice(0, 4)} XXXX XXXX ${v.slice(-2)}`;
    case 'mobile': return `XXXXXX${v.slice(-4)}`;
    default: return v;
  }
}

function hash(type, value) {
  return crypto.createHmac('sha256', PEPPER).update(`${type}:${value}`).digest('hex');
}

const LABEL = {
  aadhaar: 'Aadhaar number',
  eid: 'Aadhaar enrolment ID (EID)',
  mobile: 'Mobile number',
  cnr: 'eCourts CNR number',
  fir: 'FIR number',
  prisoner: 'Prisoner number',
  fsl: 'Forensic laboratory case number',
  visit: 'e-Mulakat registration number',
  pcc: 'Police verification certificate number',
  name: 'Name',
  vid: 'Aadhaar Virtual ID (VID)',
};

const HINT = 'Enter a 12-digit Aadhaar number, an enrolment ID, a mobile number, a CNR, '
  + 'an FIR number (for example 0123/2025), a prisoner number, a forensic case number '
  + 'or at least three letters of a name.';

/**
 * Work out what was typed.
 *
 * Returns { ok:true, type, label, value, display } for a usable identifier, or
 * { ok:false, type, label, error } with a message a user can act on.
 */
function detect(raw) {
  const text = squash(raw);
  if (!text) return { ok: false, type: null, label: null, error: 'Enter an identifier to search.' };
  if (text.length > 80) return { ok: false, type: null, label: null, error: 'That is too long to be an identifier. ' + HINT };

  const c = compact(text);

  if (/^\+91[6-9]\d{9}$/.test(c)) {
    const v = c.slice(3);
    return { ok: true, type: 'mobile', label: LABEL.mobile, value: v, display: mask('mobile', v) };
  }
  // a mobile number written with its trunk prefix: 0 98765 43210
  if (/^0[6-9]\d{9}$/.test(c)) {
    const v = c.slice(1);
    return { ok: true, type: 'mobile', label: LABEL.mobile, value: v, display: mask('mobile', v) };
  }
  if (/^\d+$/.test(c)) {
    if (c.length === 12) {
      if (/^[01]/.test(c)) {
        return { ok: false, type: 'aadhaar', label: LABEL.aadhaar, error: 'An Aadhaar number never begins with 0 or 1. Check the number and try again.' };
      }
      if (!verhoeffValid(c)) {
        // 91 followed by a mobile number is far likelier than a mistyped Aadhaar number
        if (/^91[6-9]\d{9}$/.test(c)) {
          const v = c.slice(2);
          return { ok: true, type: 'mobile', label: LABEL.mobile, value: v, display: mask('mobile', v) };
        }
        return { ok: false, type: 'aadhaar', label: LABEL.aadhaar, error: 'This is not a valid Aadhaar number: its check digit does not match. Check for a mistyped digit.' };
      }
      return { ok: true, type: 'aadhaar', label: LABEL.aadhaar, value: c, display: mask('aadhaar', c) };
    }
    if (c.length === 16) {
      return { ok: false, type: 'vid', label: LABEL.vid, error: 'A Virtual ID can only be resolved by UIDAI during authentication, and no entity may store it, so the ERP cannot match it. Search with the Aadhaar number or another identifier.' };
    }
    if (c.length === 14 || c.length === 28) {
      const v = c.slice(0, 14);
      return { ok: true, type: 'eid', label: LABEL.eid, value: v, display: mask('eid', v) };
    }
    if (c.length === 10) {
      if (!/^[6-9]/.test(c)) {
        return { ok: false, type: 'mobile', label: LABEL.mobile, error: 'An Indian mobile number has ten digits and begins with 6, 7, 8 or 9.' };
      }
      return { ok: true, type: 'mobile', label: LABEL.mobile, value: c, display: mask('mobile', c) };
    }
    return { ok: false, type: null, label: null, error: `A ${c.length}-digit number does not match any identifier the ERP holds. ${HINT}` };
  }

  if (/^[A-Z]{4}\d{12}$/.test(c)) return { ok: true, type: 'cnr', label: LABEL.cnr, value: c, display: c };
  if (/^(RFSL|DFSL)[A-Z]{3}\/[A-Z]{2,4}\/\d{4}\/\d{4}$/.test(c)) {
    const v = c.replace(/^(RFSL|DFSL)([A-Z]{3})/, '$1-$2');
    return { ok: true, type: 'fsl', label: LABEL.fsl, value: v, display: v };
  }
  if (/^[A-Z]{3}\/(UT|CT)\/\d{4}\/\d{5}$/.test(c)) return { ok: true, type: 'prisoner', label: LABEL.prisoner, value: c, display: c };
  if (/^MUL\d{4}MH\d{7}$/.test(c)) return { ok: true, type: 'visit', label: LABEL.visit, value: c, display: c };
  if (/^PCC\/MH\/\d{4}\/\d{6}$/.test(c)) return { ok: true, type: 'pcc', label: LABEL.pcc, value: c, display: c };

  const fir = c.replace(/^FIR(NO\.?)?:?/, '').match(/^0*(\d{1,5})\/(\d{4})$/);
  if (fir) {
    const year = Number(fir[2]);
    if (year < 1950 || year > 2100) return { ok: false, type: 'fir', label: LABEL.fir, error: 'The FIR year looks wrong. Use the form number/year, for example 0123/2025.' };
    const v = `${fir[1].padStart(4, '0')}/${fir[2]}`;
    return { ok: true, type: 'fir', label: LABEL.fir, value: v, display: `FIR ${v}` };
  }

  const name = nameKey(text);
  if (/^[A-Za-z][A-Za-z .'-]*$/.test(text)) {
    if (name.replace(/ /g, '').length < 3) return { ok: false, type: 'name', label: LABEL.name, error: 'Type at least three letters of the name.' };
    return { ok: true, type: 'name', label: LABEL.name, value: name, display: squash(text) };
  }
  return { ok: false, type: null, label: null, error: `That does not look like an identifier the ERP holds. ${HINT}` };
}

module.exports = {
  detect, mask, hash, nameKey, verhoeffValid, verhoeffDigit, LABEL, HINT,
};
