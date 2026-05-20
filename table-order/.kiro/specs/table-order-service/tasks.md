# Implementation Plan: Table Order Service

## Overview

3-Pod MSA 구조의 테이블오더 서비스를 Python (FastAPI) 백엔드, React 프론트엔드, PostgreSQL 데이터베이스로 구현한다. Hexagonal Architecture 기반으로 Order Service Pod와 Admin Service Pod를 독립적으로 구현하며, SSE 실시간 통신, JWT 인증, Idempotency Key 중복 방지를 포함한다.

## Tasks

- [ ] 1. 프로젝트 구조 및 공통 인프라 설정
  - [ ] 1.1 Order Service 프로젝트 초기화 및 디렉토리 구조 생성
    - `backend/order-service/` 디렉토리 구조 생성 (app/domain, app/application, app/infrastructure, tests)
    - `pyproject.toml` 작성, 의존성 정의 (fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, pydantic-settings, python-jose, hypothesis)
    - `app/config.py` — pydantic-settings 기반 환경 변수 로딩
    - _Requirements: 전체 아키텍처_

  - [ ] 1.2 Admin Service 프로젝트 초기화 및 디렉토리 구조 생성
    - `backend/admin-service/` 디렉토리 구조 생성 (app/domain, app/application, app/infrastructure, tests)
    - `pyproject.toml` 작성, 의존성 정의 (fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, python-jose, passlib[bcrypt], hypothesis)
    - `app/config.py` — pydantic-settings 기반 환경 변수 로딩
    - _Requirements: 전체 아키텍처_

  - [ ] 1.3 공통 모듈 구현 (logger, health check)
    - Structured JSON Logger 구현 (structlog 또는 python-json-logger) — trace_id 포함
    - Health Check 라우터 구현 — Liveness (`/healthz`) + Readiness (`/readyz`) Probe
    - _Requirements: 비기능 요구사항 (추적 가능성, 무중단 배포)_

  - [ ] 1.4 PostgreSQL 데이터베이스 스키마 및 마이그레이션 생성
    - stores, admins, tables, table_sessions, menu_items, orders, order_items, idempotency_keys 테이블 DDL 작성
    - Alembic 마이그레이션 초기화 및 초기 스키마 마이그레이션 생성
    - 인덱스 및 UNIQUE 제약 조건 설정 (store_slug, idempotency key)
    - Docker Compose 파일 작성 (PostgreSQL 테스트 환경)
    - _Requirements: 12.1, 12.2, 3.4, 3.5_


- [ ] 2. Domain Layer 구현 (Order Service)
  - [ ] 2.1 Order 엔티티 및 Value Objects 구현
    - `app/domain/entities/order.py` — Order 엔티티 (id, order_number, store_id, table_id, session_id, status, total_amount, items, created_at)
    - `app/domain/value_objects/order_status.py` — OrderStatus Enum + VALID_TRANSITIONS 맵 + can_transition_to 함수
    - `app/domain/value_objects/money.py` — Money 값 객체 (양수 검증)
    - `app/domain/services/order_state_machine.py` — 상태 전이 도메인 서비스
    - _Requirements: 3.1, 3.6, 8.1, 8.2, 8.3_

  - [ ]* 2.2 Property Test: Order State Machine Integrity
    - **Property 1: Order State Machine Integrity**
    - 모든 상태 쌍 조합에 대해 VALID_TRANSITIONS에 정의된 전이만 성공하고 나머지는 거부됨을 검증
    - hypothesis 라이브러리 사용, `@settings(max_examples=100)`
    - **Validates: Requirements 8.1, 8.2, 13.1, 13.2, 13.3**

  - [ ] 2.3 MenuItem 엔티티 및 품절 로직 구현
    - `app/domain/entities/menu_item.py` — MenuItem 엔티티 (id, store_id, name, price, description, category, image_url, is_sold_out)
    - 품절 상태 토글 메서드, 메뉴 유효성 검증 메서드 (필수 필드, 가격 > 0)
    - _Requirements: 1.2, 11.4, 11.5, 14.1, 14.4_

  - [ ] 2.4 TableSession 엔티티 구현
    - `app/domain/entities/table_session.py` — TableSession 엔티티 (id, table_id, store_id, status, started_at, closed_at)
    - 세션 시작/종료 메서드, 활성 세션 확인 로직
    - _Requirements: 9.1, 9.2, 9.3_


