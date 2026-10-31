#!/usr/bin/env node
'use strict';

/**
 * Create the ERP database and register the source systems.
 *
 * No citizen and no intake row is seeded. The ERP starts empty on purpose: if
 * a row is in here, a portal put it there, and that is what makes the demo
 * worth watching.
 */

const path = require('path');
const { db, DB_PATH } = require('./db');
const { SITES } = require('../../platform-api/src/config/sites');

const upsert = db.prepare(
  `INSERT INTO source_system (code, name, hostname, category) VALUES (?,?,?,?)
   ON CONFLICT(code) DO UPDATE SET name = excluded.name,
     hostname = excluded.hostname, category = excluded.category`);

db.transaction(() => {
  for (const s of SITES) upsert.run(s.code, s.name, s.hostname, s.category);
})();

const n = db.prepare('SELECT COUNT(*) AS n FROM source_system').get().n;
process.stdout.write(
  `ERP database ready at ${path.relative(process.cwd(), DB_PATH)}\n` +
  `  ${n} source systems registered: ${SITES.map((s) => s.code).join(', ')}\n` +
  `  0 citizens, 0 intake records - the portals fill these.\n`);
