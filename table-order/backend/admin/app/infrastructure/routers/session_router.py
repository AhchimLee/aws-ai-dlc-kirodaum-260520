"""Table session management router - close sessions and view history (protected)."""

from __future__ import annotations

from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db
from app.infrastructure.middleware.jwt_auth import AuthClaims, get_current_admin
from app.infrastructure.models import OrderModel, TableSessionModel
from app.infrastructure.sse.broker import sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/sessions", tags=["sessions"])


class SessionResponse(BaseModel):
    """Table session response."""

    id: str
    table_id: str
    store_id: str
    status: str
    started_at: str
    closed_at: str | None


class SessionOrderItemResponse(BaseModel):
    """Order item in session history."""

    id: str
    menu_name: str
    unit_price: int
    quantity: int


class SessionOrderResponse(BaseModel):
    """Order in session history."""

    id: str
    order_number: str
    status: str
    total_amount: int
    items: list[SessionOrderItemResponse]
    created_at: str


class SessionHistoryResponse(BaseModel):
    """Session with orders for history view."""

    session: SessionResponse
    orders: list[SessionOrderResponse]


@router.post("/{table_id}/close", response_model=SessionResponse)
async def close_session(
    table_id: str,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Close the active session for a table.

    Args:
        table_id: Table ID.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Closed session details.

    Raises:
        HTTPException: 404 if no active session found.
    """
    result = await db.execute(
        select(TableSessionModel).where(
            TableSessionModel.table_id == table_id,
            TableSessionModel.store_id == admin.store_id,
            TableSessionModel.status == "ACTIVE",
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found for this table",
        )

    session.status = "CLOSED"
    session.closed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(session)

    logger.info(
        "session_closed",
        session_id=str(session.id),
        table_id=table_id,
        store_id=admin.store_id,
    )

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="session_closed",
        data={
            "session_id": str(session.id),
            "table_id": table_id,
        },
    )

    return SessionResponse(
        id=str(session.id),
        table_id=str(session.table_id),
        store_id=str(session.store_id),
        status=session.status,
        started_at=session.started_at.isoformat(),
        closed_at=session.closed_at.isoformat() if session.closed_at else None,
    )


@router.get("/{table_id}/history", response_model=list[SessionHistoryResponse])
async def get_session_history(
    table_id: str,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[SessionHistoryResponse]:
    """Get past sessions with orders for a table.

    Args:
        table_id: Table ID.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        List of sessions with their orders.
    """
    # Get all sessions for this table
    sessions_result = await db.execute(
        select(TableSessionModel)
        .where(
            TableSessionModel.table_id == table_id,
            TableSessionModel.store_id == admin.store_id,
        )
        .order_by(TableSessionModel.started_at.desc())
    )
    sessions = sessions_result.scalars().all()

    history: list[SessionHistoryResponse] = []

    for session in sessions:
        # Get orders for this session
        orders_result = await db.execute(
            select(OrderModel)
            .where(OrderModel.session_id == session.id)
            .order_by(OrderModel.created_at.desc())
        )
        orders = orders_result.scalars().unique().all()

        session_response = SessionResponse(
            id=str(session.id),
            table_id=str(session.table_id),
            store_id=str(session.store_id),
            status=session.status,
            started_at=session.started_at.isoformat(),
            closed_at=session.closed_at.isoformat() if session.closed_at else None,
        )

        order_responses = [
            SessionOrderResponse(
                id=str(order.id),
                order_number=order.order_number,
                status=order.status,
                total_amount=order.total_amount,
                items=[
                    SessionOrderItemResponse(
                        id=str(item.id),
                        menu_name=item.menu_name,
                        unit_price=item.unit_price,
                        quantity=item.quantity,
                    )
                    for item in order.items
                ],
                created_at=order.created_at.isoformat(),
            )
            for order in orders
        ]

        history.append(
            SessionHistoryResponse(session=session_response, orders=order_responses)
        )

    return history
