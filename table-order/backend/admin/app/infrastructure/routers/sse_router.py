"""SSE router - real-time order monitoring for admin dashboard."""

from __future__ import annotations

import asyncio

import structlog
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.infrastructure.middleware.jwt_auth import AuthClaims, get_current_admin
from app.infrastructure.sse.broker import sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin/api/v1/sse", tags=["sse"])


@router.get("/orders")
async def stream_orders(
    admin: AuthClaims = Depends(get_current_admin),
) -> StreamingResponse:
    """SSE endpoint for real-time order monitoring.

    Streams order events (created, status changed, etc.) for the admin's store.

    Args:
        admin: Authenticated admin claims.

    Returns:
        StreamingResponse with SSE content type.
    """
    store_id = admin.store_id

    async def event_generator():
        queue = await sse_broker.subscribe(store_id)
        try:
            # Send initial connection event
            yield "event: connected\ndata: {\"status\": \"connected\"}\n\n"

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    if event is None:
                        break
                    yield event.format()
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await sse_broker.unsubscribe(store_id, queue)
            logger.info("sse_stream_closed", store_id=store_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
