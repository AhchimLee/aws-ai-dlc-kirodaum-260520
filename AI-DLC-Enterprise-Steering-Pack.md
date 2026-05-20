# AI-DLC Enterprise Steering Pack
## Product Ready Cloud-Native Architecture Governance for Kiro

> 우리는 단순한 테이블오더 앱을 만드는 것이 아니라, AI가 생성한 코드를 실제 운영 가능한 제품 수준으로 통제하고 검증하는 방식을 증명한다.

---

# 0. How to Use This Document

이 문서는 AWS AI-DLC 실습/챌린지에서 Kiro에게 주입할 수 있는 통합 Steering 문서이다.

사용 목적은 다음과 같다.

- Inception 단계에서 요구사항과 아키텍처 방향을 명확히 고정한다.
- Planning 단계에서 NFR / Infrastructure Design이 흐지부지 생략되지 않도록 통제한다.
- Construction 단계에서 AI가 생성한 코드의 품질, 테스트, 운영성을 검증한다.
- 최종 발표/심사 시 “AI-DLC를 어떻게 활용하고 통제했는가”를 증명하는 Evidence Pack 역할을 한다.

권장 파일명:

```text
AI-DLC-Enterprise-Steering-Pack.md
```

권장 위치:

```text
requirements/constraints.md
aidlc-docs/inception/requirements/enterprise-steering.md
```

또는 Kiro CLI 시작 프롬프트에 본 문서 전체를 참조하도록 지시한다.

---

# 1. Core Mission Statement

본 프로젝트의 목표는 단순 기능 구현이 아니라, AWS EKS(Kubernetes) 환경에서 즉시 운영 가능한 Product Ready 수준의 애플리케이션 아키텍처를 증명하는 것이다.

Kiro는 모든 설계 및 구현 단계에서 다음 엔터프라이즈 원칙을 반드시 준수한다.

- Cloud Native Architecture
- Resilient Distributed System Design
- Operational Readiness
- Observability
- FinOps Awareness
- Security by Default
- Human Governance over AI Generated Code
- Traceable AI-DLC Workflow

---

# 2. Business Intent & Problem Framing

본 프로젝트는 단순 테이블오더 앱이 아니라, 소규모 매장에서도 장애에 강하고 운영 가능한 주문/결제 시스템을 빠르게 구축할 수 있음을 증명하는 것을 목표로 한다.

핵심 문제는 다음과 같다.

- 주문 중복 발생
- 결제 API 장애 전파
- 매장 운영 중 장애 원인 추적 어려움
- 수동 주문/결제 확인으로 인한 운영 비용 증가
- AI 생성 코드의 품질과 운영 안정성 검증 부재
- 로컬 개발 기준으로는 드러나지 않는 운영 환경 장애 시나리오

본 프로젝트는 AI-DLC를 활용해 요구사항 정의, 아키텍처 검토, 구현, 테스트, 운영 검증까지 추적 가능한 방식으로 수행한다.

## Target Users

### Customer

- 테이블에서 메뉴를 조회하고 주문하는 사용자
- 중복 결제나 중복 주문 없이 안정적으로 주문하고 싶어한다.

### Store Manager

- 주문 상태와 결제 상태를 확인하는 매장 관리자
- 장애 발생 시 어떤 주문이 실패했는지 빠르게 추적하고 싶어한다.

### Operator / DevOps

- 시스템 로그와 상태를 기반으로 장애를 분석하는 운영자
- 배포, 확장, 장애 복구 시 트래픽 유실과 데이터 불일치를 최소화하고 싶어한다.

## Business Value

- 주문 누락 및 중복 주문 감소
- 결제 장애 발생 시 안전한 상태 관리
- 장애 원인 추적 시간 단축
- AI-DLC 기반 개발 프로세스의 신뢰성 증명
- Cloud Native 운영 품질을 고려한 MVP 구현

---

# 3. Requirement Priority Matrix

본 프로젝트는 Product Ready 수준을 지향하되, 제한된 실습 시간 내에서 MVP Scope를 통제한다.

## Must Have

반드시 구현해야 하는 항목이다.

- 주문 생성 API
- 메뉴 조회 API
- 주문 상태 관리
- Idempotency Key 검증
- 외부 결제 API Timeout 처리
- Structured JSON Logging
- 환경 변수 기반 설정 분리
- 기본 단위 테스트
- 핵심 Edge Case 테스트

