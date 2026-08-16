CREATE DATABASE airflow;

\connect fitdata

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS serving;
CREATE SCHEMA IF NOT EXISTS quarantine;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  display_name varchar(100) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  age integer NOT NULL CHECK (age BETWEEN 16 AND 100),
  sex varchar(32) NOT NULL,
  height_cm integer NOT NULL CHECK (height_cm BETWEEN 120 AND 230),
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg BETWEEN 30 AND 350),
  experience varchar(32) NOT NULL,
  goal varchar(32) NOT NULL,
  available_days jsonb NOT NULL,
  daily_steps integer NOT NULL DEFAULT 0,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_duration_min integer NOT NULL DEFAULT 50,
  stride_length_cm numeric(4,1) NOT NULL DEFAULT 74,
  health_limitations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.raw_imports (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  object_key varchar(500) NOT NULL UNIQUE,
  filename varchar(255) NOT NULL,
  content_type varchar(100) NOT NULL,
  sha256 char(64) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'uploaded',
  rows_received integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_imports_sha256_idx ON public.raw_imports(sha256);

CREATE TABLE IF NOT EXISTS raw.activity_events (
  ingestion_id uuid NOT NULL,
  source_file text NOT NULL,
  source_row integer NOT NULL,
  payload jsonb NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  payload_sha256 char(64) NOT NULL,
  PRIMARY KEY (ingestion_id, source_row)
);

CREATE INDEX IF NOT EXISTS raw_activity_hash_idx ON raw.activity_events(payload_sha256);

CREATE TABLE IF NOT EXISTS quarantine.invalid_activity_events (
  ingestion_id uuid NOT NULL,
  source_file text NOT NULL,
  source_row integer NOT NULL,
  payload jsonb NOT NULL,
  rejection_reason text NOT NULL,
  quarantined_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.activities (
  activity_id text PRIMARY KEY,
  user_id uuid,
  activity_ts timestamptz NOT NULL,
  activity_type text NOT NULL,
  steps integer NOT NULL DEFAULT 0 CHECK (steps >= 0),
  distance_km numeric(10,3) NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  duration_min numeric(8,2) NOT NULL DEFAULT 0 CHECK (duration_min >= 0),
  calories_kcal numeric(9,2) NOT NULL DEFAULT 0 CHECK (calories_kcal >= 0),
  source_system text NOT NULL,
  source_ingestion_id uuid NOT NULL,
  transformed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.weight_measurements (
  measurement_id text PRIMARY KEY,
  user_id uuid,
  measured_at timestamptz NOT NULL,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg BETWEEN 30 AND 350),
  source_system text NOT NULL,
  source_ingestion_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS serving.pipeline_runs (
  run_id uuid PRIMARY KEY,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  status text NOT NULL,
  processed_records integer NOT NULL DEFAULT 0,
  rejected_records integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  invalid_measurement_count integer NOT NULL DEFAULT 0,
  completeness_percent numeric(5,2),
  duration_seconds numeric(10,2),
  source_max_timestamp timestamptz
);

COMMENT ON SCHEMA raw IS 'Immutable source payloads with ingestion metadata.';
COMMENT ON SCHEMA staging IS 'Validated, deduplicated, and unit-normalized records.';
COMMENT ON SCHEMA analytics IS 'dbt-owned daily and weekly analytical models.';
COMMENT ON SCHEMA serving IS 'Stable API-facing aggregates and pipeline observability.';
