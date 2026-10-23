# AI-SEARCH-DIAGNOSTIC-DATA-MODEL — 데이터 구조 설계

> 작성일: 2026-10-23 | 작성자: AI CTO (Claude Code)
> 관련 문서: [AI-SEARCH-DIAGNOSTIC-ASSESSMENT.md](AI-SEARCH-DIAGNOSTIC-ASSESSMENT.md) · [AI-SEARCH-DIAGNOSTIC-IMPLEMENTATION-PLAN.md](AI-SEARCH-DIAGNOSTIC-IMPLEMENTATION-PLAN.md) · [CLAUDE.md](CLAUDE.md) §14-A

---

## 0. 설계 원칙

이 데이터 모델은 CLAUDE.md §0-2와 §14-A를 따른다.

| 원칙 | 적용 |
|---|---|
| **사실이 먼저** (원칙 1) | 실제로 측정한 결과만 저장. 추정·보간 금지 |
| **없으면 없다고** (원칙 2) | 미측정 필드는 `null`로 저장. 빈 값을 채우지 않음 |
| **자동 계산** (원칙 5) | 언급률·변화율은 DB의 실제 레코드에서 계산. 하드코딩 금지 |
| **SSOT** (§14-A ⑥) | 사업체 기본 정보는 `AiSearchBusiness` 한 곳만. 중복 저장 금지 |
| **미측정 ≠ 미언급** | 측정하지 않은 경우와 언급되지 않은 경우를 별도 상태로 구분 |

---

## 1. 엔티티 관계도

```
AiSearchBusiness (사업체)
    │
    ├── AiSearchMeasurement (측정 실행 기록)
    │       └── AiSearchQuestion (진단 질문) ← (공유)
    │
    └── AiSearchImprovement (개선 작업)
            └── AiSearchMeasurement (개선 전후 측정값 참조)
```

---

## 2. 테이블별 필드 정의

### 2-1. AiSearchBusiness (사업체 정보)

> 진단 대상 사업체. 1차: GBRICK Coffee, 2차: 디자인포비.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | String (cuid) | ✅ | 기본키 |
| `name` | String | ✅ | 사업체명 (예: "GBRICK Coffee 은평본점") |
| `businessType` | String | ✅ | 업종 (예: "카페", "인테리어") |
| `brand` | String | ✅ | 브랜드명 (예: "GBRICK Coffee", "DesignFOBEE") |
| `address` | String | ✅ | 주소 (AI 검색 시 지역 정보로 사용) |
| `phone` | String? | - | 전화번호 |
| `businessHours` | String? | - | 영업시간 |
| `websiteUrl` | String? | - | 공식 웹사이트 URL |
| `naverPlaceUrl` | String? | - | 네이버 플레이스 URL |
| `googlePlaceUrl` | String? | - | 구글 맵 URL |
| `instagramUrl` | String? | - | 인스타그램 URL |
| `menuOrServices` | String? | - | 주요 메뉴/서비스 (간략 기술) |
| `priceRange` | String? | - | 가격대 (예: "아메리카노 4,500원") |
| `factCheckStatus` | String | ✅ | 사실 확인 상태: `PENDING` \| `CONFIRMED` \| `NEEDS_UPDATE` |
| `factCheckedAt` | DateTime? | - | 마지막 사실 확인일 |
| `factCheckedBy` | String? | - | 확인자 (예: "ceo@fobee.co.kr") |
| `isActive` | Boolean | ✅ | 활성 사업체 여부 (default: true) |
| `notes` | String? | - | 내부 메모 |
| `createdAt` | DateTime | ✅ | 생성일 (자동) |
| `updatedAt` | DateTime | ✅ | 수정일 (자동) |

**검증 규칙**:
- `name`은 실제 사업자등록 명칭 또는 브랜드명 사용 — 임의 생성 금지
- `websiteUrl` 등 URL은 실제 접근 가능한 주소만 입력 (입력 시 형식 검증)
- `factCheckStatus`가 `CONFIRMED`인 경우에만 AI 검색 결과 비교에 사용

---

### 2-2. AiSearchQuestion (진단 질문)

