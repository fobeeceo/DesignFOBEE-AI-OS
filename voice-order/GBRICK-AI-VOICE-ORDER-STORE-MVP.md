# GBRICK AI VOICE ORDER — 본점 실매장 파일럿 (STORE MODE v0.2)

> 대표 지시서 「본점 실매장 파일럿 구축 지시서 v0.2 FINAL」(2026-10-03) 구현 문서.
> 저장소 정책상 `docs/`는 git에서 제외되므로(내부 민감 문서용) 이 문서는 `voice-order/`에 둔다.

## 1. 목적

키오스크를 어려워하는 손님이 직원에게 말하듯 주문하면 AI가 듣고 → 이해하고 → 확인하고 → 주문을 카운터로 전달한다.
결제는 기존 POS. 이번 단계의 성공 기준은 **본점에서 아래 흐름이 실패 없이 도는 것**이다.

```
손님이 말한다 → AI가 이해 → (필요하면 질문) → 손님 확인 → 주문번호 → 카운터 표시 → 주문서 출력 → 직원 제조 → 기존 POS 결제 → 완료
```

## 2. 시스템 구조

```
[손님 태블릿]  https://<매장PC>:3443/store/GBRICK_MAIN
      │  (매장 Wi-Fi)
      ▼
[매장 PC · voice-order/server.mjs]  ── 주문 서버 (Node, 의존성 없음)
      │   data/store-orders.<모드>.json   ORDER · ORDER_EVENT · VOICE_LOG · HELP_REQUEST
      │   data/store-sessions.<모드>.json 대화 세션(주문 전 단계)
      ▼
[카운터 화면]  http://localhost:3100/counter/GBRICK_MAIN  → 브라우저 인쇄 → 주문서
```

| 파일 | 역할 |
|---|---|
| `backend/storeOrders.mjs` | 주문 생성·주문번호·상태·도움 요청·KPI |
| `backend/storeRouter.mjs` | `/api/store/:storeId/...` 경로표 (손님용 / 직원용 구분) |
| `backend/orderService.mjs` | 기존 대화 엔진(세션·분석·가격) — DEMO와 공유 |
| `core/` | 주문 분석·확인 질문·메뉴 지식 (DEMO·웹 체험판과 공유) |
| `frontend/index.html`·`app.js` | 손님 화면 (DEMO와 같은 화면, `data-mode="store"`일 때 매장 동작) |
| `frontend/counter.*` | 카운터 화면 |
| `data/stores.json` | 매장 목록 (현재 `GBRICK_MAIN` 하나) |

**왜 fobee.co.kr이 아니라 매장 PC인가**: 홈페이지(Vercel)에서 주문을 받으려면 DB가 필요한데, 저장소 기록상
Supabase가 일시정지·미확인 상태이고 새 테이블은 마이그레이션(승인 대상)이 필요하다. 확인할 수 없는 저장소에
실제 주문을 맡기면 주문 유실 위험이 있어, 이미 검증된 매장 PC 서버로 파일럿을 한다. 클라우드 이전은 Phase 6(로드맵).

## 3. 고객 주문 흐름

1. 손님이 🎤 주문 시작 → "듣고 있습니다."
2. 말한 내용을 메뉴 데이터 안에서만 해석. 온도·메뉴가 불확실하면 **추측하지 않고 묻는다** ("카페라떼는 따뜻한 것과 차가운 것 중 어떤 걸로 드릴까요?")
3. 주문 확인 화면: 메뉴·수량·합계 + 음성 "따뜻한 아메리카노 한 잔 맞으실까요? 총 3,500원입니다."
   버튼: [네, 맞아요] [다시 말할게요] [주문 취소] + 하단 [직원에게 도움 요청]
4. "네" → 서버에 주문 저장 → **저장이 확인된 뒤에만** "주문이 완료되었습니다. 주문번호 A001. 카운터에서 결제해주세요."
5. 저장 실패 → "주문이 아직 접수되지 않았습니다. 직원에게 말씀해 주세요." + [다시 보내기] (같은 키라 중복 없음)

## 4. Store Mode

- 주소: `/store/GBRICK_MAIN` (손님 태블릿) · `/counter/GBRICK_MAIN` (카운터). 매장 ID는 주소로 고정 — 손님이 매장을 고르지 않는다.
- 매장명: `GBRICK Coffee 본점` (`data/stores.json`)
- 화면 위에 서버 연결 상태 🟢/🔴. 끊기면 주문 시작 버튼이 잠기고 "지금은 주문을 받을 수 없어요. 직원에게 말씀해 주세요."

