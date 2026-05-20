"""Table login router - resolve store slug + table number to IDs."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db
from app.infrastructure.models import StoreModel, TableModel, TableSessionModel

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["table-login"])


class TableLoginRequest(BaseModel):
    """Request to resolve store slug + table number."""

    store_slug: str
    table_number: int


@router.post("/table-login")
async def table_login(
    body: TableLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Resolve store slug and table number to UUIDs for client setup."""
    # Find store
    store_result = await db.execute(
        select(StoreModel).where(StoreModel.store_slug == body.store_slug)
    )
    store = store_result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    # Find table
    table_result = await db.execute(
        select(TableModel).where(
            TableModel.store_id == store.id,
            TableModel.table_number == body.table_number,
        )
    )
    table = table_result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    # Find active session if any
    session_result = await db.execute(
        select(TableSessionModel).where(
            TableSessionModel.table_id == table.id,
            TableSessionModel.store_id == store.id,
            TableSessionModel.status == "ACTIVE",
        )
    )
    session = session_result.scalar_one_or_none()

    return {
        "store_id": str(store.id),
        "table_id": str(table.id),
        "store_name": store.name,
        "table_number": table.table_number,
        "session_id": str(session.id) if session else None,
    }
