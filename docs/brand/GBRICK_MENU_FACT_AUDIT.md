---
docId: gbrick-menu-fact-audit-v2
version: 2.0
createdAt: 2026-11-04
updatedAt: 2026-11-04
updatedBy: AI CTO
purpose: 메뉴 정보 사실 검증 — Google Business Profile 등록 및 AI 검색 최적화 준비
scope: 6개 확정 메뉴 (Phase 10 대표 결정 반영)
changelog:
  - v1.0 (2026-11-04): Phase 9 초기 감사. 아메리카노·수제 자몽티 WARN.
  - v2.0 (2026-11-04): Phase 10 대표 결정 반영. WARN → PASS. 6개 메뉴로 확장.
---

# GBRICK Coffee 메뉴 팩트 오딧 (v2.0)

> **Phase 10 대표 결정 반영** (2026-11-04)
> - 아메리카노 → 스페셜티 / 예가체프 2종으로 분리 관리
> - 수제 자몽티 → 수제 에이드 자몽 / 수제티 생자몽 2종으로 분리 관리
>
> §0-2 원칙 2: 실제 자료가 없으면 AI가 생성하지 않는다. 모든 판정은 파일 근거 있는 것만.

---

## 1. 조사 소스

| 소스 | 경로 | 역할 |
|---|---|---|
| 공개 메뉴 HTML | `public/gbrick-menu.html` | 고객에게 이미 공개된 사실의 1차 근거 |
| SSOT (브랜드 정보) | `lib/company/profile.ts` → `GBRICK_BRAND` | 대표 확인 2026-10-26 + 2026-11-04 갱신 |
| 브랜드 스타일 가이드 | `content-automation-agent/guides/gbrick-style.md` | 톤·금지 항목 |
| AI 검색 콘텐츠 초안 | `docs/ai-search-business/drafts/gbrick/` | 기존 콘텐츠 맥락 |

조사한 파일 수: **4개** | 확인한 메뉴 수: **6개**

---

## 2. 판정 요약

| # | 메뉴 | 판정 | 가격 | 온도 | 계절 |
|---|---|---|---|---|---|
| 1 | 아메리카노 (스페셜티) | ✅ **PASS** | ₩3,500 | 핫/아이스 | 연중 |
| 2 | 아메리카노 (예가체프) | ✅ **PASS** | ₩3,500 | 핫/아이스 | 연중 |
| 3 | 수제 에이드 자몽 | ✅ **PASS** | ₩5,500 | 아이스만 | 연중 |
| 4 | 수제티 생자몽 | ✅ **PASS** | ₩6,000 | 핫/아이스 | 연중 |
| 5 | 뱅쇼 | ✅ **PASS** | ₩7,800 | 핫만 | 동절기 한정 |
| 6 | 수제 팥빙수 | ✅ **PASS** | ₩12,000 | — | 하절기 한정 |

> **WARN 0건 / FAIL 0건** — Phase 9 WARN 항목 2건(아메리카노 원두, 수제 자몽티 카테고리) 모두 대표 결정으로 해소.

---

## 3. 메뉴별 상세 판정

### 3-1. 아메리카노 (스페셜티) ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 아메리카노 (스페셜티) | gbrick-menu.html L149 |
| 가격 | ₩3,500 | gbrick-menu.html L149 h:3500, i:3500 |
| 제공 온도 | 핫(Hot) + 아이스(Iced) | h, i 모두 있음 |
| 원두 | 스페셜티 원두 (고소한 맛) | gbrick-menu.html L150 |
| 디카페인 옵션 | +₩500 가능 | gbrick-menu.html L197 |
| 리필 | ₩1,500 | gbrick-menu.html L199 |

---

### 3-2. 아메리카노 (예가체프) ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 아메리카노 (예가체프) | gbrick-menu.html L151 |
| 가격 | ₩3,500 | gbrick-menu.html L151 h:3500, i:3500 |
| 제공 온도 | 핫(Hot) + 아이스(Iced) | h, i 모두 있음 |
| 원두 | 이디오피아 예가체프 원두 (과일 산미) | gbrick-menu.html L152 |
| 디카페인 옵션 | +₩500 가능 | gbrick-menu.html L197 |
| 리필 | ₩1,500 | gbrick-menu.html L199 |

---

