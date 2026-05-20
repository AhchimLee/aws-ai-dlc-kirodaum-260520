"""Order management router - view and manage orders (protected)."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.value_objects.order_status import OrderStatus, can_transition_to
from app.infrastructure.database import get_db
from app.infrastructure.middleware.jwt_auth import AuthClaims, get_current_admin
from app.infrastructure.models import OrderModel
from app.infrastructure.sse.broker import sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/orders", tags=["orders"])


class OrderItemResponse(BaseModel):
    """Order item in response."""

    id: str
    menu_item_id: str
    menu_name: str
    unit_price: int
    quantity: int


class OrderResponse(BaseModel):
    """Order response."""

    id: str
    order_number: str
    store_id: str
    table_id: str
    session_id: str
    status: str
    total_amount: int
    items: list[OrderItemResponse]
    created_at: str
    updated_at: str


class UpdateStatusRequest(BaseModel):
    """Request body for status change."""

    status: str


def _to_response(order: OrderModel) -> OrderResponse:
    """Convert an OrderModel to a response."""
    return OrderResponse(
        id=str(order.id),
        order_number=order.order_number,
        store_id=str(order.store_id),
        table_id=str(order.table_id),
        session_id=str(order.session_id),
        status=order.status,
        total_amount=order.total_amount,
        items=[
            OrderItemResponse(
                id=str(item.id),
                menu_item_id=str(item.menu_item_id),
                menu_name=item.menu_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
            )
            for item in order.items
        ],
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat(),
    )


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[OrderResponse]:
    """List all orders for the admin's store.

    Args:
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        List of orders with items.
    """
    result = await db.execute(
        select(OrderModel)
        .where(OrderModel.store_id == admin.store_id)
        .order_by(OrderModel.created_at.desc())
    )
    orders = result.scalars().unique().all()
    return [_to_response(order) for order in orders]


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    body: UpdateStatusRequest,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """Change order status following the state machine.

    Valid transitions: PENDING→PREPARING→COMPLETED

    Args:
        order_id: Order ID.
        body: New status.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Updated order.

    Raises:
        HTTPException: 404 if order not found, 422 if invalid transition.
    """
    result = await db.execute(
        select(OrderModel).where(
            OrderModel.id == order_id,
            OrderModel.store_id == admin.store_id,
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    try:
        current_status = OrderStatus(order.status)
        target_status = OrderStatus(body.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status: {body.status}",
        )

    if not can_transition_to(current_status, target_status):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transition from {current_status.value} to {target_status.value}",
        )

    order.status = target_status.value
    await db.flush()
    await db.refresh(order)

    logger.info(
        "order_status_updated",
        order_id=order_id,
        from_status=current_status.value,
        to_status=target_status.value,
        store_id=admin.store_id,
    )

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="order_status_changed",
        data={
            "order_id": str(order.id),
            "order_number": order.order_number,
            "from_status": current_status.value,
            "to_status": target_status.value,
        },
    )

    return _to_response(order)


@router.patch("/{order_id}/reject", response_model=OrderResponse)
async def reject_order(
    order_id: str,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """Reject a pending order.

    Only PENDING orders can be rejected.

    Args:
        order_id: Order ID.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Updated order with REJECTED status.

    Raises:
        HTTPException: 404 if order not found, 422 if not in PENDING status.
    """
    result = await db.execute(
        select(OrderModel).where(
            OrderModel.id == order_id,
            OrderModel.store_id == admin.store_id,
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    current_status = OrderStatus(order.status)
    if current_status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot reject order in {current_status.value} status",
        )

    order.status = OrderStatus.REJECTED.value
    await db.flush()
    await db.refresh(order)

    logger.info(
        "order_rejected",
        order_id=order_id,
        store_id=admin.store_id,
    )

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="order_status_changed",
        data={
            "order_id": str(order.id),
            "order_number": order.order_number,
            "from_status": OrderStatus.PENDING.value,
            "to_status": OrderStatus.REJECTED.value,
        },
    )

    return _to_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an order.

    Args:
        order_id: Order ID.
        admin: Authenticated admin claims.
        db: Database session.

    Raises:
        HTTPException: 404 if order not found.
    """
    result = await db.execute(
        select(OrderModel).where(
            OrderModel.id == order_id,
            OrderModel.store_id == admin.store_id,
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    await db.delete(order)
    await db.flush()

    logger.info("order_deleted", order_id=order_id, store_id=admin.store_id)
