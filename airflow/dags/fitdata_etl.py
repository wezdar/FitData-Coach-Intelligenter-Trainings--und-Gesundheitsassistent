"""Scheduled raw → staging → analytics pipeline for synthetic fitness data."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from airflow.sdk import dag, task


@dag(
    dag_id="fitdata_activity_etl",
    schedule="0 */2 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    default_args={"retries": 2},
    tags=["fitdata", "etl", "data-quality"],
)
def activity_etl():
    @task
    def discover_files() -> list[str]:
        return [str(path) for path in Path("/opt/airflow/sample").glob("*.csv")]

    @task
    def ingest_raw(files: list[str]) -> dict[str, int]:
        # Production implementation writes immutable bytes to MinIO before parsing.
        return {"files": len(files), "bytes": sum(Path(item).stat().st_size for item in files)}

    @task
    def validate_and_stage(_: dict[str, int], files: list[str]) -> dict[str, int]:
        import pandas as pd

        from pipeline.validation import validate_activity

        frames = [pd.read_csv(path) for path in files if "activities" in path]
        if not frames:
            return {"valid": 0, "rejected": 0, "duplicates": 0}
        source = pd.concat(frames, ignore_index=True)
        unique = source.drop_duplicates(subset=["activity_id"], keep="last")
        valid, rejected = validate_activity(source)
        return {
            "valid": len(valid),
            "rejected": len(rejected),
            "duplicates": len(source) - len(unique),
        }

    @task.bash
    def transform_dbt() -> str:
        return "cd /usr/app && dbt build --profiles-dir ."

    @task
    def publish_status(result: dict[str, int]) -> dict[str, int | str]:
        return {**result, "status": "success", "published_at": datetime.utcnow().isoformat()}

    files = discover_files()
    raw = ingest_raw(files)
    validation = validate_and_stage(raw, files)
    dbt_result = transform_dbt()
    dbt_result >> publish_status(validation)


activity_etl()
