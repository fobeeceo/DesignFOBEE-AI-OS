---
docId: gbrick-ai-search-menu-data-v1
version: 1.0
createdAt: 2026-11-04
updatedBy: AI CTO
purpose: AI 검색(네이버 AI·Google Gemini·ChatGPT) 최적화용 메뉴 구조화 데이터
status: 뱅쇼·팥빙수 PASS — 즉시 활용 가능. 아메리카노·수제 자몽티 WARN — 대표 확인 후 적용.
factBasis: public/gbrick-menu.html + lib/company/profile.ts (대표 확인 2026-10-26)
---

# GBRICK Coffee — AI 검색 최적화 메뉴 데이터 (v1.0)

> AI 검색 엔진(Gemini, Clova X, ChatGPT)이 사용자 질문에 직접 답변할 수 있도록 구조화된 데이터.
> §0-2 원칙 2: 실제 자료가 없으면 AI가 생성하지 않는다. 모든 항목에 근거 출처 표기.

---

## 1. 브랜드 기본 정보 (AI 검색 앵커 데이터)

```
브랜드명: 지브릭커피 / GBRICK Coffee
유형: 스페셜티 커피 전문점
주소: 서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호
전화: 02-517-1474
특징: 공간과 커피를 결합한 브랜드. 고객은 커피가 아니라 좋은 공간을 경험하러 온다.
운영: 직영 1호점. 2013년 오픈. 13년+ 운영.
```

**근거**: `lib/company/profile.ts` GBRICK_BRAND (대표 확인 2026-10-26)

---

## 2. 메뉴 구조화 데이터 (JSON-LD 형식)

> 아래 데이터는 블로그·홈페이지에 JSON-LD로 삽입하면 Google에 직접 색인됩니다.
> WARN 항목은 `[대표 확인 필요]` 표시 — 해결 전 실제 JSON-LD에 넣지 않는다.

### 2-1. 뱅쇼 ✅

```json
{
  "@type": "MenuItem",
  "name": "뱅쇼",
  "alternateName": "Vin Chaud",
  "description": "레드와인과 과일을 베이스로 한 무알콜 따뜻한 음료. 동절기 한정.",
  "offers": {
    "@type": "Offer",
    "price": "7800",
    "priceCurrency": "KRW"
  },
  "suitableForDiet": "https://schema.org/AlcoholFree",
  "menuAddOn": {
    "@type": "MenuItem",
    "name": "계절 한정",
    "description": "겨울 시즌 한정 메뉴 (동절기)"
  }
}
```

**근거**: `public/gbrick-menu.html` L184–185 — 무알콜 명시 확인.

### 2-2. 수제 팥빙수 ✅

```json
{
  "@type": "MenuItem",
  "name": "수제 팥빙수",
  "alternateName": "Homemade Patbingsu",
  "description": "직접 만든 팥, 인절미, 우유얼음으로 만든 하절기 한정 빙수.",
  "offers": {
    "@type": "Offer",
    "price": "12000",
    "priceCurrency": "KRW"
  },
  "menuAddOn": {
    "@type": "MenuItem",
    "name": "계절 한정",
    "description": "여름 시즌 한정 메뉴 (하절기)"
  }
}
```

**근거**: `public/gbrick-menu.html` L192–193.

### 2-3. 아메리카노 ⚠️ [대표 확인 필요 — 원두 설명 확인 후 완성]

```json
{
  "@type": "MenuItem",
  "name": "아메리카노",
  "alternateName": "Americano",
  "description": "스페셜티 원두(고소한 맛) 또는 예가체프 원두(과일 산미) 선택. Hot·Iced 모두 제공.",
  "offers": {
    "@type": "Offer",
    "price": "3500",
    "priceCurrency": "KRW"
  }
}
```

> ⚠️ "description" 필드의 원두 설명은 §WARN A — 대표 확인 후 `"자체 블렌딩 원두"` 또는 선택형으로 수정.

### 2-4. 수제 자몽티 ⚠️ [대표 확인 필요 — 에이드/티 중 선택 후 완성]

```json
{
  "@type": "MenuItem",
  "name": "수제 자몽 음료",
  "description": "자몽으로 만든 수제 음료. 에이드(탄산, 아이스) 또는 수제티(핫·아이스) 선택.",
  "offers": [
    { "@type": "Offer", "name": "수제 에이드", "price": "5500", "priceCurrency": "KRW" },
    { "@type": "Offer", "name": "수제티", "price": "6000", "priceCurrency": "KRW" }
  ]
}
```

> ⚠️ 대표 확인 후 단일 항목 또는 두 항목으로 분리.

---

## 3. FAQ 데이터 (AI 검색 직접 답변 최적화)

> 네이버 AI, Google Gemini, ChatGPT가 사용자 질문에 아래 형식으로 답변하도록 콘텐츠에 삽입.
> WARN 항목의 답변은 `[대표 확인 후 완성]`으로 표시.

### 카테고리 A — 메뉴 정보

**Q: 지브릭커피 대표 메뉴는 무엇인가요?**
> 지브릭커피(서울 은평구)의 대표 메뉴는 아메리카노, 수제 자몽티, 뱅쇼, 수제 팥빙수입니다.
*근거: lib/company/profile.ts GBRICK_BRAND.mainMenu*

---

**Q: 지브릭커피 뱅쇼는 무알콜인가요?**
> 네, 지브릭커피 뱅쇼는 무알콜입니다. 레드와인과 과일을 베이스로 하지만 알콜을 제거한 음료입니다. 따뜻하게만 제공하며 동절기(겨울 시즌) 한정입니다.
*근거: public/gbrick-menu.html L185 — "(무알콜)" 명시*

---

