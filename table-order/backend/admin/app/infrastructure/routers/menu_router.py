"""Menu CRUD router - manage menu items for a store (protected)."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db
from app.infrastructure.middleware.jwt_auth import AuthClaims, get_current_admin
from app.infrastructure.models import MenuItemModel
from app.infrastructure.sse.broker import sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/menus", tags=["menus"])


class CreateMenuItemRequest(BaseModel):
    """Request body for creating a menu item."""

    name: str = Field(..., min_length=1)
    price: int = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    description: str = ""
    image_url: str = ""


class UpdateMenuItemRequest(BaseModel):
    """Request body for updating a menu item."""

    name: str | None = Field(None, min_length=1)
    price: int | None = Field(None, gt=0)
    category: str | None = Field(None, min_length=1)
    description: str | None = None
    image_url: str | None = None


class SoldOutRequest(BaseModel):
    """Request body for toggling sold-out status."""

    is_sold_out: bool


class MenuItemResponse(BaseModel):
    """Menu item response."""

    id: str
    name: str
    price: int
    category: str
    description: str
    image_url: str
    is_sold_out: bool
    created_at: str
    updated_at: str


def _to_response(item: MenuItemModel) -> MenuItemResponse:
    """Convert a MenuItemModel to a response."""
    return MenuItemResponse(
        id=str(item.id),
        name=item.name,
        price=item.price,
        category=item.category,
        description=item.description or "",
        image_url=item.image_url or "",
        is_sold_out=item.is_sold_out,
        created_at=item.created_at.isoformat(),
        updated_at=item.updated_at.isoformat(),
    )


@router.get("", response_model=list[MenuItemResponse])
async def list_menus(
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[MenuItemResponse]:
    """List all menu items for the admin's store.

    Args:
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        List of menu items.
    """
    result = await db.execute(
        select(MenuItemModel)
        .where(MenuItemModel.store_id == admin.store_id)
        .order_by(MenuItemModel.category, MenuItemModel.name)
    )
    items = result.scalars().all()
    return [_to_response(item) for item in items]


@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    body: CreateMenuItemRequest,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Create a new menu item.

    Args:
        body: Menu item data.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Created menu item.
    """
    item = MenuItemModel(
        store_id=admin.store_id,
        name=body.name,
        price=body.price,
        category=body.category,
        description=body.description,
        image_url=body.image_url,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    logger.info("menu_item_created", menu_id=str(item.id), store_id=admin.store_id)

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="menu_updated",
        data={"action": "created", "menu_id": str(item.id), "name": item.name},
    )

    return _to_response(item)


@router.put("/{menu_id}", response_model=MenuItemResponse)
async def update_menu_item(
    menu_id: str,
    body: UpdateMenuItemRequest,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Update an existing menu item.

    Args:
        menu_id: Menu item ID.
        body: Fields to update.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Updated menu item.

    Raises:
        HTTPException: 404 if menu item not found.
    """
    result = await db.execute(
        select(MenuItemModel).where(
            MenuItemModel.id == menu_id,
            MenuItemModel.store_id == admin.store_id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    if body.name is not None:
        item.name = body.name
    if body.price is not None:
        item.price = body.price
    if body.category is not None:
        item.category = body.category
    if body.description is not None:
        item.description = body.description
    if body.image_url is not None:
        item.image_url = body.image_url

    await db.flush()
    await db.refresh(item)

    logger.info("menu_item_updated", menu_id=menu_id, store_id=admin.store_id)

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="menu_updated",
        data={"action": "updated", "menu_id": str(item.id), "name": item.name},
    )

    return _to_response(item)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    menu_id: str,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a menu item.

    Args:
        menu_id: Menu item ID.
        admin: Authenticated admin claims.
        db: Database session.

    Raises:
        HTTPException: 404 if menu item not found.
    """
    result = await db.execute(
        select(MenuItemModel).where(
            MenuItemModel.id == menu_id,
            MenuItemModel.store_id == admin.store_id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    await db.delete(item)
    await db.flush()

    logger.info("menu_item_deleted", menu_id=menu_id, store_id=admin.store_id)

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="menu_updated",
        data={"action": "deleted", "menu_id": menu_id},
    )


@router.patch("/{menu_id}/sold-out", response_model=MenuItemResponse)
async def toggle_sold_out(
    menu_id: str,
    body: SoldOutRequest,
    admin: AuthClaims = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MenuItemResponse:
    """Toggle the sold-out status of a menu item.

    Args:
        menu_id: Menu item ID.
        body: Sold-out toggle request.
        admin: Authenticated admin claims.
        db: Database session.

    Returns:
        Updated menu item.

    Raises:
        HTTPException: 404 if menu item not found.
    """
    result = await db.execute(
        select(MenuItemModel).where(
            MenuItemModel.id == menu_id,
            MenuItemModel.store_id == admin.store_id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    item.is_sold_out = body.is_sold_out
    await db.flush()
    await db.refresh(item)

    logger.info(
        "menu_item_sold_out_toggled",
        menu_id=menu_id,
        is_sold_out=body.is_sold_out,
        store_id=admin.store_id,
    )

    await sse_broker.publish(
        store_id=admin.store_id,
        event_type="menu_updated",
        data={
            "action": "sold_out_toggled",
            "menu_id": str(item.id),
            "name": item.name,
            "is_sold_out": item.is_sold_out,
        },
    )

    return _to_response(item)
