"""Pytest fixtures for backend API tests."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    """Return a TestClient backed by an isolated SQLite database."""

    settings = Settings(
        database_url="sqlite://",
        demo_seed_on_startup=True,
        frontend_origin="http://localhost:5173",
    )
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client
