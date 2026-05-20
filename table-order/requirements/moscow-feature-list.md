# 테이블오더 서비스 MoSCoW 기능 목록

> PR/FAQ 및 요구사항 정의서 기반 우선순위 분류

---

## Must Have (반드시 구현)

MVP 출시에 필수적인 기능. 이것 없이는 서비스가 동작하지 않는다.

### 기능 요구사항 (Functional)

| ID | 기능 | 설명 | 대상 |
|----|------|------|------|
| M-F01 | 메뉴 조회 API | 카테고리별 메뉴 목록 조회, 상세 정보(메뉴명, 가격, 설명, 이미지) 표시 | 고객 |
| M-F02 | 장바구니 관리 | 메뉴 추가/삭제, 수량 조절, 총액 계산, 로컬 저장(새로고침 유지) | 고객 |
| M-F03 | 주문 생성 API | 장바구니 확정 → 주문 생성, 주문 번호 발급, 성공 시 장바구니 초기화 | 고객 |
| M-F04 | 주문 내역 조회 | 현재 테이블 세션의 주문 이력 조회 (시간순, 상태 표시) | 고객 |
| M-F05 | 테이블 태블릿 자동 로그인 | 관리자 1회 설정 후 자동 로그인, 세션 관리 | 고객 |
| M-F06 | 매장 관리자 인증 | 매장 식별자 + 사용자명/비밀번호, JWT 기반 16시간 세션 | 관리자 |
| M-F07 | 실시간 주문 모니터링 | SSE 기반 실시간 주문 표시, 테이블별 그리드 레이아웃, 2초 이내 표시 | 관리자 |
| M-F08 | 주문 상태 관리 | 주문 상태 변경 (대기중 → 준비중 → 완료) | 관리자 |
| M-F09 | 테이블 세션 관리 | 세션 시작/종료(이용 완료), 종료 시 주문 이력 이동 및 리셋 | 관리자 |
| M-F10 | 주문 삭제 (직권) | 특정 주문 삭제, 확인 팝업, 총 주문액 재계산 | 관리자 |
| M-F11 | 메뉴 관리 | 메뉴 CRUD (등록/수정/삭제/조회), 카테고리 관리 | 관리자 |

### 비기능 요구사항 (Non-Functional)

| ID | 기능 | 설명 |
|----|------|------|
| M-N01 | Idempotency Key 검증 | 주문 생성 API 중복 요청 차단, 동일 키 재요청 시 409 Conflict |
| M-N02 | Structured JSON Logging | stdout 기반 구조화 로그 (timestamp, trace_id, level, event, context) |
| M-N03 | 환경 변수 기반 설정 분리 | DB, API Endpoint, Timeout, Secret 등 하드코딩 금지 |
| M-N04 | 입력값 검증 | 필수 필드, 가격 범위, SQL Injection 방지 |
| M-N05 | 비밀번호 안전 저장 | bcrypt 해싱, Plain text 저장 금지 |
| M-N06 | 기본 단위 테스트 | 핵심 비즈니스 로직 단위 테스트 |
| M-N07 | Edge Case 테스트 | 중복 주문, Timeout, 잘못된 입력값 등 최소 5개 시나리오 |
| M-N08 | Hexagonal Architecture | Domain/Application/Infrastructure 계층 분리 |
| M-N09 | 에러 응답 구조화 | 내부 정보 미노출, 구조화된 JSON 에러 응답 |

---

## Should Have (가능하면 구현 — 차별화 핵심)

없어도 서비스는 동작하지만, 운영 안정성과 경쟁력에 중요한 항목.

### 기능 요구사항 (Functional)

| ID | 기능 | 설명 | 대상 |
|----|------|------|------|
| S-F01 | 과거 주문 내역 조회 | 테이블별 과거 주문 목록, 날짜 필터링 | 관리자 |
| S-F02 | 메뉴 노출 순서 조정 | 메뉴 표시 순서 관리자 설정 | 관리자 |
| S-F03 | 신규 주문 시각적 강조 | 색상 변경, 애니메이션으로 신규 주문 인지 | 관리자 |
| S-F04 | 테이블별 필터링 | 대시보드에서 특정 테이블 주문만 필터 | 관리자 |
| S-F05 | 결제 처리 흐름 | 외부 결제 API 연동 (Mock 포함), 결제 상태 관리 | 고객 |
| S-F06 | 주문서 출력 기능 | 주문 내역을 인쇄 가능한 형태로 출력 | 관리자 |
| S-F07 | QR 코드 인쇄 기능 | 테이블별 QR 코드 생성 및 인쇄 | 관리자 |

### 비기능 요구사항 (Non-Functional)

| ID | 기능 | 설명 |
|----|------|------|
| S-N01 | Circuit Breaker | 실패율 50% 초과 또는 slow call 5회 연속 시 Open, 장애 격리 |
| S-N02 | Graceful Shutdown | SIGTERM 수신 시 신규 요청 차단, 진행 중 요청 안전 종료 |
| S-N03 | Readiness / Liveness Probe | `/healthz`, `/readyz` endpoint 구현 |
| S-N04 | trace_id / correlation_id 전파 | 전체 계층(API→Application→Domain→Repository→External) 전파 |
| S-N05 | ADR 문서 생성 | 주요 기술 결정(DB, 인증, API 구조 등) 기록 |
| S-N06 | CORS 정책 명시 | 허용 Origin, Method, Header 명시적 설정 |
| S-N07 | 로그인 시도 제한 | 연속 실패 시 일시 차단 |
| S-N08 | Retry with Exponential Backoff | 일시적 장애에 대한 제한적 재시도 (멱등성 키 필수) |
| S-N09 | 외부 API Timeout 처리 | 모든 외부 API 호출 3000ms timeout, 환경 변수로 주입 |

