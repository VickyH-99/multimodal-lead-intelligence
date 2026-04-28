"""FastAPI dependency providers."""

from collections.abc import Generator

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.session import database
from app.services.dashboard_service import DashboardService
from app.services.lead_service import LeadService
from app.services.simulation_service import SimulationService
from app.services.strategy_service import StrategyService


def get_settings_dependency(request: Request) -> Settings:
    """Return the app-level settings object."""

    return request.app.state.settings


def get_db_session() -> Generator[Session, None, None]:
    """Yield a configured SQLAlchemy session."""

    yield from database.session()


def get_lead_service(
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> LeadService:
    """Provide the lead service dependency."""

    return LeadService(session, settings)


def get_dashboard_service(
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> DashboardService:
    """Provide the dashboard service dependency."""

    return DashboardService(session, settings)


def get_strategy_service(
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> StrategyService:
    """Provide the strategy analytics service dependency."""

    return StrategyService(session, settings)


def get_simulation_service(
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings_dependency),
) -> SimulationService:
    """Provide the simulation service dependency."""

    return SimulationService(session, settings)

