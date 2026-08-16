from fastapi import APIRouter

from app.schemas import WorkoutGeneratorRequest, WorkoutPlanResponse
from app.services.workout_generator import generate_plan

router = APIRouter(prefix="/workouts", tags=["Trainingsplan"])


@router.post("/generate", response_model=WorkoutPlanResponse)
async def create_workout_plan(payload: WorkoutGeneratorRequest) -> WorkoutPlanResponse:
    return generate_plan(payload)
