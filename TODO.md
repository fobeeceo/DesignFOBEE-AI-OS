# TODO — DesignFOBEE · GBRICK AI HQ

> CEO-CHARTER.md §16-B 승인규칙 적용(2026-07-21 최종 갱신): 실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경 6항목만 CEO 승인 대상. 그 외(Dead Code 삭제 포함)는 자율 진행. `[x]`=완료·검증, `[ ]`=대기.

## CEO 승인 대상 (6항목 규칙 해당)
- [ ] **저장소 Private 전환**(GitHub 공개여부 변경) — CEO GitHub 계정 작업.
- [ ] **`prompts/pricing.ts` 실제 단가 교체**(정책/데이터) — 디자인포비 실제 단가 필요.
- [ ] **API 키 운영/개발 분리**: CEO MASTER 업무지시서 §6 원칙(예: Gemini Dev/Prod 별도 키)과 현재 방식(Vercel 환경별 값 분리, 변수명은 동일)이 다름 — 어느 쪽을 표준으로 할지 결정 필요([INSTALL.md](INSTALL.md) §7). AI CEO(전략) 에이전트 자체 분석 결과 "현재 방식 유지 + CI 검증스크립트 추가"를 권고(DECISION-LOG 참조, 최종 결정은 CEO).
- [ ] **이메일 실발송 자동화**: 현재 Gmail 연동은 초안(draft) 생성까지만 가능, 실제 발송 기능 없음 — CEO 다이제스트를 완전자동 발송하려면 별도 자격증명/도구가 필요(외부서비스가입 소지).
- [ ] **카카오톡 채널 연동**: CEO가 요청한 두 번째 채널(카카오톡 요약발송)은 현재 연동된 도구가 없음 — 카카오 비즈니스 API 등 외부서비스가입 필요.
- [ ] **n8n 아침 브리핑 활성화**(2026-07-25 신설): n8n에 워크플로("AI HQ - 아침 브리핑", id `toB3sf8BJpWaJNIl`)까지는 만들었으나 Gmail·Google Calendar OAuth2 credential은 CEO 본인 구글 계정 인증이 필요해 Claude Code가 대신할 수 없음 — 절차는 [INSTALL.md](INSTALL.md) §9 참조(외부서비스가입 소지). 완료 전까지 워크플로는 inactive.

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
- [ ] `output: standalone` 전환 검토(이미지 경량화, 승인 불요·자율진행 가능) — 2026-07-26 시도: `next.config.mjs`에 플래그만 추가 시 `npm run build`는 통과하나, `Dockerfile` runner 단계가 여전히 `npm start`(풀 `node_modules` 복사)라 실질적 이미지 경량화 효과 없음. 완전 전환에는 Dockerfile을 `node server.js`(standalone 산출물)로 교체해야 하는데, 이 프로젝트가 Prisma를 쓰고 있어 standalone 출력에 Prisma 쿼리 엔진 바이너리가 자동 포함되는지 별도 검증이 필요함(알려진 Next+Prisma 함정) — 현재 `ai-hq-web-1` 컨테이너가 n8n 자동화와 연동돼 18시간+ 운영 중이라, 검증 없이 교체하면 운영 중단 위험(§8 검증규칙: 확인 못한 것 완료 보고 금지). 이번 사이클엔 미적용 원복, 다음 사이클에 격리된 테스트 이미지(다른 포트/태그)로 Prisma 동작까지 확인 후 진행 권장.

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