## 5. Demo Mode (보존)

| 주소 | 내용 | 바뀐 것 |
|---|---|---|
| `https://www.fobee.co.kr/gbrick-order` | 웹 체험판 (매장에 전달 안 됨) | 없음 (브라우저 시험 8단계 PASS) |
| 매장 PC `http://localhost:3100/` | 기존 MVP 데모 화면 | 없음 (기존 21단계 PASS) |

STORE 주문과 DEMO 주문은 **다른 파일·다른 서비스**에 저장된다(테스트로 확인).

## 6. 메뉴 데이터

- 정본: `data/menu.json` (54종, 대표 승인 메뉴판 `public/gbrick-menu.html` 2026-10-01과 1:1 대조 불일치 0)
- 가격은 서버가 menu.json에서만 붙인다. 손님 화면이 보낸 금액은 무시한다.
- 메뉴에 없는 이름은 "현재 주문 가능한 메뉴에서 찾지 못했습니다" + 직원 도움. 메뉴·가격을 만들어내지 않는다.
- 향후 GBRICK AI OS `MENU_MASTER`로 교체할 자리: `loadMenu()` 한 곳.

## 7. 주문 데이터

| 표준 이름 | 저장 필드 |
|---|---|
| ORDER | order_id · store_id · order_number · business_date · mode · status · total_amount · order_source(VOICE/TEXT) · payment_status(PAY_AT_COUNTER) · created_at · customer_confirmed_at · confirmed_at · completed_at · cancelled_at · idempotency_key · print_count · clarification_count |
| ORDER_ITEM (ORDER.items) | menu_id · menu_name · quantity · options{temperature} · unit_price · amount |
| ORDER_EVENT | order_id · status · timestamp · actor(customer/counter) · metadata |
| VOICE_LOG | order_id · recognized_text · confidence(브라우저가 주면) · timestamp · clarification_count · error_type |
| HELP_REQUEST | request_id · store_id · order_id · session_id · timestamp · status(OPEN/RESOLVED) · resolved_by · resolved_at |

**주문번호**: 서버가 매장·영업일(한국시간)·모드별로 001부터 발급. 실제 `A001`, 테스트 `T001`.
한 프로세스가 순서대로 처리하므로 동시 주문 50건에도 중복 없음(테스트). 서버를 다시 켜도 파일에서 이어진다.

## 8. 주문 상태

```
NEW → CONFIRMED → (PRINTED) → PREPARING → READY → COMPLETED
 └──────────── CANCELLED (NEW·CONFIRMED·PRINTED·PREPARING에서) ─┘
```
정해진 순서 밖의 변경은 거절(409). 모든 변경은 ORDER_EVENT에 남는다. 주문서 출력 시 NEW면 CONFIRMED를 거쳐 PRINTED.

## 9. Counter

- 2초마다 새 주문·도움 요청 확인. 새 주문은 주황 테두리 + 소리(처음에 [🔈 알림 소리 켜기] 한 번 누름).
- 카드: 큰 주문번호 · 시간 · 음성/글자 · 메뉴·HOT/ICE·수량 · 합계 · 상태별 버튼 [주문 확인] [🖨 주문서 출력] [제조 시작] [준비 완료] [완료] [주문 취소]
- 🔔 "고객 도움이 필요합니다" → [확인] 누르면 RESOLVED
- 아래 '오늘 현황'은 실제 기록으로만 계산. 기록이 없으면 '-'.

## 10. Printer

- 지금: 카운터 화면에서 브라우저 인쇄(80mm 영수증 폭). 프린터가 없으면 인쇄 미리보기로 확인.
- 구조: `backend/print/receiptTemplate.mjs`(주문서 모양) + `printService.mjs`(프린터 어댑터 자리). ESC/POS·네트워크 프린터는 같은 자리에 추가.
- Chrome을 `--kiosk-printing`으로 실행하면 인쇄 창 없이 기본 프린터로 바로 나간다(매장 PC 설정).

## 11. Test Mode (기본)

- 아무 설정 없이 `npm start` → TEST. 주문번호 `T001`, 화면·주문서에 "TEST"/"테스트 모드", 파일 `store-orders.test.json`.
- 실제 매출·실제 통계와 분리. 연습·직원 교육용.

