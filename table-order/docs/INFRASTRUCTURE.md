# Infrastructure Documentation

## 인프라 구성 관리 문서

이 문서는 Table Order 서비스의 인프라 구성 요소를 설명합니다.

---

## 1. Terraform 구성 (`infra/terraform/`)

| 파일 | 역할 | 핵심 리소스 |
|------|------|-------------|
| `main.tf` | Provider 설정, S3 backend | AWS provider (us-east-1) |
| `variables.tf` | 변수 정의 | region, project_name, vpc_cidr, db 정보 |
| `vpc.tf` | 3-Tier VPC | Public/Private/Isolated 서브넷, NAT, VPC Endpoints |
| `security-groups.tf` | 보안 그룹 | ALB SG, EKS Node SG, RDS SG (최소 권한) |
| `eks.tf` | EKS 클러스터 | Auto-mode, Karpenter, Add-ons |
| `rds.tf` | PostgreSQL RDS | Multi-AZ, 암호화, Isolated 서브넷 |
| `iam.tf` | IAM 역할/정책 | IRSA (Pod별), Karpenter Node, CI/CD |
| `ecr.tf` | ECR 레포지토리 | 3개 서비스 이미지 저장소 |
| `outputs.tf` | 출력값 | 클러스터 엔드포인트, RDS 엔드포인트, ECR URL |

### Terraform 실행 방법

```bash
cd table-order/infra/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집 (db_password 등)
terraform init
terraform plan
terraform apply
```

---

## 2. Kubernetes 매니페스트 (`k8s/`)

| 파일/디렉토리 | 역할 |
|---------------|------|
| `namespace.yaml` | table-order 네임스페이스 |
| `karpenter-nodepool.yaml` | Karpenter NodePool (t3.medium/large, spot+on-demand) |
| `configmap.yaml` | 공통 환경 변수 (LOG_LEVEL, PORT) |
| `external-secret.yaml` | AWS Secrets Manager 연동 |
| `ingress.yaml` | ALB Ingress (path-based routing) |
| `order-service/` | Deployment, Service, HPA (2-10 replicas) |
| `admin-service/` | Deployment, Service, HPA (2-8 replicas) |
| `frontend/` | Deployment, Service |
| `observability/` | Prometheus ServiceMonitor, Fluent Bit, CloudWatch |

### K8s 배포 순서

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/external-secret.yaml
kubectl apply -f k8s/karpenter-nodepool.yaml
kubectl apply -f k8s/order-service/
kubectl apply -f k8s/admin-service/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/observability/
```

---

## 3. CI/CD 파이프라인 (`.github/workflows/deploy.yaml`)

### 파이프라인 구조

```
Push to main → Build & Push (3 services parallel) → Deploy to EKS → Smoke Test
```

### Jobs

| Job | 역할 | 트리거 |
|-----|------|--------|
| `build-and-push` | Docker 빌드 → ECR 푸시 (matrix: 3 services) | push to main |
| `deploy` | K8s 매니페스트 적용, rollout 대기 | build 성공 후 |
| `smoke-test` | Health endpoint 검증 | deploy 성공 후 |

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `AWS_ACCOUNT_ID` | AWS 계정 ID |
| `AWS_DEPLOY_ROLE_ARN` | CI/CD IAM Role ARN (OIDC) |

---

## 4. eksctl 클러스터 구성 (`infra/eksctl-cluster.yaml`)

빠른 클러스터 생성을 위한 eksctl 설정:
- EKS Auto-mode 활성화
- OIDC Provider 자동 생성
- VPC 10.0.0.0/16 (NAT Single)
- CloudWatch 로깅 전체 활성화
- Kubernetes 1.31

---

## 5. 보안 아키텍처

### Security Group 규칙 (최소 권한)

```
Internet → ALB SG (443/80 only)
ALB SG → EKS Node SG (8081, 8082, 80 only)
EKS Node SG → RDS SG (5432 only)
RDS SG → (NO egress, NO internet)
```

### IAM 최소 권한

| Role | 허용 Action | Resource Scope |
|------|-------------|----------------|
| Order Service (IRSA) | rds-db:connect, secretsmanager:Get | 특정 DB user, 특정 secret |
| Admin Service (IRSA) | rds-db:connect, secretsmanager:Get | 특정 DB user, 특정 secret |
| Karpenter Node | EKS Worker, ECR Read, SSM | 클러스터 내 |
| CI/CD | ECR Push, EKS Describe | 특정 repo, 특정 cluster |
