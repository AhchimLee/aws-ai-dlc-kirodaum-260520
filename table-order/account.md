# 테스트 계정 정보

## 고객 접속

URL: http://localhost:3000

| 매장 코드 | 매장명 | 테이블 번호 |
|-----------|--------|------------|
| `tasty` | 맛있는식당 (한식) | 1~10 |
| `dragon` | 용궁반점 (중식) | 1~10 |
| `sushi` | 스시오마카세 (일식) | 1~10 |
| `morning` | 모닝카페 (카페) | 1~10 |

## 관리자 로그인

URL: http://localhost:3000/admin/login

| 매장 식별자 | 사용자명 | 비밀번호 |
|------------|---------|---------|
| `tasty` | `admin` | `admin123` |
| `dragon` | `admin` | `admin123` |
| `sushi` | `admin` | `admin123` |
| `morning` | `admin` | `admin123` |

## EKS 배포 (운영)

- Ingress: http://k8s-tableorder-317d78d3a5-1890160864.us-east-1.elb.amazonaws.com
- LB 직접: http://k8s-tableord-frontend-73cd2f57eb-6a28b2768bd70c66.elb.us-east-1.amazonaws.com

## API Swagger (로컬)

| 서비스 | URL |
|--------|-----|
| 주문 API (고객용) | http://localhost:8081/docs |
| 관리자 API | http://localhost:8082/docs |
