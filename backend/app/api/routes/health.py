"""Health and connectivity routes."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.api.deps import get_settings_dependency
from app.core.config import Settings
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def get_health(
    settings: Settings = Depends(get_settings_dependency),
) -> HealthResponse:
    """Return backend health and live-mode connection metadata."""

    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        api_prefix=settings.api_prefix,
        backend_url="http://127.0.0.1:8000",
        database_url=settings.database_url,
        seeded_demo_mode=settings.demo_seed_on_startup,
        checked_at=datetime.now(UTC).replace(tzinfo=None),
    )
