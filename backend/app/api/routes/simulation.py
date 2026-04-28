"""Simulation routes for threshold and action policy experiments."""

from fastapi import APIRouter, Depends

from app.api.deps import get_simulation_service
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/run", response_model=SimulationResponse)
def run_simulation(
    payload: SimulationRequest,
    service: SimulationService = Depends(get_simulation_service),
) -> SimulationResponse:
    """Run a comparative simulation against the current production strategy."""

    return service.run_simulation(payload)