- [ ] 3. Application Layer 구현 (Order Service)
  - [ ] 3.1 Inbound/Outbound Port 인터페이스 정의
    - `app/application/ports/inbound.py` — MenuQueryUseCase, OrderCreateUseCase, OrderQueryUseCase, OrderCancelUseCase ABC 인터페이스
    - `app/application/ports/outbound.py` — OrderRepository, MenuRepository, IdempotencyStore, SessionRepository, OrderEventPublisher ABC 인터페이스
    - _Requirements: 1.1, 3.1, 4.1, 13.1_

  - [ ] 3.2 메뉴 조회 UseCase 구현
    - `app/application/use_cases/get_menu.py` — 매장별 카테고리 메뉴 조회, 메뉴 상세 조회
    - 존재하지 않는 매장 시 에러 반환, 빈 목록 처리
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 14.2_

  - [ ] 3.3 주문 생성 UseCase 구현 (Idempotency Key 포함)
    - `app/application/use_cases/create_order.py` — Idempotency Key 검증, 품절 메뉴 검증, 주문 생성, 자동 세션 생성, SSE 이벤트 발행
    - 트랜잭션 내에서 Idempotency Key 저장 + 주문 생성 원자성 보장
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 9.1, 14.3_

  - [ ]* 3.4 Property Test: Idempotency Key Prevents Duplicate Orders
    - **Property 2: Idempotency Key Prevents Duplicate Orders**
    - 동일 Idempotency Key로 두 번 요청 시 주문 1건만 생성되고 두 번째는 409 반환 검증
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 3.5 Property Test: Order Creation Invariant
    - **Property 3: Order Creation Invariant**
    - 유효한 주문 요청 시 PENDING 상태 주문 생성 + 고유 주문 번호 반환 + 메뉴 항목 정합성 검증
    - **Validates: Requirements 3.1, 3.6**

  - [ ] 3.6 주문 내역 조회 UseCase 구현
    - `app/application/use_cases/get_orders.py` — 세션별 주문 조회, 시간순 정렬
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 3.7 Property Test: Session Isolation
    - **Property 4: Session Isolation**
    - 활성 세션 조회 시 해당 세션 주문만 반환, 종료된 세션 주문 미포함 검증
    - **Validates: Requirements 4.1, 4.3**

  - [ ] 3.8 주문 취소 UseCase 구현
    - `app/application/use_cases/cancel_order.py` — PENDING 상태만 취소 가능, 상태 전이 검증, SSE 이벤트 발행
    - _Requirements: 13.1, 13.2, 13.4, 13.5_


- [ ] 4. Infrastructure Layer 구현 (Order Service)
  - [ ] 4.1 SQLAlchemy ORM 모델 및 Repository 구현
    - `app/infrastructure/database.py` — AsyncEngine, async_sessionmaker 설정
    - `app/infrastructure/models.py` — SQLAlchemy ORM 모델 (orders, order_items, menu_items, table_sessions, idempotency_keys)
    - `app/infrastructure/repositories/sqlalchemy_order_repo.py` — Order CRUD, 세션별 조회
    - `app/infrastructure/repositories/sqlalchemy_menu_repo.py` — Menu 조회, 카테고리별 필터링
    - `app/infrastructure/repositories/sqlalchemy_session_repo.py` — Session 생성/조회
    - `app/infrastructure/repositories/sqlalchemy_idempotency_repo.py` — Idempotency Key 저장/조회
    - _Requirements: 3.1, 4.1, 1.1_

  - [ ] 4.2 SSE Event Broker 구현
    - `app/infrastructure/sse/broker.py` — In-Memory Event Broker (asyncio 기반 pub/sub)
    - 매장별 채널 분리, 구독/해제, 이벤트 발행
    - Heartbeat (30초 간격), Last-Event-ID 재전송 지원
    - _Requirements: 7.1, 7.2, 8.4, 13.5_

  - [ ] 4.3 FastAPI Router 구현 (Order Service)
    - `app/infrastructure/routers/menu_router.py` — GET /stores/{store_id}/menus, GET /menus/{menu_id}
    - `app/infrastructure/routers/order_router.py` — POST /orders, GET /sessions/{session_id}/orders, PATCH /orders/{order_id}/cancel
    - `app/infrastructure/routers/sse_router.py` — GET /sse/orders (SSE 스트림, StreamingResponse)
    - Pydantic 스키마 정의 (request/response models)
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 13.1, 7.1_

  - [ ] 4.4 Middleware 구현 (Order Service)
    - `app/infrastructure/middleware/trace_id.py` — UUID v4 trace_id 생성 및 전파 (Starlette middleware)
    - `app/infrastructure/middleware/request_logger.py` — 요청/응답 JSON 로깅
    - `app/infrastructure/middleware/error_handler.py` — 전역 예외 핸들러 (HTTPException → 구조화된 에러 응답)
    - _Requirements: 비기능 요구사항 (추적 가능성)_

  - [ ] 4.5 FastAPI 앱 엔트리포인트 및 Graceful Shutdown 구현
    - `app/main.py` — FastAPI 앱 생성, lifespan 컨텍스트 매니저 (startup: DB 연결, shutdown: 커넥션 풀 종료)
    - DI 조립 (Depends 기반 의존성 주입)
    - SIGTERM 핸들링, Readiness false 설정
    - _Requirements: 비기능 요구사항 (무중단 배포)_

