"""Store registration router - create new stores with admin accounts."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_db
from app.infrastructure.models import AdminModel, StoreModel

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/stores", tags=["stores"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class CreateStoreRequest(BaseModel):
    """Request body for store registration."""

    name: str
    store_slug: str
    admin_username: str
    admin_password: str


class CreateStoreResponse(BaseModel):
    """Response after successful store creation."""

    store_id: str
    store_slug: str
    name: str
    admin_id: str
    admin_username: str


@router.post("", response_model=CreateStoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    body: CreateStoreRequest,
    db: AsyncSession = Depends(get_db),
) -> CreateStoreResponse:
    """Register a new store with an admin account.

    Creates a store and its first admin user with a bcrypt-hashed password.

    Args:
        body: Store registration data.
        db: Database session.

    Returns:
        Created store and admin details.

    Raises:
        HTTPException: 409 if store_slug already exists.
    """
    # Check if store_slug already exists
    existing = await db.execute(
        select(StoreModel).where(StoreModel.store_slug == body.store_slug)
    )
    if existing.scalar_one_or_none():
        logger.warning("store_creation_conflict", store_slug=body.store_slug)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Store slug '{body.store_slug}' already exists",
        )

    # Create store
    store = StoreModel(
        name=body.name,
        store_slug=body.store_slug,
    )
    db.add(store)
    await db.flush()

    # Create admin with hashed password
    password_hash = pwd_context.hash(body.admin_password)
    admin = AdminModel(
        store_id=store.id,
        username=body.admin_username,
        password_hash=password_hash,
    )
    db.add(admin)
    await db.flush()

    logger.info(
        "store_created",
        store_id=str(store.id),
        store_slug=body.store_slug,
        admin_username=body.admin_username,
    )

    return CreateStoreResponse(
        store_id=str(store.id),
        store_slug=store.store_slug,
        name=store.name,
        admin_id=str(admin.id),
        admin_username=admin.username,
    )
