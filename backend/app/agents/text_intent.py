"""Text intent agent implementation."""

from __future__ import annotations

from app.agents.base import BaseAgent
from app.schemas.agent import TextIntentInput, TextIntentOutput
from app.utils.scoring import clamp


class TextIntentAgent(BaseAgent[TextIntentInput, TextIntentOutput]):
    """Extract buying intent, urgency, objections, and commercial signals from text."""

    name = "TextIntentAgent"
    description = "Reads CRM notes and call transcripts to surface intent and objections."

    def run(self, payload: TextIntentInput) -> TextIntentOutput:
        """Analyze unstructured sales text with deterministic intent heuristics."""

        combined = f"{payload.crm_notes} {payload.call_transcript}".lower()
        competitor_mention = any(word in combined for word in ["salesforce", "hubspot", "zendesk", "competitor", "vendor"])
        urgency_level = (
            "high"
            if any(word in combined for word in ["asap", "urgent", "this week", "this month", "quarter end", "signed off"])
            else "medium"
            if any(word in combined for word in ["next month", "soon", "follow up", "revisit"])
            else "low"
        )
        price_sensitivity = (
            "high"
            if any(word in combined for word in ["discount", "budget freeze", "too expensive", "cost concern", "price"])
            else "medium"
            if any(word in combined for word in ["roi", "pricing", "cost"])
            else "low"
        )
        buying_intent = (
            "decision-ready"
            if any(word in combined for word in ["procurement", "security review", "ready to move", "contract", "pilot next month"])
            else "active-evaluation"
            if any(word in combined for word in ["demo", "compare", "evaluation", "trial", "stakeholders"])
            else "early-discovery"
            if any(word in combined for word in ["research", "learning", "exploring"])
            else "nurture"
        )

        objection_map = {
            "integration": ["integration", "api", "implementation"],
            "security": ["security", "compliance", "legal review"],
            "pricing": ["price", "cost", "discount", "budget"],
            "timing": ["next quarter", "later", "not now"],
            "change management": ["adoption", "training", "change management"],
        }
        objections = [
            objection
            for objection, phrases in objection_map.items()
            if any(phrase in combined for phrase in phrases)
        ]

        score = 0.44
        score += 0.22 if buying_intent == "decision-ready" else 0.14 if buying_intent == "active-evaluation" else 0.06
        score += 0.1 if urgency_level == "high" else 0.04 if urgency_level == "medium" else 0.0
        score -= 0.06 if price_sensitivity == "high" else 0.02 if price_sensitivity == "medium" else 0.0
        score -= min(0.08, len(objections) * 0.02)
        score += 0.03 if competitor_mention else 0.0
        signal_score = clamp(score)
        confidence = clamp(0.76 + (0.03 * min(3, len(objections))) + (0.04 if len(combined) > 180 else 0.0), 0.72, 0.94)
        summary = (
            f"Text signals show {buying_intent.replace('-', ' ')} intent with {urgency_level} urgency, "
            f"{price_sensitivity} price sensitivity, and {len(objections)} notable objections."
        )
        return TextIntentOutput(
            buying_intent=buying_intent,
            objections=objections,
            urgency_level=urgency_level,
            competitor_mention=competitor_mention,
            price_sensitivity=price_sensitivity,
            signal_score=round(signal_score, 4),
            summary=summary,
            confidence=round(confidence, 4),
        )

