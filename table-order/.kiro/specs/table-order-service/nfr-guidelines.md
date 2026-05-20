# NFR Guidelines (비기능 요구사항 가이드)

> 이 문서는 CONSTRUCTION 단계의 NFR Requirements / NFR Design에서 반영할 비기능 요구사항을 정리한 것이다.
> INCEPTION 단계의 requirements.md에서 분리하여 보관하며, Construction 단계에서 각 유닛별로 구체화한다.

---

## NFR-1: Hexagonal Architecture

**목적**: 비즈니스 로직이 외부 프레임워크에 독립적이고 테스트 및 교체가 용이하도록 한다.

**요구사항**:
1. Domain_Layer, Application Layer, Infrastructure Layer로 계층을 분리한다
2. Domain_Layer는 외부 프레임워크, AWS SDK, 데이터베이스 라이브러리에 직접 의존하지 않는다
3. 모든 외부 시스템 연결을 Port 인터페이스를 구현하는 Adapter 형태로 분리한다
4. 주문 상태 전이 로직을 Domain_Layer 내부에서만 수행한다

---

## NFR-2: Structured JSON Logging

**목적**: 로그 수집 시스템에서 파싱하고 장애 원인을 분석할 수 있도록 한다.

**요구사항**:
1. 모든 로그를 stdout 기반 Structured JSON 형식으로 출력한다
2. 각 로그에 timestamp, trace_id, level, component, event, message, context 필드를 포함한다
3. 파일 저장 기반 로깅을 사용하지 않는다
4. Secret 값과 개인정보를 로그에 출력하지 않는다
5. DEBUG 레벨 로그를 기본적으로 비활성화한다

**필수 로그 이벤트**:
- ORDER_REQUEST_RECEIVED, ORDER_CREATED, DUPLICATE_ORDER_BLOCKED
- PAYMENT_REQUESTED, PAYMENT_APPROVED, PAYMENT_TIMEOUT
- CIRCUIT_OPEN, CIRCUIT_HALF_OPEN, CIRCUIT_CLOSED
- DB_TIMEOUT, GRACEFUL_SHUTDOWN_STARTED, GRACEFUL_SHUTDOWN_COMPLETED

---

## NFR-3: Graceful Shutdown

**목적**: 배포 및 스케일링 시 트래픽 유실이 발생하지 않도록 한다.

**요구사항**:
1. SIGTERM 수신 시 신규 요청 수신을 즉시 차단한다
2. 진행 중인 요청을 설정된 유예 기간 내에 안전하게 완료한다
3. Readiness 상태를 즉시 false로 전환한다
4. Graceful Shutdown 시작과 완료를 구조화된 로그로 기록한다

---

## NFR-4: Health Check

**목적**: Kubernetes가 서비스 상태를 확인하여 장애 시 자동으로 트래픽을 차단하고 복구한다.

**요구사항**:
1. `/table-order/healthz` 엔드포인트 제공 (Liveness Probe) — 프로세스 상태, 치명적 내부 오류 여부
2. `/table-order/readyz` 엔드포인트 제공 (Readiness Probe) — DB 연결, 필수 설정 로드, Graceful Shutdown 진행 여부
3. Graceful Shutdown 진행 중 `/table-order/readyz`에서 503 반환

---

## NFR-5: Circuit Breaker

**목적**: 외부 서비스 장애가 전체 시스템으로 전파되지 않도록 한다.

**요구사항**:
1. 외부 API 호출 실패율 50% 초과 시 Circuit Open 전환, 추가 호출 차단
2. 응답 시간 3000ms 초과 5회 연속 시 Circuit Open 전환
3. Open 상태에서 CRITICAL 레벨 로그 출력
4. Half-Open 상태에서 제한적 요청으로 복구 확인
5. 모든 외부 API 호출에 최대 3000ms timeout 적용 (환경 변수로 주입)

---

## NFR-6: Trace Context 전파

**목적**: 단일 요청의 전체 처리 흐름을 로그만으로 추적할 수 있도록 한다.

**요구사항**:
1. 요청 수신 시 고유한 Trace_ID를 생성하여 할당한다
2. Trace_ID를 API → Application → Domain → Repository → External API 전체 계층에 전파한다
3. 모든 로그 출력에 해당 요청의 Trace_ID를 포함한다
4. 외부 API 호출에도 correlation_id를 전달한다

---

## NFR-7: 환경 변수 기반 설정 관리

**목적**: 코드 변경 없이 환경별 설정을 적용할 수 있도록 한다.

**요구사항**:
1. DB Connection, Secret Key, JWT Secret, External API Endpoint, Timeout Value, Circuit Breaker Threshold, Rate Limit Threshold, Environment Name을 환경 변수로 주입
2. 설정값을 소스 코드에 하드코딩하지 않는다
3. 필수 환경 변수 누락 시 명확한 설정 오류 메시지 출력 후 시작 중단

**예시 환경 변수**:
```text
APP_ENV=local
APP_PORT=8081
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_order
PAYMENT_API_ENDPOINT=http://localhost:9000/mock-payment
PAYMENT_TIMEOUT_MS=3000
CIRCUIT_FAILURE_THRESHOLD=0.5
CIRCUIT_SLOW_CALL_THRESHOLD_MS=3000
RATE_LIMIT_PER_TABLE_PER_MINUTE=10
```

---

## NFR-8: 입력값 검증 및 에러 응답

**목적**: 잘못된 입력으로 인한 보안 취약점을 방지하고 클라이언트가 에러를 처리할 수 있도록 한다.

**요구사항**:
1. 모든 API 요청에 대해 필수 필드, 데이터 타입, 값 범위를 검증한다
2. SQL Injection 방지를 위해 파라미터화된 쿼리를 사용한다
3. 검증 실패 시 400 상태 코드와 구조화된 JSON 에러 응답(error_code, message, details) 반환
4. 에러 응답에서 내부 구현 정보(스택 트레이스, DB 구조) 노출 금지

---

## NFR-9: Edge Case 테스트

**목적**: 운영 환경에서 발생할 수 있는 장애 시나리오를 사전에 검증한다.

**필수 테스트 시나리오**:
1. 중복 주문 요청 시 Idempotency_Key 검증
2. 외부 API Timeout 시 Circuit_Breaker 동작
3. 데이터베이스 Timeout 시 구조화된 에러 로그 출력
4. SIGTERM 수신 시 Graceful Shutdown 동작
5. 잘못된 입력값에 대한 구조화된 검증 에러 응답
6. 환경 변수 누락 시 명확한 설정 오류 반환

**테스트 스타일**:
- pytest 기반
- 외부 API는 mock 또는 fake adapter로 대체
- DB 장애는 mock repository 또는 테스트 fixture로 재현
- 로그 검증은 stdout capture 방식
- Happy Path 테스트만 작성하는 것을 금지
- 최소 6개 이상의 Edge Case 시나리오 검증

---

## 참조 문서

- `requirements/AI-DLC-Enterprise-Steering-Pack.md`: 전체 엔터프라이즈 거버넌스 상세
- `requirements/constraints.md`: 제약사항 및 설계 원칙 통합
