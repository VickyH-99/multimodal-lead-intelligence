"""Schemas for executive dashboard and strategy performance views."""

from pydantic import BaseModel

from app.schemas.agent import FeedbackSuggestion


class MetricValue(BaseModel):
    """Simple value and delta metric used on the dashboard."""

    value: float
    delta: float | None = None


class BandDistributionItem(BaseModel):
    """Distribution of leads in a score band."""

    band: str
    count: int
    conversion_rate: float


class ActionBreakdownItem(BaseModel):
    """Breakdown of recommended actions."""

    action: str
    count: int
    avg_conversion_rate: float


class ConfidenceSummary(BaseModel):
    """Confidence overview for model and agents."""

    average_confidence: float
    high_confidence_share: float
    low_confidence_share: float


class FeedbackLoopStatus(BaseModel):
    """Feedback system health and recommendation summary."""

    total_feedback_records: int
    high_score_non_converted: int
    low_score_converted: int
    drift_warnings: list[str]
    threshold_change_suggestions: list[FeedbackSuggestion]


class DashboardSummaryResponse(BaseModel):
    """Executive dashboard payload."""

    total_leads_scored: int
    open_leads: int
    converted_leads: int
    score_distribution: list[BandDistributionItem]
    action_breakdown: list[ActionBreakdownItem]
    confidence_summary: ConfidenceSummary
    feedback_loop_status: FeedbackLoopStatus


class AgentStatusItem(BaseModel):
    """Health and telemetry snapshot for one agent."""

    agent_name: str
    status: str
    description: str
    avg_latency_ms: float
    avg_confidence: float
    last_output_preview: dict
    last_reasoning_summary: str = ""
    last_action_implication: str = ""


class AgentStatusResponse(BaseModel):
    """Aggregated agent health payload."""

    supervisor_status: str
    agents: list[AgentStatusItem]


class StrategyPerformanceItem(BaseModel):
    """Performance summary for one action strategy."""

    action: str
    recommendation_count: int
    converted_count: int
    conversion_rate: float


class LeadInsightSummary(BaseModel):
    """Compact lead-learning summary used in feedback and drift analysis."""

    lead_id: int
    company_name: str
    full_name: str
    current_status: str
    score_band: str
    multimodal_score: float
    note: str


class RetrainingCandidateSample(BaseModel):
    """One retraining candidate with a suggested labeling action."""

    lead_id: int
    company_name: str
    reason: str
    recommended_label: str


class StrategyPerformanceResponse(BaseModel):
    """Strategy performance and feedback-learning analytics."""

    action_performance: list[StrategyPerformanceItem]
    score_band_performance: list[BandDistributionItem]
    drift_warnings: list[str]
    threshold_change_suggestions: list[FeedbackSuggestion]
    retraining_candidates: list[int]
    high_score_non_converted_leads: list[int]
    low_score_converted_leads: list[int]
    executive_summary: str
    learned_patterns: list[str]
    governance_notes: list[str]
    high_score_non_converted_details: list[LeadInsightSummary]
    low_score_converted_details: list[LeadInsightSummary]
    retraining_candidate_samples: list[RetrainingCandidateSample]
