# 테이블오더 서비스 MVP 기능 목록

> Must Have 항목만 추출한 최소 기능 제품(MVP) 범위

---

## 고객용 기능 (Customer)

| ID | 기능 | 설명 |
|----|------|------|
| M-F01 | 메뉴 조회 | 카테고리별 메뉴 목록 조회, 상세 정보(메뉴명, 가격, 설명, 이미지) 표시 |
| M-F02 | 장바구니 관리 | 메뉴 추가/삭제, 수량 조절, 총액 실시간 계산, 로컬 저장(새로고침 유지) |
| M-F03 | 주문 생성 | 장바구니 확정 → 주문 생성, 주문 번호 발급, 성공 시 장바구니 초기화 및 메뉴 화면 리다이렉트 |
| M-F04 | 주문 내역 조회 | 현재 테이블 세션의 주문 이력 조회 (시간순 정렬, 상태 표시) |
| M-F05 | 테이블 태블릿 자동 로그인 | 관리자 1회 초기 설정 후 자동 로그인, 세션 관리 |

---

## 관리자용 기능 (Admin)

| ID | 기능 | 설명 |
|----|------|------|
| M-F06 | 매장 관리자 인증 | 매장 식별자 + 사용자명/비밀번호 로그인, JWT 기반 16시간 세션 유지 |
| M-F07 | 실시간 주문 모니터링 | SSE 기반 실시간 주문 표시, 테이블별 그리드/카드 레이아웃, 2초 이내 표시 |
| M-F08 | 주문 상태 관리 | 주문 상태 변경 (대기중 → 준비중 → 완료) |
| M-F09 | 테이블 세션 관리 | 세션 시작/종료(이용 완료), 종료 시 주문 이력 이동 및 리셋 |
| M-F10 | 주문 삭제 (직권) | 특정 주문 삭제, 확인 팝업, 총 주문액 재계산 |
| M-F11 | 메뉴 관리 | 메뉴 CRUD (등록/수정/삭제/조회), 카테고리 관리 |

---

## 비기능 요구사항 (Non-Functional)

| ID | 기능 | 설명 |
|----|------|------|
| M-N01 | Idempotency Key 검증 | 주문 생성 API 중복 요청 차단, 동일 키 재요청 시 409 Conflict 반환 |
| M-N02 | Structured JSON Logging | stdout 기반 구조화 로그 (timestamp, trace_id, level, event, context) |
| M-N03 | 환경 변수 기반 설정 분리 | DB, API Endpoint, Timeout, Secret 등 하드코딩 금지 |
| M-N04 | 입력값 검증 | 필수 필드 검증, 가격 범위 검증, SQL Injection 방지 |
| M-N05 | 비밀번호 안전 저장 | bcrypt 해싱, Plain text 저장 금지 |
| M-N06 | 기본 단위 테스트 | 핵심 비즈니스 로직 단위 테스트 |
| M-N07 | Edge Case 테스트 | 중복 주문, Timeout, 잘못된 입력값 등 최소 5개 시나리오 |
| M-N08 | Hexagonal Architecture | Domain/Application/Infrastructure 계층 분리 |
| M-N09 | 에러 응답 구조화 | 내부 정보 미노출, 구조화된 JSON 에러 응답 |

---

## MVP 구현 순서

```text
1. 프로젝트 스캐폴딩 (Hexagonal Architecture 구조)
2. 메뉴 조회 API + 고객 웹 UI
3. 장바구니 (클라이언트 로컬 저장)
4. 주문 생성 API + Idempotency Key
5. 주문 내역 조회 API
6. 관리자 인증 (JWT, bcrypt)
7. 실시간 주문 모니터링 (SSE + 그리드 레이아웃)
8. 주문 상태 관리
9. 테이블 세션 관리 + 주문 삭제
10. 메뉴 관리 (CRUD)
11. Structured JSON Logging + 환경 변수 분리
12. 단위 테스트 + Edge Case 테스트
```

---

## MVP 완료 기준

- [ ] 고객이 메뉴를 조회할 수 있다
- [ ] 고객이 장바구니에 메뉴를 담고 수량을 조절할 수 있다
- [ ] 고객이 주문을 생성하고 주문 번호를 받을 수 있다
- [ ] 동일 Idempotency Key로 중복 주문이 차단된다
- [ ] 고객이 현재 세션의 주문 내역을 조회할 수 있다
- [ ] 관리자가 로그인하여 16시간 세션을 유지할 수 있다
- [ ] 관리자가 실시간으로 신규 주문을 확인할 수 있다 (2초 이내)
- [ ] 관리자가 주문 상태를 변경할 수 있다
- [ ] 관리자가 테이블 세션을 종료(이용 완료)할 수 있다
- [ ] 관리자가 메뉴를 등록/수정/삭제할 수 있다
- [ ] 모든 로그가 stdout JSON 형식으로 출력된다
- [ ] 설정값이 환경 변수로 분리되어 있다
- [ ] 핵심 Edge Case 테스트가 통과한다

---

## 제외 항목 (MVP 범위 밖)

다음은 MVP에 포함하지 않으며, Should Have 이상으로 분류된 항목이다:

- 결제 처리 흐름 (외부 PG 연동 포함) → Should Have
- 주문서 출력 기능 → Should Have
- QR 코드 인쇄 기능 → Should Have
- Circuit Breaker / Graceful Shutdown → Should Have
- Health Check Endpoint → Should Have
- trace_id 전파 → Should Have
- Rate Limiting → Could Have
- Redis Idempotency Store → Could Have
