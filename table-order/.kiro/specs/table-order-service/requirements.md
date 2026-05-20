# Requirements Document

## Introduction

테이블오더 서비스는 음식점 등에서 고객이 테이블에 비치된 태블릿을 통해 직접 메뉴를 조회하고 주문할 수 있으며, 매장 관리자는 실시간 주문 모니터링, 테이블 세션 관리, 메뉴 관리를 수행할 수 있는 웹 기반 주문 플랫폼이다. 실제 PG 연동, 알림, 주방 기능, 배달 연동, 다국어 등은 MVP 범위에서 제외한다.

> 비기능 요구사항(아키텍처, 로깅, 장애 격리, 테스트 등)은 `nfr-guidelines.md`에 별도 보관하며, CONSTRUCTION 단계의 NFR Requirements/Design에서 반영한다.

### 기술 스택

- **Backend**: Python (FastAPI) — 비동기 처리, 자동 OpenAPI 문서 생성, Pydantic 기반 검증, EKS Pod 배포
- **Frontend**: React (Vite) — SPA, 정적 빌드 후 Nginx Pod으로 서빙
- **Database**: PostgreSQL (Amazon RDS) — ACID 트랜잭션, 주문/결제 데이터 정합성 보장, EKS 연동 안정성
- **실시간 통신**: SSE (Server-Sent Events)
- **인증**: JWT (16시간 세션)
- **배포**: AWS EKS (Kubernetes), 3-Pod MSA 구조
- **동시 접속 규모**: 매장당 15~20 테이블 기준

### 배포 아키텍처 (3-Pod MSA)

```
[Ingress / ALB]
├── /table-order/*          → Frontend Pod (Nginx + React 정적 파일)
├── /table-order/api/*      → Order Service Pod (FastAPI + Uvicorn)
└── /table-order/admin/*    → Admin Service Pod (FastAPI + Uvicorn)
```

**Frontend Pod**: Nginx + React 정적 빌드 서빙
**Order Service Pod (FastAPI)**: 고객 주문 흐름 — 메뉴 조회, 장바구니, 주문 생성/조회, Idempotency, SSE
**Admin Service Pod (FastAPI)**: 관리자 흐름 — 매장 등록, 인증, 주문 모니터링/상태 관리, 테이블 세션, 메뉴 CRUD

각 Pod는 독립적으로 스케일링/배포 가능하며, 장애 격리 경계를 형성한다.

### 프로젝트 구조

```
table-order/
├── frontend/              → React (Vite), Nginx Dockerfile
├── backend/
│   ├── order-service/     → 고객 주문 서비스 (FastAPI)
│   └── admin-service/     → 관리자 서비스 (FastAPI)
└── mock-payment/          → 장애 시뮬레이션용 Mock Payment (선택)
```

### DB 선택 근거

PostgreSQL을 선택한 이유:
1. **데이터 정합성**: 주문/결제는 ACID 트랜잭션이 필수 — NoSQL(MongoDB)은 트랜잭션 지원이 제한적
2. **비용 효율**: Amazon RDS PostgreSQL은 예측 가능한 비용, DocumentDB/MongoDB Serverless는 읽기/쓰기 단위 과금으로 주문 폭주 시 비용 급증 가능
3. **EKS 연동 안정성**: RDS + VPC 내 통신으로 네트워크 지연 최소화, SQLAlchemy/asyncpg 등 검증된 드라이버 생태계
4. **Idempotency Key 저장**: UNIQUE 제약 조건으로 중복 방지가 자연스러움
5. **확장성**: 읽기 부하 증가 시 Read Replica 추가로 대응 가능

> NoSQL이 적합한 경우: 메뉴 카탈로그처럼 스키마가 유동적이고 읽기 위주인 데이터. 그러나 MVP에서는 단일 DB로 단순화하는 것이 운영 복잡도를 줄인다.

## Glossary

