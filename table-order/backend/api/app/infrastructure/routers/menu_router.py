"""Menu router - public endpoints for browsing menus."""

from __future__ import annotations

import uuid
from collections import defaultdict
from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db
from app.infrastructure.models import MenuItemModel, StoreModel

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["menus"])


@router.get("/stores/{store_id}/menus")
async def get_store_menus(
    store_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get all menu items for a store, grouped by category.

    Args:
        store_id: The store UUID.
        db: Database session.

    Returns:
        Menu items grouped by category.
    """
    # Verify store exists
    store_result = await db.execute(select(StoreModel).where(StoreModel.id == store_id))
    store = store_result.scalar_one_or_none()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "STORE_NOT_FOUND", "message": f"Store {store_id} not found"},
        )

    # Fetch menu items
    result = await db.execute(
        select(MenuItemModel)
        .where(MenuItemModel.store_id == store_id)
        .order_by(MenuItemModel.category, MenuItemModel.name)
    )
    items = result.scalars().all()

    # Group by category
    categories: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        categories[item.category].append(
            {
                "id": str(item.id),
                "name": item.name,
                "price": item.price,
                "description": item.description,
                "category": item.category,
                "image_url": item.image_url,
                "is_sold_out": item.is_sold_out,
            }
        )

    return {
        "store_id": str(store_id),
        "categories": [
            {"name": category, "items": menu_items}
            for category, menu_items in categories.items()
        ],
    }


@router.get("/menus/{menu_id}")
async def get_menu_item(
    menu_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get a single menu item by ID.

    Args:
        menu_id: The menu item UUID.
        db: Database session.

    Returns:
        Menu item details.
    """
    result = await db.execute(select(MenuItemModel).where(MenuItemModel.id == menu_id))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MENU_ITEM_NOT_FOUND", "message": f"Menu item {menu_id} not found"},
        )

    return {
        "id": str(item.id),
        "store_id": str(item.store_id),
        "name": item.name,
        "price": item.price,
        "description": item.description,
        "category": item.category,
        "image_url": item.image_url,
        "is_sold_out": item.is_sold_out,
    }
