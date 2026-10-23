# AI-SEARCH-DIAGNOSTIC-IMPLEMENTATION-PLAN — 단계별 구현 계획

> 작성일: 2026-10-23 | 작성자: AI CTO (Claude Code)
> 관련 문서: [AI-SEARCH-DIAGNOSTIC-ASSESSMENT.md](AI-SEARCH-DIAGNOSTIC-ASSESSMENT.md) · [AI-SEARCH-DIAGNOSTIC-DATA-MODEL.md](AI-SEARCH-DIAGNOSTIC-DATA-MODEL.md) · [MIGRATION-RUNBOOK.md](MIGRATION-RUNBOOK.md)

---

## 0. 전제 조건 (구현 착수 전 확인 필요)

| 항목 | 상태 | 처리 방안 |
|---|---|---|
| 대표님 구현 승인 | ⏸ 대기 | 본 문서 검토 후 승인 필요 |
| `GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx` 파일 | ❌ 미제공 | 대표님께 파일 위치 요청 |
| Supabase 프로젝트 재개 | ⏸ (TODO.md 긴급 항목) | DB 마이그레이션은 재개 후 실행 |
| 엑셀 파일 제공 | ⏸ 대기 | 질문 시딩 스크립트 작성에 필요 |

---

## 1. 단계별 구현 계획

### Phase 1 — DB 스키마 + 기초 API (추정: 2~3시간)

**목표**: 데이터를 저장하고 읽는 최소 API 구현

#### 1-1. Prisma 스키마 확장
- 변경 파일: `database/prisma/schema.prisma`
- 작업 내용: `AI-SEARCH-DIAGNOSTIC-DATA-MODEL.md` §6의 5개 신규 테이블 추가
- 기존 테이블: 변경 없음, 추가만
- **필요 승인**: DB 마이그레이션 실행(Supabase 파괴적 변경 소지 없음 — 테이블 추가는 비파괴적)
  - MIGRATION-RUNBOOK.md 절차 준수 필요

#### 1-2. 시딩 스크립트 작성
- 신규 파일: `scripts/seed-ai-search.ts` (또는 `.js`)
- 작업 내용:
  - GBRICK Coffee, 디자인포비 사업체 2건 초기 데이터
  - 엑셀 `AI질문_20` 시트의 질문 20개 (엑셀 파일 제공 시)
  - 엑셀 없을 경우: 작업지시서의 업종·지역·검색 의도 기준으로 작성자 확인 후 진행

#### 1-3. 기초 API 라우트
신규 파일 목록:

```
app/api/ai-search/
├── businesses/
│   ├── route.ts          (GET: 목록, POST: 생성)
│   └── [id]/
│       └── route.ts      (GET: 단건, PATCH: 수정)
├── questions/
│   └── route.ts          (GET: 목록)
├── measurements/
│   ├── route.ts          (GET: 목록, POST: 생성)
│   └── [id]/
│       └── route.ts      (GET: 단건, PATCH: 수정)
├── improvements/
│   ├── route.ts          (GET: 목록, POST: 생성)
│   └── [id]/
│       └── route.ts      (GET: 단건, PATCH: 수정)
└── reports/
    ├── route.ts          (GET: 목록, POST: 생성)
    └── [id]/
        └── route.ts      (GET: 단건)
```

---

### Phase 2 — 진단 대시보드 UI (추정: 3~4시간)

**목표**: 측정 입력·결과 조회 화면 구현

#### 2-1. HQ 대시보드 연동
신규 파일 목록:

```
app/hq/ai-search/
├── page.tsx              (사업체별 진단 현황 개요)
├── [businessId]/
│   ├── page.tsx          (사업체별 전체 측정 결과 테이블)
│   └── measure/
│       └── page.tsx      (측정 결과 수동 입력 폼)
└── report/
    └── page.tsx          (보고서 미리보기 + PDF/Word 출력)
```

#### 2-2. UI 컴포넌트
신규 파일 목록:

```
components/ai-search/
├── BusinessSelector.tsx   (사업체 선택)
├── MeasurementForm.tsx    (측정 입력 폼)
├── ResultsTable.tsx       (질문별 측정 결과 테이블)
├── MentionBadge.tsx       (언급됨/미언급/미측정 상태 뱃지)
├── StatsCard.tsx          (언급률·출처 수 등 집계 카드)
└── ReportPreview.tsx      (보고서 미리보기)
```

#### 2-3. lib 비즈니스 로직
신규 파일 목록:

```
lib/ai-search/
├── types.ts               (TypeScript 타입 정의)
├── constants.ts           (AI 서비스명, 카테고리, 상태값 상수)
├── businesses.ts          (사업체 CRUD 함수)
├── questions.ts           (질문 조회 함수)
├── measurements.ts        (측정 CRUD + 집계 계산 함수)
├── improvements.ts        (개선 작업 CRUD 함수)
└── reports.ts             (보고서 생성·집계 함수)
```

---

### Phase 3 — 보고서 출력 + 비교 분석 (추정: 2~3시간)

**목표**: 측정 결과를 문서로 출력하고 개선 전후 비교

#### 3-1. 보고서 출력
- 화면 내 보고서 미리보기 (HTML → `@media print` CSS)
- Word 파일 다운로드 (기존 `docx` 라이브러리 활용)
- 신규 파일: `app/api/ai-search/reports/[id]/export/route.ts`

#### 3-2. 개선 전후 비교 뷰
- `app/hq/ai-search/[businessId]/compare/page.tsx` 신규
- 개선 전 측정 vs 개선 후 측정 나란히 비교

---

### Phase 4 — 다중 사업체 관리 구조 (2차 실증: 디자인포비)

