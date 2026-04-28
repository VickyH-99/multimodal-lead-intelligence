"""Mock model-scoring service with a plug-compatible interface for future ML models."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.schemas.agent import StructuredLeadFeatures
from app.utils.scoring import clamp


@dataclass(slots=True)
class ModelScoreResult:
    """Output returned by the lead scoring model wrapper."""

    score: float
    feature_contributions: dict[str, float]
    confidence: float


class ModelScoringService(Protocol):
    """Protocol for structured lead scoring services."""

    def score(self, features: StructuredLeadFeatures) -> ModelScoreResult:
        """Return a score and feature attribution payload."""


class MockXGBoostScoringService:
    """Deterministic placeholder that mimics an explainable gradient boosting model."""

    def score(self, features: StructuredLeadFeatures) -> ModelScoreResult:
        """Score a lead using weighted, normalized business features."""

        normalized = {
            "budget_estimate": min(features.budget_estimate / 150000.0, 1.0),
            "product_fit_score": features.product_fit_score,
            "engagement_score": features.engagement_score,
            "website_visits": min(features.website_visits / 25.0, 1.0),
            "email_open_rate": features.email_open_rate,
            "employee_count": min(features.employee_count / 1500.0, 1.0),
        }
        source_boost = {
            "partner referral": 0.07,
            "webinar": 0.05,
            "organic": 0.045,
            "paid search": 0.03,
            "inbound demo": 0.08,
            "outbound sdr": 0.02,
        }.get(features.source_channel.lower(), 0.03)
        stage_boost = {
            "evaluation": 0.06,
            "proposal": 0.07,
            "demo completed": 0.08,
            "discovery": 0.04,
            "reactivated": 0.03,
        }.get(features.lifecycle_stage.lower(), 0.025)
        industry_boost = {
            "healthcare": 0.03,
            "financial services": 0.03,
            "manufacturing": 0.02,
            "saas": 0.04,
            "real estate": 0.01,
            "education": 0.02,
        }.get(features.industry.lower(), 0.02)
        weights = {
            "budget_estimate": 0.22,
            "product_fit_score": 0.24,
            "engagement_score": 0.18,
            "website_visits": 0.12,
            "email_open_rate": 0.10,
            "employee_count": 0.04,
        }
        contributions = {
            feature_name: round(value * weights[feature_name], 4)
            for feature_name, value in normalized.items()
        }
        contributions["source_channel"] = round(source_boost, 4)
        contributions["lifecycle_stage"] = round(stage_boost, 4)
        contributions["industry"] = round(industry_boost, 4)

        score = clamp(0.07 + sum(contributions.values()), 0.02, 0.98)
        confidence = clamp(
            0.72
            + (features.product_fit_score * 0.12)
            + (features.engagement_score * 0.08)
            + (min(features.website_visits / 20.0, 1.0) * 0.06),
            0.65,
            0.97,
        )
        return ModelScoreResult(
            score=round(score, 4),
            feature_contributions=contributions,
            confidence=round(confidence, 4),
        )

