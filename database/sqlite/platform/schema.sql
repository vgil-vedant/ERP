-- ---------------------------------------------------------------------------
-- The single shared database behind every replicated portal.
--
-- One database serves all five demonstration portals. A citizen registers ONCE
-- (person) and that one registration is accepted by every portal, because they
-- are the same server reading the same table.
--
-- THESE ARE NOT THE ORIGINALS' SCHEMAS. No government database was accessed.
-- Every row here is synthetic, and the field sets are derived only from the
-- public form markup captured in each project's analysis/ directory.
--
-- Rows that belong to one portal carry site_code. Rows that are deliberately
-- shared (person, session) do not, and that is the whole point of them.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- === the portals ==========================================================
CREATE TABLE IF NOT EXISTS site (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  hostname    TEXT NOT NULL,
  category    TEXT NOT NULL,
  port        INTEGER NOT NULL
);

-- === the one registration =================================================
-- Registered once, on any portal, and usable on all of them. person_ref is the
-- key the ERP mirrors, so the same human is one row on both sides.
CREATE TABLE IF NOT EXISTS person (
  id              INTEGER PRIMARY KEY,
  person_ref      TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  mobile          TEXT,
  password_hash   TEXT NOT NULL,
  password_salt   TEXT NOT NULL,
  registered_on   TEXT NOT NULL,
  registered_via  TEXT NOT NULL REFERENCES site(code),
  erp_citizen_ref TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_person_email ON person(email);

CREATE TABLE IF NOT EXISTS session (
  token       TEXT PRIMARY KEY,
  person_id   INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  issued_by   TEXT NOT NULL REFERENCES site(code),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_person ON session(person_id);

-- === forms, namespaced per portal =========================================
-- eCourts alone publishes 55 forms and reuses the id "index_form0" across
-- pages, so a form key must carry its portal and its route or the rows collide.
CREATE TABLE IF NOT EXISTS form (
  id               TEXT PRIMARY KEY,
  site_code        TEXT NOT NULL REFERENCES site(code),
  route            TEXT NOT NULL,
  local_id         TEXT NOT NULL,
  heading          TEXT,
  reference_prefix TEXT NOT NULL DEFAULT 'DEMO',
  field_count      INTEGER NOT NULL DEFAULT 0,
  is_login         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_form_site ON form(site_code);

-- === what the portals collect =============================================
CREATE TABLE IF NOT EXISTS submission (
  id             INTEGER PRIMARY KEY,
  site_code      TEXT NOT NULL REFERENCES site(code),
  form_id        TEXT NOT NULL REFERENCES form(id),
  reference_no   TEXT NOT NULL UNIQUE,
  person_id      INTEGER REFERENCES person(id),
  payload        TEXT NOT NULL,
  erp_intake_ref TEXT,
  erp_synced_at  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sub_site   ON submission(site_code);
CREATE INDEX IF NOT EXISTS idx_sub_form   ON submission(form_id);
CREATE INDEX IF NOT EXISTS idx_sub_person ON submission(person_id);

-- Flattened field values alongside the JSON payload, so the ERP and any report
-- can read a field without parsing every blob.
CREATE TABLE IF NOT EXISTS submission_field (
  id            INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  label         TEXT,
  value         TEXT
);
CREATE INDEX IF NOT EXISTS idx_subfield ON submission_field(submission_id);

-- === the write-through ledger =============================================
-- Every attempt to mirror a row into the ERP is recorded, successful or not,
-- so "it is in both databases" is a claim with evidence behind it.
CREATE TABLE IF NOT EXISTS erp_sync (
  id            INTEGER PRIMARY KEY,
  entity        TEXT NOT NULL,
  local_ref     TEXT NOT NULL,
  status        TEXT NOT NULL,
  http_status   INTEGER,
  erp_ref       TEXT,
  message       TEXT,
  attempted_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sync_entity ON erp_sync(entity, local_ref);

-- === per-portal reference data ============================================
CREATE TABLE IF NOT EXISTS reference_option (
  id          INTEGER PRIMARY KEY,
  site_code   TEXT NOT NULL REFERENCES site(code),
  list        TEXT NOT NULL,
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (site_code, list, value)
);
CREATE INDEX IF NOT EXISTS idx_refopt ON reference_option(site_code, list);

CREATE TABLE IF NOT EXISTS cascade_option (
  id            INTEGER PRIMARY KEY,
  site_code     TEXT NOT NULL REFERENCES site(code),
  list          TEXT NOT NULL,
  parent_value  TEXT NOT NULL,
  value         TEXT NOT NULL,
  label         TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (site_code, list, parent_value, value)
);
CREATE INDEX IF NOT EXISTS idx_cascade ON cascade_option(site_code, list, parent_value);

CREATE TABLE IF NOT EXISTS demo_table_row (
  id          INTEGER PRIMARY KEY,
  site_code   TEXT NOT NULL REFERENCES site(code),
  table_id    TEXT NOT NULL,
  cells       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tablerow ON demo_table_row(site_code, table_id);

-- === ePrisons domain tables ===============================================
-- Carried over unchanged from the hand-built ePrisons replica. These are the
-- real integration facts the ERP depends on: the State -> Jail cascade, the two
-- incompatible relationship vocabularies, and conditional ID-proof numbering.

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

-- === the audit trail ======================================================
-- erp-scope.pdf section 4 requires a maker, an approver where one is required,
-- a timestamp on every entry, and a trail no role can alter. The triggers are
-- what make the last part true rather than aspirational.
CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY,
  site_code    TEXT,
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