### 3-3. 수제 에이드 자몽 ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 수제 에이드 (레몬/자몽/오미자/패션후르츠) 중 자몽 선택 | gbrick-menu.html L167 |
| 가격 | ₩5,500 | gbrick-menu.html L167 i:5500 |
| 제공 온도 | 아이스(Iced)만 | i 필드만 있음 |
| 재료 | 직접 만든 수제청 + 후지산 탄산수 + 얼음 | gbrick-menu.html L168 |
| 수제 여부 | 명시: "직접 만든 수제청" | gbrick-menu.html L168 |

---

### 3-4. 수제티 생자몽 ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 수제티 (생자몽/오미자/레몬/유자/진저) 중 생자몽 선택 | gbrick-menu.html L190 |
| 가격 | ₩6,000 | gbrick-menu.html L190 h:6000, i:6000 |
| 제공 온도 | 핫(Hot) + 아이스(Iced) | h, i 모두 있음 |
| 재료 | 생자몽 베이스 (상세 재료 미명시) | gbrick-menu.html L190 |
| 수제 여부 | "수제티" 카테고리 명칭으로 확인 | gbrick-menu.html L190 |

---

### 3-5. 뱅쇼 ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 뱅쇼 (Vin Chaud / Mulled Wine) | gbrick-menu.html L184 |
| 가격 | ₩7,800 | gbrick-menu.html L184 h:7800 |
| 제공 온도 | 핫(Hot)만 | h 필드만 있음 |
| 계절 한정 | 동절기(winter)만 | s:'winter' |
| 재료 | 레드와인 + 과일 | gbrick-menu.html L185 |
| 무알콜 근거 | 공개 메뉴 HTML 명시: "(무알콜)" | gbrick-menu.html L185 |

> 과일 종류는 메뉴에 미명시. 구체적 과일명은 대표 확인 없이 쓰지 않는다.

---

### 3-6. 수제 팥빙수 ✅ PASS

| 항목 | 확인 값 | 근거 |
|---|---|---|
| 메뉴명 | 수제 팥빙수 (Homemade Patbingsu) | gbrick-menu.html L192 |
| 가격 | ₩12,000 | gbrick-menu.html L192 p:12000 |
| 계절 한정 | 하절기(summer)만 | s:'summer' |
| 재료 | 직접 만든 팥 + 인절미 + 우유얼음 | gbrick-menu.html L193 |

> SSOT의 `patbingsu.basis: "주간 기온 28℃ 이상"`, `typicalMonths: "4~9월경"` — 고객용 공개 설명 불가. 내부 운영 메모 수준.

---

## 4. SSOT 갱신 현황 (Phase 10)

`lib/company/profile.ts` 2026-11-04 사실 정정:

| 필드 | 이전 값 | 갱신 후 값 |
|---|---|---|
| `beans` | `"자체 블렌딩 원두"` | `"스페셜티 원두 (고소한 맛) / 예가체프 원두 (과일 산미) — 선택"` |
| `mainMenu` | 4개 (아메리카노, 수제 자몽티, 뱅쇼, 수제 팥빙수) | 6개 (각 2종으로 분리) |

> 기존 published 콘텐츠(Naver Blog, Google Blogger 게시글)는 "자체 블렌딩 원두" 표기 그대로 — 게시된 콘텐츠는 별도 수정 프로세스 필요. 현재 범위에서 변경하지 않음.

---

## 5. 잔여 미확인 항목

| # | 항목 | 상태 | 비고 |
|---|---|---|---|
| **C** | 가격 현재 유효 여부 | ⚠️ WARN | 공개 메뉴 HTML에 가격 있으나 SSOT `unconfirmed: ["가격"]` — 현행 가격 대표 최종 확인 필요 |

> **대표 확인 1건만 남음.** 가격이 현재도 유효하다면 Google/네이버 플레이스 메뉴 가격 필드에 즉시 등록 가능.

---

## 6. 기존 데이터 변경·삭제 현황

| 파일 | 변경 여부 | 비고 |
|---|---|---|
| `public/gbrick-menu.html` | 변경 없음 | 공개 메뉴 HTML 원본 유지 |
| `lib/company/profile.ts` | **갱신** (beans, mainMenu) | 사실 정정 — 삭제 없이 값만 수정 |
| `docs/ai-search-business/drafts/` | 변경 없음 | 게시 완료 콘텐츠 — 별도 수정 프로세스 필요 |
| `docs/brand/` 3개 파일 | **갱신** | Phase 10 반영 |

외부 플랫폼 수정: **없음**
