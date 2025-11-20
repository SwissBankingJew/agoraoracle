from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class WaitlistSignupBase(SQLModel):
    """Base waitlist signup model with common fields"""
    email: str = Field(unique=True, index=True, max_length=255)
    source: Optional[str] = Field(default="landing_page", max_length=50)

    # Game statistics fields (optional - only populated if user played the game)
    game_played: Optional[bool] = Field(default=False)
    final_bankroll: Optional[float] = Field(default=None)  # Final virtual balance
    total_bets: Optional[int] = Field(default=None)  # Number of predictions made
    win_rate: Optional[float] = Field(default=None)  # Percentage of correct predictions (0-100)


class WaitlistSignup(WaitlistSignupBase, table=True):
    """Waitlist signup model for database"""
    __tablename__ = "waitlist_signups"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WaitlistSignupCreate(WaitlistSignupBase):
    """Waitlist signup creation request schema"""
    pass


class WaitlistSignupResponse(WaitlistSignupBase):
    """Waitlist signup response schema"""
    id: int
    created_at: datetime


class WaitlistStatsResponse(SQLModel):
    """Waitlist statistics response schema"""
    total_signups: int
    recent_signups_24h: int
    recent_signups_7d: int
