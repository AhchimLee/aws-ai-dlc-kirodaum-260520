"""SSE router - Server-Sent Events stream for real-time order updates."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Query
from starlette.requests import Request
from starlette.responses import StreamingResponse

from app.infrastructure.sse.broker import SSEEvent, sse_broker

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["sse"])

HEARTBEAT_INTERVAL_SECONDS = 30


@router.get("/sse/orders")
async def sse_orders(
    request: Request,
    store_id: str = Query(..., description="Store ID to subscribe to"),
) -> StreamingResponse:
    """SSE stream for real-time order updates.

    Sends heartbeat every 30 seconds to keep connection alive.
    Publishes order_created, order_cancelled, and other order events.

    Args:
        request: The incoming request.
        store_id: The store to subscribe to.

    Returns:
        StreamingResponse with text/event-stream content type.
    """

    async def event_generator():
        queue = await sse_broker.subscribe(store_id)
        try:
            # Send initial connection event
            connect_event = SSEEvent(
                event_type="connected",
                data={"store_id": store_id, "message": "SSE connection established"},
            )
            yield connect_event.format()

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for event with timeout for heartbeat
                    event = await asyncio.wait_for(
                        queue.get(), timeout=HEARTBEAT_INTERVAL_SECONDS
                    )
                    if event is None:
                        break
                    yield event.format()
                except asyncio.TimeoutError:
                    # Send heartbeat
                    heartbeat_data = json.dumps(
                        {"type": "heartbeat", "timestamp": datetime.now(timezone.utc).isoformat()}
                    )
                    yield f": heartbeat\ndata: {heartbeat_data}\n\n"

        except asyncio.CancelledError:
            pass
        finally:
            await sse_broker.unsubscribe(store_id, queue)
            logger.info("sse_client_disconnected", store_id=store_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
