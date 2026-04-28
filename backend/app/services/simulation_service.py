"""Strategy simulation service."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.common import ScoreBandThresholds
from app.schemas.simulation import (
    SimulationComparison,
    SimulationMetricSet,
    SimulationOperationalInsight,
    SimulationRequest,
    SimulationResponse,
    StrategyRuleSet,
    StrategyScenarioSummary,
    ThresholdSensitivityItem,
)
from app.utils.scoring import clamp, determine_score_band


class SimulationService:
    """Evaluate proposed band thresholds and action-routing changes."""

    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.analytics_repository = AnalyticsRepository(session)

    def run_simulation(self, payload: SimulationRequest) -> SimulationResponse:
        """Compare current strategy with a proposed threshold and routing plan."""

        leads = list(self.analytics_repository.fetch_scored_leads_with_relations())
        current_thresholds = ScoreBandThresholds(
            s=self.settings.strategy_s_threshold,
            a=self.settings.strategy_a_threshold,
            b=self.settings.strategy_b_threshold,
            c=self.settings.strategy_c_threshold,
        )
        current_rules = StrategyRuleSet()
        current_metrics = self._simulate(
            leads,
            current_thresholds,
            current_rules,
            self.settings.default_human_capacity,
            self.settings.default_ai_capacity,
        )
        proposed_metrics = self._simulate(
            leads,
            payload.thresholds,
            payload.action_rules,
            payload.human_capacity_limit,
            payload.ai_call_capacity_limit,
        )
        comparison = SimulationComparison(
            current=current_metrics,
            proposed=proposed_metrics,
            delta_expected_conversions=round(
                proposed_metrics.expected_conversions - current_metrics.expected_conversions, 4
            ),
            delta_weighted_workload=round(
                proposed_metrics.weighted_workload - current_metrics.weighted_workload, 4
            ),
        )
        operational_insight = self._build_operational_insight(
            comparison=comparison,
            payload=payload,
        )
        threshold_sensitivity = self._build_threshold_sensitivity_analysis(
            current_thresholds=current_thresholds,
            proposed_thresholds=payload.thresholds,
            current_rules=current_rules,
            payload=payload,
            leads=leads,
        )
        current_strategy_summary = self._build_strategy_summary(
            label="Current strategy",
            metrics=current_metrics,
            rules=current_rules,
            thresholds=current_thresholds,
        )
        proposed_strategy_summary = self._build_strategy_summary(
            label="Proposed strategy",
            metrics=proposed_metrics,
            rules=payload.action_rules,
            thresholds=payload.thresholds,
        )
        why_result = self._build_why_result(
            comparison=comparison,
            payload=payload,
        )
        conversion_uplift_explanation = self._build_conversion_uplift_explanation(
            comparison=comparison,
            payload=payload,
        )
        recommended_next_policy = self._build_recommended_next_policy(
            comparison=comparison,
            payload=payload,
            operational_insight=operational_insight,
        )
        export_summary = self._build_export_summary(
            comparison=comparison,
            payload=payload,
            operational_insight=operational_insight,
            recommended_next_policy=recommended_next_policy,
        )

        return SimulationResponse(
            comparison=comparison,
            proposed_thresholds=payload.thresholds,
            proposed_rules=payload.action_rules,
            assumptions=[
                "Expected conversions are estimated from the latest multimodal score adjusted by action effectiveness multipliers and risk penalties.",
                "Human-call overload reduces projected conversion efficiency when proposed routing exceeds declared seller capacity.",
                "AI outbound call capacity is modeled independently so policy changes can shift workload without hiding throughput risk.",
            ],
            operational_insight=operational_insight,
            why_result=why_result,
            conversion_uplift_explanation=conversion_uplift_explanation,
            threshold_sensitivity_analysis=threshold_sensitivity,
            recommended_next_policy=recommended_next_policy,
            export_summary=export_summary,
            current_strategy_summary=current_strategy_summary,
            proposed_strategy_summary=proposed_strategy_summary,
        )

    def _simulate(
        self,
        leads: list,
        thresholds: ScoreBandThresholds,
        action_rules: StrategyRuleSet,
        human_capacity_limit: int,
        ai_capacity_limit: int,
    ) -> SimulationMetricSet:
        """Estimate operational and conversion impact for one strategy configuration."""

        expected_conversions = 0.0
        human_calls = 0
        ai_calls = 0
        nurture_pool = 0
        weighted_workload = 0.0
        for lead in leads:
            score = lead.latest_multimodal_score or 0.0
            band = determine_score_band(score, thresholds)
            action = self._action_for_band(band, action_rules)
            action_multiplier = {
                "senior human call": 1.12,
                "normal human call": 1.05,
                "AI outbound call": 0.94,
                "delayed follow-up": 0.76,
                "nurture pool": 0.54,
                "do-not-contact review": 0.05,
            }[action]
            risk_penalty = (
                0.03
                if lead.decisions and "price_sensitivity" in lead.decisions[0].risk_flags
                else 0.0
            )
            expected_conversions += clamp(score * action_multiplier - risk_penalty)
            if action in {"senior human call", "normal human call"}:
                human_calls += 1
                weighted_workload += 1.4 if action == "senior human call" else 1.0
            elif action == "AI outbound call":
                ai_calls += 1
                weighted_workload += 0.45
            else:
                nurture_pool += 1
                weighted_workload += 0.2
        if human_calls > human_capacity_limit:
            overload = human_calls - human_capacity_limit
            expected_conversions -= overload * 0.03
        if ai_calls > ai_capacity_limit:
            overload = ai_calls - ai_capacity_limit
            expected_conversions -= overload * 0.015

        return SimulationMetricSet(
            expected_conversions=round(expected_conversions, 4),
            human_calls=human_calls,
            ai_calls=ai_calls,
            nurture_pool=nurture_pool,
            weighted_workload=round(weighted_workload, 4),
        )

    def _build_operational_insight(
        self,
        *,
        comparison: SimulationComparison,
        payload: SimulationRequest,
    ) -> SimulationOperationalInsight:
        """Create the top-level policy summary for the simulation result."""

        current = comparison.current
        proposed = comparison.proposed
        expected_uplift = (
            comparison.delta_expected_conversions / current.expected_conversions
            if current.expected_conversions
            else 0.0
        )

        risk_warning = "Projected operating load remains within the modeled capacity envelope."
        if proposed.human_calls > payload.human_capacity_limit:
            risk_warning = (
                f"Projected human-call volume exceeds stated capacity by "
                f"{proposed.human_calls - payload.human_capacity_limit} touches, creating queue-pressure risk."
            )
        elif proposed.ai_calls > payload.ai_call_capacity_limit:
            risk_warning = (
                f"Projected AI call volume exceeds stated capacity by "
                f"{proposed.ai_calls - payload.ai_call_capacity_limit} calls, increasing execution-throttling risk."
            )
        elif proposed.weighted_workload > current.weighted_workload * 1.12:
            risk_warning = (
                "Projected workload expands materially faster than conversion lift, so seller efficiency "
                "should be monitored before a full rollout."
            )

        recommended_threshold_adjustment = (
            "Hold the proposed thresholds for the next review window."
        )
        if payload.thresholds.a < self.settings.strategy_a_threshold and proposed.human_calls > payload.human_capacity_limit:
            recommended_threshold_adjustment = (
                "Raise the A-band threshold by 0.02 or route more overflow into AI-first B-band coverage."
            )
        elif payload.thresholds.b > self.settings.strategy_b_threshold and comparison.delta_expected_conversions < 0:
            recommended_threshold_adjustment = (
                "Lower the B-band threshold slightly to recover mid-band coverage and expected conversions."
            )
        elif payload.thresholds.c < self.settings.strategy_c_threshold and proposed.weighted_workload > current.weighted_workload:
            recommended_threshold_adjustment = (
                "Restore the C-band threshold closer to 0.42 unless delayed follow-up is outperforming baseline expectations."
            )

        return SimulationOperationalInsight(
            projected_conversions=round(proposed.expected_conversions, 4),
            human_workload=proposed.human_calls,
            ai_call_workload=proposed.ai_calls,
            expected_uplift=round(expected_uplift, 4),
            conversion_delta=round(comparison.delta_expected_conversions, 4),
            workload_delta=round(comparison.delta_weighted_workload, 4),
            risk_warning=risk_warning,
            recommended_threshold_adjustment=recommended_threshold_adjustment,
        )

    def _build_threshold_sensitivity_analysis(
        self,
        *,
        current_thresholds: ScoreBandThresholds,
        proposed_thresholds: ScoreBandThresholds,
        current_rules: StrategyRuleSet,
        payload: SimulationRequest,
        leads: list,
    ) -> list[ThresholdSensitivityItem]:
        """Explain how changing each threshold is expected to affect operating policy."""

        sensitivity_items: list[ThresholdSensitivityItem] = []
        for threshold_name in ("s", "a", "b", "c"):
            current_value = getattr(current_thresholds, threshold_name)
            proposed_value = getattr(proposed_thresholds, threshold_name)
            if proposed_value == current_value:
                directional_effect = "neutral"
                explanation = (
                    f"{threshold_name.upper()} threshold is unchanged, so routing pressure for that band remains stable."
                )
            elif proposed_value > current_value:
                directional_effect = "tighter"
                explanation = (
                    f"Raising the {threshold_name.upper()} threshold tightens entry into that band, generally lowering direct-coverage volume while protecting seller capacity."
                )
            else:
                directional_effect = "broader"
                explanation = (
                    f"Lowering the {threshold_name.upper()} threshold broadens entry into that band, increasing coverage volume and potential uplift if capacity can absorb it."
                )

            sensitivity_items.append(
                ThresholdSensitivityItem(
                    threshold=threshold_name.upper(),
                    current_value=round(current_value, 4),
                    proposed_value=round(proposed_value, 4),
                    directional_effect=directional_effect,
                    explanation=explanation,
                )
            )

        baseline = self._simulate(
            leads,
            current_thresholds,
            current_rules,
            self.settings.default_human_capacity,
            self.settings.default_ai_capacity,
        )
        ai_shift = self._simulate(
            leads,
            proposed_thresholds,
            payload.action_rules,
            payload.human_capacity_limit,
            payload.ai_call_capacity_limit,
        )
        sensitivity_items.append(
            ThresholdSensitivityItem(
                threshold="Routing",
                current_value=baseline.ai_calls,
                proposed_value=ai_shift.ai_calls,
                directional_effect="ai-shift"
                if ai_shift.ai_calls > baseline.ai_calls
                else "human-shift",
                explanation=(
                    "Action-rule changes can matter as much as raw thresholds because they reassign work between human sellers and AI coverage lanes."
                ),
            )
        )
        return sensitivity_items

    def _build_strategy_summary(
        self,
        *,
        label: str,
        metrics: SimulationMetricSet,
        rules: StrategyRuleSet,
        thresholds: ScoreBandThresholds,
    ) -> StrategyScenarioSummary:
        """Build a concise summary for one routing policy."""

        routing_profile = (
            f"S>={thresholds.s:.2f} uses {rules.s_band_action}, "
            f"A>={thresholds.a:.2f} uses {rules.a_band_action}, "
            f"B>={thresholds.b:.2f} uses {rules.b_band_action}."
        )
        explanation = (
            f"{label} is modeled to deliver {metrics.expected_conversions:.2f} projected conversions "
            f"with {metrics.human_calls} human touches and {metrics.ai_calls} AI calls."
        )
        return StrategyScenarioSummary(
            label=label,
            expected_conversions=metrics.expected_conversions,
            human_workload=metrics.human_calls,
            ai_call_workload=metrics.ai_calls,
            weighted_workload=metrics.weighted_workload,
            routing_profile=routing_profile,
            explanation=explanation,
        )

    def _build_why_result(
        self,
        *,
        comparison: SimulationComparison,
        payload: SimulationRequest,
    ) -> str:
        """Explain why the simulation produced its outcome."""

        if comparison.delta_expected_conversions > 0 and comparison.delta_weighted_workload <= 0:
            return (
                "The proposed policy concentrates capacity on higher-yield coverage while shifting lower-value work into lighter-touch routes, producing more projected conversions without increasing workload."
            )
        if comparison.delta_expected_conversions > 0:
            return (
                "The proposed policy broadens or intensifies coverage enough to lift projected conversions, but it does so by increasing the operating workload."
            )
        if comparison.delta_weighted_workload < 0:
            return (
                "The proposed policy protects capacity and reduces workload, but the simulation indicates that some conversion opportunity is surrendered in exchange."
            )
        return (
            "The proposed policy is directionally similar to the current strategy, so the model forecasts limited performance separation between the two."
        )

    def _build_conversion_uplift_explanation(
        self,
        *,
        comparison: SimulationComparison,
        payload: SimulationRequest,
    ) -> str:
        """Describe the conversion uplift tradeoff in business language."""

        if comparison.delta_expected_conversions > 0:
            return (
                f"Projected conversions improve by {comparison.delta_expected_conversions:.2f} because the proposed thresholds and routing rules preserve coverage on stronger leads while better aligning workload to capacity limits of {payload.human_capacity_limit} human touches and {payload.ai_call_capacity_limit} AI calls."
            )
        if comparison.delta_expected_conversions < 0:
            return (
                f"Projected conversions decline by {abs(comparison.delta_expected_conversions):.2f}, indicating the proposed policy is likely too restrictive or shifts too much volume out of the most effective coverage lanes."
            )
        return (
            "Projected conversions remain effectively flat, so the proposed policy is mainly an operating-model change rather than a conversion-lift strategy."
        )

    def _build_recommended_next_policy(
        self,
        *,
        comparison: SimulationComparison,
        payload: SimulationRequest,
        operational_insight: SimulationOperationalInsight,
    ) -> str:
        """Recommend the next policy action from the simulation output."""

        if comparison.delta_expected_conversions > 0 and comparison.delta_weighted_workload <= 0:
            return (
                "Promote the proposed policy into a controlled pilot. It improves projected conversion output while holding or reducing workload pressure."
            )
        if comparison.delta_expected_conversions > 0 and comparison.proposed.human_calls <= payload.human_capacity_limit:
            return (
                "Pilot the proposed thresholds on a subset of live traffic and monitor seller queue times, because the uplift appears positive and the human-capacity limit is still respected."
            )
        if comparison.proposed.human_calls > payload.human_capacity_limit:
            return (
                "Do not fully deploy yet. First tighten the A-band or move more B-band volume to AI-first coverage to avoid saturating human capacity."
            )
        return (
            f"Retain the current policy for now. {operational_insight.recommended_threshold_adjustment}"
        )

    def _build_export_summary(
        self,
        *,
        comparison: SimulationComparison,
        payload: SimulationRequest,
        operational_insight: SimulationOperationalInsight,
        recommended_next_policy: str,
    ) -> str:
        """Generate exportable text for operator handoff or demo narrative."""

        return (
            "Simulation summary:\n"
            f"- Proposed thresholds: S={payload.thresholds.s:.2f}, A={payload.thresholds.a:.2f}, "
            f"B={payload.thresholds.b:.2f}, C={payload.thresholds.c:.2f}\n"
            f"- Projected conversions: {comparison.proposed.expected_conversions:.2f} "
            f"({comparison.delta_expected_conversions:+.2f} vs current)\n"
            f"- Human workload: {comparison.proposed.human_calls}\n"
            f"- AI call workload: {comparison.proposed.ai_calls}\n"
            f"- Weighted workload delta: {comparison.delta_weighted_workload:+.2f}\n"
            f"- Risk warning: {operational_insight.risk_warning}\n"
            f"- Recommended next policy: {recommended_next_policy}"
        )

    def _action_for_band(self, band: str, rules: StrategyRuleSet) -> str:
        """Resolve the recommended action for a simulated score band."""

        mapping = {
            "S": rules.s_band_action,
            "A": rules.a_band_action,
            "B": rules.b_band_action,
            "C": rules.c_band_action,
            "D": rules.d_band_action,
        }
        return mapping[band]
