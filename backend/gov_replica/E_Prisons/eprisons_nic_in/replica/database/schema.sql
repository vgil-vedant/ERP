-- ---------------------------------------------------------------------------
-- Local demonstration database for the eprisons.nic.in replica.
--
-- THIS IS NOT THE ORIGINAL SCHEMA. The original database of eprisons.nic.in is
-- not publicly observable and was never accessed. This schema is the replica's
-- own design, derived from the public field inventory captured in
-- analysis/forms_and_interactions.json. See analysis/database_findings.json,
-- which separates what is verified from what is inferred.
--
-- All data loaded into this database is synthetic. No record from the original
-- system is copied here, and this database never connects to a government
-- system.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- --- reference data --------------------------------------------------------
-- Option lists below are transcribed from the public <select> elements of the
-- live forms, so the replica validates against the same value domain.

CREATE TABLE IF NOT EXISTS state (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jail (
  id          INTEGER PRIMARY KEY,
  state_id    INTEGER NOT NULL REFERENCES state(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  jail_type   TEXT,
  UNIQUE (state_id, name)
);
CREATE INDEX IF NOT EXISTS idx_jail_state ON jail(state_id);

-- The two public portals publish DIFFERENT relationship vocabularies: the NPIP
-- visit form offers 33 values, the Citizen Services registration form 20, and
-- only 18 are shared. `source_portal` keeps them apart so the replica can show
-- each form its own list, and so the ERP can see the mapping problem it will
-- have to solve.
CREATE TABLE IF NOT EXISTS relationship (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  source_portal TEXT NOT NULL CHECK (source_portal IN ('NPIP', 'CITIZEN_SERVICE')),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (name, source_portal)
);
CREATE INDEX IF NOT EXISTS idx_rel_portal ON relationship(source_portal);

CREATE TABLE IF NOT EXISTS id_proof_type (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  -- The live form offers 'NOT AVAILABLE', so an ID number cannot be mandatory
  -- for every choice. This column records which values require a number.
  requires_number INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gender (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- --- e-Mulakat: visit requests --------------------------------------------

CREATE TABLE IF NOT EXISTS visit_request (
  id                      INTEGER PRIMARY KEY,
  registration_no         TEXT NOT NULL UNIQUE,

  -- visitor
  visitor_name            TEXT NOT NULL,
  visitor_father_name     TEXT NOT NULL,
  visitor_address         TEXT NOT NULL,
  visitor_gender_id       INTEGER REFERENCES gender(id),
  visitor_age             INTEGER NOT NULL CHECK (visitor_age BETWEEN 1 AND 120),
  relationship_id         INTEGER REFERENCES relationship(id),
  id_proof_type_id        INTEGER REFERENCES id_proof_type(id),
  id_number               TEXT,
  is_international        INTEGER NOT NULL DEFAULT 0,
  email                   TEXT,
  mobile_no               TEXT NOT NULL,

  -- where
  state_id                INTEGER NOT NULL REFERENCES state(id),
  jail_id                 INTEGER NOT NULL REFERENCES jail(id),
  visit_date              TEXT NOT NULL,

  -- additional visitors
  additional_visitor_count INTEGER NOT NULL DEFAULT 0
                           CHECK (additional_visitor_count BETWEEN 0 AND 9),

  -- prisoner
  prisoner_name           TEXT NOT NULL,
  prisoner_father_name    TEXT NOT NULL,
  prisoner_age            INTEGER NOT NULL CHECK (prisoner_age BETWEEN 1 AND 120),
  prisoner_gender_id      INTEGER REFERENCES gender(id),
  physically_handicapped  INTEGER NOT NULL DEFAULT 0,

  -- lifecycle
  status                  TEXT NOT NULL DEFAULT 'SUBMITTED'
                          CHECK (status IN ('SUBMITTED','UNDER_VERIFICATION','APPROVED','REJECTED','COMPLETED','CANCELLED')),
  status_remark           TEXT,
  visit_mode              TEXT NOT NULL DEFAULT 'PHYSICAL'
                          CHECK (visit_mode IN ('PHYSICAL','VIDEO')),
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visit_regno  ON visit_request(registration_no);
CREATE INDEX IF NOT EXISTS idx_visit_jail   ON visit_request(jail_id);
CREATE INDEX IF NOT EXISTS idx_visit_status ON visit_request(status);

CREATE TABLE IF NOT EXISTS additional_visitor (
  id                INTEGER PRIMARY KEY,
  visit_request_id  INTEGER NOT NULL REFERENCES visit_request(id) ON DELETE CASCADE,
  name              TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_addvis_req ON additional_visitor(visit_request_id);

-- --- grievances ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grievance (
  id                  INTEGER PRIMARY KEY,
  reference_no        TEXT NOT NULL UNIQUE,
  complainant_name    TEXT NOT NULL,
  complainant_mobile  TEXT NOT NULL,
  complainant_email   TEXT,
  complainant_address TEXT,
  relationship_id     INTEGER REFERENCES relationship(id),
  inmate_name         TEXT NOT NULL,
  inmate_father_name  TEXT,
  state_id            INTEGER NOT NULL REFERENCES state(id),
  jail_id             INTEGER NOT NULL REFERENCES jail(id),
  category            TEXT,
  subject             TEXT NOT NULL,
  description         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'RECEIVED'
                      CHECK (status IN ('RECEIVED','UNDER_EXAMINATION','ESCALATED','DISPOSED','CLOSED')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  due_at              TEXT,
  disposed_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_griev_ref ON grievance(reference_no);

-- Pendency and timeliness are reportable, as the ERP scope requires.
CREATE TABLE IF NOT EXISTS grievance_action (
  id            INTEGER PRIMARY KEY,
  grievance_id  INTEGER NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  remark        TEXT,
  actor_role    TEXT NOT NULL,
  acted_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_grievact_g ON grievance_action(grievance_id);

-- --- citizen accounts (Citizen Services portal) ---------------------------

CREATE TABLE IF NOT EXISTS citizen_account (
  id            INTEGER PRIMARY KEY,
  mobile_no     TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  father_name   TEXT,
  gender_id     INTEGER REFERENCES gender(id),
  age           INTEGER CHECK (age IS NULL OR age BETWEEN 1 AND 120),
  relationship_id INTEGER REFERENCES relationship(id),
  email         TEXT,
  address       TEXT,
  state_id      INTEGER REFERENCES state(id),
  -- Demonstration only. No password hash is stored because the replica never
  -- authenticates anyone: see the README security notes.
  verified      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- public listings -------------------------------------------------------

CREATE TABLE IF NOT EXISTS absconder (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  father_name   TEXT,
  state_id      INTEGER NOT NULL REFERENCES state(id),
  jail_id       INTEGER REFERENCES jail(id),
  absconded_on  TEXT NOT NULL,
  remarks       TEXT
);

CREATE TABLE IF NOT EXISTS parole_jumper (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  father_name     TEXT,
  state_id        INTEGER NOT NULL REFERENCES state(id),
  jail_id         INTEGER REFERENCES jail(id),
  parole_from     TEXT NOT NULL,
  due_back_on     TEXT NOT NULL,
  remarks         TEXT
);

CREATE TABLE IF NOT EXISTS lockup_report (
  id            INTEGER PRIMARY KEY,
  state_id      INTEGER NOT NULL REFERENCES state(id),
  jail_id       INTEGER NOT NULL REFERENCES jail(id),
  report_date   TEXT NOT NULL,
  male_count    INTEGER NOT NULL DEFAULT 0,
  female_count  INTEGER NOT NULL DEFAULT 0,
  trans_count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (jail_id, report_date)
);

-- --- dashboard figures -----------------------------------------------------

CREATE TABLE IF NOT EXISTS statistic_snapshot (
  id            INTEGER PRIMARY KEY,
  snapshot_date TEXT NOT NULL,
  state_id      INTEGER REFERENCES state(id),
  jail_id       INTEGER REFERENCES jail(id),
  metric        TEXT NOT NULL,
  value         INTEGER NOT NULL,
  UNIQUE (snapshot_date, state_id, jail_id, metric)
);
CREATE INDEX IF NOT EXISTS idx_stat_metric ON statistic_snapshot(metric, snapshot_date);

-- --- accountability --------------------------------------------------------
-- The ERP scope (documents/erp-scope.pdf, section 4) requires a maker, an
-- approver where required, a timestamp on every entry, and an audit trail that
-- no role can alter. The replica models that here so the ERP can be developed
-- against the same shape.

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY,
  entity       TEXT NOT NULL,
  entity_id    INTEGER NOT NULL,
  action       TEXT NOT NULL,
  maker        TEXT NOT NULL,
  approver     TEXT,
  details      TEXT,
  occurred_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

-- Make the audit trail append-only at the database level: no role can rewrite
-- or remove history.
CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;
