#!/usr/bin/env node
'use strict';

/**
 * Build and populate the local demonstration database for a generated replica.
 *
 * Option lists come from site.json, which the generator transcribed from the
 * original's public <select> markup, so the replica validates against the same
 * value domain. Everything else is synthetic, generated here from a fixed seed.
 * No data from the original system is copied, and nothing here describes a
 * real person.
 */

const fs = require('fs');
const path = require('path');
const Database = require(path.join(__dirname, 'node_modules', 'better-sqlite3'));

const SITE = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
const DB_PATH = path.join(__dirname, '..', 'database', 'replica.sqlite');
const SCHEMA = path.join(__dirname, 'schema.sql');

let seed = 20261027;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Deliberately generic placeholder names: no real person is described.
const FIRST = ['Demo', 'Sample', 'Test', 'Example', 'Placeholder', 'Specimen', 'Trial'];
const LAST = ['Applicant', 'Citizen', 'Person', 'Resident', 'Party', 'Subject', 'Record'];
const nameOf = () => `${pick(FIRST)} ${pick(LAST)} ${int(100, 999)}`;
const dateOf = (off) => {
  const d = new Date(Date.UTC(2026, 9, 27));
  d.setUTCDate(d.getUTCDate() + off);
  return d.toISOString().slice(0, 10);
};

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
const db = new Database(DB_PATH);
db.exec(fs.readFileSync(SCHEMA, 'utf8'));

const insRef = db.prepare(
  'INSERT OR IGNORE INTO reference_option (list, value, label, sort_order) VALUES (?,?,?,?)');
const insCascade = db.prepare(
  'INSERT OR IGNORE INTO cascade_option (list, parent_value, value, label, sort_order) VALUES (?,?,?,?,?)');
const insRow = db.prepare(
  'INSERT INTO demo_table_row (table_id, cells, sort_order) VALUES (?,?,?)');

// --- reference lists, transcribed from the captured form markup ------------
const refCounts = {};
db.transaction(() => {
  for (const [list, options] of Object.entries(SITE.referenceLists || {})) {
    options.forEach((o, i) => insRef.run(list, String(o.value), String(o.label), i));
    refCounts[list] = options.length;
  }
})();

// --- dependent lists -------------------------------------------------------
// The original loads these only after the parent is chosen, so the real lists
// were never exposed. These are invented for the demonstration.
const cascadeCounts = {};
db.transaction(() => {
  for (const [list, cfg] of Object.entries(SITE.cascadeLists || {})) {
    const parents = SITE.referenceLists[cfg.parentList] || [];
    let n = 0;
    for (const p of parents) {
      const count = int(2, 5);
      for (let i = 0; i < count; i++) {
        const label = `${cfg.childLabel} ${['North', 'South', 'East', 'West', 'Central'][i % 5]} (demo)`;
        insCascade.run(list, String(p.value), `${p.value}-${i + 1}`, label, i);
        n++;
      }
    }
    cascadeCounts[list] = n;
  }
})();

// --- synthetic rows for any captured data table ----------------------------
const tableCounts = {};
db.transaction(() => {
  for (const t of SITE.tables || []) {
    const rows = int(8, 18);
    for (let r = 0; r < rows; r++) {
      const cells = t.columns.map((c) => {
        const label = String(c).toLowerCase();
        if (/date|on$|from|to$|dob/.test(label)) return dateOf(-int(1, 700));
        if (/no\.?$|number|count|total|qty|amount|sr|s\.no/.test(label)) return String(int(1, 9999));
        if (/name|party|petitioner|respondent|applicant/.test(label)) return nameOf();
        if (/status|stage/.test(label)) return pick(['Pending', 'Disposed', 'Listed', 'Under process']);
        if (/state|district|court|jail|lab|centre|center/.test(label)) return `Demo ${c} ${int(1, 40)}`;
        return `Demo value ${int(100, 999)}`;
      });
      insRow.run(t.id, JSON.stringify(cells), r);
    }
    tableCounts[t.id] = rows;
  }
})();

const totals = {
  reference_option: db.prepare('SELECT COUNT(*) AS n FROM reference_option').get().n,
  cascade_option: db.prepare('SELECT COUNT(*) AS n FROM cascade_option').get().n,
  demo_table_row: db.prepare('SELECT COUNT(*) AS n FROM demo_table_row').get().n,
};
db.close();

console.log(`Seeded local demonstration database for ${SITE.site.hostname} (all records synthetic).`);
console.log(`  file: ${DB_PATH}`);
if (Object.keys(refCounts).length) {
  console.log('  option lists transcribed from the captured public form markup:');
  for (const [l, n] of Object.entries(refCounts)) console.log(`    ${l.padEnd(34)} ${n}`);
}
if (Object.keys(cascadeCounts).length) {
  console.log('  synthetic dependent lists (the original never exposed the real ones):');
  for (const [l, n] of Object.entries(cascadeCounts)) console.log(`    ${l.padEnd(34)} ${n}`);
}
console.log('  totals:');
for (const [t, n] of Object.entries(totals)) console.log(`    ${t.padEnd(34)} ${n}`);
