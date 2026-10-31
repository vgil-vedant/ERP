'use strict';

/**
 * Where the platform keeps its database, schema and shared views.
 * PLATFORM_DB lets a test point a second instance at a copy.
 */

const path = require('path');
const { ROOT } = require('../../../shared/paths');

module.exports = {
  PLATFORM_DB: process.env.PLATFORM_DB
    || path.join(ROOT, 'database', 'sqlite', 'platform', 'data', 'platform.sqlite'),
  PLATFORM_SCHEMA: path.join(ROOT, 'database', 'sqlite', 'platform', 'schema.sql'),
  PLATFORM_VIEWS: path.join(ROOT, 'frontend', 'platform-hub', 'views'),
};
