"""FastAPI application entry point with lifespan management."""

from __future__ import annotations

import signal
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.database import engine
from app.infrastructure.middleware.error_handler import (
    DomainError,
    domain_error_handler,
    unhandled_exception_handler,
)
from app.infrastructure.middleware.request_logger import RequestLoggerMiddleware
from app.infrastructure.middleware.trace_id import TraceIDMiddleware
from app.infrastructure.models import Base
from app.infrastructure.routers import health_router, menu_router, order_router, sse_router, table_login_router

import logging

# Configure structlog
_LOG_LEVELS = {"DEBUG": 10, "INFO": 20, "WARNING": 30, "ERROR": 40, "CRITICAL": 50}

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        _LOG_LEVELS.get(settings.LOG_LEVEL.upper(), 20)
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager.

    Startup: Creates database tables with retry logic.
    Shutdown: Disposes the database engine.
    """
    import asyncio

    logger.info("application_starting", port=settings.APP_PORT)

    # Create tables on startup with retry for race conditions
    max_retries = 5
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("database_tables_created")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(
                    "database_init_retry",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e),
                    wait_seconds=wait_time,
                )
                await asyncio.sleep(wait_time)
            else:
                logger.error("database_init_failed", error=str(e))
                raise

    yield

    # Shutdown: dispose engine
    await engine.dispose()
    logger.info("application_shutdown_complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Table Order Service",
        description="Customer-facing order API for restaurant table ordering system",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Exception handlers
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Middleware (order matters - first added = outermost)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Trace-ID"],
    )
    app.add_middleware(RequestLoggerMiddleware)
    app.add_middleware(TraceIDMiddleware)

    # Routers
    app.include_router(health_router.router)
    app.include_router(menu_router.router)
    app.include_router(order_router.router)
    app.include_router(sse_router.router)
    app.include_router(table_login_router.router)

    return app


app = create_app()


def _handle_signal(signum: int, _frame) -> None:
    """Handle shutdown signals gracefully."""
    logger.info("shutdown_signal_received", signal=signal.Signals(signum).name)
    sys.exit(0)


# Register signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)
