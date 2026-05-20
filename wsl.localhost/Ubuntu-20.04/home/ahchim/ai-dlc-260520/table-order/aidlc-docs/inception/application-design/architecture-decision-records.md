# Architecture Decision Records (ADR)

## ADR-001: Python FastAPI over Go Gin

**Status**: Accepted
**Date**: 2026-05-20

### Context
초기 설계는 Go (Gin) 기반이었으나, 팀의 Python 역량과 빠른 개발 속도를 고려하여 변경 결정.

### Decision
Python FastAPI를 백엔드 프레임워크로 선택.

### Rationale
1. **개발 속도**: FastAPI의 자동 OpenAPI 문서, Pydantic 검증으로 보일러플레이트 최소화
2. **비동기 지원**: asyncio 기반으로 SSE, DB 비동기 처리 자연스러움
3. **타입 안전성**: Pydantic + type hints로 런타임 검증 자동화
4. **생태계**: SQLAlchemy 2.0 async, hypothesis (PBT), pytest-asyncio 등 성숙한 라이브러리

### Consequences
- 장점: 빠른 프로토타이핑, 자동 API 문서, 강력한 검증
- 단점: Go 대비 메모리 사용량 증가, 콜드 스타트 시간 증가
- 대응: EKS HPA로 스케일링, 적절한 리소스 할당

---

## ADR-002: PostgreSQL over MongoDB

**Status**: Accepted
**Date**: 2026-05-20

### Context
주문 데이터의 정합성이 핵심 요구사항.

### Decision
PostgreSQL (Amazon RDS) 선택.

### Rationale
1. ACID 트랜잭션 필수 (주문 + Idempotency Key 원자성)
2. UNIQUE 제약으로 중복 방지 자연스러움
3. 예측 가능한 비용 (RDS vs DocumentDB)
4. Read Replica로 읽기 확장 가능

---

## ADR-003: SSE over WebSocket

**Status**: Accepted
**Date**: 2026-05-20

### Context
관리자에게 실시간 주문 알림 필요.

### Decision
Server-Sent Events (SSE) 선택.

### Rationale
1. 서버→클라이언트 단방향 푸시만 필요
2. HTTP 기반으로 인프라 단순 (ALB 호환)
3. 자동 재연결 내장 (EventSource API)
4. WebSocket 대비 구현/운영 복잡도 낮음

---

## ADR-004: Hexagonal Architecture

**Status**: Accepted
**Date**: 2026-05-20

### Context
테스트 용이성과 기술 교체 유연성 확보 필요.

### Decision
Hexagonal Architecture (Ports & Adapters) 적용.

### Rationale
1. Domain Layer가 인프라에 의존하지 않음 → 단위 테스트 용이
2. Repository 인터페이스로 DB 교체 가능
3. UseCase 단위로 비즈니스 로직 격리
4. 팀 간 병렬 개발 가능 (인터페이스 기반)