- [ ] 5. Checkpoint - Order Service 기본 동작 검증
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 6. Domain Layer 구현 (Admin Service)
  - [ ] 6.1 Store, Admin, Table 엔티티 구현
    - `app/domain/entities/store.py` — Store 엔티티 (id, slug, name)
    - `app/domain/entities/admin.py` — Admin 엔티티 (id, store_id, username, password_hash)
    - `app/domain/entities/table.py` — Table 엔티티 (id, store_id, table_number, table_password)
    - `app/domain/value_objects/credentials.py` — Credentials 값 객체 (passlib bcrypt 해싱/검증)
    - _Requirements: 6.5, 12.1, 12.4_

  - [ ]* 6.2 Property Test: Password Hashing Invariant
    - **Property 13: Password Hashing Invariant**
    - 저장된 비밀번호가 항상 bcrypt 해시이며, 원본 비밀번호 검증 성공, 다른 비밀번호 검증 실패 확인
    - **Validates: Requirements 6.5**

  - [ ]* 6.3 Property Test: Store Identifier Uniqueness
    - **Property 14: Store Identifier Uniqueness**
    - 동일 store_slug로 두 번째 등록 시 409 Conflict, 원본 매장 불변 검증
    - **Validates: Requirements 12.2**

- [ ] 7. Application Layer 구현 (Admin Service)
  - [ ] 7.1 Inbound/Outbound Port 인터페이스 정의
    - `app/application/ports/inbound.py` — AuthUseCase, StoreManagementUseCase, MenuManagementUseCase, OrderManagementUseCase, SessionManagementUseCase ABC
    - `app/application/ports/outbound.py` — StoreRepository, AdminRepository, MenuRepository, OrderRepository, SessionRepository, EventPublisher ABC
    - _Requirements: 6.1, 12.1, 11.1, 8.1, 9.2_

  - [ ] 7.2 매장 등록 UseCase 구현
    - `app/application/use_cases/register_store.py` — 매장 생성, store_slug 고유성 검증, 관리자 계정 생성 (bcrypt 해싱)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 7.3 관리자 인증 UseCase 구현 (JWT)
    - `app/application/use_cases/authenticate.py` — 로그인 검증, JWT 토큰 발급 (python-jose, 16시간 만료)
    - _Requirements: 6.1, 6.2, 6.4, 6.6_

  - [ ]* 7.4 Property Test: JWT Token Lifecycle
    - **Property 12: JWT Token Lifecycle**
    - 유효 자격 증명 → 16시간 만료 JWT 생성, 만료 JWT → 401 거부, 올바른 claims 포함 검증
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [ ] 7.5 메뉴 관리 UseCase 구현
    - `app/application/use_cases/manage_menu.py` — 메뉴 CRUD, Pydantic 기반 필수 필드 검증, 가격 검증, 품절 설정/해제
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 14.1, 14.4_

  - [ ]* 7.6 Property Test: Menu Validation Rejects Invalid Input
    - **Property 10: Menu Validation Rejects Invalid Input**
    - 필수 필드 누락 또는 가격 ≤ 0 시 400 반환 + 미저장 검증
    - **Validates: Requirements 11.4, 11.5**

  - [ ]* 7.7 Property Test: Sold-Out Round-Trip
    - **Property 11: Sold-Out Round-Trip**
    - 품절 설정 → 해제 시 주문 가능 복원, 품절 중 주문 시 400 거부 검증
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

  - [ ] 7.8 주문 상태 관리 UseCase 구현
    - `app/application/use_cases/manage_order_status.py` — 상태 변경 (PENDING→PREPARING→COMPLETED), 주문 거부, 주문 삭제
    - Domain Layer 상태 전이 규칙 적용, SSE 이벤트 발행
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 13.3, 13.5_

  - [ ] 7.9 테이블 세션 관리 UseCase 구현
    - `app/application/use_cases/manage_session.py` — 세션 종료, 주문 이력 이동, 총 주문액 리셋, 과거 세션 조회
    - _Requirements: 9.2, 9.3, 9.5_

  - [ ]* 7.10 Property Test: Session Closure Resets Table State
    - **Property 5: Session Closure Resets Table State**
    - 세션 종료 시 CLOSED 마킹 + 주문 이력 이동 + 총 주문액 0 리셋 검증
    - **Validates: Requirements 9.2, 9.3**

  - [ ]* 7.11 Property Test: Order Total Recalculation on Removal
    - **Property 8: Order Total Recalculation on Removal**
    - 주문 삭제/취소/거부 시 테이블 총 주문액 = 남은 활성 주문 합계 검증
    - **Validates: Requirements 10.1, 13.4**

