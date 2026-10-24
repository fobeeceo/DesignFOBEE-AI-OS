# Phase 5 — AI Search 실제 운영 연결 아키텍처 설계
작성일: 2026-10-24 | 커밋 기준: f8ced68

---

## 1. 현재 구조 요약

### 1-1. 기존 Supabase + Prisma 설정 (기확인)

| 항목 | 현황 |
|---|---|
| Prisma 스키마 경로 | `database/prisma/schema.prisma` (228줄) |
| Provider | `postgresql` (Supabase Pool + Supabase Direct) |
| 마이그레이션 수 | 5개 (0_init ~ 20260925) |
| Prisma 사용 서비스 | `services/*.ts` 8개 파일 (Lead/Profile/Project/Design/Estimate/CRM/Photo/AIUsage) |
| Supabase 클라이언트 | `lib/supabase/server.ts` (쿠키 기반), `lib/supabase/admin.ts` (서비스 롤) |
| Auth | Supabase Auth (`auth.users` — Prisma 직접 매핑 없음, id 공유) |

### 1-2. AI Search 현재 아키텍처

```
lib/ai-search/
  questions.ts         ← 20문항 정적 배열 (GBRICK Coffee)
  static-results.ts    ← 1차 측정 결과 정적 배열 (2026-10-24 기준선)
  analyst/
    geminiAdapter.ts   ← Gemini API 호출 (TIMEOUT_MS = 30_000)
    runner.ts          ← 순차 실행 + INTER_QUESTION_DELAY_MS = 500ms
    mentionDetector.ts ← MENTIONED/NOT_MENTIONED/FAILED 판정
  dashboard-stats.ts   ← 통계 계산 (FAILED ≠ NOT_MENTIONED 핵심 규칙)
  improvement-tasks.ts ← 개선 과제 정적 배열
  content-drafts.ts    ← 콘텐츠 초안 타입 + canPublish() 게이트
  comparison.ts        ← Before/After 비교 구조 (D.5)
  monthly-report.ts    ← 월간 리포트 모델 (D.6)
  automation-design.ts ← 자동화 파이프라인 설계 (D.8)

app/api/hq/ai-search/run/route.ts  ← 측정 실행 API (관리자/서비스 토큰 인증)
```

### 1-3. 환경변수 현황

| 변수 | 현황 | AI Search 필요 여부 |
|---|---|---|
| `GEMINI_API_KEY` | `.env.local` 설정 ✅ | ✅ 필수 |
| `DATABASE_URL` | `.env.example`만 있음 ⚠️ | ✅ (Supabase 승인 후) |
| `DIRECT_URL` | `.env.example`만 있음 ⚠️ | ✅ (Prisma migrate 시) |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.example`만 있음 ⚠️ | ✅ (Supabase 승인 후) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.example`만 있음 ⚠️ | ✅ (서버 전용) |
| `N8N_SERVICE_TOKEN` | `.env.example` 빈 값 | 자동화 시 필요 |

> ⚠️ Supabase 관련 환경변수가 현재 `.env.local`에 없다. `createAdminClient()`는 값 없으면 즉시 throw — AI Search 저장 기능을 붙이기 전 반드시 설정 필요.

---

## 2. 영구 저장 스키마 설계 (Prisma 추가 모델)

기존 `database/prisma/schema.prisma`에 아래 모델을 추가한다.
**마이그레이션 실행은 대표 승인 후 별도 수행.**

