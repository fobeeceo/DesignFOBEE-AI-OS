# CHANGELOG — DesignFOBEE AI OS

모든 주요 변경을 기록한다. AI OS 업그레이드는 Priority 단위로 추적한다.

## [Unreleased]

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
