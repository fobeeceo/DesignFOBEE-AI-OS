# TODO — DesignFOBEE · GBRICK AI HQ

> CEO-CHARTER.md §16-B 승인규칙 적용(2026-07-21 최종 갱신): 실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경 6항목만 CEO 승인 대상. 그 외(Dead Code 삭제 포함)는 자율 진행. `[x]`=완료·검증, `[ ]`=대기.

## CEO 승인 대상 (6항목 규칙 해당)
- [ ] **저장소 Private 전환**(GitHub 공개여부 변경) — CEO GitHub 계정 작업.
- [ ] **`prompts/pricing.ts` 실제 단가 교체**(정책/데이터) — 디자인포비 실제 단가 필요.

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
- [ ] `output: standalone` 전환 검토(이미지 경량화, 승인 불요·자율진행 가능).

## 자율 진행 중 (승인 불요, QA/Audit로 검증된 실제 항목)
- [x] QA 확장 시스템(`npm run qa:extended`) — a11y/SEO/링크/이미지/성능 실검증 완료.
- [x] Audit 시스템(`npm run audit`) — 8항목 실검증 완료, 2개 자체 버그 발견·수정.
- [ ] **접근성 실수정 9건**: `components/design/DesignStudio.tsx`(197/216/235행)·`components/Studio.tsx`(264/346/371행) — 섹션제목용 `<label>`을 `<p>`/heading으로 교체(폼과 무관, 오분류). `components/upload/PhotoUploader.tsx:89` 키보드 접근성(click-events-have-key-events, no-static-element-interactions).
- [ ] **중복 컴포넌트 정리 검토**: CompareSlider/Footer/Header/Hero 4쌍(동명이경로) 중 dead 쪽은 삭제됨(위 참조) — 남은 live 쪽 중복(예: `components/design/` vs 다른 경로) 통합 여부 재검토.
- [ ] Unused Import 8건 실수정(경미, `npm run audit` 리포트 참조).
- [ ] env 문서 정합: `.env.example`에 `NODE_ENV` 추가, 미사용 4건(DATABASE_URL/DIRECT_URL/GA/Clarity) 실제 코드 참조 여부 재확인 후 정리.
- [ ] npm audit 취약점(high 1·moderate 1) 확인 후 패치 가능하면 자율 적용.

## AI 조직 갭 (CEO-CHARTER §AI Headquarters 구축, 실체 없이 조작하지 않음)
- [x] **신설(실체 있음)**: AI QA·AI Audit·AI Security·AI Documentation (scripts/ 실제 시스템 연결).
- [ ] **미충족 역할**(Notion에 실체 있는 프롬프트 없음, 향후 실제 자동화 붙을 때 추가 예정): MASTER AI(현재 CTO와 미분리)·COO·PM·Research(범용)·Knowledge·Interior(전담)·UX(전담)·Frontend/Backend(전담)·Automation(전담)·Dashboard(전담)·Customer Success·Finance(AI회계는 ERP 원가 한정).

## P1 — Live Data / Automation
- [x] `/hq`·`/hq/erp` 프론트가 `/api/hq/erp` client fetch로 연결됨(2026-07-22).
- [ ] ERP 백엔드 실시간화: `/api/hq/erp`가 여전히 코드 내 스냅샷(`lib/hq/erpSnapshot.ts`)을 반환 — 저장소(DB/파일)에서 최신 POS/재고를 직접 읽도록 다음 단계 필요.
- [ ] `app/hq/[section]/page.tsx`(가맹점/물류/교육/콘텐츠/직원/설정)도 `/api/hq/erp` 라이브 연결.
- [ ] 타 매장 POS 엑셀 → 전국 집계.
- [ ] Media 실업로드: YouTube OAuth (자격증명 대기).
- [ ] 디저트 판매가 → 홈 메뉴 화면 연결.

## P2 — 확장 (Scale)
- [ ] Franchise 포털(가맹점 로그인).
- [ ] Living Document 상시 러너(현재 세션 종속).
- [ ] 다국어 i18n.

## 자격증명/입력 대기 (Blocked)
- OAuth 키: YouTube/Meta/TikTok/Naver
- 타 매장 POS 데이터
- 디자인포비 실제 인테리어 시공 단가
