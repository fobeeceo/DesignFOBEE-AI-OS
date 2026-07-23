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

## 3. QA / Audit (배포 전 필수, CLAUDE.md §9·§10)
```bash
npm run qa            # lint + type-check + build
npm run qa:extended   # a11y·SEO·broken-link·image·performance → QA-REPORT.md
npm run audit          # dead-code·중복·unused-import·broken-route·build·security·env·git → audit-report.md
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