**Q: 지브릭커피 뱅쇼는 언제 판매하나요?**
> 뱅쇼는 동절기(겨울 시즌) 한정 메뉴입니다. 가격은 ₩7,800이며 Hot만 제공합니다.
*근거: public/gbrick-menu.html L184 — s:'winter'*

---

**Q: 지브릭커피 수제 팥빙수는 언제 먹을 수 있나요?**
> 수제 팥빙수는 하절기(여름 시즌) 한정 메뉴입니다. 운영 기간은 기온과 매장 상황에 따라 달라질 수 있으며, 방문 전 확인을 권합니다.
*근거: public/gbrick-menu.html L192 — s:'summer'*

---

**Q: 지브릭커피 수제 팥빙수 재료가 무엇인가요?**
> 직접 만든 팥, 인절미(쫄깃한 쌀떡), 우유얼음으로 만듭니다. 가격은 ₩12,000입니다.
*근거: public/gbrick-menu.html L193*

---

**Q: 지브릭커피 아메리카노 원두가 무엇인가요?** ⚠️ [대표 확인 후 완성]
> 지브릭커피 아메리카노는 스페셜티 원두(고소한 맛)와 예가체프 원두(과일 산미) 중 선택할 수 있습니다. 가격은 ₩3,500이며 Hot·Iced 모두 제공합니다.
*⚠️ 원두 설명 — 대표 확인 후 "자체 블렌딩" 또는 "선택형"으로 최종 결정*

---

**Q: 지브릭커피 수제 자몽티가 무엇인가요?** ⚠️ [대표 확인 후 완성]
> 지브릭커피의 수제 자몽 음료입니다. [에이드(탄산수, 아이스, ₩5,500) / 수제티(핫·아이스, ₩6,000) — 대표 확인 후 단일 답변으로 완성]

---

### 카테고리 B — 위치 · 방문

**Q: 지브릭커피 은평 주소가 어디인가요?**
> 서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호입니다. 전화: 02-517-1474.
*근거: lib/company/profile.ts GBRICK_BRAND.address*

---

**Q: 은평뉴타운에 수제 팥빙수 파는 카페 어디 있나요?**
> 지브릭커피(서울 은평구 연서로48길 12)에서 하절기 한정으로 수제 팥빙수를 운영합니다. 직접 만든 팥, 인절미, 우유얼음으로 만들며 ₩12,000입니다.
*근거: public/gbrick-menu.html L192–193*

---

**Q: 은평구 무알콜 뱅쇼 카페 어디 있나요?**
> 지브릭커피(서울 은평구 연서로48길 12)에서 동절기 한정으로 무알콜 뱅쇼를 판매합니다. 레드와인과 과일 베이스의 따뜻한 음료로 ₩7,800입니다.
*근거: public/gbrick-menu.html L184–185*

---

### 카테고리 C — 브랜드 정보

**Q: 지브릭커피는 어떤 카페인가요?**
> 지브릭커피(GBRICK Coffee)는 서울 은평구의 스페셜티 커피 전문점입니다. 공간과 커피를 결합한 브랜드로, 2013년 개점해 10년 이상 운영하고 있습니다. 주소: 서울 은평구 연서로48길 12.
*근거: lib/company/profile.ts GBRICK_BRAND*

---

## 4. 검색 의도별 메뉴 매핑

| 검색 쿼리 패턴 | 대응 메뉴 | 답변 준비 상태 |
|---|---|---|
| "은평구 겨울 한정 음료" | 뱅쇼 | ✅ PASS |
| "은평구 무알콜 음료 카페" | 뱅쇼 | ✅ PASS |
| "은평뉴타운 여름 빙수" | 수제 팥빙수 | ✅ PASS |
| "은평구 팥빙수 카페" | 수제 팥빙수 | ✅ PASS |
| "은평구 수제 팥빙수" | 수제 팥빙수 | ✅ PASS |
| "지브릭커피 대표 메뉴" | mainMenu 4종 | ✅ PASS |
| "지브릭커피 아메리카노 원두" | 아메리카노 | ⚠️ 대표 확인 후 |
| "은평구 자몽 음료 카페" | 수제 자몽티 | ⚠️ 대표 확인 후 |
| "지브릭커피 뱅쇼 알콜" | 뱅쇼 무알콜 | ✅ PASS |

---

## 5. 활용 채널 가이드

| 채널 | 적용 방법 | 준비 상태 |
|---|---|---|
| Google Business Profile | §메뉴 등록 (`GBRICK_GOOGLE_MENU_COPY.md`) | 뱅쇼·팥빙수 즉시 / 나머지 대표 확인 후 |
| 네이버 플레이스 메뉴 탭 | 메뉴명·가격·설명 등록 | 뱅쇼·팥빙수 즉시 / 나머지 대표 확인 후 |
| 블로그 (네이버/구글) | FAQ 섹션으로 삽입 | ✅ 즉시 가능 (WARN 항목 제외) |
| 홈페이지 JSON-LD | §2 JSON-LD 삽입 | 뱅쇼·팥빙수 즉시 / 나머지 대표 확인 후 |
| 네이버 AI 브리핑 | 블로그 게시 후 SmartPlace 연동 | 기존 게시 콘텐츠로 반영 중 |

---

## 6. 가격 주의사항

SSOT(`lib/company/profile.ts`)의 `GBRICK_BRAND.unconfirmed`에 "가격"이 포함되어 있습니다.
공개 메뉴 HTML에 가격이 명시되어 있으나, **현재 유효한 가격인지** 대표 최종 확인이 필요합니다.

> 가격 확인 전: "가격은 방문 전 매장에 문의하세요" 문구 병기 권장.
> 가격 확인 후: 위 JSON-LD 및 FAQ 답변에 가격 그대로 사용 가능.