- **Table_Order_System**: 테이블오더 서비스의 백엔드 서버 시스템 (Python FastAPI 기반)
- **Customer_Client**: 테이블에 비치된 태블릿에서 동작하는 고객용 웹 인터페이스
- **Admin_Client**: 매장 관리자가 사용하는 관리용 웹 인터페이스
- **Table_Session**: 특정 테이블에 고객이 앉아 첫 주문을 시작한 시점부터 매장 이용 완료 처리까지의 논리적 단위
- **Idempotency_Key**: 동일 요청의 중복 처리를 방지하기 위해 클라이언트가 생성하는 고유 식별자
- **SSE**: Server-Sent Events, 서버에서 클라이언트로 단방향 실시간 데이터를 전송하는 HTTP 기반 기술
- **JWT**: JSON Web Token, 관리자 인증에 사용되는 토큰 기반 인증 방식
- **Order_Status**: 주문의 상태 (PENDING, PREPARING, COMPLETED, CANCELLED, REJECTED)
- **Store**: 매장(음식점) 단위의 비즈니스 엔티티

## Requirements

### Requirement 1: 메뉴 조회

**User Story:** As a 고객, I want 카테고리별 메뉴 목록과 상세 정보를 조회할 수 있기를, so that 원하는 메뉴를 쉽게 찾아 주문할 수 있다.

#### Acceptance Criteria

1. WHEN a 고객이 메뉴 조회를 요청하면, THE Table_Order_System SHALL 해당 매장의 카테고리별 메뉴 목록을 반환한다
2. WHEN a 고객이 특정 메뉴의 상세 정보를 요청하면, THE Table_Order_System SHALL 메뉴명, 가격, 설명, 이미지 URL, 카테고리 정보를 포함한 응답을 반환한다
3. IF 존재하지 않는 매장 식별자로 메뉴를 요청하면, THEN THE Table_Order_System SHALL 404 상태 코드와 구조화된 에러 응답을 반환한다
4. IF 해당 매장에 등록된 메뉴가 없으면, THEN THE Table_Order_System SHALL 빈 목록을 포함한 200 응답을 반환한다

### Requirement 2: 장바구니 관리

**User Story:** As a 고객, I want 주문 전에 메뉴를 장바구니에 담고 수량을 조절할 수 있기를, so that 최종 주문 전에 선택을 검토하고 수정할 수 있다.

#### Acceptance Criteria

1. THE Customer_Client SHALL 메뉴 추가, 삭제, 수량 증가, 수량 감소 기능을 제공한다
2. WHEN a 고객이 장바구니에 메뉴를 추가하거나 수량을 변경하면, THE Customer_Client SHALL 총 금액을 즉시 재계산하여 표시한다
3. THE Customer_Client SHALL 장바구니 데이터를 브라우저 로컬 스토리지에 저장하여 페이지 새로고침 시에도 유지한다
4. WHEN a 고객이 장바구니 비우기를 요청하면, THE Customer_Client SHALL 모든 장바구니 항목을 삭제하고 총 금액을 0으로 표시한다
5. THE Customer_Client SHALL 장바구니 데이터를 주문 확정 시에만 서버로 전송한다

### Requirement 3: 주문 생성

**User Story:** As a 고객, I want 장바구니의 메뉴를 확정하여 주문을 생성할 수 있기를, so that 매장에 주문이 전달되고 주문 번호를 받을 수 있다.

#### Acceptance Criteria

