import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

# Dialect-portable column types: identical DDL on PostgreSQL (native UUID / JSONB),
# while still running on SQLite for local development and tests.
UUID = Uuid
JSONColumn = JSON().with_variant(JSONB, "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    profile: Mapped["Profile | None"] = relationship(back_populates="user", cascade="all, delete-orphan")


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    age: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str] = mapped_column(String(32))
    height_cm: Mapped[int] = mapped_column(Integer)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    experience: Mapped[str] = mapped_column(String(32))
    goal: Mapped[str] = mapped_column(String(32))
    available_days: Mapped[list[str]] = mapped_column(JSONColumn)
    daily_steps: Mapped[int] = mapped_column(Integer)
    equipment: Mapped[list[str]] = mapped_column(JSONColumn, default=list)
    session_duration_min: Mapped[int] = mapped_column(Integer, default=50)
    stride_length_cm: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=74)
    health_limitations: Mapped[str | None] = mapped_column(Text, nullable=True)
    user: Mapped[User] = relationship(back_populates="profile")


class RawImport(TimestampMixin, Base):
    __tablename__ = "raw_imports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    object_key: Mapped[str] = mapped_column(String(500), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    rows_received: Mapped[int | None] = mapped_column(Integer, nullable=True)


class DailyActivity(Base):
    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "activity_date"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    activity_date: Mapped[date] = mapped_column(Date)
    steps: Mapped[int] = mapped_column(Integer, default=0)
    distance_km: Mapped[Decimal] = mapped_column(Numeric(8, 3), default=0)
    active_calories_kcal: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0)
    workout_minutes: Mapped[int] = mapped_column(Integer, default=0)


class WeightMeasurement(Base):
    """Body-weight readings feeding the progression chart and BMI."""

    __tablename__ = "weight_measurements"
    __table_args__ = (UniqueConstraint("user_id", "measured_on"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    measured_on: Mapped[date] = mapped_column(Date)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    source: Mapped[str] = mapped_column(String(32), default="manuell")


class PipelineRun(Base):
    """One observable ETL execution; powers pipeline status and live playback."""

    __tablename__ = "pipeline_runs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    trigger: Mapped[str] = mapped_column(String(32), default="manuell")
    status: Mapped[str] = mapped_column(String(32), default="laeuft")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0)
    processed_records: Mapped[int] = mapped_column(Integer, default=0)
    rejected_records: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    completeness_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    stages: Mapped[list[dict]] = mapped_column(JSONColumn, default=list)


class QualityIncident(Base):
    """Data-quality rule violation detected during a run (observability timeline)."""

    __tablename__ = "quality_incidents"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=True
    )
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    severity: Mapped[str] = mapped_column(String(16), default="warnung")
    rule: Mapped[str] = mapped_column(String(120))
    dataset: Mapped[str] = mapped_column(String(120))
    column_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    affected_rows: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str] = mapped_column(Text)
    code: Mapped[str] = mapped_column(String(48), default="")
    status: Mapped[str] = mapped_column(String(24), default="offen")
    sample_rows: Mapped[list[dict]] = mapped_column(JSONColumn, default=list)
