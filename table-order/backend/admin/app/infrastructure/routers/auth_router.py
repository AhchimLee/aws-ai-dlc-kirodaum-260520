"""Authentication router - admin login with JWT token generation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.database import get_db
from app.infrastructure.models import AdminModel, StoreModel

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    """Login request body."""

    store_slug: str
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response with JWT token."""

    token: str
    admin_id: str
    store_id: str
    expires_at: str


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """Authenticate admin and return JWT token.

    Args:
        body: Login credentials (store_slug, username, password).
        db: Database session.

    Returns:
        JWT token with admin claims.

    Raises:
        HTTPException: 401 if credentials are invalid.
    """
    # Find store by slug
    store_result = await db.execute(
        select(StoreModel).where(StoreModel.store_slug == body.store_slug)
    )
    store = store_result.scalar_one_or_none()

    if not store:
        logger.warning("login_failed_store_not_found", store_slug=body.store_slug)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Find admin by username and store
    admin_result = await db.execute(
        select(AdminModel).where(
            AdminModel.store_id == store.id,
            AdminModel.username == body.username,
        )
    )
    admin = admin_result.scalar_one_or_none()

    if not admin:
        logger.warning("login_failed_admin_not_found", username=body.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Verify password
    if not pwd_context.verify(body.password, admin.password_hash):
        logger.warning("login_failed_invalid_password", username=body.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Generate JWT
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    claims = {
        "admin_id": str(admin.id),
        "store_id": str(store.id),
        "username": admin.username,
        "exp": expires_at,
    }
    token = jwt.encode(claims, settings.JWT_SECRET, algorithm="HS256")

    logger.info("login_success", admin_id=str(admin.id), store_id=str(store.id))

    return LoginResponse(
        token=token,
        admin_id=str(admin.id),
        store_id=str(store.id),
        expires_at=expires_at.isoformat(),
    )
