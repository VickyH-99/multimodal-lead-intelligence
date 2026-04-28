"""Schemas for service health and live-mode connectivity."""

from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Operational health payload for live backend verification."""

    status: str
    app_name: str
    api_prefix: str
    backend_url: str
    database_url: str
    seeded_demo_mode: bool
    checked_at: datetime