## Should Have

가능하면 구현해야 하며, 우승 차별화에 중요한 항목이다.

- Circuit Breaker
- Graceful Shutdown
- Readiness / Liveness Probe
- trace_id / correlation_id 전파
- ADR 문서 생성
- NFR Requirements 문서화
- Operational Readiness Review

## Could Have

시간이 허용되면 구현한다.

- Rate Limiting
- Chaos Test
- Redis 기반 Idempotency Store
- 관리자 대시보드
- 비용 분석 리포트
- OpenAPI 문서 자동 생성
- 간단한 부하 테스트 스크립트

## Won't Have in MVP

이번 실습/챌린지 범위에서는 제외한다.

- 실제 운영용 EKS 배포
- 실제 PG 연동
- 복잡한 멀티테넌트 권한 체계
- 실시간 WebSocket 주문 상태 동기화
- 완전한 MSA 분리
- 고도화된 권한/역할 관리 시스템

---

# 4. User Stories & Acceptance Criteria

Kiro는 사용자 스토리를 INVEST 원칙에 맞게 분리하고, Acceptance Criteria는 가능한 한 Gherkin 스타일로 작성한다.

---

## Story 1. 고객 주문 생성

As a customer,  
I want to place an order from my table,  
So that I can request food without waiting for staff.

### Acceptance Criteria

Given a valid table_id and menu items,  
When the customer submits an order,  
Then the system creates an order with Pending status.

Given the submitted menu items are invalid,  
When the customer submits an order,  
Then the system returns a structured validation error.

Given the same Idempotency Key is submitted twice,  
When the second request arrives,  
Then the system must not create a duplicate order.

---

## Story 2. 결제 요청 처리

As a customer,  
I want my payment request to be processed safely,  
So that I am not charged twice or left in an unknown state.

### Acceptance Criteria

Given a valid order exists,  
When payment is approved,  
Then the order status changes to Approved.

Given the external payment gateway times out,  
When payment cannot be confirmed within 3000ms,  
Then the order status must be isolated as Pending or Failed.

Given the payment API fails repeatedly,  
When the Circuit Breaker opens,  
Then the system must not continue calling the failing payment API.

---

## Story 3. 매장 관리자 장애 추적

As a store manager,  
I want to trace failed payment requests,  
So that I can understand whether the issue came from the payment gateway or the order system.

### Acceptance Criteria

Given a payment timeout occurs,  
When the order fails to complete,  
Then the system logs a CRITICAL structured JSON event with trace_id and order_id.

Given an order is stuck in Pending,  
When the manager checks the order,  
Then the system provides enough context to investigate the issue.

---

## Story 4. 운영자 배포 안정성

As an operator,  
I want the application to shut down gracefully,  
So that rolling updates or node terminations do not lose in-flight requests.

### Acceptance Criteria

Given the application receives SIGTERM,  
When graceful shutdown starts,  
Then readiness must fail before the process exits.

Given an in-flight request exists,  
When shutdown starts,  
Then the request should complete or fail safely within the configured grace period.

---

# 5. Architecture Blueprint

## [Architecture Pattern: Ports and Adapters]

본 프로젝트는 Hexagonal Architecture / Clean Architecture 패턴을 따른다.

목표는 AI가 생성한 코드가 프레임워크 중심 스파게티 구조로 흐르지 않도록, 비즈니스 로직과 외부 기술 의존성을 명확히 분리하는 것이다.

---

## Domain Layer (Core)

Domain Layer는 외부 기술에 의존하지 않는 순수 비즈니스 영역이다.

### Rules

- 외부 프레임워크, AWS SDK, DB 라이브러리에 직접 의존하지 않는다.
- 핵심 비즈니스 엔티티(Order, Payment, Table, Menu 등)를 포함한다.
- 주문 상태 전이 로직은 Domain Layer 내부에서만 수행한다.
- 외부 API 호출, DB 저장, 메시지 발행은 직접 수행하지 않는다.

### Required Entities

- Order
- OrderItem
- Payment
- Table
- MenuItem

### Order Status

주문 상태는 최소한 다음을 포함한다.

- Pending
- Approved
- Completed
- Failed
- Cancelled

---

## Application Layer

Application Layer는 Use Case 단위의 비즈니스 흐름을 담당한다.

### Responsibilities

