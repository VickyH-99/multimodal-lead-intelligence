"""FastAPI entrypoint for the Multimodal Lead Intelligence Agent Platform."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, dashboard, health, leads, simulation, strategies
from app.core.config import Settings, get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.db.seed import seed_database
from app.db.session import database


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application."""

    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings.log_level)
    logger = get_logger(__name__)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database.configure(resolved_settings.database_url)
        database.create_all()
        if resolved_settings.demo_seed_on_startup:
            for session in database.session():
                seed_database(session, resolved_settings)
        logger.info("Application startup complete.")
        yield
        logger.info("Application shutdown complete.")

    app = FastAPI(
        title=resolved_settings.app_name,
        version="0.1.0",
        debug=resolved_settings.debug,
        openapi_url=f"{resolved_settings.api_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    app.state.settings = resolved_settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(
            {
                resolved_settings.frontend_origin,
                "http://127.0.0.1:5173",
                "http://localhost:5173",
            }
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    api_router = APIRouter(prefix=resolved_settings.api_prefix)
    api_router.include_router(leads.router)
    api_router.include_router(dashboard.router)
    api_router.include_router(agents.router)
    api_router.include_router(strategies.router)
    api_router.include_router(simulation.router)
    api_router.include_router(health.router)
    app.include_router(api_router)

    @app.get("/", tags=["meta"])
    def root() -> dict[str, str]:
        """Return a basic application status payload."""

        return {
            "name": resolved_settings.app_name,
            "docs": "/docs",
            "openapi": f"{resolved_settings.api_prefix}/openapi.json",
        }

    return app


app = create_app()


def run() -> None:
    """Run the local FastAPI development server."""

    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    run()
