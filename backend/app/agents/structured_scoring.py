"""Structured scoring agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import StructuredLeadFeatures, StructuredScoringOutput
from app.schemas.common import ScoreBandThresholds
from app.services.ml_scoring_service import ModelScoringService
from app.utils.scoring import determine_score_band


class StructuredScoringAgent(BaseAgent[StructuredLeadFeatures, StructuredScoringOutput]):
    """Score leads from structured attributes and expose top drivers behind the score."""

    name = "StructuredScoringAgent"
    description = "Estimates base conversion probability from structured CRM and fit features."

    def __init__(self, model_service: ModelScoringService, thresholds: ScoreBandThresholds) -> None:
        self.model_service = model_service
        self.thresholds = thresholds

    def run(self, payload: StructuredLeadFeatures) -> StructuredScoringOutput:
        """Return structured score, band, and business-readable top feature reasons."""

        result = self.model_service.score(payload)
        score_band = determine_score_band(result.score, self.thresholds)
        top_features = sorted(
            result.feature_contributions.items(),
            key=lambda item: abs(item[1]),
            reverse=True,
        )[:3]
        reason_templates = {
            "budget_estimate": "Budget estimate supports a realistic buying motion.",
            "product_fit_score": "Product fit is strong for the target use case.",
            "engagement_score": "Recent engagement suggests active evaluation.",
            "website_visits": "Digital engagement volume is above average.",
            "email_open_rate": "Email engagement indicates message resonance.",
            "employee_count": "Company scale aligns with typical converting accounts.",
            "source_channel": "Lead source historically converts well.",
            "lifecycle_stage": "Lifecycle stage indicates the account is progressing.",
            "industry": "Industry alignment matches previous successful deals.",
        }
        reasons = [reason_templates.get(feature, f"{feature} contributed positively.") for feature, _ in top_features]
        return StructuredScoringOutput(
            base_score=result.score,
            score_band=score_band,
            top_feature_reasons=reasons,
            feature_contributions=result.feature_contributions,
            confidence=result.confidence,
        )

