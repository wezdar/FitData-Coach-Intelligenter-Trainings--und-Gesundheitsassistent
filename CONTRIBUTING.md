# Contributing

Thank you for helping improve FitData Coach. Changes should preserve the
project's central promise: fitness data must remain explainable, validated, and
privacy-conscious.

## Development workflow

1. Open an issue for substantial changes and describe the user or data problem.
2. Create a focused branch and keep unrelated refactors out of the change.
3. Add or update tests for formulas, schemas, transformations, and UI behavior.
4. Run the frontend and backend quality gates documented in `README.md`.
5. Update metric assumptions, limitations, units, and lineage whenever a
   calculated field changes.
6. Submit a pull request using the repository template.

## Data rules

- Commit only synthetic data.
- Never include tokens, private exports, device IDs, or personal health data.
- Raw ingestion must be append-only; cleaning belongs in staging.
- Invalid rows must be quarantined with a reason, not silently dropped.
- Changes to a dbt model require schema tests at the model grain.

## Product language and accessibility

The user interface is German. Keep source code prepared for later localization,
use plain terminology, respect reduced-motion preferences, and check keyboard
and small-screen usability. Do not make diagnostic or medical claims.
