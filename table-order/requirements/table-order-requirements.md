# 테이블오더 서비스 요구사항 정의서

## 1. 프로젝트 개요

### 1.1 서비스 비전
디지털 주문 시스템을 통해 고객에게는 편리한 주문 경험을, 매장 운영자에게는 효율적인 운영 환경을 제공하는 차세대 테이블오더 플랫폼

본 프로젝트의 목표는 단순 기능 구현이 아니라, AWS EKS(Kubernetes) 환경에서 즉시 운영 가능한 Product Ready 수준의 애플리케이션 아키텍처를 증명하는 것이다.

### 1.2 핵심 가치 제안

**고객 관점**
- 대기 시간 없는 즉시 주문
- 직관적이고 사용하기 쉬운 인터페이스
- 중복 결제나 중복 주문 없이 안정적으로 주문

**매장 운영자 관점**
- 인건비 절감 및 운영 효율성 증대
- 실시간 주문 관리 및 모니터링
- 장애 발생 시 어떤 주문이 실패했는지 빠르게 추적

**운영자/DevOps 관점**
- 배포, 확장, 장애 복구 시 트래픽 유실과 데이터 불일치 최소화
- 로그만으로 장애 원인 분석 가능
- 무중단 배포 및 자동 스케일링

**시장 차별화**
- 다양한 업종에 적용 가능한 유연한 구조
- 직관적인 관리자 도구
- 엔터프라이즈 수준의 운영 안정성 (장애 격리, 중복 방지, 추적성)

### 1.3 핵심 문제 정의

- 주문 중복 발생
- 결제 API 장애 전파
- 매장 운영 중 장애 원인 추적 어려움
- 수동 주문/결제 확인으로 인한 운영 비용 증가
- 로컬 개발 기준으로는 드러나지 않는 운영 환경 장애 시나리오

---

## 2. 서비스 구성

### 2.1 주요 구성 요소
- **고객용 인터페이스**: 테이블에서 고객이 사용하는 주문 화면 (브라우저에서 동작하는 웹UI 방식)
- **관리자용 인터페이스**: 매장 운영자가 사용하는 관리 화면 
- **서버 시스템**: 주문 처리 및 데이터 관리
- **데이터 저장소**: 매장, 메뉴, 주문 정보 저장

### 2.2 아키텍처 패턴

본 프로젝트는 Hexagonal Architecture (Ports and Adapters) 패턴을 따른다.

**Domain Layer (Core)**:
- 외부 프레임워크, AWS SDK, DB 라이브러리에 직접 의존하지 않는 순수 비즈니스 영역
- 핵심 엔티티: Order, OrderItem, Payment, Table, MenuItem
- 주문 상태 전이 로직은 Domain Layer 내부에서만 수행
- 주문 상태: Pending → Approved → Completed / Failed / Cancelled

**Application Layer**:
- Use Case 단위의 비즈니스 흐름 담당
- Domain Entity를 조합해 비즈니스 흐름 수행
- Infrastructure 구현체에 직접 의존하지 않고 Port 인터페이스에 의존

**Infrastructure & Adapter Layer**:
- 외부 시스템(DB, Payment Gateway, Redis, Message Queue 등)과의 연결 담당
- 모든 외부 시스템은 Port 인터페이스를 구현하는 Adapter 형태로 분리
- Timeout, Retry, Circuit Breaker는 Adapter 경계에서 적용

---

## 3. 핵심 기능 요구사항

### 3.1 고객용 기능 (Customer Features)

#### 3.1.1 테이블 태블릿 자동 로그인 및 세션 관리
**목적**: 고객이 별도 로그인 절차 없이 즉시 주문할 수 있도록 자동 인증

**기능 요구사항**:
- **초기 설정 (관리자가 1회 수행)**:
  - 매장 식별자 입력
  - 테이블 번호 입력
  - 테이블 비밀번호 입력
  - 최종 로그인 정보 로컬 저장
- **자동 로그인**:
  - 1회 로그인 성공 후, 저장된 정보로 자동 로그인

