"""Strategy recommendation agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import StrategyInput, StrategyOutput
from app.utils.scoring import clamp


class StrategyAgent(BaseAgent[StrategyInput, StrategyOutput]):
    """Recommend the next best commercial action from aggregated multimodal signals."""

    name = "StrategyAgent"
    description = "Routes leads to the best next action across human and AI motions."

    def run(self, payload: StrategyInput) -> StrategyOutput:
        """Select the next best action and time window for the lead."""

        action = "nurture pool"
        time_window = "within 5 business days"

        if "contact_opt_out" in payload.risk_flags:
            action = "do-not-contact review"
            time_window = "same day compliance review"
        elif payload.score_band == "S" or (
            payload.multimodal_score >= payload.thresholds.a
            and payload.text_intent.urgency_level == "high"
            and payload.text_intent.buying_intent in {"decision-ready", "active-evaluation"}
        ):
            action = "senior human call"
            time_window = "within 2 business hours"
        elif payload.score_band in {"S", "A"}:
            action = "normal human call"
            time_window = "same business day"
        elif payload.score_band == "B":
            action = (
                "normal human call"
                if payload.text_intent.competitor_mention or payload.text_intent.price_sensitivity == "high"
                else "AI outbound call"
            )
            time_window = "within 24 hours"
        elif payload.score_band == "C":
            action = "delayed follow-up"
            time_window = "within 72 hours"

        if payload.behavior_sequence.engagement_momentum == "fragile" and action == "AI outbound call":
            action = "delayed follow-up"
            time_window = "within 48 hours"

        rationale = (
            f"Band {payload.score_band} lead with {payload.text_intent.urgency_level} urgency and "
            f"{payload.behavior_sequence.engagement_momentum} momentum is best handled through {action.lower()}."
        )
        confidence = clamp(
            (
                payload.text_intent.confidence
                + payload.voice_emotion.confidence
                + payload.behavior_sequence.confidence
            )
            / 3.0,
            0.7,
            0.95,
        )
        return StrategyOutput(
            recommended_action=action,
            recommended_time_window=time_window,
            action_rationale=rationale,
            confidence=round(confidence, 4),
        )