> AI에게 물어볼 질문 목록. 엑셀 "AI질문_20" 시트의 20개 질문을 기반으로 한다.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | String (cuid) | ✅ | 기본키 |
| `questionCode` | String | ✅ | 질문 코드 (예: "Q-001") — 유니크 |
| `questionText` | String | ✅ | 질문 문구 전문 |
| `category` | String | ✅ | 질문 유형 (예: "브랜드인지", "위치/접근성", "메뉴/서비스", "비교/추천") |
| `region` | String? | - | 지역 범위 (예: "서울 은평구", "전국") |
| `searchIntent` | String | ✅ | 검색 의도 (예: "정보탐색", "방문결정", "비교검색") |
| `isActive` | Boolean | ✅ | 활성 질문 여부 (default: true) |
| `version` | Int | ✅ | 질문 버전 (수정 시 버전 증가) |
| `versionNote` | String? | - | 버전 변경 이유 |
| `createdAt` | DateTime | ✅ | 생성일 (자동) |
| `updatedAt` | DateTime | ✅ | 수정일 (자동) |

**검증 규칙**:
- `questionCode`는 한 번 발급하면 변경하지 않음 (측정 이력과 연결되므로)
- 질문 문구를 변경할 경우 `version`을 증가시키고 `versionNote`에 이유 기록
- 기존 질문을 삭제하지 않고 `isActive: false`로만 비활성화

---

### 2-3. AiSearchMeasurement (측정 실행 기록)

> AI 서비스에 질문을 입력하고 결과를 기록한 단건 측정. 수동 입력 전용 (1차 단계).

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | String (cuid) | ✅ | 기본키 |
| `businessId` | String | ✅ | FK → AiSearchBusiness.id |
| `questionId` | String | ✅ | FK → AiSearchQuestion.id |
| `measuredAt` | DateTime | ✅ | 실제 측정일시 (입력자가 직접 기록) |
| `aiService` | String | ✅ | AI 서비스명: `CHATGPT` \| `GEMINI` \| `CLAUDE` \| `PERPLEXITY` \| `OTHER` |
| `aiServiceVersion` | String? | - | 버전 정보 (예: "GPT-4o", "Gemini 1.5 Pro") |
| `answerSummary` | String? | - | 답변 요약 (측정자가 직접 입력) |
| `answerFull` | String? | - | 답변 전문 (선택, 길이 제한 없음) |
| `isMentioned` | Boolean? | - | 사업체 언급 여부 (`null` = 미측정) |
| `isInRecommendedList` | Boolean? | - | 추천 목록 포함 여부 (`null` = 해당없음 또는 미확인) |
| `mentionPosition` | Int? | - | 추천 목록 내 위치 (1부터 시작, `null` = 미언급 또는 미확인) |
| `sourceUrls` | String[] | - | 답변에서 확인된 출처 URL 목록 |
| `sourceCount` | Int | ✅ | 확인된 출처 수 (default: 0, sourceUrls.length로 자동 계산 예정) |
| `isManualEntry` | Boolean | ✅ | 수동 입력 여부 (1차 단계는 항상 true) |
| `measurerEmail` | String? | - | 측정자 이메일 |
| `notes` | String? | - | 비고 (측정 조건, 특이사항) |
| `createdAt` | DateTime | ✅ | 레코드 생성일 (자동) |
| `updatedAt` | DateTime | ✅ | 수정일 (자동) |

**검증 규칙**:
- `isMentioned: null`은 아직 이 질문을 측정하지 않았다는 뜻 — `false`(미언급)와 명확히 구분
- `mentionPosition`은 `isInRecommendedList: true`일 때만 의미 있음
- `measuredAt`은 측정한 실제 날짜로 기록 (생성 날짜와 다를 수 있음)
- 동일한 (businessId + questionId + aiService + measuredAt의 날짜)로 중복 입력 시 경고
- `answerSummary`와 `answerFull` 중 하나는 반드시 입력

**`isMentioned` 상태 매핑**:

| 상태 | `isMentioned` 값 | 의미 |
|---|---|---|
| 미측정 | `null` | 아직 이 질문으로 측정하지 않음 |
| 언급됨 | `true` | AI 답변에서 사업체 언급 확인 |
| 미언급 | `false` | AI 답변에서 사업체 언급 없음 |

---

### 2-4. AiSearchImprovement (개선 작업)

