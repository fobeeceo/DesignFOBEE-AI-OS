# CHANGELOG — DesignFOBEE AI OS

모든 주요 변경을 기록한다. AI OS 업그레이드는 Priority 단위로 추적한다.

## [Unreleased]

### 자율 사이클: Dead config 정리 + PROJECT 8 최종결론 + standalone 검토 (2026-07-26)
- **배경**: 스케줄 작업 지시 우선순위 1(`/api/hq/erp` 라이브 연결)·2(디저트 정밀원가)는 이전 사이클(2026-07-22~25)에 이미 완료·검증돼 있음을 CHANGELOG/TODO 재확인으로 확정(재작업 없음, 중복 방지). 우선순위 3(PROJECT 7/8)도 가맹점 뷰(P7)는 기완료 — 본사 뷰(P8)만 3사이클 연속 "요구사항 미구체화"로 보류 중이었음.
- **`next.config.ts`/`.mjs` 중복 제거**: 두 파일이 내용 동일하게 공존해왔는데, **Next.js 14.2.35는 `.ts` config를 지원하지 않음**을 직접 재현 확인(`.mjs` 임시 삭제 → `next build`가 "Configuring Next.js via 'next.config.ts' is not supported" 즉시 에러) — `.ts`는 처음부터 사용된 적 없는 Dead Code였고 `.mjs`만 항상 유효했음. Dead `.ts` 삭제(CEO-CHARTER §16-A Dead Code 자율삭제 승인 범위).
- **PROJECT 8(본사 전용 뷰) 최종 결론**: 재보류 대신 CTO 판단으로 확정 — `/hq`(CEO Dashboard)가 매출·원가·재고·발주 통합을 본사 관점에서 이미 수행 중이며 가맹점 뷰(`/hq/[section]`)와 분리돼 있어 별도 화면 불필요로 결론(TODO.md 기록).
- **`output: standalone` 시도 후 원복**: 이미지 경량화 목적으로 플래그 추가·`npm run build` 통과까지 확인했으나, 완전한 효과를 내려면 `Dockerfile` runner 단계를 `node server.js`로 바꿔야 하고 이 프로젝트는 Prisma를 쓰고 있어 standalone 트레이싱에 쿼리 엔진 바이너리가 자동 포함되는지 검증이 필요함(알려진 Next+Prisma 함정). 현재 `ai-hq-web-1` 컨테이너가 n8n 자동화와 연동돼 18시간+ 운영 중인 상태에서 미검증 변경은 §8 검증규칙 위반 소지 — 이번 사이클엔 원복, 격리된 테스트 이미지로 재시도 예정(TODO.md 기록).
- **검증**: env 없이 `npm run build` exit 0(27 라우트, 회귀 없음), `npm run lint` clean.
- **다음 우선순위**: (1) `output: standalone`을 별도 포트/태그의 격리 Docker 이미지로 Prisma 동작까지 검증 후 Dockerfile 교체. (2) 타 매장 POS 업로드 파이프라인(P7 전국 집계, 자격증명/합의 필요, 불변). (3) 음료 메뉴 원가 63종 확장(Drive SSOT 미확정으로 계속 보류).

### n8n 메뉴전략 승인 워크플로 + Notion "AI 제안함" 신설 (2026-07-25)
- **배경**: CEO 지시 — "매일 아침 → n8n → AI 메뉴전략가 API → Telegram 승인/반려 버튼 → 콜백을 n8n이 받아 Notion에 기록".
- Notion DB `AI 제안함` 신설(제안/제안자/상태/요약/제안일시/처리일시/처리채널/원본데이터).
- n8n 워크플로 `AI HQ - 메뉴전략 승인(Telegram+Notion)`(id `lgLgyt0lw5Q78Kgc`) 신설: 매일 08:00 → ERP 메뉴전략 API 조회 → Notion에 대기 상태로 등록 → Telegram 승인/반려 버튼 발송(트리거 A) / Telegram 콜백 수신 → Notion 상태 갱신(트리거 B).
- n8n Header Auth credential을 기존 `N8N_SERVICE_TOKEN`으로 API를 통해 자동 생성(CEO 액션 불필요).
- **정직한 범위 고지**: Telegram Bot·Notion Internal Integration 두 credential은 CEO 본인 계정 인증이 필요해 미연결 — 워크플로는 inactive. 절차는 [INSTALL.md](INSTALL.md) §10·§11. 상세 근거는 [DECISION-LOG.md](DECISION-LOG.md) 2026-07-25 항목.

### n8n 아침 브리핑 워크플로 신설 (이메일+일정, 2026-07-25)
- **배경**: CEO 요청 — "아침에 이메일 확인·오늘 일정 확인·중요한 것 체크"를 자동화. 세션 내 Gmail·Calendar MCP는 미인증 상태로 즉시 조회 불가 확인.
- n8n에 워크플로 `AI HQ - 아침 브리핑`(id `toB3sf8BJpWaJNIl`) 신설: 매일 08:30(Asia/Seoul) → Gmail 중요메일 조회 + Google Calendar 오늘 일정 조회(병렬) → 텍스트 요약 조합 → 발송 채널(현재 NoOp placeholder, Telegram 봇 생성 후 교체 예정).
- n8n API 키 재발급 후 `.env.local`에만 저장(채팅 미노출), `.env.example`에 `N8N_API_KEY` 항목 추가.
- **정직한 범위 고지**: 워크플로는 credential 미연결로 현재 inactive. Gmail·Google Calendar OAuth2 연결은 CEO 본인 구글 계정 인증이 필요해 자동화 불가 — 절차는 [INSTALL.md](INSTALL.md) §9. 상세 근거는 [DECISION-LOG.md](DECISION-LOG.md) 2026-07-25 항목.

### 디저트 판매가 → 홈 메뉴 화면 연결 (TODO.md P1, 2026-07-25)
- **배경**: TODO.md P1에 미완료로 남아있던 "디저트 판매가 → 홈 메뉴 화면 연결" — `/hq/erp`(내부 ERP 대시보드)에는 디저트 원가·판매가가 이미 라이브 연결돼 있었으나, 공개 홈페이지에는 메뉴 화면 자체가 없었음(Explore 조사로 확인: `components/home/GBrickSection.tsx`는 브랜드 소개 문구뿐, 메뉴 목록·가격 없음, `/menu` 라우트 없음).
- `lib/menu/dessertMenu.ts` 신설: SSOT는 `content-automation-agent/output/dessert_menu.json`(지브릭커피 디저트단가표 Excel 실import, 28종) — 원가·원가율(내부 경영정보)은 제외하고 이름·판매가만 공개용으로 옮겨 적음. 공급사 코드/중량 표기(`JW)`·`EDT`·`110g`·`-N` 등)만 정리, 이름·가격 자체는 원본 그대로(추측·변경 없음).
- `components/home/MenuSection.tsx` 신설 + `app/page.tsx`에 GBrick 섹션 뒤로 삽입(Hero→Portfolio→Services→About→Process→GBrick→**Menu**→Trust→Contact). 원가/마진 데이터는 공개 노출하지 않음(경쟁사 노출 방지).
- 데이터 성격상(디저트단가표 개정 시 CEO가 갱신하는 마스터 데이터, ERP 산출물 아님) `STORES`/`AI_STAFF`/`HQ_MENU`와 동일하게 정적 방식 채택(과잉엔지니어링 방지, 2026-07-24 항목과 동일 판단 기준).
- **검증**: 이 세션 자체 dev 서버(포트 54473)에서 `document.querySelector('#menu')`로 직접 확인 — 28개 항목 전부 이름·가격 정상 렌더(예: 가나슈초코케이크 7,000원 ~ 뉴욕치즈케익 11,800원), opacity:1로 실제 표시 확인. env 없이 `npm run build`/`npm run lint`/`npm run qa` 모두 exit 0(27 라우트 정상 컴파일, 신규 라우트 없음 — 정적 컴포넌트라 `/`에 인라인).
- **다음 우선순위**: 음료 메뉴(현재 `erp_engine.py` MENU 딕셔너리는 데모 9종뿐, 09_MENU_COST_TABLE SSOT가 12개 버전에 걸쳐 카테고리 평균만 확정되고 개별 63개 라인 전체는 문서 자체가 "재계산 예정"으로 미확정 상태임을 Drive 직접 확인 — 전체 확장 시도 시 추측 위험이 있어 이번 사이클엔 보류, SSOT 문서가 스스로 완결된 후 진행 권장).

