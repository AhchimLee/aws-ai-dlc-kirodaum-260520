"""Order domain entity."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.domain.value_objects.order_status import OrderStatus


@dataclass
class OrderItem:
    """Represents a single item within an order."""

    id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID | None = None
    menu_item_id: uuid.UUID | None = None
    menu_name: str = ""
    unit_price: int = 0
    quantity: int = 1


@dataclass
class Order:
    """Order aggregate root."""

    id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_number: str = ""
    store_id: uuid.UUID | None = None
    table_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    status: OrderStatus = OrderStatus.PENDING
    total_amount: int = 0
    items: list[OrderItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict[str, Any]:
        """Convert order to dictionary representation."""
        return {
            "id": str(self.id),
            "order_number": self.order_number,
            "store_id": str(self.store_id) if self.store_id else None,
            "table_id": str(self.table_id) if self.table_id else None,
            "session_id": str(self.session_id) if self.session_id else None,
            "status": self.status.value,
            "total_amount": self.total_amount,
            "items": [
                {
                    "id": str(item.id),
                    "menu_item_id": str(item.menu_item_id) if item.menu_item_id else None,
                    "menu_name": item.menu_name,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                }
                for item in self.items
            ],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