#### 3.1.2 메뉴 조회 및 탐색
**목적**: 고객이 매장의 메뉴를 쉽게 탐색하고 선택할 수 있도록 지원

**기능 요구사항**:
- **기본 화면**: 메뉴 화면이 기본 화면으로 항상 표시
- 카테고리별 메뉴 분류 및 표시
- 메뉴 상세 정보 표시
  - 메뉴명
  - 가격
  - 메뉴 설명
  - 메뉴 이미지
- 카테고리 간 빠른 이동

**UI/UX 요구사항**:
- 카드 형태의 메뉴 레이아웃
- 터치 친화적인 버튼 크기 (최소 44x44px)
- 명확한 시각적 계층 구조

#### 3.1.3 장바구니 관리
**목적**: 주문 전 선택한 메뉴를 임시 저장하고 수정할 수 있는 기능

**기능 요구사항**:
- 메뉴 추가/삭제
- 수량 조절 (증가/감소)
- 총 금액 실시간 계산
- 장바구니 비우기
- 로컬 저장 (페이지 새로고침 시에도 유지)

**데이터 관리**:
- 클라이언트 측 임시 저장 (페이지 새로고침 시에도 유지)
- 서버 전송은 주문 확정 시에만 수행

#### 3.1.4 주문 생성
**목적**: 장바구니의 메뉴를 실제 주문으로 전환

**기능 요구사항**:
- 주문 내역 최종 확인
- 주문 확정 버튼
- **주문 성공 플로우**:
  - 주문 번호 표시
  - 장바구니 자동 비우기
  - 메뉴 화면으로 자동 리다이렉트
- 주문 실패 시 에러 메시지 표시 및 장바구니 유지

**주문 정보 포함 항목**:
- 매장 식별 정보
- 테이블 식별 정보
- 주문 메뉴 목록 (메뉴명, 수량, 단가)
- 총 주문 금액
- 세션 ID (테이블 세션 추적용)

#### 3.1.5 주문 내역 조회
**목적**: 현재 테이블의 주문 이력을 확인

**기능 요구사항**:
- 주문 시간 순 정렬
- 주문별 상세 정보 표시
  - 주문 번호
  - 주문 시각
  - 주문 메뉴 및 수량
  - 주문 금액
  - 주문 상태 (대기중/준비중/완료)
- 주문 상태 실시간 업데이트 (선택사항)

**데이터 필터링**:
- **현재 테이블 세션 주문만 표시** (이전 식사 세션 제외)
- 매장 이용 완료 처리된 주문은 제외
- 페이지네이션 또는 무한 스크롤


### 3.2 관리자용 기능 (Admin Features)

#### 3.2.1 매장 인증
**목적**: 관리자가 자신의 매장 관리 시스템에 접근

**기능 요구사항**:
- 매장 식별자 입력
- 사용자명 및 비밀번호 입력
- **세션 관리**:
  - 16시간 세션 유지
  - JWT 토큰 기반 인증
  - 브라우저 새로고침 시 세션 유지
  - 16시간 후 자동 로그아웃

**보안 요구사항**:
- 비밀번호 안전한 저장 (bcrypt 해싱)
- 로그인 시도 제한
- 세션 기반 인증

#### 3.2.2 실시간 주문 모니터링
**목적**: 들어오는 주문을 실시간으로 확인하고 관리

**기능 요구사항**:
- **주문 목록 실시간 업데이트** (Server-Sent Events 사용)
- **그리드/대시보드 레이아웃**:
  - 테이블별 카드 형태 표시
  - 각 테이블 카드에 총 주문액 표시
  - 최신 주문 n개 미리보기
- 주문별 상세 정보 표시
  - 테이블 번호
  - 주문 번호
  - 주문 시각
  - 주문 메뉴 및 수량 (축약)
  - 총 금액
- **주문 카드 클릭 시**: 전체 메뉴 목록 상세 보기
- 주문 상태 변경 (대기중/준비중/완료)
- 신규 주문 시각적 강조 (색상 변경, 애니메이션)

