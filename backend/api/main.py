"""
FastAPI application entrypoint.

This module initializes the API server, sets up middleware, routers, and
lifespan events. It is production-ready with CORS, health checks, and
structured logging. Environment-based configuration is supported via
`backend/api/config.py`.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

# Routers
from backend.app.auth import router as auth_router
from backend.app.market_data import router as market_router
from backend.app.trading import router as trading_router
from backend.app.portfolio import router as portfolio_router
from backend.app.strategies import router as strategies_router
# Broker router is optional if MT5 connector not available; import guarded below
try:
    from backend.app.broker import router as broker_router  # type: ignore
except Exception:  # pragma: no cover - broker may not import without MT5
    broker_router = None  # type: ignore


def _configure_logging() -> None:
    """Configure structured logging for the API process.

    In production, respect LOG_LEVEL; default to INFO.
    """
    log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level_name, logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """App lifespan context for startup/shutdown hooks."""
    logger = logging.getLogger("api.lifespan")
    logger.info("Starting API service")
    try:
        # Placeholders for initializing shared resources (DB pools, brokers, etc.)
        yield
    finally:
        logger.info("Shutting down API service")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance.

    Returns:
        FastAPI: Configured application.
    """
    _configure_logging()

    app = FastAPI(
        title="Trades Backend API",
        version=os.getenv("API_VERSION", "1.0.0"),
        docs_url=os.getenv("DOCS_URL", "/docs"),
        redoc_url=os.getenv("REDOC_URL", "/redoc"),
        lifespan=lifespan,
    )

    # CORS for frontend origin(s)
    allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed_origins if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["system"])  # Simple health endpoint for probes
    async def healthz() -> JSONResponse:
        return JSONResponse({"status": "ok"})

    # Mount feature routers
    app.include_router(auth_router)
    app.include_router(market_router)
    app.include_router(trading_router)
    app.include_router(portfolio_router)
    app.include_router(strategies_router)
    if broker_router is not None:
        app.include_router(broker_router)

    return app


app = create_app()


if __name__ == "__main__":
    # Allow running via: python -m backend.api.main
    import uvicorn

    uvicorn.run(
        "backend.api.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )


