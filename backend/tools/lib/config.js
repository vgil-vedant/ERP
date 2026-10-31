'use strict';

const path = require('path');

const TOOL_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(TOOL_ROOT, '..');

/**
 * Conservative crawl limits. These live here, in project configuration, so the
 * user never has to supply them (spec section 6, stage B).
 */
const num = (envKey, fallback) => {
  const v = Number(process.env[envKey]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const limits = {
  // Overridable per run, e.g. GOVREPLICA_MAX_PAGES=250, without editing this file.
  maxPages: num('GOVREPLICA_MAX_PAGES', 60),
  maxDepth: num('GOVREPLICA_MAX_DEPTH', 4),
  navTimeoutMs: 45000,
  settleTimeoutMs: 3500,
  perRequestDelayMs: num('GOVREPLICA_DELAY_MS', 1500),  // politeness delay between navigations
  concurrency: 1,              // single-threaded: a government portal behind a
                               // WAF should not see parallel load from us
  maxAssetBytes: 12 * 1024 * 1024,
  maxTotalRuntimeMs: num('GOVREPLICA_MAX_RUNTIME_MS', 25 * 60 * 1000),
  assetTimeoutMs: 30000,
  retriesPerUrl: 2,
  // First pause when a host answers with a throttling status; doubles per
  // attempt up to 30s. Crawling slower is always better than recording a
  // throttled response as if it were the page.
  throttleBackoffMs: 4000,
};

const viewports = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

/** Visual tolerance for stage I, as a fraction of differing pixels. */
const visualTolerance = 0.12;

const caBundle = path.join(TOOL_ROOT, 'certs', 'ca-bundle.pem');

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36 GovReplicaPipeline/1.0 (authorized local replica research)';

/**
 * Category definitions (spec section 3). Matching is done on observed page
 * content, title, metadata, navigation and documentation -- never on the domain
 * name alone. `hostHints` only ever adds to a score that content already
 * drives, and is recorded separately in the evidence so the two can be told
 * apart.
 */
const categories = [
  {
    dir: 'Aadhaar',
    label: 'Aadhaar/UIDAI identity services, enrolment, updates and related official services',
    strong: ['uidai', 'unique identification authority', 'aadhaar', 'myaadhaar',
             'central identities data repository', 'cidr', 'enrolment id', 'e-kyc'],
    weak: ['identity', 'enrolment', 'demographic', 'biometric', 'resident'],
    hostHints: ['uidai', 'aadhaar'],
  },
  {
    dir: 'CCTNS',
    label: 'Crime and Criminal Tracking Network & Systems, police crime-record workflows and related portals',
    strong: ['cctns', 'crime and criminal tracking', 'national crime records bureau', 'ncrb',
             'digital police', 'proclaimed offender', 'citizen services portal of the national crime'],
    weak: ['police station', 'missing person', 'crime', 'first information report', 'fir'],
    hostHints: ['cctns', 'digitalpolice', 'ncrb'],
  },
  {
    dir: 'E_Courts',
    label: 'eCourts, case status, court listings, cause lists, orders, judgments and court services',
    strong: ['ecourts', 'e-courts', 'cause list', 'case status', 'cnr number',
             'e-committee', 'district and taluka court', 'judgment', 'caveat'],
    weak: ['court', 'judiciary', 'litigant', 'advocate', 'hearing'],
    hostHints: ['ecourts', 'districts.ecourts', 'judgments'],
  },
  {
    dir: 'E_Forensics',
    label: 'Government forensic services, forensic laboratories, forensic case management and evidence workflows',
    strong: ['eforensic', 'e-forensic', 'forensic science laboratory', 'fsl',
             'directorate of forensic science', 'exhibit', 'forensic case'],
    weak: ['forensic', 'laboratory', 'evidence', 'sample', 'viscera'],
    hostHints: ['eforensic', 'forensic', 'fsl'],
  },
  {
    dir: 'E_Prisons',
    label: 'ePrisons, prison/jail administration, inmate management, visitor services and related portals',
    strong: ['eprisons', 'e-prisons', 'national prison', 'npip', 'e-mulakat', 'emulakat',
             'prison information', 'inmate', 'jail', 'prisoner'],
    weak: ['prison', 'custody', 'convict', 'undertrial', 'visitor', 'correctional'],
    hostHints: ['eprisons', 'prison', 'jail'],
  },
];

/** A government-ness signal, recorded in the overview but never used to block. */
const govHostSuffixes = ['.gov.in', '.nic.in', '.gov', '.gob', '.gouv.fr'];

module.exports = {
  TOOL_ROOT,
  WORKSPACE_ROOT,
  limits,
  viewports,
  visualTolerance,
  caBundle,
  userAgent,
  categories,
  govHostSuffixes,
  replicaRoot: path.join(WORKSPACE_ROOT, 'gov_replica'),
};