```prisma
// ── AI Search 노출 진단 시스템 (Phase 5) ──────────────────────────────────

/// AI 검색 진단 대상 사업체.
/// 초기값은 lib/ai-search/constants.ts의 DEMO_BUSINESSES에서 seed.
model AiSearchBusiness {
  id            String   @id @default(cuid())
  name          String
  businessType  String
  brand         String
  address       String?
  phone         String?
  businessHours String?
  websiteUrl    String?
  naverPlaceUrl String?
  googlePlaceUrl String?
  instagramUrl  String?
  menuOrServices String?
  priceRange    String?
  /// PENDING | CONFIRMED | NEEDS_UPDATE
  factCheckStatus String @default("PENDING")
  factCheckedAt String?
  factCheckedBy String?
  isActive      Boolean  @default(true)
  notes         String?
  runs          AiSearchRun[]
  questions     AiSearchQuestionSnapshot[]
  improvementTasks ImprovementTask[]
  contentDrafts ContentDraft[]
  monthlyReports MonthlyReport[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("ai_search_businesses")
}

/// AI 검색 진단 질문 스냅샷.
/// questions.ts의 정적 배열을 DB에 보존 — 질문 변경 이력 추적 가능.
model AiSearchQuestionSnapshot {
  id           String   @id @default(cuid())
  businessId   String
  business     AiSearchBusiness @relation(fields: [businessId], references: [id])
  questionCode String
  questionText String
  /// BRAND | LOCATION | MENU | PRICE | ATMOSPHERE | FRANCHISE | REVIEW | COMPARISON | RECOMMEND | OTHER
  category     String
  region       String?
  searchIntent String
  isActive     Boolean  @default(true)
  version      Int      @default(1)
  versionNote  String?
  results      AiSearchResult[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([businessId, questionCode, version])
  @@index([businessId])
  @@map("ai_search_question_snapshots")
}

/// 측정 실행(1 run = 최대 20문항) 기록.
/// 중복 실행 방지: runId unique 제약.
model AiSearchRun {
  id           String   @id @default(cuid())
  runId        String   @unique
  businessId   String
  business     AiSearchBusiness @relation(fields: [businessId], references: [id])
  /// GEMINI | CHATGPT
  aiService    String
  aiModel      String
  /// RUNNING | COMPLETED | FAILED | PARTIAL
  status       String   @default("RUNNING")
  totalQuestions Int
  mentioned    Int      @default(0)
  notMentioned Int      @default(0)
  failed       Int      @default(0)
  /// 성공 분모 기준 언급률 — FAILED/UNMEASURED 제외
  mentionRate  Float?
  /// SCHEDULE | MANUAL
  triggeredBy  String   @default("MANUAL")
  timeoutMs    Int      @default(30000)
  startedAt    DateTime
  finishedAt   DateTime?
  results      AiSearchResult[]
  createdAt    DateTime @default(now())

  @@index([businessId, startedAt])
  @@map("ai_search_runs")
}

/// 질문 1개의 측정 결과.
/// FAILED ≠ NOT_MENTIONED — failureReason 있으면 FAILED.
model AiSearchResult {
  id             String   @id @default(cuid())
  runId_fk       String
  run            AiSearchRun @relation(fields: [runId_fk], references: [id])
  questionId     String
  question       AiSearchQuestionSnapshot @relation(fields: [questionId], references: [id])
  questionCode   String
  /// MENTIONED | NOT_MENTIONED | FAILED | UNMEASURED
  mentionStatus  String
  answerSummary  String?  @db.Text
  /// 최대 5개 URL
  sourceUrls     String[] @default([])
  evidence       String?  @db.Text
  failureReason  String?
  measuredAt     DateTime
  createdAt      DateTime @default(now())

  @@index([runId_fk])
  @@index([questionCode])
  @@map("ai_search_results")
}

/// 개선 과제.
model ImprovementTask {
  id                   String   @id @default(cuid())
  businessId           String
  business             AiSearchBusiness @relation(fields: [businessId], references: [id])
  questionCode         String
  relatedQuestionCodes String[] @default([])
  problem              String   @db.Text
  hypothesis           String   @db.Text
  contentPlan          String   @db.Text
  targetPlatform       String
  /// PENDING | PLANNING | AWAITING_CEO | AWAITING_CUSTOMER | IN_PROGRESS | DONE | VERIFIED
  status               String   @default("PENDING")
  /// AI | CEO | CUSTOMER
  assignee             String   @default("AI")
  customerApproved     Boolean?
  executedAt           DateTime?
  /// IMPROVED | NO_CHANGE | REGRESSION | INSUFFICIENT_DATA
  verificationResult   String?
  verifiedAt           DateTime?
  contentDrafts        ContentDraft[]
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([businessId])
  @@map("improvement_tasks")
}

/// 콘텐츠 초안. canPublish() = status=APPROVED AND factChecked=true.
model ContentDraft {
  id                  String   @id @default(cuid())
  businessId          String
  business            AiSearchBusiness @relation(fields: [businessId], references: [id])
  improvementTaskId   String
  improvementTask     ImprovementTask @relation(fields: [improvementTaskId], references: [id])
  targetQuestionCode  String
  /// NAVER_BLOG | GOOGLE_BUSINESS | INSTAGRAM | THREADS | FACEBOOK | TIKTOK | YOUTUBE_SHORTS
  platform            String
  title               String
  body                String   @db.Text
  keywords            String[] @default([])
  /// DRAFT | AWAITING_CEO | CEO_APPROVED | AWAITING_CUSTOMER | APPROVED | PUBLISHED | REJECTED
  status              String   @default("DRAFT")
  ceoFeedback         String?  @db.Text
  customerFeedback    String?  @db.Text
  /// true이면 canPublish() 통과 가능 — 반드시 사람이 확인 후 true로 전환
  factChecked         Boolean  @default(false)
  factCheckItems      String[] @default([])
  publishedAt         DateTime?
  publishedUrl        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([businessId])
  @@map("content_drafts")
}

/// 월간 AI 검색 노출 리포트.
/// approvedByCeo = false이면 대외 공유 불가.
model MonthlyReport {
  id                  String   @id @default(cuid())
  businessId          String
  business            AiSearchBusiness @relation(fields: [businessId], references: [id])
  /// YYYY-MM
  reportMonth         String
  executiveSummary    String   @db.Text
  /// DashboardStats JSON (overall/general/brand/measuredAt/model)
  statsSnapshot       Json
  /// ComparisonSummary JSON — null이면 전월 데이터 없음
  comparisonSnapshot  Json?
  /// AiSearchRun.runId 목록
  measurementRunIds   String[] @default([])
  approvedByCeo       Boolean  @default(false)
  approvedAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([businessId, reportMonth])
  @@index([businessId])
  @@map("monthly_reports")
}
```

