-- ---------------------------------------------------------------------------
-- Local demonstration database for a generated replica.
--
-- THIS IS NOT THE ORIGINAL SCHEMA. The original database of the replicated
-- site is not publicly observable and was never accessed. These tables are the
-- replica's own design, derived from the public field inventory captured in
-- analysis/forms_and_interactions.json.
--
-- All data loaded here is synthetic. No record from the original system is
-- copied, and this database never connects to a government system.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- Option lists transcribed from the original's public <select> markup, so the
-- replica validates against the same value domain.
CREATE TABLE IF NOT EXISTS reference_option (
  id          INTEGER PRIMARY KEY,
  list        TEXT NOT NULL,
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (list, value)
);
CREATE INDEX IF NOT EXISTS idx_refopt_list ON reference_option(list);

-- Child options for a dependent dropdown. The original populates these only
-- after the parent is chosen, so the real lists were never exposed; these are
-- synthetic.
CREATE TABLE IF NOT EXISTS cascade_option (
  id            INTEGER PRIMARY KEY,
  list          TEXT NOT NULL,
  parent_value  TEXT NOT NULL,
  value         TEXT NOT NULL,
  label         TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (list, parent_value, value)
);
CREATE INDEX IF NOT EXISTS idx_cascade ON cascade_option(list, parent_value);

-- Whatever the local forms collect. Stored as JSON because each replicated
-- form has its own field set, and inventing a column per field would not make
-- the data any more real than it is.
CREATE TABLE IF NOT EXISTS submission (
  id            INTEGER PRIMARY KEY,
  form_id       TEXT NOT NULL,
  reference_no  TEXT NOT NULL UNIQUE,
  payload       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sub_form ON submission(form_id);

-- Synthetic rows behind any data table the original displayed.
CREATE TABLE IF NOT EXISTS demo_table_row (
  id          INTEGER PRIMARY KEY,
  table_id    TEXT NOT NULL,
  cells       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tablerow ON demo_table_row(table_id);

-- The ERP scope (documents/erp-scope.pdf, section 4) requires a maker, an
-- approver where required, a timestamp on every entry, and an audit trail that
-- no role can alter.
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

CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
