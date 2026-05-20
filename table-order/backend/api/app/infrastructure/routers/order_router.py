"""Order router - endpoints for creating and managing orders."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.value_objects.order_status import OrderStatus, can_transition_to
from app.infrastructure.database import get_db
from app.infrastructure.models import (
    IdempotencyKeyModel,
    MenuItemModel,
    OrderItemModel,
    OrderModel,
    TableModel,
    TableSessionModel,
)
from app.infrastructure.sse.broker import sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["orders"])


# --- Request/Response Schemas ---


class OrderItemRequest(BaseModel):
    """Schema for an item in an order creation request."""

    menu_item_id: str
    quantity: int = Field(ge=1)


class CreateOrderRequest(BaseModel):
    """Schema for creating a new order."""

    store_id: str
    table_id: str
    items: list[OrderItemRequest] = Field(min_length=1)


class OrderResponse(BaseModel):
    """Schema for order response."""

    id: str
    order_number: str
    store_id: str
    table_id: str
    session_id: str
    status: str
    total_amount: int
    items: list[dict[str, Any]]
    created_at: str
    updated_at: str


# --- Helper Functions ---


def _generate_order_number() -> str:
    """Generate a unique order number."""
    short_id = uuid.uuid4().hex[:8].upper()
    return f"ORD-{short_id}"


# --- Endpoints ---


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderRequest,
    x_idempotency_key: str = Header(..., alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Create a new order.

    Requires X-Idempotency-Key header to prevent duplicate orders.
    Validates that no menu items are sold out.
    Auto-creates a table session if none is active.
    """
    store_id = uuid.UUID(body.store_id)
    table_id = uuid.UUID(body.table_id)

    # Check idempotency key
    existing_key = await db.execute(
        select(IdempotencyKeyModel).where(IdempotencyKeyModel.key == x_idempotency_key)
    )
    if existing_key.scalar_one_or_none():
        # Return existing order for this idempotency key
        existing_order = await db.execute(
            select(OrderModel)
            .where(OrderModel.store_id == store_id, OrderModel.table_id == table_id)
            .order_by(OrderModel.created_at.desc())
            .limit(1)
        )
        order = existing_order.scalar_one_or_none()
        if order:
            return _format_order_response(order)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "IDEMPOTENCY_CONFLICT", "message": "Duplicate request detected"},
        )

    # Verify table exists
    table_result = await db.execute(select(TableModel).where(TableModel.id == table_id))
    table = table_result.scalar_one_or_none()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TABLE_NOT_FOUND", "message": f"Table {table_id} not found"},
        )

    # Validate menu items and check sold-out status
    menu_item_ids = [uuid.UUID(item.menu_item_id) for item in body.items]
    menu_result = await db.execute(
        select(MenuItemModel).where(MenuItemModel.id.in_(menu_item_ids))
    )
    menu_items = {str(m.id): m for m in menu_result.scalars().all()}

    # Check all items exist
    for item in body.items:
        if item.menu_item_id not in menu_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "MENU_ITEM_NOT_FOUND",
                    "message": f"Menu item {item.menu_item_id} not found",
                },
            )

    # Check sold-out items
    sold_out_items = [
        menu_items[item.menu_item_id].name
        for item in body.items
        if menu_items[item.menu_item_id].is_sold_out
    ]
    if sold_out_items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "MENU_ITEM_SOLD_OUT",
                "message": f"Sold out items: {', '.join(sold_out_items)}",
                "sold_out_items": sold_out_items,
            },
        )

    # Get or create active session
    session_result = await db.execute(
        select(TableSessionModel).where(
            TableSessionModel.table_id == table_id,
            TableSessionModel.store_id == store_id,
            TableSessionModel.status == "ACTIVE",
        )
    )
    session = session_result.scalar_one_or_none()

    if not session:
        session = TableSessionModel(
            id=uuid.uuid4(),
            table_id=table_id,
            store_id=store_id,
            status="ACTIVE",
            started_at=datetime.now(timezone.utc),
        )
        db.add(session)
        await db.flush()

    # Calculate total
    total_amount = sum(
        menu_items[item.menu_item_id].price * item.quantity for item in body.items
    )

    # Create order
    order_id = uuid.uuid4()
    order_number = _generate_order_number()

    order = OrderModel(
        id=order_id,
        order_number=order_number,
        store_id=store_id,
        table_id=table_id,
        session_id=session.id,
        status=OrderStatus.PENDING.value,
        total_amount=total_amount,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(order)

    # Create order items
    for item in body.items:
        menu_item = menu_items[item.menu_item_id]
        order_item = OrderItemModel(
            id=uuid.uuid4(),
            order_id=order_id,
            menu_item_id=uuid.UUID(item.menu_item_id),
            menu_name=menu_item.name,
            unit_price=menu_item.price,
            quantity=item.quantity,
        )
        db.add(order_item)

    # Store idempotency key
    idem_key = IdempotencyKeyModel(
        id=uuid.uuid4(),
        key=x_idempotency_key,
        store_id=store_id,
        table_id=table_id,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(idem_key)

    await db.flush()

    # Refresh to get relationships
    await db.refresh(order, ["items"])

    response = _format_order_response(order)

    # Publish SSE event
    await sse_broker.publish(
        store_id=str(store_id),
        event_type="order_created",
        data=response,
    )

    logger.info(
        "order_created",
        order_id=str(order_id),
        order_number=order_number,
        store_id=str(store_id),
        table_id=str(table_id),
        total_amount=total_amount,
    )

    return response


@router.get("/sessions/{session_id}/orders")
async def get_session_orders(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get all orders for a specific session.

    Args:
        session_id: The session UUID.
        db: Database session.

    Returns:
        List of orders for the session.
    """
    # Verify session exists
    session_result = await db.execute(
        select(TableSessionModel).where(TableSessionModel.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SESSION_NOT_FOUND", "message": f"Session {session_id} not found"},
        )

    # Fetch orders
    result = await db.execute(
        select(OrderModel)
        .where(OrderModel.session_id == session_id)
        .order_by(OrderModel.created_at.desc())
    )
    orders = result.scalars().all()

    return {
        "session_id": str(session_id),
        "orders": [_format_order_response(order) for order in orders],
    }


@router.patch("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Cancel a pending order.

    Only orders in PENDING status can be cancelled.

    Args:
        order_id: The order UUID.
        db: Database session.

    Returns:
        Updated order.
    """
    result = await db.execute(select(OrderModel).where(OrderModel.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": f"Order {order_id} not found"},
        )

    current_status = OrderStatus(order.status)
    if not can_transition_to(current_status, OrderStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_STATUS_TRANSITION",
                "message": f"Cannot cancel order in {order.status} status",
            },
        )

    order.status = OrderStatus.CANCELLED.value
    order.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(order, ["items"])

    response = _format_order_response(order)

    # Publish SSE event
    await sse_broker.publish(
        store_id=str(order.store_id),
        event_type="order_cancelled",
        data=response,
    )

    logger.info("order_cancelled", order_id=str(order_id), order_number=order.order_number)

    return response


def _format_order_response(order: OrderModel) -> dict[str, Any]:
    """Format an order model into a response dictionary."""
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "store_id": str(order.store_id),
        "table_id": str(order.table_id),
        "session_id": str(order.session_id),
        "status": order.status,
        "total_amount": order.total_amount,
        "items": [
            {
                "id": str(item.id),
                "menu_item_id": str(item.menu_item_id),
                "menu_name": item.menu_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
            }
            for item in order.items
        ],
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }
