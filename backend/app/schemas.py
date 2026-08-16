from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Sex(StrEnum):
    female = "weiblich"
    male = "maennlich"
    diverse = "divers"


class Experience(StrEnum):
    beginner = "einsteiger"
    intermediate = "fortgeschritten"
    advanced = "erfahren"


class Goal(StrEnum):
    muscle = "muskelaufbau"
    strength = "kraft"
    general = "allgemeine_fitness"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    display_name: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileInput(BaseModel):
    age: int = Field(ge=16, le=100)
    sex: Sex
    height_cm: int = Field(ge=120, le=230)
    weight_kg: float = Field(gt=30, le=350)
    experience: Experience
    goal: Goal
    available_days: list[str] = Field(min_length=1, max_length=7)
    daily_steps: int = Field(ge=0, le=100_000)
    equipment: list[str] = Field(default_factory=list, max_length=20)
    session_duration_min: int = Field(default=50, ge=20, le=120)
    stride_length_cm: float = Field(default=74, ge=40, le=130)
    health_limitations: str | None = Field(default=None, max_length=1000)

    @field_validator("available_days")
    @classmethod
    def validate_days(cls, value: list[str]) -> list[str]:
        allowed = {"mo", "di", "mi", "do", "fr", "sa", "so"}
        normalized = [item.lower() for item in value]
        if len(set(normalized)) != len(normalized) or not set(normalized).issubset(allowed):
            raise ValueError("Trainingstage müssen eindeutig und gültig sein")
        return normalized


class ProfileResponse(ProfileInput):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID


class MetricsRequest(BaseModel):
    age: int = Field(ge=16, le=100)
    sex: Sex
    height_cm: float = Field(ge=120, le=230)
    weight_kg: float = Field(gt=30, le=350)
    steps: int = Field(ge=0, le=100_000)
    stride_length_cm: float = Field(default=74, ge=40, le=130)
    activity_factor: float = Field(default=1.55, ge=1.2, le=2.0)
    workout_met: float = Field(default=6.0, ge=1, le=20)
    workout_minutes: int = Field(default=0, ge=0, le=360)


class MetricDefinition(BaseModel):
    value: float | list[float]
    unit: str
    formula: str
    assumptions: list[str]
    limitations: list[str]
    lineage: list[str]


class WorkoutGeneratorRequest(BaseModel):
    goal: Goal
    experience: Experience
    available_days: list[str] = Field(min_length=2, max_length=6)
    equipment: list[str] = Field(default_factory=lambda: ["fitnessstudio"])
    session_duration_min: int = Field(default=50, ge=25, le=120)


class Exercise(BaseModel):
    name: str
    sets: int
    repetitions: str
    rest_seconds: int
    muscle_group: str
    note: str | None = None


class WorkoutSession(BaseModel):
    day: str
    name: str
    estimated_minutes: int
    exercises: list[Exercise]


class WorkoutPlanResponse(BaseModel):
    split: str
    rationale: list[str]
    sessions: list[WorkoutSession]
    generator_version: str = "rules-v1"


class PipelineStatus(BaseModel):
    last_run: datetime
    status: str
    processed_records: int
    rejected_records: int
    completeness_percent: float
    duplicate_count: int
    invalid_measurement_count: int
    freshness_minutes: int
    duration_seconds: float