> 진단 결과 발견된 문제에 대한 개선 작업 추적.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | String (cuid) | ✅ | 기본키 |
| `businessId` | String | ✅ | FK → AiSearchBusiness.id |
| `title` | String | ✅ | 개선 작업 제목 |
| `issueFound` | String | ✅ | 발견된 문제 설명 |
| `improvementTarget` | String | ✅ | 개선 대상 (예: "네이버 플레이스 정보", "웹사이트 메뉴 페이지") |
| `improvementContent` | String? | - | 개선할 구체적 내용 |
| `priority` | String | ✅ | 우선순위: `HIGH` \| `MEDIUM` \| `LOW` |
| `assignee` | String? | - | 담당자 |
| `approvalStatus` | String | ✅ | 승인 상태: `DRAFT` \| `APPROVED` \| `REJECTED` |
| `approvedBy` | String? | - | 승인자 |
| `approvedAt` | DateTime? | - | 승인일시 |
| `isPublished` | Boolean | ✅ | 실제 게시 여부 (default: false) |
| `publishedAt` | DateTime? | - | 실제 게시일시 |
| `publishedUrl` | String? | - | 게시된 콘텐츠/정보 URL |
| `beforeMeasurementId` | String? | - | FK → AiSearchMeasurement.id (개선 전 측정) |
| `afterMeasurementId` | String? | - | FK → AiSearchMeasurement.id (개선 후 측정) |
| `notes` | String? | - | 비고 |
| `createdAt` | DateTime | ✅ | 생성일 (자동) |
| `updatedAt` | DateTime | ✅ | 수정일 (자동) |

**검증 규칙**:
- `isPublished: true`로 변경 시 `publishedAt`을 함께 기록
- `approvalStatus: APPROVED` 없이는 `isPublished`를 true로 설정할 수 없음 (API 레벨 검증)
- `beforeMeasurementId`와 `afterMeasurementId`는 동일한 `businessId`의 측정만 연결 가능

---

### 2-5. AiSearchReport (진단 보고서)

> 특정 기간의 측정 결과를 집계한 보고서 메타데이터. 보고서 내용 자체는 동적 계산.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | String (cuid) | ✅ | 기본키 |
| `businessId` | String | ✅ | FK → AiSearchBusiness.id |
| `reportTitle` | String | ✅ | 보고서 제목 |
| `periodFrom` | DateTime | ✅ | 측정 기간 시작일 |
| `periodTo` | DateTime | ✅ | 측정 기간 종료일 |
| `generatedBy` | String? | - | 생성자 이메일 |
| `reportType` | String | ✅ | 보고서 유형: `BASELINE` \| `MONTHLY` \| `COMPARISON` |
| `snapshotJson` | String? | - | 보고서 생성 시점의 집계 데이터 JSON 스냅샷 (아카이브용) |
| `createdAt` | DateTime | ✅ | 생성일 (자동) |

**검증 규칙**:
- `snapshotJson`은 보고서 생성 시점의 데이터를 고정 저장 — 이후 데이터가 바뀌어도 과거 보고서가 변하지 않음
- 보고서의 집계값(언급률, 출처 수 등)은 `snapshotJson`이 있으면 그 값을 표시, 없으면 현재 DB에서 실시간 계산

---

## 3. 집계 계산 규칙

실제 수치는 DB 레코드에서 계산한다. 하드코딩 금지 (§14-A ①).

### 언급률 (Mention Rate)

```
언급된 측정 수 / 전체 측정 수 × 100

= COUNT(isMentioned = true) / COUNT(isMentioned IS NOT NULL) × 100
```

- 분모에서 `isMentioned = null` (미측정)은 제외
- AI 서비스별, 기간별로 각각 계산 가능

### 출처 확인율

```
sourceCount > 0 인 측정 수 / 언급된 측정 수 × 100
```

### 개선 후 변화율

```
(개선 후 언급률 - 개선 전 언급률) / 개선 전 언급률 × 100
```

- 분모가 0인 경우(개선 전 언급 없음) 특별 처리: "미언급 → 언급됨" 으로 표시

---

## 4. 결측값 및 기록 출처 정의

| 필드 유형 | 결측값 처리 | 설명 |
|---|---|---|
| 측정 미실시 | `null` | 아직 측정하지 않은 것 — 0이나 false와 다름 |
| 해당 없음 | `null` + `notes`에 이유 | 예: 추천 목록이 없는 AI 답변의 `mentionPosition` |
| 확인 실패 | `null` + `notes`에 이유 | 예: 답변 내 출처를 확인할 수 없을 때 |
| 측정 거부 | `isActive: false` 처리 | 질문 자체가 해당 사업체에 적합하지 않을 때 |

**기록 출처**:
- 모든 측정 레코드에 `measurerEmail`로 측정자를 기록
- 자동 수집(2차 단계 이후)은 `isManualEntry: false` + `aiServiceVersion`에 수집 도구 버전 기록
- 보고서는 `generatedBy`로 생성자 기록

---

## 5. 엑셀 파일과의 매핑 설계

`GBRICK_AI_Search_Baseline_Diagnostic_v1.0.xlsx` 파일이 제공될 경우 다음 방식으로 매핑한다.

