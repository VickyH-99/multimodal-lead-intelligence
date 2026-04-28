"""Schemas for lead inputs, responses, and decision views."""

from __future__ import annotations

from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.schemas.common import BehaviorEventInput, TimestampedModel


class LeadScoreRequest(BaseModel):
    """Payload for creating or rescoring a lead from multimodal inputs."""

    lead_id: int | None = None
    full_name: str
    company_name: str
    email: str
    phone: str
    title: str
    industry: str
    region: str
    source_channel: str
    lifecycle_stage: str
    current_status: str = "open"
    annual_revenue_band: str
    employee_count: int = Field(ge=1)
    budget_estimate: float = Field(ge=0.0)
    engagement_score: float = Field(ge=0.0, le=1.0)
    product_fit_score: float = Field(ge=0.0, le=1.0)
    website_visits: int = Field(ge=0)
    email_open_rate: float = Field(ge=0.0, le=1.0)
    crm_notes: str
    call_transcript: str
    speaking_speed: float = Field(ge=0.0)
    average_pause_duration: float = Field(ge=0.0)
    voice_sentiment_score: float = Field(ge=-1.0, le=1.0)
    hesitation_score: float = Field(ge=0.0, le=1.0)
    historical_outcome: str | None = None
    behavior_events: list[BehaviorEventInput]
    metadata_json: dict = Field(default_factory=dict)


class FeatureContribution(BaseModel):
    """SHAP-style feature contribution summary for decision explainability."""

    feature_name: str
    contribution: float
    direction: str
    explanation: str


class AgentSignal(BaseModel):
    """Normalized per-agent telemetry and reasoning summary for the UI."""

    model_config = ConfigDict(populate_by_name=True)

    agent_name: str
    input_signals: dict = Field(
        default_factory=dict,
        validation_alias=AliasChoices("input_signals", "input_preview"),
    )
    reasoning_summary: str = Field(
        validation_alias=AliasChoices("reasoning_summary", "summary")
    )
    confidence: float = Field(ge=0.0, le=1.0)
    contribution: float = Field(
        ge=-1.0,
        le=1.0,
        validation_alias=AliasChoices("contribution", "score_impact"),
    )
    risk_flags: list[str] = Field(default_factory=list)
    action_implication: str = ""
    latency_ms: float = Field(default=0.0, ge=0.0)
    output_signals: dict = Field(
        default_factory=dict,
        validation_alias=AliasChoices("output_signals", "output_preview"),
    )


class ReasoningTraceStep(AgentSignal):
    """Step-by-step audit-trail record for one agent in the supervisor flow."""


class SimilarCaseSummary(BaseModel):
    """UI-facing similar case summary."""

    lead_id: int
    company_name: str
    industry: str
    score_band: str
    outcome: str
    recommended_action: str
    similarity_score: float
    summary: str


class DecisionPackage(TimestampedModel):
    """Final supervisor decision payload returned by the scoring endpoint."""

    lead_id: int
    base_score: float
    multimodal_score: float
    score_band: str
    confidence: float
    agent_signals: list[AgentSignal]
    reasoning_trace: list[AgentSignal]
    feature_contributions: list[FeatureContribution]
    recommended_action: str
    recommended_time_window: str
    explanation: str
    risk_flags: list[str]
    governance_notes: list[str]
    similar_cases: list[SimilarCaseSummary]
    top_feature_reasons: list[str]
    feedback_required: bool
    created_at: datetime


class LeadListItem(TimestampedModel):
    """Compact lead row for workbench and tables."""

    id: int
    full_name: str
    company_name: str
    industry: str
    source_channel: str
    current_status: str
    historical_outcome: str | None
    latest_score_band: str | None
    latest_multimodal_score: float | None
    latest_action: str | None
    latest_confidence: float | None
    created_at: datetime
    updated_at: datetime


class LeadProfile(TimestampedModel):
    """Full persisted lead profile."""

    id: int
    full_name: str
    company_name: str
    email: str
    phone: str
    title: str
    industry: str
    region: str
    source_channel: str
    lifecycle_stage: str
    current_status: str
    annual_revenue_band: str
    employee_count: int
    budget_estimate: float
    engagement_score: float
    product_fit_score: float
    website_visits: int
    email_open_rate: float
    crm_notes: str
    call_transcript: str
    speaking_speed: float
    average_pause_duration: float
    voice_sentiment_score: float
    hesitation_score: float
    historical_outcome: str | None
    metadata_json: dict
    created_at: datetime
    updated_at: datetime


class LeadDetailResponse(BaseModel):
    """Detailed lead profile with latest decision, event timeline, and feedback."""

    profile: LeadProfile
    decision: DecisionPackage | None
    behavior_events: list[BehaviorEventInput]
    feedback_history: list[dict]
