# Table Order - 테이블 주문 시스템

> 식당 테이블 QR 코드 기반 주문 시스템 | Restaurant Table QR-based Ordering System

## 프로젝트 개요 (Project Overview)

**Table Order**는 식당에서 고객이 QR 코드를 스캔하여 직접 메뉴를 주문하고, 관리자가 실시간으로 주문을 관리할 수 있는 풀스택 웹 애플리케이션입니다.

**Table Order** is a full-stack web application that enables restaurant customers to place orders by scanning QR codes at their tables, while administrators manage orders in real-time.

### 주요 기능 (Key Features)

- 🍽️ **고객 메뉴 조회** - 카테고리별 메뉴 브라우징, 품절 표시
- 🛒 **장바구니 & 주문** - 멱등성 키 기반 중복 주문 방지
- 📋 **주문 내역 조회** - 테이블별 주문 상태 실시간 확인
- 🔐 **관리자 인증** - JWT 기반 관리자 로그인
- 📊 **실시간 대시보드** - SSE 기반 주문 실시간 모니터링
- 🍽️ **메뉴 관리** - CRUD + 품절 토글

---

## 아키텍처 (Architecture)

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│                    React + Vite + TypeScript                     │
└──────────────┬──────────────────────────────────┬───────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│     Order Service        │    │      Admin Service            │
│     (FastAPI :8081)      │    │      (FastAPI :8082)          │
│                          │    │                               │
│  - GET /api/v1/menus     │    │  - POST /admin/api/v1/auth    │
│  - POST /api/v1/orders   │    │  - GET  /admin/api/v1/orders  │
│  - GET /api/v1/orders    │    │  - PATCH /admin/api/v1/orders │
│  - GET /api/v1/healthz   │    │  - CRUD /admin/api/v1/menus   │
│                          │    │  - SSE  /admin/api/v1/sse     │
└──────────────┬───────────┘    └──────────────┬────────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
                 ┌──────────────────────────┐
                 │    PostgreSQL 16          │
                 │    (table_order DB)       │
                 └──────────────────────────┘
```

---

## 기술 스택 (Tech Stack)

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite 5, React Router 6   |
| Backend     | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic  |
| Database    | PostgreSQL 16 (asyncpg)                         |
| Auth        | JWT (PyJWT)                                     |
| Real-time   | Server-Sent Events (SSE)                        |
| Container   | Docker, Docker Compose                          |
| Orchestration | Kubernetes (EKS), ALB Ingress Controller      |
| Observability | Prometheus, Fluent Bit, CloudWatch            |
| CI/CD       | GitHub Actions (planned)                        |

---

## 빠른 시작 (Quick Start)

### 사전 요구사항

- Docker & Docker Compose v2+
- (선택) Node.js 20+ (프론트엔드 개발 시)
- (선택) Python 3.12+ (백엔드 개발 시)

### Docker Compose로 실행

```bash
cd table-order

# 환경 변수 설정
cp .env.example .env

# 전체 서비스 실행
docker-compose up --build

# 접속
# Frontend: http://localhost:3000
# Order API: http://localhost:8081/docs
# Admin API: http://localhost:8082/docs
```

### 로컬 개발 (Backend)

```bash
# Order Service
cd backend/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081

