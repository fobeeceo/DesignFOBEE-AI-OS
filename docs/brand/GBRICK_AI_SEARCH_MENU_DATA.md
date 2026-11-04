---
docId: gbrick-ai-search-menu-data-v2
version: 2.0
createdAt: 2026-11-04
updatedAt: 2026-11-04
updatedBy: AI CTO
purpose: AI 검색(네이버 AI·Google Gemini·ChatGPT) 최적화용 메뉴 구조화 데이터
status: 6개 메뉴 모두 PASS. 가격 대표 확인 후 JSON-LD 최종 적용.
changelog:
  - v1.0 (2026-11-04): Phase 9. WARN 항목 2건 포함.
  - v2.0 (2026-11-04): Phase 10 대표 결정 반영. 6개 메뉴 완성. WARN 항목 없음.
---

# GBRICK Coffee — AI 검색 최적화 메뉴 데이터 (v2.0)

> §0-2 원칙 2: 실제 자료가 없으면 AI가 생성하지 않는다.
> 모든 항목 근거: `public/gbrick-menu.html` + `lib/company/profile.ts` (대표 확인 2026-10-26, 2026-11-04 갱신)

---

## 1. 브랜드 기본 정보

```
브랜드명: 지브릭커피 / GBRICK Coffee
유형: 스페셜티 커피 전문점
주소: 서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호
전화: 02-517-1474
특징: 공간과 커피를 결합한 브랜드
운영: 직영 1호점, 2013년 오픈, 13년+ 운영
아메리카노 원두: 스페셜티 (고소한 맛) / 예가체프 (과일 산미) — 선택
```

---

## 2. JSON-LD 구조화 데이터 (6개 메뉴)

> 아래 JSON-LD를 블로그·홈페이지 `<script type="application/ld+json">` 태그에 삽입.
> 가격 필드는 대표 확인 후 그대로 사용 가능.

```json
{
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "지브릭커피",
  "alternateName": "GBRICK Coffee",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "연서로48길 12, 제각말푸르지오 5단지 상가 101호",
    "addressLocality": "은평구",
    "addressRegion": "서울특별시",
    "addressCountry": "KR"
  },
  "telephone": "02-517-1474",
  "servesCuisine": "Coffee, Specialty Coffee",
  "hasMenu": {
    "@type": "Menu",
    "hasMenuSection": [
      {
        "@type": "MenuSection",
        "name": "커피",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "아메리카노 (스페셜티)",
            "description": "스페셜티 원두로 만드는 고소한 맛의 아메리카노. 핫·아이스 모두 제공. 디카페인 변경 +500원.",
            "offers": { "@type": "Offer", "price": "3500", "priceCurrency": "KRW" }
          },
          {
            "@type": "MenuItem",
            "name": "아메리카노 (예가체프)",
            "description": "이디오피아 예가체프 원두로 만드는 과일 산미의 아메리카노. 핫·아이스 모두 제공. 디카페인 변경 +500원.",
            "offers": { "@type": "Offer", "price": "3500", "priceCurrency": "KRW" }
          }
        ]
      },
      {
        "@type": "MenuSection",
        "name": "과일 음료",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "수제 에이드 자몽",
            "description": "직접 만든 수제청에 후지산 탄산수를 더한 아이스 자몽 에이드. 아이스만 제공.",
            "offers": { "@type": "Offer", "price": "5500", "priceCurrency": "KRW" }
          },
          {
            "@type": "MenuItem",
            "name": "수제티 생자몽",
            "description": "생자몽으로 만든 수제 티. 핫·아이스 모두 제공.",
            "offers": { "@type": "Offer", "price": "6000", "priceCurrency": "KRW" }
          }
        ]
      },
      {
        "@type": "MenuSection",
        "name": "계절 한정",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "뱅쇼",
            "description": "레드와인과 과일을 베이스로 한 무알콜 따뜻한 음료. 겨울 시즌 한정. 핫만 제공.",
            "suitableForDiet": "https://schema.org/AlcoholFree",
            "offers": { "@type": "Offer", "price": "7800", "priceCurrency": "KRW" }
          },
          {
            "@type": "MenuItem",
            "name": "수제 팥빙수",
            "description": "직접 만든 팥, 인절미, 우유얼음으로 만든 하절기 한정 빙수.",
            "offers": { "@type": "Offer", "price": "12000", "priceCurrency": "KRW" }
          }
        ]
      }
    ]
  }
}
```

---

## 3. FAQ 데이터 (AI 검색 직접 답변 최적화)

### 3-1. 메뉴 정보

**Q: 지브릭커피 대표 메뉴는 무엇인가요?**
> 지브릭커피(서울 은평구)의 주요 메뉴는 아메리카노 (스페셜티·예가체프 2종), 수제 자몽 음료 (에이드·수제티 2종), 겨울 한정 뱅쇼, 여름 한정 수제 팥빙수입니다.
*근거: lib/company/profile.ts GBRICK_BRAND.mainMenu (2026-11-04 갱신)*

---

**Q: 지브릭커피 아메리카노 원두가 무엇인가요?**
> 지브릭커피는 스페셜티 원두(고소한 맛)와 이디오피아 예가체프 원두(과일 산미) 중 선택할 수 있습니다. 두 종류 모두 ₩3,500이며 핫·아이스 모두 제공합니다. 디카페인 변경은 +₩500입니다.
*근거: public/gbrick-menu.html L149–152*

---