## 12. Production Mode (대표 승인 후에만)

```powershell
$env:VOICE_ORDER_MODE="production"; $env:STORE_STAFF_KEY="직원용 숫자 PIN"; npm start
```
- 두 값이 **모두** 있어야 켜진다(없으면 서버가 켜지지 않음). 주문번호 `A001`, 파일 `store-orders.production.json`.
- 카운터는 직원 키(PIN)를 한 번 입력해야 열린다.

## 13. 장애 대응

| 상황 | 화면 | 직원 조치 |
|---|---|---|
| 태블릿 ↔ 매장 PC 끊김 | 🔴 · 주문 시작 잠김 · "직원에게 말씀해 주세요" | 매장 PC·Wi-Fi 확인, 구두 주문 |
| 주문 전송 실패 | "주문이 아직 접수되지 않았습니다" + [다시 보내기] | 카운터에 주문이 떴는지 확인 |
| 음성 인식 안 됨(인터넷 끊김 등) | "제가 잘 못 들었어요" → 3번이면 직원 도움 권유 | 구두 주문 |
| 프린터 안 됨 | 카운터 화면에 주문은 그대로 | 화면 보고 제조, 프린터 확인 |
| 매장 PC 재시작 | 주문·번호는 파일에서 이어짐 | `npm start` 다시 실행 |

※ 음성 인식(아이패드 Safari·Chrome)은 Apple/Google 서버를 거치므로 **인터넷이 필요**하다. 주문 저장은 매장 PC라 인터넷이 없어도 된다.

## 14. 개인정보

저장하지 않는다: 이름·전화번호·카드·결제 정보·**음성 원본**. 인식된 글자(VOICE_LOG)만 매장 PC에 남는다. 저장소(GitHub)에도 올라가지 않는다(.gitignore).

## 15. 보안

- 직원용 API(카운터·상태 변경·출력·통계)는 직원 키 확인. 인터넷 공유(터널)로 들어온 직원용 요청은 키가 없으면 항상 거절.
- 등록되지 않은 매장 ID·경로 우회(`../`)는 404. 요청 크기 100KB 제한, 수량 1~20.
- 화면에 넣는 글자는 모두 textContent / 주문서는 HTML 이스케이프.
- 확인한 것: 위 항목 자동 테스트 + 직접 요청(curl) 점검. 확인 못 한 것: 실제 매장 Wi-Fi 환경.

## 16. 향후 POS 연동

이번 단계는 **POS·결제 미연동**. 연동 시 ORDER의 `payment_status`(지금 PAY_AT_COUNTER)와 ORDER_EVENT에
POS 결제 이벤트를 붙이는 구조. POS 업체 API·계약 확인이 먼저(대표 결정).

---

## 매장 설치 SOP (처음 한 번)

1. 매장 PC: 최신 버전 받기 → `voice-order` 폴더에서 `npm start` (Git for Windows가 있으면 HTTPS 자동)
2. 매장 PC IP 고정: 공유기 설정에서 매장 PC에 고정 IP(DHCP 예약) — IP가 바뀌면 태블릿 주소가 바뀐다
3. 태블릿(아이패드): Safari로 `http://<매장PC IP>:3100/certificate.pem` → '허용' → 설정 앱 맨 위 '프로파일이 다운로드됨' → 설치 → 설정 › 일반 › 정보 › 인증서 신뢰 설정에서 'GBRICK Voice Order' 켜기
   - 인증서에는 만들 때의 매장 PC IP가 들어간다. IP가 바뀌면 `certs` 폴더를 지우고 `npm start` 후 이 단계를 다시 한다
   - (확인 못 함) 이 단계는 실제 아이패드에서 아직 시험하지 못했다. 안 되면 안드로이드 태블릿 Chrome은 경고 화면에서 '계속'으로 사용 가능
4. 태블릿 Safari로 `https://<매장PC IP>:3443/store/GBRICK_MAIN` → 마이크 허용 → 공유 › 홈 화면에 추가
5. 아이패드 '사용법 유도(Guided Access)'로 이 화면만 쓰게 잠그기
6. 카운터 PC 크롬: `http://localhost:3100/counter/GBRICK_MAIN` → [🔈 알림 소리 켜기]
7. TEST 모드로 직원이 10건 이상 연습 → 대표 승인 → PRODUCTION 전환
