"""Dashboard and agent health services."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.dashboard import (
    ActionBreakdownItem,
    AgentStatusItem,
    AgentStatusResponse,
    ConfidenceSummary,
    DashboardSummaryResponse,
    FeedbackLoopStatus,
)
from app.services.strategy_service import StrategyService


class DashboardService:
    """Provide executive dashboard and agent-orchestration summary data."""

    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.analytics_repository = AnalyticsRepository(session)
        self.strategy_service = StrategyService(session, settings)

    def get_summary(self) -> DashboardSummaryResponse:
        """Return the executive dashboard summary payload."""

        leads = list(self.analytics_repository.fetch_scored_leads_with_relations())
        performance = self.strategy_service.get_performance()
        total_leads_scored = len(leads)
        score_distribution = []
        for band in ["S", "A", "B", "C", "D"]:
            group = [lead for lead in leads if lead.latest_score_band == band]
            conversions = sum(
                1 for lead in group if self.strategy_service._is_converted(lead)
            )
            score_distribution.append(
                {
                    "band": band,
                    "count": len(group),
                    "conversion_rate": round((conversions / len(group)) if group else 0.0, 4),
                }
            )

        action_groups: dict[str, list] = defaultdict(list)
        for lead in leads:
            if lead.latest_action:
                action_groups[lead.latest_action].append(lead)
        action_breakdown = [
            ActionBreakdownItem(
                action=action,
                count=len(group),
                avg_conversion_rate=round(self.strategy_service._conversion_rate(group), 4),
            )
            for action, group in sorted(action_groups.items(), key=lambda item: item[0])
        ]
        confidence_values = [lead.latest_confidence or 0.0 for lead in leads]
        avg_confidence = (
            sum(confidence_values) / len(confidence_values) if confidence_values else 0.0
        )
        confidence_summary = ConfidenceSummary(
            average_confidence=round(avg_confidence, 4),
            high_confidence_share=round(
                (
                    sum(1 for value in confidence_values if value >= 0.85)
                    / len(confidence_values)
                )
                if confidence_values
                else 0.0,
                4,
            ),
            low_confidence_share=round(
                (
                    sum(1 for value in confidence_values if value < 0.7)
                    / len(confidence_values)
                )
                if confidence_values
                else 0.0,
                4,
            ),
        )
        return DashboardSummaryResponse(
            total_leads_scored=total_leads_scored,
            open_leads=sum(1 for lead in leads if lead.current_status == "open"),
            converted_leads=sum(
                1 for lead in leads if self.strategy_service._is_converted(lead)
            ),
            score_distribution=score_distribution,
            action_breakdown=action_breakdown,
            confidence_summary=confidence_summary,
            feedback_loop_status=FeedbackLoopStatus(
                total_feedback_records=sum(len(lead.feedback_entries) for lead in leads),
                high_score_non_converted=len(performance.high_score_non_converted_leads),
                low_score_converted=len(performance.low_score_converted_leads),
                drift_warnings=performance.drift_warnings,
                threshold_change_suggestions=performance.threshold_change_suggestions,
            ),
        )

    def get_agent_status(self) -> AgentStatusResponse:
        """Return orchestrator health, average latency, and last output previews."""

        leads = list(self.analytics_repository.fetch_scored_leads_with_relations())
        grouped: dict[str, list[dict]] = defaultdict(list)
        latest_preview: dict[str, dict] = {}
        latest_reasoning: dict[str, str] = {}
        latest_implications: dict[str, str] = {}
        for lead in leads:
            if not lead.decisions:
                continue
            decision_signals = list(lead.decisions[0].agent_signals)
            if decision_signals and not any(
                signal.get("agent_name") == "SupervisorAgent" for signal in decision_signals
            ):
                strategy_signal = next(
                    (
                        signal
                        for signal in decision_signals
                        if signal.get("agent_name") == "StrategyAgent"
                    ),
                    {},
                )
                decision_signals.insert(
                    0,
                    {
                        "agent_name": "SupervisorAgent",
                        "reasoning_summary": (
                            "Supervisor trace reconstructed from persisted strategy output for compatibility with the richer audit schema."
                        ),
                        "confidence": strategy_signal.get("confidence", 0.82),
                        "contribution": strategy_signal.get(
                            "contribution", strategy_signal.get("score_impact", 0.0)
                        ),
                        "risk_flags": strategy_signal.get("risk_flags", []),
                        "action_implication": (
                            "Provides a top-level audit record for the final route even when the stored decision predates the supervisor trace schema."
                        ),
                        "latency_ms": sum(
                            float(signal.get("latency_ms", 0.0))
                            for signal in decision_signals
                        ),
                        "output_signals": strategy_signal.get(
                            "output_signals", strategy_signal.get("output_preview", {})
                        ),
                    },
                )

            for signal in decision_signals:
                agent_name = signal["agent_name"]
                grouped[agent_name].append(signal)
                latest_preview[agent_name] = signal.get(
                    "output_signals", signal.get("output_preview", {})
                )
                latest_reasoning[agent_name] = signal.get(
                    "reasoning_summary", signal.get("summary", "")
                )
                latest_implications[agent_name] = signal.get("action_implication", "")

        catalog = {
            "SupervisorAgent": "Lead-level fusion, confidence calibration, and audit packaging.",
            "StructuredScoringAgent": "Structured model wrapper with feature attribution.",
            "TextIntentAgent": "CRM note and transcript understanding.",
            "VoiceEmotionAgent": "Voice-derived confidence and escalation analysis.",
            "BehaviorSequenceAgent": "Event-sequence momentum scoring.",
            "SimilarCaseAgent": "Historical case retrieval and summarization.",
            "StrategyAgent": "Next best action routing.",
            "ExplanationAgent": "Business-readable explanation generation.",
        }
        items = []
        for agent_name, description in catalog.items():
            signals = grouped.get(agent_name, [])
            avg_latency = (
                sum(signal["latency_ms"] for signal in signals) / len(signals)
                if signals
                else 0.0
            )
            avg_confidence = (
                sum(signal["confidence"] for signal in signals) / len(signals)
                if signals
                else 0.0
            )
            items.append(
                AgentStatusItem(
                    agent_name=agent_name,
                    status="healthy" if signals else "warming",
                    description=description,
                    avg_latency_ms=round(avg_latency, 2),
                    avg_confidence=round(avg_confidence, 4),
                    last_output_preview=latest_preview.get(agent_name, {}),
                    last_reasoning_summary=latest_reasoning.get(agent_name, ""),
                    last_action_implication=latest_implications.get(agent_name, ""),
                )
            )
        return AgentStatusResponse(
            supervisor_status="healthy - live orchestration and audit packaging available",
            agents=items,
        )