- 주문 생성 Use Case
- 결제 처리 Use Case
- 주문 상태 변경 Use Case
- 멱등성 검증 Use Case
- 장애 발생 시 롤백 또는 보류 처리
- Transaction Boundary 정의

### Rules

- Domain Entity를 조합해 비즈니스 흐름을 수행한다.
- Infrastructure 구현체에 직접 의존하지 않고 Port 인터페이스에 의존한다.
- 외부 장애가 발생해도 도메인 상태를 안전하게 유지한다.

---

## Infrastructure & Adapter Layer

Infrastructure & Adapter Layer는 외부 시스템과의 연결을 담당한다.

### Adapter Targets

- DB Repository
- Payment Gateway
- Notification Service
- AWS SDK
- Redis
- Message Queue
- Logging Backend
- Config Provider

### Rules

- 모든 외부 시스템은 Port 인터페이스를 구현하는 Adapter 형태로 분리한다.
- 외부 장애가 Domain Layer로 직접 전파되지 않도록 한다.
- Timeout, Retry, Circuit Breaker는 Adapter 경계에서 우선 적용한다.

---

# 6. Kubernetes Runtime Requirements

본 시스템은 AWS EKS(Kubernetes) 배포를 전제로 설계한다.

실습 환경이 로컬이더라도, 설계와 코드 구조는 Kubernetes 배포를 고려해야 한다.

## Required Runtime Policies

- `/healthz` endpoint 구현
- `/readyz` endpoint 구현 권장
- Liveness Probe / Readiness Probe 분리
- Graceful Shutdown 구현
- SIGTERM 수신 시 신규 요청 차단
- 진행 중 요청 안전 종료
- Rolling Update 중 트래픽 유실 방지
- Karpenter 기반 노드 교체 고려
- Stateless Architecture 우선 설계

## Health Check Policy

### Liveness

프로세스가 살아있는지 확인한다.

- 애플리케이션 프로세스 상태
- 메인 이벤트 루프 상태
- 치명적 내부 오류 여부

### Readiness

트래픽을 받을 준비가 되었는지 확인한다.

- DB 연결 가능 여부
- 필수 설정 로드 여부
- Graceful Shutdown 진행 여부
- 외부 의존성 상태는 필요 시 degraded 상태로 표현

---

# 7. Resilience Engineering Policy

외부 의존성 장애가 전체 시스템 장애로 전파되지 않도록 설계한다.

## External API Policy

외부 PG 및 외부 서비스 연동에는 아래 정책을 강제 적용한다.

---

## Timeout Policy

- 모든 외부 API 호출은 최대 3000ms timeout을 적용한다.
- Timeout 값은 하드코딩하지 않고 환경 변수 또는 config로 주입한다.
- Timeout 발생 시 주문 상태를 알 수 없는 상태로 방치하지 않는다.

---

## Circuit Breaker Policy

다음 조건 중 하나라도 만족 시 Circuit Open 상태로 전환한다.

- 실패율 50% 초과
- 응답 시간 3000ms 초과 상태 5회 연속 발생

Circuit Open 시:

- 외부 API 추가 호출을 차단한다.
- 주문 상태를 Pending 또는 Failed로 안전하게 격리한다.
- Local Fallback을 수행한다.
- stdout 기반 CRITICAL 구조화 로그를 출력한다.
- 관리자 또는 운영자가 원인을 추적할 수 있는 context를 남긴다.

---

## Retry Policy

- Retry는 일시적 장애에 대해서만 제한적으로 수행한다.
- 결제 요청은 멱등성 키 없이 재시도하지 않는다.
- Exponential Backoff를 우선 고려한다.
- Retry Storm 발생 가능성을 검증한다.
- 무한 재시도를 금지한다.

---

# 8. Idempotency Policy

주문 생성 API는 반드시 Idempotency Key 검증을 수행한다.

## Requirements

- 동일 키 중복 요청 시 중복 주문 생성 금지
- 처리 중 요청은 `409 Conflict`
- 완료 요청은 기존 결과 반환 또는 안전 차단
- 네트워크 단절 / 클라이언트 재시도 상황 고려
- Idempotency Key는 요청 단위로 추적 가능해야 함
- 결제 재시도는 반드시 Idempotency Key 기반으로 수행

## Recommended Storage

MVP에서는 DB 기반 저장소를 사용할 수 있다.

확장 버전에서는 Redis 기반 Idempotency Store를 고려한다.

