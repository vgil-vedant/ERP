-- ---------------------------------------------------------------------------
-- The ERP's own database. The final product.
--
-- This is a SEPARATE database from database/sqlite/platform/data/platform.sqlite, reached
-- only over HTTP through the ERP's own backend. The portals never open this
-- file and this file never opens theirs; that separation is the thing being
-- demonstrated.
--
-- Every row arrives from a portal through POST /api/intake. Nothing is typed
-- in here, and nothing is copied from a government system - the portals that
-- feed it are local demonstration replicas holding synthetic data only.
--
-- erp-scope.pdf section 4: maker, approver where required, timestamp on every
-- entry, audit trail no role can alter.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- The source systems the ERP accepts data from. erp-scope.pdf lists eight
-- external systems; these five are the ones replicated so far.
CREATE TABLE IF NOT EXISTS source_system (
  code      TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  hostname  TEXT NOT NULL,
  category  TEXT NOT NULL
);

-- One human, once. citizen_ref is the portal's person_ref, so the citizen who
-- registered once on one portal is one row here no matter how many portals
-- they then use. This is what removes the re-registration.
CREATE TABLE IF NOT EXISTS citizen (
  id            INTEGER PRIMARY KEY,
  citizen_ref   TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  mobile        TEXT,
  first_seen_in TEXT NOT NULL REFERENCES source_system(code),
  registered_on TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_citizen_email ON citizen(email);

-- A record received from a portal. source_reference is the portal's own
-- reference number, kept so a row here can always be traced back to the exact
-- submission that produced it.
CREATE TABLE IF NOT EXISTS intake (
  id               INTEGER PRIMARY KEY,
  intake_ref       TEXT NOT NULL UNIQUE,
  source_system    TEXT NOT NULL REFERENCES source_system(code),
  source_form      TEXT NOT NULL,
  source_route     TEXT,
  source_reference TEXT NOT NULL,
  citizen_id       INTEGER REFERENCES citizen(id),
  subject          TEXT,
  payload          TEXT NOT NULL,
  received_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source_system, source_reference)
);
CREATE INDEX IF NOT EXISTS idx_intake_system  ON intake(source_system);
CREATE INDEX IF NOT EXISTS idx_intake_citizen ON intake(citizen_id);

CREATE TABLE IF NOT EXISTS intake_field (
  id         INTEGER PRIMARY KEY,
  intake_id  INTEGER NOT NULL REFERENCES intake(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  label      TEXT,
  value      TEXT
);
CREATE INDEX IF NOT EXISTS idx_intakefield ON intake_field(intake_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY,
  entity       TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  action       TEXT NOT NULL,
  maker        TEXT NOT NULL,
  approver     TEXT,
  details      TEXT,
  occurred_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

-- ---------------------------------------------------------------------------
-- Person lookup: the source mirror.
--
-- What the department systems (UIDAI, CCTNS, e-Forensics, eCourts, ePrisons)
-- hold about a person, as the ERP last read it from them. One connector per
-- system reads these rows (backend/erp-api/src/lookup/connectors.js); a
-- connector that calls the department's own API can replace one without
-- changing anything else.
--
-- Unlike the tables above, these rows do not arrive through POST /api/intake.
-- The department offices deliver them through the integration bus
-- (POST /api/ingest/events, see below). Their records start as a synthetic
-- dataset of fifty people (backend/shared/records/dataset.js), built from the
-- field inventories of info/docs/research_reports; with LOOKUP_DATASET=local the
-- ERP loads that dataset itself instead. No row describes a real person.
--
-- Identity numbers are never stored in the clear: lookup_identifier keeps a
-- keyed hash for matching and a masked form for display.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lookup_subject (
  id          INTEGER PRIMARY KEY,
  subject_ref TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  name_key    TEXT NOT NULL,
  gender      TEXT,
  birth_year  INTEGER,
  district    TEXT,
  dataset     TEXT NOT NULL,
  loaded_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lookup_subject_name ON lookup_subject(name_key);

CREATE TABLE IF NOT EXISTS lookup_identifier (
  id            INTEGER PRIMARY KEY,
  subject_id    INTEGER NOT NULL REFERENCES lookup_subject(id) ON DELETE CASCADE,
  id_type       TEXT NOT NULL,
  value_hash    TEXT NOT NULL,
  masked        TEXT NOT NULL,
  source_system TEXT NOT NULL,
  UNIQUE (id_type, value_hash, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_lookup_identifier ON lookup_identifier(id_type, value_hash);

CREATE TABLE IF NOT EXISTS lookup_record (
  id            INTEGER PRIMARY KEY,
  subject_id    INTEGER NOT NULL REFERENCES lookup_subject(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  record_type   TEXT NOT NULL,
  record_ref    TEXT NOT NULL,
  status        TEXT,
  role          TEXT,
  record_date   TEXT,
  payload       TEXT NOT NULL,
  history       TEXT NOT NULL DEFAULT '[]',
  observed_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lookup_record ON lookup_record(subject_id, source_system);

-- ---------------------------------------------------------------------------
-- Integration bus: what the departments deliver.
--
-- Each department portal keeps its own database and an outbox; the platform's
-- integration bus delivers the outbox here (POST /api/ingest/events, signed).
-- lookup_link remembers which ERP person a department's own person reference
-- belongs to; ingest_event makes delivery idempotent (an event id is applied
-- once, however often it is delivered).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lookup_link (
  source_system TEXT NOT NULL,
  source_ref    TEXT NOT NULL,
  subject_id    INTEGER NOT NULL REFERENCES lookup_subject(id) ON DELETE CASCADE,
  linked_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (source_system, source_ref)
);
CREATE INDEX IF NOT EXISTS idx_lookup_link_subject ON lookup_link(subject_id);

CREATE TABLE IF NOT EXISTS ingest_event (
  event_id      TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  record_type   TEXT NOT NULL,
  record_ref    TEXT NOT NULL,
  parties       INTEGER NOT NULL,
  occurred_at   TEXT,
  received_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_ingest_event_source ON ingest_event(source_system, received_at);

-- one row per record per person, so a redelivered or updated record replaces its row
CREATE UNIQUE INDEX IF NOT EXISTS ux_lookup_record
  ON lookup_record(source_system, record_type, record_ref, subject_id);

-- ---------------------------------------------------------------------------
-- Aadhaar-first identity resolution (see backend/erp-api/src/lookup/ingest.js).
--
-- lookup_link_basis: how each department person was matched to its ERP person
--   ('aadhaar', 'eid', 'mobile_name', 'new' or 'repair'), shown on the profile.
-- lookup_merge: an ERP person reference that was merged into another (two
--   department records found to carry the same Aadhaar), so the old reference
--   still opens the person it became. Never deleted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lookup_link_basis (
  source_system TEXT NOT NULL,
  source_ref    TEXT NOT NULL,
  basis         TEXT NOT NULL,
  matched_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (source_system, source_ref)
);

CREATE TABLE IF NOT EXISTS lookup_merge (
  from_ref        TEXT PRIMARY KEY,
  into_subject_id INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  merged_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
