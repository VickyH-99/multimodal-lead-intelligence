"""Agent health and orchestration routes."""

from fastapi import APIRouter, Depends

from app.api.deps import get_dashboard_service
from app.schemas.dashboard import AgentStatusResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/status", response_model=AgentStatusResponse)
def get_agent_status(
    service: DashboardService = Depends(get_dashboard_service),
) -> AgentStatusResponse:
    """Return specialist-agent health and telemetry snapshots."""

    return service.get_agent_status()

