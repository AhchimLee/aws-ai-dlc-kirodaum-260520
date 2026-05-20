"""Order status value object with valid state transitions."""

from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


VALID_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.REJECTED],
    OrderStatus.PREPARING: [OrderStatus.COMPLETED],
}


def can_transition_to(current: OrderStatus, target: OrderStatus) -> bool:
    """Check if a status transition is valid."""
    return target in VALID_TRANSITIONS.get(current, [])
