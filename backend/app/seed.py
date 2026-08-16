"""Idempotently seed the synthetic local demo account and its activity history.

All values are generated deterministically from a fixed seed. No real personal
or health data is used anywhere in this project.
"""

import asyncio
import os
import random
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import SessionLocal
from app.models import DailyActivity, Profile, User, WeightMeasurement
from app.services.security import hash_password


async def seed() -> None:
    email = os.getenv("DEMO_EMAIL", "demo@fitdata-coach.de").lower()
    password = os.getenv("DEMO_PASSWORD", "FitData-Demo-2026!")
    async with SessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == email))
        if user:
            return
        user = User(email=email, display_name="Leonie M.", password_hash=hash_password(password))
        session.add(user)
        await session.flush()
        session.add(
            Profile(
                user_id=user.id,
                age=32,
                sex="weiblich",
                height_cm=180,
                weight_kg=77.2,
                experience="fortgeschritten",
                goal="muskelaufbau",
                available_days=["mo", "mi", "fr", "so"],
                daily_steps=8500,
                equipment=["fitnessstudio"],
                session_duration_min=50,
                stride_length_cm=74,
            )
        )
        await _seed_history(session, user.id)
        await session.commit()


async def _seed_history(session, user_id, days: int = 84) -> None:
    """Generate deterministic activity and weight history ending today.

    Two days are intentionally left at zero steps so the data-quality pipeline
    has genuine findings to report instead of a permanently clean run.
    """
    rng = random.Random(20260816)
    today = date.today()
    weight = 79.8

    for offset in range(days, -1, -1):
        day = today - timedelta(days=offset)
        weekday = day.weekday()

        # Two deliberate gaps in the recent window (missing tracker sync).
        if offset in (3, 9):
            steps = 0
            distance = Decimal("0")
            calories = Decimal("0")
            workout_minutes = 0
        else:
            base = 9200 if weekday < 5 else 12000
            steps = max(int(rng.gauss(base, 2100)), 1500)
            distance = Decimal(str(round(steps * 74 / 100000, 3)))
            workout_minutes = 50 if weekday in (0, 2, 4, 6) and rng.random() > 0.18 else 0
            calories = Decimal(str(round(steps * 0.041 + workout_minutes * 7.4, 2)))

        session.add(DailyActivity(
            user_id=user_id, activity_date=day, steps=steps,
            distance_km=distance, active_calories_kcal=calories, workout_minutes=workout_minutes,
        ))

        # Weekly weigh-in with a gentle downward trend.
        if offset % 7 == 0:
            weight = round(weight - rng.uniform(0.12, 0.38), 2)
            session.add(WeightMeasurement(
                user_id=user_id, measured_on=day, weight_kg=Decimal(str(weight)), source="waage",
            ))


if __name__ == "__main__":
    asyncio.run(seed())
