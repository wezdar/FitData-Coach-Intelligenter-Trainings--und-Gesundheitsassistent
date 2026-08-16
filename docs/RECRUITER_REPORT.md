# Recruiter Report — FitData Coach

[Project README](../README.md) · [Deutsche Version](RECRUITER_REPORT_DE.md) · [Recruiter guide](RECRUITER_GUIDE.md)

- **Assessment date:** 16 August 2026
- **Project type:** Self-contained portfolio application
- **Primary profile:** Data / Full-stack Engineer with product and analytics orientation

## Executive assessment

FitData Coach presents a strong portfolio signal because it connects three concerns that are often shown separately: a polished product surface, a validated backend and an observable analytical data pipeline. The differentiating idea is not merely fitness tracking; it is the treatment of lineage, assumptions and data quality as user-facing product capabilities.

The repository is most relevant for junior-to-mid-level data engineering, analytics engineering, Python backend or full-stack roles. Its strongest evidence is the breadth of implemented contracts and the consistency of the product narrative. The main limitation is integration completeness: parts of the frontend currently demonstrate the intended API behavior rather than persisting it end to end.

## Evidence summary

| Dimension | Evidence | Assessment |
|---|---|---|
| Product scope | 13 responsive screens covering fitness and data operations | Strong breadth and coherent visual system |
| Data architecture | Raw, staging, analytics and serving layers | Clear separation of responsibilities |
| Data trust | Validation, quarantine, checksums, dbt tests, freshness and lineage | Strong differentiator for a portfolio project |
| Backend | FastAPI, Pydantic, SQLAlchemy, authentication and domain services | Good modular foundation |
| Frontend | React 19, TypeScript and specialized visualization libraries | Strong information design for complex data |
| Testing | Frontend, calculation, API, authentication, import, workout and pipeline tests | Good test variety across boundaries |
| Operations | Docker Compose and GitHub Actions | Credible reproducibility story |
| Documentation | Bilingual README, API/lineage docs and recruiter tour | Reviewer-friendly and transparent |

## Technical strengths

### 1. Layered data design

The ingestion path preserves original files before validation. This supports auditability and makes it possible to reprocess data after validation rules change. Typed staging, explicit quarantine and dbt analytics models show an understanding of data lifecycle rather than a single-table CRUD approach.

### 2. Explainability by design

Metric responses include formula, unit, assumptions, limitations and source lineage. Workout recommendations are deterministic. These choices make the application easier to test and safer to communicate in a health-adjacent domain.

### 3. Productized observability

Pipeline health and data quality have dedicated interfaces. That is a useful product decision: trust indicators are exposed to users and reviewers rather than confined to logs.

### 4. Cross-stack consistency

Equivalent calculation logic exists in Python and TypeScript with reference tests. API routers, service modules, data models and feature pages are separated clearly enough for continued development.

### 5. Honest delivery communication

The project documentation identifies partial UI/API wiring and other roadmap work. This avoids overstating production readiness and gives interviewers concrete trade-offs to discuss.

## Risks and development priorities

| Priority | Gap | Recommended next step |
|---|---|---|
| High | Frontend forms and mutations are not all persisted through authenticated APIs | Connect onboarding, settings, plan generation and imports with loading, optimistic and error states |
| High | Full cross-service path needs repeatable Compose verification | Add an integration job that boots the stack, seeds data and exercises one end-to-end journey |
| Medium | Database schema evolution is not migration-driven | Introduce Alembic and test forward/backward migration paths |
| Medium | Raw-object deletion is not complete | Implement retention and account-deletion orchestration for MinIO objects |
| Medium | Browser accessibility coverage is limited | Add keyboard, screen-reader and automated accessibility checks |
| Low | No external provider sync | Add only after privacy, consent and OAuth threat modelling |

## Suggested interview focus

An interview based on this project should explore decisions rather than visual polish alone:

- raw object storage versus direct database ingestion;
- idempotency, deduplication and replay behavior;
- transactional boundaries between Airflow, dbt and the serving layer;
- deterministic recommendations versus learned models;
- handling uncertainty and safety in fitness calculations;
- prioritization of the remaining frontend/API integrations;
- observability signals required for production operation.

## Hiring signal

The project supports a positive technical-screen signal for candidates expected to build data products across boundaries. It is particularly valuable when the role rewards ownership from ingestion and modeling through API and user experience. Production readiness should be judged after discussing the integration gaps listed above and reviewing the candidate's reasoning about them.

This report is a repository-oriented portfolio assessment, not an independent certification or production security audit.
