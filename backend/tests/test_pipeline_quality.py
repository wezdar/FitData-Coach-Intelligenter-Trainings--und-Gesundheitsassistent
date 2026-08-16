import pandas as pd

from pipeline.validation import normalize_activity, validate_activity


def fixture() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"activity_id": "a", "timestamp": "2026-08-15T08:00:00+02:00", "activity_type": "steps", "steps": 1000, "distance": 740, "distance_unit": "m", "duration_min": None, "calories_kcal": 50, "source": "test"},
            {"activity_id": "a", "timestamp": "2026-08-15T09:00:00+02:00", "activity_type": "steps", "steps": 1100, "distance": 0.8, "distance_unit": "km", "duration_min": 12, "calories_kcal": 55, "source": "test"},
            {"activity_id": "bad", "timestamp": "2026-08-15T10:00:00+02:00", "activity_type": "steps", "steps": -3, "distance": 0, "distance_unit": "km", "duration_min": 2, "calories_kcal": 3, "source": "test"},
        ]
    )


def test_normalization_deduplicates_and_converts_units() -> None:
    normalized = normalize_activity(fixture().iloc[:1])
    assert normalized.iloc[0]["distance"] == 0.74
    deduplicated = normalize_activity(fixture())
    assert len(deduplicated) == 2
    assert deduplicated.loc[deduplicated["activity_id"] == "a", "steps"].item() == 1100


def test_invalid_measurement_is_quarantined() -> None:
    valid, rejected = validate_activity(fixture())
    assert set(valid["activity_id"]) == {"a"}
    assert set(rejected["activity_id"]) == {"bad"}
    assert rejected.iloc[0]["rejection_reason"] == "schema_validation_failed"
