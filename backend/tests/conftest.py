"""Shared pytest fixtures.

Creates the ORM schema once per test session so tests that touch the database
run against real tables. The engine URL comes from ``FITDATA_DATABASE_URL``;
point it at a scratch SQLite file (the default below) to keep runs isolated.
"""

import asyncio
import os

import pytest

os.environ.setdefault("FITDATA_DATABASE_URL", "sqlite+aiosqlite:///./fitdata_pytest.db")
os.environ.setdefault("FITDATA_JWT_SECRET", "test-secret-at-least-16-characters")


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    from app.database import Base, engine
    from app import models  # noqa: F401  (registers the mapped classes)

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def teardown() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(setup())
    yield
    asyncio.run(teardown())
