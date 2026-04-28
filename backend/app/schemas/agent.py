"""Input and output schemas for each agent in the orchestration graph."""

from pydantic import BaseModel, Field

from app.schemas.common import BehaviorEventInput, ScoreBandThresholds


class StructuredLeadFeatures(BaseModel):
    """Structured feature payload for the base scoring model."""

    employee_count: int
    budget_estimate: float
    engagement_score: float
    product_fit_score: float
    website_visits: int
    email_open_rate: float
    source_channel: str
    lifecycle_stage: str
    industry: str


class StructuredScoringOutput(BaseModel):
    """Structured scoring result returned by the model wrapper."""

    base_score: float = Field(ge=0.0, le=1.0)
    score_band: str
    top_feature_reasons: list[str]
    feature_contributions: dict[str, float]
    confidence: float = Field(ge=0.0, le=1.0)


class TextIntentInput(BaseModel):
    """Text payload for CRM note and transcript intent analysis."""

    crm_notes: str
    call_transcript: str


class TextIntentOutput(BaseModel):
    """Text intent and objection analysis results."""

    buying_intent: str
    objections: list[str]
    urgency_level: str
    competitor_mention: bool
    price_sensitivity: str
    signal_score: float = Field(ge=0.0, le=1.0)
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)


class VoiceEmotionInput(BaseModel):
    """Voice-derived feature payload."""

    speaking_speed: float
    average_pause_duration: float
    voice_sentiment_score: float
    hesitation_score: float


class VoiceEmotionOutput(BaseModel):
    """Voice-derived emotional intent output."""

    voice_intent_score: float = Field(ge=0.0, le=1.0)
    emotional_temperature: str
    escalation_risk: str
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)


class BehaviorSequenceInput(BaseModel):
    """Behavior sequence payload for event-flow analysis."""

    events: list[BehaviorEventInput]


class BehaviorSequenceOutput(BaseModel):
    """Behavior sequence interpretation output."""

    engagement_momentum: str
    sequence_score: float = Field(ge=0.0, le=1.0)
    sequence_summary: str
    risk_flags: list[str]
    confidence: float = Field(ge=0.0, le=1.0)


class SimilarCaseItem(BaseModel):
    """Representative historical case surfaced by similarity matching."""

    lead_id: int
    company_name: str
    industry: str
    score_band: str
    outcome: str
    recommended_action: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    summary: str


class SimilarCaseOutput(BaseModel):
    """Similar case retrieval summary."""

    cases: list[SimilarCaseItem]
    pattern_summary: str
    signal_score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)


class StrategyInput(BaseModel):
    """Aggregated agent outputs used for action recommendation."""

    lead_id: int
    base_score: float
    multimodal_score: float
    score_band: str
    text_intent: TextIntentOutput
    voice_emotion: VoiceEmotionOutput
    behavior_sequence: BehaviorSequenceOutput
    risk_flags: list[str]
    thresholds: ScoreBandThresholds


class StrategyOutput(BaseModel):
    """Action recommendation produced by the strategy agent."""

    recommended_action: str
    recommended_time_window: str
    action_rationale: str
    confidence: float = Field(ge=0.0, le=1.0)


class ExplanationInput(BaseModel):
    """Inputs required to produce a business-readable explanation."""

    company_name: str
    score_band: str
    structured_output: StructuredScoringOutput
    text_output: TextIntentOutput
    voice_output: VoiceEmotionOutput
    behavior_output: BehaviorSequenceOutput
    similar_case_output: SimilarCaseOutput
    strategy_output: StrategyOutput
    multimodal_score: float


class ExplanationOutput(BaseModel):
    """Human-readable explanation output."""

    explanation: str
    confidence: float = Field(ge=0.0, le=1.0)


class FeedbackLearningInput(BaseModel):
    """Historical decision and outcome payload for feedback analysis."""

    high_score_non_converted: int
    low_score_converted: int
    total_feedback_records: int
    action_conversion_rates: dict[str, float]
    score_band_conversion_rates: dict[str, float]


class FeedbackSuggestion(BaseModel):
    """Single feedback-learning recommendation."""

    title: str
    description: str
    impact: str


class FeedbackLearningOutput(BaseModel):
    """Aggregate feedback-learning output."""

    drift_warnings: list[str]
    threshold_change_suggestions: list[FeedbackSuggestion]
    retraining_candidates: list[int]
    confidence: float = Field(ge=0.0, le=1.0)

