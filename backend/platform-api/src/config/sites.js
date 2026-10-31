'use strict';

/**
 * The one registry of replicated portals.
 *
 * Every portal below is served by the SAME process, from the SAME database.
 * A portal contributes three things and nothing else:
 *
 *   code      a short stable key, used to scope its rows in the shared tables
 *   frontend  the views and static assets captured for it (left where they are)
 *   driver    how its routes are built - "generic" is driven by the generated
 *             site.json, "eprisons" is the hand-built route set
 *
 * Ports are kept exactly as they were so every URL that worked before still
 * works. They are five listeners on one server, not five servers.
 */

const fs = require('fs');
const path = require('path');

const { ROOT, GOV_REPLICA: GOV } = require('../../../shared/paths');
const PORTALS = path.join(ROOT, 'frontend', 'portals');

const SITES = [
  {
    code: 'eprisons',
    portal: 'eprisons',
    name: 'ePrisons',
    hostname: 'eprisons.nic.in',
    category: 'E_Prisons',
    port: 4173,
    driver: 'eprisons',
    project: path.join(GOV, 'E_Prisons', 'eprisons_nic_in'),
  },
  {
    code: 'cctns',
    portal: 'cctns',
    name: 'CCTNS Citizen Services',
    hostname: 'www.digitalpolicecitizenservices.gov.in',
    category: 'CCTNS',
    port: 4175,
    driver: 'generic',
    project: path.join(GOV, 'CCTNS', 'www_digitalpolicecitizenservices_gov_in'),
  },
  {
    code: 'eforensics',
    portal: 'eforensics',
    name: 'e-Forensics',
    hostname: 'eforensics.gov.in',
    category: 'E_Forensics',
    port: 4176,
    driver: 'generic',
    project: path.join(GOV, 'E_Forensics', 'eforensics_gov_in'),
  },
  {
    code: 'uidai',
    portal: 'aadhaar',
    name: 'UIDAI / Aadhaar',
    hostname: 'uidai.gov.in',
    category: 'Aadhaar',
    port: 4177,
    driver: 'generic',
    project: path.join(GOV, 'Aadhaar', 'uidai_gov_in'),
  },
  {
    code: 'ecourts',
    portal: 'ecourts',
    name: 'eCourts',
    hostname: 'ecourts.gov.in',
    category: 'E_Courts',
    port: 4178,
    driver: 'generic',
    project: path.join(GOV, 'E_Courts', 'ecourts_gov_in'),
  },
];

// A second instance (tests, staging) can run beside the real one by shifting
// every portal port by a fixed amount. 0 keeps the ports every URL already uses.
const PORT_OFFSET = Number(process.env.PORT_OFFSET) || 0;

for (const s of SITES) {
  s.port += PORT_OFFSET;
  // frontend/portals/<portal> is the home of a portal's views and static files;
  // the copy inside the replica project is only used if that does not exist.
  const home = path.join(PORTALS, s.portal);
  s.frontend = fs.existsSync(home) ? home : path.join(s.project, 'replica', 'frontend');
  s.views = path.join(s.frontend, 'views');
  s.publicDir = path.join(s.frontend, 'public');
  s.assets = path.join(s.project, 'original_assets');
  s.analysis = path.join(s.project, 'analysis');
  s.siteJson = path.join(s.project, 'replica', 'backend', 'site.json');
}

const byCode = new Map(SITES.map((s) => [s.code, s]));

module.exports = { SITES, byCode, get: (code) => byCode.get(code) || null };
