from fastapi.testclient import TestClient

from app.main import app


def test_health_contract() -> None:
    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok", "service": "fitdata-api"}


def test_dashboard_requires_authentication() -> None:
    """The summary now serves per-user data, so it must not be publicly readable."""
    with TestClient(app) as client:
        assert client.get("/api/v1/dashboard/summary").status_code == 401


def test_pipeline_endpoints_require_authentication() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/pipeline/status").status_code == 401
        assert client.get("/api/v1/pipeline/incidents").status_code == 401
        assert client.post("/api/v1/pipeline/run").status_code == 401


def test_sse_stream_rejects_missing_token() -> None:
    """EventSource cannot send headers, so the stream accepts ?token= — but never nothing."""
    with TestClient(app) as client:
        assert client.get("/api/v1/pipeline/run/stream").status_code == 401
        assert client.get("/api/v1/pipeline/run/stream?token=not-a-jwt").status_code == 401


def test_calculation_endpoint_exposes_lineage() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/metrics/calculate",
            json={
                "age": 32,
                "sex": "weiblich",
                "height_cm": 180,
                "weight_kg": 77.2,
                "steps": 6842,
                "stride_length_cm": 74,
                "activity_factor": 1.55,
                "workout_met": 6,
                "workout_minutes": 52,
            },
        )
    assert response.status_code == 200
    assert response.json()["distance"]["value"] == 5.06
    assert "staging.activity.steps" in response.json()["distance"]["lineage"]


def test_invalid_input_is_rejected() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/metrics/calculate",
            json={"age": 4, "sex": "weiblich", "height_cm": 40, "weight_kg": -1, "steps": -2},
        )
    assert response.status_code == 422


def test_workout_generator_api() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/workouts/generate",
            json={
                "goal": "muskelaufbau",
                "experience": "fortgeschritten",
                "available_days": ["mo", "mi", "fr", "so"],
                "equipment": ["fitnessstudio"],
                "session_duration_min": 50,
            },
        )
    assert response.status_code == 200
    assert response.json()["generator_version"] == "rules-v1"
    assert len(response.json()["sessions"]) == 4
