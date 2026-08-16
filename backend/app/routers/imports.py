import csv
import hashlib
import io
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import RawImport
from app.services.security import current_user_id
from app.services.storage import RawObjectStore

router = APIRouter(prefix="/imports", tags=["Datenimport"])
ALLOWED_SUFFIXES = {".csv", ".json"}
MAX_BYTES = 25 * 1024 * 1024


def inspect_rows(data: bytes, suffix: str) -> int:
    try:
        text = data.decode("utf-8-sig")
        if suffix == ".csv":
            reader = csv.DictReader(io.StringIO(text))
            if not reader.fieldnames:
                raise ValueError("CSV-Kopfzeile fehlt")
            return sum(1 for _ in reader)
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            raise ValueError("JSON-Import muss eine Liste von Datensätzen enthalten")
        return len(parsed)
    except (UnicodeDecodeError, csv.Error, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_import(
    file: UploadFile = File(...),
    user_id: UUID = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str | int]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Nur CSV und JSON erlaubt")
    data = await file.read(MAX_BYTES + 1)
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Datei leer oder größer als 25 MB")
    rows = inspect_rows(data, suffix)
    digest = hashlib.sha256(data).hexdigest()
    import_id = uuid4()
    object_key = f"{datetime.now(UTC):%Y/%m/%d}/{user_id}/{import_id}{suffix}"
    await RawObjectStore().put(object_key, data, file.content_type or "application/octet-stream")
    record = RawImport(
        id=import_id,
        user_id=user_id,
        object_key=object_key,
        filename=Path(file.filename or f"import{suffix}").name,
        content_type=file.content_type or "application/octet-stream",
        sha256=digest,
        status="queued",
        rows_received=rows,
    )
    session.add(record)
    await session.commit()
    return {"import_id": str(import_id), "status": "queued", "rows_received": rows, "sha256": digest}
