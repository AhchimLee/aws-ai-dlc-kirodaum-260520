# Admin Service - Code Generation Summary

## Implementation Overview

| Component | Files | Lines (approx) |
|-----------|-------|-----------------|
| Domain Layer | 2 | ~60 |
| Infrastructure Layer | 12 | ~800 |
| Total | 14 | ~860 |

## Key Design Patterns

- **JWT Authentication**: python-jose HS256, 16-hour expiry
- **Password Hashing**: passlib bcrypt (never plaintext)
- **State Machine**: Order status transitions enforced in domain layer
- **SSE Broadcasting**: Real-time order updates to admin clients

## API Endpoints Implemented

| Method | Path | Feature |
|--------|------|---------|
| POST | /admin/api/v1/auth/login | JWT 로그인 |
| POST | /admin/api/v1/stores | 매장 등록 |
| GET | /admin/api/v1/menus | 메뉴 목록 |
| POST | /admin/api/v1/menus | 메뉴 등록 |
| PUT | /admin/api/v1/menus/{id} | 메뉴 수정 |
| DELETE | /admin/api/v1/menus/{id} | 메뉴 삭제 |
| PATCH | /admin/api/v1/menus/{id}/sold-out | 품절 토글 |
| GET | /admin/api/v1/orders | 주문 목록 |
| PATCH | /admin/api/v1/orders/{id}/status | 상태 변경 |
| PATCH | /admin/api/v1/orders/{id}/reject | 주문 거부 |
| DELETE | /admin/api/v1/orders/{id} | 주문 삭제 |
| POST | /admin/api/v1/sessions/{id}/close | 세션 종료 |
| GET | /admin/api/v1/sessions/{id}/history | 이력 조회 |
| GET | /admin/api/v1/sse/orders | SSE 스트림 |
