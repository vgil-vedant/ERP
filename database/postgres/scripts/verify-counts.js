#!/usr/bin/env node
'use strict';

/**
 * Checks PostgreSQL against SQLite.
 *
 *   1. every (table, record_type) count in PostgreSQL equals what was loaded
 *      (logs/load-report.json);
 *   2. only the five tables exist in demo_replica;
 *   3. a fresh read of the SQLite files is compared too, and any difference is
 *      reported as the source having changed since the load (the platform and
 *      ERP servers keep writing), not as a failed copy.
 */

const fs = require('fs');
const path = require('path');
const { psql, target } = require('./pg');
const { SITE_TABLE, extractAll, countsOf } = require('./mapping');

const REPORT = path.resolve(__dirname, '..', 'logs', 'load-report.json');

function pgCounts(table) {
  const out = psql(['-At', '-F', '|', '-c', `SELECT record_type, count(*) FROM ${table} GROUP BY 1 ORDER BY 1`]);
  const counts = {};
  for (const line of out.trim().split('\n').filter(Boolean)) {
    const [rt, n] = line.split('|');
    counts[rt] = Number(n);
  }
  return counts;
}

function compare(label, expected, actual, problems) {
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const k of [...keys].sort()) {
    if ((expected[k] || 0) !== (actual[k] || 0)) {
      problems.push(`${label} ${k}: expected ${expected[k] || 0}, found ${actual[k] || 0}`);
    }
  }
}

function main() {
  process.stdout.write(`target: ${target()}\n\n`);
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));

  const tables = psql(['-At', '-c',
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1"])
    .trim().split('\n').filter(Boolean);
  const want = Object.values(SITE_TABLE).sort();
  const tablesOk = JSON.stringify(tables) === JSON.stringify(want);
  process.stdout.write(`${tablesOk ? 'ok  ' : 'FAIL'} only the five tables exist: ${tables.join(', ')}\n`);

  const problems = [];
  const drift = [];
  const fresh = countsOf(extractAll().rows);
  let total = 0;

  for (const [site, table] of Object.entries(SITE_TABLE)) {
    const actual = pgCounts(table);
    const sum = Object.values(actual).reduce((a, b) => a + b, 0);
    total += sum;
    compare(`${table}`, report.counts[site], actual, problems);
    compare(`${table} (source now)`, fresh[site], actual, drift);
    process.stdout.write(`${problems.some((p) => p.startsWith(`${table} `)) ? 'FAIL' : 'ok  '} ${table.padEnd(16)} ${String(sum).padStart(5)} rows, ${Object.keys(actual).length} record types\n`);
  }

  process.stdout.write(`\ntotal rows in PostgreSQL: ${total}\n`);
  if (drift.length) {
    process.stdout.write(`\nthe SQLite sources changed since the load (${drift.length} record type(s)):\n`);
    for (const d of drift) process.stdout.write(`   ${d}\n`);
  }
  if (!tablesOk || problems.length) {
    process.stdout.write(`\nMISMATCH:\n${problems.map((p) => `   ${p}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write('\nall counts match what was loaded\n');
}

try { main(); } catch (err) { process.stderr.write(`${err.message}\n`); process.exit(1); }
