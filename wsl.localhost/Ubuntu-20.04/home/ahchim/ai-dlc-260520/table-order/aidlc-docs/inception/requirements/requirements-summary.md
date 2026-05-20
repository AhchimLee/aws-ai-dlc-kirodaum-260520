# Requirements Summary

## Functional Requirements (14)

| # | Requirement | Priority | Status |
|---|-------------|----------|--------|
| 1 | 메뉴 조회 | Must Have | ✅ Implemented |
| 2 | 장바구니 관리 | Must Have | ✅ Implemented |
| 3 | 주문 생성 (Idempotency) | Must Have | ✅ Implemented |
| 4 | 주문 내역 조회 | Must Have | ✅ Implemented |
| 5 | 태블릿 자동 로그인 | Must Have | ✅ Implemented |
| 6 | 매장 관리자 인증 (JWT) | Must Have | ✅ Implemented |
| 7 | 실시간 주문 모니터링 (SSE) | Must Have | ✅ Implemented |
| 8 | 주문 상태 관리 | Must Have | ✅ Implemented |
| 9 | 테이블 세션 관리 | Must Have | ✅ Implemented |
| 10 | 주문 삭제 | Should Have | ✅ Implemented |
| 11 | 메뉴 관리 (CRUD) | Must Have | ✅ Implemented |
| 12 | 매장 등록 | Must Have | ✅ Implemented |
| 13 | 주문 취소/거부 | Should Have | ✅ Implemented |
| 14 | 메뉴 품절 처리 | Should Have | ✅ Implemented |

## Non-Functional Requirements

| Category | Requirement | Status |
|----------|-------------|--------|
| Performance | SSE 2초 이내 전달 | ✅ |
| Security | JWT 16시간 만료, bcrypt 해싱 | ✅ |
| Reliability | Idempotency Key 중복 방지 | ✅ |
| Observability | Structured JSON Logging + trace_id | ✅ |
| Resilience | Graceful Shutdown, Health Probes | ✅ |
| Scalability | 3-Pod MSA, 독립 스케일링 | ✅ |
