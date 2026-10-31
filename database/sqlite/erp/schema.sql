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
