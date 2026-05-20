# AI-DLC Challenge 진행 상태 검토 레포트

**작성일**: 2026-05-20T12:53 KST  
**검토 대상**: `table-order/` 프로젝트 (제출 루트)  
**평가 기준**: `aws-summit-seoul-2026-aidlc-submit-guide.md` + AI-DLC Core Workflow + Enterprise Steering Pack  
**확정 기술 스택**: Frontend(Nginx+React) / Backend API(FastAPI) / Backend Admin(FastAPI)

---

## 1. 평가 기준 요약 (100점 만점)

| Pillar | 배점 | 핵심 평가 항목 |
|--------|------|----------------|
| 완성도 | 20점 | 기능 동작, 안정성, 운영 가능성, 보안 |
| AI-DLC 활용도 | 30점 | 워크플로우 문서, AI 대화, Spec 품질 |
| 기술 활용도 | 20점 | AI/AWS 서비스 활용, 통합, 확장성 |
| 창의성 & 임팩트 | 30점 | 고객 문제, 독창성, 비즈니스 영향 |

---

## 2. 현재 진행 상태 진단

### 2.1 완료된 산출물

| 산출물 | 상태 | 위치 |
|--------|------|------|
| 요구사항 정의서 | ✅ 완료 | `requirements/table-order-requirements.md` |
| 제약사항 문서 | ✅ 완료 | `requirements/constraints.md` |
| PR-FAQ | ✅ 완료 | `requirements/PR-FAQ.md` |
| MoSCoW 기능 목록 | ✅ 완료 | `requirements/moscow-feature-list.md` |
| MVP 기능 목록 | ✅ 완료 | `requirements/mvp-feature-list.md` |
| Kiro Spec - requirements | ✅ 완료 | `.kiro/specs/table-order-service/requirements.md` |
| Kiro Spec - design | ✅ 완료 | `.kiro/specs/table-order-service/design.md` |
| Kiro Spec - tasks | ✅ 완료 | `.kiro/specs/table-order-service/tasks.md` |
| Kiro Spec - NFR guidelines | ✅ 완료 | `.kiro/specs/table-order-service/nfr-guidelines.md` |
| Enterprise Steering Pack | ✅ 완료 | `AI-DLC-Enterprise-Steering-Pack.md` |

### 2.2 미완료 산출물 (제출 필수)

| 산출물 | 상태 | 필요 위치 | 중요도 |
|--------|------|-----------|--------|
| `aidlc-docs/` 디렉터리 전체 | ❌ 미생성 | `table-order/aidlc-docs/` | **치명적** |
| `aidlc-docs/audit.md` | ❌ 미생성 | 의사결정 추적 | **치명적** |
| `aidlc-docs/aidlc-state.md` | ❌ 미생성 | 워크플로우 상태 | **치명적** |
| `src/` 소스 코드 | ❌ 미생성 | 실제 구현 | **치명적** |
| `tests/` 테스트 코드 | ❌ 미생성 | Edge Case 검증 | **치명적** |
| `README.md` (프로젝트용) | ❌ 미생성 | 실행 방법, 데모 시나리오 | **치명적** |
| `.env.example` | ❌ 미생성 | 환경 변수 목록 | 높음 |
| `Dockerfile` | ❌ 미생성 | 컨테이너 빌드 | 높음 |
| ADR 문서 | ❌ 미생성 | 기술 결정 근거 | 높음 |
| screenshots/result | ❌ 미생성 | 동작 캡처 | 중간 |

---

## 3. 🚨 치명적 위배 사항

### 3.1 Kiro Spec과 실제 기술 스택 불일치 (HIGH)

**문제**: Kiro Spec(`requirements.md`, `design.md`, `tasks.md`)이 **Go (Gin)** 기반으로 상세 설계되어 있으나, 실제 구현은 **FastAPI (Python)** 로 진행 예정

| 항목 | Kiro Spec (현재 문서) | 실제 구현 예정 |
|------|----------------------|---------------|
| 언어 | Go (Gin) | Python (FastAPI) |
| 테스트 | Go testing + gopter | pytest |
| 의존성 | go.mod | pyproject.toml / requirements.txt |
| 바이너리 | 단일 바이너리 | Uvicorn + Python |

