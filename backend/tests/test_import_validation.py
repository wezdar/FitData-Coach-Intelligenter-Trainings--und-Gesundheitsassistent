import pytest
from fastapi import HTTPException

from app.routers.imports import inspect_rows


def test_csv_and_json_row_count() -> None:
    assert inspect_rows(b"timestamp,steps\n2026-01-01,1000\n", ".csv") == 1
    assert inspect_rows(b'[{"timestamp":"2026-01-01","steps":1000}]', ".json") == 1


def test_json_object_is_quarantined_before_pipeline() -> None:
    with pytest.raises(HTTPException) as exc:
        inspect_rows(b'{"timestamp":"2026-01-01"}', ".json")
    assert exc.value.status_code == 422