### n8n 자동화 엔진용 서비스 토큰 인증 경로 신설 (2026-07-25)
- **배경**: `/api/hq/design-trends`·`/api/hq/marketing-copy`·`/api/hq/strategy-analysis`(Gemini 호출, 비용 발생) 3건은 `requireAdmin()`으로 브라우저 관리자 로그인만 허용 — CEO MASTER 업무지시서에서 승인된 n8n 자동화 엔진(Docker Compose 서비스)이 워크플로에서 이 API들을 직접 호출할 방법이 없었음(이전 세션에서 착수했으나 미커밋 상태로 남아있던 작업을 이번 사이클에서 검증·완료).
- `lib/auth/requireServiceOrAdmin.ts` 신설: `Authorization: Bearer <N8N_SERVICE_TOKEN>` 헤더가 환경변수와 일치하면 서비스 프로필(`service:n8n`)을 반환, 아니면 기존 `requireAdmin()`(브라우저 세션)으로 폴백. `N8N_SERVICE_TOKEN` 미설정 시 서비스 토큰 경로 자체가 비활성화되어 기존 관리자 인증만 동작(무파괴).
- 위 3개 라우트를 `requireAdmin()` → `requireServiceOrAdmin(req)`로 교체(인증 실패 시 에러 처리·상태코드는 기존 `AdminAuthError` 그대로 유지, 동작 변경 없음).
- `AI-HQ/docker-compose.yml`에 `n8n` 서비스 추가(`n8nio/n8n:latest`, `${N8N_PORT:-5678}`, `AI_HQ_SERVICE_TOKEN`을 `.env.local`의 `N8N_SERVICE_TOKEN`에서 주입, `web` 컨테이너에 `depends_on`). `.env.example`에 `N8N_SERVICE_TOKEN` 항목·용도 설명 추가.
- **검증**: env 없이 `npm run build` exit 0(27 라우트, 3개 라우트 모두 정상 컴파일), `npm run lint` clean. 토큰 미설정 시 기존 `requireAdmin()` 경로만 타는 것은 코드 리뷰로 확인(런타임 n8n 컨테이너 기동은 미실행 — Docker 재기동은 운영 서버 변경 소지라 이번 사이클에선 코드만 완성).
- **다음 우선순위**: n8n 컨테이너 실기동 후 실제 서비스 토큰으로 3개 라우트 종단 호출 검증(현재는 코드 경로만 확인, 컨테이너 실행 검증은 미완료로 명시).

### `/hq/[section]`(가맹점·물류·교육·콘텐츠·직원·설정) 라이브 API 연결 (2026-07-24)
- **배경**: `/hq`·`/hq/erp`는 2026-07-23에 `/api/hq/erp` client fetch로 전환됐으나, `app/hq/[section]/page.tsx`(가맹점 로스터·물류 발주·설정 화면)는 여전히 서버 컴포넌트에서 `ERP_SNAPSHOT` 상수를 정적 import — 엔진(`erp_engine.py`/`pos_import.py`) 재실행이 화면에 반영되지 않는 마지막 남은 갭이었음(TODO.md P1 재확인으로 발견).
- `app/hq/[section]/page.tsx`를 client 컴포넌트로 전환, 기존 `/hq`·`/hq/erp`와 동일 패턴(초기 렌더는 `ERP_SNAPSHOT`으로 즉시 표시 → `/api/hq/erp` 응답으로 무깜빡임 갱신)으로 가맹점(본점 실적)·물류(발주 추천) 섹션의 수치를 라이브 연결. `STORES`/`AI_STAFF`/`HQ_MENU`(매장 로스터·AI 조직도)는 ERP 산출물이 아니므로 정적 유지(과잉수정 방지).
- **검증**: env 없이 `npm run build` exit 0(27 라우트, `/hq/[section]` 포함 정상 컴파일), `npm run lint` clean. `/hq/*`는 이 세션 dev 서버에 실 Supabase env가 로드돼 있어 `/login`으로 리다이렉트되는 기존 인증게이트 동작(§13, 2026-07-23와 동일 제약) — 브라우저 렌더 대신 `fetch('/api/hq/erp')` 직접 호출로 `source:"live"`·매출 16,627,700원·디저트 28종 확인.
- **다음 우선순위**: (1) 타 매장 POS 업로드 파이프라인(P7 전국 집계, 자격증명/합의 필요). (2) PROJECT 8(본사 전용 뷰) 요구사항 미구체화 — CEO 확인 필요(전 사이클과 동일 결론, 신규 정보 없음).

### 프롬프트 전용 AI 역할 3건 코드화 → 정규직 승격 (CEO MASTER 업무지시서 §1, 2026-07-23)
- **배경**: 신기준("실제 코드 존재" 필수) 재평가에서 AI CEO(전략)·AI 마케터·AI 콘텐츠·AI Documentation이 코드 없이 Notion 프롬프트뿐이라 정규직 불가 판정됨 — 이번 사이클에서 3건을 코드화해 해소.
- `agents/ceoStrategyAgent.ts` + `POST /api/hq/strategy-analysis` 신설: 결정사안+배경 → 복수대안+반대의견+"CEO 없이도 작동하는가" 판단 → 권고(제안까지만, 실행 없음). 실제 안건(API 키 dev/prod 분리)으로 테스트 — 대안 3개·반대의견 2개·구체적 권고 생성 확인.
- `agents/marketerAgent.ts` + `POST /api/hq/marketing-copy` 신설: Franchise SSOT(8,636만원 등) 하드코딩 + 법정고지 강제 포함. 실행 결과 `legalNoticeIncluded:true`, SSOT 밖 수치 없음 확인.
- **AI 콘텐츠**: `generate_osmu.py`(Media Director, 기존 정규직)와 산출물이 실질적으로 중복됨을 확인 — 코드 중복 생성 대신 Media Director를 정본으로 지정, Notion 페이지에 CTO 노트 추가 후 "초안"으로 조정(삭제 아님).
- `scripts/check-docs-sync.js` 신설(LLM 미사용): 루트 .md 파일과 DOCUMENT-INDEX.md 참조 대조, CHANGELOG 최신성 검사. 실행 결과 23개 파일 검사, 불일치 0건.
- 4건 모두 Docker web 이미지 재빌드로 운영검증, Notion Training Center·평가기준에 등록 완료 — **AI CEO(전략)·AI 마케터·AI Documentation 정규직 확정**(총 정규직 13명).
- `npm run qa`/`audit` 통과.

