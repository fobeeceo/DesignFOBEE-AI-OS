# INSTALL — DesignFOBEE · GBRICK AI HQ

> **프로젝트 루트 = `D:\Project\ReRoomAI`** (Git 저장소 루트). 모든 상대 경로(`AI-HQ/`, `Dockerfile` 등)는 이 폴더 기준이다. `C:\AI-HQ`처럼 드라이브 루트의 동명 폴더와 혼동하지 않는다(2026-07-22 실제 발생한 혼동 — 무관한 폴더였음).

## 1. 로컬 개발 (Docker 없이)
```bash
npm install
cp .env.example .env.local   # 값 채우기 (Supabase/Gemini/Naver)
npm run dev                   # http://localhost:3000
```
env 없이도 홈·`/design`·`/hq`(공개 데모 모드)는 렌더된다.

## 2. Docker Compose (권장 — CEO-CHARTER.md §Docker 규칙)
루트에서 실행(`AI-HQ/docker-compose.yml`이 단일 오케스트레이션 진입점, `docker run` 미사용):

```bash
# 이미지 빌드
docker compose -f AI-HQ/docker-compose.yml build

# 웹 앱 기동 (http://localhost:3000)
docker compose -f AI-HQ/docker-compose.yml up -d web

# 호스트 3000번이 이미 사용 중이면 포트 오버라이드
WEB_PORT=3011 docker compose -f AI-HQ/docker-compose.yml up -d web

# ERP CLI 온디맨드 실행 (예: POS 분석)
docker compose -f AI-HQ/docker-compose.yml run --rm erp python src/pos_import.py /app/output/<파일>.xlsx
docker compose -f AI-HQ/docker-compose.yml run --rm erp python src/erp_engine.py
```
`.env.local`(web) / `content-automation-agent/.env`(erp)이 없어도 기동된다(dry-run/데모 모드, `required: false`).
⚠️ `docker compose config`는 실제 키 값을 출력한다 — 로그 파일로 리다이렉트 금지, 화면 확인만.

## 3. QA / Audit (배포 전 필수, CLAUDE.md §9·§10·§21)
```bash
npm run qa            # lint + type-check + build + vitest
npm run qa:extended   # a11y·SEO·broken-link·image·performance → QA-REPORT.md
npm run audit          # dead-code·중복·unused-import·broken-route·build·security·env·git → audit-report.md
npm run verify         # qa → audit → check-docs 순서로 전부 실행, 하나라도 실패하면 중단
```
`.git/hooks/pre-commit`가 로컬에서 `npm run verify`를 자동 실행하도록 설치돼 있다(이 저장소를 새로 클론한 환경에는 git이 `.git/hooks/`를 복사하지 않으므로, 새 클론에서 강제하려면 아래를 한 번 실행):
```bash
cp scripts/pre-commit-template.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

## 4. ERP 실데이터 파이프라인
```bash
cd content-automation-agent/src
python pos_import.py <POS.xlsx>
python dessert_import.py <디저트단가표.xlsx>
python erp_engine.py
```

## 5. 배포
`git push origin main` → Vercel 자동 배포(`design-fobee-ai-os.vercel.app`). main은 항상 배포 가능 상태 유지(§12).

## 6. Media 발행 API 자격증명 발급 (CEO 전용 수동 절차)
AI Content Analyst·Instagram/YouTube Manager 등의 정규직 승격에 필요. **신원확인·비즈니스 인증이 들어가는 절차라 CTO가 대신 실행할 수 없음**(CEO-CHARTER §승인규칙 "외부서비스가입"). 아래를 CEO가 직접 완료한 뒤 값을 `content-automation-agent/.env`에 채우면, `analytics.py`가 자동으로 실제 API를 호출한다(코드는 이미 구현·대기 중).

### Meta(Instagram/Facebook/Threads) — `META_GRAPH_ACCESS_TOKEN`, `META_IG_BUSINESS_ID`
1. [developers.facebook.com](https://developers.facebook.com) → 앱 만들기(비즈니스 유형) → 본인 Facebook 계정으로 로그인.
2. 앱에 "Instagram Graph API" 제품 추가 → 페이지-Instagram 비즈니스 계정 연결(개인 계정은 불가, 비즈니스/크리에이터 전환 필요).
3. Graph API Explorer에서 `instagram_basic`·`instagram_manage_insights` 권한으로 Access Token 발급(장기토큰 권장, 60일).
4. Instagram 비즈니스 계정 ID(`META_IG_BUSINESS_ID`)와 토큰(`META_GRAPH_ACCESS_TOKEN`)을 `.env`에 입력.

### YouTube — `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
1. [console.cloud.google.com](https://console.cloud.google.com) → 프로젝트 생성 → "YouTube Data API v3" 활성화.
2. OAuth 동의화면 구성(외부/테스트 모드로 충분) → OAuth 클라이언트 ID 발급(`YOUTUBE_CLIENT_ID`/`YOUTUBE_CLIENT_SECRET`).
3. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)에서 본인 클라이언트ID/Secret 입력 → `youtube.readonly` 스코프로 인증 → Refresh Token 발급받아 `YOUTUBE_REFRESH_TOKEN`에 입력.