## State Examples

- PROCESSING
- COMPLETED
- FAILED
- EXPIRED

---

# 9. Rate Limiting Policy

동일 Table ID 기준 주문 API 호출을 제한한다.

## Token Bucket Policy

- 분당 최대 10회 요청 허용
- 초과 시 `429 Too Many Requests`
- 에러 응답은 구조화된 JSON 형식을 따른다.

## Purpose

- 중복 클릭 방지
- 악성 요청 방지
- 결제 API 보호
- 매장 단위 장애 확산 방지

---

# 10. Observability & Logging Standard

모든 로그는 stdout 기반 Structured JSON Logging을 사용한다.

파일 저장 기반 로깅은 금지한다.

## JSON Log Schema

```json
{
  "timestamp": "ISO8601",
  "trace_id": "UUID-v4",
  "correlation_id": "UUID-v4",
  "level": "INFO/WARN/ERROR/CRITICAL",
  "component": "Domain/Application/Adapter",
  "event": "ORDER_CREATED/PAYMENT_TIMEOUT/CIRCUIT_OPEN",
  "message": "Human readable context",
  "context": {
    "table_id": "string",
    "order_id": "string",
    "idempotency_key": "string",
    "execution_time_ms": "number"
  }
}
```

## Logging Rules

- 모든 요청에 trace_id 부여
- 전체 트랜잭션에 trace context 전파
- 비즈니스 메서드 시작/종료 로그 필수
- 예외 발생 지점 로그 필수
- 외부 API 호출 로그 필수
- OpenSearch / CloudWatch / Fluent Bit 파싱 가능 형태 유지
- Secret 값은 로그에 출력하지 않는다.

## Required Events

- ORDER_REQUEST_RECEIVED
- ORDER_CREATED
- DUPLICATE_ORDER_BLOCKED
- PAYMENT_REQUESTED
- PAYMENT_APPROVED
- PAYMENT_TIMEOUT
- CIRCUIT_OPEN
- CIRCUIT_HALF_OPEN
- CIRCUIT_CLOSED
- DB_TIMEOUT
- GRACEFUL_SHUTDOWN_STARTED
- GRACEFUL_SHUTDOWN_COMPLETED

---

# 11. Distributed Tracing Policy

trace_id 및 correlation_id는 아래 전체 계층에 전파되어야 한다.

- API Layer
- Application Layer
- Domain Service
- Repository Layer
- External API Adapter
- Async Worker
- Queue/Event Layer

로그만으로 단일 트랜잭션 전체 추적이 가능해야 한다.

## Trace Rules

- 외부 요청 유입 시 trace_id가 없으면 신규 생성한다.
- 내부 호출에는 동일 trace_id를 전파한다.
- 외부 API 호출에도 가능한 범위에서 correlation_id를 전달한다.
- 모든 에러 로그에는 trace_id와 order_id를 포함한다.

---

# 12. Configuration & Secret Management

다음 항목은 절대 하드코딩하지 않는다.

- DB Connection
- Secret Key
- JWT Secret
- External API Endpoint
- Timeout Value
- Circuit Breaker Threshold
- Rate Limit Threshold
- Environment Name

모든 설정은 다음 방식 중 하나로 주입한다.

- Environment Variable
- Config Mapping
- Secret Manager
- Parameter Store

Secret 값은 로그 출력 금지.

## Example Environment Variables

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

# 13. Security Requirements

보안은 기능 구현 이후에 덧붙이는 것이 아니라 기본 설계에 포함한다.

## Required Security Controls

- Secret 하드코딩 금지
- 입력값 검증
- SQL Injection 방지
- 인증 토큰 검증
- 관리자 API 보호
- CORS 정책 명시
- 에러 응답에서 내부 정보 노출 금지
- 로그에 개인정보/Secret 출력 금지

## Password Policy

인증 기능이 포함되는 경우:

- bcrypt 또는 검증된 해싱 알고리즘 사용
- Plain text password 저장 금지

---

# 14. FinOps & Cost-aware Architecture

모든 아키텍처 제안에는 비용 영향 분석을 포함한다.

## Preferred Design Principles

- Stateless Architecture
- Horizontal Scaling
- Spot/Karpenter 친화성
- 로그 저장 비용 최소화
- Idle Resource 최소화
- Scale-to-Zero 고려
- Cross-AZ Traffic 최소화
- 불필요한 Managed Service 사용 최소화

