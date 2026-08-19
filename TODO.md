# TODO — DesignFOBEE · GBRICK AI HQ

> CEO-CHARTER.md §16-B 승인규칙 적용(2026-07-21 최종 갱신): 실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경 6항목만 CEO 승인 대상. 그 외(Dead Code 삭제 포함)는 자율 진행. `[x]`=완료·검증, `[ ]`=대기.

## 긴급 (2026-07-29 발견, 07-29 재확인)
- [ ] **Supabase 프로젝트 연결 실패(재확인 완료, 여전히 미해결)**: `npx prisma db pull`로 DATABASE_URL 직접 연결 재테스트 → 동일 에러(`tenant/user postgres.edwnvwawckfdarsxobah not found`). 원인/해결/영향범위/재발방지 4단계 진단은 DECISION-LOG.md 2026-07-29 참조. **대표님이 supabase.com 대시보드에서 프로젝트 재개 필요**(Claude Code는 Supabase 접근 도구 자체가 없어 대신 처리 불가). 재개 후 Vercel 환경변수(NEXT_PUBLIC_SUPABASE_URL 등) 실제 설정 여부도 같이 확인 필요.
- [ ] **Supabase 자동 일시정지 재발방지 결정 필요**: (a) 매일 가벼운 헬스체크 쿼리를 날리는 예약 작업 추가, 또는 (b) 유료 플랜 전환 — 어느 쪽이든 비용/운영 방식 변경이라 CEO 결정 필요(CEO-CHARTER 승인 대상).

