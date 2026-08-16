import pytest

from app.services.calculations import (
    adherence,
    bmi,
    bmr_mifflin_st_jeor,
    distance_from_steps,
    exercise_calories,
    healthy_weight_range,
    tdee,
)


def test_bmi_and_healthy_weight_range_are_documented() -> None:
    result = bmi(77.2, 180)
    weight_range = healthy_weight_range(180)
    assert result.value == pytest.approx(23.83, abs=0.01)
    assert weight_range.value == (59.9, 80.7)
    assert result.unit == "kg/m²"
    assert "profile.height_cm" in result.lineage
    assert result.limitations


def test_mifflin_st_jeor_and_tdee() -> None:
    bmr_result = bmr_mifflin_st_jeor(77.2, 180, 32, "weiblich")
    assert bmr_result.value == 1576
    tdee_result = tdee(float(bmr_result.value), 1.55)
    assert tdee_result.value == 2443


def test_distance_and_met_calories() -> None:
    assert distance_from_steps(6842, 74).value == 5.06
    assert exercise_calories(6, 77.2, 52).value == 422


def test_adherence_handles_empty_plan_and_caps_overcompletion() -> None:
    assert adherence(0, 0).value == 0
    assert adherence(6, 5).value == 100.0


@pytest.mark.parametrize("weight,height", [(0, 180), (70, 0), (-1, 170)])
def test_bmi_rejects_non_positive_values(weight: float, height: float) -> None:
    with pytest.raises(ValueError):
        bmi(weight, height)