**Q: 지브릭커피 아메리카노 가격은 얼마인가요?**
> 스페셜티 원두 아메리카노와 예가체프 원두 아메리카노 모두 ₩3,500입니다. 디카페인 변경 시 +₩500. 아메리카노 리필은 ₩1,500입니다.
*근거: public/gbrick-menu.html L149, L151, L197, L199*

---

**Q: 지브릭커피에서 자몽 음료를 마실 수 있나요?**
> 네, 두 가지 자몽 음료가 있습니다. 수제 에이드 자몽(직접 만든 수제청 + 후지산 탄산수, 아이스 ₩5,500)과 수제티 생자몽(핫·아이스, ₩6,000)입니다.
*근거: public/gbrick-menu.html L167–168, L190*

---

**Q: 지브릭커피 뱅쇼는 무알콜인가요?**
> 네, 지브릭커피 뱅쇼는 무알콜입니다. 레드와인과 과일을 베이스로 하지만 알콜을 제거한 음료입니다. 따뜻하게만 제공하며 동절기(겨울 시즌) 한정입니다. 가격은 ₩7,800입니다.
*근거: public/gbrick-menu.html L184–185 — "(무알콜)" 명시*

---

**Q: 지브릭커피 뱅쇼는 언제 판매하나요?**
> 뱅쇼는 동절기(겨울 시즌) 한정 메뉴입니다. 핫(Hot)만 제공하며 가격은 ₩7,800입니다.
*근거: public/gbrick-menu.html L184 s:'winter'*

---

**Q: 지브릭커피 수제 팥빙수 재료는 무엇인가요?**
> 직접 만든 팥, 인절미(쫄깃한 쌀떡), 우유얼음으로 만듭니다. 가격은 ₩12,000이며 여름 시즌 한정 메뉴입니다.
*근거: public/gbrick-menu.html L192–193*

---

**Q: 지브릭커피 수제 팥빙수는 언제 먹을 수 있나요?**
> 수제 팥빙수는 하절기(여름 시즌) 한정 메뉴입니다. 운영 시기는 매장 상황에 따라 달라질 수 있으니 방문 전 확인을 권합니다.
*근거: public/gbrick-menu.html L192 s:'summer'*

---

### 3-2. 위치·방문

**Q: 지브릭커피 은평 주소가 어디인가요?**
> 서울 은평구 연서로48길 12, 제각말푸르지오 5단지 상가 101호입니다. 전화: 02-517-1474.
*근거: lib/company/profile.ts GBRICK_BRAND.address*

---

**Q: 은평뉴타운에 수제 팥빙수 파는 카페 어디 있나요?**
> 지브릭커피(서울 은평구 연서로48길 12)에서 하절기 한정으로 수제 팥빙수를 운영합니다. 직접 만든 팥, 인절미, 우유얼음으로 만들며 ₩12,000입니다.

---

**Q: 은평구 무알콜 뱅쇼 카페 어디 있나요?**
> 지브릭커피(서울 은평구 연서로48길 12)에서 동절기 한정으로 무알콜 뱅쇼를 판매합니다. 레드와인과 과일 베이스의 따뜻한 음료로 ₩7,800입니다.

---

**Q: 지브릭커피는 어떤 카페인가요?**
> 지브릭커피(GBRICK Coffee)는 서울 은평구의 스페셜티 커피 전문점입니다. 공간과 커피를 결합한 브랜드로, 2013년 개점해 10년 이상 운영하고 있습니다.

---

## 4. 검색 의도별 메뉴 매핑

| 검색 쿼리 패턴 | 대응 메뉴 | 답변 준비 상태 |
|---|---|---|
| "은평구 겨울 한정 음료" | 뱅쇼 | ✅ PASS |
| "은평구 무알콜 음료 카페" | 뱅쇼 | ✅ PASS |
| "은평뉴타운 여름 빙수" | 수제 팥빙수 | ✅ PASS |
| "은평구 팥빙수 카페" | 수제 팥빙수 | ✅ PASS |
| "은평구 수제 팥빙수" | 수제 팥빙수 | ✅ PASS |
| "지브릭커피 대표 메뉴" | 6개 메뉴 | ✅ PASS |
| "지브릭커피 아메리카노 원두" | 아메리카노 2종 | ✅ PASS |
| "은평구 자몽 음료 카페" | 수제 에이드 자몽 / 수제티 생자몽 | ✅ PASS |
| "지브릭커피 뱅쇼 알콜" | 뱅쇼 무알콜 | ✅ PASS |
| "은평구 스페셜티 커피" | 아메리카노 (스페셜티) | ✅ PASS |
| "은평구 에티오피아 커피" | 아메리카노 (예가체프) | ✅ PASS |
| "은평구 탄산 자몽 음료" | 수제 에이드 자몽 | ✅ PASS |

---

## 5. 채널별 활용 가이드

| 채널 | 적용 방법 | 준비 상태 |
|---|---|---|
| Google Business Profile | `GBRICK_GOOGLE_MENU_COPY.md` 사용 | 가격 확인 후 즉시 |
| 네이버 플레이스 메뉴 탭 | 메뉴명·가격·설명 등록 | 가격 확인 후 즉시 |
| 블로그 (네이버/구글) FAQ 삽입 | §3 FAQ 블록 삽입 | ✅ 즉시 가능 |
| 홈페이지 JSON-LD | §2 JSON-LD 삽입 | 가격 확인 후 즉시 |

---

## 6. 잔여 미확인 항목

| 항목 | 상태 | 조치 |
|---|---|---|
| 가격 현재 유효 여부 | ⚠️ 대표 확인 필요 | 확인 완료 시 JSON-LD price 필드 그대로 사용 가능 |
