"""Table session domain entity."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class SessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


@dataclass
class TableSession:
    """Represents an active table session for ordering."""

    id: uuid.UUID = field(default_factory=uuid.uuid4)
    table_id: uuid.UUID | None = None
    store_id: uuid.UUID | None = None
    status: SessionStatus = SessionStatus.ACTIVE
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: datetime | None = None
