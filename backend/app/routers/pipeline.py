import asyncio
import json
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal, get_session
from app.models import PipelineRun, QualityIncident
from app.schemas import PipelineStatus
from app.services.pipeline_runner import execute_pipeline
from app.services.security import current_user_id, current_user_id_sse

router = APIRouter(prefix="/pipeline", tags=["Datenqualität"])


@router.get("/status", response_model=PipelineStatus)
async def pipeline_status(
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID = Depends(current_user_id),
) -> PipelineStatus:
    """Latest recorded run for the authenticated user."""
    run = await session.scalar(
        select(PipelineRun).where(PipelineRun.user_id == user_id).order_by(desc(PipelineRun.started_at)).limit(1)
    )
    if run is None:
        # No run recorded yet — report an explicit empty state rather than invented numbers.
        return PipelineStatus(
            last_run=datetime.now(UTC), status="kein_lauf", processed_records=0, rejected_records=0,
            completeness_percent=0.0, duplicate_count=0, invalid_measurement_count=0,
            freshness_minutes=0, duration_seconds=0.0,
        )

    reference = run.finished_at or run.started_at
    if reference.tzinfo is None:
        reference = reference.replace(tzinfo=UTC)
    freshness = max(int((datetime.now(UTC) - reference).total_seconds() // 60), 0)

    return PipelineStatus(
        last_run=reference,
        status=run.status,
        processed_records=run.processed_records,
        rejected_records=run.rejected_records,
        completeness_percent=float(run.completeness_percent),
        duplicate_count=run.duplicate_count,
        invalid_measurement_count=max(run.rejected_records - run.duplicate_count, 0),
        freshness_minutes=freshness,
        duration_seconds=float(run.duration_seconds),
    )


@router.get("/runs")
async def list_runs(
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID = Depends(current_user_id),
) -> list[dict]:
    runs = (
        await session.execute(
            select(PipelineRun).where(PipelineRun.user_id == user_id)
            .order_by(desc(PipelineRun.started_at)).limit(limit)
        )
    ).scalars().all()
    return [
        {
            "id": str(run.id), "trigger": run.trigger, "status": run.status,
            "started_at": run.started_at, "finished_at": run.finished_at,
            "processed_records": run.processed_records, "rejected_records": run.rejected_records,
            "completeness_percent": float(run.completeness_percent),
            "duration_seconds": float(run.duration_seconds), "stages": run.stages,
        }
        for run in runs
    ]


@router.get("/incidents")
async def list_incidents(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID = Depends(current_user_id),
) -> list[dict]:
    """Data-quality incidents for the observability timeline."""
    incidents = (
        await session.execute(
            select(QualityIncident).where(QualityIncident.user_id == user_id)
            .order_by(desc(QualityIncident.detected_at)).limit(limit)
        )
    ).scalars().all()
    return [
        {
            "id": str(item.id), "run_id": str(item.run_id) if item.run_id else None,
            "detected_at": item.detected_at, "severity": item.severity, "rule": item.rule,
            "dataset": item.dataset, "column": item.column_name, "affected_rows": item.affected_rows,
            "message": item.message, "code": item.code, "status": item.status, "sample_rows": item.sample_rows,
        }
        for item in incidents
    ]


@router.post("/run")
async def run_pipeline(
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID = Depends(current_user_id),
) -> dict:
    """Execute the pipeline synchronously and return the final summary."""
    final: dict = {}
    async for event in execute_pipeline(session, user_id, trigger="manuell"):
        if event.get("event") == "run_finished":
            final = event
    return final


@router.get("/run/stream")
async def stream_pipeline(
    token_user: uuid.UUID = Depends(current_user_id_sse),
    delay_ms: int = Query(600, ge=0, le=3000),
) -> StreamingResponse:
    """Execute the pipeline and stream one Server-Sent Event per stage.

    ``delay_ms`` paces the stream so the dashboard animation stays legible; the
    reported per-stage durations are the real measured values, not the delay.
    """

    async def event_source():
        # A dedicated session: the request-scoped one closes when the response starts.
        async with SessionLocal() as session:
            try:
                async for event in execute_pipeline(session, token_user, trigger="live"):
                    yield f"data: {json.dumps(event, default=str)}\n\n"
                    if event.get("event") == "stage" and delay_ms:
                        await asyncio.sleep(delay_ms / 1000)
            except Exception as exc:  # noqa: BLE001 - surface failure to the client stream
                yield f"data: {json.dumps({'event': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
