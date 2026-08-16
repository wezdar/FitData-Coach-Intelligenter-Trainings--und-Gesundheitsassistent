# API contracts

Base URL: `http://localhost:8000/api/v1`

FastAPI publishes interactive Swagger UI at `/docs`, ReDoc at `/redoc`, and the
machine-readable schema at `/openapi.json`.

## Authentication

Register or log in, then send `Authorization: Bearer <token>` to protected
profile and import endpoints. Passwords must contain 12–128 characters and are
stored only as Argon2 hashes.

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"demo@fitdata-coach.de","password":"FitData-Demo-2026!"}
```

## Calculate metrics

```http
POST /api/v1/metrics/calculate
Content-Type: application/json

{
  "age": 32,
  "sex": "weiblich",
  "height_cm": 180,
  "weight_kg": 77.2,
  "steps": 6842,
  "stride_length_cm": 74,
  "activity_factor": 1.55,
  "workout_met": 6,
  "workout_minutes": 52
}
```

Each metric includes `value`, `unit`, `formula`, `assumptions`, `limitations`,
and `lineage`. This makes the response suitable for both display and audit.

## Generate a workout plan

```http
POST /api/v1/workouts/generate
Content-Type: application/json

{
  "goal": "muskelaufbau",
  "experience": "fortgeschritten",
  "available_days": ["mo", "mi", "fr", "so"],
  "equipment": ["fitnessstudio"],
  "session_duration_min": 50
}
```

The `rules-v1` generator is deterministic: the same validated input always
returns the same split, exercise ordering, sets, repetitions, and rest periods.

## Upload data

`POST /api/v1/imports` accepts one multipart field named `file`. Supported
formats are UTF-8 CSV and JSON arrays up to 25 MB. The endpoint:

1. verifies extension and size;
2. checks that the file can be parsed at the envelope level;
3. calculates SHA-256;
4. writes unchanged bytes to the MinIO raw bucket;
5. stores ownership and pipeline metadata in PostgreSQL;
6. returns HTTP 202 with an import ID.

Schema-level fitness validation happens in the scheduled ETL pipeline so that
rejected payloads remain auditable.

## Data-quality status

`GET /api/v1/pipeline/status` returns the last execution time, processed and
rejected counts, completeness, duplicates, invalid measurements, freshness, and
duration. The current handler demonstrates the stable serving contract; the
roadmap connects it to `serving.pipeline_runs` after Compose integration.
