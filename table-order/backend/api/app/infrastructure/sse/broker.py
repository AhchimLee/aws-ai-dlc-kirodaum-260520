"""In-memory SSE event broker using asyncio.Queue per subscription."""

from __future__ import annotations

import asyncio
import json
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class SSEEvent:
    """Represents a Server-Sent Event."""

    event_type: str
    data: dict[str, Any]
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def format(self) -> str:
        """Format as SSE wire protocol."""
        payload = {
            "type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        lines = [
            f"id: {self.id}",
            f"event: {self.event_type}",
            f"data: {json.dumps(payload, ensure_ascii=False)}",
            "",
            "",
        ]
        return "\n".join(lines)


class SSEBroker:
    """In-memory SSE event broker with per-store subscriptions."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[SSEEvent | None]]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def subscribe(self, store_id: str) -> asyncio.Queue[SSEEvent | None]:
        """Subscribe to events for a specific store.

        Args:
            store_id: The store to subscribe to.

        Returns:
            An asyncio.Queue that will receive SSEEvent objects.
        """
        queue: asyncio.Queue[SSEEvent | None] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers[store_id].append(queue)
        logger.info("sse_subscriber_added", store_id=store_id)
        return queue

    async def unsubscribe(self, store_id: str, queue: asyncio.Queue[SSEEvent | None]) -> None:
        """Remove a subscription.

        Args:
            store_id: The store to unsubscribe from.
            queue: The queue to remove.
        """
        async with self._lock:
            subscribers = self._subscribers.get(store_id, [])
            if queue in subscribers:
                subscribers.remove(queue)
            if not subscribers:
                self._subscribers.pop(store_id, None)
        logger.info("sse_subscriber_removed", store_id=store_id)

    async def publish(self, store_id: str, event_type: str, data: dict[str, Any]) -> None:
        """Publish an event to all subscribers of a store.

        Args:
            store_id: The store to publish to.
            event_type: The type of event (e.g., 'order_created').
            data: The event payload.
        """
        event = SSEEvent(event_type=event_type, data=data)
        async with self._lock:
            subscribers = self._subscribers.get(store_id, [])
            dead_queues: list[asyncio.Queue[SSEEvent | None]] = []
            for queue in subscribers:
                try:
                    queue.put_nowait(event)
                except asyncio.QueueFull:
                    dead_queues.append(queue)
                    logger.warning("sse_queue_full", store_id=store_id)

            for dead in dead_queues:
                subscribers.remove(dead)

        logger.info("sse_event_published", store_id=store_id, event_type=event_type)


# Global broker singleton
sse_broker = SSEBroker()
