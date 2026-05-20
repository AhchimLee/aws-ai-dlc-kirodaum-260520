# 테이블오더 서비스 제약사항 및 설계 원칙

---

## 1. 기능 제외 (구현하지 않음 — Won't Have in MVP)

### 1.1 결제 관련
- 실제 결제 처리 (카드, 현금, 디지털 지갑)
- 결제 게이트웨이 연동 (PG사 연동) — Mock으로 대체
- 영수증 발행 및 출력
- 환불 처리
- 포인트/쿠폰 시스템

### 1.2 인증 및 보안
- 복잡한 사용자 인증 (OAuth, SNS 로그인)
- 다단계 인증 (2FA, OTP)
- 고도화된 권한/역할 관리 시스템
- 복잡한 멀티테넌트 권한 체계

### 1.3 파일 및 컨텐츠 관리
- 이미지 리사이징/최적화
- 컨텐츠 관리 시스템
- 광고 기능

### 1.4 알림 시스템
- 푸시 알림 (모바일, 브라우저)
- SMS 알림
- 이메일 발송
- 소리/진동 알림

### 1.5 주방 기능
- 주문 내역 주방 전달 (KDS)
- 주방 식재료 재고 관리

### 1.6 고급 기능
- 데이터 분석 및 대시보드
- 매출 리포트 생성
- 재고 관리 시스템
- 직원 관리 및 권한 설정
- 예약 시스템
- 고객 리뷰 시스템
- 다국어 기능

### 1.7 외부 연동
- 배달 플랫폼 연동
- POS 시스템 연동
- 소셜 미디어 공유
- 지도 API
- 번역 API

### 1.8 인프라/배포
- 실제 운영용 EKS 배포
- 실시간 WebSocket 주문 상태 동기화 (SSE로 대체)
- 완전한 MSA 분리 (모놀리식 우선)

---

## 2. 아키텍처 제약 (Architecture Constraints)

### 2.1 필수 아키텍처 패턴
- **Hexagonal Architecture (Ports and Adapters)** 패턴을 반드시 따른다
- Domain Layer는 외부 프레임워크, AWS SDK, DB 라이브러리에 직접 의존하지 않는다
- 주문 상태 전이 로직은 Domain Layer 내부에서만 수행한다
- 모든 외부 시스템은 Port 인터페이스를 구현하는 Adapter 형태로 분리한다
- Domain Layer가 Infrastructure Layer에 직접 의존하는 코드는 승인하지 않는다

### 2.2 Stateless Architecture
- 수평 확장 시 세션 정합성이 유지되어야 한다
- Stateless 구조를 우선 설계한다
- 서버 측 세션 상태 저장을 최소화한다

### 2.3 Kubernetes 배포 전제
- 설계와 코드 구조는 AWS EKS(Kubernetes) 배포를 고려해야 한다
- 실습 환경이 로컬이더라도 운영 환경 구조를 반영한다

---

## 3. 기술 제약 (Technical Constraints)

### 3.1 런타임 환경
- Base path: `/table-order`
- Port: `8081`
- Python 기반 (pytest 테스트)

### 3.2 설정 관리 — 하드코딩 금지
다음 항목은 절대 하드코딩하지 않으며, 환경 변수 또는 Config Mapping으로 주입한다:
- DB Connection, Secret Key, JWT Secret
- External API Endpoint
- Timeout Value (기본 3000ms)
- Circuit Breaker Threshold
- Rate Limit Threshold
- Environment Name

### 3.3 로깅 제약
- 모든 로그는 stdout 기반 Structured JSON Logging만 사용한다
- 파일 저장 기반 로깅은 금지한다
- Secret 값은 로그에 출력하지 않는다
- 개인정보는 로그에 출력하지 않는다
- DEBUG 로그는 기본 비활성화한다
- 과도한 payload logging을 금지한다

### 3.4 외부 API 호출 제약
- 모든 외부 API 호출은 최대 3000ms timeout을 적용한다
- Timeout 값은 하드코딩하지 않고 환경 변수로 주입한다
- 결제 요청은 멱등성 키 없이 재시도하지 않는다
- 무한 재시도를 금지한다

### 3.5 데이터 무결성 제약
- 동일 Idempotency Key 중복 요청 시 중복 주문 생성을 금지한다
- Timeout 발생 시 주문 상태를 알 수 없는 상태로 방치하지 않는다
- 장애 발생 시 데이터 정합성이 유지되어야 한다

---

## 4. 보안 제약 (Security Constraints)

- Secret 하드코딩 금지
- 입력값 검증 필수 (SQL Injection 방지 포함)
- 인증 토큰 검증 (JWT)
- 관리자 API 보호 필수
- CORS 정책 명시적 설정
- 에러 응답에서 내부 정보(스택 트레이스, DB 구조 등) 노출 금지
- 비밀번호: bcrypt 해싱 필수 (Plain text 저장 금지)
- 로그에 개인정보/Secret 출력 금지

---

## 5. 테스트 제약 (Testing Constraints)

- Happy Path 테스트만 작성하는 것을 금지한다
- 테스트 명세를 구현보다 먼저 작성한다
- 외부 API는 mock 또는 fake adapter로 대체한다
- DB 장애는 mock repository 또는 테스트 fixture로 재현한다
- 검증 없이 구현 완료 처리를 금지한다

---

## 6. 운영 제약 (Operational Constraints)

### 6.1 Health Check 필수
- `/healthz` endpoint 구현 (Liveness Probe)
- `/readyz` endpoint 구현 (Readiness Probe)

### 6.2 Graceful Shutdown 필수
- SIGTERM 수신 시 신규 요청 차단
- 진행 중 요청 안전 종료
- Readiness 상태 즉시 false 전환

### 6.3 장애 격리 필수
- 외부 의존성 장애가 전체 시스템 장애로 전파되지 않도록 설계
- Circuit Breaker 적용 (실패율 50% 초과 또는 slow call 5회 연속 시 Open)
- 장애 발생 시 Fail Fast 또는 Graceful Degradation 중 하나를 명확히 선택

---

## 7. FinOps 제약 (Cost Constraints)

- Stateless Architecture 우선
- Horizontal Scaling 가능 구조
- Spot/Karpenter 친화적 설계
- 로그 저장 비용 최소화
- Idle Resource 최소화
- Cross-AZ Traffic 최소화
- 불필요한 Managed Service 사용 최소화

---

## 8. AI-DLC 거버넌스 제약 (Governance Constraints)

### 8.1 승인 불가 조건
다음 조건을 만족하지 못하는 코드는 승인하지 않는다:
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

### 8.2 AI 생성 코드 검증 필수 항목
- Hardcoded Secret 탐지
- SQL Injection 위험
- Race Condition 가능성
- Blocking I/O 탐지
- Transaction Boundary 검증
- Retry Storm 가능성
- Circular Dependency 검증
- Unhandled Exception 검증
- 비동기 처리 중 상태 불일치 가능성 검증

### 8.3 NFR/Infra Design 생략 금지
- 로컬 개발 기준이라는 이유로 Infrastructure Design과 NFR Design 단계를 생략하지 않는다
- AWS EKS 운영 환경을 전제로 설계한다

---

## 9. 필수 산출물 (Required Artifacts)

- `README.md` (프로젝트 개요, 실행 방법, 테스트 방법, 환경 변수, 데모 시나리오, 제한사항)
- `.env.example`
- `requirements.txt` 또는 `pyproject.toml`
- `Dockerfile` (권장)
- `tests/` (Edge Case 포함)
- `src/` (Hexagonal Architecture 구조)
- `aidlc-docs/audit.md` (의사결정 기록)
