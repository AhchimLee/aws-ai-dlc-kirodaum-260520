# DB 마이그레이션 가이드

## RDS 접속 정보

| 항목 | 값 |
|------|-----|
| Host | `table-order-db.c016ec646u7j.us-east-1.rds.amazonaws.com` |
| Port | `5432` |
| Database | `table_order` |
| Username | `tableorder` |
| Password | AWS Secrets Manager → `table-order/db` |

## Bastion EC2

- IP: `54.198.252.128`
- User: `ec2-user`

## 실행 순서

```bash
# 1. EC2 접속
ssh ec2-user@54.198.252.128

# 2. 비밀번호 설정
export PGPASSWORD='<Secrets Manager에서 확인>'

# 3. 스키마 생성 (테이블 구조)
psql -h table-order-db.c016ec646u7j.us-east-1.rds.amazonaws.com \
     -p 5432 -U tableorder -d table_order \
     -f /path/to/schema.sql

# 4. 테스트 데이터 삽입
psql -h table-order-db.c016ec646u7j.us-east-1.rds.amazonaws.com \
     -p 5432 -U tableorder -d table_order \
     -f /path/to/seed.sql
```

## 파일 설명

| 파일 | 내용 |
|------|------|
| `schema.sql` | 테이블 구조 (DDL) - 7개 테이블, FK, 인덱스 |
| `seed.sql` | 테스트 데이터 - 매장 4개, 메뉴 33개, 테이블 40개 |

## 테이블 구조 요약

```
stores          - 매장 정보 (id, store_slug, name)
admins          - 관리자 계정 (store_id, username, password_hash)
tables          - 테이블 (store_id, table_number, table_password)
menu_items      - 메뉴 (store_id, name, price, category, is_sold_out)
orders          - 주문 (store_id, table_id, session_id, status, total_amount)
order_items     - 주문 항목 (order_id, menu_item_id, quantity)
table_sessions  - 테이블 세션 (table_id, store_id, status)
idempotency_keys - 중복 주문 방지 키
```

## 참고

- 앱(order-service, admin-service) 시작 시 `create_all`로 테이블 자동 생성됨
- seed.sql은 테스트용 더미 데이터 (운영 시 불필요)
- 비밀번호는 bcrypt 해시됨 (모든 admin 계정: `admin123`)
