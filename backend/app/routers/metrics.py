from dataclasses import asdict

from fastapi import APIRouter

from app.schemas import MetricDefinition, MetricsRequest
from app.services.calculations import (
    bmi,
    bmr_mifflin_st_jeor,
    distance_from_steps,
    exercise_calories,
    healthy_weight_range,
    tdee,
)

router = APIRouter(prefix="/metrics", tags=["Metriken"])


def _response(result) -> MetricDefinition:
    data = asdict(result)
    if isinstance(result.value, tuple):
        data["value"] = list(result.value)
    return MetricDefinition(**data)


@router.post("/calculate", response_model=dict[str, MetricDefinition])
async def calculate_metrics(payload: MetricsRequest) -> dict[str, MetricDefinition]:
    bmr_result = bmr_mifflin_st_jeor(
        payload.weight_kg, payload.height_cm, payload.age, payload.sex.value
    )
    return {
        "bmi": _response(bmi(payload.weight_kg, payload.height_cm)),
        "healthy_weight_range": _response(healthy_weight_range(payload.height_cm)),
        "bmr": _response(bmr_result),
        "tdee": _response(tdee(float(bmr_result.value), payload.activity_factor)),
        "distance": _response(distance_from_steps(payload.steps, payload.stride_length_cm)),
        "exercise_calories": _response(
            exercise_calories(payload.workout_met, payload.weight_kg, payload.workout_minutes)
        ),
    }
