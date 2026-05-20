"""Global error handler middleware - catches exceptions and returns structured JSON."""

from __future__ import annotations

import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)


class DomainError(Exception):
    """Base class for domain-level errors."""

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(DomainError):
    """Resource not found error."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class ValidationError(DomainError):
    """Validation error."""

    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422)


class ConflictError(DomainError):
    """Conflict error."""

    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(code="CONFLICT", message=message, status_code=409)


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Handle domain errors and return structured JSON response."""
    trace_id = getattr(request.state, "trace_id", "unknown")

    logger.warning(
        "domain_error",
        code=exc.code,
        message=exc.message,
        trace_id=trace_id,
        path=request.url.path,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "trace_id": trace_id,
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions and return a generic error response."""
    trace_id = getattr(request.state, "trace_id", "unknown")

    logger.error(
        "unhandled_exception",
        error=str(exc),
        error_type=type(exc).__name__,
        trace_id=trace_id,
        path=request.url.path,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "trace_id": trace_id,
            }
        },
    )