## Logging Cost Awareness

- DEBUG 로그는 기본 비활성화한다.
- 모든 요청의 과도한 payload logging을 금지한다.
- 장애 분석에 필요한 필드 중심으로 로그를 남긴다.

---

# 15. Architecture Decision Record (ADR) Policy

주요 기술 결정마다 ADR 문서를 생성한다.

## ADR Template

```markdown
# ADR-000X: Title

## Context

왜 이 결정이 필요한가?

## Decision

무엇을 선택했는가?

## Alternatives Considered

검토한 대안은 무엇인가?

## Trade-offs

장점과 단점은 무엇인가?

## Operational Impact

운영에 어떤 영향을 주는가?

## Security Impact

보안에 어떤 영향을 주는가?

## Cost Impact

비용에 어떤 영향을 주는가?
```

## Mandatory ADR Targets

- Database 선택
- 인증 방식
- API 구조
- Cache 전략
- Queue/Event 구조
- Kubernetes 배포 전략
- Circuit Breaker 정책
- Idempotency 저장소 선택
- Logging / Observability 전략

---

# 16. AI-DLC Governance Evidence Pack

본 프로젝트는 AI가 생성한 결과물을 무조건 승인하지 않고, 모든 주요 설계 결정에 대해 Human Review를 수행한다.

심사용 Evidence는 다음 산출물로 관리한다.

- `aidlc-docs/audit.md`: 주요 의사결정 및 승인 기록
- `aidlc-docs/inception/requirements/requirements.md`: 요구사항 정의
- `aidlc-docs/inception/requirements/enterprise-steering.md`: 본 Steering 문서
- `aidlc-docs/inception/user-stories/stories.md`: 사용자 스토리 및 인수 기준
- `aidlc-docs/inception/application-design/components.md`: 컴포넌트 구조
- `aidlc-docs/inception/application-design/component-dependency.md`: 의존성 구조
- `aidlc-docs/inception/plans/execution-plan.md`: 실행 계획
- `aidlc-docs/construction/*/functional-design/`: 기능 설계
- `aidlc-docs/construction/*/nfr-requirements/`: 유닛별 NFR 요구사항
- `tests/`: Edge Case 검증 코드
- `README.md`: 실행 방법 및 데모 시나리오

심사 시 단순 결과물이 아니라, AI-DLC 프로세스를 통해 품질을 통제한 근거를 함께 제시한다.

## Review Policy

Kiro가 다음 행동을 할 경우 Request Changes를 수행한다.

- NFR Design을 생략하려는 경우
- Infrastructure Design을 단순 로컬 개발 기준으로만 처리하는 경우
- 테스트 없이 구현 완료를 선언하는 경우
- Happy Path만 테스트하는 경우
- Domain Layer가 Infrastructure Layer에 직접 의존하는 경우
- Secret 또는 Endpoint를 하드코딩하는 경우
- 장애 시나리오를 고려하지 않는 경우

---

# 17. AI Generated Code Governance

Kiro는 생성한 코드가 항상 Production Grade라고 가정하지 않는다.

## Mandatory Validation Targets

- Hardcoded Secret 탐지
- SQL Injection 위험
- Race Condition 가능성
- Blocking I/O 탐지
- Transaction Boundary 검증
- Retry Storm 가능성
- Circular Dependency 검증
- Unhandled Exception 검증
- 비동기 처리 중 상태 불일치 가능성 검증

검증 없이 구현 완료 처리 금지.

## Code Review Checklist

- 함수/클래스 책임이 명확한가
- Domain과 Infrastructure가 분리되어 있는가
- 설정값이 환경 변수로 분리되어 있는가
- 예외 처리가 구조화되어 있는가
- 로그에 trace_id가 포함되는가
- 테스트가 실패 시나리오를 포함하는가
- README 실행 방법이 최신인가

---

# 18. Chaos Engineering Constraints

정상 흐름(Happy Path)만 검증하지 않는다.

## Mandatory Failure Scenarios

- DB Latency Injection
- External API Timeout
- Partial Network Partition
- Pod Restart During Transaction
- Duplicate Request Burst
- Redis Cache Miss Storm
- Readiness Probe Failure
- SIGTERM During Payment Processing

시스템은 장애 발생 시 아래 중 하나를 명확히 선택해야 한다.

- Fail Fast
- Graceful Degradation

## Expected Behaviors

