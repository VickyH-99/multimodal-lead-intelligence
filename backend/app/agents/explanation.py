"""Explanation agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import ExplanationInput, ExplanationOutput
from app.utils.scoring import clamp


class ExplanationAgent(BaseAgent[ExplanationInput, ExplanationOutput]):
    """Translate multi-agent outputs into concise business-language recommendations."""

    name = "ExplanationAgent"
    description = "Generates a human-readable narrative for why a lead received a strategy."

    def run(self, payload: ExplanationInput) -> ExplanationOutput:
        """Produce an executive-friendly explanation of the decision package."""

        explanation = (
            f"{payload.company_name} landed in band {payload.score_band} with a multimodal score of "
            f"{payload.multimodal_score:.2f}. Structured signals were led by "
            f"{payload.structured_output.top_feature_reasons[0].lower()} "
            f"while text analysis identified {payload.text_output.buying_intent.replace('-', ' ')} intent and "
            f"{payload.text_output.urgency_level} urgency. Voice and behavior signals point to "
            f"{payload.voice_output.emotional_temperature} buyer confidence and "
            f"{payload.behavior_output.engagement_momentum} momentum. Based on similar historical cases, "
            f"the recommended next action is {payload.strategy_output.recommended_action.lower()} "
            f"{payload.strategy_output.recommended_time_window.lower()}."
        )
        confidence = clamp(
            (
                payload.structured_output.confidence
                + payload.text_output.confidence
                + payload.voice_output.confidence
                + payload.behavior_output.confidence
                + payload.similar_case_output.confidence
            )
            / 5.0,
            0.72,
            0.96,
        )
        return ExplanationOutput(explanation=explanation, confidence=round(confidence, 4))