- [ ] 8. Infrastructure Layer 구현 (Admin Service)
  - [ ] 8.1 SQLAlchemy ORM 모델 및 Repository 구현
    - `app/infrastructure/database.py` — AsyncEngine, async_sessionmaker 설정
    - `app/infrastructure/models.py` — SQLAlchemy ORM 모델 (stores, admins, tables, menu_items, orders, sessions)
    - `app/infrastructure/repositories/sqlalchemy_store_repo.py` — Store CRUD, slug 중복 검증
    - `app/infrastructure/repositories/sqlalchemy_admin_repo.py` — Admin 조회/생성
    - `app/infrastructure/repositories/sqlalchemy_menu_repo.py` — Menu CRUD, 카테고리별 조회
    - `app/infrastructure/repositories/sqlalchemy_order_repo.py` — Order 상태 변경, 삭제
    - `app/infrastructure/repositories/sqlalchemy_session_repo.py` — Session 종료, 이력 조회
    - _Requirements: 12.1, 11.1, 8.1, 9.2, 10.1_

  - [ ] 8.2 JWT 인증 미들웨어 구현
    - `app/infrastructure/middleware/jwt_auth.py` — FastAPI Depends 기반 JWT 토큰 검증, 만료 체크, 401 반환
    - store_id, admin_id claims 추출 및 request.state 주입
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 8.3 FastAPI Router 구현 (Admin Service)
    - `app/infrastructure/routers/auth_router.py` — POST /auth/login
    - `app/infrastructure/routers/store_router.py` — POST /stores
    - `app/infrastructure/routers/menu_router.py` — POST/PUT/DELETE /menus, PATCH /menus/{id}/sold-out
    - `app/infrastructure/routers/order_router.py` — GET /orders, PATCH /orders/{id}/status, PATCH /orders/{id}/reject, DELETE /orders/{id}
    - `app/infrastructure/routers/session_router.py` — POST /sessions/{table_id}/close, GET /sessions/{table_id}/history
    - Pydantic 스키마 정의 (request/response models)
    - _Requirements: 6.1, 12.1, 11.1, 8.1, 10.1, 9.2, 13.3_

  - [ ] 8.4 Middleware 및 FastAPI 앱 엔트리포인트 구현
    - `app/infrastructure/middleware/trace_id.py`, `request_logger.py` — 공통 미들웨어
    - `app/main.py` — FastAPI 앱 생성, lifespan, DI 조립, Graceful Shutdown
    - _Requirements: 비기능 요구사항_