**업데이트 방식**:
- Server-Sent Events (SSE) 기반 실시간 통신
- 2초 이내 주문 표시

**UI 요구사항**:
- 그리드 형태의 테이블별 레이아웃
- 최신 주문 강조 표시
- 테이블별 필터링 기능


#### 3.2.3 테이블 관리
**목적**: 테이블별 주문 상태 관리 및 세션 라이프사이클 관리

**기능 요구사항**:

**1. 테이블 태블릿 초기 설정**:
- 테이블 번호 및 테이블 비밀번호 설정
- 16시간 세션 생성
- 설정 정보 저장 및 자동 로그인 활성화

**2. 주문 삭제 (직권 수정)**:
- 특정 주문 삭제 버튼
- 확인 팝업 표시
- 주문 즉시 삭제
- 테이블 총 주문액 재계산
- 성공/실패 피드백

**3. 테이블 세션 처리**:
- 테이블 세션 시작(세션의 첫 주문) 및 종료 관리(테이블 이용 완료)
- 확인 팝업 표시
- 테이블 세션 종료(이용 완료) 시, 해당 세션의 주문 내역을 과거 이력으로 이동
- 테이블 세션 종료(이용 완료) 시, 테이블 현재 주문 목록 및 총 주문액 0으로 리셋
- 새 고객이 이전 주문 내역 없이 시작 가능
- 성공/실패 피드백

**4. 과거 주문 내역 조회**:
- "과거 내역" 버튼
- 테이블별 과거 주문 목록 표시 (시간 역순)
- 각 주문 정보: 주문 번호, 시각, 메뉴 목록, 총 금액, 매장 이용 완료 시각
- 날짜 필터링 기능
- "닫기" 버튼으로 대시보드 복귀

**데이터 관리**:
- 주문 이력 데이터베이스 저장 (OrderHistory 테이블)
- 세션 ID로 주문 그룹화
- 완료 시각 기록

#### 3.2.4 메뉴 관리
**목적**: 메뉴 정보를 동적으로 관리

**기능 요구사항**:
- 메뉴 조회 (카테고리별)
- 메뉴 등록
  - 메뉴명
  - 가격
  - 설명
  - 카테고리
  - 이미지 URL
- 메뉴 수정
- 메뉴 삭제
- 메뉴 노출 순서 조정

**데이터 검증**:
- 필수 필드 검증
- 가격 범위 검증

---

## 4. MVP 개발 범위

### 핵심 기능 (필수)
**목표**: 기본적인 주문 프로세스 구현

**고객용**:
- 테이블 태블릿 자동 로그인 및 세션 관리
- 메뉴 조회
- 장바구니 관리
- 주문 생성 (5초 표시 후 자동 리다이렉트)
- 주문 내역 조회 (현재 세션만)

**관리자용**:
- 매장 인증 (16시간 세션)
- 실시간 주문 모니터링 (그리드 레이아웃, SSE)
- 테이블 관리 (초기 설정, 주문 삭제, 매장 이용 완료, 과거 내역 조회)

---

## 5. 비기능 요구사항 (NFR)

### 5.1 멱등성 (Idempotency)

주문 생성 API는 반드시 Idempotency Key 검증을 수행한다.

- 동일 키 중복 요청 시 중복 주문 생성 금지
- 처리 중 요청은 `409 Conflict` 반환
- 완료 요청은 기존 결과 반환 또는 안전 차단
- 네트워크 단절 / 클라이언트 재시도 상황 고려
- Idempotency Key는 요청 단위로 추적 가능
- MVP에서는 DB 기반 저장소 사용, 확장 시 Redis 기반 고려
- 상태: PROCESSING / COMPLETED / FAILED / EXPIRED

### 5.2 장애 격리 (Resilience)

**Timeout Policy**:
- 모든 외부 API 호출은 최대 3000ms timeout 적용
- Timeout 값은 환경 변수 또는 config로 주입 (하드코딩 금지)
- Timeout 발생 시 주문 상태를 알 수 없는 상태로 방치하지 않음

