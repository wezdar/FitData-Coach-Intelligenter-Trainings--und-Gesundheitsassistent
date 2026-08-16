from app.schemas import Exercise, Experience, Goal, WorkoutGeneratorRequest, WorkoutPlanResponse, WorkoutSession


EXERCISES = {
    "squat": Exercise(name="Kniebeuge", sets=4, repetitions="6–8", rest_seconds=120, muscle_group="Beine", note="Rumpf stabil halten"),
    "hinge": Exercise(name="Rumänisches Kreuzheben", sets=3, repetitions="8–10", rest_seconds=90, muscle_group="Hintere Kette", note="Hüfte kontrolliert zurück"),
    "bench": Exercise(name="Bankdrücken", sets=4, repetitions="6–10", rest_seconds=120, muscle_group="Brust", note="Schulterblätter fixieren"),
    "row": Exercise(name="Rudern am Kabel", sets=4, repetitions="8–12", rest_seconds=90, muscle_group="Rücken", note="Ellbogen eng führen"),
    "press": Exercise(name="Schulterdrücken", sets=3, repetitions="8–10", rest_seconds=90, muscle_group="Schultern"),
    "pulldown": Exercise(name="Latzug", sets=3, repetitions="8–12", rest_seconds=75, muscle_group="Rücken"),
    "lunge": Exercise(name="Ausfallschritte", sets=3, repetitions="10 / Seite", rest_seconds=75, muscle_group="Beine & Gesäß"),
    "core": Exercise(name="Pallof Press", sets=3, repetitions="12 / Seite", rest_seconds=45, muscle_group="Core"),
    "pushup": Exercise(name="Liegestütz", sets=3, repetitions="8–15", rest_seconds=60, muscle_group="Brust & Trizeps"),
    "pullup": Exercise(name="Unterstützter Klimmzug", sets=3, repetitions="6–10", rest_seconds=90, muscle_group="Rücken"),
}


def _session(day: str, name: str, keys: list[str], minutes: int) -> WorkoutSession:
    return WorkoutSession(
        day=day,
        name=name,
        estimated_minutes=minutes,
        exercises=[EXERCISES[key].model_copy(deep=True) for key in keys],
    )


def generate_plan(request: WorkoutGeneratorRequest) -> WorkoutPlanResponse:
    """Generate a deterministic plan. Identical input always yields identical output."""
    days = request.available_days
    count = len(days)
    rationale = [
        f"{count} verfügbare Tage bestimmen den Split",
        f"Ziel {request.goal.value} steuert Wiederholungs- und Pausenbereiche",
        f"Erfahrung {request.experience.value} begrenzt Volumen und Komplexität",
        f"Einheiten werden auf etwa {request.session_duration_min} Minuten begrenzt",
    ]

    if count <= 3:
        split = "Ganzkörper"
        templates = [
            ("Ganzkörper A", ["squat", "bench", "row", "core"]),
            ("Ganzkörper B", ["hinge", "press", "pulldown", "lunge"]),
            ("Ganzkörper C", ["squat", "pushup", "pullup", "core"]),
        ]
    elif count == 4:
        split = "Oberkörper/Unterkörper"
        templates = [
            ("Oberkörper A", ["bench", "row", "press", "pulldown"]),
            ("Unterkörper A", ["squat", "hinge", "lunge", "core"]),
            ("Oberkörper B", ["pullup", "press", "pushup", "row"]),
            ("Unterkörper B", ["hinge", "squat", "lunge", "core"]),
        ]
    else:
        split = "Push/Pull/Beine"
        templates = [
            ("Push", ["bench", "press", "pushup", "core"]),
            ("Pull", ["row", "pullup", "pulldown", "hinge"]),
            ("Beine", ["squat", "hinge", "lunge", "core"]),
        ] * 2

    sessions = [
        _session(day, name, keys, request.session_duration_min)
        for day, (name, keys) in zip(days, templates, strict=False)
    ]

    # Beginners use one fewer working set, strength emphasizes lower reps and longer rest.
    for session in sessions:
        for exercise in session.exercises:
            if request.experience == Experience.beginner:
                exercise.sets = max(2, exercise.sets - 1)
            if request.goal == Goal.strength:
                exercise.repetitions = "4–6"
                exercise.rest_seconds = max(120, exercise.rest_seconds)

    return WorkoutPlanResponse(split=split, rationale=rationale, sessions=sessions)
