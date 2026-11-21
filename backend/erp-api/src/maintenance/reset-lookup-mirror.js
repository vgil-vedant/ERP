#!/usr/bin/env node
'use strict';

/**
 * Empties the ERP's person-lookup MIRROR so the departments can send it again.
 *
 * Why: every identifier in the mirror is stored as a keyed hash (LOOKUP_PEPPER). A new key cannot find hashes
 * made with the old one, and a hash cannot be converted. The mirror is only a copy: the records themselves live
 * in the five department databases, whose integration bus resends them (platform-api/src/maintenance/requeue-outbox.js).
 *
 * Emptied:     lookup_subject, lookup_identifier, lookup_record, lookup_link, lookup_link_basis, lookup_merge, ingest_event
 * Never touched: the audit log (it gets one new line), citizens, intake records, the department databases.
 * A copy of the database is made first (<db>.before-pepper-<time>.bak). Nothing happens without --yes.
 *
 *   node backend/erp-api/src/maintenance/reset-lookup-mirror.js --yes
 *
 * Stop the platform first (docker compose stop platform_api) so nothing arrives half-way.
 */

const fs = require('fs');
const { db, DB_PATH } = require('../db');

const TABLES = ['lookup_record', 'lookup_identifier', 'lookup_link', 'lookup_link_basis', 'lookup_merge', 'ingest_event', 'lookup_subject'];
const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

const before = Object.fromEntries(TABLES.map((t) => [t, count(t)]));
process.stdout.write(`ERP database: ${DB_PATH}\n${TABLES.map((t) => `  ${t.padEnd(20)} ${before[t]}`).join('\n')}\n`);
if (!process.argv.includes('--yes')) {
  process.stdout.write('\nNothing was changed. Run again with --yes to back up the database and empty the mirror.\n');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backup = `${DB_PATH}.before-pepper-${stamp}.bak`;
db.exec(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
fs.chmodSync(backup, 0o600);
process.stdout.write(`\nbacked up to ${backup}\n`);

db.transaction(() => {
  for (const t of TABLES) db.prepare(`DELETE FROM ${t}`).run();
  db.prepare('INSERT INTO audit_log (entity, entity_id, action, maker, approver, details) VALUES (?,?,?,?,?,?)')
    .run('lookup_mirror', '0', 'RESET', 'maintenance', null,
      `the lookup mirror was emptied to be rebuilt under a new LOOKUP_PEPPER (${before.lookup_subject} people, ${before.lookup_record} records)`);
})();
process.stdout.write(`mirror emptied (${before.lookup_subject} people, ${before.lookup_record} records). Now run requeue-outbox.js on the platform.\n`);
