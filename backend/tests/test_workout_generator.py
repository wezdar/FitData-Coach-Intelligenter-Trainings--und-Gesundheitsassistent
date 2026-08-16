from app.schemas import Experience, Goal, WorkoutGeneratorRequest
from app.services.workout_generator import generate_plan


def request(days: list[str], goal: Goal = Goal.muscle) -> WorkoutGeneratorRequest:
    return WorkoutGeneratorRequest(
        goal=goal,
        experience=Experience.intermediate,
        available_days=days,
        equipment=["fitnessstudio"],
        session_duration_min=50,
    )


def test_four_days_selects_upper_lower_split_deterministically() -> None:
    payload = request(["mo", "mi", "fr", "so"])
    first = generate_plan(payload)
    second = generate_plan(payload)
    assert first == second
    assert first.split == "Oberkörper/Unterkörper"
    assert len(first.sessions) == 4
    assert all(session.exercises for session in first.sessions)


def test_strength_goal_changes_repetitions_and_rest() -> None:
    plan = generate_plan(request(["mo", "mi", "fr"], Goal.strength))
    assert plan.split == "Ganzkörper"
    for session in plan.sessions:
        for exercise in session.exercises:
            assert exercise.repetitions == "4–6"
            assert exercise.rest_seconds >= 120