---

## 3. Before/After 비교 연결 방식

```
AiSearchRun (1차, startedAt: 2026-10-24)
  └─ AiSearchResult × 20 (Q01–Q20, measuredAt 기록)

AiSearchRun (2차, startedAt: 콘텐츠 게시 4주 후)
  └─ AiSearchResult × 20

comparison.ts의 buildQuestionComparisons()
  ← 1차 runId + 2차 runId로 AiSearchResult 쿼리
  ← questionCode 기준 JOIN
  ← 질문 집합이 다르면 NOT_MEASURED로 표시
```

**비교 조건 검증:**
- 두 런의 `totalQuestions`가 다르면 UI에 "측정 범위 다름" 경고 표시
- 1차에 없는 질문이 2차에 있으면 `NOT_MEASURED`(첫 측정) 표시
- FAILED는 비교에서 별도 계산 — 언급률 분모에서 제외 유지

---

## 4. 자동화 준비 — 설계만 (스케줄러 활성화는 별도 승인)

### 4-1. 중복 실행 방지

```typescript
// AiSearchRun.runId UNIQUE 제약으로 DB 레벨에서 막는다
// 추가로 실행 전 다음 조건 확인:
async function canStartNewRun(businessId: string): Promise<boolean> {
  const running = await prisma.aiSearchRun.findFirst({
    where: { businessId, status: 'RUNNING' },
  });
  return running === null;
}
```

### 4-2. API 호출 제한 및 비용 관리

