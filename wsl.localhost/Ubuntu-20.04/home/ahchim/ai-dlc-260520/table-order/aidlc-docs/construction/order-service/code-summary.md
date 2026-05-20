# Order Service - Code Generation Summary

## Implementation Overview

| Component | Files | Lines (approx) |
|-----------|-------|-----------------|
| Domain Layer | 4 | ~120 |
| Application Layer | 2 | ~30 |
| Infrastructure Layer | 10 | ~600 |
| Total | 16 | ~750 |

## Key Design Patterns

- **Hexagonal Architecture**: Domain → Application → Infrastructure
- **Dependency Injection**: FastAPI Depends
- **Repository Pattern**: SQLAlchemy async repositories
- **Event-Driven**: SSE broker for real-time notifications
- **Idempotency**: UUID-based key with DB UNIQUE constraint

## API Endpoints Implemented

| Method | Path | Feature |
|--------|------|---------|
| GET | /api/v1/stores/{id}/menus | 카테고리별 메뉴 조회 |
| GET | /api/v1/menus/{id} | 메뉴 상세 |
| POST | /api/v1/orders | 주문 생성 (멱등성) |
| GET | /api/v1/sessions/{id}/orders | 세션별 주문 조회 |
| PATCH | /api/v1/orders/{id}/cancel | 주문 취소 |
| GET | /api/v1/sse/orders | SSE 스트림 |
| GET | /api/v1/healthz | Liveness |
| GET | /api/v1/readyz | Readiness |
