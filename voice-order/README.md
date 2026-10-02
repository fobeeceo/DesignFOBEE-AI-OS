# GBRICK AI VOICE ORDER — MVP v0.1

> 키오스크를 어려워하는 고객이 직원에게 말하듯 주문하면
> AI가 주문을 받아 확인하고 주문서를 출력해 주는 시스템.

**DEMO / TEST 전용.** POS·키오스크·결제(PG/VAN/간편결제)와 연결하지 않는다. 모든 주문은 `PAY_AT_COUNTER` — 결제는 카운터에서 기존 단말기로 한다.
기존 홈페이지(Next.js)·HERMES·JARVIS·ERP·DB와 완전히 분리된 독립 폴더다. 이 폴더는 홈페이지 빌드·배포에 포함되지 않는다.

---

## 1. 실행 (Windows PC 기준, 5분)

준비: [Node.js 18 이상](https://nodejs.org) 설치. 그 밖의 설치(npm install)는 필요 없다.

```bash
cd voice-order
npm start
```

켜지면 화면에 접속 주소가 나온다 (아래는 예시, 실제 IP는 PC마다 다름):

```
 PC 주문 화면   : http://localhost:3100
 PC 대시보드    : http://localhost:3100/dashboard
 휴대폰·태블릿  : https://192.168.0.10:3443   (음성 가능)
 같은 Wi-Fi(HTTP): http://192.168.0.10:3100   (텍스트만)
```

- 포트 변경: `PORT=3200 HTTPS_PORT=3444 npm start`
- 처음 실행 시 Windows 방화벽 창이 뜨면 **개인 네트워크 허용**을 누른다 (안 누르면 휴대폰에서 접속 안 됨).
- HTTPS 인증서는 `openssl`로 자동 생성한다. Windows는 [Git for Windows](https://git-scm.com)를 기본 경로에 설치하면 서버가 그 안의 openssl을 자동으로 찾는다(PATH 설정 불필요). 없으면 HTTP만 열린다.
- IP가 여러 개 나오면 보통 `192.168.0.x`·`192.168.1.x`가 Wi-Fi 주소다. `192.168.137.1`(핫스팟)·`172.x`(가상 네트워크)는 휴대폰 접속용이 아니다.

## 2. 아이폰·태블릿에서 열기

1. PC와 휴대폰을 **같은 Wi-Fi**에 연결
2. 휴대폰 Safari(아이폰) / Chrome(안드로이드)에서 `https://<PC IP>:3443` 입력
3. "연결이 비공개로 설정되어 있지 않습니다" 경고가 나온다 (자체 인증서라서 정상)
   - 아이폰 Safari: **세부사항 보기 → 이 웹 사이트 방문 → 웹 사이트 방문**
   - 안드로이드 Chrome: **고급 → (안전하지 않음)으로 이동**
4. 🎤 주문 시작 → 마이크 권한 **허용**
5. (선택) Safari 공유 버튼 → **홈 화면에 추가** → 앱처럼 전체 화면으로 열림

> 왜 HTTPS인가: 휴대폰 브라우저는 `http://192.168…` 주소에서는 마이크를 막는다. `http://` 주소로 열면 **텍스트 테스트만** 된다.
> 인증서 경고 없이 쓰려면 `cloudflared tunnel --url http://localhost:3100` 같은 HTTPS 터널을 쓸 수 있다 (외부 서비스 — 데모 주소가 인터넷에 열리므로 시연 때만).
> PC IP가 바뀌면 `certs/` 폴더를 지우고 다시 `npm start`.

## 3. 사용 방법

| 테스트 | 방법 |
|---|---|
| 음성 주문 | 🎤 주문 시작 → "듣고 있습니다." 후 말하기 → 확인 질문에 "네"/버튼 → "네, 맞아요" |
| 텍스트 테스트 | 시작 화면 **텍스트로 테스트** → 문장 입력(또는 예시 버튼) → **주문 분석** |
| 주문서 출력 | 완료 화면 **🖨 주문서 출력** → 브라우저 인쇄 창 (영수증 80mm 폭). 대시보드에서 **재출력** 가능 |
| 자동 출력 | `http://localhost:3100/?autoprint=1` — 주문 완료 즉시 인쇄 창을 연다. Chrome을 `--kiosk-printing`으로 실행하면 창 없이 바로 인쇄 |
| 직원 도움 | 모든 화면 아래 **🙋 직원에게 도움 요청** → "직원을 호출했습니다." + 기록 `help_requested=true` (실제 알림은 아직 없음) |
| 대시보드 | `/dashboard` — 상단에 **DEMO / TEST DATA**. 오늘 주문 수·완료·음성/텍스트·도움 요청·실패·평균 처리 시간·최근 주문 |

### 대화 규칙 (추측하지 않는다)

| 고객 말 | AI 반응 |
|---|---|
| 아이스 아메리카노 하나 | 바로 주문 확인 |
| 아메리카노 두 잔 / 라떼 하나 | "따뜻한 것과 차가운 것 중 어떤 걸로 드릴까요?" (온도를 짐작하지 않음) |
| 커피 하나 | "아메리카노를 말씀하시나요?" |
| 차가운 커피 하나 | "아이스 아메리카노를 말씀하시나요?" |
| 따뜻한 레몬 아메리카노 | "레몬 아메리카노는 아이스만 있어요. 아이스로 드릴까요?" |
| 딸기라떼 하나 | "죄송합니다. ‘딸기라떼’는 현재 주문 가능한 메뉴에서 찾지 못했습니다." + 직원 도움 |
| (말이 안 들림) | "제가 잘 못 들었어요. 천천히 한 번 더 말씀해 주세요." — 3번 연속이면 직원 도움을 먼저 권함 |

확인 대답으로 알아듣는 말: 네·예·응·맞아요·맞습니다·그래요 / 아니요·아뇨·다시 / 따뜻하게·아이스·차갑게.
완료 화면은 10초 후, 다른 화면은 90초 동안 아무 조작이 없으면 시작 화면으로 돌아간다.

## 4. 브라우저별 음성 지원 (Web Speech API)

| 환경 | 음성 인식 | 음성 안내 | 비고 |
|---|---|---|---|
| Windows Chrome / Edge | ✅ | ✅ | `localhost`는 HTTP로도 마이크 허용. 인식은 Google/Microsoft 서버를 거치므로 **인터넷 필요** |
| Android Chrome | ✅ (HTTPS 필요) | ✅ | |
| iPhone/iPad Safari (iOS 14.5+) | ✅ (HTTPS 필요) | ✅ | 설정 → Siri 및 검색(또는 받아쓰기) **켜져 있어야** 함. 무음 모드면 음성 안내가 안 들릴 수 있음 |
| iPhone Chrome·네이버 앱 등 | ⚠ 기기별 상이 | ✅ | 안 되면 Safari 사용 |
| Firefox | ❌ | ✅ | 자동으로 "텍스트로 테스트" 안내 |

음성이 안 되는 환경에서도 **텍스트 테스트는 항상 작동**하고, 모든 안내는 화면 글자로도 나온다.

## 5. 구조

```
voice-order/
├─ server.mjs                 HTTP(3100)+HTTPS(3443) 서버, API, 접속 주소 출력
├─ data/menu.json             MENU_MASTER — 가격은 여기 한 곳에서만 관리
├─ data/orders.json           ORDER 테스트 기록 (자동 생성, git 제외)
├─ core/                      브라우저·서버 공용 (외부 API 없음)
│  ├─ parser.mjs              자연어 주문 분석 (규칙 기반)
│  ├─ dialog.mjs              확인 질문 생성, 대답(네/아니요/온도) 해석
│  └─ format.mjs              금액·메뉴명·조사(을/를) 표기
├─ backend/
│  ├─ orderService.mjs        세션·가격 계산·주문번호·확정·도움·통계
│  ├─ store.mjs               JSON 저장소 (→ 향후 GBRICK AI OS ORDER로 교체)
│  └─ print/                  PrintProvider 인터페이스 (browser / thermal 자리)
├─ frontend/                  index.html·app.js(주문 화면), speech.js(SpeechProvider·TTS), dashboard
└─ tests/                     node:test 자동 테스트 + e2e/smoke.mjs(브라우저)
```

### API

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/menu` | MENU_MASTER |
| POST | `/api/sessions` `{input_type: VOICE\|TEXT}` | 주문 세션 시작 |
| POST | `/api/sessions/:id/parse` `{text}` | 주문 분석 (+기록) |
| POST | `/api/sessions/:id/fail` `{reason}` | 음성 인식 실패 기록 |
| POST | `/api/quote` `{items}` | 가격 계산 (서버 메뉴 가격만 사용) |
| POST | `/api/sessions/:id/confirm` `{items}` | 주문 확정 → `GB-YYYYMMDD-001` |
| POST | `/api/sessions/:id/cancel` | 주문 초기화 |
| POST | `/api/help` `{session_id?}` | 직원 도움 요청 기록 |
| POST | `/api/orders/:order_id/print` · `/print-result` | 주문서 생성 · 인쇄 결과 기록 |
| GET | `/api/stats` | 대시보드 집계 |

### ORDER 기록 필드 (향후 GBRICK AI OS ORDER와 연결)

`order_id`(확정 시 부여) · `created_at` · `confirmed_at` · `input_type` · `raw_transcript` · `transcripts[]` · `items[]{menu_id,display_name,temperature,quantity,unit_price,line_total}` · `total_amount` · `payment_status=PAY_AT_COUNTER` · `status(IN_PROGRESS/CONFIRMED/FAILED/CANCELLED)` · `help_requested` · `print_status(NOT_PRINTED/SENT_TO_BROWSER/PRINTED/PRINT_FAILED)` · `fail_count` · `demo=true`

### 확장 지점

- **음성 인식 교체**: `frontend/speech.js`의 `SpeechProvider` 모양(`isSupported/listen/cancel`)으로 서버 STT provider를 추가. API 키는 서버 환경변수에만 두고 브라우저에는 절대 넣지 않는다.
- **열전사 프린터**: `backend/print/printService.mjs`에 `print(order)`를 구현한 provider 추가 → `VOICE_ORDER_PRINTER=thermal`. 지금 `thermal`은 "연결 안 됨"으로 실패하는 자리표시다.
- **메뉴 추가/가격 변경**: `data/menu.json`만 고치고 서버 재시작. 별칭(`aliases`)·애매한 말(`suggest_for`)도 여기서.

## 6. 테스트

```bash
npm test                                   # 18개: 요구사항 §26의 13항목 + API·자연어·대답
BASE_URL=http://localhost:3100 npm run test:e2e   # 브라우저 E2E 14단계 (playwright 필요, 음성은 모의 객체)
```

## 7. 현재 제한사항

- 실제 마이크·실제 음성 인식 품질(사투리·소음·어르신 발음)은 **매장 기기에서 사람이 확인해야** 한다. 자동 테스트는 음성 인식 결과를 흉내 낸 것이다.
- 주문 분석은 규칙 기반이다. 메뉴 6종에 맞춰져 있고, 처음 듣는 표현은 "찾지 못했습니다"로 안전하게 멈춘다 (만들어내지 않음).
- 옵션은 온도(HOT/ICE)만. 샷 추가·사이즈·시럽·포장/매장 구분은 없다.
- 직원 호출은 기록만 한다 (알림 없음). 주문서는 브라우저 인쇄 창을 거친다.
- 자체 서명 인증서라 휴대폰에서 첫 접속 때 경고를 한 번 넘겨야 한다.
- 데이터는 PC의 `data/orders.json` 한 파일. 여러 매장·여러 기기 동시 운영용이 아니다.