- [ ] 9. Checkpoint - Admin Service 기본 동작 검증
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Frontend 구현 (React + Vite)
  - [ ] 10.1 프로젝트 초기화 및 라우팅 설정
    - `frontend/` 디렉토리에 Vite + React + TypeScript 프로젝트 생성
    - React Router 설정 (고객 화면, 관리자 화면 분리)
    - API 클라이언트 유틸리티 (axios/fetch wrapper)
    - _Requirements: 전체 프론트엔드 아키텍처_

  - [ ] 10.2 고객 화면 - 메뉴 조회 페이지 구현
    - 카테고리별 메뉴 목록 표시, 메뉴 상세 정보 (이름, 가격, 설명, 이미지)
    - 품절 메뉴 시각적 표시 (비활성화)
    - _Requirements: 1.1, 1.2, 14.2_

  - [ ] 10.3 고객 화면 - 장바구니 관리 구현
    - 메뉴 추가/삭제/수량 증감 기능
    - 총 금액 실시간 재계산
    - localStorage 저장/복원
    - 장바구니 비우기 기능
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 10.4 Property Test: Cart Total Calculation
    - **Property 6: Cart Total Calculation**
    - 임의의 아이템/수량 조합에서 총액 = Σ(단가 × 수량) 불변식 검증
    - TypeScript/JavaScript 기반 property test (fast-check 라이브러리)
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 10.5 Property Test: Cart Persistence Round-Trip
    - **Property 7: Cart Persistence Round-Trip**
    - localStorage 직렬화/역직렬화 후 동일 카트 상태 복원 검증
    - **Validates: Requirements 2.3**

  - [ ] 10.6 고객 화면 - 주문 생성 및 주문 내역 구현
    - 주문 확정 시 Idempotency Key (UUID v4) 생성 후 서버 전송
    - 주문 성공 시 주문 번호 5초 표시 → 장바구니 초기화 → 메뉴 화면 리다이렉트
    - 주문 실패 시 에러 메시지 표시 + 장바구니 유지
    - 주문 내역 페이지 (세션별 주문 목록, 상태 표시)
    - 주문 취소 버튼 (PENDING 상태만)
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 13.1, 13.2_

  - [ ] 10.7 고객 화면 - 태블릿 자동 로그인 구현
    - 초기 설정 화면 (매장 식별자, 테이블 번호, 테이블 비밀번호 입력)
    - 로그인 정보 localStorage 저장 및 자동 로그인
    - 유효하지 않은 정보 시 초기 설정 화면 표시
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 10.8 관리자 화면 - 로그인 및 인증 구현
    - 로그인 폼 (매장 식별자, 사용자명, 비밀번호)
    - JWT 토큰 저장 및 API 요청 시 Authorization 헤더 첨부
    - 토큰 만료 시 로그인 화면 리다이렉트
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ] 10.9 관리자 화면 - 실시간 주문 모니터링 대시보드 구현
    - SSE 연결 및 실시간 주문 수신
    - 테이블별 그리드/카드 레이아웃 (총 주문액, 최신 주문 미리보기)
    - 신규 주문 시각적 강조 (색상 변경/애니메이션)
    - 주문 카드 클릭 시 상세 메뉴 목록 표시
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.10 관리자 화면 - 주문 상태 관리 구현
    - 주문 상태 변경 버튼 (PENDING→PREPARING→COMPLETED)
    - 주문 거부 버튼 + 확인 팝업
    - 주문 삭제 버튼 + 확인 팝업
    - SSE를 통한 실시간 상태 반영
    - _Requirements: 8.1, 8.4, 10.1, 10.2, 10.4, 13.3_

  - [ ] 10.11 관리자 화면 - 테이블 세션 관리 구현
    - 테이블 이용 완료 버튼 + 확인 팝업
    - 과거 주문 내역 조회 (시간 역순)
    - _Requirements: 9.2, 9.4, 9.5_

  - [ ] 10.12 관리자 화면 - 메뉴 관리 구현
    - 메뉴 등록/수정/삭제 폼
    - 카테고리별 메뉴 목록 표시
    - 품절 설정/해제 토글
    - _Requirements: 11.1, 11.2, 11.3, 11.6, 14.1, 14.4_

  - [ ] 10.13 관리자 화면 - 매장 등록 구현
    - 매장 등록 폼 (매장명, 매장 식별자, 관리자 사용자명, 비밀번호)
    - 중복 식별자 에러 처리
    - _Requirements: 12.1, 12.2, 12.4_

- [ ] 11. Checkpoint - Frontend 기본 동작 검증
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 12. Circuit Breaker 및 Resilience 패턴 구현
  - [ ] 12.1 Circuit Breaker 래퍼 구현
    - Circuit Breaker 상태 전이 (Closed→Open→HalfOpen) — asyncio 기반
    - 환경 변수 기반 설정 (실패율 임계값, slow call 임계값, cooldown)
    - DB 연결에 Circuit Breaker 적용
    - _Requirements: 비기능 요구사항 (장애 격리)_

  - [ ]* 12.2 Unit tests for Circuit Breaker
    - 상태 전이 시나리오 테스트 (실패율 초과 → Open, cooldown → HalfOpen, 성공 → Closed)
    - pytest + pytest-asyncio 사용
    - _Requirements: 비기능 요구사항_

