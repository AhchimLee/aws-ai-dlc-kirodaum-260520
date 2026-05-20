# QA 테스트 매뉴얼 — Table Order Service

## 테스트 환경 준비

### 접속 정보
- **Frontend**: `http://<ALB_URL>/`
- **Order API (Swagger)**: `http://<ALB_URL>/api/docs`
- **Admin API (Swagger)**: `http://<ALB_URL>/admin/api/docs`

### 로컬 테스트 시
```bash
docker compose up --build
# Frontend: http://localhost:3000
# Order API: http://localhost:8081/docs
# Admin API: http://localhost:8082/docs
```

---

## 테스트 시나리오 목록

### Phase 1: 인프라 Health Check

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 1.1 | Order Service Liveness | `curl <URL>/api/v1/healthz` | `{"status": "alive"}` (200) |
| 1.2 | Order Service Readiness | `curl <URL>/api/v1/readyz` | `{"status": "ready"}` (200) |
| 1.3 | Admin Service Liveness | `curl <URL>/admin/api/v1/healthz` | `{"status": "alive"}` (200) |
| 1.4 | Admin Service Readiness | `curl <URL>/admin/api/v1/readyz` | `{"status": "ready"}` (200) |
| 1.5 | Frontend 접속 | 브라우저에서 `<URL>/` 접속 | React 페이지 표시 |

---

### Phase 2: 매장 등록 및 관리자 인증

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 2.1 | 매장 등록 | POST `/admin/api/v1/stores` | 201 Created + store_id 반환 |
| 2.2 | 중복 매장 등록 | 동일 store_slug로 재등록 | 409 Conflict |
| 2.3 | 관리자 로그인 | POST `/admin/api/v1/auth/login` | JWT 토큰 반환 |
| 2.4 | 잘못된 비밀번호 | 틀린 password로 로그인 | 401 Unauthorized |

#### 2.1 매장 등록 요청 예시
```bash
curl -X POST http://<URL>/admin/api/v1/stores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "맛있는 식당",
    "store_slug": "tasty-restaurant",
    "admin_username": "admin",
    "admin_password": "password123"
  }'
```

#### 2.3 로그인 요청 예시
```bash
curl -X POST http://<URL>/admin/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "store_slug": "tasty-restaurant",
    "username": "admin",
    "password": "password123"
  }'
# 응답에서 token 값을 저장 → 이후 요청에 사용
```

---

### Phase 3: 메뉴 관리 (관리자)

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 3.1 | 메뉴 등록 | POST `/admin/api/v1/menus` (JWT 필요) | 201 + menu_id |
| 3.2 | 메뉴 목록 조회 | GET `/admin/api/v1/menus` | 등록한 메뉴 목록 |
| 3.3 | 메뉴 수정 | PUT `/admin/api/v1/menus/{id}` | 200 + 수정된 정보 |
| 3.4 | 메뉴 삭제 | DELETE `/admin/api/v1/menus/{id}` | 204 No Content |
| 3.5 | 품절 설정 | PATCH `/admin/api/v1/menus/{id}/sold-out` | is_sold_out: true |
| 3.6 | 가격 0 이하 등록 | price: -1000 으로 등록 | 422 Validation Error |
| 3.7 | 필수 필드 누락 | name 없이 등록 | 422 Validation Error |

#### 3.1 메뉴 등록 예시
```bash
TOKEN="<로그인에서 받은 JWT>"

curl -X POST http://<URL>/admin/api/v1/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "김치찌개",
    "price": 9000,
    "category": "찌개류",
    "description": "돼지고기 김치찌개",
    "image_url": ""
  }'
```

---

### Phase 4: 고객 메뉴 조회

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 4.1 | 매장 메뉴 조회 | GET `/api/v1/stores/{store_id}/menus` | 카테고리별 메뉴 목록 |
| 4.2 | 메뉴 상세 조회 | GET `/api/v1/menus/{menu_id}` | 메뉴 상세 정보 |
| 4.3 | 없는 매장 조회 | 잘못된 store_id | 404 Not Found |
| 4.4 | 품절 메뉴 표시 | 품절 설정 후 조회 | is_sold_out: true |

