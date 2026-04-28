"""Common schema types shared across API modules."""

from datetime import datetime

from pydantic import BaseModel, Field


class TimestampedModel(BaseModel):
    """Base response model with datetime serialization support."""

    model_config = {"from_attributes": True}


class ScoreBandThresholds(BaseModel):
    """Score cutoff configuration for decision bands."""

    s: float = Field(default=0.85, ge=0.0, le=1.0)
    a: float = Field(default=0.72, ge=0.0, le=1.0)
    b: float = Field(default=0.58, ge=0.0, le=1.0)
    c: float = Field(default=0.42, ge=0.0, le=1.0)


class BehaviorEventInput(BaseModel):
    """Lead behavior event input accepted from the API and seed data."""

    event_type: str
    channel: str
    notes: str
    occurred_at: datetime

