import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import DailyActivity, Profile, WeightMeasurement
from app.services import calculations
from app.services.security import current_user_id

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DISCLAIMER = "Informative Schätzwerte; keine medizinische Beratung oder Diagnose."


@router.get("/summary")
async def dashboard_summary(
    session: AsyncSession = Depends(get_session),
    user_id: uuid.UUID = Depends(current_user_id),
) -> dict:
    """Serving payload computed from the user's stored activity and profile."""
    profile = await session.scalar(select(Profile).where(Profile.user_id == user_id))
    today = date.today()
    window_start = today - timedelta(days=6)

    week_rows = (
        await session.execute(
            select(DailyActivity)
            .where(DailyActivity.user_id == user_id, DailyActivity.activity_date >= window_start)
            .order_by(DailyActivity.activity_date)
        )
    ).scalars().all()

    previous_rows = (
        await session.execute(
            select(DailyActivity).where(
                DailyActivity.user_id == user_id,
                DailyActivity.activity_date >= window_start - timedelta(days=7),
                DailyActivity.activity_date < window_start,
            )
        )
    ).scalars().all()

    latest_weight = await session.scalar(
        select(WeightMeasurement).where(WeightMeasurement.user_id == user_id)
        .order_by(desc(WeightMeasurement.measured_on)).limit(1)
    )
    weight_series = (
        await session.execute(
            select(WeightMeasurement).where(WeightMeasurement.user_id == user_id)
            .order_by(WeightMeasurement.measured_on)
        )
    ).scalars().all()

    today_row = next((row for row in week_rows if row.activity_date == today), None)
    steps_today = int(today_row.steps) if today_row else 0
    distance_today = float(today_row.distance_km) if today_row else 0.0
    calories_today = float(today_row.active_calories_kcal) if today_row else 0.0

    week_steps = sum(int(row.steps or 0) for row in week_rows)
    previous_steps = sum(int(row.steps or 0) for row in previous_rows)
    steps_change = round(((week_steps - previous_steps) / previous_steps) * 100, 1) if previous_steps else None

    workouts_completed = sum(1 for row in week_rows if int(row.workout_minutes or 0) > 0)
    workouts_planned = len(profile.available_days) if profile and profile.available_days else 0

    weight_kg = float(latest_weight.weight_kg) if latest_weight else (float(profile.weight_kg) if profile else None)
    height_cm = profile.height_cm if profile else None

    bmi_result = calculations.bmi(weight_kg, height_cm) if weight_kg and height_cm else None
    healthy = calculations.healthy_weight_range(height_cm) if height_cm else None

    # Longest consecutive run of active days ending today.
    active_days = {row.activity_date for row in week_rows if int(row.steps or 0) > 0}
    streak = 0
    cursor = today
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)

    return {
        "as_of": datetime.now(UTC),
        "synthetic": False,
        "has_data": bool(week_rows),
        "kpis": {
            "weight_kg": weight_kg,
            "bmi": bmi_result.value if bmi_result else None,
            "healthy_weight_range_kg": healthy.value if healthy else None,
            "steps_today": steps_today,
            "distance_km": round(distance_today, 2),
            "active_calories_kcal": round(calories_today),
            "workouts_completed": workouts_completed,
            "workouts_planned": workouts_planned,
            "streak_days": streak,
            "week_steps": week_steps,
            "steps_change_percent": steps_change,
        },
        "weekly_activity": [
            {
                "date": row.activity_date,
                "steps": int(row.steps or 0),
                "distance_km": float(row.distance_km or 0),
                "active_calories_kcal": float(row.active_calories_kcal or 0),
                "workout_minutes": int(row.workout_minutes or 0),
            }
            for row in week_rows
        ],
        "weight_series": [
            {"date": item.measured_on, "weight_kg": float(item.weight_kg)} for item in weight_series
        ],
        "disclaimer": DISCLAIMER,
    }
