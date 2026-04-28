"""Feedback learning agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import FeedbackLearningInput, FeedbackLearningOutput, FeedbackSuggestion
from app.utils.scoring import clamp


class FeedbackLearningAgent(BaseAgent[FeedbackLearningInput, FeedbackLearningOutput]):
    """Analyze outcome feedback and surface threshold or strategy drift signals."""

    name = "FeedbackLearningAgent"
    description = "Transforms closed-loop outcomes into threshold and routing suggestions."

    def run(self, payload: FeedbackLearningInput) -> FeedbackLearningOutput:
        """Generate drift warnings and improvement suggestions from feedback patterns."""

        drift_warnings: list[str] = []
        suggestions: list[FeedbackSuggestion] = []

        if payload.high_score_non_converted >= 3:
            drift_warnings.append("False positives are accumulating in high-priority score bands.")
            suggestions.append(
                FeedbackSuggestion(
                    title="Tighten A-band routing",
                    description="Raise the A-band threshold or add a text-objection gate before assigning human priority.",
                    impact="Reduces expensive human-call volume on over-scored leads.",
                )
            )
        if payload.low_score_converted >= 2:
            drift_warnings.append("Low-scoring leads are converting, suggesting hidden upside in some segments.")
            suggestions.append(
                FeedbackSuggestion(
                    title="Expand B-band catchment",
                    description="Review low-score winners for common source or industry patterns and widen the B-band for those cohorts.",
                    impact="Captures undervalued leads that the base model is missing.",
                )
            )
        if payload.action_conversion_rates.get("AI outbound call", 0.0) > payload.action_conversion_rates.get("normal human call", 0.0):
            suggestions.append(
                FeedbackSuggestion(
                    title="Promote AI-first mid-band coverage",
                    description="AI outbound call is outperforming normal human call in observed conversions for some mid-tier leads.",
                    impact="Improves capacity efficiency without reducing expected conversions.",
                )
            )
        if not suggestions:
            suggestions.append(
                FeedbackSuggestion(
                    title="Hold current thresholds",
                    description="Current feedback patterns are stable; continue monitoring for additional drift signals.",
                    impact="Maintains strategy continuity while more feedback accrues.",
                )
            )

        retraining_candidates = []
        if payload.high_score_non_converted > 0:
            retraining_candidates.extend(range(1000, 1000 + min(payload.high_score_non_converted, 5)))
        if payload.low_score_converted > 0:
            retraining_candidates.extend(range(2000, 2000 + min(payload.low_score_converted, 5)))

        confidence = clamp(0.74 + min(payload.total_feedback_records, 10) * 0.02, 0.74, 0.95)
        return FeedbackLearningOutput(
            drift_warnings=drift_warnings,
            threshold_change_suggestions=suggestions,
            retraining_candidates=retraining_candidates,
            confidence=round(confidence, 4),
        )

