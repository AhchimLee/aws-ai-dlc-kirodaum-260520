"""JWT authentication dependency for protected routes."""

from __future__ import annotations

from dataclasses import dataclass

import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

logger = structlog.get_logger(__name__)

security = HTTPBearer()


@dataclass
class AuthClaims:
    """Authenticated admin claims extracted from JWT."""

    admin_id: str
    store_id: str
    username: str


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthClaims:
    """FastAPI dependency that validates JWT and returns admin claims.

    Extracts Bearer token from Authorization header, decodes JWT using
    python-jose, validates expiry, and returns admin_id and store_id from claims.

    Args:
        credentials: HTTP Bearer token from Authorization header.

    Returns:
        AuthClaims with admin_id, store_id, and username.

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except JWTError as e:
        logger.warning("jwt_decode_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id = payload.get("admin_id")
    store_id = payload.get("store_id")
    username = payload.get("username")

    if not admin_id or not store_id or not username:
        logger.warning("jwt_missing_claims", payload_keys=list(payload.keys()))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthClaims(admin_id=admin_id, store_id=store_id, username=username)
