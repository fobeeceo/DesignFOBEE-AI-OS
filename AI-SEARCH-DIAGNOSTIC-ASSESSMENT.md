# AI-SEARCH-DIAGNOSTIC-ASSESSMENT — 기존 시스템 조사 보고서

> 작성일: 2026-10-23 | 작성자: AI CTO (Claude Code)
> 관련 문서: [CLAUDE.md](CLAUDE.md) · [PROJECT-INDEX.md](PROJECT-INDEX.md) · [DOCUMENT-INDEX.md](DOCUMENT-INDEX.md) · [AI-SEARCH-DIAGNOSTIC-IMPLEMENTATION-PLAN.md](AI-SEARCH-DIAGNOSTIC-IMPLEMENTATION-PLAN.md)

---

## 0. 핵심 결론

| 항목 | 결론 |
|---|---|
| **엑셀 파일 존재 여부** | ❌ 저장소에 없음 — 대표님께 파일 위치 요청 필요 |
| **신규 저장소 생성 여부** | ❌ 불필요 — 기존 저장소에 신규 모듈로 추가 권장 |
| **신규 모듈 위치** | `app/analyze/ai-search/` + `lib/ai-search/` + `app/api/ai-search/` |
| **기존 시스템 변경 범위** | DB 스키마 확장(신규 테이블 추가) + 신규 라우트 추가 — 기존 기능 삭제·변경 없음 |
| **현재 Git 상태** | `main` 브랜치, 미커밋 변경사항 없음, 클린 상태 |

---

## 1. 확인한 저장소와 브랜치

- **저장소**: `fobeeceo/DesignFOBEE-AI-OS` (로컬 경로: `/home/user/DesignFOBEE-AI-OS`)
- **브랜치**: `main` (origin/main과 동기화됨)
- **Git 상태**: nothing to commit, working tree clean
- **최근 커밋**: `066d84e Feat/owner portal (#13)` (가맹점주 포탈)
- **미커밋 변경사항**: 없음

---

## 2. 기존 시스템 구조

### 2-1. 기술 스택

| 레이어 | 기술 |
|---|---|
| 웹 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript (웹), Python (자동화) |
| DB | Supabase(Postgres) + Prisma ORM |
| 스타일 | Tailwind CSS v3 + shadcn |
| 배포 | Vercel (git push → 자동) |
| 자동화 | Python `content-automation-agent/` |

### 2-2. 현재 모듈 현황

| 모듈 | 경로 | 용도 |
|---|---|---|
| 홈 / AI 스튜디오 | `app/page.tsx`, `app/design/` | 브랜드 홈, 무로그인 AI 공간 설계 |
| AI HQ 대시보드 | `app/hq/` | CEO Dashboard (인증 필요) |
| 가맹 안내 | `app/franchise/` | GBRICK Coffee 가맹 정보 |
| 공간 상담 | `app/consult/` | 도면·상담 신청 |
| 점주 포탈 | `app/owner/` | 가맹점주 전용 (최신 기능) |
| AI 공간 분석 | `app/analyze/` | 이미지 분석 프로젝트 |
| CRM / 리드 | `app/(dashboard)/`, `lib/hq/` | 상담 이력 관리 |
| ERP | `content-automation-agent/src/` | POS·재고·원가 (Python) |
| Media OS | `content-automation-agent/src/` | 콘텐츠 생성·배포 (Python) |

### 2-3. 데이터베이스 현황 (Prisma Schema 확인)

현재 스키마에는 다음 테이블이 존재한다:
- `leads` — 상담 신청 (CRM 핵심)
- `profiles` — 회원 프로필
- `projects` — 공간 분석 프로젝트
- `space_photos` — 업로드된 공간 사진
- `design_images` — AI 생성 이미지
- `design_generations` — AI 사용량 로그
- `public_generations` — 무로그인 AI 사용 로그
- `estimates` — AI 예상 견적
- `lead_notes` — CRM 상담 메모

AI 검색 진단 관련 테이블은 **현재 없다**.

---

## 3. 엑셀 파일 확인 결과

**`GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx` 파일을 저장소 전체에서 검색했으나 존재하지 않는다.**

```
find /home/user/DesignFOBEE-AI-OS -name "GBRICK_AI_Search_Baseline_Diagnostic*"
→ 결과 없음
find /home/user -name "GBRICK_AI_Search_Baseline_Diagnostic*"
→ 결과 없음
```

**대표님께 요청**: 파일이 Google Drive, 로컬 PC, 또는 다른 경로에 있다면 경로나 내용을 공유해 주시면 데이터 구조 설계에 반영합니다. 파일이 없는 경우 작업지시서에 명시된 시트 구조(AI질문_20 · 매장정보_사실확인 · 측정_운영원칙)를 기반으로 설계를 진행합니다.

---

## 4. 재사용 가능한 기존 기능

