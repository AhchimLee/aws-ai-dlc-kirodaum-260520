"""Router modules for Admin Service."""

from app.infrastructure.routers import (
    auth_router,
    health_router,
    menu_router,
    order_router,
    session_router,
    sse_router,
    store_router,
)

__all__ = [
    "auth_router",
    "health_router",
    "menu_router",
    "order_router",
    "session_router",
    "sse_router",
    "store_router",
]