---

## Could Have (시간 허용 시 구현)

있으면 좋지만 MVP 출시에 영향을 주지 않는 항목.

### 기능 요구사항 (Functional)

| ID | 기능 | 설명 | 대상 |
|----|------|------|------|
| C-F01 | 주문 상태 실시간 업데이트 (고객) | 고객 화면에서 주문 상태 실시간 반영 | 고객 |
| C-F02 | 관리자 대시보드 고도화 | 매출 요약, 주문 통계 등 | 관리자 |
| C-F03 | 주문 카드 상세 보기 | 주문 카드 클릭 시 전체 메뉴 목록 팝업 | 관리자 |

### 비기능 요구사항 (Non-Functional)

| ID | 기능 | 설명 |
|----|------|------|
| C-N01 | Rate Limiting | 동일 Table ID 기준 분당 10회 제한, 429 응답 |
| C-N02 | Redis 기반 Idempotency Store | DB 대신 Redis로 멱등성 키 저장 (성능 향상) |
| C-N03 | OpenAPI 문서 자동 생성 | Swagger/OpenAPI 스펙 자동 생성 |
| C-N04 | Dockerfile | 컨테이너 빌드 파일 제공 |
| C-N05 | 간단한 부하 테스트 스크립트 | 동시 요청 시나리오 검증 |
| C-N06 | Chaos Test | DB Latency Injection, Pod Restart During Transaction 등 |
| C-N07 | 비용 분석 리포트 | 아키텍처별 예상 비용 분석 |
| C-N08 | NFR Requirements 문서화 | 별도 NFR 문서 산출물 |

---

## Won't Have (이번 MVP에서 제외)

명시적으로 범위에서 제외하는 항목. 향후 Phase에서 검토.

### 기능 제외

| ID | 기능 | 제외 사유 |
|----|------|-----------|
| W-F01 | 실제 PG 결제 연동 | MVP 범위 초과, Mock으로 대체 |
| W-F02 | 푸시/SMS/이메일 알림 | 알림 시스템 전체 제외 |
| W-F03 | 주방 디스플레이 시스템 (KDS) | 주방 기능 전체 제외 |
| W-F04 | 배달 플랫폼 연동 | 외부 연동 제외 |
| W-F05 | POS 시스템 연동 | 외부 연동 제외 |
| W-F06 | 예약 시스템 | 고급 기능 제외 |
| W-F07 | 고객 리뷰 시스템 | 고급 기능 제외 |
| W-F08 | 다국어 지원 | 고급 기능 제외 |
| W-F09 | 데이터 분석/매출 리포트 | 고급 기능 제외 |
| W-F10 | 재고 관리 시스템 | 고급 기능 제외 |
| W-F11 | 직원 관리 및 권한 설정 | 복잡한 권한 체계 제외 |
| W-F12 | 영수증 발행/출력 | 결제 관련 제외 |
| W-F13 | 환불 처리 | 결제 관련 제외 |
| W-F14 | 포인트/쿠폰 시스템 | 결제 관련 제외 |
| W-F15 | 이미지 리사이징/최적화 | 파일 관리 제외 |

### 기술 제외

| ID | 기능 | 제외 사유 |
|----|------|-----------|
| W-T01 | 실제 운영용 EKS 배포 | 실습 환경 한계 |
| W-T02 | 복잡한 멀티테넌트 권한 체계 | MVP 범위 초과 |
| W-T03 | 실시간 WebSocket 주문 상태 동기화 | SSE로 대체 |
| W-T04 | 완전한 MSA 분리 | 모놀리식 우선 |
| W-T05 | OAuth/SNS 로그인 | 단순 인증으로 충분 |
| W-T06 | 다단계 인증 (2FA, OTP) | MVP 범위 초과 |

---

## 요약 통계

| 우선순위 | 기능(F) | 비기능(N/T) | 합계 |
|----------|---------|-------------|------|
| **Must Have** | 11 | 9 | 20 |
| **Should Have** | 7 | 9 | 16 |
| **Could Have** | 3 | 8 | 11 |
| **Won't Have** | 15 | 6 | 21 |
| **합계** | 36 | 32 | 68 |

---

## 구현 순서 권장

### Phase 1: Core MVP (Must Have)
1. 아키텍처 기반 구조 (Hexagonal Architecture 스캐폴딩)
2. 메뉴 조회 API + 고객 UI
3. 장바구니 (클라이언트 로컬 저장)
4. 주문 생성 API + Idempotency Key
5. 관리자 인증 (JWT)
6. 실시간 주문 모니터링 (SSE)
7. 테이블/세션 관리
8. 메뉴 관리 (CRUD)
9. Structured JSON Logging + 환경 변수 분리
10. 단위 테스트 + Edge Case 테스트

### Phase 2: Operational Excellence (Should Have)
1. Circuit Breaker 적용
2. Graceful Shutdown 구현
3. Health Check Endpoint (/healthz, /readyz)
4. trace_id 전파
5. ADR 문서 작성

### Phase 3: Enhancement (Could Have)
1. Rate Limiting
2. Redis Idempotency Store
3. OpenAPI 문서
4. Dockerfile
5. 부하 테스트