# Admin Service
cd backend/admin
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8082
```

### 로컬 개발 (Frontend)

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## API 엔드포인트 요약 (API Endpoints)

### Order Service (`:8081`)

| Method | Endpoint              | Description          |
|--------|-----------------------|---------------------|
| GET    | /api/v1/menus         | 메뉴 목록 조회       |
| POST   | /api/v1/orders        | 주문 생성            |
| GET    | /api/v1/orders        | 주문 내역 조회       |
| GET    | /api/v1/healthz       | Liveness probe       |
| GET    | /api/v1/readyz        | Readiness probe      |

### Admin Service (`:8082`)

| Method | Endpoint                          | Description          |
|--------|-----------------------------------|---------------------|
| POST   | /admin/api/v1/auth/login          | 관리자 로그인        |
| GET    | /admin/api/v1/orders              | 전체 주문 조회       |
| PATCH  | /admin/api/v1/orders/:id/status   | 주문 상태 변경       |
| GET    | /admin/api/v1/menus               | 메뉴 목록 조회       |
| POST   | /admin/api/v1/menus               | 메뉴 추가            |
| PUT    | /admin/api/v1/menus/:id           | 메뉴 수정            |
| DELETE | /admin/api/v1/menus/:id           | 메뉴 삭제            |
| PATCH  | /admin/api/v1/menus/:id/sold-out  | 품절 상태 토글       |
| GET    | /admin/api/v1/sse/orders          | 실시간 주문 SSE      |
| GET    | /admin/api/v1/healthz             | Liveness probe       |
| GET    | /admin/api/v1/readyz              | Readiness probe      |

---

## 디렉토리 구조 (Directory Structure)

```text
table-order/
├── backend/
│   ├── api/                    # Order Service (고객 주문 API)
│   │   ├── app/
│   │   │   ├── domain/         # 도메인 모델, 엔티티
│   │   │   ├── application/    # 유스케이스, 서비스
│   │   │   └── infrastructure/ # DB, 라우터, 외부 연동
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── admin/                  # Admin Service (관리자 API)
│       ├── app/
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── k8s/                        # Kubernetes 매니페스트
│   ├── namespace.yaml
│   ├── postgres.yaml
│   ├── order-service.yaml
│   ├── admin-service.yaml
│   ├── frontend.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── observability.yaml
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 환경 변수 (Environment Variables)

| Variable        | Description                    | Default                                                    |
|-----------------|--------------------------------|------------------------------------------------------------|
| DATABASE_URL    | PostgreSQL 연결 문자열          | postgresql+asyncpg://postgres:postgres@localhost:5432/table_order |
| JWT_SECRET      | JWT 서명 키                    | change-me-in-production                                    |
| LOG_LEVEL       | 로그 레벨                      | INFO                                                       |
| APP_PORT_API    | Order Service 포트             | 8081                                                       |
| APP_PORT_ADMIN  | Admin Service 포트             | 8082                                                       |

---

## 테스트 (Testing)

```bash
# Backend 단위 테스트
cd backend/api
pytest tests/unit -v

# Backend 통합 테스트
pytest tests/integration -v

# Frontend (추후 추가 예정)
cd frontend
npm run test
```

---

## EKS 배포 (Deployment to EKS)

### 사전 요구사항

- AWS CLI 설정 완료
- kubectl 설치 및 EKS 클러스터 연결
- AWS Load Balancer Controller 설치

### 배포 순서

```bash
# 1. 네임스페이스 생성
kubectl apply -f k8s/namespace.yaml

# 2. ConfigMap & Secret 적용
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. PostgreSQL 배포
kubectl apply -f k8s/postgres.yaml

# 4. 백엔드 서비스 배포
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/admin-service.yaml

# 5. 프론트엔드 배포
kubectl apply -f k8s/frontend.yaml

# 6. Ingress 설정
kubectl apply -f k8s/ingress.yaml

# 7. Observability 설정
kubectl apply -f k8s/observability.yaml

# 상태 확인
kubectl get all -n table-order
```

### Docker 이미지 빌드 & ECR 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드 & 푸시
docker build -t table-order/order-service ./backend/api
docker tag table-order/order-service:latest <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/order-service:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/order-service:latest

docker build -t table-order/admin-service ./backend/admin
docker tag table-order/admin-service:latest <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/admin-service:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/admin-service:latest

docker build -t table-order/frontend ./frontend
docker tag table-order/frontend:latest <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/table-order/frontend:latest
```

---

## AI 도구 활용 (AI Tools Used)

이 프로젝트는 AI-DLC (AI-Driven Development Life Cycle) 방법론을 적용하여 개발되었습니다.

| Tool          | Usage                                    |
|---------------|------------------------------------------|
| **Kiro IDE**  | AI 기반 개발 환경, 스펙 기반 코드 생성     |
| **Claude**    | 아키텍처 설계, 코드 리뷰, 문서 작성       |

---

## 라이선스 (License)

MIT License
