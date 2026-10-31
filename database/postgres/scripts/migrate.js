#!/usr/bin/env node
'use strict';

/**
 * Copies the SQLite data of the five websites into the five PostgreSQL tables.
 *
 *   node database/postgres/scripts/migrate.js dry-run   count rows, write nothing
 *   node database/postgres/scripts/migrate.js schema    create the five tables
 *   node database/postgres/scripts/migrate.js load      load every site (one transaction each)
 *
 * The SQLite files are opened read-only. `load` refuses to run if any row could
 * not be routed to a website, or if a target table already holds rows.
 */

const fs = require('fs');
const path = require('path');
const { psql, target } = require('./pg');
const { SITE_TABLE, extractAll, countsOf } = require('./mapping');

const DIR = path.resolve(__dirname, '..');
const SCHEMA = path.join(DIR, 'migrations', '001_create_five_tables.sql');
const LOGS = path.join(DIR, 'logs');

const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r');

function copyFile(table, rows) {
  const lines = rows.map((r) => [
    esc(r.record_type),
    r.source_id === null ? '\\N' : String(r.source_id),
    r.source_key === null ? '\\N' : esc(r.source_key),
    esc(JSON.stringify(r.data)),
  ].join('\t'));
  return `COPY ${table} (record_type, source_id, source_key, data) FROM STDIN;\n${lines.join('\n')}\n\\.\n`;
}

function show(sink) {
  const counts = countsOf(sink.rows);
  for (const [site, table] of Object.entries(SITE_TABLE)) {
    const total = sink.rows[site].length;
    process.stdout.write(`\n${table}  (${site})  ${total} rows\n`);
    for (const [rt, n] of Object.entries(counts[site]).sort()) process.stdout.write(`   ${rt.padEnd(34)} ${n}\n`);
  }
  for (const [k, v] of Object.entries(sink.skipped)) process.stdout.write(`\nskipped ${k}: ${v.rows} rows (${v.reason})\n`);
  if (sink.unrouted.length) {
    process.stdout.write(`\nUNROUTED ${sink.unrouted.length} row(s):\n`);
    for (const u of sink.unrouted.slice(0, 10)) process.stdout.write(`   ${u.recordType} ${u.row}\n`);
  }
  return counts;
}

function main() {
  const mode = process.argv[2];
  if (!['dry-run', 'schema', 'load'].includes(mode)) {
    process.stderr.write('usage: migrate.js dry-run | schema | load\n'); process.exit(2);
  }
  process.stdout.write(`target: ${target()}\n`);

  if (mode === 'schema') {
    psql(['--single-transaction', '-f', SCHEMA]);
    process.stdout.write('created the five tables\n');
    return;
  }

  const sink = extractAll();
  const counts = show(sink);
  if (mode === 'dry-run') return;

  if (sink.unrouted.length) { process.stderr.write('\nrefusing to load: unrouted rows above\n'); process.exit(1); }

  for (const table of Object.values(SITE_TABLE)) {
    const n = Number(psql(['-At', '-c', `SELECT count(*) FROM ${table}`]).trim());
    if (n !== 0) { process.stderr.write(`\nrefusing to load: ${table} already holds ${n} rows\n`); process.exit(1); }
  }

  fs.mkdirSync(LOGS, { recursive: true });
  const loaded = {};
  for (const [site, table] of Object.entries(SITE_TABLE)) {
    const file = path.join(LOGS, `.load-${site}.sql`);
    fs.writeFileSync(file, copyFile(table, sink.rows[site]));
    try {
      psql(['--single-transaction', '-f', file]);
      loaded[table] = sink.rows[site].length;
      process.stdout.write(`loaded ${table}: ${loaded[table]} rows\n`);
    } finally {
      fs.unlinkSync(file);
    }
  }
  fs.writeFileSync(path.join(LOGS, 'load-report.json'), JSON.stringify({
    loadedAt: new Date().toISOString(), target: target(), loaded, counts,
    skipped: sink.skipped,
  }, null, 2) + '\n');
  process.stdout.write('wrote logs/load-report.json\n');
}

try { main(); } catch (err) { process.stderr.write(`${err.message}\n`); process.exit(1); }
