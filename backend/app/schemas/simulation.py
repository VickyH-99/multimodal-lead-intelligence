"""Schemas for strategy simulation requests and responses."""

from pydantic import BaseModel, Field

from app.schemas.common import ScoreBandThresholds


class StrategyRuleSet(BaseModel):
    """Band-to-action routing configuration for strategy simulation."""

    s_band_action: str = "senior human call"
    a_band_action: str = "normal human call"
    b_band_action: str = "AI outbound call"
    c_band_action: str = "delayed follow-up"
    d_band_action: str = "nurture pool"


class SimulationRequest(BaseModel):
    """Simulation input for proposed thresholds and routing changes."""

    thresholds: ScoreBandThresholds = Field(default_factory=ScoreBandThresholds)
    action_rules: StrategyRuleSet = Field(default_factory=StrategyRuleSet)
    human_capacity_limit: int = Field(default=18, ge=1)
    ai_call_capacity_limit: int = Field(default=40, ge=1)


class SimulationMetricSet(BaseModel):
    """Aggregate simulation metrics."""

    expected_conversions: float
    human_calls: int
    ai_calls: int
    nurture_pool: int
    weighted_workload: float


class SimulationComparison(BaseModel):
    """Current versus proposed strategy metrics."""

    current: SimulationMetricSet
    proposed: SimulationMetricSet
    delta_expected_conversions: float
    delta_weighted_workload: float


class SimulationOperationalInsight(BaseModel):
    """High-level simulation output summary for policy decisions."""

    projected_conversions: float
    human_workload: int
    ai_call_workload: int
    expected_uplift: float
    conversion_delta: float
    workload_delta: float
    risk_warning: str
    recommended_threshold_adjustment: str


class ThresholdSensitivityItem(BaseModel):
    """One threshold sensitivity note used in policy explanation."""

    threshold: str
    current_value: float
    proposed_value: float
    directional_effect: str
    explanation: str


class StrategyScenarioSummary(BaseModel):
    """Summary snapshot for a current or proposed routing strategy."""

    label: str
    expected_conversions: float
    human_workload: int
    ai_call_workload: int
    weighted_workload: float
    routing_profile: str
    explanation: str


class SimulationResponse(BaseModel):
    """Strategy simulation response payload."""

    comparison: SimulationComparison
    proposed_thresholds: ScoreBandThresholds
    proposed_rules: StrategyRuleSet
    assumptions: list[str]
    operational_insight: SimulationOperationalInsight
    why_result: str
    conversion_uplift_explanation: str
    threshold_sensitivity_analysis: list[ThresholdSensitivityItem]
    recommended_next_policy: str
    export_summary: str
    current_strategy_summary: StrategyScenarioSummary
    proposed_strategy_summary: StrategyScenarioSummary