- [ ] 13. 통합 테스트 및 SSE 이벤트 검증
  - [ ]* 13.1 Integration Test: SSE 주문 이벤트 전달
    - 주문 생성 → 2초 이내 SSE 이벤트 수신 검증
    - 상태 변경 → SSE 이벤트 수신 검증
    - httpx AsyncClient + SSE 파싱으로 이벤트 수신 검증
    - _Requirements: 7.1, 7.2, 8.4_

  - [ ]* 13.2 Integration Test: SQLAlchemy Repository 동작
    - Order, Menu, Session Repository CRUD 동작 검증
    - 트랜잭션 롤백 테스트
    - Docker Compose PostgreSQL 사용, pytest-asyncio
    - _Requirements: 3.1, 4.1, 9.2_

  - [ ]* 13.3 Integration Test: JWT 미들웨어 검증
    - 유효 토큰 → 통과, 무효 토큰 → 401, 만료 토큰 → 401 검증
    - httpx AsyncClient 사용
    - _Requirements: 6.2, 6.4_

  - [ ]* 13.4 Property Test: Menu Category Filtering
    - **Property 9: Menu Category Filtering**
    - 카테고리별 조회 시 해당 카테고리만 반환, 전체 조회 시 누락 없음 검증
    - **Validates: Requirements 1.1, 11.6**

  - [ ]* 13.5 Property Test: Order Response Completeness
    - **Property 15: Order Response Completeness**
    - 반환된 주문에 order_number, created_at, items, total_amount, status 모두 포함 검증
    - **Validates: Requirements 4.2**

  - [ ]* 13.6 Property Test: Auto-Session Creation on First Order
    - **Property 16: Auto-Session Creation on First Order**
    - 활성 세션 없는 테이블에서 첫 주문 시 자동 세션 생성 + 주문 연결 검증
    - **Validates: Requirements 9.1**


- [ ] 14. Docker 및 배포 설정
  - [ ] 14.1 Dockerfile 작성
    - `backend/order-service/Dockerfile` — Multi-stage build (Python 빌드 → slim 실행, uvicorn 기동)
    - `backend/admin-service/Dockerfile` — Multi-stage build (Python 빌드 → slim 실행, uvicorn 기동)
    - `frontend/Dockerfile` — Node 빌드 → Nginx 서빙
    - _Requirements: 전체 배포 아키텍처_

  - [ ] 14.2 Frontend Nginx 설정
    - `frontend/nginx.conf` — SPA 라우팅 (fallback to index.html), 정적 파일 캐싱
    - _Requirements: 전체 배포 아키텍처_

- [ ] 15. Final Checkpoint - 전체 시스템 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Python 백엔드는 `hypothesis` 라이브러리를 사용하여 property-based testing 수행
- Frontend property tests는 `fast-check` 라이브러리 사용
- 모든 Repository 테스트는 Docker Compose PostgreSQL 컨테이너 사용
- SSE 테스트는 httpx AsyncClient 기반으로 이벤트 수신 검증
- 테스트 프레임워크: pytest + pytest-asyncio + httpx

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "10.1"] },
    { "id": 2, "tasks": ["2.1", "2.3", "2.4", "6.1"] },
    { "id": 3, "tasks": ["2.2", "3.1", "6.2", "6.3", "7.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.6", "3.8", "7.2", "7.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.7", "7.4", "7.5", "7.8", "7.9"] },
    { "id": 6, "tasks": ["4.1", "4.2", "4.3", "4.4", "7.6", "7.7", "7.10", "7.11"] },
    { "id": 7, "tasks": ["4.5", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 8, "tasks": ["10.2", "10.3", "10.7", "10.8", "10.13", "12.1"] },
    { "id": 9, "tasks": ["10.4", "10.5", "10.6", "10.9", "10.12", "12.2"] },
    { "id": 10, "tasks": ["10.10", "10.11"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"] },
    { "id": 12, "tasks": ["14.1", "14.2"] }
  ]
}
```
