'use strict';

/**
 * Talks to PostgreSQL through the psql client, with the connection settings
 * read from the root .env. The password goes to psql through the environment
 * only: it is never put on a command line and never printed.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function loadEnv() {
  const env = { ...process.env };
  const file = path.join(ROOT, '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      // a variable already set in the real environment wins over the file
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  for (const k of ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD']) {
    if (!env[k]) throw new Error(`${k} is missing from .env`);
  }
  return env;
}

/** Run psql; returns stdout. Throws with psql's own message on failure. */
function psql(args, { input } = {}) {
  const r = spawnSync('psql', ['-X', '-q', '-w', '-v', 'ON_ERROR_STOP=1', ...args], {
    env: loadEnv(), input, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'psql failed').trim());
  return r.stdout;
}

function target() {
  const e = loadEnv();
  return `${e.PGUSER}@${e.PGHOST}:${e.PGPORT}/${e.PGDATABASE}`;
}

module.exports = { ROOT, psql, target };