**Circuit Breaker Policy**:
- 실패율 50% 초과 또는 응답 시간 3000ms 초과 5회 연속 시 Circuit Open
- Circuit Open 시: 외부 API 추가 호출 차단, 주문 상태 안전 격리, CRITICAL 로그 출력
- Half-Open 상태에서 제한적 요청으로 복구 확인

**Retry Policy**:
- 일시적 장애에 대해서만 제한적 수행
- 결제 요청은 멱등성 키 없이 재시도 금지
- Exponential Backoff 적용
- 무한 재시도 금지

### 5.3 Rate Limiting

- 동일 Table ID 기준 분당 최대 10회 주문 API 호출 허용
- 초과 시 `429 Too Many Requests` 반환
- 에러 응답은 구조화된 JSON 형식

### 5.4 관측성 (Observability)

**Structured JSON Logging**:
- 모든 로그는 stdout 기반 Structured JSON Logging 사용
- 파일 저장 기반 로깅 금지
- 로그 스키마: timestamp, trace_id, correlation_id, level, component, event, message, context

**Distributed Tracing**:
- 모든 요청에 trace_id 부여
- trace_id 및 correlation_id는 API → Application → Domain → Repository → External API 전체 계층에 전파
- 로그만으로 단일 트랜잭션 전체 추적 가능

**필수 로그 이벤트**:
- ORDER_REQUEST_RECEIVED, ORDER_CREATED, DUPLICATE_ORDER_BLOCKED
- PAYMENT_REQUESTED, PAYMENT_APPROVED, PAYMENT_TIMEOUT
- CIRCUIT_OPEN, CIRCUIT_HALF_OPEN, CIRCUIT_CLOSED
- DB_TIMEOUT, GRACEFUL_SHUTDOWN_STARTED, GRACEFUL_SHUTDOWN_COMPLETED

### 5.5 Kubernetes 운영 요구사항

**Health Check**:
- `/healthz` endpoint 구현 (Liveness Probe)
- `/readyz` endpoint 구현 (Readiness Probe)
- Liveness: 프로세스 상태, 메인 이벤트 루프, 치명적 내부 오류 여부
- Readiness: DB 연결 가능 여부, 필수 설정 로드 여부, Graceful Shutdown 진행 여부

**Graceful Shutdown**:
- SIGTERM 수신 시 신규 요청 차단
- 진행 중 요청 안전 종료 (설정된 유예 기간 내)
- Readiness 상태 즉시 false 전환
- Rolling Update 중 트래픽 유실 방지

**Stateless Architecture**:
- 수평 확장 시 세션 정합성 유지
- Stateless 구조 우선 설계

### 5.6 보안 요구사항

- Secret 하드코딩 금지
- 입력값 검증 (SQL Injection 방지 포함)
- 인증 토큰 검증 (JWT)
- 관리자 API 보호
- CORS 정책 명시
- 에러 응답에서 내부 정보 노출 금지
- 로그에 개인정보/Secret 출력 금지
- 비밀번호: bcrypt 해싱 (Plain text 저장 금지)

### 5.7 설정 관리

다음 항목은 절대 하드코딩하지 않으며, 환경 변수 또는 Config Mapping으로 주입한다:
- DB Connection, Secret Key, JWT Secret
- External API Endpoint, Timeout Value
- Circuit Breaker Threshold, Rate Limit Threshold
- Environment Name

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

### 5.8 FinOps / 비용 인식 설계

- Stateless Architecture, Horizontal Scaling
- Spot/Karpenter 친화성
- DEBUG 로그 기본 비활성화
- 과도한 payload logging 금지
- Idle Resource 최소화

---

## 6. 우선순위 매트릭스

### Must Have (반드시 구현)
- 주문 생성 API / 메뉴 조회 API / 주문 상태 관리
- Idempotency Key 검증
- 외부 결제 API Timeout 처리
- Structured JSON Logging
- 환경 변수 기반 설정 분리
- 기본 단위 테스트 / 핵심 Edge Case 테스트

