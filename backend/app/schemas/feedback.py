"""Schemas for feedback ingestion and learning responses."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.agent import FeedbackSuggestion


class FeedbackRequest(BaseModel):
    """Outcome feedback payload submitted after lead handling."""

    outcome: str
    reason: str
    conversion_value: float | None = Field(default=None, ge=0.0)
    salesperson_feedback: str | None = None


class FeedbackRecord(BaseModel):
    """Persisted feedback entry."""

    id: int
    lead_id: int
    outcome: str
    reason: str
    conversion_value: float | None
    observed_action: str | None
    observed_band: str | None
    salesperson_feedback: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackResponse(BaseModel):
    """Feedback submission result with updated learning suggestions."""

    feedback: FeedbackRecord
    drift_warnings: list[str]
    threshold_change_suggestions: list[FeedbackSuggestion]
    retraining_candidates: list[int]