## CEO 승인 대상 (6항목 규칙 해당)
- [ ] **Hermes Agent 노트북 설치**(대표 지시 2026-08-11, Owner Action Required): 설치 절차·디스코드 봇 생성·GBRICK 스킬까지 [HERMES-SETUP-WINDOWS.md](HERMES-SETUP-WINDOWS.md)에 준비 완료(약 40분). **Claude Code는 대표님 노트북에 접근할 수 없어 대신 실행 불가** — 대표님이 직접 PowerShell에 붙여넣으셔야 한다. 유료 모델 선택 시 CEO-CHARTER §16-B 2항목(비용 발생·외부 서비스 가입) 해당하나 대표님 본인 결정이므로 진행 가능. 무료(로컬 Ollama)로 먼저 확인 권장.
- [ ] **`/api/hq/courier/morning` main 병합·배포**: 헤르메스 스킬이 이 API를 호출하는데 현재 작업 브랜치에만 있어 `www.fobee.co.kr`에서 404다. 병합·배포해야 아침 브리핑이 동작한다.
- [ ] **`N8N_SERVICE_TOKEN` 운영 환경 확인**: 헤르메스가 브리핑 API를 호출하려면 필요. Vercel 환경변수에 설정돼 있는지 확인하지 못했다 — 없으면 401.
- [ ] **Hermes Agent 도입 여부 결정**(비용 발생 + 외부 서비스 가입, 2026-08-11 신설): 대표님이 영상에서 보신 자율 에이전트(Nous Research, MIT 오픈소스). 계획서는 [HERMES-AGENT-PLAN.md](HERMES-AGENT-PLAN.md)에 작성 완료 — 사양·추정비용(월 3만~15만원, **실측 아님**)·8단계 절차·대표님 직접 작업 구간이 정리돼 있다. **권고: n8n으로 아침 브리핑 자동 전달을 먼저 띄운 뒤 얹는다**(순서를 바꾸면 브리핑이 안 갔을 때 원인 구분이 어렵다). 계획서 §5 1~3단계(조사·결정 준비)는 승인 없이 진행 가능.
- [ ] **아침 브리핑 자동 전달 연결**(2026-08-11 신설): `/api/hq/courier/morning`으로 브리핑 생성까지는 완료·실행 확인했으나, **호출해줄 주체가 없어 대표님께 자동으로 가지 않는다.** 현재 채널 4개(이메일·Discord·Notion·Telegram)가 전부 미연동이라 봉투가 전부 "전달 불가"로 남는다. 최소 하나(Resend `RESEND_API_KEY` + `LEAD_NOTIFY_TO`가 가장 빠름)를 연결해야 실제 전달이 시작된다.
- [ ] **저장소 Private 전환**(GitHub 공개여부 변경) — 2026-07-28 CEO 채팅 승인 완료. 단, Claude Code에 GitHub CLI·API 토큰이 없어 대신 실행 불가 — 대표님이 [Settings → Danger Zone → Change visibility](https://github.com/fobeeceo/DesignFOBEE-AI-OS/settings)에서 직접 전환 필요(Owner Action Required).
- [ ] **`prompts/pricing.ts` 실제 단가 교체**(정책/데이터) — 디자인포비 실제 단가 필요.
- [ ] **API 키 운영/개발 분리**: CEO MASTER 업무지시서 §6 원칙(예: Gemini Dev/Prod 별도 키)과 현재 방식(Vercel 환경별 값 분리, 변수명은 동일)이 다름 — 어느 쪽을 표준으로 할지 결정 필요([INSTALL.md](INSTALL.md) §7). AI CEO(전략) 에이전트 자체 분석 결과 "현재 방식 유지 + CI 검증스크립트 추가"를 권고(DECISION-LOG 참조, 최종 결정은 CEO).
- [ ] **이메일 실발송 자동화**: 현재 Gmail 연동은 초안(draft) 생성까지만 가능, 실제 발송 기능 없음 — CEO 다이제스트를 완전자동 발송하려면 별도 자격증명/도구가 필요(외부서비스가입 소지).
- [ ] **카카오톡 채널 연동**: CEO가 요청한 두 번째 채널(카카오톡 요약발송)은 현재 연동된 도구가 없음 — 카카오 비즈니스 API 등 외부서비스가입 필요.
- [ ] **n8n 아침 브리핑 활성화**(2026-07-25 신설): n8n에 워크플로("AI HQ - 아침 브리핑", id `toB3sf8BJpWaJNIl`)까지는 만들었으나 Gmail·Google Calendar OAuth2 credential은 CEO 본인 구글 계정 인증이 필요해 Claude Code가 대신할 수 없음 — 절차는 [INSTALL.md](INSTALL.md) §9 참조(외부서비스가입 소지). 완료 전까지 워크플로는 inactive.
- [ ] **n8n 메뉴전략 승인 워크플로 활성화**(2026-07-25 신설): 워크플로("AI HQ - 메뉴전략 승인(Telegram+Notion)", id `lgLgyt0lw5Q78Kgc`)와 Notion "AI 제안함" DB까지는 완성. Telegram Bot(§10)·Notion Internal Integration(§11) 두 credential은 CEO 본인 계정 작업이 필요 — 절차는 [INSTALL.md](INSTALL.md) §10·§11 참조. 완료 전까지 워크플로는 inactive.
- [ ] **n8n 웹디자인 트렌드 제안 자동등록 워크플로 활성화**(2026-07-28 신설): 워크플로("AI HQ - 웹디자인 트렌드 제안 자동등록(Notion)", id `b4LV2B4n43btf6Qg`)까지는 완성(매주 월 09:00 → `/api/hq/design-trends` 조회 → Notion "AI 제안함"에 `상태=대기`·`적용범위=홈페이지 UI/콘텐츠`로 등록). 메뉴전략 워크플로와 동일하게 Notion Internal Integration credential(§11)이 CEO 본인 계정 작업으로 연결돼야 활성화됨 — 완료 전까지 inactive.

## 자동화 재점검 (2026-07-28 발견 — Claude Desktop 재설치 이후 유실 추정)
- [x] **`gbrick-ai-os-build`·`ai-proposal-implementer` 스케줄 재등록**(2026-07-28, CEO 채팅 승인): SKILL.md 파일은 남아있었으나 실제 예약이 전부 유실돼 있던 것을 발견 → CEO 확인 후 `mcp__scheduled-tasks__create_scheduled_task`로 동일 내용 그대로 재등록. `gbrick-ai-os-build`(매일 09:30대, main 자동 push 포함)·`ai-proposal-implementer`(매일 10:00대, push 없음) 둘 다 재가동.
- [x] **`auto-order-recommender` 신설·활성화**(2026-07-28, CEO 채팅 승인): `content-automation-agent/src/erp_engine.py`에 `purchase_orders()` 추가(공급처는 SUPPLIER_MASTER 미구조화로 "미배정" 정직 표기) + Notion "AI 발주 승인" DB 신설(https://app.notion.com/p/e4181883090c4e74b4bbaf3464dbe9fb) + 오늘자 발주서 초안 15건 등록 + 매일 09:00대 스케줄 등록 완료(실주문 없음, Notion 승인 큐 등록까지만).

## GBRICK AI HQ 업무지시서 v1.0 실행 (2026-07-29, CEO 지시·승인 없이 순차 진행)
- [x] P1 자동화 스케줄 재확인: 3건(gbrick-ai-os-build·ai-proposal-implementer·auto-order-recommender) 전부 등록 상태 확인. auto-order-recommender는 오늘 09:03경 첫 실행 성공(신규 항목 없어 조용히 종료 확인, 중복 생성 없음). 나머지 둘은 등록만 되고 오늘 첫 실행 시각이 아직 안 지나 결과 미확인(내일부터 lastRunAt 확인 가능).
- [x] P2 SUPPLIER_MASTER 컬럼 고도화: Google Docs(`01_SUPPLIER_MASTER v1.3` 신규, v1.0~1.2 유지)·Notion·`erp_engine.py` 3곳에 거래처/단위/공급단가/최소주문수량/LeadTime/발주요일/최근단가변경일/비고 컬럼 동일 구조로 반영. 단가 등은 원본에 값이 없어 전부 "확인대기"(추측 없음).
- [x] P3 자동 발주 고도화: `purchase_orders()`에 부족률·예상금액(단가 확인시만) 추가, `supplier_order_totals()` 신설. 이메일 초안 생성은 `auto-order-recommender` SKILL.md에 절차 추가(승인건 대상, Gmail draft만, 발송 금지) — 현재 "승인" 상태 건이 없어 실행 미검증(다음 승인 발생 시 확인).
- [x] P4 Dashboard KPI 개편: `/hq` 첫 화면을 7개 KPI로 재구성(매출·발주승인대기·긴급재고·AI실패건수·오늘일정·AI작업완료율·전국매장현황). 뒤 3개는 실데이터 연결 전이라 점선+"연결 필요"로 명시.
- [x] P5 OAuth 점검: Gmail·Google Calendar는 이 세션 커넥터로 실제 연결 확인(캘린더 목록·초안 조회 성공). Notion·GitHub·Vercel 정상. Telegram은 Bot 자체가 없어 미연결. Supabase는 위 "긴급" 항목 참조.
- [x] P6 GitHub 운영정책: Private 전환은 Owner Action Required로 위에 정리, AI가 직접 설정 변경하지 않음.
- [x] P7 AI 직원 점검: AI QA·AI Audit·AI SEO Manager·AI Documentation은 오늘 직접 재실행해 정상 확인(npm run qa/qa:extended/audit/check-docs-sync, 신규 이슈 없음 — label.tsx 오탐 1건은 기존에 정리된 것과 동일). 나머지 9개 정규직 역할은 오늘 재실행하지 않음 — [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7(2026-07-23 마지막 검증)이 최신 기준.
- [x] P8 Supabase 점검: 위 "긴급" 항목 참조 — 연결 실패 실측 확인.
- [x] P9 QA/Audit/Build: 매 변경 후 `npm run qa`·`npm run audit` PASS 확인, 최종 1회 더 재확인.
- [x] P10 문서 동기화: `check-docs-sync.js` 0건 확인, CHANGELOG·DECISION-LOG·TODO 갱신.

## CTO 업무지시 — 운영 안정화 10단계 (2026-07-29, 같은 날 후속)
- [x] 1단계 API Route 타입 통합, 2단계 Dashboard 리팩토링, 3단계 3계층 분리, 4단계 Discord Morning Brief, 5단계 Agent 구조 분리, 6단계 Core(`lib/core/`, src/ 대신 — 사유는 DECISION-LOG 참조), 7단계 테스트(pytest 22건+vitest 7건), 8단계 커밋 검증 게이트(`npm run verify`+pre-commit 훅), 9단계 Public Repo 점검(노출 없음 확인), 10단계 Supabase 4단계 진단 보고서 — 전부 완료. 상세는 CHANGELOG.md·DECISION-LOG.md 2026-07-29 참조.

## 자율 진행 가능 (승인 불요, CEO 액션 대기 아님)
(현재 없음)

## 완료 (2026-07-26)
- [x] **`next.config.ts`/`next.config.mjs` 중복 config 파일 정리**: 두 파일이 내용 동일하게 공존 — 실제로는 **Next.js 14.2.35가 `.ts` config를 지원하지 않아**(`next build`가 즉시 에러) `next.config.mjs`만 항상 유효했고 `.ts`는 사용된 적 없는 완전한 Dead Code였음(직접 재현 확인: `.mjs` 삭제 시 `next build`가 "Configuring Next.js via 'next.config.ts' is not supported" 에러로 즉시 실패). Dead `.ts` 삭제, `.mjs` 유지. `npm run build`/`lint` exit 0 재확인.
- [x] **PROJECT 8(본사 전용 뷰) 최종 결론**: 2026-07-22·23·24 세 사이클 연속 "요구사항 미구체화"로 보류돼온 항목 — 이번 사이클에 재검토 없이 또 보류하는 대신 CTO 판단으로 확정. `/hq`(CEO Dashboard)가 매출·원가·재고·발주·판매순위를 본점(본사) 관점에서 통합해 이미 이 역할을 수행 중이며, 가맹점 개별 뷰(`/hq/[section]` franchise 섹션)와 명확히 분리돼 있음 — **별도 "PROJECT 8" 전용 화면 신설은 불필요로 결론**. CEO가 이후 다른 구체적 요구사항(예: 전 매장 통합 집계 뷰)을 명시하면 그것은 P7 전국집계(TODO P1, 타 매장 POS 데이터 대기 중) 항목으로 이어서 처리.

## 완료 (2026-07-22)
- [x] **Dead Code 7건 삭제**: `components/{Header,Footer,Hero,Faq,HowItWorks,StyleGallery,StyleCards}.tsx` — CEO-CHARTER §16-B③ 승인 조건 충족(참조 재확인→삭제→build exit 0) 확인 후 실행·커밋.
- [x] **문서 체계 정리**: PROJECT-INDEX.md·DOCUMENT-INDEX.md 신설(60개 문서 전수조사). 중복 2건 확인(AI_ORGANIZATION_MASTER.md·BACKLOG.md, docs/master가 정본). docs/는 Git 미추적이라 삭제하지 않음(색인으로 정본만 표시).
- [x] `docker compose up -d` 실제 검증(장시간 가동 확인) — MASTER INITIALIZATION 이전 재검증 완료.

## 다음 (문서 구조 확정 → MASTER INITIALIZATION 착수)
- [ ] `docs/` 폴더는 확정 방침(frozen, 미추적, 신규 문서 추가 안 함)에 따라 그대로 유지. MASTER INITIALIZATION의 신규 `docs/` 요청(AI-HQ-MASTER.md 등)은 기존 `docs/`와 충돌하므로 **루트에 직접 생성**(기존 docs/ 미접촉).
- [x] **`/hq/erp` 라이브 API 연결**: `/hq`에 이어 `/hq/erp`도 `/api/hq/erp` client fetch로 전환.

## Docker / 인프라 (신규, 완료·검증됨)
- [x] `AI-HQ/docker-compose.yml` + `Dockerfile`(web)·`content-automation-agent/Dockerfile`(erp) — 빌드·기동·HTTP 200 실증.
- [x] `.dockerignore`·`requirements.txt` 추가.
- [x] INSTALL.md·AI-HQ-ARCHITECTURE.md 신설.
- [x] **`output: standalone` 전환 완료**(2026-07-27): 격리 이미지(별도 포트/태그)로 Prisma 쿼리엔진 로드 실증(연결거부 오류만 발생, 엔진누락 오류 없음) → 운영 Dockerfile을 `DOCKER_BUILD=true`일 때만 standalone을 쓰도록 조건부 전환(Vercel 빌드 무영향) → 실 자격증명으로 `/`·`/hq`·`/api/hq/erp` 재검증 → `ai-hq-web-1` 운영 컨테이너 교체 완료(이미지 1.25GB→401MB, 68%↓). 격리 테스트 이미지/컨테이너/Dockerfile은 검증 후 삭제.

## 자율 진행 중 (승인 불요, QA/Audit로 검증된 실제 항목)
- [x] QA 확장 시스템(`npm run qa:extended`) — a11y/SEO/링크/이미지/성능 실검증 완료.
- [x] Audit 시스템(`npm run audit`) — 8항목 실검증 완료, 2개 자체 버그 발견·수정.
- [x] **접근성 실수정 9건**(2026-07-23): `DesignStudio.tsx`(197/216/235)·`Studio.tsx`(264/346/371) 섹션제목용 `<label>`→`<p>` 교체. `PhotoUploader.tsx:89` `role="button"`+`tabIndex`+`onKeyDown` 추가. `components/ui/label.tsx:8`은 제네릭 재사용 컴포넌트라 정적분석 한계로 인한 오탐 확인(실사용처는 모두 htmlFor 정상 연결) — 의도적으로 미수정. `npm run qa:extended` 9건→1건(오탐만 잔존).
- [ ] **중복 컴포넌트 정리 검토**: CompareSlider/Footer/Header/Hero 4쌍(동명이경로) 중 dead 쪽은 삭제됨(위 참조) — 남은 live 쪽 중복(예: `components/design/` vs 다른 경로) 통합 여부 재검토.
- [x] Unused Import 8건 실수정(2026-07-23): 실제 미사용은 `app/api/auth/naver/route.ts`의 `NextRequest` 1건뿐(제거). 나머지 7건은 `eslint.unused.config.mjs`에 `@next/next`·`react-hooks` 플러그인이 미등록돼 소스의 정상 eslint-disable 주석을 "규칙 없음" 오류로 오탐한 audit 툴링 버그 — 플러그인 등록으로 해결. `npm run audit` 8건→0건.
- [x] env 문서 정합(2026-07-23): `DATABASE_URL`/`DIRECT_URL`은 실제로 `database/prisma/schema.prisma`(`env("...")`)에서 사용 중인데 audit 스캐너가 `.prisma` 파일을 보지 않아 오탐 — `scripts/audit.js`에 스캔 대상 추가로 해결. `NODE_ENV`는 Node/Next.js가 런타임에 자동 주입하는 값이라 `.env.example`에 넣지 않는 게 정석 — audit 스캐너에 플랫폼 주입 변수 예외처리 추가. `NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_CLARITY_ID`는 코드 어디서도 실제로 쓰이지 않아 `.env.example`에서 제거(분석 도구 미연결 상태를 정직 반영). `npm run audit` env 섹션 5건→0건.
- [x] npm audit 취약점(2026-07-23) 확인: high 1(Next.js)·moderate 1(postcss, Next.js 종속) 모두 `npm audit fix --force`가 Next.js 14.2.35→16.2.11 **메이저 2단계 업그레이드**를 요구(breaking change 명시) — 패치가 아니라 마이그레이션 프로젝트라 자율 적용하지 않음. 별도 계획 필요(CEO 판단 권장, 운영서버파괴적변경 소지).

## AI 조직 갭 (CEO-CHARTER §AI Headquarters 구축, 실체 없이 조작하지 않음)
- [x] **신설(실체 있음)**: AI QA·AI Audit·AI Security·AI Documentation (scripts/ 실제 시스템 연결).
- [ ] **미충족 역할**(Notion에 실체 있는 프롬프트 없음, 향후 실제 자동화 붙을 때 추가 예정): MASTER AI(현재 CTO와 미분리)·COO·PM·Research(범용)·Knowledge·Interior(전담)·UX(전담)·Frontend/Backend(전담)·Automation(전담)·Dashboard(전담)·Customer Success·Finance(AI회계는 ERP 원가 한정).

## P1 — Live Data / Automation
- [x] `/hq`·`/hq/erp` 프론트가 `/api/hq/erp` client fetch로 연결됨(2026-07-22).
- [ ] ERP 백엔드 실시간화: `/api/hq/erp`가 여전히 코드 내 스냅샷(`lib/hq/erpSnapshot.ts`)을 반환 — 저장소(DB/파일)에서 최신 POS/재고를 직접 읽도록 다음 단계 필요.
- [x] `app/hq/[section]/page.tsx`(가맹점/물류/교육/콘텐츠/직원/설정)도 `/api/hq/erp` 라이브 연결(2026-07-24). STORES/AI_STAFF/HQ_MENU(조직 로스터)는 ERP 데이터가 아니라 정적 유지.
- [ ] 타 매장 POS 엑셀 → 전국 집계.
- [ ] Media 실업로드: YouTube OAuth (자격증명 대기).
- [x] **디저트 판매가 → 홈 메뉴 화면 연결**(2026-07-25): `components/home/MenuSection.tsx` + `lib/menu/dessertMenu.ts` 신설, `/`(홈페이지)에 GBrick 섹션 뒤로 삽입. SSOT: `dessert_menu.json`(28종), 원가/원가율은 비공개.
- [ ] 음료 메뉴 원가(`erp_engine.py` MENU) 데모 9종 → 63개 전체 확장: Drive `09_MENU_COST_TABLE`이 v1.12 기준으로도 "개별 63개 라인 전체 재계산 예정" 상태(문서 자체가 미확정)라 확정 SSOT 없이는 보류.

## P2 — 확장 (Scale)
- [ ] Franchise 포털(가맹점 로그인).
- [ ] Living Document 상시 러너(현재 세션 종속).
- [ ] 다국어 i18n.

## 자격증명/입력 대기 (Blocked)
- OAuth 키: YouTube/Meta/TikTok/Naver
- 타 매장 POS 데이터
- 디자인포비 실제 인테리어 시공 단가
