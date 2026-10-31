'use strict';

/**
 * Locations common to every backend, computed once from this file's own
 * position so nothing else counts "..". A service's own database, schema and
 * views live in that service's config/paths.js, so neither service can name the
 * other's database.
 */

const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
  ROOT,
  GOV_REPLICA: path.join(ROOT, 'backend', 'gov_replica'),
};
