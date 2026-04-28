"""Strategy analytics routes."""

from fastapi import APIRouter, Depends

from app.api.deps import get_strategy_service
from app.schemas.dashboard import StrategyPerformanceResponse
from app.services.strategy_service import StrategyService

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("/performance", response_model=StrategyPerformanceResponse)
def get_strategy_performance(
    service: StrategyService = Depends(get_strategy_service),
) -> StrategyPerformanceResponse:
    """Return action performance and feedback-learning analytics."""

    return service.get_performance()

