# CHANGELOG — DesignFOBEE AI OS

모든 주요 변경을 기록한다. AI OS 업그레이드는 Priority 단위로 추적한다.

## [Unreleased]

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
