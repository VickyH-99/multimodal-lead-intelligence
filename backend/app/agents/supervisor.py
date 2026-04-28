"""Supervisor agent that orchestrates all specialist agents into one decision package."""

from __future__ import annotations

from datetime import UTC, datetime
from time import perf_counter
from typing import Any

from app.agents.behavior_sequence import BehaviorSequenceAgent
from app.agents.explanation import ExplanationAgent
from app.agents.similar_case import SimilarCaseAgent
from app.agents.strategy import StrategyAgent
from app.agents.structured_scoring import StructuredScoringAgent
from app.agents.text_intent import TextIntentAgent
from app.agents.voice_emotion import VoiceEmotionAgent
from app.db.models import Lead
from app.schemas.agent import (
    BehaviorSequenceInput,
    ExplanationInput,
    StrategyInput,
    StructuredLeadFeatures,
    TextIntentInput,
    VoiceEmotionInput,
)
from app.schemas.common import ScoreBandThresholds
from app.schemas.lead import AgentSignal, DecisionPackage, FeatureContribution, SimilarCaseSummary
from app.utils.scoring import clamp, determine_score_band


class SupervisorAgent:
    """Coordinate specialist agents and produce a unified lead decision package."""

    name = "SupervisorAgent"
    description = "Runs specialist agents, synthesizes signals, and returns the final decision."

    def __init__(
        self,
        *,
        thresholds: ScoreBandThresholds,
        structured_agent: StructuredScoringAgent,
        text_agent: TextIntentAgent,
        voice_agent: VoiceEmotionAgent,
        behavior_agent: BehaviorSequenceAgent,
        similar_case_agent: SimilarCaseAgent,
        strategy_agent: StrategyAgent,
        explanation_agent: ExplanationAgent,
    ) -> None:
        self.thresholds = thresholds
        self.structured_agent = structured_agent
        self.text_agent = text_agent
        self.voice_agent = voice_agent
        self.behavior_agent = behavior_agent
        self.similar_case_agent = similar_case_agent
        self.strategy_agent = strategy_agent
        self.explanation_agent = explanation_agent

    def run(self, lead: Lead, historical_candidates: list[Lead]) -> DecisionPackage:
        """Execute the full multi-agent orchestration flow for one lead."""

        structured_input = StructuredLeadFeatures(
            employee_count=lead.employee_count,
            budget_estimate=lead.budget_estimate,
            engagement_score=lead.engagement_score,
            product_fit_score=lead.product_fit_score,
            website_visits=lead.website_visits,
            email_open_rate=lead.email_open_rate,
            source_channel=lead.source_channel,
            lifecycle_stage=lead.lifecycle_stage,
            industry=lead.industry,
        )
        structured_output, structured_latency = self._timed_run(
            self.structured_agent, structured_input
        )
        lead.latest_score_band = structured_output.score_band
        structured_contribution = (structured_output.base_score - 0.5) * 0.45
        structured_signal = self._make_signal(
            agent_name=self.structured_agent.name,
            input_signals=structured_input.model_dump(),
            reasoning_summary=(
                f"Structured qualification scored {structured_output.base_score:.2f} in band "
                f"{structured_output.score_band}, led by {structured_output.top_feature_reasons[0].lower()}."
            ),
            confidence=structured_output.confidence,
            contribution=structured_contribution,
            latency_ms=structured_latency,
            output_signals=structured_output.model_dump(),
            action_implication=(
                "Sets the base qualification level and determines whether direct seller "
                "coverage is justified before unstructured signals are fused."
            ),
        )

        text_input = TextIntentInput(
            crm_notes=lead.crm_notes, call_transcript=lead.call_transcript
        )
        text_output, text_latency = self._timed_run(self.text_agent, text_input)
        text_risks = []
        if text_output.competitor_mention:
            text_risks.append("competitive_pressure")
        if text_output.price_sensitivity == "high":
            text_risks.append("price_sensitivity")
        text_contribution = (text_output.signal_score - 0.5) * 0.18
        text_signal = self._make_signal(
            agent_name=self.text_agent.name,
            input_signals={
                "crm_notes_excerpt": lead.crm_notes[:160],
                "call_transcript_excerpt": lead.call_transcript[:160],
                "industry": lead.industry,
            },
            reasoning_summary=text_output.summary,
            confidence=text_output.confidence,
            contribution=text_contribution,
            latency_ms=text_latency,
            risk_flags=text_risks,
            output_signals=text_output.model_dump(),
            action_implication=(
                "Raises or lowers urgency for human follow-up based on buying intent, "
                "objection load, and commercial friction."
            ),
        )

        voice_input = VoiceEmotionInput(
            speaking_speed=lead.speaking_speed,
            average_pause_duration=lead.average_pause_duration,
            voice_sentiment_score=lead.voice_sentiment_score,
            hesitation_score=lead.hesitation_score,
        )
        voice_output, voice_latency = self._timed_run(self.voice_agent, voice_input)
        voice_risks = ["relationship_fragility"] if voice_output.escalation_risk == "high" else []
        voice_contribution = (voice_output.voice_intent_score - 0.5) * 0.12
        voice_signal = self._make_signal(
            agent_name=self.voice_agent.name,
            input_signals=voice_input.model_dump(),
            reasoning_summary=voice_output.summary,
            confidence=voice_output.confidence,
            contribution=voice_contribution,
            latency_ms=voice_latency,
            risk_flags=voice_risks,
            output_signals=voice_output.model_dump(),
            action_implication=(
                "Adjusts confidence in immediate engagement by checking whether the buyer "
                "sounds committed, guarded, or at risk of escalation."
            ),
        )

        behavior_input = BehaviorSequenceInput(
            events=[
                {
                    "event_type": event.event_type,
                    "channel": event.channel,
                    "notes": event.notes,
                    "occurred_at": event.occurred_at,
                }
                for event in lead.behavior_events
            ]
        )
        behavior_output, behavior_latency = self._timed_run(
            self.behavior_agent, behavior_input
        )
        behavior_contribution = (behavior_output.sequence_score - 0.5) * 0.15
        behavior_signal = self._make_signal(
            agent_name=self.behavior_agent.name,
            input_signals={
                "event_count": len(lead.behavior_events),
                "latest_event": lead.behavior_events[-1].event_type if lead.behavior_events else "none",
            },
            reasoning_summary=behavior_output.sequence_summary,
            confidence=behavior_output.confidence,
            contribution=behavior_contribution,
            latency_ms=behavior_latency,
            risk_flags=behavior_output.risk_flags,
            output_signals=behavior_output.model_dump(),
            action_implication=(
                "Determines whether the account is accelerating fast enough for direct coverage "
                "or should be cooled into delayed follow-up."
            ),
        )

        similar_output, similar_latency = self._timed_run(
            self.similar_case_agent, (lead, historical_candidates)
        )
        similar_contribution = (similar_output.signal_score - 0.5) * 0.10
        similar_signal = self._make_signal(
            agent_name=self.similar_case_agent.name,
            input_signals={
                "candidate_count": len(historical_candidates),
                "target_industry": lead.industry,
                "target_source_channel": lead.source_channel,
            },
            reasoning_summary=similar_output.pattern_summary,
            confidence=similar_output.confidence,
            contribution=similar_contribution,
            latency_ms=similar_latency,
            output_signals=similar_output.model_dump(),
            action_implication=(
                "Calibrates confidence using historical analogs so the final route reflects "
                "observed conversion patterns instead of isolated lead attributes."
            ),
        )

        risk_flags = sorted(
            set(
                text_risks
                + voice_risks
                + behavior_output.risk_flags
                + (["budget_gap"] if lead.budget_estimate < 25000 else [])
            )
        )
        urgency_bonus = (
            0.04
            if text_output.urgency_level == "high"
            else 0.02
            if text_output.urgency_level == "medium"
            else 0.0
        )
        friction_penalty = 0.03 if "price_sensitivity" in risk_flags else 0.0
        multimodal_score = clamp(
            (structured_output.base_score * 0.45)
            + (text_output.signal_score * 0.18)
            + (voice_output.voice_intent_score * 0.12)
            + (behavior_output.sequence_score * 0.15)
            + (similar_output.signal_score * 0.10)
            + urgency_bonus
            - friction_penalty
        )
        score_band = determine_score_band(multimodal_score, self.thresholds)

        strategy_input = StrategyInput(
            lead_id=lead.id,
            base_score=structured_output.base_score,
            multimodal_score=round(multimodal_score, 4),
            score_band=score_band,
            text_intent=text_output,
            voice_emotion=voice_output,
            behavior_sequence=behavior_output,
            risk_flags=risk_flags,
            thresholds=self.thresholds,
        )
        strategy_output, strategy_latency = self._timed_run(
            self.strategy_agent, strategy_input
        )
        strategy_contribution = multimodal_score - structured_output.base_score
        strategy_signal = self._make_signal(
            agent_name=self.strategy_agent.name,
            input_signals={
                "score_band": score_band,
                "multimodal_score": round(multimodal_score, 4),
                "urgency": text_output.urgency_level,
                "momentum": behavior_output.engagement_momentum,
                "risk_flags": risk_flags,
            },
            reasoning_summary=strategy_output.action_rationale,
            confidence=strategy_output.confidence,
            contribution=strategy_contribution,
            latency_ms=strategy_latency,
            risk_flags=risk_flags,
            output_signals=strategy_output.model_dump(),
            action_implication=(
                f"Directly selects {strategy_output.recommended_action.lower()} as the operating "
                f"route for the next {strategy_output.recommended_time_window.lower()}."
            ),
        )

        explanation_input = ExplanationInput(
            company_name=lead.company_name,
            score_band=score_band,
            structured_output=structured_output,
            text_output=text_output,
            voice_output=voice_output,
            behavior_output=behavior_output,
            similar_case_output=similar_output,
            strategy_output=strategy_output,
            multimodal_score=round(multimodal_score, 4),
        )
        explanation_output, explanation_latency = self._timed_run(
            self.explanation_agent, explanation_input
        )
        explanation_signal = self._make_signal(
            agent_name=self.explanation_agent.name,
            input_signals={
                "company_name": lead.company_name,
                "score_band": score_band,
                "recommended_action": strategy_output.recommended_action,
            },
            reasoning_summary=(
                "Generated a governance-ready natural-language rationale tying the fused signals "
                "to the recommended commercial motion."
            ),
            confidence=explanation_output.confidence,
            contribution=0.0,
            latency_ms=explanation_latency,
            output_signals={"explanation_excerpt": explanation_output.explanation[:240]},
            action_implication=(
                "Enables sales, operations, and governance stakeholders to review the decision "
                "without reading raw model telemetry."
            ),
        )

        confidence = clamp(
            (
                structured_output.confidence
                + text_output.confidence
                + voice_output.confidence
                + behavior_output.confidence
                + similar_output.confidence
                + strategy_output.confidence
            )
            / 6.0,
            0.72,
            0.96,
        )
        feedback_required = lead.current_status == "open" and multimodal_score >= self.thresholds.b
        governance_notes = self._build_governance_notes(
            lead=lead,
            score_band=score_band,
            risk_flags=risk_flags,
            feedback_required=feedback_required,
        )
        supervisor_signal = self._make_signal(
            agent_name=self.name,
            input_signals={
                "base_score": round(structured_output.base_score, 4),
                "text_signal_score": text_output.signal_score,
                "voice_intent_score": voice_output.voice_intent_score,
                "behavior_sequence_score": behavior_output.sequence_score,
                "similar_case_signal_score": similar_output.signal_score,
                "urgency_bonus": urgency_bonus,
                "friction_penalty": friction_penalty,
            },
            reasoning_summary=(
                f"Supervisor fused structured, text, voice, behavior, and historical analog signals "
                f"into a {multimodal_score:.2f} multimodal score in band {score_band}, with "
                f"{strategy_output.recommended_action.lower()} selected as the next best action."
            ),
            confidence=confidence,
            contribution=multimodal_score - 0.5,
            latency_ms=round(
                structured_latency
                + text_latency
                + voice_latency
                + behavior_latency
                + similar_latency
                + strategy_latency
                + explanation_latency,
                2,
            ),
            risk_flags=risk_flags,
            output_signals={
                "multimodal_score": round(multimodal_score, 4),
                "score_band": score_band,
                "recommended_action": strategy_output.recommended_action,
                "recommended_time_window": strategy_output.recommended_time_window,
            },
            action_implication=(
                "Finalizes the operating decision, confidence level, and governance posture for "
                "frontline execution."
            ),
        )

        reasoning_trace = [
            supervisor_signal,
            structured_signal,
            text_signal,
            voice_signal,
            behavior_signal,
            similar_signal,
            strategy_signal,
            explanation_signal,
        ]
        feature_contributions = self._build_feature_contributions(
            structured_output.feature_contributions
        )

        return DecisionPackage(
            lead_id=lead.id,
            base_score=round(structured_output.base_score, 4),
            multimodal_score=round(multimodal_score, 4),
            score_band=score_band,
            confidence=round(confidence, 4),
            agent_signals=reasoning_trace,
            reasoning_trace=reasoning_trace,
            feature_contributions=feature_contributions,
            recommended_action=strategy_output.recommended_action,
            recommended_time_window=strategy_output.recommended_time_window,
            explanation=explanation_output.explanation,
            risk_flags=risk_flags,
            governance_notes=governance_notes,
            similar_cases=[SimilarCaseSummary(**case.model_dump()) for case in similar_output.cases],
            top_feature_reasons=structured_output.top_feature_reasons,
            feedback_required=feedback_required,
            created_at=datetime.now(UTC).replace(tzinfo=None),
        )

    def _timed_run(self, agent: Any, payload: Any) -> tuple[Any, float]:
        """Execute an agent and capture latency in milliseconds."""

        start = perf_counter()
        output = agent.run(payload)
        latency_ms = round((perf_counter() - start) * 1000, 2)
        return output, latency_ms

    def _make_signal(
        self,
        *,
        agent_name: str,
        input_signals: dict[str, Any],
        reasoning_summary: str,
        confidence: float,
        contribution: float,
        latency_ms: float,
        output_signals: dict[str, Any],
        action_implication: str,
        risk_flags: list[str] | None = None,
    ) -> AgentSignal:
        """Create a normalized agent-signal record."""

        return AgentSignal(
            agent_name=agent_name,
            input_signals=input_signals,
            reasoning_summary=reasoning_summary,
            confidence=round(confidence, 4),
            contribution=round(contribution, 4),
            latency_ms=latency_ms,
            risk_flags=risk_flags or [],
            action_implication=action_implication,
            output_signals=output_signals,
        )

    def _build_feature_contributions(
        self, contributions: dict[str, float]
    ) -> list[FeatureContribution]:
        """Translate model contributions into UI-friendly feature rows."""

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
                contribution=round(contribution, 4),
                direction="positive" if contribution >= 0 else "negative",
                explanation=explanation_map.get(
                    feature_name,
                    "This feature changed the structured qualification outlook.",
                ),
            )
            for feature_name, contribution in sorted(
                contributions.items(),
                key=lambda item: abs(item[1]),
                reverse=True,
            )
        ]

    def _build_governance_notes(
        self,
        *,
        lead: Lead,
        score_band: str,
        risk_flags: list[str],
        feedback_required: bool,
    ) -> list[str]:
        """Generate compliance and governance notes for the final decision package."""

        notes: list[str] = []
        compliance_tier = str(lead.metadata_json.get("compliance_tier", "standard")).replace(
            "_", " "
        )
        if lead.industry.lower() in {"healthcare", "financial services", "medical devices"}:
            notes.append(
                f"{lead.industry} account requires governance review aligned to the {compliance_tier} operating tier before scaled rollout."
            )
        else:
            notes.append(
                f"Decision package should be logged against the {compliance_tier} governance tier for downstream auditability."
            )
        if "competitive_pressure" in risk_flags or "price_sensitivity" in risk_flags:
            notes.append(
                "Commercial objections should be captured in the account plan so threshold drift can distinguish product friction from pricing friction."
            )
        if "relationship_fragility" in risk_flags or "no_show_pattern" in risk_flags:
            notes.append(
                "Human follow-up should preserve a reviewable contact strategy because relationship fragility was detected in the behavioral or voice stream."
            )
        if score_band in {"S", "A"}:
            notes.append(
                "High-priority routing should remain explainable with preserved feature contributions and agent-level audit steps."
            )
        if feedback_required:
            notes.append(
                "Outcome feedback is required for this lead so the closed-loop learning system can validate or challenge the current routing policy."
            )
        return notes
