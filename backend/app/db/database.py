from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel, select
from sqlalchemy.orm import sessionmaker
import os
from typing import AsyncGenerator

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost:5433/appdb"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with async_session() as session:
        yield session


async def init_db():
    """Initialize database tables

    Note: For production, use Alembic migrations instead:
        alembic upgrade head

    This function uses SQLModel.metadata.create_all which is convenient
    for development but doesn't handle migrations properly.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()