- 중복 주문이 생성되지 않는다.
- 결제가 중복 호출되지 않는다.
- 주문 상태가 알 수 없는 상태로 방치되지 않는다.
- 로그만으로 장애 흐름을 추적할 수 있다.
- 장애가 전체 시스템으로 전파되지 않는다.

---

# 19. Test Coverage & Edge Case Requirements

테스트 명세를 구현보다 먼저 작성한다.

Happy Path 테스트만 작성하는 것을 금지한다.

## Mandatory Edge Case Tests

1. 중복 주문 요청 시 Idempotency Key 검증 테스트
2. 외부 결제 Timeout 시 Circuit Breaker 및 Rollback 테스트
3. DB Timeout 발생 시 Retry 및 구조화 로그 검증
4. SIGTERM 발생 시 Graceful Shutdown 검증
5. Readiness Probe 실패 시 트래픽 차단 검증
6. Duplicate Request Burst 상황 검증
7. Race Condition 상황 검증
8. 환경 변수 누락 시 명확한 설정 오류 반환 테스트
9. Secret 값이 로그에 노출되지 않는지 검증
10. 잘못된 입력값에 대한 구조화된 validation error 검증

## Test Style

- pytest 기반 테스트 권장
- 외부 API는 mock 또는 fake adapter로 대체
- DB 장애는 mock repository 또는 테스트 fixture로 재현
- 로그 검증은 stdout capture 방식으로 수행
- Circuit Breaker 상태 전이는 명확히 검증

---

# 20. Build, Run & Local Preview Requirements

실습 환경에서 빠르게 실행 가능해야 한다.

## Required Files

- `README.md`
- `.env.example`
- `requirements.txt` 또는 `pyproject.toml`
- `Dockerfile` 권장
- `tests/`
- `src/`

## Local Preview Constraints

AWS 이벤트 환경에서 Preview가 필요한 경우 다음 조건을 고려한다.

- Base path: `/table-order`
- Port: `8081`

## README Must Include

- 프로젝트 개요
- AI-DLC 활용 방식
- 실행 방법
- 테스트 방법
- 환경 변수 목록
- 데모 시나리오
- 주요 아키텍처 결정
- 제한사항

---

# 21. Operational Readiness Review

기능 구현 완료 후 아래 항목을 검증한다.

## Data Integrity

- 장애 시 데이터 정합성이 유지되는가
- 결제 실패 시 주문 상태가 안전하게 보존되는가
- 중복 요청이 중복 주문으로 이어지지 않는가

## Runtime Reliability

- Pod 재시작 시 요청 유실이 없는가
- Readiness 실패 시 트래픽이 차단되는가
- Graceful Shutdown이 동작하는가

## Observability

- 로그만으로 장애 원인 분석이 가능한가
- trace_id 기준으로 주문 생성부터 결제까지 추적 가능한가
- CRITICAL 이벤트가 명확히 남는가

## Configuration

- 환경 변수만으로 운영/스테이징 전환 가능한가
- Secret이 코드와 로그에 노출되지 않는가

## Scalability

- 수평 확장 시 세션 정합성이 유지되는가
- Stateless 구조를 유지하는가

---

# 22. Demo Scenario Script

최종 시연은 단순 성공 흐름보다 장애 대응과 운영성을 보여주는 방향으로 구성한다.

---

## Demo 1. Normal Order Flow

1. 고객이 Table ID로 메뉴를 조회한다.
2. 주문을 생성한다.
3. 결제 요청을 수행한다.
4. 주문 상태가 Approved로 전환된다.
5. trace_id 기준으로 전체 로그를 추적한다.

### Expected Result

- 주문 생성 성공
- 결제 승인 성공
- Structured JSON 로그 출력
- trace_id로 전체 흐름 확인 가능

---

## Demo 2. Duplicate Order Protection

1. 동일 Idempotency Key로 주문 요청을 2회 전송한다.
2. 첫 번째 요청은 정상 처리된다.
3. 두 번째 요청은 `409 Conflict`로 차단된다.
4. 중복 주문이 DB에 생성되지 않았음을 확인한다.

### Expected Result

- 중복 주문 미생성
- `DUPLICATE_ORDER_BLOCKED` 로그 출력
- order_id와 idempotency_key 추적 가능

---

## Demo 3. Payment Timeout Resilience