| 항목 | 현재 설정 | 권고 |
|---|---|---|
| 타임아웃 | 30,000ms | 45,000ms (Q03 해결 후 조정 — §5 참고) |
| 질문 간 딜레이 | 500ms | 유지 (API 과부하 방지) |
| 최대 질문 수 | API 기본 1, 승인 시 20 | 유지 |
| 월 예상 호출 | 20문항 × 월 1회 = 20 | Gemini API 무료 티어 초과 가능성 낮음 |

### 4-3. 실패 재시도 전략

```typescript
// geminiAdapter.ts에 추가할 retry 로직 (설계)
const MAX_RETRIES = 1; // 타임아웃 한 번만 재시도
const RETRY_TIMEOUT_MS = 45_000; // 재시도 시 연장

async function withRetry(fn: () => Promise<T>, question: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isTimeoutError(err)) {
      // 재시도 1회 — 타임아웃 원인이 일시적 지연일 수 있음
      return await fn(); // RETRY_TIMEOUT_MS 적용
    }
    throw err; // 타임아웃 외 오류는 즉시 FAILED
  }
}
```

### 4-4. 실행 기록 및 오류 알림

```
성공: AiSearchRun.status = 'COMPLETED'
부분 실패: AiSearchRun.status = 'PARTIAL' (FAILED > 0)
전체 실패: AiSearchRun.status = 'FAILED'
알림 채널: .env.example의 DISCORD_WEBHOOK_URL (현재 빈 값)
```

### 4-5. 권한 구분

| 실행 방식 | 인증 | 최대 질문 수 |
|---|---|---|
| 수동 (관리자 브라우저) | Supabase 세션 + isAdmin | 20 |
| 자동 (n8n 스케줄) | `N8N_SERVICE_TOKEN` Bearer | 20 |
| 테스트 (dryRun) | 관리자 세션 | 제한 없음 |

---

## 5. Q03 타임아웃 조사 결과 및 권고

### 5-1. 확인된 사실

- **질문 내용**: "은평구 진관동에서 조용히 커피 마실 수 있는 카페를 추천해 줘."
- **타임아웃 설정**: `TIMEOUT_MS = 30_000` (AbortController 기반)
- **실패 이력**: 1차·재측정 2회 모두 30초 초과 (static-results.ts 기록)
- **실패 원인 패턴**: Gemini Google Search grounding이 지역명 "진관동"에서 검색 결과를 다수 수집하며 응답 생성이 지연되는 것으로 추정
- **실제 API 호출 여부**: 이번 조사에서 추가 호출 없음 (비용 절약)

### 5-2. "진관동" vs "은평뉴타운" 차이 분석

| 질문 | 지역명 | Q01/Q02 결과 | Q03 결과 |
|---|---|---|---|
| Q01 은평뉴타운 일반 | 은평뉴타운 | NOT_MENTIONED (정상 응답) | — |
| Q02 한옥마을 근처 | 은평 한옥마을 | NOT_MENTIONED (정상 응답) | — |
| Q03 진관동 조용한 카페 | 진관동 | **FAILED (타임아웃)** | — |

"진관동"은 행정동 단위 소규모 지역명으로, Google Search grounding이 이 지역에 대한 카페 리뷰/블로그를 집중 수집하면서 응답 시간이 길어질 가능성이 있다.

### 5-3. 선택지 비교

| 방안 | 비용 | 효과 | 위험 |
|---|---|---|---|
| **A. 타임아웃 45초로 연장** | 없음 | Q03 1~2회 자연 해결 가능 | 실행 1회 최대 시간 증가 (15→22.5분) |
| **B. 질문 단순화** | 없음 | "진관동" → "은평뉴타운 조용한 카페"로 변경 | 질문 의도 약간 변경 (대표 승인 필요) |
| **C. Q03 재시도 1회 추가** | API 호출 1회 추가 | 일시적 지연 해결 | 비용 소량 증가 |
| **D. Q03 isActive=false 임시 비활성** | 없음 | 통계 왜곡 제거 | 측정 범위 축소 |

### 5-4. 권고안 (대표 승인 후 적용)

