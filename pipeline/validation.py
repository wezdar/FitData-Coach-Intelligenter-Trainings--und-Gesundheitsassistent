from __future__ import annotations

import pandas as pd
import pandera.pandas as pa
from pandera import Check, Column, DataFrameSchema


ACTIVITY_SCHEMA = DataFrameSchema(
    {
        "activity_id": Column(str, nullable=False),
        "timestamp": Column(pa.DateTime, nullable=False, coerce=True),
        "activity_type": Column(str, Check.isin(["steps", "walk", "run", "workout", "cycling"])),
        "steps": Column(int, Check.in_range(0, 100_000), nullable=True, coerce=True),
        "distance": Column(float, Check.in_range(0, 300), nullable=True, coerce=True),
        "distance_unit": Column(str, Check.isin(["m", "km", "mi"]), nullable=True),
        "duration_min": Column(float, Check.in_range(0, 1_440), nullable=True, coerce=True),
        "calories_kcal": Column(float, Check.in_range(0, 10_000), nullable=True, coerce=True),
        "source": Column(str, nullable=False),
    },
    strict="filter",
    coerce=True,
)


def normalize_activity(frame: pd.DataFrame) -> pd.DataFrame:
    """Normalize timestamps/units and apply explicit missing-value policy."""
    result = frame.copy()
    result["timestamp"] = pd.to_datetime(result["timestamp"], utc=True, errors="coerce")
    for column in ["steps", "distance", "duration_min", "calories_kcal"]:
        result[column] = pd.to_numeric(result.get(column), errors="coerce").fillna(0)
    units = result.get("distance_unit", pd.Series("km", index=result.index)).fillna("km")
    result["distance"] = result["distance"].where(units != "m", result["distance"] / 1000)
    result["distance"] = result["distance"].where(units != "mi", result["distance"] * 1.609344)
    result["distance_unit"] = "km"
    result = result.drop_duplicates(subset=["activity_id"], keep="last")
    return result.sort_values("timestamp").reset_index(drop=True)


def validate_activity(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return valid and quarantined rows without losing the rejected payload."""
    normalized = normalize_activity(frame)
    try:
        return ACTIVITY_SCHEMA.validate(normalized, lazy=True), normalized.iloc[0:0].copy()
    except pa.errors.SchemaErrors as exc:
        invalid_indexes = set(exc.failure_cases["index"].dropna().astype(int).tolist())
        quarantine = normalized.loc[normalized.index.isin(invalid_indexes)].copy()
        quarantine["rejection_reason"] = "schema_validation_failed"
        valid = normalized.loc[~normalized.index.isin(invalid_indexes)].copy()
        return ACTIVITY_SCHEMA.validate(valid), quarantine
