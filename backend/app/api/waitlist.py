from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.db import get_session
from app.models import (
    WaitlistSignup,
    WaitlistSignupCreate,
    WaitlistSignupResponse,
    WaitlistStatsResponse,
)

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("/", response_model=WaitlistSignupResponse, status_code=201)
async def create_waitlist_signup(
    signup: WaitlistSignupCreate,
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new waitlist signup.

    Returns 400 if email already exists.
    """
    # Check if email already exists
    result = await session.execute(
        select(WaitlistSignup).where(WaitlistSignup.email == signup.email)
    )
    existing_signup = result.scalar_one_or_none()

    if existing_signup:
        raise HTTPException(
            status_code=400,
            detail="Email already registered on waitlist"
        )

    # Create new signup
    db_signup = WaitlistSignup.model_validate(signup)
    session.add(db_signup)
    await session.commit()
    await session.refresh(db_signup)

    return db_signup


@router.get("/stats", response_model=WaitlistStatsResponse)
async def get_waitlist_stats(
    session: AsyncSession = Depends(get_session),
):
    """Get waitlist statistics (total signups and recent signups)"""

    # Get total signups
    total_result = await session.execute(
        select(func.count(WaitlistSignup.id))
    )
    total_signups = total_result.scalar() or 0

    # Get signups in last 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    recent_24h_result = await session.execute(
        select(func.count(WaitlistSignup.id)).where(
            WaitlistSignup.created_at >= twenty_four_hours_ago
        )
    )
    recent_signups_24h = recent_24h_result.scalar() or 0

    # Get signups in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_7d_result = await session.execute(
        select(func.count(WaitlistSignup.id)).where(
            WaitlistSignup.created_at >= seven_days_ago
        )
    )
    recent_signups_7d = recent_7d_result.scalar() or 0

    return WaitlistStatsResponse(
        total_signups=total_signups,
        recent_signups_24h=recent_signups_24h,
        recent_signups_7d=recent_signups_7d,
    )


@router.get("/", response_model=list[WaitlistSignupResponse])
async def list_waitlist_signups(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    """
    List all waitlist signups (admin endpoint).

    This endpoint should be protected with authentication in production.
    """
    result = await session.execute(
        select(WaitlistSignup)
        .order_by(WaitlistSignup.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    signups = result.scalars().all()
    return signups
