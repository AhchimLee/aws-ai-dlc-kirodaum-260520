"""Menu item domain entity."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone


class MenuItemValidationError(Exception):
    """Raised when menu item validation fails."""

    pass


@dataclass
class MenuItem:
    """Menu item entity representing a dish or product."""

    id: uuid.UUID = field(default_factory=uuid.uuid4)
    store_id: uuid.UUID | None = None
    name: str = ""
    price: int = 0
    description: str = ""
    category: str = ""
    image_url: str = ""
    is_sold_out: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def validate(self) -> None:
        """Validate menu item business rules.

        Raises:
            MenuItemValidationError: If validation fails.
        """
        errors: list[str] = []

        if not self.name or not self.name.strip():
            errors.append("Menu item name must not be empty")

        if self.price <= 0:
            errors.append("Menu item price must be greater than 0")

        if not self.category or not self.category.strip():
            errors.append("Menu item category must not be empty")

        if errors:
            raise MenuItemValidationError("; ".join(errors))