### 완료 후
`.env` 채운 뒤 `python content-automation-agent/src/analytics.py`로 재실행하면 `dry_run:false`와 함께 실제 지표가 나온다 — 이 실행 결과를 CTO에게 전달하면 AI Content Analyst를 정규직으로 재검증한다([AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §2).

## 7. API 키 관리 원칙 (CEO MASTER 업무지시서 §6, 2026-07-23 감사)
| 원칙 | 상태 | 근거 |
|---|---|---|
| 채팅창으로 키 전달받지 않는다 | ✅ 준수 | 이번 세션 포함 항상 `.env` 직접 입력 방식으로 안내(§6 가이드) |
| `.env`/Secret Manager에서만 관리 | ✅ 준수 | 전 서비스 `.env`/`.env.local` 기반, 코드 내 하드코딩 시크릿 0건(`npm run audit` checkSecurity) |
| Git 커밋 금지 | ✅ 준수 | `.env`·`.env.local`·`content-automation-agent/.env` 전부 `.gitignore` 등록, `git ls-files`로 미추적 확인. `.env.example`(값 없는 템플릿)만 추적 |
| 로그 미출력 | ✅ 준수 | 소스 전체에서 API 키 관련 `console.log`/`print` 패턴 0건 확인 |
| **운영/개발 키 분리** | ❌ **미비** | 현재 `GEMINI_API_KEY` 등 단일 변수명을 로컬(`.env.local`)과 운영(Vercel 환경변수)에 값만 다르게 넣는 방식 — Vercel의 Production/Preview/Development 환경별 값 분리 기능에 의존. CEO 원칙(Gemini Dev/Prod처럼 이름 자체를 분리)과는 다른 방식. 별도 결정 필요(TODO.md 기록) |

**2026-07-23 부수 조치**: 로컬 `.env.local` 주석에 평문 DB 비밀번호가 남아있던 것을 발견해 제거(파일 자체는 Git 미추적이라 외부 유출은 없었음, 로컬 위생 차원 정리).

## 8. 이미지 SSOT 동기화 (CEO MASTER 업무지시서 §5)
Google Drive(`GBRICK_AI_SYSTEM/MASTER-ASSETS/{LOGO,BRAND,MENU,STORE/<매장명>,PORTFOLIO/{BEFORE_AFTER,SNS,WEBSITE}}`)가 이미지 원본(SSOT), `public/images/`는 캐시(복사본)다.

```bash
npm run sync-images -- --source <스테이징폴더>
```
스테이징 폴더는 Drive와 동일한 하위구조를 로컬에 미러링한 것이다. 실행하면 각 이미지를 **WebP 변환·1920px 최적화·400px 썸네일 생성·Gemini Vision 기반 한국어 ALT 자동생성**까지 수행해 `public/images/`에 배치하고 `public/images/manifest.json`에 출처·경로·ALT·동기화일시를 기록한다.

⚠️ **정직한 범위 고지**: "Drive → 로컬 스테이징 폴더"는 자동화되어 있지 않다. Drive API 서비스 계정 자격증명이 없어(외부서비스가입, CEO 승인 대상) 완전 무인 동기화는 아직 불가능 — 현재는 Claude Code 세션이 Drive MCP로 직접 다운로드해 스테이징 폴더를 채운 뒤 이 스크립트를 실행하는 반자동 방식이다. `npm run sync-images` 자체(WebP/최적화/썸네일/ALT/배치)는 완전 자동화되어 있고 실제 이미지로 종단 검증 완료([DECISION-LOG.md](DECISION-LOG.md) 참조).

## 9. n8n 아침 브리핑(이메일+일정) — CEO 인증 필요 (2026-07-25)
n8n(`http://localhost:5678`, 오너계정 `ceo@fobee.co.kr`)에 워크플로 **"AI HQ - 아침 브리핑"**(id `toB3sf8BJpWaJNIl`)을 신설했다: 매일 08:30 → Gmail 중요메일 조회 → Google Calendar 오늘 일정 조회 → 요약 생성 → 발송(현재 placeholder). **credential 미연결로 inactive 상태** — 아래는 Claude Code 세션이 대신 할 수 없는, CEO 본인 계정 인증이 필요한 절차다.

1. 브라우저로 `http://localhost:5678` 접속 → 오너 계정 로그인.
2. 좌측 **Credentials → Add Credential → Gmail OAuth2 API** 선택 → "Connect my account"로 구글 로그인(대표님 계정) → 저장.
3. 같은 방식으로 **Google Calendar OAuth2 API** credential도 추가.
4. 워크플로 **"AI HQ - 아침 브리핑"**을 열어 `중요 이메일 조회`·`오늘 일정 조회` 두 노드에 각각 방금 만든 credential을 지정(노드 클릭 → Credential 드롭다운에서 선택) → 저장.
5. 마지막 노드 `발송 채널`은 아직 placeholder(NoOp)다 — Telegram Bot(§6-Telegram, 아직 미작성) 또는 원하는 채널이 정해지면 해당 노드로 교체 필요.
6. 우측 상단 토글로 워크플로를 **Active**로 전환하면 매일 08:30(Asia/Seoul)에 자동 실행된다.

이 세션에서 즉시 조회하고 싶다면(자동화 아님, 그때그때 요청 시): `claude mcp`(또는 인터랙티브 세션의 `/mcp`)로 Gmail·Google Calendar 커넥터를 이 Claude Code 세션에 인증하면, 다음 대화부터 요청 시 바로 오늘 일정·안읽은 중요메일을 조회해 보고할 수 있다.

## 10. Telegram 봇 생성 (CEO 전용 수동 절차, 승인/반려 워크플로용)
n8n 워크플로가 "승인/반려 버튼이 있는 메시지"를 보내려면 Telegram Bot이 필요하다. 이건 대표님 텔레그램 계정으로만 만들 수 있어 Claude Code가 대신할 수 없다.

1. 텔레그램 앱에서 **@BotFather** 검색 → 대화 시작.
2. `/newbot` 입력 → 봇 이름(예: `GBRICK AI HQ`) → 봇 사용자명(예: `gbrick_ai_hq_bot`, 반드시 `bot`으로 끝나야 함) 입력.
3. BotFather가 발급하는 **API Token**(`123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 형식) 복사 — 이 토큰이 있으면 누구나 봇을 조작할 수 있으니 채팅/커밋에 붙여넣지 말 것.
4. 텔레그램에서 방금 만든 봇을 검색해 `/start`로 대화 시작(봇이 메시지를 보내려면 먼저 사용자가 대화를 시작해야 함).
5. 대표님의 **chat_id** 확인: 봇과 대화 후 브라우저로 `https://api.telegram.org/bot<토큰>/getUpdates` 접속 → `"chat":{"id":...}` 값 확인.
6. n8n → Credentials → Add Credential → **Telegram API** → 위 토큰 입력 → 저장.
7. 발급받은 토큰과 chat_id는 채팅으로 전달하지 말고, `.env.local`에 `TELEGRAM_BOT_TOKEN`·`TELEGRAM_CHAT_ID`로 직접 입력하거나 n8n Credential 화면에 직접 입력.

완료되면 §9(아침 브리핑)의 `발송 채널` 노드와, 메뉴전략 승인 워크플로(DECISION-LOG 2026-07-25 참조)의 Telegram 노드에 이 credential을 연결하면 된다.

## 11. Notion 연동 (n8n → "AI 제안함" DB 기록용, CEO 전용 수동 절차)
n8n 워크플로 **"AI HQ - 메뉴전략 승인(Telegram+Notion)"**(id `lgLgyt0lw5Q78Kgc`)이 승인/반려 결과를 Notion "AI 제안함" DB(https://app.notion.com/p/5211427b8727446cafa447b56d2e3da7)에 기록하려면, n8n 자체의 Notion API 연동이 필요하다(Claude Code가 쓰는 Notion MCP와는 별개 — n8n은 자기만의 통합 토큰이 있어야 함).

1. 브라우저로 https://www.notion.so/my-integrations 접속(대표님 Notion 계정으로 로그인).
2. **+ New integration** → 이름(예: `n8n AI HQ`) → 워크스페이스 선택 → 생성.
3. 발급된 **Internal Integration Token**(`ntn_...` 형식) 복사 — 채팅/커밋에 붙여넣지 말 것.
4. Notion에서 "AI 제안함" DB 페이지 열기 → 우측 상단 `···` → **연결 추가(Add connections)** → 방금 만든 통합 선택(이 단계를 빼먹으면 통합 토큰이 있어도 이 DB는 못 씀).
5. n8n → Credentials → Add Credential → **Notion API** → 토큰 입력 → 저장.
6. 워크플로의 `Notion에 대기 등록`·`Notion 상태 갱신` 두 노드에 이 credential을 지정 → 저장.

§10(Telegram)·§11(Notion) 두 credential과 §9(Gmail/Calendar)까지 모두 연결되면, "AI HQ - 메뉴전략 승인" 워크플로를 Active로 전환해 실제 자동 승인 루프가 동작한다.
