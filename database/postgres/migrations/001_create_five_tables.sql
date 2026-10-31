-- demo_replica: exactly one table per replicated website.
--
-- Every row of every SQLite source table that belongs to a site is stored as
-- one JSONB record in that site's table. record_type names where the row came
-- from, so no information is lost and no extra tables are needed:
--
--   <table>            row of the site's own replica database  (e.g. jail)
--   platform_<table>   row of platform.sqlite for this site     (e.g. platform_submission)
--   erp_<table>        row of erp.sqlite for this site          (e.g. erp_intake)
--
-- source_id  is the original integer primary key.
-- source_key is the original text primary key (form.id, site.code, ...).
-- Unofficial local demonstration data. All rows are synthetic.

CREATE TABLE aadhaar_data (
  id          BIGSERIAL PRIMARY KEY,
  record_type TEXT  NOT NULL,
  source_id   BIGINT,
  source_key  TEXT,
  data        JSONB NOT NULL,
  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (record_type, source_id, source_key)
);

CREATE TABLE cctns_data (
  id          BIGSERIAL PRIMARY KEY,
  record_type TEXT  NOT NULL,
  source_id   BIGINT,
  source_key  TEXT,
  data        JSONB NOT NULL,
  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (record_type, source_id, source_key)
);

CREATE TABLE ecourts_data (
  id          BIGSERIAL PRIMARY KEY,
  record_type TEXT  NOT NULL,
  source_id   BIGINT,
  source_key  TEXT,
  data        JSONB NOT NULL,
  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (record_type, source_id, source_key)
);

CREATE TABLE eforensics_data (
  id          BIGSERIAL PRIMARY KEY,
  record_type TEXT  NOT NULL,
  source_id   BIGINT,
  source_key  TEXT,
  data        JSONB NOT NULL,
  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (record_type, source_id, source_key)
);

CREATE TABLE eprisons_data (
  id          BIGSERIAL PRIMARY KEY,
  record_type TEXT  NOT NULL,
  source_id   BIGINT,
  source_key  TEXT,
  data        JSONB NOT NULL,
  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (record_type, source_id, source_key)
);

CREATE INDEX idx_aadhaar_record_type    ON aadhaar_data    (record_type);
CREATE INDEX idx_cctns_record_type      ON cctns_data      (record_type);
CREATE INDEX idx_ecourts_record_type    ON ecourts_data    (record_type);
CREATE INDEX idx_eforensics_record_type ON eforensics_data (record_type);
CREATE INDEX idx_eprisons_record_type   ON eprisons_data   (record_type);