**목표**: 두 번째 사업체(디자인포비) 추가 및 고객 구분 구조

- DB: `AiSearchBusiness`에 디자인포비 데이터 추가 (시딩)
- UI: 사업체별 독립적인 진단 뷰
- 보고서: 사업체명·기간으로 구분되는 보고서 생성

---

## 2. 예상 변경 파일 목록

### 수정 파일 (기존 파일 변경)
| 파일 | 변경 내용 | 우선순위 |
|---|---|---|
| `database/prisma/schema.prisma` | 신규 테이블 5개 추가 (기존 테이블 변경 없음) | Phase 1 |
| `PROJECT-INDEX.md` | §11 AI Search Diagnostic 영역 추가 | Phase 1 착수 시 |
| `DOCUMENT-INDEX.md` | 본 문서 4건 등록 | Phase 1 착수 시 |
| `ROADMAP.md` | AI 검색 진단 모듈 항목 추가 | Phase 1 착수 시 |

### 신규 파일 (새로 생성)

**Phase 1** (최소 기능):
- `scripts/seed-ai-search.ts`
- `app/api/ai-search/**` (라우트 10개 내외)
- `lib/ai-search/types.ts`
- `lib/ai-search/constants.ts`

**Phase 2** (UI):
- `app/hq/ai-search/**` (페이지 4개 내외)
- `components/ai-search/**` (컴포넌트 6개 내외)
- `lib/ai-search/**` (나머지 5개 파일)

**Phase 3** (보고서):
- `app/api/ai-search/reports/[id]/export/route.ts`
- `app/hq/ai-search/[businessId]/compare/page.tsx`

---

## 3. 테스트 계획

### 각 Phase 완료 시 실행할 검증

| 검증 항목 | 명령 / 방법 | 기준 |
|---|---|---|
| TypeScript 타입 검사 | `tsc --noEmit` | 에러 0건 |
| Lint | `next lint` | 에러 0건 |
| 빌드 | `next build` | exit 0 |
| 단위 테스트 | `npm run test` | PASS (기존 테스트 회귀 없음) |
| QA 전체 | `npm run qa` | exit 0 |

### 기능 검증 항목

| 기능 | 검증 방법 | 판단 기준 |
|---|---|---|
| 사업체 등록 | API POST + DB 조회 | 입력값 그대로 저장됨 |
| 측정 입력 | 폼 입력 → 저장 → 목록 재조회 | `isMentioned: null` vs `false` 구분 정확 |
| 언급률 계산 | 테스트 데이터 삽입 후 집계 API 호출 | 수동 계산값과 일치 |
| 미측정 구분 | 미측정 질문의 `isMentioned` 값 확인 | `null` (false 아님) |
| 보고서 출력 | 보고서 페이지 접근 | 빈 값 없이 집계 표시 |

### 회귀 방지

신규 파일 추가만 하므로 기존 기능 회귀 위험은 낮다. 단, 다음은 반드시 확인:
- 기존 `/hq` 라우트 정상 동작
- `middleware.ts` 인증 게이트 신규 경로에도 적용됨 확인
- Prisma 스키마 추가 후 `npm run build` 정상

---

## 4. 비용 발생 가능성

| 항목 | 비용 발생 여부 | 상세 |
|---|---|---|
| Supabase DB 용량 | 미미 | 텍스트 위주, 초기 측정 건수는 수백 건 이하 |
| Vercel 빌드 | 없음 | 기존 자동 배포 파이프라인 그대로 사용 |
| AI API 자동 호출 | **없음** | 1차 단계는 수동 입력 전용 — AI API 호출 없음 |
| 외부 서비스 추가 | **없음** | 신규 서비스 가입 없음 |
| docx 라이브러리 | 없음 | 이미 `package.json`에 설치됨 |

**결론**: 이번 구현 단계에서 추가 비용 없음. CEO-CHARTER §16-B 승인 6항목에 해당하지 않음.

---

## 5. 자동화 가능 범위 vs 수작업 범위

### 자동화 가능 (현재 또는 단기)

| 항목 | 방식 |
|---|---|
| 언급률·출처 수 집계 | DB 집계 쿼리 (Prisma aggregate) |
| 개선 전후 변화율 계산 | 측정 레코드 비교 로직 |
| 보고서 Word 파일 생성 | `docx` 라이브러리 |
| 월간 보고서 정기 생성 알림 | n8n 예약 워크플로 (기존 인프라 활용) |

### 수작업 범위 (1차 단계)

| 항목 | 이유 |
|---|---|
| AI 서비스(ChatGPT·Gemini) 질문 입력 | 자동화 시 서비스 이용약관 위반 소지 |
| AI 답변 읽고 결과 기록 | 답변 품질 판단은 사람이 직접 |
| 사업체 정보 사실 확인 | 현장 확인이 필요한 정보 |
| 개선 작업 게시 | 콘텐츠 게시는 사람 승인 후 |
| 개선 후 재측정 | AI 답변이 변하는 시점 예측 불가 |

---

## 6. 주의 사항

1. **측정 조건 일관성**: 동일한 질문을 다른 날, 다른 로그인 상태에서 측정하면 결과가 달라질 수 있음 → `notes` 필드에 측정 조건 기록 권장
2. **AI 서비스 변경**: ChatGPT·Gemini의 모델 업데이트로 동일 질문에 다른 답변이 나올 수 있음 → `aiServiceVersion` 필드에 버전 기록
3. **언급 ≠ 성과**: AI 검색 언급률 증가가 매출로 직결되지 않음 — 보고서에 이 한계를 명시
4. **보장 금지**: "AI 추천 순위 1위 보장" 같은 표현 절대 사용 금지 (§0-2 원칙 2·3)