1. 외부 결제 API Timeout을 강제로 발생시킨다.
2. Circuit Breaker가 실패를 감지한다.
3. 주문 상태가 Pending 또는 Failed로 안전하게 격리된다.
4. CRITICAL 레벨 JSON 로그가 stdout에 출력된다.

### Expected Result

- 전체 시스템 장애로 전파되지 않음
- 주문 상태 안전 보존
- `PAYMENT_TIMEOUT`, `CIRCUIT_OPEN` 로그 출력

---

## Demo 4. Kubernetes Graceful Shutdown

1. 애플리케이션에 SIGTERM을 전달한다.
2. Readiness 상태가 false로 전환된다.
3. 신규 요청 유입이 차단된다.
4. 진행 중 요청은 정상 종료된다.

### Expected Result

- 트래픽 유실 최소화
- `GRACEFUL_SHUTDOWN_STARTED` 로그 출력
- `GRACEFUL_SHUTDOWN_COMPLETED` 로그 출력

---

## Demo 5. AI-DLC Governance Evidence

1. `aidlc-docs/audit.md`를 보여준다.
2. Request Changes 기록을 보여준다.
3. ADR 또는 실행 계획 변경 이력을 보여준다.
4. 테스트 결과를 보여준다.

### Expected Result

- AI가 만든 코드를 무조건 승인하지 않았음을 증명
- Human Review 기반 품질 통제 증명
- AI-DLC 프로세스 활용 능력 강조

---

# 23. Presentation Narrative

최종 발표에서는 앱 기능보다 “AI-DLC를 활용한 품질 통제”를 중심 메시지로 삼는다.

## Opening Message

우리는 테이블오더 앱을 만든 것이 아니라, AI가 생성한 코드를 실제 운영 가능한 제품으로 통제하는 방식을 증명했습니다.

## Problem

AI는 빠르게 코드를 만들 수 있지만, 운영 환경에서는 다음 문제가 발생할 수 있습니다.

- 중복 주문
- 중복 결제
- 외부 API 장애 전파
- 로그 추적 불가
- 설정 하드코딩
- 테스트 부재
- 아키텍처 오염

## Solution

우리는 AI-DLC Workflow 안에 다음 통제 장치를 넣었습니다.

- Human Approval Gate
- Architecture Decision Record
- Hexagonal Architecture
- NFR Requirements
- Edge Case Test
- Structured Logging
- Operational Readiness Review

## Differentiation

대부분의 MVP는 성공 흐름을 보여줍니다.

우리의 MVP는 실패 흐름을 통제합니다.

- 결제 Timeout
- 중복 주문
- SIGTERM
- DB Timeout
- Circuit Breaker
- Readiness Failure

## Closing Message

AI-DLC의 핵심은 AI가 코드를 많이 쓰게 하는 것이 아니라, 인간이 AI를 신뢰 가능한 개발 프로세스 안에서 통제하는 것입니다.

---

# 24. Approval Gate Policy

다음 조건을 만족하지 못하는 코드는 승인하지 않는다.

- Domain Layer가 Infrastructure Layer에 직접 의존
- Graceful Shutdown 미구현
- Health Check 미구현
- Structured JSON Logging 미구현
- Circuit Breaker 미적용
- Idempotency Key 미적용
- Environment Variable 미분리
- Edge Case 테스트 미구현
- Trace Context 전파 미구현
- Secret 하드코딩
- 장애 시나리오 미검증
- README 실행 방법 누락

---

# 25. Request Changes Prompt Templates

Kiro가 산출물을 생성한 뒤 부족한 부분이 있으면 아래 문구를 Request Changes에 사용할 수 있다.

---

## 25.1 NFR / Infra Design Skip 방지

```text
로컬 개발 기준이라는 이유로 Infrastructure Design과 NFR Design 단계를 건너뛰거나 생략하지 마세요. 본 프로젝트는 AWS EKS(Kubernetes) 운영 환경을 전제로 하므로, 헬스체크, JSON 로깅, 서킷 브레이커, 멱등성, Graceful Shutdown이 애플리케이션 컴포넌트 설계에 어떻게 반영되는지 구조적으로 명시하고 다음 단계로 진행하세요.
```

---

## 25.2 아키텍처 분리 미흡 시

