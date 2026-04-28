"""Voice emotion agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import VoiceEmotionInput, VoiceEmotionOutput
from app.utils.scoring import clamp


class VoiceEmotionAgent(BaseAgent[VoiceEmotionInput, VoiceEmotionOutput]):
    """Interpret voice-derived cadence and sentiment features to infer confidence."""

    name = "VoiceEmotionAgent"
    description = "Assesses emotional confidence and escalation risk from voice features."

    def run(self, payload: VoiceEmotionInput) -> VoiceEmotionOutput:
        """Score voice intent using pace, pauses, sentiment, and hesitation signals."""

        cadence_score = 1.0 - min(abs(payload.speaking_speed - 145.0) / 110.0, 1.0)
        pause_score = 1.0 - min(payload.average_pause_duration / 3.2, 1.0)
        sentiment_score = (payload.voice_sentiment_score + 1.0) / 2.0
        hesitation_penalty = payload.hesitation_score
        voice_intent_score = clamp(
            (cadence_score * 0.28)
            + (pause_score * 0.18)
            + (sentiment_score * 0.38)
            + ((1.0 - hesitation_penalty) * 0.16)
        )
        emotional_temperature = (
            "confident"
            if voice_intent_score >= 0.72
            else "measured"
            if voice_intent_score >= 0.52
            else "guarded"
        )
        escalation_risk = (
            "high"
            if sentiment_score < 0.35 or hesitation_penalty > 0.65
            else "medium"
            if sentiment_score < 0.55 or hesitation_penalty > 0.4
            else "low"
        )
        summary = (
            f"Voice pattern feels {emotional_temperature} with {escalation_risk} escalation risk; "
            f"cadence and hesitation suggest {'buyer confidence' if voice_intent_score >= 0.65 else 'decision friction'}."
        )
        confidence = clamp(0.74 + abs(sentiment_score - 0.5) * 0.16 + (0.04 if payload.speaking_speed > 0 else 0.0), 0.71, 0.93)
        return VoiceEmotionOutput(
            voice_intent_score=round(voice_intent_score, 4),
            emotional_temperature=emotional_temperature,
            escalation_risk=escalation_risk,
            summary=summary,
            confidence=round(confidence, 4),
        )