### 이미지 SSOT 파이프라인 + API 키 관리 감사 (CEO MASTER 업무지시서 §5·§6, 2026-07-23)
- `scripts/sync-images.js` 신설: `sharp`로 WebP 변환(1920px 최적화)·400px 썸네일 생성, Gemini Vision으로 한국어 ALT 자동생성 → `public/images/` 배치 + `manifest.json` 기록. GBRICK 은평본점 실사진으로 종단 검증(1.7MB→158KB WebP, ALT "원목 가구와 카운터가 보이는 은평본점 카페 내부 모습." 정확 생성).
- 정직한 범위 고지: "Drive→로컬" 절반은 Drive API 서비스계정 자격증명이 없어(외부서비스가입, CEO 승인 대상) 자동화 못함 — 현재는 세션이 Drive MCP로 다운로드 후 이 스크립트로 처리하는 반자동 방식.
- API 키 관리 원칙(§6) 감사: 채팅전달금지·`.env`전용·Git미커밋·로그미출력 4개 원칙 준수 확인. 운영/개발 키 분리는 미비(Vercel 환경별 값 분리에 의존) — TODO.md 기록. 부수로 `.env.local` 주석의 평문 DB비밀번호 제거(로컬전용, 유출 없었음).
- `npm run qa`/`audit` 통과, 신규 취약점 없음(`sharp` 설치 후 production 취약점 여전히 기존 2건뿐).

### Audit 백로그 정리 — 접근성 9건·Unused Import 8건·env 정합·npm audit 확인 (2026-07-23)
- **접근성 9건**: 실제 버그 8건 수정(섹션제목용 `<label>`을 `<p>`로 교체 6건, `PhotoUploader.tsx` 키보드접근성 2건). `components/ui/label.tsx`는 제네릭 컴포넌트 오탐으로 확인, 미수정.
- **Unused Import 8건**: 실제 미사용 1건(`NextRequest`) 수정. 나머지 7건은 audit 툴링 버그(`eslint.unused.config.mjs`에 `@next/next`·`react-hooks` 플러그인 미등록으로 인한 오탐) — 플러그인 등록으로 근본 수정.
- **env 정합**: `DATABASE_URL`/`DIRECT_URL`은 `database/prisma/schema.prisma`에서 실사용 중인데 audit 스캐너가 `.prisma`를 안 봐서 오탐 — 스캐너에 추가. `NODE_ENV`는 런타임 자동주입값이라 예제에 넣지 않는 게 정석 — 스캐너에 예외처리. `NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_CLARITY_ID`는 실제 미사용 확인돼 `.env.example`에서 제거.
- **npm audit**: high 1·moderate 1(Next.js 계열) 확인 — 수정에 Next.js 14→16 메이저 2단계 업그레이드가 필요해(breaking change) 자율 패치 보류, 별도 마이그레이션 계획 필요.
- 결과: `npm run audit` 총 발견 10건 → 1건(사전에 알려진 CompareSlider 중복, 별도 결정 대기).

### 디자인포비 회사소개(About) 섹션 신설 (2026-07-23)
- **배경**: CEO 요청 "디자인포비 소개문구 필요" → "자료에서 찾아서 스스로 작성" 지시. Drive에서 실제 사업자등록증·전문건설업 등록증·지명원 연혁 문서를 찾아 검증된 사실만으로 작성(추측·과장 없음).
- `components/home/AboutSection.tsx` 신설: 연혁 4단계(2000 법인설립 → 2009 실내건축공사업 등록 → 2013 GBRICK Coffee 런칭 → 2026 AI 공간 설계 도입) + 소개문. 근거: 사업자등록증(법인설립 2000.10.27)·전문건설업 등록증(은평-09-01-2, 2009.03.16)·지명원 연혁("2013년 지브릭커피 런칭").
- `app/page.tsx`에 Services→About→Process 순서로 삽입.
- 검증: Desktop 스크린샷 렌더 확인, `npm run qa`/`audit` 통과.

### 홈페이지 P2 완료 — 전화·이메일 연락 채널 추가 (2026-07-23)
- **CEO 결정**: 실시간 채팅 인프라 대신 전화(02-517-1474)+이메일(ceo@fobee.co.kr)로 P2를 완료.
- `CTASection.tsx`: 상담폼 아래 "폼 작성이 어려우시면 바로 연락 주세요" + `tel:`/`mailto:` 클릭 가능한 링크 추가.
- `Footer.tsx`: 기존 이메일 텍스트를 `mailto:` 링크로 전환, 전화번호 신규 추가(`tel:` 링크).
- 이로써 홈페이지 완성도 개선 P1(AI스튜디오 연결)·P2(연락채널)·P3(직접시공 차별화) 3건 모두 완료.
- `npm run qa`/`audit` 통과, 신규 이슈 0건.

### 홈페이지 완성도 개선 P1+P3 (AI 웹디자인전략가 실행 결과 반영, 2026-07-23)
- **배경**: CEO "홈페이지를 만들다가 말았다" 지적 → AI 웹디자인전략가(`designTrendAgent.ts`)를 실제 투입해 오늘의집(성공)·한샘(JS 렌더링으로 fetch 실패, 정직 보고) 대비 분석, P1/P2/P3 제안 도출 → CEO가 P1+P3 즉시 착수 승인(P2 실시간채팅은 채널 미정으로 보류).
- **P1(AI 스튜디오 진입 강화)**: `Hero.tsx`에 "로그인 없이, 30초 만에 무료로 확인할 수 있습니다" 마이크로카피 추가(체험 진입장벽 인지 낮춤). `ProcessSection.tsx`(How it works 5단계) 하단에 "지금 무료로 AI 공간 분석 시작하기" CTA 신설 — 기존엔 5단계를 보여주기만 하고 끊겨 있었음(주석에 "STEP 3~8 개발 완료 후 연결" 미완 상태로 남아있던 것 확인, 이번에 연결).
- **P3(직접시공 차별화)**: `TrustSection.tsx`에 "중개가 아닙니다 — 설계부터 시공까지, 26년째 저희가 직접 책임집니다" 문구 추가 — 경쟁사(중개 플랫폼)의 명시적 책임 한계 대비 차별화.
- **검증**: Desktop/Mobile 스크린샷으로 3곳 모두 렌더 확인, `npm run qa` exit 0, `npm run audit` 신규 이슈 0건.

### Meta/YouTube 실API 코드 구현 + CEO 발급 가이드 (2026-07-23)
- **배경**: CEO가 "AI Content Analyst·발행 인력 승격을 위해 CEO가 직접 API 가입 후 자격증명 전달"을 선택(제가 대신 가입할 수 없는 절차이므로).
- `content-automation-agent/src/analytics.py`에 Meta Graph API(Instagram/Facebook/Threads 인사이트)·YouTube Data API v3(OAuth refresh token 교환 포함) 실호출 코드를 공식 문서 기준으로 구현. 자격증명 없으면 여전히 dry-run 안전 폴백(무파괴 확인).
- `INSTALL.md` §6 신설 — Meta Developer 앱 생성·Instagram 비즈니스 계정 연결·Access Token 발급, Google Cloud Console YouTube Data API v3 활성화·OAuth Refresh Token 발급까지 CEO가 따라할 수 있는 단계별 절차.
- **정직한 기록**: 코드는 완성됐으나 실토큰으로 검증되지 않아 AI Content Analyst는 여전히 수습 등급 — CEO가 `.env`를 채우고 실행 결과를 전달하면 즉시 재검증.

