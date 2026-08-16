"""Transparent fitness calculations with explicit units and field lineage.

These functions provide informational estimates only. They are not medical
diagnoses and deliberately avoid interpreting a health condition.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class MetricResult:
    value: float | tuple[float, float]
    unit: str
    formula: str
    assumptions: tuple[str, ...]
    limitations: tuple[str, ...]
    lineage: tuple[str, ...]


def _positive(value: float, name: str) -> None:
    if value <= 0:
        raise ValueError(f"{name} must be positive")


def bmi(weight_kg: float, height_cm: float) -> MetricResult:
    """BMI = kg / m²; useful as an indicative population-level measure."""
    _positive(weight_kg, "weight_kg")
    _positive(height_cm, "height_cm")
    value = weight_kg / (height_cm / 100) ** 2
    return MetricResult(
        round(value, 2), "kg/m²", "weight_kg / (height_cm / 100) ^ 2",
        ("adult body measurements",),
        ("does not distinguish muscle from fat mass",),
        ("analytics.latest_measurement.weight_kg", "profile.height_cm"),
    )


def healthy_weight_range(height_cm: float) -> MetricResult:
    """Indicative range based on BMI 18.5–24.9, not an individual prescription."""
    _positive(height_cm, "height_cm")
    height_squared = (height_cm / 100) ** 2
    return MetricResult(
        (round(18.5 * height_squared, 1), round(24.9 * height_squared, 1)), "kg",
        "BMI boundary * (height_cm / 100) ^ 2",
        ("indicative BMI interval 18.5–24.9 for adults",),
        ("not suitable for individual diagnosis or body-composition assessment",),
        ("profile.height_cm", "reference.bmi_lower", "reference.bmi_upper"),
    )


def bmr_mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, sex: str) -> MetricResult:
    """Mifflin–St Jeor resting metabolic rate estimate."""
    _positive(weight_kg, "weight_kg")
    _positive(height_cm, "height_cm")
    _positive(age, "age")
    if sex not in {"maennlich", "weiblich", "divers"}:
        raise ValueError("unsupported sex value")
    # No validated constant exists for non-binary identities; use midpoint and disclose it.
    constant = 5 if sex == "maennlich" else -161 if sex == "weiblich" else -78
    value = 10 * weight_kg + 6.25 * height_cm - 5 * age + constant
    return MetricResult(
        round(value), "kcal/day",
        "10 * weight_kg + 6.25 * height_cm - 5 * age + sex_constant",
        (f"Mifflin–St Jeor constant {constant}", "resting state"),
        ("individual metabolism and body composition vary", "diverse uses disclosed midpoint constant"),
        ("profile.weight_kg", "profile.height_cm", "profile.age", "profile.sex"),
    )


def tdee(bmr_kcal: float, activity_factor: float) -> MetricResult:
    _positive(bmr_kcal, "bmr_kcal")
    if not 1.2 <= activity_factor <= 2.0:
        raise ValueError("activity_factor must be between 1.2 and 2.0")
    return MetricResult(
        round(bmr_kcal * activity_factor), "kcal/day", "bmr_kcal * activity_factor",
        (f"configured activity factor {activity_factor}",),
        ("activity factors are broad categories, not measured expenditure",),
        ("derived.bmr_kcal", "profile.activity_factor"),
    )


def distance_from_steps(steps: int, stride_length_cm: float = 74) -> MetricResult:
    if steps < 0:
        raise ValueError("steps cannot be negative")
    _positive(stride_length_cm, "stride_length_cm")
    return MetricResult(
        round(steps * stride_length_cm / 100_000, 2), "km",
        "steps * stride_length_cm / 100000",
        (f"constant stride length {stride_length_cm} cm",),
        ("terrain, pace and gait variation are not represented",),
        ("staging.activity.steps", "profile.stride_length_cm"),
    )


def exercise_calories(met: float, weight_kg: float, duration_minutes: int) -> MetricResult:
    _positive(met, "met")
    _positive(weight_kg, "weight_kg")
    if duration_minutes < 0:
        raise ValueError("duration_minutes cannot be negative")
    return MetricResult(
        round(met * 3.5 * weight_kg * duration_minutes / 200), "kcal",
        "MET * 3.5 * weight_kg * duration_minutes / 200",
        ("constant exercise intensity", "MET value matches exercise category"),
        ("heart rate, efficiency and individual metabolism are not measured",),
        ("staging.workout.met", "profile.weight_kg", "staging.workout.duration_min"),
    )


def adherence(completed: int, planned: int) -> MetricResult:
    if completed < 0 or planned < 0:
        raise ValueError("session counts cannot be negative")
    value = 0 if planned == 0 else min(100.0, completed / planned * 100)
    return MetricResult(
        round(value, 1), "%", "completed_sessions / planned_sessions * 100",
        ("cancelled sessions remain planned unless explicitly rescheduled",),
        ("completion does not measure exercise quality",),
        ("analytics.completed_sessions", "analytics.planned_sessions"),
    )
