"""Lead scoring and lead retrieval routes."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_lead_service
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.schemas.lead import DecisionPackage, LeadDetailResponse, LeadListItem, LeadScoreRequest
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("/score", response_model=DecisionPackage)
def score_lead(
    payload: LeadScoreRequest,
    service: LeadService = Depends(get_lead_service),
) -> DecisionPackage:
    """Score a new or existing lead with the full multi-agent pipeline."""

    return service.score_lead(payload)


@router.get("", response_model=list[LeadListItem])
def list_leads(
    q: str | None = Query(default=None),
    score_band: str | None = Query(default=None),
    action: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    service: LeadService = Depends(get_lead_service),
) -> list[LeadListItem]:
    """Return lead rows for the intelligence workbench."""

    return service.list_leads(query=q, score_band=score_band, action=action, status=status, limit=limit)


@router.get("/{lead_id}", response_model=LeadDetailResponse)
def get_lead(
    lead_id: int,
    service: LeadService = Depends(get_lead_service),
) -> LeadDetailResponse:
    """Return detailed lead intelligence for a single lead."""

    return service.get_lead_detail(lead_id)


@router.post("/{lead_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    lead_id: int,
    payload: FeedbackRequest,
    service: LeadService = Depends(get_lead_service),
) -> FeedbackResponse:
    """Record observed outcomes and return feedback-learning guidance."""

    return service.record_feedback(lead_id, payload)

