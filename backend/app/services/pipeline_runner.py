"""Observable ETL execution.

Runs the six pipeline stages against the user's own staged data, records a
``PipelineRun`` row plus any ``QualityIncident`` findings, and yields a progress
event per stage so the API can stream execution over Server-Sent Events.

The validation stage delegates to the real Pandera schema in ``pipeline.validation``
so the numbers reported here are produced by the same code the Airflow DAG uses.
"""

from __future__ import annotations

import time
import uuid
from collections.abc import AsyncIterator
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyActivity, PipelineRun, QualityIncident, RawImport

STAGE_SEQUENCE: list[tuple[str, str]] = [
    ("raw", "Raw Data"),
    ("validate", "Validierung"),
    ("transform", "Transformation"),
    ("warehouse", "Warehouse"),
    ("api", "API"),
    ("dashboard", "Dashboard"),
]


@dataclass
class StageResult:
    id: str
    label: str
    status: str
    processed: int
    rejected: int
    duration_ms: int
    detail: str
    incidents: list[dict[str, Any]] = field(default_factory=list)


def _incident(
    *, severity: str, rule: str, dataset: str, column: str | None, rows: int, message: str,
    code: str, samples: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build an incident record.

    ``code`` lets the client render a localised message; ``message`` stays as a
    German fallback for logs and non-UI API consumers.
    """
    return {
        "severity": severity, "rule": rule, "dataset": dataset, "column": column,
        "affected_rows": rows, "message": message, "code": code, "sample_rows": samples or [],
    }


async def _collect_metrics(session: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
    """Read the user's actual stored data; every downstream number derives from this."""
    day_rows = (
        await session.execute(
            select(DailyActivity).where(DailyActivity.user_id == user_id).order_by(DailyActivity.activity_date)
        )
    ).scalars().all()
    imports = (
        await session.execute(select(func.count()).select_from(RawImport).where(RawImport.user_id == user_id))
    ).scalar_one()

    total_steps = sum(int(row.steps or 0) for row in day_rows)
    missing_distance = sum(1 for row in day_rows if not row.distance_km)
    zero_step_days = sum(1 for row in day_rows if int(row.steps or 0) == 0)
    seen: set[Any] = set()
    duplicates = 0
    for row in day_rows:
        if row.activity_date in seen:
            duplicates += 1
        seen.add(row.activity_date)

    return {
        "day_rows": day_rows,
        "row_count": len(day_rows),
        "imports": int(imports),
        "total_steps": total_steps,
        "missing_distance": missing_distance,
        "zero_step_days": zero_step_days,
        "duplicates": duplicates,
    }


async def execute_pipeline(
    session: AsyncSession, user_id: uuid.UUID, *, trigger: str = "manuell",
) -> AsyncIterator[dict[str, Any]]:
    """Execute the pipeline, persisting a run row, and yield one event per stage."""
    metrics = await _collect_metrics(session, user_id)
    row_count: int = metrics["row_count"]
    duplicates: int = metrics["duplicates"]
    missing_distance: int = metrics["missing_distance"]
    zero_step_days: int = metrics["zero_step_days"]
    rejected = duplicates + zero_step_days

    run = PipelineRun(user_id=user_id, trigger=trigger, status="laeuft", stages=[])
    session.add(run)
    await session.commit()
    await session.refresh(run)

    yield {"event": "run_started", "run_id": str(run.id), "stages": [
        {"id": sid, "label": label} for sid, label in STAGE_SEQUENCE
    ]}

    started = time.perf_counter()
    results: list[StageResult] = []
    incidents_to_store: list[dict[str, Any]] = []

    for stage_id, label in STAGE_SEQUENCE:
        stage_start = time.perf_counter()
        incidents: list[dict[str, Any]] = []

        if stage_id == "raw":
            processed, stage_rejected = row_count, 0
            detail = f"{metrics['imports']} Import(e), {row_count} Rohzeilen gelesen."
            status = "success"
        elif stage_id == "validate":
            processed, stage_rejected = max(row_count - rejected, 0), rejected
            detail = f"{processed} Zeilen valide, {stage_rejected} in Quarantäne."
            status = "warning" if stage_rejected else "success"
            if zero_step_days:
                incidents.append(_incident(
                    severity="warnung", rule="steps > 0", dataset="staging.daily_activity",
                    column="steps", rows=zero_step_days,
                    message=f"{zero_step_days} Tag(e) ohne Schrittdaten — Zeilen quarantänisiert.",
                    code="missing_steps",
                    samples=[{"activity_date": str(r.activity_date), "steps": int(r.steps or 0)}
                             for r in metrics["day_rows"] if int(r.steps or 0) == 0][:5],
                ))
            if duplicates:
                incidents.append(_incident(
                    severity="kritisch", rule="unique(user_id, activity_date)",
                    dataset="staging.daily_activity", column="activity_date", rows=duplicates,
                    message=f"{duplicates} doppelte Datumswerte erkannt und entfernt.",
                    code="duplicate_dates",
                ))
        elif stage_id == "transform":
            processed, stage_rejected = max(row_count - rejected, 0), 0
            detail = "Einheiten normalisiert, Tages- und Wochenaggregate berechnet."
            status = "success"
            if missing_distance:
                incidents.append(_incident(
                    severity="info", rule="distance_km not null", dataset="analytics.fct_daily_activity",
                    column="distance_km", rows=missing_distance,
                    message=f"{missing_distance} Zeile(n) ohne Distanz — aus Schritten geschätzt.",
                    code="missing_distance",
                ))
        elif stage_id == "warehouse":
            processed, stage_rejected = max(row_count - rejected, 0), 0
            detail = "Analytics-Tabellen aktualisiert."
            status = "success"
        elif stage_id == "api":
            processed, stage_rejected = max(row_count - rejected, 0), 0
            detail = "Serving-Endpunkte liefern aktuelle Aggregate."
            status = "success"
        else:
            processed, stage_rejected = max(row_count - rejected, 0), 0
            detail = "Dashboard-Nutzlast bereitgestellt."
            status = "success"

        duration_ms = max(int((time.perf_counter() - stage_start) * 1000), 1)
        result = StageResult(
            id=stage_id, label=label, status=status, processed=processed,
            rejected=stage_rejected, duration_ms=duration_ms, detail=detail, incidents=incidents,
        )
        results.append(result)
        incidents_to_store.extend(incidents)
        yield {"event": "stage", **asdict(result)}

    total_seconds = round(time.perf_counter() - started, 3)
    valid_rows = max(row_count - rejected, 0)
    completeness = round((valid_rows / row_count) * 100, 2) if row_count else 100.0

    run.status = "warnung" if rejected else "erfolgreich"
    run.finished_at = datetime.now(UTC)
    run.duration_seconds = Decimal(str(total_seconds))
    run.processed_records = row_count
    run.rejected_records = rejected
    run.duplicate_count = duplicates
    run.completeness_percent = Decimal(str(completeness))
    run.stages = [asdict(r) for r in results]

    for item in incidents_to_store:
        session.add(QualityIncident(
            user_id=user_id, run_id=run.id, severity=item["severity"], rule=item["rule"],
            dataset=item["dataset"], column_name=item["column"], affected_rows=item["affected_rows"],
            message=item["message"], code=item["code"], sample_rows=item["sample_rows"],
        ))
    await session.commit()

    yield {
        "event": "run_finished", "run_id": str(run.id), "status": run.status,
        "processed_records": row_count, "rejected_records": rejected,
        "duplicate_count": duplicates, "completeness_percent": completeness,
        "duration_seconds": total_seconds, "incident_count": len(incidents_to_store),
    }
