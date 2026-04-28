"""Strategy analytics and feedback-learning services."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.agents.feedback_learning import FeedbackLearningAgent
from app.core.config import Settings
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.agent import FeedbackLearningInput, FeedbackLearningOutput
from app.schemas.dashboard import (
    BandDistributionItem,
    LeadInsightSummary,
    RetrainingCandidateSample,
    StrategyPerformanceItem,
    StrategyPerformanceResponse,
)


class StrategyService:
    """Expose action-performance analytics and feedback-learning signals."""

    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.analytics_repository = AnalyticsRepository(session)
        self.feedback_learning_agent = FeedbackLearningAgent()

    def get_performance(self) -> StrategyPerformanceResponse:
        """Return performance breakdowns across actions and score bands."""

        leads = list(self.analytics_repository.fetch_scored_leads_with_relations())
        learning_output, high_ids, low_ids = self._feedback_learning_snapshot(leads)
        lead_index = {lead.id: lead for lead in leads}

        action_groups: dict[str, list] = defaultdict(list)
        band_groups: dict[str, list] = defaultdict(list)
        for lead in leads:
            if lead.latest_action:
                action_groups[lead.latest_action].append(lead)
            if lead.latest_score_band:
                band_groups[lead.latest_score_band].append(lead)

        action_performance = [
            StrategyPerformanceItem(
                action=action,
                recommendation_count=len(group),
                converted_count=sum(1 for lead in group if self._is_converted(lead)),
                conversion_rate=round(self._conversion_rate(group), 4),
            )
            for action, group in sorted(action_groups.items(), key=lambda item: item[0])
        ]
        score_band_performance = [
            BandDistributionItem(
                band=band,
                count=len(group),
                conversion_rate=round(self._conversion_rate(group), 4),
            )
            for band, group in (
                (band, band_groups.get(band, [])) for band in ["S", "A", "B", "C", "D"]
            )
        ]

        learned_patterns = self._build_learned_patterns(leads, high_ids=high_ids, low_ids=low_ids)
        governance_notes = self._build_governance_notes(
            learning_output=learning_output,
            feedback_records=sum(len(lead.feedback_entries) for lead in leads),
        )
        executive_summary = self._build_executive_summary(
            high_ids=high_ids,
            low_ids=low_ids,
            learning_output=learning_output,
        )

        return StrategyPerformanceResponse(
            action_performance=action_performance,
            score_band_performance=score_band_performance,
            drift_warnings=learning_output.drift_warnings,
            threshold_change_suggestions=learning_output.threshold_change_suggestions,
            retraining_candidates=high_ids + low_ids,
            high_score_non_converted_leads=high_ids,
            low_score_converted_leads=low_ids,
            executive_summary=executive_summary,
            learned_patterns=learned_patterns,
            governance_notes=governance_notes,
            high_score_non_converted_details=[
                self._build_lead_insight(
                    lead_index[lead_id],
                    note=(
                        "Premium score quality was offset by commercial, legal, or timing friction "
                        "that should become a stronger routing constraint."
                    ),
                )
                for lead_id in high_ids
                if lead_id in lead_index
            ],
            low_score_converted_details=[
                self._build_lead_insight(
                    lead_index[lead_id],
                    note=(
                        "Outcome data indicates hidden urgency or timing lift that the current model "
                        "is underweighting."
                    ),
                )
                for lead_id in low_ids
                if lead_id in lead_index
            ],
            retraining_candidate_samples=[
                self._build_retraining_sample(lead_index[lead_id])
                for lead_id in (high_ids + low_ids)[:6]
                if lead_id in lead_index
            ],
        )

    def get_feedback_learning_output(self) -> FeedbackLearningOutput:
        """Return the feedback-learning agent output only."""

        leads = list(self.analytics_repository.fetch_scored_leads_with_relations())
        learning_output, _, _ = self._feedback_learning_snapshot(leads)
        return learning_output

    def _feedback_learning_snapshot(
        self, leads: list
    ) -> tuple[FeedbackLearningOutput, list[int], list[int]]:
        """Compute feedback-learning analytics from observed outcomes."""

        high_score_non_converted = [
            lead.id
            for lead in leads
            if (lead.latest_multimodal_score or 0.0) >= self.settings.strategy_a_threshold
            and not self._is_converted(lead)
        ]
        low_score_converted = [
            lead.id
            for lead in leads
            if (lead.latest_multimodal_score or 0.0) < self.settings.strategy_b_threshold
            and self._is_converted(lead)
        ]
        action_rates = defaultdict(list)
        band_rates = defaultdict(list)
        feedback_records = 0
        for lead in leads:
            if lead.feedback_entries:
                feedback_records += len(lead.feedback_entries)
            action_rates[lead.latest_action or "unassigned"].append(
                1.0 if self._is_converted(lead) else 0.0
            )
            band_rates[lead.latest_score_band or "unscored"].append(
                1.0 if self._is_converted(lead) else 0.0
            )

        learning_input = FeedbackLearningInput(
            high_score_non_converted=len(high_score_non_converted),
            low_score_converted=len(low_score_converted),
            total_feedback_records=feedback_records,
            action_conversion_rates={
                action: round(sum(values) / len(values), 4) if values else 0.0
                for action, values in action_rates.items()
            },
            score_band_conversion_rates={
                band: round(sum(values) / len(values), 4) if values else 0.0
                for band, values in band_rates.items()
            },
        )
        return (
            self.feedback_learning_agent.run(learning_input),
            high_score_non_converted,
            low_score_converted,
        )

    def _build_executive_summary(
        self,
        *,
        high_ids: list[int],
        low_ids: list[int],
        learning_output: FeedbackLearningOutput,
    ) -> str:
        """Compose a concise leadership summary of model learning posture."""

        if high_ids and low_ids:
            return (
                "The operating policy is commercially effective overall, but it is simultaneously "
                "over-prioritizing a subset of premium accounts and underestimating hidden urgency "
                "in lower-score wins."
            )
        if high_ids:
            return (
                "Premium routing bands are showing more false positives than desired, suggesting the "
                "platform should tighten objection and governance gating before assigning human-priority coverage."
            )
        if low_ids:
            return (
                "The model is missing upside in a subset of lower-score conversions, so timing and "
                "reactivation signals should be promoted in the next retraining cycle."
            )
        if learning_output.drift_warnings:
            return (
                "Learning signals remain manageable, but the system has surfaced early drift indicators "
                "that should be watched before the next policy change."
            )
        return (
            "Closed-loop performance is stable, with no major drift patterns requiring immediate threshold adjustment."
        )

    def _build_learned_patterns(
        self, leads: list, *, high_ids: list[int], low_ids: list[int]
    ) -> list[str]:
        """Return business-readable pattern insights learned from outcomes."""

        partner_or_inbound_wins = sum(
            1
            for lead in leads
            if self._is_converted(lead)
            and lead.source_channel.lower() in {"partner referral", "inbound demo", "webinar"}
        )
        high_risk_enterprise = sum(
            1
            for lead in leads
            if not self._is_converted(lead)
            and lead.latest_score_band in {"S", "A"}
            and lead.industry.lower() in {"financial services", "healthcare", "medical devices"}
        )
        patterns = [
            f"{partner_or_inbound_wins} converted opportunities originated from higher-trust channels such as partner referral, inbound demo, or webinar programs.",
            f"{high_risk_enterprise} premium-band enterprise losses carried governance-heavy friction, reinforcing the need for compliance- and pricing-aware routing.",
        ]
        if low_ids:
            patterns.append(
                "Several lower-score wins were triggered by late-cycle urgency, reactivation, or deadline pressure rather than broad top-of-funnel engagement."
            )
        if high_ids:
            patterns.append(
                "High-score misses disproportionately show pricing resistance, rollout hesitation, or budget-governance blockers after strong early engagement."
            )
        return patterns

    def _build_governance_notes(
        self, *, learning_output: FeedbackLearningOutput, feedback_records: int
    ) -> list[str]:
        """Return model-governance notes for the learning page."""

        notes = [
            f"{feedback_records} closed-loop outcome records are currently available for policy review and retraining governance.",
            "Threshold suggestions should be reviewed with both commercial leadership and model-governance stakeholders before production rollout.",
        ]
        if learning_output.drift_warnings:
            notes.append(
                "Active drift warnings should be logged against the next model version so policy changes remain attributable to observed outcome patterns."
            )
        else:
            notes.append(
                "No urgent drift escalation is required, but outcome labels should continue to be audited for sampling bias."
            )
        return notes

    def _build_lead_insight(self, lead, *, note: str) -> LeadInsightSummary:
        """Convert a lead into a compact learning insight record."""

        return LeadInsightSummary(
            lead_id=lead.id,
            company_name=lead.company_name,
            full_name=lead.full_name,
            current_status=lead.current_status,
            score_band=lead.latest_score_band or "unscored",
            multimodal_score=round(lead.latest_multimodal_score or 0.0, 4),
            note=note,
        )

    def _build_retraining_sample(self, lead) -> RetrainingCandidateSample:
        """Create a retraining candidate record from a lead outcome pattern."""

        if self._is_converted(lead) and (lead.latest_multimodal_score or 0.0) < self.settings.strategy_b_threshold:
            reason = (
                "Converted despite a lower score, indicating hidden urgency or cohort-specific upside."
            )
            recommended_label = "Review as potential uplift cohort"
        elif not self._is_converted(lead):
            reason = (
                "Scored into a premium route but failed to convert, suggesting stronger gating is needed."
            )
            recommended_label = "Review as possible false positive"
        else:
            reason = "Outcome should be reviewed in the next calibration batch."
            recommended_label = "Review operating label"

        return RetrainingCandidateSample(
            lead_id=lead.id,
            company_name=lead.company_name,
            reason=reason,
            recommended_label=recommended_label,
        )

    def _is_converted(self, lead) -> bool:
        """Return whether a lead converted based on feedback or seeded outcome."""

        return lead.historical_outcome == "converted" or any(
            entry.outcome == "converted" for entry in lead.feedback_entries
        )

    def _conversion_rate(self, leads: list) -> float:
        """Return conversion rate for a lead group."""

        if not leads:
            return 0.0
        return sum(1 for lead in leads if self._is_converted(lead)) / len(leads)
