"""Repositories for lead persistence and retrieval."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundError
from app.db.models import BehaviorEvent, FeedbackOutcome, Lead, ScoringDecision
from app.schemas.feedback import FeedbackRequest
from app.schemas.lead import DecisionPackage, LeadScoreRequest


class LeadRepository:
    """Repository for CRUD-style lead operations and decision persistence."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def count_leads(self) -> int:
        """Return total lead count."""

        return len(self.session.scalars(select(Lead.id)).all())

    def list_leads(
        self,
        query: str | None = None,
        score_band: str | None = None,
        action: str | None = None,
        status: str | None = None,
        limit: int = 200,
    ) -> Sequence[Lead]:
        """Return filtered lead list ordered by recent creation time."""

        stmt = select(Lead).order_by(desc(Lead.created_at)).limit(limit)
        if query:
            wildcard = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Lead.full_name.ilike(wildcard),
                    Lead.company_name.ilike(wildcard),
                    Lead.industry.ilike(wildcard),
                )
            )
        if score_band:
            stmt = stmt.where(Lead.latest_score_band == score_band)
        if action:
            stmt = stmt.where(Lead.latest_action == action)
        if status:
            stmt = stmt.where(Lead.current_status == status)
        return self.session.scalars(stmt).all()

    def get_lead(self, lead_id: int) -> Lead:
        """Return a lead with related entities eager-loaded."""

        stmt = (
            select(Lead)
            .where(Lead.id == lead_id)
            .options(
                selectinload(Lead.behavior_events),
                selectinload(Lead.decisions),
                selectinload(Lead.feedback_entries),
            )
        )
        lead = self.session.scalar(stmt)
        if lead is None:
            raise NotFoundError(f"Lead {lead_id} was not found.")
        return lead

    def upsert_lead_from_request(self, payload: LeadScoreRequest, *, is_seeded: bool = False) -> Lead:
        """Create or update a lead and replace its behavior event history."""

        lead = self.get_lead(payload.lead_id) if payload.lead_id else Lead()
        for field_name, value in payload.model_dump(exclude={"lead_id", "behavior_events"}).items():
            setattr(lead, field_name, value)
        lead.is_seeded = is_seeded or lead.is_seeded

        if payload.lead_id is None:
            self.session.add(lead)
            self.session.flush()

        lead.behavior_events.clear()
        for event in payload.behavior_events:
            lead.behavior_events.append(
                BehaviorEvent(
                    event_type=event.event_type,
                    channel=event.channel,
                    notes=event.notes,
                    occurred_at=event.occurred_at,
                )
            )

        self.session.add(lead)
        self.session.flush()
        self.session.refresh(lead)
        return lead

    def save_decision(self, lead: Lead, decision: DecisionPackage) -> ScoringDecision:
        """Persist a supervisor decision and update the lead snapshot fields."""

        record = ScoringDecision(
            lead_id=lead.id,
            base_score=decision.base_score,
            multimodal_score=decision.multimodal_score,
            score_band=decision.score_band,
            confidence=decision.confidence,
            recommended_action=decision.recommended_action,
            recommended_time_window=decision.recommended_time_window,
            explanation=decision.explanation,
            feedback_required=decision.feedback_required,
            agent_signals=[signal.model_dump() for signal in decision.agent_signals],
            top_feature_reasons=decision.top_feature_reasons,
            risk_flags=decision.risk_flags,
            similar_cases=[case.model_dump() for case in decision.similar_cases],
        )
        lead.latest_base_score = decision.base_score
        lead.latest_multimodal_score = decision.multimodal_score
        lead.latest_score_band = decision.score_band
        lead.latest_confidence = decision.confidence
        lead.latest_action = decision.recommended_action
        lead.latest_time_window = decision.recommended_time_window
        lead.last_scored_at = datetime.now(UTC).replace(tzinfo=None)
        self.session.add(record)
        self.session.add(lead)
        self.session.commit()
        self.session.refresh(record)
        return record

    def get_latest_decision(self, lead_id: int) -> ScoringDecision | None:
        """Return the most recent decision for a lead."""

        stmt = (
            select(ScoringDecision)
            .where(ScoringDecision.lead_id == lead_id)
            .order_by(desc(ScoringDecision.created_at))
            .limit(1)
        )
        return self.session.scalar(stmt)

    def list_scored_leads(self) -> Sequence[Lead]:
        """Return leads that have at least one scoring decision."""

        stmt = (
            select(Lead)
            .where(Lead.latest_multimodal_score.is_not(None))
            .options(
                selectinload(Lead.behavior_events),
                selectinload(Lead.decisions),
                selectinload(Lead.feedback_entries),
            )
            .order_by(desc(Lead.last_scored_at))
        )
        return self.session.scalars(stmt).all()

    def list_historical_candidates(self, exclude_lead_id: int | None = None) -> Sequence[Lead]:
        """Return historical leads that can be used for similarity lookup."""

        stmt = (
            select(Lead)
            .where(Lead.historical_outcome.is_not(None))
            .options(selectinload(Lead.decisions))
        )
        if exclude_lead_id is not None:
            stmt = stmt.where(Lead.id != exclude_lead_id)
        return self.session.scalars(stmt).all()

    def record_feedback(
        self,
        lead_id: int,
        payload: FeedbackRequest,
        *,
        observed_action: str | None,
        observed_band: str | None,
    ) -> FeedbackOutcome:
        """Persist a feedback outcome for the target lead."""

        self.get_lead(lead_id)
        feedback = FeedbackOutcome(
            lead_id=lead_id,
            outcome=payload.outcome,
            reason=payload.reason,
            conversion_value=payload.conversion_value,
            observed_action=observed_action,
            observed_band=observed_band,
            salesperson_feedback=payload.salesperson_feedback,
        )
        self.session.add(feedback)
        self.session.commit()
        self.session.refresh(feedback)
        return feedback

    def list_feedback_for_lead(self, lead_id: int) -> Sequence[FeedbackOutcome]:
        """Return feedback history for a lead."""

        stmt = (
            select(FeedbackOutcome)
            .where(FeedbackOutcome.lead_id == lead_id)
            .order_by(desc(FeedbackOutcome.created_at))
        )
        return self.session.scalars(stmt).all()

    def list_feedback(self) -> Sequence[FeedbackOutcome]:
        """Return all feedback outcomes."""

        return self.session.scalars(
            select(FeedbackOutcome).order_by(desc(FeedbackOutcome.created_at))
        ).all()