**영향**:
- 평가 에이전트가 Kiro Spec과 실제 코드의 불일치를 감지하면 **AI-DLC 활용도 감점** 가능
- 설계 문서와 구현의 traceability(추적 가능성)가 깨짐

**권고 조치**:
1. Kiro Spec의 `requirements.md`, `design.md`, `tasks.md`를 FastAPI 기반으로 수정
2. 또는 `aidlc-docs/`에 ADR(Architecture Decision Record)로 "Go → FastAPI 변경 근거" 문서화
3. `constraints.md`의 "Python 기반 (pytest 테스트)"와는 정합하므로 constraints 수정 불필요

**참고**: `constraints.md`에 명시된 Python/pytest 제약과 FastAPI 선택은 완벽히 정합함

### 3.2 AI-DLC 워크플로우 산출물 부재 (CRITICAL)

**문제**: AI-DLC 활용도 30점 배점인데, 핵심 산출물인 `aidlc-docs/` 디렉터리가 전혀 없음

**필수 산출물 (Steering Pack Section 16 기준)**:
- `aidlc-docs/audit.md` — 의사결정 및 승인 기록
- `aidlc-docs/inception/requirements/` — 요구사항
- `aidlc-docs/inception/user-stories/` — 사용자 스토리
- `aidlc-docs/inception/application-design/` — 컴포넌트 설계
- `aidlc-docs/inception/plans/` — 실행 계획
- `aidlc-docs/construction/*/functional-design/` — 기능 설계
- `aidlc-docs/construction/*/nfr-requirements/` — NFR 요구사항
- `aidlc-docs/aidlc-state.md` — 워크플로우 상태 추적

**영향**: AI-DLC 활용도 Pillar에서 대부분 점수를 잃을 위험

### 3.3 구현 코드 부재 (CRITICAL)

**문제**: 완성도 20점 배점인데, 소스 코드가 전혀 없음

- `src/` 또는 `backend/` 디렉터리 없음
- `frontend/` 디렉터리 없음
- `tests/` 디렉터리 없음
- 실행 가능한 애플리케이션 없음

---

## 4. 제출 포맷 준수 여부

| 제출 요건 | 현재 상태 | 비고 |
|-----------|-----------|------|
| README.md (루트) | ❌ 없음 | 프로젝트 개요, 실행 방법, AI 도구 사용 내역 필수 |
| src/ 또는 소스 트리 | ❌ 없음 | 평가 에이전트 우선 분석 대상 |
| aidlc-docs/ | ❌ 없음 | AI-DLC 산출물 |
| screenshots/result | ❌ 없음 | 동작 캡처 (선택) |
| zip ≤ 200MB | ✅ 해당 없음 | 현재 파일 크기 문제 없음 |
| node_modules/.git 제외 | ✅ 해당 없음 | 자동 제외됨 |

---

## 5. 우승 가능성 평가

### 현재 예상 점수: **5~10점 / 100점**

| Pillar | 예상 점수 | 근거 |
|--------|-----------|------|
| 완성도 (20점) | 0~2점 | 동작하는 코드 없음, README 없음 |
| AI-DLC 활용도 (30점) | 3~5점 | requirements 문서는 있으나 aidlc-docs/ 구조 부재, audit.md 없음 |
| 기술 활용도 (20점) | 1~2점 | 설계 문서에 AWS/EKS 언급은 있으나 실제 구현 없음 |
| 창의성 & 임팩트 (30점) | 1~3점 | PR-FAQ, 문제 정의는 우수하나 실증 없음 |

### 우승을 위한 목표 점수: **80점 이상**

---

## 6. 긴급 액션 플랜 (우선순위 순)

### Phase 1: 즉시 해결 (문서 정합성 확보)

1. **Kiro Spec 정합성 확보** — `design.md`, `tasks.md`가 Go 기반이므로 다음 중 택 1:
   - (권고) `aidlc-docs/`에 ADR 작성: "Go 설계 → FastAPI 구현 변경 근거" 문서화
   - (대안) Kiro Spec을 FastAPI 기반으로 재작성 (시간 소모)
   - `constraints.md`는 이미 Python/pytest로 되어 있으므로 수정 불필요

