"""Read-oriented repository for analytics, dashboards, and simulation."""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import FeedbackOutcome, Lead


class AnalyticsRepository:
    """Repository focused on loading pre-joined analytics datasets."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def fetch_scored_leads_with_relations(self) -> Sequence[Lead]:
        """Return all scored leads with decisions, events, and feedback."""

        stmt = (
            select(Lead)
            .where(Lead.latest_multimodal_score.is_not(None))
            .options(
                selectinload(Lead.behavior_events),
                selectinload(Lead.decisions),
                selectinload(Lead.feedback_entries),
            )
        )
        return self.session.scalars(stmt).all()

    def fetch_feedback_entries(self) -> Sequence[FeedbackOutcome]:
        """Return all feedback entries for feedback-learning analytics."""

        return self.session.scalars(select(FeedbackOutcome)).all()
