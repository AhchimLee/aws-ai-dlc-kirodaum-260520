# Table Order Service — 전체 아키텍처 매뉴얼

## 1. 시스템 개요

테이블오더 서비스는 식당에서 고객이 태블릿으로 직접 주문하고, 관리자가 실시간으로 주문을 관리하는 웹 기반 플랫폼입니다.

---

## 2. 전체 계층 구조 (3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 1: PRESENTATION (Public Subnet)                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  AWS ALB (Application Load Balancer)                          │   │
│  │  - HTTPS 443 / HTTP 80 (redirect)                             │   │
│  │  - Path-based routing                                         │   │
│  │  - Health check: /api/v1/healthz, /admin/api/v1/healthz      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Security Group: 443/80 inbound from 0.0.0.0/0                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 2: APPLICATION (Private Subnet)                                │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Frontend Pod    │  │ Order Service   │  │ Admin Service   │    │
│  │  (Nginx+React)   │  │ (FastAPI:8081)  │  │ (FastAPI:8082)  │    │
│  │  Port: 80        │  │ 2-10 replicas   │  │ 2-8 replicas    │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
│  EKS Auto-mode + Karpenter (자동 스케일링)                           │
│  Security Group: ALB에서만 인바운드, NAT로 아웃바운드                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 3: DATA (Isolated Subnet — 인터넷 접근 불가)                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL RDS (Multi-AZ)                                    │   │
│  │  - Port: 5432                                                 │   │
│  │  - Storage: 암호화 (AES-256)                                  │   │
│  │  - Backup: 7일 보존                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Security Group: EKS 노드에서만 5432 인바운드, 아웃바운드 없음       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 서비스 구성

| 서비스 | 기술 | 포트 | 역할 |
|--------|------|------|------|
| Frontend | React + Vite + Nginx | 80 | 고객/관리자 UI |
| Order Service | Python FastAPI | 8081 | 고객 주문 API (메뉴 조회, 주문 생성, SSE) |
| Admin Service | Python FastAPI | 8082 | 관리자 API (인증, 메뉴 관리, 주문 관리) |
| PostgreSQL | RDS 16.x | 5432 | 데이터 저장 |

---

## 4. 네트워크 흐름

### 고객 주문 흐름
```
고객 태블릿 → ALB → /api/* → Order Service Pod → PostgreSQL
                                    ↓
                              SSE Event Broker → Admin Client
```

### 관리자 흐름
```
관리자 브라우저 → ALB → /admin/api/* → Admin Service Pod → PostgreSQL
                                              ↓
                                        SSE → Admin Dashboard
```

---

## 5. 라우팅 규칙

| Path | Target | 설명 |
|------|--------|------|
| `/api/*` | order-service:8081 | 고객 주문 API |
| `/admin/api/*` | admin-service:8082 | 관리자 API |
| `/*` | frontend:80 | React SPA |

---

## 6. 확장성 (Auto-Scaling)

### EKS Auto-mode
- Karpenter가 Pod 수요에 따라 자동으로 노드 프로비저닝
- NodePool: t3.medium, t3.large, m5.large (spot + on-demand)
- CPU 20코어, Memory 40Gi 상한

### HPA (Horizontal Pod Autoscaler)
| 서비스 | Min | Max | Target CPU |
|--------|-----|-----|------------|
| Order Service | 2 | 10 | 70% |
| Admin Service | 2 | 8 | 70% |
| Frontend | 2 | 4 | 80% |

---

## 7. 보안

### 인증/인가
- 관리자: JWT (16시간 만료, HS256)
- 비밀번호: bcrypt 해싱 (평문 저장 금지)
- 고객: 태블릿 자동 로그인 (매장ID + 테이블번호 + 비밀번호)

### 네트워크 보안
- ALB: HTTPS 강제 (HTTP→HTTPS 리다이렉트)
- Pod: readOnlyRootFilesystem, runAsNonRoot, drop ALL capabilities
- RDS: 인터넷 접근 불가 (Isolated Subnet)

### IAM
- IRSA (Pod별 최소 권한 IAM Role)
- CI/CD: GitHub OIDC 기반 (장기 키 없음)

---

## 8. Observability

| 구성 요소 | 역할 |
|-----------|------|
| Structured JSON Logging | 모든 요청/응답 로깅 (trace_id 포함) |
| Health Probes | Liveness (/healthz), Readiness (/readyz) |
| Prometheus ServiceMonitor | 메트릭 수집 |
| Fluent Bit | 로그 수집 → CloudWatch Logs |
| CloudWatch Container Insights | 클러스터 모니터링 |

---

## 9. 장애 격리

| 장애 시나리오 | 영향 범위 | 대응 |
|---------------|-----------|------|
| Order Service 장애 | 고객 주문 불가, 관리자 정상 | HPA 자동 복구 |
| Admin Service 장애 | 관리 불가, 고객 주문 정상 | HPA 자동 복구 |
| Frontend 장애 | UI 불가, API 직접 호출 가능 | Pod 재시작 |
| DB 장애 | 전체 서비스 Degradation | Multi-AZ 자동 Failover |

---

## 10. 디렉토리 구조

```
table-order/
├── backend/
│   ├── api/          ← Order Service (FastAPI)
│   └── admin/        ← Admin Service (FastAPI)
├── frontend/         ← React SPA
├── infra/
│   ├── terraform/    ← IaC (VPC, EKS, RDS, IAM, SG)
│   └── eksctl-cluster.yaml
├── k8s/              ← Kubernetes 매니페스트
├── .github/workflows/ ← CI/CD
├── docs/             ← 문서
├── aidlc-docs/       ← AI-DLC 산출물
├── requirements/     ← 요구사항 문서
└── docker-compose.yml ← 로컬 개발
```

---

## 11. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| 인프라 상세 | `docs/INFRASTRUCTURE.md` | Terraform, K8s, CI/CD 상세 |
| QA 테스트 매뉴얼 | `docs/QA-TEST-MANUAL.md` | 기능 테스트 단계별 가이드 |
| 배포 이력 | `docs/deployment-history.md` | 버전별 배포 기록 |
| API 문서 | `http://<ALB>/docs` | FastAPI 자동 생성 OpenAPI |
| 요구사항 | `requirements/` | 기능/비기능 요구사항 |