**1순위**: 방안 A (타임아웃 45,000ms) + 방안 C (재시도 1회)를 함께 적용.
이유: 코드 변경 최소, 비용 영향 미미, 원인이 일시적 지연일 가능성 높음.

**2순위 (A+C로도 실패 반복 시)**: 방안 B — 대표 승인 후 질문 수정.

> 변경 사항: `lib/ai-search/analyst/geminiAdapter.ts` TIMEOUT_MS = 45_000 + retry 로직 추가.
> 실제 API 호출 검증은 maxQuestions:1, 대상 Q03만 지정하여 최소 비용으로 확인.

---

## 6. 예상 비용 요소 (운영 전 확인 필요)

| 항목 | 규모 | 확인 방법 |
|---|---|---|
| Gemini API | 20문항 × 월 1~4회 = 20~80 calls | Google AI Studio → 사용량 대시보드 |
| Supabase | 무료 티어 (500MB DB, 1GB Storage) — AI Search 데이터 소량 | Supabase 대시보드 |
| Vercel 서버리스 | 측정 실행 시 최대 15~22분 함수 실행 — Hobby 요금제 10초 제한 초과 | Vercel 함수 타임아웃 설정 확인 필요 |

> ⚠️ **Vercel 함수 타임아웃**: Hobby 요금제는 10초, Pro는 5분, Enterprise는 15분.
> 20문항 × 45초 = 최대 900초(15분) — Pro 요금제 이상 또는 별도 실행 방식 필요.
> 대안: n8n을 통한 별도 서버에서 실행 후 결과만 API로 저장.

---

## 7. 보안 위험 요소

| 위험 | 현재 보호 | 추가 필요 |
|---|---|---|
| GEMINI_API_KEY 노출 | sanitizeErrorMessage()로 로그 제거 | ✅ 충분 |
| 측정 결과 무단 접근 | requireServiceOrAdmin() 인증 | RLS 정책 추가 (Supabase 승인 후) |
| 콘텐츠 무단 게시 | canPublish() 게이트 | DB 레이블에서도 status 검증 필요 |
| 가짜 측정 데이터 삽입 | 없음 | API 경유만 허용, 직접 DB 쓰기 방지 |

---

## 8. 승인 필요 항목 (대표만 결정)

| # | 항목 | 현재 상태 | 대표 결정 필요 내용 |
|---|---|---|---|
| 1 | Supabase 환경변수 설정 | 미설정 | 실제 PROJECT_URL, ANON_KEY, SERVICE_ROLE_KEY 입력 |
| 2 | Prisma 마이그레이션 실행 | 스키마 설계 완료 | `prisma migrate dev` 실행 승인 |
| 3 | Q03 타임아웃 연장 45초 | TIMEOUT_MS=30,000 | 코드 변경 + 실제 API 1회 호출 검증 승인 |
| 4 | Vercel 요금제 확인 | Hobby 추정 | Pro 업그레이드 또는 n8n 분리 실행 방식 결정 |
| 5 | 자동화 스케줄 활성화 | 설계 완료 | n8n 스케줄 + N8N_SERVICE_TOKEN 설정 |
| 6 | DISCORD_WEBHOOK_URL 설정 | 빈 값 | 오류 알림 채널 지정 |

---

## 9. 권고 실행 순서 (승인 후)

```
[Step 1 — 대표 직접 실행] Supabase 환경변수 .env.local 에 추가
[Step 2 — AI 실행 가능]   Prisma 스키마 + 마이그레이션 (승인 확인 후)
[Step 3 — AI 실행 가능]   GBRICK Coffee 기준선 seed (static-results.ts → DB)
[Step 4 — AI 실행 가능]   Q03 타임아웃 45초 + retry 코드 수정
[Step 5 — 최소 비용 검증] maxQuestions:1 + Q03 단독 실행으로 타임아웃 해결 확인
[Step 6 — 대표 결정 후]   Vercel 요금제 확인 또는 n8n 분리 방식 채택
[Step 7 — 대표 결정 후]   n8n 자동화 스케줄 활성화
```