#### 4.1 메뉴 조회 예시
```bash
curl http://<URL>/api/v1/stores/<store_id>/menus
```

---

### Phase 5: 주문 생성 (고객)

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 5.1 | 정상 주문 생성 | POST `/api/v1/orders` + X-Idempotency-Key | 201 + order_number |
| 5.2 | 중복 주문 (같은 Key) | 동일 Idempotency Key로 재요청 | 기존 주문 반환 (멱등성) |
| 5.3 | 품절 메뉴 주문 | 품절 메뉴 포함 주문 | 422 + MENU_ITEM_SOLD_OUT |
| 5.4 | Idempotency Key 없이 | 헤더 누락 | 422 Validation Error |
| 5.5 | 빈 아이템 목록 | items: [] | 422 Validation Error |

#### 5.1 주문 생성 예시
```bash
curl -X POST http://<URL>/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "store_id": "<store_id>",
    "table_id": "<table_id>",
    "items": [
      {"menu_item_id": "<menu_id>", "quantity": 2}
    ]
  }'
```

---

### Phase 6: 주문 내역 조회

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 6.1 | 세션별 주문 조회 | GET `/api/v1/sessions/{session_id}/orders` | 주문 목록 (시간순) |
| 6.2 | 주문 상세 확인 | 응답 필드 검증 | order_number, status, items, total_amount 포함 |

---

### Phase 7: 주문 상태 관리 (관리자)

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 7.1 | PENDING → PREPARING | PATCH `/admin/api/v1/orders/{id}/status` | status: PREPARING |
| 7.2 | PREPARING → COMPLETED | 동일 엔드포인트 | status: COMPLETED |
| 7.3 | 잘못된 전이 (PENDING→COMPLETED) | 직접 COMPLETED로 변경 | 422 Invalid transition |
| 7.4 | 주문 거부 | PATCH `/admin/api/v1/orders/{id}/reject` | status: REJECTED |
| 7.5 | PREPARING 상태 거부 | PREPARING 주문 거부 시도 | 422 (PENDING만 가능) |
| 7.6 | 주문 삭제 | DELETE `/admin/api/v1/orders/{id}` | 204 No Content |

#### 7.1 상태 변경 예시
```bash
curl -X PATCH http://<URL>/admin/api/v1/orders/<order_id>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

---

### Phase 8: 주문 취소 (고객)

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 8.1 | PENDING 주문 취소 | PATCH `/api/v1/orders/{id}/cancel` | status: CANCELLED |
| 8.2 | PREPARING 주문 취소 | 이미 접수된 주문 취소 | 422 (PENDING만 취소 가능) |

---

### Phase 9: 테이블 세션 관리

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 9.1 | 자동 세션 생성 | 첫 주문 시 세션 자동 생성 확인 | session_id 반환 |
| 9.2 | 세션 종료 | POST `/admin/api/v1/sessions/{table_id}/close` | status: CLOSED |
| 9.3 | 세션 이력 조회 | GET `/admin/api/v1/sessions/{table_id}/history` | 과거 세션 목록 |
| 9.4 | 종료 후 새 세션 | 세션 종료 후 새 주문 생성 | 새 session_id 생성 |

---

### Phase 10: 실시간 SSE

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 10.1 | SSE 연결 | GET `/api/v1/sse/orders?store_id=<id>` | text/event-stream 응답 |
| 10.2 | 주문 생성 이벤트 | SSE 연결 중 주문 생성 | order_created 이벤트 수신 |
| 10.3 | 상태 변경 이벤트 | SSE 연결 중 상태 변경 | order_status_changed 이벤트 |
| 10.4 | Heartbeat | 30초 대기 | heartbeat 이벤트 수신 |

#### 10.1 SSE 연결 예시
```bash
curl -N http://<URL>/api/v1/sse/orders?store_id=<store_id>
# 다른 터미널에서 주문 생성 → 이벤트 수신 확인
```

---

### Phase 11: 보안 테스트

| # | 테스트 항목 | 방법 | 기대 결과 |
|---|------------|------|-----------|
| 11.1 | JWT 없이 관리자 API | Authorization 헤더 없이 요청 | 401/403 |
| 11.2 | 만료된 JWT | 만료된 토큰으로 요청 | 401 |
| 11.3 | 잘못된 JWT | 임의 문자열로 요청 | 401 |
| 11.4 | trace_id 전파 | 응답 헤더 확인 | X-Trace-ID 헤더 존재 |

---

## 전체 테스트 실행 스크립트

```bash
#!/bin/bash
BASE_URL="http://<ALB_URL>"