### AI Trend Researcher 신규 구축 + AI Content Analyst 실행경로 마련 (2026-07-23)
- **배경**: CEO "착수지시" — 직전 보고에서 P2로 남겨둔 두 역할(Content Analyst 외부API 블로커, Trend Researcher 신규구축)에 대한 실행.
- **AI Trend Researcher**(신규): `content-automation-agent/src/trend_research.py` — `designTrendAgent.ts`와 동일 패턴(공개 소스 fetch+Gemini 분석)으로 키워드 수집→경쟁 콘텐츠 분석→기회 도출→`generate_osmu.generate()` 입력(topic/keywords) 산출까지 구현. 실행 중 Gemini가 마크다운 코드펜스로 JSON을 감싸 파싱 실패하는 문제를 발견해 `response_mime_type="application/json"` 강제로 해결(같은 수정을 `generate_osmu.py` 쇼츠 프롬프트에도 소급 적용). 위키백과 "커피전문점"·"카페" 2건 실fetch로 검증 — 키워드 7개·경쟁콘텐츠요약 4건·기회 3건·추천소스 생성 확인. 정규직 승격.
- **AI Content Analyst**: `analytics.py`에 `collect_manual()` 추가 — Meta/YouTube API 가입(외부서비스가입, CEO 승인 대상이라 자율착수 불가) 없이도 사람이 확인한 실측치를 입력하면 분석 가능해짐. `_improvement()`가 "미입력"과 "측정된 0"을 구분하도록 수정. 코드 경로는 예시값으로 확인(실데이터 아님 명시) — 진짜 게시물 지표가 아직 없어 승격은 보류, 실측치 입력 시 즉시 재검증 가능.
- [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7·§8, [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 갱신.

### Media OSMU 파이프라인 실Gemini 연동 (2026-07-23)
- **배경**: CEO가 직전 보고의 승인 필요 사항("Media 파이프라인 실LLM 연동, 비용 발생")에 "다음단계 진행"으로 명시 승인.
- `content-automation-agent/requirements.txt`에 `google-genai` 추가·설치. `generate_osmu.py`의 `_llm()`을 dry-run 스텁에서 실제 Gemini 호출(`gemini-flash-latest`)로 교체 — GEMINI_API_KEY 없거나 호출 실패 시에는 여전히 dry-run으로 안전 폴백(무파괴).
- 블로그·쇼츠 프롬프트에 브랜드 스타일가이드(`content-automation-agent/guides/gbrick-style.md`/`designpobee-style.md`) 전문을 주입해 SSOT 밖 사실을 지어내지 않도록 제약.
- **실행 검증**: `python generate_osmu.py` 실행 → `report.json`에 `"live":{"blog":true,"shorts":true,"sns":true},"dry_run":false`. `blog.md`가 승인 SSOT(8,636만원·3년 폐점 0건·7개 매장)와 법정고지를 정확히 반영한 실제 문장을 생성함을 직접 확인.
- **AI Blog Writer·AI Shorts Producer·Media Director → 정규직 재승격**(직전 재검증에서 하향됐던 것을 되돌림). AI Content Analyst·AI Trend Researcher는 이번 조치와 무관한 별개 갭(소셜 API 미연결·트렌드 리서치 코드 없음)이라 수습 유지.

### 인턴 10개 역할 재검증 — 승격 3건·유지 1건·하향 5건 (2026-07-23)
- **AI SEO Manager → 정규직**: `scripts/qa-extended.js checkSeo()`가 이미 실코드로 반복검증되고 있었음을 재검증 중 발견(16페이지 스캔, 진짜 공백 0건). 기존에 Media Workforce "인턴"으로 뭉뚱그려져 있었으나 실제로는 이미 실증된 역할이었음.
- **AI 마케터·AI CEO(전략)·AI 콘텐츠 → 정규직**: 승인된 SSOT(정보공개서 8,636만원·은평본점 2013년 개점)로 각 역할의 Notion 프롬프트를 직접 1회씩 실행, 산출물이 제약(법정고지·SSOT인용·과장금지)을 지킴을 확인.
- **AI CRM → 인턴 유지**: DB 실레코드 2건 확인했으나 발신자 `ceo@fobee.co.kr`+키보드 오타 메시지로 테스트데이터임을 확인, 코드도 CRUD뿐이라 검증 보류.
- **Media Director·Content Analyst·Trend Researcher·Blog Writer·Shorts Producer → 수습 하향**: `generate_osmu.py`/`analytics.py`를 직접 열어 `_llm()`이 `"[DRY-RUN::역할]"` 스텁만 반환함을 확인, 기존 output 파일도 전부 `"dry_run": true`. Trend Researcher는 코드 파일조차 없음 — "인턴(MVP)" 라벨 자체가 근거 없었음이 드러남.
- **AI CEO 역할로 직접 전략판단**: Media 파이프라인에 지금 실Gemini 연동을 넣을지 검토 → 비용 발생 항목이라 이번 재검증 범위 밖으로 결론, 보류.
- Notion 데이터 오류 수정: "AI Documentation" 프롬프트가 AI역할="AI CEO"로 잘못 태그돼 있던 것을 바로잡음.
- [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7·§8, [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 직원표 갱신.

### AI-STAFF-POLICY.md v1.0 신설 — AI 직원 운영지침 (2026-07-23)
- **배경**: CEO 질문 "AI 직원을 정규직으로 채용한다면 뭘 해야 하는가"에 대한 후속 조치.
- **직급 4단계 공식화**: 대기(미가동)/수습(초안)/인턴(MVP·1회 이하 검증)/정규직(활성·§2 승격기준 충족) — 기존 Notion "상태" 라벨을 고용 유비로 재정의.
- **실행권한 원칙 확정(CEO 결정)**: AI 직원은 제안까지만, 실행(코드 반영·메뉴 변경·발행 등)은 항상 사람 승인. 현재 AI 메뉴전략가·AI 웹디자인전략가 구현이 이미 이 원칙과 일치함을 확인.
- **승격/퇴출 기준 명문화**: 실데이터 종단 검증 여부를 기준으로 삼음. 이 기준을 기존 역할에 소급 적용한 결과 AI 마케터·AI CEO·AI 콘텐츠·AI CRM + Media Workforce 6명이 "활성" 라벨에도 불구하고 검증 기록이 없어 "인턴"으로 재분류됨(정직 기록).
- PROJECT-INDEX.md·DOCUMENT-INDEX.md·AI-HQ-MASTER.md 상호등록.

### AI 웹디자인전략가 · AI 메뉴전략가 신설 (2026-07-23)
- **배경**: CEO 요청으로 AI 조직도 완성도 실측(Notion AI Prompt Library+Media Workforce SQL 조회) → 23개 역할 중 실체 작동 6개(26%)뿐임을 확인해 보고. "경쟁사 분석+트렌드 기반 홈페이지 디자인"·"판매량+마진 기반 메뉴/이벤트 전략"이 조직도에 없는 갭으로 확인됨. CEO가 종합 판단에 찬성, 신설 지시.
- **AI 메뉴전략가**: `content-automation-agent/src/pos_import.py`에 전체 판매 집계(`전체_판매`, 기존엔 TOP10만 있어 저판매 메뉴 탐지 불가했음) 추가. `erp_engine.py`에 `menu_engineering()` 신설 — Menu Engineering Matrix(Kasavana & Smith 표준기법, 인기도 임계값=평균판매량의 70%) 판매량×마진 2x2 분류로 단종후보(Dog)·프로모션후보(Puzzle) 자동 산출, LLM 미사용(비용 없음). `/api/hq/erp`·`/hq/erp` UI에 연결. 실POS(2026-07-01~20)로 검증: 카페모카·자바칩프라페·레몬에이드=단종후보, 망고빙수=프로모션후보, 팥빙수=Star.
- **AI 웹디자인전략가**: `agents/designTrendAgent.ts` 신설 — 경쟁사 URL을 fetch해 텍스트 추출 후 Gemini로 강점/약점/트렌드요소 분석, 우리 홈페이지 대비 P1/P2/P3 실행 제안을 JSON으로 생성. `POST /api/hq/design-trends`로 노출하되 Gemini 호출이 비용을 발생시키므로 `requireAdmin()`(기존 `/api/admin/leads` 패턴 재사용)으로 인증 필수화 — 기존 `/api/hq/*`가 대부분 무인증이던 것과 달리 신규 보호 결정. 스타벅스코리아 실사이트로 실동작 검증(블루보틀코리아는 fetch 실패 사례로 정직하게 접근실패 보고 확인).
- Notion AI Prompt Library에 신규 역할 2건 등록(select 옵션 "AI 웹디자인전략가"·"AI 메뉴전략가" 신규 추가). AI-HQ-MASTER.md 직원표 갱신(미충족 갭에서 제외).
- env 없이 `npm run qa` exit 0(25 라우트 정상, `/api/hq/design-trends` 포함), `npm run audit` 신규 Dead Code/보안/깨진라우트 0건.

### `/api/hq/erp` 실엔진 산출물 라이브 연결 (2026-07-23)
- **문제**: `/hq`·`/hq/erp`는 이미 `/api/hq/erp`를 client fetch하도록 되어 있었으나(2026-07-22 완료), 그 API 자체는 `lib/hq/erpSnapshot.ts`의 손으로 옮겨 적은 TS 상수만 반환 — `erp_engine.py`/`pos_import.py`를 다시 돌려도 화면에 반영되지 않는 구조였음.
- **조치**: `app/api/hq/erp/route.ts`가 `content-automation-agent/output/erp_daily_report.json`·`pos_analysis.json`(엔진 실행 산출물)을 서버 파일시스템에서 직접 읽어, 기존 `ERP_SNAPSHOT`과 동일한 필드 형태(영문 키)로 변환해 반환하도록 변경(`source: "live"`). 산출물이 없는 환경(Vercel 등, `output/`는 `.gitignore`로 미추적)에서는 기존 스냅샷 상수로 안전 폴백(`source: "snapshot"`) — 무파괴.
- **검증**: `python erp_engine.py` 재실행 → 산출물 갱신 → env 없이 `npm run build` exit 0(24 라우트 정상) → Preview에서 `fetch('/api/hq/erp')` 직접 호출해 `source:"live"`·매출 16,627,700원·디저트 28종·메뉴원가 9종 실데이터 확인. `/hq/erp` 페이지 자체는 이 세션 dev 서버에 실 Supabase env가 로드되어 있어 `/login` 인증 게이트로 리다이렉트됨(기존 §13 동작, 정상) — API 레벨에서 직접 검증.
- **다음 우선순위**: (1) 엔진의 `menu_costs()`가 데모용 9개 메뉴만 계산 — Drive 01_MENU_MASTER 63종 전체로 확장 시 `masters.menus`도 실집계 가능. (2) 가맹점(P7) POS는 아직 본점만 연결 — 타 매장 POS 업로드 파이프라인 필요(자격증명/합의 필요, 다음 사이클). (3) PROJECT 8(본사 전용 뷰) 요구사항 미구체화 — CEO 확인 필요.

### MASTER INITIALIZATION 완료 (2026-07-22)
- CEO 4단계 지시(①docs/미추적원인분석 ②문서관리정책3단계 ③문서표준v1.0 ④확정후 MASTER INITIALIZATION) 완료. ①②③은 DOCUMENT-POLICY.md·DOCUMENT-STANDARD.md로 선행 완료(아래 섹션).
- **신규 문서 5건**(DOCUMENT-STANDARD §1 원칙에 따라 전부 루트에 생성, 기존 `docs/` frozen 영역 비접촉):
  - `AI-HQ-MASTER.md` — AI 직원 현황(실체 있음 vs 갭 정직기록)·보고규칙·QA/Audit·자동화현황·Priority·AI회의 현황(현재 단일AI 대체수행임을 정직기록).
  - `SYSTEM-ARCHITECTURE.md` — Mermaid 아키텍처 다이어그램(CEO→CTO→AI HQ→Homepage/ERP/Dashboard/Infra/Employees, Drive→Notion→ERP/Dashboard SSOT체인, GitHub→Vercel 배포체인).
  - `DECISION-LOG.md` — 주요 기술 결정 6건 소급기록(docs/gitignore·Docker구조3안·CEO승인범위해석·포트정책·docs재검토·문서배치·AI-HQ-SYSTEM-RULES 미생성).
  - `CEO-REPORT.md` — CEO 보고 형식 정본 확정(이전 CLAUDE.md§16·CEO-CHARTER§16-C 버전을 이 문서로 통합, 폐기하지 않고 "이전 버전"으로 보존).
  - `PROJECT-STRUCTURE.md` — 최상위 폴더 트리(경량 참조, SYSTEM.md/PROJECT-INDEX.md와 중복 없이 트리 자체만).
- **원래 요청분 중 미생성 결정 2건**(DECISION-LOG.md에 근거 기록): `AI-HQ-SYSTEM-RULES.md`는 CLAUDE.md와 목적 중복이라 판단해 생성하지 않음(CLAUDE.md를 정본 지정). ROADMAP/TODO/CHANGELOG/PROJECT-INDEX/DOCUMENT-INDEX/README/INSTALL/CLAUDE/CEO-CHARTER는 이미 루트에 존재 — 재생성 대신 기존 문서 유지.
- PROJECT-INDEX.md §7·DOCUMENT-INDEX.md에 신규 5건 상호등록. 문서 총계 67개로 재확정(`find -name "*.md"` 직접 카운트).
- `npm run qa` 재검증: exit 0(lint+type-check+build, 24 라우트 정상 컴파일).

### 문서 관리 정책 확정 (DOCUMENT-POLICY·DOCUMENT-STANDARD v1.0) (2026-07-22)
- **docs/ 미추적 원인 확정**(`git blame` 직접 확인): 커밋 `5f0fbd61`(2026-07-20)에서 의도적 보안 결정으로 추가됨(정보공개서 재무·창업비용 등 민감정보를 당시 PUBLIC 저장소 노출로부터 보호). 실수 아님. **저장소가 지금도 여전히 PUBLIC**(GitHub API 재확인, CEO의 Private 유지 결정은 승인됐으나 CTO에게 GitHub 관리자 자격증명이 없어 미실행) → 이 보호는 현재도 유효·필요.
- **DOCUMENT-POLICY.md** 신설: 문서 3단계 분류 — ①Git 관리(루트, 비민감) ②Git 제외(`docs/`, 민감+저장소 공개 상태) ③Google Drive 관리(원본 SSOT, 로컬 미복제).
- **DOCUMENT-STANDARD.md v1.0** 신설: PROJECT-INDEX/DOCUMENT-INDEX 기준 표준 구조 — 신규문서 배치규칙(민감→docs/, Drive원본복제금지, 그외→루트)·명명규칙·중복처리(삭제보다 정본지정 우선)·버전관리·상호참조·색인유지 규칙. MASTER INITIALIZATION 신규문서는 전부 루트에 생성하기로 확정(기존 frozen docs/ 비접촉).
- PROJECT-INDEX.md·DOCUMENT-INDEX.md에 신규 문서 2건 상호등록(자기 규칙 즉시 적용).
- env 없이 `npm run qa` exit 0.

### 문서 체계 정리: PROJECT-INDEX·DOCUMENT-INDEX 신설 (2026-07-22)
- **전수 조사**: `find -name "*.md"` 직접 실행 → **60개** 문서 확인(루트 15·content-automation-agent 6·docs/ 39). docs/ 전체가 `.gitignore`(`docs/`)로 **Git 미추적** 확인(`git ls-files docs/` = 0건).
- **안전 원칙 발견**: CEO 지시("삭제는 Git 복구 가능한 경우만") 적용 시, docs/는 Git 이력이 없어 삭제하면 **복구 불가**. docs/ 내용은 **삭제하지 않기로 결정**(중복이어도), 색인으로 정본/구버전만 표시.
- **실제 중복 2건 확인**(파일명 대조, 크기·타임스탬프 비교): `AI_ORGANIZATION_MASTER.md`·`BACKLOG.md`가 `docs/organization/`(구버전)·`docs/master/`(같은 날 40분 뒤 작성, 정본)에 중복 존재. `overview.md`는 폴더가 달라(api/·architecture/) 실제 중복 아님(오탐 배제).
- **PROJECT-INDEX.md** 신설: 프로젝트를 10개 영역(AI Headquarters·Homepage·ERP·Automation·Dashboard·Infrastructure·Documentation·Knowledge·Media·Archive)으로 분류, 각 목적·담당·폴더·문서 연결. 활성(루트, Git추적) vs frozen(docs/, 미추적) 구분 명시.
- **DOCUMENT-INDEX.md** 신설: 60개 문서 전체를 카테고리별 자동 분류, 중복 분석 결과 표 포함.
- **통합/삭제 제안**: 통합 대상 없음(루트 문서는 목적이 서로 달라 통합 불필요). 삭제 후보 없음(docs/는 미추적이라 삭제 원칙 미적용).
- env 없이 `npm run qa` exit 0 재확인.

### Dead Code 삭제 실행 + ERP 상세 페이지 라이브 연결 (2026-07-22)
- **Dead Code 7건 삭제**: CEO-CHARTER §16-B③ 승인 조건(참조 재확인→삭제→Build/Test 통과→문제 시 즉시 복구) 충족 확인 후 `components/{Faq,Footer,Header,Hero,HowItWorks,StyleCards,StyleGallery}.tsx` 삭제. 삭제 전 grep으로 전체 코드베이스 참조 0건 재확인, 삭제 후 env 없이 `npm run build` **재실행 exit 0** 확인.
- **`/hq/erp` 라이브 API 연결**: `app/hq/erp/page.tsx`가 정적 `ERP_SNAPSHOT` import 대신 `/hq`(CEO Dashboard)와 동일한 패턴으로 `/api/hq/erp`를 client fetch하도록 전환(초기 렌더는 스냅샷으로 즉시 표시 후 라이브 데이터로 갱신, 무깜빡임). 이제 `/hq`·`/hq/erp` 둘 다 라이브 API 연결 완료. `app/hq/[section]/page.tsx`(가맹점/물류/교육/콘텐츠/직원/설정)는 아직 정적 — 다음 증분 대상.
- **디저트 정밀원가 재확인**: `content-automation-agent/src/dessert_import.py` → `erp_engine.py` `_dessert_menu()`/`_dessert_summary()` 연결 기존 완료 상태 확인(2026-07-20 커밋에 이미 존재), 이번 실행에서 추가 작업 불필요.
- **P7 가맹점 뷰**: `app/hq/[section]/page.tsx`(franchise 섹션)에 7개 매장 로스터 + 본점 실적 이미 구현됨(기존). **P8 본사 뷰**: `/hq`(CEO Dashboard)가 매출·원가·재고·발주 통합 실데이터 뷰로 이미 그 역할 수행 중 — 별도 "PROJECT 8" 문서/코드에 명시적 정의를 찾지 못했으며, 전용 화면이 필요하면 다음 사이클에 요구사항 구체화 필요(CEO 확인 권장).
- env 없이 `npm run build` 2회(삭제 전/후) 모두 exit 0, `npm run lint` clean.

### 재검증: CEO가 C:\AI-HQ에서 파일 없음 보고 → 원인 확인 + 재실행 (2026-07-22)
- **원인**: CEO가 확인한 `C:\AI-HQ`(드라이브 루트)는 **이 프로젝트와 무관한 별도 폴더**(backup/compose/dashboard/data/docker/knowledge/logs/projects/scripts/workspace 하위 전부 비어있음, `Google Docs.lnk` 바로가기만 존재). 이 세션은 처음부터 끝까지 `D:\Project\ReRoomAI\`에서만 작업했으며 `C:\`에는 아무 파일도 생성한 적 없음(직접 확인).
- **실제 위치 재확인**(경로+크기+수정시각+git 추적 여부 모두 확인): `D:\Project\ReRoomAI\AI-HQ\docker-compose.yml`(1410바이트)·`Dockerfile`(671바이트)·`content-automation-agent\Dockerfile`(368바이트)·`.env.example`(양쪽)·`INSTALL.md`·`README.md` 전부 존재, `git ls-files`로 추적 확인, 커밋 `cb85763`에 포함되어 이미 GitHub `main`에 푸시됨.
- **`docker compose up -d` 실제 실행**(이전엔 `run`만 검증, `up -d` 미검증이었음 — 지적 타당): 컨테이너 `ai-hq-web-1` **기동 후 3분 이상 생존 확인**, `docker ps`로 직접 확인, `curl http://localhost:3011` **HTTP 200**, 콘텐츠 마커(DesignFOBEE/공간을넘어) 확인. 포트 3000 호스트 충돌(기존 dev 프로세스, 안 건드림) → `WEB_PORT` 환경변수로 오버라이드 가능하도록 compose 개선.
- **보고 절차 수정**(재발 방지): 이후 "구축/기동 완료" 보고 시 반드시 ①절대경로 명시 ②`git ls-files` 추적 확인 ③실행 중인 컨테이너를 `docker ps`로 직접 확인 ④HTTP 응답 확인을 **같은 보고에 함께** 제시한다. INSTALL.md에 프로젝트 루트 경로를 명시해 향후 경로 혼동을 방지.

### CEO Operating Charter v1.0 갱신 + Docker Compose 인프라 구축 (2026-07-21)
- **CEO-CHARTER.md 갱신**: 승인 대상 5항목(데이터삭제·비용발생·외부서비스가입·GitHub공개변경·정책변경)으로 재정의. Dead Code(소스코드) 삭제는 CTO 해석상 보류 유지 — 직전 명시적 지시와의 충돌 가능성을 문서화하고 신중을 택함(§문제해결규칙).
- **Docker Compose 인프라**(`AI-HQ/docker-compose.yml`, 헌장 §Docker규칙): `web`(Next.js, 상시)·`erp`(Python ERP/Media, 온디맨드) 2서비스. Dockerfile은 각 서비스 폴더 유지, 오케스트레이션만 AI-HQ/ 소유(구조결정 근거 3안 비교 → AI-HQ-ARCHITECTURE.md).
- **실행 검증(실제 빌드·기동, 추측 없음)**: `docker compose build web/erp` 둘 다 exit 0 → 이미지 생성. `docker compose run erp`가 **실제 실행**되어 ERP 대시보드 JSON을 로컬 실행과 동일하게 출력. `docker compose run -p 3011:3000 web` 기동 → `curl` **HTTP 200**, "DesignFOBEE"·"공간을 넘어" 마커 확인. 검증 후 컨테이너 정리 완료.
- **사고 발견·즉시 시정**: 검증 중 `docker compose config`가 `.env.local`의 실제 시크릿(Gemini/Supabase 키)을 표준출력에 노출 → 즉시 로그파일 삭제(git/원격 노출 없음, 로컬 한정 확인) → 이후 `config --services`로 절차 변경, INSTALL.md에 경고 명시.
- **신규 문서**(§문서규칙): INSTALL.md·AI-HQ-ARCHITECTURE.md 신설. CLAUDE.md §16 보고형식·§16-A 승인규칙 새 헌장에 정합.
- `.dockerignore`·`content-automation-agent/requirements.txt` 추가. `npm run qa` 회귀 없음(재확인 exit 0).

### CEO Delegation Charter + QA/Audit 시스템 구축 (2026-07-21)
- **CEO-CHARTER.md 채택**: 최상위 명령. 승인 규칙 5항목(정책변경·삭제·비용발생·외부공개·데이터구조변경)으로 축소, 그 외는 연속 자율실행. CLAUDE.md §16/16-A 갱신 반영.
- **QA 확장 시스템** (`npm run qa:extended`, §9): Accessibility(jsx-a11y)·SEO(metadata 상속 추적)·Broken Link(라우트 매칭)·Image(disable주석 인지)·Performance(번들 예산) 5종 실제 검사, QA-REPORT.md 자동 생성. **검증 실행 결과(2026-07-21)**: 실제조치 9건(a11y — label 미연결 7·키보드접근성 2), SEO공백 0, 깨진링크 0, 미검토이미지 0, 예산초과 0.
- **Audit 시스템** (`npm run audit`, §10): Dead Code(연쇄전파 포함)·중복컴포넌트·Unused Import·Broken Route·독립 Build·Security(시크릿+npm audit)·Env Var·Git Status 8종, audit-report.md 자동 생성. **검증 실행 결과**: Dead Code 7건(components/{Header,Footer,Hero,Faq,HowItWorks,StyleGallery,StyleCards}.tsx, 전부 CEO 승인 대기·미삭제)·중복 4쌍·Unused Import 8건·Broken Route 0·Build PASS·하드코딩시크릿 0·npm audit(high 1, moderate 1)·env 문서화갭 1(NODE_ENV)·env 미사용선언 4건.
- **자기검증으로 스크립트 버그 2건 직접 발견·수정**(§10 다른 AI를 믿지 않는다): ① Dead Code 체커가 basename 접미사만 비교해 동명이경로 파일(Header.tsx 등)을 오판정 → 정확한 import-specifier 경로해석으로 수정, 재실행 검증. ② SEO/Image 체커가 상속 metadata·disable주석을 몰라 오탐 다수 발생 → 상위 layout 상속 추적 + disable주석 인지 추가, 재실행 검증(9건 오탐 → 0건).
- **AI 조직 4개 역할 신설**(실체 있는 시스템 뒷받침, Notion AI Prompt Library): AI QA·AI Audit·AI Security·AI Documentation. 나머지(COO·PM·Research·Interior·UX 등)는 실체 없이 조작하지 않고 TODO에 갭으로 정직 기록.

### Creative Director — 홈 리디자인 (2026-07-21, CEO 승인)
- **Hero 재구성**: 다크 텍스트 → **공간사진 풀블리드 + 브랜드 먼저**("공간을 넘어, 경험을 디자인 · 26년") + **CTA 2트랙**(상담·견적 문의 / AI로 미리보기). 데스크톱·모바일 Preview 검증.
- **포트폴리오 승격**: 홈 2번째 섹션으로 이동 + **카테고리 필터**(전체/카페/오피스). 전 이미지 로드 확인(network 200).
- QA(lint+tsc+build) 통과 × 각 증분. (남은 승인 항목: 스크롤 인터랙션·에디토리얼 팔레트 홈 확장)

### AI HQ 헌장 채택 + Hardening (2026-07-21)
- **CLAUDE.md 헌장 v1.0** 확정 + 문서 6종(README·CHANGELOG·ROADMAP·TODO·SYSTEM·API) 완비 + `npm run qa` 스크립트.
- **/hq 인증 게이트**(§13): 미들웨어에서 env 있을 때 비로그인 → `/login?redirect=/hq`, env 없으면 데모 렌더(빌드 안전). `npm run qa`(lint+tsc+build) 통과.

### GBRICK AI SYSTEM Master Command (2026-07-21 이어서)
- **디저트 원가율 100% 완성** ✅: `src/dessert_import.py` — 지브릭커피 디저트단가표(xlsx) 파싱 → 28품목 원가·판매가·원가율(output/dessert_menu.json). erp_engine 이 읽어 디저트 요약 반영(평균 판매가 4,411원·**평균 원가율 49.9%**, 고원가 가나슈초코케이크 62%). /hq/erp 웹에 디저트 원가 테이블 표시. 음료 22.6% vs 디저트 49.9% 대비 노출.
- **디저트 정밀원가** ✅: 제원 단가표(생지/디저트 xlsx)에서 실 매입 개당단가 12품목(베이글 500~650·크로아상 630·머핀 750~900·마들렌 300~550) → erp_engine 연결. 평균 매입 640원.
- **P7 가맹점 뷰 + 물류 뷰** ✅: `/hq/franchise` 전국 7매장 로스터(직영1+가맹6, 폐점0)·본점 실적 · `/hq/logistics` 발주 집계. env 없이 빌드 OK.
- **/api/hq/erp** 라이브 JSON 엔드포인트 추가.
- **HQ 8섹션 실데이터 완성**: AI 직원(6 역할+13 Media Worker)·교육센터(교육체계)·설정(SSOT 요약) 채움. 이제 CEO Dashboard·ERP·가맹점·물류·교육·콘텐츠·AI직원·설정 전부 실데이터/실조직 표시. env 없이 빌드 OK.

### GBRICK AI SYSTEM Master Command (2026-07-20)
- **AI HQ 웹 셸 (PROJECT 5)** ✅: `/hq` 라우트 + 8메뉴 사이드바(CEO Dashboard·ERP·가맹점·물류·교육센터·콘텐츠센터·AI직원·설정). CEO Dashboard·ERP는 **실데이터**(매출 16,627,700원·재고부족 15·원가율 22.6%), 나머지는 연결 스텁. 로그인 헤더에 AI Headquarters 링크. env 없이 빌드 OK(exit 0)·Preview 렌더 확인. `lib/hq/erpSnapshot.ts`(SSOT 스냅샷) → 추후 라이브 API 대체 가능.
- **INGREDIENT/OPTION/SUPPLIER 마스터** SSOT 등록 + ERP 옵션단가 8종·원재료 57품목 연결(정밀단가는 SUPPLIER 매핑 대기).
- **PROJECT 1 (Drive 전체 분석·MASTER INDEX)** ✅: GBRICK_AI_SYSTEM 11개 공식 폴더 전수 열거 → Notion에 MASTER INDEX 자동문서화(구조·핵심 마스터·중복 버전 분석·누락/확인대기·연결관계). SSOT=Drive.
- 세션 누적으로 이미 구축: P6 ERP 엔진(실데이터)·P9 OSMU+7퍼블리셔·P4 메뉴/원가·P10 Living Document·P11 AI Prompt/Workforce·Master DB(SSOT). (상세 최종보고서 참조)
- 미구축(멀티세션/자격증명/설계결정 필요): P2 홈 전 페이지·P3 포트폴리오 자동분류·P5 AI HQ(로그인)·P7 가맹점·P8 본사·P10 완전자동감지·P12 자동테스트스위트·P13 전수검수.

### AI OS 업그레이드 (2026-07-20)

#### Priority 1 — SSOT (Master DB) ✅ 완료 (MVP)
- **Master DB (SSOT) 레지스트리** 생성 (Notion, Company Knowledge Base 하위) — `fb9143dc7e9946af8da0926e143d4561`.
- **정본 10개 데이터셋 등록**: Franchise Facts/창업비용/재무/가맹점/FAQ, AI Prompt Library, Change Report, Portfolio(대기), 메뉴원가(제안), CompanyProfile(대기). 각 행 = 도메인·담당 AI 역할·레코드수·버전·도메인 DB 링크·접근정책·최종갱신.
- **SSOT 접근 정책 명문화**: 모든 AI는 Master DB만 참조, Drive/Sheet 직접 읽기 금지, 변경은 Change Report 경유.
- **2-Plane 정의**: 운영 SSOT=Notion Master DB / 실행 앱 SSOT=코드(`prompts/*`,Prisma), Living Document로 정합.
- **테스트**: notion-fetch로 Master DB 단일 질의 → 스키마+10개 데이터셋 조회 확인. ✅

#### GBRICK AI ERP Phase 3 — 실데이터 엔진 ✅ MVP (기존 구조 연결, 새 폴더 없음)
- **`src/erp_engine.py`**: MASTER_DB Reader(MENU/RECIPE/INVENTORY 스냅샷, Drive=SSOT) + 계산 체인(레시피→원재료 차감→재고→안전재고→**자동 발주추천**→원가→일일리포트→대시보드).
- **실데이터**: 01_MENU_MASTER v1.4(실매장가)·09_MENU_COST_TABLE(원가율)·05_RECIPE_ADE v1.1(레시피)·재고관리 DB(현재/적정/부족).
- **테스트 통과(exit 0)**: 재고부족 15건·긴급발주 3건·발주추천 TOP(딸기라떼소분 6)·평균원가율 22.6%·고원가경고(카페모카 30.9%). `output/erp_daily_report.json`·`erp_dashboard.json` 생성.
- **Master DB(SSOT) 등록**: MENU/RECIPE/INVENTORY_MASTER 3건(Drive 링크=SSOT).
- **POS Excel Import(Priority 2)** ✅: `src/pos_import.py`(openpyxl) — 실제 POS 마감 Excel(clsProd) 파싱. **테스트: 상품 182종·판매 5,406잔·매출 16,627,700원·할인 169,250원·판매순위/카테고리** 산출(output/pos_analysis.json). erp_engine 대시보드에 실매출 연결. Master DB 등록.

#### Media OS Phase 2 — 7 Publisher 완성 ✅ (기존 구조 연결, 새 폴더 없음)
- **`src/publishers.py`**: YouTube·Blogger·Naver·Instagram·Threads·Facebook·TikTok 7종 Publisher (우선순위 순). OAuth 인증(Google refresh→access / Meta / TikTok / Naver), 의존성 없이 stdlib urllib.
- **`base_publisher.py` 강화**: **CEO 승인 게이트**(approved=False → '승인대기', 업로드 금지) + dry-run/실업로드 분기 + 성공 리포트(output/report_<platform>.json) + 실패 로그(logs/).
- **`src/publish_all.py`**: 오케스트레이터(생성물→승인→7종 배포→통합 report). 기본 Private 가드레일.
- **테스트 통과**: `publish_all` 승인없음→7종 '승인대기', `--approve`→7종 dry_run(키 없어 안전). 리포트 8개·로그 7개 생성 확인. exit 0.
- 🔌 실업로드: `.env`에 각 플랫폼 OAuth 키 입력 + DRY_RUN=false + approved → `_do_publish()` 실행(코드 완비).

#### AI Media Automation OS (v3.0 모듈) ✅ MVP
- **`content-automation-agent/` 워크스페이스** 신설: guides/src/output/assets/templates/prompts/logs/config + README + .env.example + config.
- **OSMU 생성기**(`src/generate_osmu.py`): 1 소스 → blog/blogger/naver.md·shorts/youtube.json·instagram/facebook/threads/x.txt·report.json 생성. **테스트 통과(exit 0, 산출물 10종)**.
- **가드레일 내장**(`src/base_publisher.py`): API키는 .env만, 기본 dry-run/Private, 자격증명 없으면 강제 dry-run, 실패 시 logs/ 저장.
- **성과 환류**(`src/analytics.py`): 지표→분석→Living Document Change Report 제안(상태=제안, CEO 승인 게이트 준수).
- **AI Media Workforce DB**(Notion) + 13 Worker 등록(Director/Trend/Blog/Shorts/Voice/Video/Thumbnail/SEO/Instagram/YouTube/TikTok/Naver/Analyst), 각 Mission/SOP/KPI.
- **가이드**: gbrick-style·designpobee-style(브랜드 SSOT).
- **Master DB 등록** + `.gitignore`(.env/output/logs 제외).
- 🔌 업로드 API(YouTube/Meta/TikTok/Naver/Blogger)·Voice/Video 생성 = OAuth 자격증명+플랫폼 심사 후 활성(그 전 dry-run).

### 이전 완료 (이번 세션)
- **Living Document 자동 루프**: Change Report DB(상태머신) + SOP + CEO 승인 게이트. 메뉴원가 PDF로 1사이클 실증(제안 3건).
- **AI 역할팀**: AI Prompt Library + 6개 역할 시스템프롬프트(디자이너/견적/마케터/CRM/콘텐츠/CEO).
- **ReRoom→DesignFOBEE UI 통합**: 무로그인 AI 스튜디오(`/design`), 공통 테마·브랜드 치환.
- **Portfolio 실제 교체**: GBRICK 매장 실제 사진 5장 + 에디토리얼.
- **반응형**: Desktop/Tablet/Mobile 점검, 태블릿 내비 수정.
- **배포 자동화**: `git push → Vercel 자동배포`, env 없이 빌드되도록 미들웨어 가드 + auth 페이지 동적화.
- **Franchise KB**: 정보공개서 SSOT 63레코드(출처·공개범위·법정고지).