| 기존 기능 | 위치 | AI 검색 진단에서의 활용 방안 |
|---|---|---|
| **인증 시스템** | `middleware.ts`, `lib/auth/` | `/hq` 접근 제어와 동일한 방식으로 진단 대시보드 보호 |
| **Admin 대시보드 패턴** | `app/hq/`, `app/(admin)/` | 진단 결과 관리 화면 레이아웃 재사용 |
| **Prisma 스키마 확장** | `database/prisma/schema.prisma` | 신규 테이블을 동일 패턴으로 추가 |
| **API 라우트 패턴** | `app/api/hq/erp/route.ts` | 진단 CRUD API를 동일 구조로 작성 |
| **회사 프로필 SSOT** | `lib/company/profile.ts` | GBRICK Coffee / 디자인포비 사업체 정보 참조 |
| **Lead/CRM 패턴** | `lib/hq/`, `services/` | 사업체별 개선 작업 관리에 Lead 패턴 응용 |
| **Python 자동화 구조** | `content-automation-agent/src/` | 측정 데이터 처리·보고서 생성 확장 가능 |
| **보고서 생성 (docx)** | `package.json` (docx 라이브러리) | 진단 보고서 Word 파일 출력에 활용 |
| **QA / Audit 시스템** | `scripts/`, `npm run qa` | 신규 모듈도 동일 QA 게이트 통과 |

---

## 5. 신규 저장소 vs 기존 저장소 검토

### 5-1. 기존 저장소에 추가 (권장)

**근거**:
1. **인증 공유**: `/hq` 인증 게이트를 그대로 재사용할 수 있어 별도 로그인 시스템 구축 불필요
2. **DB 공유**: Supabase/Prisma에 테이블만 추가하면 되어 인프라 추가 비용 없음
3. **관리 단일화**: SSOT 원칙(§0-2 원칙 5)에 부합 — 두 저장소를 관리하면 SSOT가 분산됨
4. **기존 컴포넌트 재사용**: admin 레이아웃, UI 컴포넌트, 테이블, 폼 패턴 즉시 활용 가능
5. **배포 일원화**: Vercel 자동 배포 파이프라인을 그대로 사용
6. **규모**: 1차 구현은 소규모(테이블 5개, 라우트 4개 이하)라 별도 저장소를 만들 이유 없음

**단점**:
- 프랜차이즈 고객사가 많아질 경우 멀티테넌시 설계 필요 (현재는 2개 사업체만 대상)
- 나중에 독립 SaaS 서비스로 분리할 때 추출 작업이 생길 수 있음

### 5-2. 별도 저장소 (현 시점에서 불필요)

별도 저장소가 적합한 시점:
- 외부 고객사(타사)에 이 진단 서비스를 독립 SaaS로 제공할 때
- 이 모듈만 별도 팀이 운영할 때

**결론**: 현재는 기존 저장소에 신규 모듈로 추가한다. 외부 서비스화 결정 시 분리를 재검토한다.

---

## 6. 신규 모듈 위치 권고

```
DesignFOBEE-AI-OS/
├── app/
│   ├── hq/
│   │   └── ai-search/            # (신규) AI 검색 진단 HQ 대시보드
│   │       ├── page.tsx           # 진단 현황 개요
│   │       ├── [businessId]/
│   │       │   ├── page.tsx       # 사업체별 진단 결과
│   │       │   └── measure/
│   │       │       └── page.tsx   # 측정 입력 화면
│   │       └── report/
│   │           └── page.tsx       # 보고서 출력
│   └── api/
│       └── ai-search/            # (신규) AI 검색 진단 API
│           ├── businesses/
│           ├── questions/
│           ├── measurements/
│           ├── improvements/
│           └── reports/
├── lib/
│   └── ai-search/                # (신규) AI 검색 진단 비즈니스 로직
│       ├── types.ts
│       ├── constants.ts
│       ├── businesses.ts
│       ├── questions.ts
│       ├── measurements.ts
│       └── reports.ts
├── components/
│   └── ai-search/                # (신규) AI 검색 진단 UI 컴포넌트
│       ├── BusinessCard.tsx
│       ├── MeasurementForm.tsx
│       ├── ResultsTable.tsx
│       └── ReportPreview.tsx
└── database/
    └── prisma/
        └── schema.prisma          # (수정) 신규 테이블 5개 추가
```

`/hq/ai-search` 경로를 선택한 이유:
- 기존 `/hq` 인증 게이트(`middleware.ts`)가 자동으로 이 경로를 보호함
- CEO Dashboard와 같은 맥락에서 관리됨
- 기존 `/hq` 레이아웃(`app/hq/layout.tsx`)을 그대로 재사용

---

## 7. 현재 제약사항

| 제약 | 내용 | 영향 |
|---|---|---|
| **Supabase 일시정지** | TODO.md "긴급" 항목 — DB 연결 실패 상태 | 신규 테이블 마이그레이션은 Supabase 재개 후 가능 |
| **엑셀 파일 부재** | 진단 엑셀이 저장소에 없음 | 실제 질문 20개·매장 정보를 코드에 반영하려면 파일 필요 |
| **AI 답변 자동 수집 불가** | 이번 단계 범위 제외 | 측정은 수동 입력으로만 진행 |
| **인증 게이트** | `/hq` 이하는 Supabase 인증 필요 | 개발 중에는 env 없이 인증 스킵되므로 로컬 개발 가능 |
| **미커밋 이전 작업** | 현재 없음 (clean) | 제약 없음 |

---

## 8. 다음 단계

1. **[대표님 확인 필요]** `GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx` 파일 위치 공유
2. **[이번 단계]** 설계 문서 4건 작성 (본 문서 포함) — 코드 변경 없음
3. **[승인 후]** 구현 착수 — DB 스키마 확장, API, UI 순서로 진행
4. **[Supabase 재개 후]** DB 마이그레이션 실행 (MIGRATION-RUNBOOK.md 절차 준수)
