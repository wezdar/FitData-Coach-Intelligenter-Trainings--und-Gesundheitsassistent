"""Create schema + seed the synthetic demo account for local development.

Docker Compose provisions PostgreSQL with ``db/init/*.sql``. This script is the
no-Docker equivalent: it creates the ORM-managed tables from ``app.models`` and
then runs the same idempotent seed. Intended for local development only.

Usage:
    FITDATA_DATABASE_URL="sqlite+aiosqlite:///./fitdata_dev.db" \
        python backend/scripts/dev_bootstrap.py
"""

import asyncio

from app.database import Base, engine
from app.seed import seed
from app import models  # noqa: F401  (import registers the mapped classes)


async def bootstrap() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await seed()
    await engine.dispose()
    print("Schema created and demo account seeded.")


if __name__ == "__main__":
    asyncio.run(bootstrap())
