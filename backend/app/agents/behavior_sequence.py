"""Behavior sequence agent implementation."""

from __future__ import annotations

from datetime import UTC, datetime

from app.agents.base import BaseAgent
from app.schemas.agent import BehaviorSequenceInput, BehaviorSequenceOutput
from app.utils.scoring import clamp


class BehaviorSequenceAgent(BaseAgent[BehaviorSequenceInput, BehaviorSequenceOutput]):
    """Score momentum from the observed lead engagement and sales-process sequence."""

    name = "BehaviorSequenceAgent"
    description = "Analyzes event history to estimate engagement momentum and operational risk."

    def run(self, payload: BehaviorSequenceInput) -> BehaviorSequenceOutput:
        """Interpret lead event sequences into momentum and risk signals."""

        weights = {
            "lead_created": 0.02,
            "email_opened": 0.03,
            "call_attempted": 0.01,
            "call_connected": 0.12,
            "appointment_booked": 0.2,
            "proposal_requested": 0.18,
            "demo_attended": 0.16,
            "no_show": -0.17,
            "reactivated": 0.08,
            "unsubscribe": -0.28,
        }
        score = 0.42
        risk_flags: list[str] = []
        sorted_events = sorted(payload.events, key=lambda event: event.occurred_at)
        for event in sorted_events:
            score += weights.get(event.event_type, 0.0)
        if any(event.event_type == "no_show" for event in sorted_events):
            risk_flags.append("no_show_pattern")
        if any(event.event_type == "unsubscribe" for event in sorted_events):
            risk_flags.append("contact_opt_out")
        if len([event for event in sorted_events if event.event_type == "call_attempted"]) >= 3 and not any(
            event.event_type == "call_connected" for event in sorted_events
        ):
            risk_flags.append("unresponsive_sequence")

        if sorted_events:
            current_time = datetime.now(UTC).replace(tzinfo=None)
            days_since_last = max((current_time - sorted_events[-1].occurred_at).days, 0)
            score += 0.06 if days_since_last <= 3 else 0.02 if days_since_last <= 7 else -0.05
        sequence_score = clamp(score)
        engagement_momentum = (
            "accelerating"
            if sequence_score >= 0.72
            else "stable"
            if sequence_score >= 0.52
            else "fragile"
        )
        sequence_summary = (
            f"Behavior sequence is {engagement_momentum}; the timeline contains {len(sorted_events)} tracked events "
            f"with {'positive forward motion' if sequence_score >= 0.6 else 'visible friction'}."
        )
        confidence = clamp(0.71 + min(len(sorted_events), 6) * 0.03, 0.73, 0.95)
        return BehaviorSequenceOutput(
            engagement_momentum=engagement_momentum,
            sequence_score=round(sequence_score, 4),
            sequence_summary=sequence_summary,
            risk_flags=risk_flags,
            confidence=round(confidence, 4),
        )
