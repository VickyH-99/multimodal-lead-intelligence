"""Executive dashboard routes."""

from fastapi import APIRouter, Depends

from app.api.deps import get_dashboard_service
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardSummaryResponse:
    """Return executive dashboard aggregates."""

    return service.get_summary()