### Phase 2: AI-DLC 산출물 생성 (AI-DLC 활용도 30점 확보)

2. `aidlc-docs/` 디렉터리 구조 생성
3. `aidlc-docs/audit.md` 작성 — 지금까지의 의사결정 기록 소급 작성
4. `aidlc-docs/aidlc-state.md` 작성 — 현재 워크플로우 상태
5. `aidlc-docs/inception/` 하위에 requirements, user-stories, application-design, plans 배치
6. ADR 문서 작성 (DB 선택, 인증 방식, 기술 스택 등)

### Phase 3: 핵심 구현 (완성도 20점 + 기술 활용도 20점)

7. 프로젝트 구조 생성 (backend/order-service, backend/admin-service, frontend)
8. **Order Service** 핵심 구현:
   - 주문 생성 API + Idempotency Key
   - 메뉴 조회 API
   - Health Check (/healthz, /readyz)
   - Graceful Shutdown
   - Structured JSON Logging
   - Circuit Breaker (결제 Mock)
9. **Admin Service** 핵심 구현:
   - JWT 인증
   - 주문 모니터링 SSE
   - 테이블 세션 관리
10. **Frontend** 기본 구현:
    - 메뉴 조회 + 장바구니 + 주문
11. Edge Case 테스트 (최소 6개)
12. Dockerfile + docker-compose.yml
13. README.md (실행 방법, 데모 시나리오, 환경 변수)

### Phase 4: 차별화 (창의성 & 임팩트 30점)

14. 동작 스크린샷/데모 캡처
15. 비용 분석 리포트
16. Operational Readiness Review 문서

---

## 7. 리스크 요약

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| 시간 부족으로 구현 미완성 | 🔴 높음 | Must Have만 집중, Could Have 전부 포기 |
| Kiro Spec(Go)과 실제 구현(FastAPI) 불일치 | 🟡 중간 | ADR 작성으로 변경 근거 문서화 |
| aidlc-docs 부재로 AI-DLC 점수 상실 | 🔴 높음 | 구현과 병행하여 산출물 생성 |
| 테스트 없이 제출 | 🔴 높음 | 최소 6개 Edge Case 테스트 필수 |
| README 없이 제출 | 🟡 중간 | 마지막에 반드시 작성 |

---

## 8. 결론

**현재 상태는 제출 기준을 충족하지 못하며, 우승과는 거리가 멀다.**

가장 큰 문제는:
1. **동작하는 코드가 없다** — 완성도 0점
2. **aidlc-docs/ 산출물이 없다** — AI-DLC 활용도 대부분 상실
3. **Kiro Spec이 Go 기반인데 실제는 FastAPI** — ADR로 해결 가능하나 방치하면 감점

긍정적인 점:
- 요구사항 정의, PR-FAQ, MoSCoW 분류 등 **Inception 단계 문서 품질은 우수**
- `constraints.md`의 Python/pytest 제약과 FastAPI 선택이 **완벽히 정합**
- Kiro Spec의 design.md, tasks.md가 상세하여 **FastAPI로 변환 구현 시 빠른 진행 가능**
- Enterprise Steering Pack이 잘 정의되어 있어 **거버넌스 증거로 활용 가능**

**즉시 구현에 착수하고, 구현과 동시에 aidlc-docs 산출물을 생성해야 한다.**

---

## 9. 제출 시 디렉터리 구조 (목표)

```
table-order/                          ← 제출 루트
├── README.md                         ← 필수 (실행 방법, 데모, AI 도구 사용)
├── .env.example
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/                          ← React
├── backend/
│   ├── api/                          ← FastAPI (Order Service)
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── src/
│   │   └── tests/
│   └── admin/                        ← FastAPI (Admin Service)
│       ├── Dockerfile
│       ├── pyproject.toml
│       ├── src/
│       └── tests/
├── aidlc-docs/                       ← AI-DLC 산출물
│   ├── audit.md
│   ├── aidlc-state.md
│   ├── inception/
│   └── construction/
├── requirements/                     ← 기존 요구사항 문서
└── score/                            ← 본 레포트
```
