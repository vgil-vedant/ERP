'use strict';

/**
 * First start of a department: its officer account and its share of the
 * demonstration dataset (backend/shared/records/dataset.js).
 *
 * A department is seeded once, and only while it holds no records, so nothing
 * an officer entered is ever replaced. Every seeded record goes through the
 * outbox like any other, which is how the ERP receives the department's data.
 */

const crypto = require('crypto');
const { dataset, VERSION } = require('../../../shared/records/dataset');
const events = require('./events');

const DEFAULT_PASSWORD = 'Office@2026';

function hashPassword(password, salt = crypto.randomBytes(16)) {
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
}

function passwordFor(code) {
  return process.env[`OFFICE_PASSWORD_${code.toUpperCase()}`] || process.env.OFFICE_PASSWORD || DEFAULT_PASSWORD;
}

function seedOfficer(store, dept) {
  if (store.db.prepare('SELECT COUNT(*) AS n FROM officer').get().n) return false;
  const o = dept.officer;
  store.db.prepare('INSERT INTO officer (username, full_name, designation, office, password_hash) VALUES (?,?,?,?,?)')
    .run(o.username, o.name, o.designation, o.office, hashPassword(passwordFor(dept.code)));
  return true;
}

/** Replace the dataset's person references with this department's own. */
function remap(value, map) {
  if (typeof value === 'string') return /^PSN-\d{6}$/.test(value) ? (map.get(value) || null) : value;
  if (Array.isArray(value)) return value.map((v) => remap(v, map));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = remap(v, map);
    return out;
  }
  return value;
}

function seedRecords(store, dept) {
  if (process.env.DEPARTMENT_SEED === 'off') return 0;
  if (store.meta('seed_version')) return 0;
  if (store.db.prepare('SELECT COUNT(*) AS n FROM record').get().n) { store.setMeta('seed_version', 'skipped: records already present'); return 0; }
  const code = dept.code;
  const data = dataset();
  const map = new Map();
  let count = 0;
  store.db.transaction(() => {
    for (const s of data.subjects) {
      const mine = s.records.filter((r) => r.system === code);
      if (!mine.length) continue;
      const ref = `${dept.personPrefix}-${String(store.next('person')).padStart(6, '0')}`;
      map.set(s.ref, ref);
      const id = (t) => (s.identifiers.find((i) => i.type === t) || {}).value;
      const identity = s.records.find((r) => r.type === 'aadhaar_identity');
      const custody = s.records.find((r) => r.type === 'custody');
      store.savePerson({
        ref, name: s.name, gender: s.gender, dob: s.dob, district: s.district,
        identifiers: {
          ...(s.demo.aadhaar ? { aadhaar: s.demo.aadhaar } : {}),
          ...(code === 'uidai' && id('eid') ? { eid: id('eid') } : {}),
          mobile: s.demo.mobile,
        },
        profile: {
          ...(code === 'uidai' && identity ? { address: identity.data.poa } : {}),
          ...(custody ? { father_name: custody.data.inmate.father_name } : {}),
        },
      });
    }
    const groups = new Map();
    for (const s of data.subjects) {
      for (const r of s.records.filter((x) => x.system === code)) {
        const key = `${r.type}|${r.ref}`;
        if (!groups.has(key)) groups.set(key, { record: r, parties: [] });
        // the accused's copy is the canonical one where there are several
        if (r.role === 'accused') groups.get(key).record = r;
        groups.get(key).parties.push({
          personRef: map.get(s.ref), role: r.role || 'subject',
          relation: r.type === 'fir' ? r.data.relation || null : null,
          label: r.data.subject_category || r.data.party_role || null,
        });
      }
    }
    for (const { record: r, parties } of groups.values()) {
      const id = store.saveRecord({
        ref: r.ref, type: r.type, status: r.status, date: r.date,
        data: remap(r.data, map), history: r.history || [],
        parties: parties.map((p) => ({ ...p, personId: store.db.prepare('SELECT id FROM person WHERE person_ref = ?').get(p.personRef).id })),
      }, 'dataset');
      events.publish(store, id);
      count += 1;
    }
    store.setMeta('seed_version', VERSION);
    store.log('system', 'SEED', null, `${count} records from the demonstration dataset ${VERSION}`);
  })();
  return count;
}

module.exports = { seedOfficer, seedRecords, hashPassword, passwordFor, DEFAULT_PASSWORD };
