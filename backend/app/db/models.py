"""ORM models for leads, behavior events, scoring decisions, and feedback."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    """Return a naive UTC datetime for SQLite-friendly persistence."""

    return datetime.now(UTC).replace(tzinfo=None)


class Lead(Base):
    """Persisted lead profile with multimodal inputs and latest score snapshot."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    company_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(120))
    industry: Mapped[str] = mapped_column(String(80))
    region: Mapped[str] = mapped_column(String(80))
    source_channel: Mapped[str] = mapped_column(String(80))
    lifecycle_stage: Mapped[str] = mapped_column(String(80))
    current_status: Mapped[str] = mapped_column(String(40), default="open")
    annual_revenue_band: Mapped[str] = mapped_column(String(80))
    employee_count: Mapped[int] = mapped_column(Integer)
    budget_estimate: Mapped[float] = mapped_column(Float)
    engagement_score: Mapped[float] = mapped_column(Float)
    product_fit_score: Mapped[float] = mapped_column(Float)
    website_visits: Mapped[int] = mapped_column(Integer)
    email_open_rate: Mapped[float] = mapped_column(Float)
    crm_notes: Mapped[str] = mapped_column(Text)
    call_transcript: Mapped[str] = mapped_column(Text)
    speaking_speed: Mapped[float] = mapped_column(Float)
    average_pause_duration: Mapped[float] = mapped_column(Float)
    voice_sentiment_score: Mapped[float] = mapped_column(Float)
    hesitation_score: Mapped[float] = mapped_column(Float)
    historical_outcome: Mapped[str | None] = mapped_column(String(40), nullable=True)
    is_seeded: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    latest_base_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    latest_multimodal_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    latest_score_band: Mapped[str | None] = mapped_column(String(4), nullable=True)
    latest_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    latest_action: Mapped[str | None] = mapped_column(String(80), nullable=True)
    latest_time_window: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
    )
    last_scored_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    behavior_events: Mapped[list["BehaviorEvent"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="BehaviorEvent.occurred_at",
    )
    decisions: Mapped[list["ScoringDecision"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="desc(ScoringDecision.created_at)",
    )
    feedback_entries: Mapped[list["FeedbackOutcome"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="desc(FeedbackOutcome.created_at)",
    )


class BehaviorEvent(Base):
    """Discrete lead behavior or sales process event."""

    __tablename__ = "behavior_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(80))
    channel: Mapped[str] = mapped_column(String(40))
    notes: Mapped[str] = mapped_column(String(255))
    occurred_at: Mapped[datetime] = mapped_column(DateTime)

    lead: Mapped["Lead"] = relationship(back_populates="behavior_events")


class ScoringDecision(Base):
    """Stored decision package returned by the supervisor agent."""

    __tablename__ = "scoring_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"), index=True)
    base_score: Mapped[float] = mapped_column(Float)
    multimodal_score: Mapped[float] = mapped_column(Float)
    score_band: Mapped[str] = mapped_column(String(4))
    confidence: Mapped[float] = mapped_column(Float)
    recommended_action: Mapped[str] = mapped_column(String(80))
    recommended_time_window: Mapped[str] = mapped_column(String(80))
    explanation: Mapped[str] = mapped_column(Text)
    feedback_required: Mapped[bool] = mapped_column(Boolean, default=True)
    agent_signals: Mapped[list[dict]] = mapped_column(JSON, default=list)
    top_feature_reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    risk_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    similar_cases: Mapped[list[dict]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    lead: Mapped["Lead"] = relationship(back_populates="decisions")


class FeedbackOutcome(Base):
    """Observed outcome and operator feedback used for learning analysis."""

    __tablename__ = "feedback_outcomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"), index=True)
    outcome: Mapped[str] = mapped_column(String(40))
    reason: Mapped[str] = mapped_column(String(255))
    conversion_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    observed_action: Mapped[str | None] = mapped_column(String(80), nullable=True)
    observed_band: Mapped[str | None] = mapped_column(String(4), nullable=True)
    salesperson_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    lead: Mapped["Lead"] = relationship(back_populates="feedback_entries")