1. WHEN a 고객이 주문 생성을 요청하면, THE Table_Order_System SHALL 매장 식별자, 테이블 식별자, 주문 메뉴 목록(메뉴명, 수량, 단가), 총 주문 금액, 세션 ID를 포함한 주문을 생성하고 고유 주문 번호를 반환한다
2. WHEN 주문 생성이 성공하면, THE Customer_Client SHALL 주문 번호를 5초간 표시한 후 장바구니를 초기화하고 메뉴 화면으로 자동 리다이렉트한다
3. IF 주문 생성이 실패하면, THEN THE Customer_Client SHALL 에러 메시지를 표시하고 장바구니 데이터를 유지한다
4. THE Table_Order_System SHALL 주문 생성 요청 시 Idempotency_Key를 필수로 검증한다
5. IF 동일한 Idempotency_Key로 중복 요청이 수신되면, THEN THE Table_Order_System SHALL 중복 주문을 생성하지 않고 409 Conflict 상태 코드를 반환한다
6. WHEN 주문이 생성되면, THE Table_Order_System SHALL 해당 주문의 초기 상태를 PENDING으로 설정한다

### Requirement 4: 주문 내역 조회

**User Story:** As a 고객, I want 현재 테이블 세션의 주문 이력을 확인할 수 있기를, so that 이전에 주문한 내역과 상태를 파악할 수 있다.

#### Acceptance Criteria

1. WHEN a 고객이 주문 내역을 요청하면, THE Table_Order_System SHALL 현재 Table_Session에 속한 주문만 시간순으로 정렬하여 반환한다
2. THE Table_Order_System SHALL 각 주문에 대해 주문 번호, 주문 시각, 주문 메뉴 및 수량, 주문 금액, Order_Status를 포함하여 반환한다
3. THE Table_Order_System SHALL 매장 이용 완료 처리된 이전 세션의 주문을 현재 세션 조회 결과에서 제외한다

### Requirement 5: 테이블 태블릿 자동 로그인

**User Story:** As a 고객, I want 별도 로그인 절차 없이 태블릿에서 즉시 주문할 수 있기를, so that 대기 시간 없이 바로 메뉴를 탐색하고 주문할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 태블릿 초기 설정을 완료하면(매장 식별자, 테이블 번호, 테이블 비밀번호 입력), THE Customer_Client SHALL 로그인 정보를 로컬에 저장하고 자동 로그인을 활성화한다
2. WHEN 태블릿이 재시작되거나 브라우저가 새로고침되면, THE Customer_Client SHALL 저장된 정보로 자동 로그인을 수행한다
3. IF 저장된 로그인 정보가 유효하지 않으면, THEN THE Customer_Client SHALL 초기 설정 화면을 표시한다

### Requirement 6: 매장 관리자 인증

**User Story:** As a 매장 관리자, I want 매장 관리 시스템에 안전하게 로그인할 수 있기를, so that 인가된 사용자만 주문 관리 및 매장 설정을 수행할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 매장 식별자, 사용자명, 비밀번호를 입력하여 로그인을 요청하면, THE Table_Order_System SHALL 자격 증명을 검증하고 JWT 토큰을 발급한다
2. THE Table_Order_System SHALL JWT 토큰의 유효 기간을 16시간으로 설정한다
3. WHILE JWT 토큰이 유효한 동안, THE Admin_Client SHALL 브라우저 새로고침 시에도 인증 상태를 유지한다
4. WHEN JWT 토큰이 만료되면, THE Table_Order_System SHALL 해당 토큰으로의 API 요청을 거부하고 401 상태 코드를 반환한다
5. THE Table_Order_System SHALL 비밀번호를 bcrypt 해싱으로 저장하고 평문 저장을 허용하지 않는다
6. IF 유효하지 않은 자격 증명으로 로그인을 시도하면, THEN THE Table_Order_System SHALL 401 상태 코드와 구조화된 에러 응답을 반환한다

### Requirement 7: 실시간 주문 모니터링

**User Story:** As a 매장 관리자, I want 신규 주문을 실시간으로 확인할 수 있기를, so that 주문 접수 후 즉시 준비를 시작할 수 있다.

#### Acceptance Criteria

