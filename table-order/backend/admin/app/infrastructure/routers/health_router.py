"""Health check router - liveness and readiness probes."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1", tags=["health"])


@router.get("/healthz")
async def liveness() -> dict[str, str]:
    """Liveness probe - always returns 200 if the process is running.

    Returns:
        Simple status response.
    """
    return {"status": "ok"}


@router.get("/readyz")
async def readiness(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Readiness probe - checks database connectivity.

    Args:
        db: Database session.

    Returns:
        Status response with database check result.
    """
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error("readiness_check_failed", error=str(e))
        return {"status": "not_ready", "database": "disconnected"}
