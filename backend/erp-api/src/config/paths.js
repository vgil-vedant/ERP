'use strict';

/**
 * Where the ERP keeps its database, schema and console views.
 * ERP_DB lets a test point a second instance at a copy.
 */

const path = require('path');
const { ROOT } = require('../../../shared/paths');

module.exports = {
  ERP_DB: process.env.ERP_DB
    || path.join(ROOT, 'database', 'sqlite', 'erp', 'data', 'erp.sqlite'),
  ERP_SCHEMA: path.join(ROOT, 'database', 'sqlite', 'erp', 'schema.sql'),
  ERP_VIEWS: path.join(ROOT, 'frontend', 'erp-console', 'views'),
};
