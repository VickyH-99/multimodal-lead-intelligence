"""Lead orchestration service for scoring, retrieval, and feedback."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.agents.behavior_sequence import BehaviorSequenceAgent
from app.agents.explanation import ExplanationAgent
from app.agents.similar_case import SimilarCaseAgent
from app.agents.strategy import StrategyAgent
from app.agents.structured_scoring import StructuredScoringAgent
from app.agents.supervisor import SupervisorAgent
from app.agents.text_intent import TextIntentAgent
from app.agents.voice_emotion import VoiceEmotionAgent
from app.core.config import Settings
from app.core.logging import get_logger
from app.db.models import Lead
from app.repositories.lead_repository import LeadRepository
from app.schemas.common import BehaviorEventInput, ScoreBandThresholds
from app.schemas.feedback import FeedbackRecord, FeedbackRequest, FeedbackResponse
from app.schemas.lead import (
    AgentSignal,
    DecisionPackage,
    FeatureContribution,
    LeadDetailResponse,
    LeadListItem,
    LeadProfile,
    LeadScoreRequest,
    SimilarCaseSummary,
)
from app.services.ml_scoring_service import MockXGBoostScoringService
from app.services.strategy_service import StrategyService


class LeadService:
    """Service layer for lead scoring workflows and detail retrieval."""

    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.lead_repository = LeadRepository(session)
        self.strategy_service = StrategyService(session, settings)
        self.logger = get_logger(__name__)

    def list_leads(
        self,
        query: str | None = None,
        score_band: str | None = None,
        action: str | None = None,
        status: str | None = None,
        limit: int = 200,
    ) -> list[LeadListItem]:
        """Return filtered lead rows for the workbench."""

        leads = self.lead_repository.list_leads(
            query=query,
            score_band=score_band,
            action=action,
            status=status,
            limit=limit,
        )
        return [LeadListItem.model_validate(lead) for lead in leads]

    def get_lead_detail(self, lead_id: int) -> LeadDetailResponse:
        """Return the full lead profile, latest decision, and history."""

        lead = self.lead_repository.get_lead(lead_id)
        latest_decision = self.lead_repository.get_latest_decision(lead_id)
        feedback_records = self.lead_repository.list_feedback_for_lead(lead_id)
        return LeadDetailResponse(
            profile=LeadProfile.model_validate(lead),
            decision=self._decision_from_record(lead, latest_decision) if latest_decision else None,
            behavior_events=[
                BehaviorEventInput(
                    event_type=event.event_type,
                    channel=event.channel,
                    notes=event.notes,
                    occurred_at=event.occurred_at,
                )
                for event in lead.behavior_events
            ],
            feedback_history=[
                FeedbackRecord.model_validate(entry).model_dump(mode="json")
                for entry in feedback_records
            ],
        )

    def score_lead(self, payload: LeadScoreRequest, *, is_seeded: bool = False) -> DecisionPackage:
        """Create or update a lead, orchestrate the scoring agents, and persist the decision."""

        lead = self.lead_repository.upsert_lead_from_request(payload, is_seeded=is_seeded)
        supervisor = self._build_supervisor()
        historical_candidates = list(
            self.lead_repository.list_historical_candidates(exclude_lead_id=lead.id)
        )
        decision = supervisor.run(lead, historical_candidates)
        record = self.lead_repository.save_decision(lead, decision)
        self.logger.info(
            "Scored lead %s (%s) with band %s and action %s",
            lead.id,
            lead.company_name,
            decision.score_band,
            decision.recommended_action,
        )
        return decision.model_copy(update={"created_at": record.created_at})

    def record_feedback(self, lead_id: int, payload: FeedbackRequest) -> FeedbackResponse:
        """Persist feedback, update lead status, and return learning suggestions."""

        latest_decision = self.lead_repository.get_latest_decision(lead_id)
        lead = self.lead_repository.get_lead(lead_id)
        if payload.outcome == "converted":
            lead.current_status = "closed_won"
            lead.historical_outcome = "converted"
        elif payload.outcome in {"not_converted", "disqualified"}:
            lead.current_status = "closed_lost"
            lead.historical_outcome = payload.outcome
        self.session.add(lead)
        self.session.commit()

        record = self.lead_repository.record_feedback(
            lead_id,
            payload,
            observed_action=latest_decision.recommended_action if latest_decision else None,
            observed_band=latest_decision.score_band if latest_decision else None,
        )
        self.logger.info("Recorded feedback for lead %s with outcome %s", lead_id, payload.outcome)
        performance = self.strategy_service.get_performance()
        return FeedbackResponse(
            feedback=FeedbackRecord.model_validate(record),
            drift_warnings=performance.drift_warnings,
            threshold_change_suggestions=performance.threshold_change_suggestions,
            retraining_candidates=performance.retraining_candidates,
        )

    def _build_supervisor(self) -> SupervisorAgent:
        """Instantiate the supervisor with all specialist agents."""

        thresholds = ScoreBandThresholds(
            s=self.settings.strategy_s_threshold,
            a=self.settings.strategy_a_threshold,
            b=self.settings.strategy_b_threshold,
            c=self.settings.strategy_c_threshold,
        )
        return SupervisorAgent(
            thresholds=thresholds,
            structured_agent=StructuredScoringAgent(MockXGBoostScoringService(), thresholds),
            text_agent=TextIntentAgent(),
            voice_agent=VoiceEmotionAgent(),
            behavior_agent=BehaviorSequenceAgent(),
            similar_case_agent=SimilarCaseAgent(),
            strategy_agent=StrategyAgent(),
            explanation_agent=ExplanationAgent(),
        )

    def _decision_from_record(self, lead: Lead, record) -> DecisionPackage:
        """Map a persisted decision row back into the API response schema."""

        agent_signals = [AgentSignal.model_validate(signal) for signal in record.agent_signals]
        reasoning_trace = self._rebuild_reasoning_trace(agent_signals)
        return DecisionPackage(
            lead_id=record.lead_id,
            base_score=record.base_score,
            multimodal_score=record.multimodal_score,
            score_band=record.score_band,
            confidence=record.confidence,
            agent_signals=agent_signals,
            reasoning_trace=reasoning_trace,
            feature_contributions=self._extract_feature_contributions(agent_signals),
            recommended_action=record.recommended_action,
            recommended_time_window=record.recommended_time_window,
            explanation=record.explanation,
            risk_flags=record.risk_flags,
            governance_notes=self._build_governance_notes(
                lead=lead,
                score_band=record.score_band,
                risk_flags=record.risk_flags,
                feedback_required=record.feedback_required,
            ),
            similar_cases=[SimilarCaseSummary(**case) for case in record.similar_cases],
            top_feature_reasons=record.top_feature_reasons,
            feedback_required=record.feedback_required,
            created_at=record.created_at,
        )

    def _extract_feature_contributions(
        self, agent_signals: list[AgentSignal]
    ) -> list[FeatureContribution]:
        """Recover feature contributions from the structured scoring output preview."""

        structured_signal = next(
            (
                signal
                for signal in agent_signals
                if signal.agent_name == "StructuredScoringAgent"
            ),
            None,
        )
        feature_contributions = structured_signal.output_signals.get(
            "feature_contributions", {}
        ) if structured_signal else {}
        if not isinstance(feature_contributions, dict):
            return []

        explanation_map = {
            "budget_estimate": "Higher budget capacity supports a more credible buying motion.",
            "product_fit_score": "Stronger fit increases expected conversion efficiency.",
            "engagement_score": "Recent engagement indicates evaluation intensity.",
            "website_visits": "Digital engagement volume adds buying-signal confidence.",
            "email_open_rate": "Message resonance supports sustained interest.",
            "employee_count": "Scale alignment matches historical conversion patterns.",
            "source_channel": "Acquisition source changes baseline conversion likelihood.",
            "lifecycle_stage": "Stage maturity affects route intensity and timing.",
            "industry": "Industry context shifts typical conversion behavior and governance needs.",
        }
        return [
            FeatureContribution(
                feature_name=feature_name,
                contribution=round(float(contribution), 4),
                direction="positive" if float(contribution) >= 0 else "negative",
                explanation=explanation_map.get(
                    feature_name,
                    "This feature changed the structured qualification outlook.",
                ),
            )
            for feature_name, contribution in sorted(
                feature_contributions.items(),
                key=lambda item: abs(float(item[1])),
                reverse=True,
            )
        ]

    def _rebuild_reasoning_trace(
        self, agent_signals: list[AgentSignal]
    ) -> list[AgentSignal]:
        """Guarantee a reasoning trace even for older persisted decisions."""

        if any(signal.agent_name == "SupervisorAgent" for signal in agent_signals):
            return agent_signals

        supervisor_summary = next(
            (
                signal.reasoning_summary
                for signal in agent_signals
                if signal.agent_name == "StrategyAgent"
            ),
            "Supervisor reconstructed the final route from persisted specialist outputs.",
        )
        strategy_signal = next(
            (
                signal
                for signal in agent_signals
                if signal.agent_name == "StrategyAgent"
            ),
            None,
        )
        supervisor_signal = AgentSignal(
            agent_name="SupervisorAgent",
            input_signals={
                "specialist_count": len(agent_signals),
                "persisted_reconstruction": True,
            },
            reasoning_summary=(
                "Supervisor trace was reconstructed from the persisted decision package. "
                f"Final route context: {supervisor_summary}"
            ),
            confidence=strategy_signal.confidence if strategy_signal else 0.82,
            contribution=strategy_signal.contribution if strategy_signal else 0.0,
            risk_flags=strategy_signal.risk_flags if strategy_signal else [],
            action_implication=(
                "Provides a top-level audit record even when the stored decision predates the richer reasoning trace schema."
            ),
            latency_ms=sum(signal.latency_ms for signal in agent_signals),
            output_signals=(
                strategy_signal.output_signals if strategy_signal else {}
            ),
        )
        return [supervisor_signal, *agent_signals]

    def _build_governance_notes(
        self,
        *,
        lead: Lead,
        score_band: str,
        risk_flags: list[str],
        feedback_required: bool,
    ) -> list[str]:
        """Generate compliance and governance notes for the decision view."""

        compliance_tier = str(lead.metadata_json.get("compliance_tier", "standard")).replace(
            "_", " "
        )
        notes = [
            (
                f"Decision record should be retained under the {compliance_tier} governance tier "
                "with preserved feature attributions and agent-level evidence."
            )
        ]
        if lead.industry.lower() in {"healthcare", "financial services", "medical devices"}:
            notes.append(
                f"{lead.industry} workflows should be reviewed for domain-specific compliance before automating scaled outreach."
            )
        if "price_sensitivity" in risk_flags or "competitive_pressure" in risk_flags:
            notes.append(
                "Commercial objections should be captured as structured outcome feedback so threshold drift separates market pressure from model error."
            )
        if score_band in {"S", "A"}:
            notes.append(
                "High-priority routing requires explainability suitable for sales leadership and model governance review."
            )
        if feedback_required:
            notes.append(
                "Closed-loop outcome capture is expected for this lead because the current policy assigned actionable coverage."
            )
        return notes
