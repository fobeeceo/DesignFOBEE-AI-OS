# GBRICK AI VOICE ORDER — 로드맵

> 원칙: 작게 만들고 실제 매장에서 검증한다. 매장 수가 아니라 **성공률**로 다음 단계에 간다(CLAUDE.md §0 원칙 4).
> 각 단계의 넘어가는 기준 숫자는 대표가 정한다. 비용·계약·DNS가 생기는 단계는 승인 대상.

| Phase | 이름 | 내용 | 상태 | 다음으로 가는 기준 |
|---|---|---|---|---|
| 1 | Voice Order MVP | 음성·텍스트 주문 분석, 확인 질문, 메뉴판 54종, 메뉴 지식 문서, 웹 체험판(fobee.co.kr/gbrick-order) | ✅ 완료 (2026-10-03) | — |
| 2 | 본점 실제 운영 | STORE MODE v0.2: 태블릿 → 매장 PC 주문 서버 → 카운터 → 주문서 → 기존 POS 결제. TEST → (승인) → PRODUCTION | 🔧 구현 완료, 매장 설치·TEST 운영 대기 | 무중단 운영 기간·주문 완료율·직원 도움 비율 (대표 확정) |
| 3 | 주문 데이터 분석 | VOICE_LOG·답 못 한 질문·KPI로 지식 문서·메뉴 별칭 보강, 주간 리포트 | 대기 | 메뉴 인식 실패율 감소 추세 |
| 4 | POS 연동 | 주문을 POS에 자동 등록 (POS 업체 API·계약 확인 선행) | 대기 · 대표 결정 | POS 이중 입력 0 |
| 5 | 결제 | 태블릿 결제(PG/VAN) — 법·보안·정산 검토 선행 | 대기 · 승인 대상 | — |
| 6 | 프랜차이즈 | 클라우드 주문 서버(DB: Supabase 재개·마이그레이션 승인) + 매장별 store_id·품절 관리. 시범 가맹점 1~2곳 | 대기 · 승인 대상 | 시범점 완료율이 본점과 비슷 |
| 7 | 본사 Dashboard | 매장별 주문·KPI 비교, 지식 문서 본사 일괄 관리 | 대기 | — |
| 8 | AI Store OS | GBRICK AI OS 편입: MENU_MASTER → VOICE ORDER → ORDER → POS → SALES → KPI → JARVIS | 대기 | — |
| 9 | FOBEE AI ORDER SaaS | 다른 카페·식당으로 확장 (store_id·메뉴 데이터 교체만으로 동작하는 구조) | 대기 | — |

## 확장을 위해 이미 해 둔 것

- 모든 주문·요청에 `store_id` (지금은 `GBRICK_MAIN` 하나 — 다른 매장은 실제 정보 확인 후 `data/stores.json`에 추가)
- 표준 데이터 이름 ORDER / ORDER_ITEM / ORDER_EVENT / VOICE_LOG / HELP_REQUEST
- 저장소를 바꿀 수 있는 구조(`createJsonDb` → 향후 DB 어댑터), 프린터 어댑터 자리(`printService.mjs`)
- 메뉴 정본 한 곳(`data/menu.json` → 향후 MENU_MASTER)
