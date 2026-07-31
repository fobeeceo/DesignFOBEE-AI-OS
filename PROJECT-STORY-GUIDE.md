# 프로젝트 스토리 입력 가이드

대표님이 스토리를 주시면 **파일 한 개만 수정**하면 홈페이지·포트폴리오·상세 페이지·SEO가 전부 자동으로 연결됩니다.

수정 대상: `lib/projects/stories.ts` 의 `PROJECT_STORIES` 배열

---

## 1. 대표님이 준비해 주실 내용

프로젝트 한 건당 아래 항목을 알려주시면 됩니다. **실제로 있었던 일만** 적습니다(추측·각색 금지).

| 항목 | 설명 | 예시 |
|---|---|---|
| 프로젝트명 | 매장·현장 이름 | GBRICK Coffee 은평본점 |
| 분야 | 카페 / 교회 / 리테일 / 오피스 / 상업공간 중 하나 | 카페 |
| 위치 | 시·구 단위 | 서울 은평구 |
| 완공 연도 | 4자리 | 2013 |
| 한 줄 요약 | 홈 카드에 나갈 문장(80자 이내) | 공간 자체가 브랜드가 되는 매장 모델을 직접 검증한 1호점 |
| **과제** | 어떤 문제·조건이 있었는지 | 예: 예배 일정을 멈출 수 없어 공정을 나눠야 했다 |
| **해결 방법** | 그래서 어떻게 했는지 | 예: 주중 야간에만 철거를 진행하고 주말 전 원상 복구 |
| **결과** | 무엇이 달라졌는지 | 예: 예배 중단 없이 6주 만에 완공 |

사진은 이미 홈페이지에 올라간 것을 쓰면 되고, 없으면 대표 사진 한 장만 알려주셔도 됩니다.

**말로 하셔도 됩니다.** 현장 이야기를 그대로 들려주시면 제가 위 형식으로 정리해 확인받고 넣겠습니다.

---

## 2. 입력 방법 (개발자용)

`lib/projects/stories.ts` 에서 빈 배열을 채웁니다.

```ts
export const PROJECT_STORIES: ProjectStory[] = [
  {
    slug: "gbrick-eunpyeong",              // URL → /projects/gbrick-eunpyeong
    title: "GBRICK Coffee 은평본점",
    category: "카페",                       // 포트폴리오 카테고리와 같게 쓰면 자동 연결
    location: "서울 은평구",
    year: "2013",
    summary: "공간 자체가 브랜드가 되는 매장 모델을 직접 검증한 1호점",
    coverSlug: "designfobee-gbrick-storefront-night-01",

    challenge: "...",   // 과제
    approach: "...",    // 해결 방법
    result: "...",      // 결과

    gallerySlugs: ["designfobee-cafe-counter-shelving-01"],  // 선택
    keywords: ["은평구 카페 인테리어"],                        // 선택
  },
];
```

### 규칙
- `slug`: 영문 소문자·숫자·하이픈만. 한 번 정하면 바꾸지 않습니다(URL이 바뀌면 검색 순위가 초기화됨).
- `coverSlug` / `gallerySlugs`: `public/images/portfolio/website/` 안의 파일명에서 `.webp`를 뺀 값.
- `category`: 포트폴리오 카테고리 앞부분과 같은 값을 쓰면 사진과 스토리가 자동으로 이어집니다.

---

## 3. 저장하면 자동으로 되는 일

파일 한 곳만 고쳤는데 아래가 전부 따라옵니다. **다른 파일은 건드리지 않습니다.**

| 연결 대상 | 동작 |
|---|---|
| 홈페이지 요약 | `StoriesSection`이 최신 3건을 카드로 노출 (현재는 0건이라 섹션 자체가 숨겨짐) |
| 상세 페이지 | `/projects/[slug]` 자동 생성 (과제 → 해결 → 결과 → Before/After → 갤러리) |
| SEO 메타데이터 | title·description·keywords·canonical·OG 이미지 자동 생성 |
| 구조화 데이터 | 검색엔진용 JSON-LD(CreativeWork) 자동 삽입 |
| sitemap.xml | `/projects/[slug]` 자동 등록 |
| 포트폴리오 | 같은 분야 사진에서 스토리로 연결 가능 |

---

## 4. 지금 비어 있는 이유

실제 스토리 자료를 받기 전이라 `PROJECT_STORIES`는 **의도적으로 빈 배열**입니다.

- 홈 스토리 섹션: 자동으로 **숨김** (빈 카드·"준비 중" 문구 노출 안 함)
- `/projects/*`: 전부 **404** (빈 껍데기 페이지 생성 안 함)
- sitemap: 스토리 URL **미포함**

이는 CLAUDE.md §14-A ②「실제 자료가 없으면 AI가 생성하지 않는다. 빈 상태를 인정한다」에 따른 의도된 동작입니다.

---

## 5. Before / After 사진

`SOP-009 시공사진 촬영관리`(Drive `12_SOP/`)에 따라 착공 전·완공 후 사진이 쌓이면 아래를 추가합니다.

```ts
beforeAfter: [
  {
    beforeSlug: "프로젝트_before_출입구_01",
    afterSlug: "프로젝트_after_출입구_01",
    caption: "출입구 — 시공 전과 후",
  },
],
```

생략하면 해당 영역이 자동으로 숨겨지므로, 사진이 준비된 프로젝트부터 하나씩 채우면 됩니다.