### Should Have (차별화 항목)
- Circuit Breaker
- Graceful Shutdown
- Readiness / Liveness Probe
- trace_id / correlation_id 전파
- ADR 문서 생성

### Could Have (시간 허용 시)
- Rate Limiting
- Redis 기반 Idempotency Store
- 관리자 대시보드 고도화
- OpenAPI 문서 자동 생성
- 간단한 부하 테스트 스크립트

### Won't Have in MVP
- 실제 운영용 EKS 배포
- 실제 PG 연동
- 복잡한 멀티테넌트 권한 체계
- 실시간 WebSocket 주문 상태 동기화
- 완전한 MSA 분리

---

## 7. 테스트 요구사항

### 7.1 필수 Edge Case 테스트

1. 중복 주문 요청 시 Idempotency Key 검증
2. 외부 결제 Timeout 시 Circuit Breaker 및 Rollback
3. DB Timeout 발생 시 Retry 및 구조화 로그 검증
4. SIGTERM 발생 시 Graceful Shutdown 검증
5. Readiness Probe 실패 시 트래픽 차단 검증
6. Duplicate Request Burst 상황 검증
7. Race Condition 상황 검증
8. 환경 변수 누락 시 명확한 설정 오류 반환
9. Secret 값이 로그에 노출되지 않는지 검증
10. 잘못된 입력값에 대한 구조화된 validation error 검증

### 7.2 테스트 스타일

- pytest 기반 테스트 권장
- 외부 API는 mock 또는 fake adapter로 대체
- DB 장애는 mock repository 또는 테스트 fixture로 재현
- 로그 검증은 stdout capture 방식으로 수행
- Circuit Breaker 상태 전이는 명확히 검증
- Happy Path 테스트만 작성하는 것을 금지

---

## 8. 빌드 및 실행 요구사항

### 8.1 필수 파일
- `README.md`
- `.env.example`
- `requirements.txt` 또는 `pyproject.toml`
- `Dockerfile` (권장)
- `tests/`
- `src/`

### 8.2 로컬 실행 조건
- Base path: `/table-order`
- Port: `8081`

### 8.3 README 필수 포함 항목
- 프로젝트 개요
- 실행 방법
- 테스트 방법
- 환경 변수 목록
- 데모 시나리오
- 주요 아키텍처 결정
- 제한사항

---

## 부록

### A. 용어 정의
- **MVP**: Minimum Viable Product (최소 기능 제품)
- **API**: Application Programming Interface (애플리케이션 프로그래밍 인터페이스)
- **UI/UX**: User Interface / User Experience (사용자 인터페이스 / 사용자 경험)
- **테이블 세션**: 특정 테이블에 고객이 앉아서 첫 주문 시작한 후 부터 해당 테이블 이용 완료 처리까지의 시간. 세션 종료 후 다른 고객의 첫 주문 시작 시, 새로운 세션 시작.
- **Idempotency Key**: 동일 요청의 중복 처리를 방지하기 위한 고유 식별자
- **Circuit Breaker**: 외부 서비스 장애 시 연쇄 장애를 방지하는 패턴
- **Graceful Shutdown**: 진행 중인 요청을 안전하게 완료한 후 프로세스를 종료하는 방식
- **trace_id**: 단일 요청의 전체 처리 흐름을 추적하기 위한 고유 식별자
- **SSE**: Server-Sent Events, 서버에서 클라이언트로 실시간 데이터를 전송하는 기술
- **ADR**: Architecture Decision Record, 주요 기술 결정을 기록하는 문서

### B. 참조 문서
- `requirements/AI-DLC-Enterprise-Steering-Pack.md`: 엔터프라이즈 아키텍처 거버넌스 상세
- `requirements/constraints.md`: 구현 제외 기능 목록
- `requirements/PR-FAQ.md`: 서비스 PR/FAQ 문서