echo "=== Phase 1: Health Check ==="
curl -sf $BASE_URL/api/v1/healthz && echo " ✅ Order healthz"
curl -sf $BASE_URL/api/v1/readyz && echo " ✅ Order readyz"
curl -sf $BASE_URL/admin/api/v1/healthz && echo " ✅ Admin healthz"
curl -sf $BASE_URL/admin/api/v1/readyz && echo " ✅ Admin readyz"

echo ""
echo "=== Phase 2: Store Registration ==="
STORE=$(curl -sf -X POST $BASE_URL/admin/api/v1/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트식당","store_slug":"test-store","admin_username":"admin","admin_password":"pass123"}')
echo $STORE
STORE_ID=$(echo $STORE | python3 -c "import sys,json; print(json.load(sys.stdin)['store_id'])")
echo "Store ID: $STORE_ID"

echo ""
echo "=== Phase 2: Login ==="
LOGIN=$(curl -sf -X POST $BASE_URL/admin/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"store_slug":"test-store","username":"admin","password":"pass123"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token acquired ✅"

echo ""
echo "=== Phase 3: Menu Creation ==="
MENU=$(curl -sf -X POST $BASE_URL/admin/api/v1/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"김치찌개","price":9000,"category":"찌개류","description":"맛있는 김치찌개"}')
MENU_ID=$(echo $MENU | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Menu created: $MENU_ID ✅"

echo ""
echo "=== Phase 5: Order Creation ==="
ORDER=$(curl -sf -X POST $BASE_URL/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-key-001" \
  -d "{\"store_id\":\"$STORE_ID\",\"table_id\":\"00000000-0000-0000-0000-000000000001\",\"items\":[{\"menu_item_id\":\"$MENU_ID\",\"quantity\":2}]}")
echo $ORDER
echo "Order created ✅"

echo ""
echo "=== All basic tests passed! ==="
```

---

## 테스트 결과 기록 양식

| Phase | 테스트 항목 | 결과 | 비고 |
|-------|------------|------|------|
| 1 | Health Check | ⬜ Pass / ⬜ Fail | |
| 2 | 매장 등록/로그인 | ⬜ Pass / ⬜ Fail | |
| 3 | 메뉴 CRUD | ⬜ Pass / ⬜ Fail | |
| 4 | 메뉴 조회 | ⬜ Pass / ⬜ Fail | |
| 5 | 주문 생성 | ⬜ Pass / ⬜ Fail | |
| 6 | 주문 조회 | ⬜ Pass / ⬜ Fail | |
| 7 | 상태 관리 | ⬜ Pass / ⬜ Fail | |
| 8 | 주문 취소 | ⬜ Pass / ⬜ Fail | |
| 9 | 세션 관리 | ⬜ Pass / ⬜ Fail | |
| 10 | SSE 실시간 | ⬜ Pass / ⬜ Fail | |
| 11 | 보안 | ⬜ Pass / ⬜ Fail | |