1. THE Table_Order_System SHALL SSE(Server-Sent Events) 기반으로 관리자에게 실시간 주문 데이터를 전송한다
2. WHEN 신규 주문이 생성되면, THE Table_Order_System SHALL 2초 이내에 SSE를 통해 관리자에게 해당 주문 정보를 전달한다
3. THE Admin_Client SHALL 테이블별 그리드/카드 레이아웃으로 주문을 표시하고, 각 테이블 카드에 총 주문액과 최신 주문 미리보기를 포함한다
4. WHEN 관리자가 주문 카드를 클릭하면, THE Admin_Client SHALL 해당 주문의 전체 메뉴 목록 상세 정보를 표시한다
5. THE Admin_Client SHALL 신규 주문을 색상 변경 또는 애니메이션으로 시각적으로 강조한다

### Requirement 8: 주문 상태 관리

**User Story:** As a 매장 관리자, I want 주문 상태를 변경할 수 있기를, so that 주문 처리 진행 상황을 추적하고 고객에게 반영할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 주문 상태 변경을 요청하면, THE Table_Order_System SHALL Order_Status를 PENDING에서 PREPARING으로, PREPARING에서 COMPLETED로 전이한다
2. IF 허용되지 않는 상태 전이를 요청하면(예: PENDING에서 COMPLETED로 직접 전이), THEN THE Table_Order_System SHALL 400 상태 코드와 구조화된 에러 응답을 반환한다
3. THE Table_Order_System SHALL 주문 상태 전이 로직을 Domain_Layer 내부에서만 수행한다
4. WHEN 주문 상태가 변경되면, THE Table_Order_System SHALL SSE를 통해 관리자 화면에 변경 사항을 실시간으로 반영한다

### Requirement 9: 테이블 세션 관리

**User Story:** As a 매장 관리자, I want 테이블 세션을 시작하고 종료할 수 있기를, so that 고객 교체 시 주문 이력을 분리하고 테이블을 초기화할 수 있다.

#### Acceptance Criteria

1. WHEN 특정 테이블에서 첫 주문이 생성되면, THE Table_Order_System SHALL 해당 테이블의 새로운 Table_Session을 자동으로 시작한다
2. WHEN 관리자가 테이블 이용 완료를 요청하면, THE Table_Order_System SHALL 해당 Table_Session을 종료하고 세션의 주문 내역을 과거 이력으로 이동한다
3. WHEN Table_Session이 종료되면, THE Table_Order_System SHALL 해당 테이블의 현재 주문 목록과 총 주문액을 0으로 리셋한다
4. THE Admin_Client SHALL 테이블 이용 완료 처리 전에 확인 팝업을 표시한다
5. WHEN 관리자가 과거 내역 조회를 요청하면, THE Table_Order_System SHALL 테이블별 과거 주문 목록을 시간 역순으로 반환한다

### Requirement 10: 주문 삭제

**User Story:** As a 매장 관리자, I want 잘못된 주문을 삭제할 수 있기를, so that 오류 주문을 정정하고 정확한 주문 금액을 유지할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 특정 주문의 삭제를 요청하면, THE Table_Order_System SHALL 해당 주문을 삭제하고 테이블 총 주문액을 재계산한다
2. THE Admin_Client SHALL 주문 삭제 전에 확인 팝업을 표시한다
3. IF 존재하지 않는 주문 삭제를 요청하면, THEN THE Table_Order_System SHALL 404 상태 코드와 구조화된 에러 응답을 반환한다
4. WHEN 주문이 삭제되면, THE Admin_Client SHALL 성공 피드백을 표시하고 대시보드를 갱신한다

### Requirement 11: 메뉴 관리