```text
현재 설계는 Domain Layer와 Infrastructure Layer의 책임이 충분히 분리되어 있지 않습니다. Hexagonal Architecture 기준으로 Domain, Application, Adapter, Port를 명확히 분리하고, 외부 DB/API/AWS SDK 의존성이 Domain Layer로 침투하지 않도록 설계를 수정하세요.
```

---

## 25.3 테스트 부족 시

```text
현재 테스트 계획은 Happy Path 중심입니다. 중복 주문, 결제 Timeout, DB Timeout, Circuit Breaker Open, Graceful Shutdown, Readiness Failure 등 Edge Case 테스트를 명시적으로 추가하고, 각 테스트가 어떤 NFR을 검증하는지 연결해 주세요.
```

---

## 25.4 로그/관측성 부족 시

```text
현재 설계에는 운영자가 장애 원인을 추적하기 위한 Structured JSON Logging과 trace_id 전파 정책이 부족합니다. 모든 요청에 trace_id/correlation_id를 부여하고, 주문 생성부터 결제 처리 및 실패 지점까지 stdout JSON 로그로 추적 가능하도록 설계를 보완하세요.
```

---

## 25.5 보안/설정 분리 부족 시

```text
DB Connection, 외부 API Endpoint, Secret, Timeout, Circuit Breaker Threshold는 하드코딩하지 말고 환경 변수 또는 config mapping 구조로 주입받도록 수정하세요. Secret 값이 로그에 출력되지 않도록 검증 항목도 추가하세요.
```

---

# 26. First Prompt for Kiro

Kiro CLI 시작 시 아래 프롬프트를 사용할 수 있다.

```text
테이블오더 서비스를 구축하고 싶습니다.

다음 파일들에서 요구사항과 제약사항을 읽어주세요.

- requirements/table-order-requirements.md
- requirements/constraints.md
- AI-DLC-Enterprise-Steering-Pack.md

본 프로젝트는 단순 기능 구현이 아니라, AWS EKS(Kubernetes) 환경에서 운영 가능한 Product Ready 수준의 시스템을 목표로 합니다.

AI-DLC 워크플로우를 시작하되, Inception 단계에서 Business Intent, User Stories, Architecture Design, NFR Requirements, Infrastructure Design이 명확히 산출물로 남도록 진행해 주세요.

특히 다음 항목은 반드시 설계와 구현에 반영해야 합니다.

- Hexagonal Architecture
- Idempotency Key
- Circuit Breaker
- Timeout
- Structured JSON Logging
- trace_id / correlation_id
- Graceful Shutdown
- Health Check
- Environment Variable Configuration
- Edge Case Tests
- Human Approval Gate
```

---

# 27. Final Success Criteria

본 프로젝트는 다음 조건을 만족할 때 성공으로 간주한다.

## Functional Success

- 고객이 메뉴를 조회할 수 있다.
- 고객이 주문을 생성할 수 있다.
- 결제 요청 흐름이 존재한다.
- 주문 상태가 관리된다.

## NFR Success

- 중복 주문이 방지된다.
- 외부 결제 장애가 전체 시스템 장애로 전파되지 않는다.
- 장애 로그가 구조화되어 남는다.
- trace_id로 요청 흐름 추적이 가능하다.
- Graceful Shutdown이 동작한다.
- 설정값이 환경 변수로 분리된다.

## AI-DLC Success

- 요구사항이 명확히 문서화된다.
- User Story와 Acceptance Criteria가 존재한다.
- Architecture Decision이 기록된다.
- AI 산출물이 Human Review를 거친다.
- Request Changes 이력이 존재한다.
- Edge Case 테스트가 존재한다.
- 최종 데모가 성공 흐름과 실패 흐름을 모두 보여준다.

---

# 28. Final Positioning

이 프로젝트의 최종 포지셔닝은 다음과 같다.

> “가장 화려한 테이블오더 앱”이 아니라,  
> “AI-DLC를 가장 엔터프라이즈답게 활용해 운영 가능한 시스템을 만든 팀”

우리는 AI를 단순 코드 생성 도구로 사용하지 않는다.

우리는 AI를 다음 방식으로 통제한다.

- 요구사항으로 통제한다.
- 아키텍처로 통제한다.
- NFR로 통제한다.
- 테스트로 통제한다.
- 로그와 추적으로 통제한다.
- Human Approval로 통제한다.

최종 목표는 단순한 구현 완료가 아니라, AI 기반 개발 프로세스가 실제 운영 가능한 제품을 만들 수 있음을 증명하는 것이다.
