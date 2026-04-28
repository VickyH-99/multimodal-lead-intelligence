"""Similar historical case retrieval agent."""

from __future__ import annotations

from collections.abc import Sequence

from app.agents.base import BaseAgent
from app.db.models import Lead
from app.schemas.agent import SimilarCaseItem, SimilarCaseOutput
from app.utils.scoring import clamp


class SimilarCaseAgent(BaseAgent[tuple[Lead, Sequence[Lead]], SimilarCaseOutput]):
    """Retrieve and summarize historical leads with similar commercial characteristics."""

    name = "SimilarCaseAgent"
    description = "Surfaces historical analogs to calibrate confidence and pattern matching."

    def run(self, payload: tuple[Lead, Sequence[Lead]]) -> SimilarCaseOutput:
        """Rank historical leads by lightweight business similarity."""

        target_lead, candidates = payload
        scored_cases: list[SimilarCaseItem] = []
        for candidate in candidates:
            if candidate.latest_multimodal_score is None:
                continue
            similarity = 0.28 if candidate.industry == target_lead.industry else 0.0
            similarity += 0.18 if candidate.source_channel == target_lead.source_channel else 0.0
            similarity += 0.16 if candidate.latest_score_band == target_lead.latest_score_band else 0.0
            similarity += 0.18 * (1.0 - min(abs(candidate.product_fit_score - target_lead.product_fit_score), 1.0))
            similarity += 0.12 * (1.0 - min(abs(candidate.engagement_score - target_lead.engagement_score), 1.0))
            similarity += 0.08 * (1.0 - min(abs(candidate.budget_estimate - target_lead.budget_estimate) / 150000.0, 1.0))
            similarity_score = clamp(similarity)
            decision = candidate.decisions[0] if candidate.decisions else None
            if decision is None:
                continue
            scored_cases.append(
                SimilarCaseItem(
                    lead_id=candidate.id,
                    company_name=candidate.company_name,
                    industry=candidate.industry,
                    score_band=decision.score_band,
                    outcome=candidate.historical_outcome or "open",
                    recommended_action=decision.recommended_action,
                    similarity_score=round(similarity_score, 4),
                    summary=(
                        f"{candidate.company_name} followed a {decision.recommended_action.lower()} path "
                        f"and ended as {candidate.historical_outcome or 'open'}."
                    ),
                )
            )
        top_cases = sorted(scored_cases, key=lambda item: item.similarity_score, reverse=True)[:3]
        converted_share = (
            sum(1 for case in top_cases if case.outcome == "converted") / len(top_cases)
            if top_cases
            else 0.0
        )
        pattern_summary = (
            f"{sum(1 for case in top_cases if case.outcome == 'converted')} of the top {len(top_cases)} similar cases converted, "
            f"with {top_cases[0].recommended_action.lower()} most common at the high-similarity end."
            if top_cases
            else "No strong historical analogs were found, so downstream confidence is slightly reduced."
        )
        confidence = clamp(0.68 + min(len(top_cases), 3) * 0.08, 0.68, 0.92)
        return SimilarCaseOutput(
            cases=top_cases,
            pattern_summary=pattern_summary,
            signal_score=round(converted_share, 4),
            confidence=round(confidence, 4),
        )