**User Story:** As a 매장 관리자, I want 메뉴를 등록, 수정, 삭제할 수 있기를, so that 매장의 메뉴 정보를 최신 상태로 유지할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 메뉴 등록을 요청하면, THE Table_Order_System SHALL 메뉴명, 가격, 설명, 카테고리, 이미지 URL을 포함한 메뉴를 생성한다
2. WHEN 관리자가 메뉴 수정을 요청하면, THE Table_Order_System SHALL 해당 메뉴의 정보를 업데이트한다
3. WHEN 관리자가 메뉴 삭제를 요청하면, THE Table_Order_System SHALL 해당 메뉴를 삭제한다
4. THE Table_Order_System SHALL 메뉴 등록 및 수정 시 필수 필드(메뉴명, 가격, 카테고리)를 검증한다
5. IF 가격이 0 이하이거나 허용 범위를 초과하면, THEN THE Table_Order_System SHALL 400 상태 코드와 검증 에러 응답을 반환한다
6. WHEN 관리자가 카테고리별 메뉴 조회를 요청하면, THE Table_Order_System SHALL 해당 카테고리의 메뉴 목록을 반환한다

### Requirement 12: 매장 등록

**User Story:** As a 사업주, I want 새로운 매장을 시스템에 등록할 수 있기를, so that 매장별로 메뉴와 테이블을 관리하고 주문을 받을 수 있다.

#### Acceptance Criteria

1. WHEN 사업주가 매장 등록을 요청하면, THE Table_Order_System SHALL 매장명, 매장 식별자, 관리자 계정(사용자명, 비밀번호)을 포함한 매장을 생성한다
2. THE Table_Order_System SHALL 매장 식별자의 고유성을 검증하고, 중복 시 409 Conflict를 반환한다
3. WHEN 매장이 등록되면, THE Table_Order_System SHALL 해당 매장에 테이블을 추가할 수 있는 상태로 초기화한다
4. THE Table_Order_System SHALL 매장 등록 시 필수 필드(매장명, 매장 식별자, 관리자 사용자명, 비밀번호)를 검증한다

### Requirement 13: 주문 취소 및 거부

**User Story:** As a 고객, I want 주문을 취소할 수 있기를, so that 실수로 주문한 경우 정정할 수 있다.

**User Story:** As a 매장 관리자, I want 주문을 거부할 수 있기를, so that 재료 소진 등의 이유로 처리할 수 없는 주문을 안내할 수 있다.

#### Acceptance Criteria

1. WHEN 고객이 PENDING 상태의 주문 취소를 요청하면, THE Table_Order_System SHALL 해당 주문의 상태를 CANCELLED로 변경한다
2. IF 고객이 PREPARING 또는 COMPLETED 상태의 주문 취소를 요청하면, THEN THE Table_Order_System SHALL 400 상태 코드와 "취소 불가" 에러 응답을 반환한다
3. WHEN 관리자가 PENDING 상태의 주문 거부를 요청하면, THE Table_Order_System SHALL 해당 주문의 상태를 REJECTED로 변경한다
4. WHEN 주문이 취소 또는 거부되면, THE Table_Order_System SHALL 해당 테이블의 총 주문액을 재계산한다
5. WHEN 주문이 취소 또는 거부되면, THE Table_Order_System SHALL SSE를 통해 관리자 화면에 변경 사항을 실시간으로 반영한다

### Requirement 14: 메뉴 품절 처리

**User Story:** As a 매장 관리자, I want 메뉴의 품절 상태를 설정할 수 있기를, so that 고객이 주문할 수 없는 메뉴를 사전에 안내할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 메뉴의 품절 상태를 설정하면, THE Table_Order_System SHALL 해당 메뉴를 품절로 표시한다
2. WHEN 고객이 메뉴를 조회하면, THE Table_Order_System SHALL 품절된 메뉴에 품절 표시를 포함하여 반환한다
3. IF 고객이 품절된 메뉴를 포함한 주문을 생성하면, THEN THE Table_Order_System SHALL 400 상태 코드와 "품절 메뉴 포함" 에러 응답을 반환한다
4. WHEN 관리자가 메뉴의 품절 상태를 해제하면, THE Table_Order_System SHALL 해당 메뉴를 주문 가능 상태로 복원한다
