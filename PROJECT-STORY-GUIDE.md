# 프로젝트 스토리 입력 가이드

대표님이 스토리를 주시면 **파일 한 개만 수정**하면 홈페이지·상세 페이지·SEO·JSON-LD·sitemap이 전부 자동으로 연결됩니다.

수정 대상: `lib/projects/stories.ts` 의 `PROJECT_STORIES` 배열

---

## 1. 대표님이 주실 내용 (9가지)

프로젝트 한 건당 아래만 알려주시면 됩니다. **실제로 있었던 일만** 적습니다(추측·각색 금지).

| # | 항목 | 설명 |
|---|---|---|
| 1 | 프로젝트명 | 매장·현장 이름 |
| 2 | 지역 | 시·구 단위 (예: 서울 은평구) |
| 3 | 연도 | 완공 연도 |
| 4 | 고객 요구사항 | 고객이 무엇을 원했는지 |
| 5 | 가장 어려웠던 점 | 실제로 부딪힌 문제 |
| 6 | 해결 방법 | 그래서 어떻게 했는지 |
| 7 | 고객 반응 | 완공 후 고객이 한 말·반응 |
| 8 | 대표님이 가장 만족하는 점 | 이 현장에서 잘한 부분 |
| 9 | 공개 가능한 사진 | 고객 공개 동의를 받은 사진 |

**말로 하셔도 됩니다.** 현장 이야기를 그대로 들려주시면 아래 3~6번을 제가 정리해 확인받고 넣겠습니다.

### AI가 위 내용으로 자동 생성하는 것

| 생성 대상 | 재료 |
|---|---|
| `summary` (홈 요약 한 줄) | 1·4·8번 |
| `challenge` (과제) | 4·5번 |
| `approach` (해결 방법) | 6번 |
| `result` (결과) | 7·8번 |
| SEO title·description·keywords | 1·2·고객유형 |
| JSON-LD 구조화 데이터 | 전체 |

⚠️ **AI는 문장을 다듬을 뿐, 사실을 만들어내지 않습니다.** 대표님이 주신 내용에 없는 수치·고객명·후기는 절대 추가하지 않으며, 정리한 문안은 반영 전에 확인받습니다(CLAUDE.md §14-A ②⑤).

---

## 2. 입력 방법 (개발자용)

```ts
export const PROJECT_STORIES: ProjectStory[] = [
  {
    // ── 관리 정보 (ERP·성공사례DB·CRM 공용) ──
    projectId: "GBRICK-PJT-001",           // 사내 관리번호
    slug: "gbrick-eunpyeong",              // URL → /projects/gbrick-eunpyeong
    clientType: "cafe",                    // church | cafe | retail | office | commercial
    status: "completed",                   // planning | in_progress | completed
    services: ["설계", "시공", "브랜딩"],
    completedAt: "2013-05-01",             // 정렬·집계용(선택)

    // ── 표시 정보 ──
    title: "GBRICK Coffee 은평본점",
    location: "서울 은평구",
    year: "2013",
    summary: "공간 자체가 브랜드가 되는 매장 모델을 직접 검증한 1호점",
    coverSlug: "designfobee-gbrick-storefront-night-01",

    // ── 본문 ──
    challenge: "...",
    approach: "...",
    result: "...",

    // ── 노출 제어 ──
    featured: true,                        // 홈 요약 카드 우선 노출
    public: true,                          // 고객 공개 동의를 받은 경우에만 true

    // ── 선택 ──
    gallerySlugs: ["designfobee-cafe-counter-shelving-01"],
    relatedProjects: ["gbrick-ansan"],
    keywords: ["은평구 카페 인테리어"],
  },
];
```

### 규칙
- `slug`: 영문 소문자·숫자·하이픈만. **한 번 정하면 바꾸지 않습니다**(URL이 바뀌면 검색 순위가 초기화됨).
- `clientType`: 한글 분류명(카페·교회 등)은 여기서 **자동 파생**됩니다. 따로 적지 않습니다(중복 데이터 금지).
- `public: false` 또는 `status !== "completed"`면 **홈·상세·sitemap 어디에도 노출되지 않습니다.** 공개 동의를 받지 못한 현장을 안전하게 보관만 할 수 있습니다.
- `coverSlug` / `gallerySlugs`: `public/images/portfolio/website/` 안의 파일명에서 `.webp`를 뺀 값.

---

## 3. 저장하면 자동으로 되는 일

파일 한 곳만 고쳤는데 아래가 전부 따라옵니다. **다른 파일은 건드리지 않습니다.**

| 연결 대상 | 동작 | RC1 실측 |
|---|---|---|
| 홈페이지 요약 | 최신·featured 3건 카드 노출 | ✅ 확인 |
| 상세 페이지 | `/projects/[slug]` 자동 생성 | ✅ 확인 |
| SEO 메타데이터 | title·description·keywords·canonical·OG 자동 | ✅ 확인 |
| JSON-LD | `CreativeWork` 구조화 데이터 자동 삽입 | ✅ 확인 |
| sitemap.xml | 스토리 URL 자동 등록 | ✅ 확인 |
| 포트폴리오 | 같은 고객유형 사진과 자동 연결 | ✅ 확인 |

---

## 4. 지금 비어 있는 이유

실제 스토리 자료를 받기 전이라 `PROJECT_STORIES`는 **의도적으로 빈 배열**입니다.

- 홈 스토리 섹션: 자동 **숨김** (빈 카드·"준비 중" 문구 노출 안 함)
- `/projects/*`: 전부 **404** (빈 껍데기 페이지 생성 안 함)
- sitemap: 스토리 URL **미포함**

CLAUDE.md §14-A ②「실제 자료가 없으면 AI가 생성하지 않는다. 빈 상태를 인정한다」에 따른 의도된 동작입니다.

---

## 5. Before / After 사진

`SOP-009 시공사진 촬영관리`(Drive `12_SOP/`)에 따라 착공 전·완공 후 사진이 쌓이면 추가합니다.

```ts
beforeAfter: [
  { beforeSlug: "프로젝트_before_출입구_01", afterSlug: "프로젝트_after_출입구_01", caption: "출입구 — 시공 전과 후" },
],
```

생략하면 해당 영역이 자동으로 숨겨지므로, 사진이 준비된 프로젝트부터 하나씩 채우면 됩니다.

---

## 6. 향후 재사용

`projectId` · `clientType` · `status` · `services` · `completedAt`은 아래에서 같은 값으로 재사용하도록 설계했습니다.

- **ERP**: 프로젝트 진행 상태·서비스 범위 집계
- **09_성공사례DB**: `projectId`로 사례 문서와 1:1 대조
- **AI 상담**: `clientType`이 상담 태그(교회카페·카페 등)와 같은 축이라 성공사례 자동 추천에 그대로 사용
- **CRM**: 상담 리드 ↔ 성사된 프로젝트 연결