| 엑셀 시트 | 매핑 테이블 | 매핑 방식 |
|---|---|---|
| `AI질문_20` | `AiSearchQuestion` | 20개 질문 → questionCode Q-001~Q-020으로 일괄 삽입 |
| `매장정보_사실확인` | `AiSearchBusiness` | 사업체 정보 및 사실 확인 상태 → 초기 데이터 |
| `측정_운영원칙` | 운영 문서화 | 데이터로 저장하지 않음 — `CLAUDE.md` §6 측정 원칙과 대조해 설계에 반영 |

**원본 엑셀 파일은 수정하지 않는다.** DB 삽입은 별도 시딩(seed) 스크립트로 실행.

---

## 6. Prisma 스키마 신규 테이블 (설계안)

> 승인 후 `database/prisma/schema.prisma`에 추가 예정. 기존 테이블 변경 없음.

```prisma
/// AI 검색 진단 대상 사업체
model AiSearchBusiness {
  id              String    @id @default(cuid())
  name            String
  businessType    String
  brand           String
  address         String
  phone           String?
  businessHours   String?
  websiteUrl      String?
  naverPlaceUrl   String?
  googlePlaceUrl  String?
  instagramUrl    String?
  menuOrServices  String?
  priceRange      String?
  factCheckStatus String    @default("PENDING")
  factCheckedAt   DateTime?
  factCheckedBy   String?
  isActive        Boolean   @default(true)
  notes           String?
  measurements    AiSearchMeasurement[]
  improvements    AiSearchImprovement[]
  reports         AiSearchReport[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("ai_search_businesses")
}

/// AI 진단 질문 목록
model AiSearchQuestion {
  id            String    @id @default(cuid())
  questionCode  String    @unique
  questionText  String
  category      String
  region        String?
  searchIntent  String
  isActive      Boolean   @default(true)
  version       Int       @default(1)
  versionNote   String?
  measurements  AiSearchMeasurement[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("ai_search_questions")
}

/// 측정 실행 기록 (수동 입력)
model AiSearchMeasurement {
  id                    String    @id @default(cuid())
  businessId            String
  business              AiSearchBusiness @relation(fields: [businessId], references: [id])
  questionId            String
  question              AiSearchQuestion @relation(fields: [questionId], references: [id])
  measuredAt            DateTime
  aiService             String
  aiServiceVersion      String?
  answerSummary         String?
  answerFull            String?
  isMentioned           Boolean?
  isInRecommendedList   Boolean?
  mentionPosition       Int?
  sourceUrls            String[]  @default([])
  sourceCount           Int       @default(0)
  isManualEntry         Boolean   @default(true)
  measurerEmail         String?
  notes                 String?
  beforeImprovements    AiSearchImprovement[] @relation("BeforeMeasurement")
  afterImprovements     AiSearchImprovement[] @relation("AfterMeasurement")
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([businessId])
  @@index([questionId])
  @@index([measuredAt])
  @@index([aiService])
  @@map("ai_search_measurements")
}

/// 개선 작업 추적
model AiSearchImprovement {
  id                    String    @id @default(cuid())
  businessId            String
  business              AiSearchBusiness @relation(fields: [businessId], references: [id])
  title                 String
  issueFound            String
  improvementTarget     String
  improvementContent    String?
  priority              String    @default("MEDIUM")
  assignee              String?
  approvalStatus        String    @default("DRAFT")
  approvedBy            String?
  approvedAt            DateTime?
  isPublished           Boolean   @default(false)
  publishedAt           DateTime?
  publishedUrl          String?
  beforeMeasurementId   String?
  beforeMeasurement     AiSearchMeasurement? @relation("BeforeMeasurement", fields: [beforeMeasurementId], references: [id])
  afterMeasurementId    String?
  afterMeasurement      AiSearchMeasurement? @relation("AfterMeasurement", fields: [afterMeasurementId], references: [id])
  notes                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([businessId])
  @@index([priority])
  @@map("ai_search_improvements")
}

/// 진단 보고서 메타데이터
model AiSearchReport {
  id            String    @id @default(cuid())
  businessId    String
  business      AiSearchBusiness @relation(fields: [businessId], references: [id])
  reportTitle   String
  periodFrom    DateTime
  periodTo      DateTime
  generatedBy   String?
  reportType    String    @default("BASELINE")
  snapshotJson  String?
  createdAt     DateTime  @default(now())

  @@index([businessId])
  @@map("ai_search_reports")
}
```
