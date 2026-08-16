# Recruiter Guide — FitData Coach

[Project README](../README.md) · [Deutsche Version](RECRUITER_GUIDE_DE.md) · [Recruiter report](RECRUITER_REPORT.md)

This guide helps recruiters and hiring managers evaluate FitData Coach without needing to understand every implementation detail.

## 60-second review

1. Open the [README product tour](../README.md#product-tour).
2. Look at the [pipeline lineage screenshot](../screenshots/10-pipeline-lineage.jpg).
3. Read the [implementation status](../README.md#implementation-status), which separates implemented functionality from roadmap work.
4. Scan the automated tests in [`tests/`](../tests) and [`backend/tests/`](../backend/tests).

The project demonstrates a product-minded engineer who can connect a polished user experience to backend contracts, data quality and operational visibility.

## Five-minute review

| Time | What to inspect | What it demonstrates |
|---|---|---|
| 0–1 min | Dashboard and product gallery | Visual hierarchy, responsive product design and complex data presentation |
| 1–2 min | `backend/app/` | API design, validation, authentication and separation of services |
| 2–3 min | `pipeline/`, `airflow/` and `dbt/` | Layered ingestion, validation, orchestration and analytical modelling |
| 3–4 min | Metric lineage and pipeline screens | Explainability, observability and data trust as user-facing features |
| 4–5 min | Tests, CI and implementation-status table | Engineering discipline and honest communication of delivery state |

## Role-signal map

### Data Engineer

- Raw, staging, analytics and serving layers have distinct responsibilities.
- MinIO preserves immutable source files and checksums.
- Pandera handles validation and normalization; rejected rows retain reasons.
- Airflow orchestrates the ETL flow.
- dbt models and tests document analytical grain, ranges, accepted values and freshness.
- Pipeline and data-quality status are exposed to the product instead of remaining hidden operational details.

### Backend / Python Engineer

- FastAPI routers are separated by domain.
- Pydantic schemas bound and validate inputs.
- Authentication uses Argon2 password hashing and JWT access tokens.
- Workout generation is deterministic and testable.
- Calculated metrics return formula, unit, assumptions, limitations and lineage.

### Frontend / Full-stack Engineer

- React 19 and TypeScript power 13 responsive product surfaces.
- Shared shells and feature components avoid page-level duplication.
- Recharts, FullCalendar and XYFlow match the visualization to the underlying relationship.
- German and English content boundaries are prepared in the localization layer.
- Reduced-motion and semantic interaction patterns are considered.

### Product-minded Engineer

- The UI explains numbers instead of presenting unexplained scores.
- Synthetic demo data and medical limitations are visible.
- Data quality, quarantine and lineage are part of the user experience.
- The repository explicitly distinguishes polished prototypes from completed integrations.

## Recommended live-demo path

After starting the frontend, use this sequence:

1. **Dashboard:** explain the weekly goal, KPI cards and activity trend.
2. **Workout plan:** change goal, experience, schedule and equipment; discuss deterministic generation.
3. **Analytics:** open a metric explanation and show formula plus lineage.
4. **Data import:** explain the raw upload contract and synthetic fixtures.
5. **Pipeline & lineage:** trace a record from raw data to the dashboard.
6. **Data quality:** show why invalid rows are visible rather than silently dropped.

## Useful interview questions

- Why use immutable object storage before relational staging?
- Which validation belongs at upload time and which belongs in the ETL pipeline?
- How would the serving layer be populated transactionally after a successful dbt run?
- How should health-related estimates communicate uncertainty?
- What would be required before connecting a real fitness provider?
- Which current demo interactions need end-to-end API integration first?

## Honest scope and current gaps

- The product gallery uses synthetic data only.
- Several frontend interactions demonstrate stable contracts but are not yet persisted through the API.
- The Compose architecture is configured, while full cross-service integration still requires local Docker execution.
- Database migrations, raw-object deletion jobs and containerized browser E2E tests remain roadmap items.
- No medical claims, real health data or external provider credentials are included.

These boundaries are documented because communicating uncertainty and unfinished integration work is part of production engineering.

## Run locally

Frontend-only review:

```bash
npm ci
npm run dev
```

Complete stack:

```bash
cp .env.example .env
docker compose up --build
```

Demo account:

```text
demo@fitdata-coach.de
FitData-Demo-2026!
```
