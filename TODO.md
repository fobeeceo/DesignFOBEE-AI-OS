# TODO — DesignFOBEE · GBRICK AI HQ

> CEO-CHARTER.md 승인규칙 적용(2026-07-21): 5항목(정책변경·삭제·비용발생·외부공개·데이터구조변경)만 CEO 승인 대상. 그 외는 자율 진행. `[x]`=완료·검증, `[ ]`=대기.

## CEO 승인 대상 (5항목 규칙 해당)
- [ ] **Dead Code 삭제**: `components/{Header,Footer,Hero,Faq,HowItWorks,StyleGallery,StyleCards}.tsx` 7개 — `npm run audit`로 재확인됨(transitive closure 포함). 삭제=CEO 승인 대상.
- [ ] **저장소 Private 전환** — 외부공개 정책. CEO GitHub 계정 작업.
- [ ] **`prompts/pricing.ts` 실제 단가 교체** — 데이터/정책 사안. 디자인포비 실제 단가 필요.

## 자율 진행 중 (승인 불요, QA/Audit로 검증된 실제 항목)
- [x] QA 확장 시스템(`npm run qa:extended`) — a11y/SEO/링크/이미지/성능 실검증 완료.
- [x] Audit 시스템(`npm run audit`) — 8항목 실검증 완료, 2개 자체 버그 발견·수정.
- [ ] **접근성 실수정 9건**: `components/design/DesignStudio.tsx`(197/216/235행)·`components/Studio.tsx`(264/346/371행) — 섹션제목용 `<label>`을 `<p>`/heading으로 교체(폼과 무관, 오분류). `components/upload/PhotoUploader.tsx:89` 키보드 접근성(click-events-have-key-events, no-static-element-interactions).
- [ ] **중복 컴포넌트 정리 검토**: CompareSlider/Footer/Header/Hero 4쌍(동명이경로). Dead Code 승인과 함께 처리 예정 — 삭제 자체는 여전히 승인 대상이나 "정리 계획 수립"은 자율 진행 가능.
- [ ] Unused Import 8건 실수정(경미, `npm run audit` 리포트 참조).
- [ ] env 문서 정합: `.env.example`에 `NODE_ENV` 추가, 미사용 4건(DATABASE_URL/DIRECT_URL/GA/Clarity) 실제 코드 참조 여부 재확인 후 정리.
- [ ] npm audit 취약점(high 1·moderate 1) 확인 후 패치 가능하면 자율 적용.

## AI 조직 갭 (CEO-CHARTER §AI Headquarters 구축, 실체 없이 조작하지 않음)
- [x] **신설(실체 있음)**: AI QA·AI Audit·AI Security·AI Documentation (scripts/ 실제 시스템 연결).
- [ ] **미충족 역할**(Notion에 실체 있는 프롬프트 없음, 향후 실제 자동화 붙을 때 추가 예정): MASTER AI(현재 CTO와 미분리)·COO·PM·Research(범용)·Knowledge·Interior(전담)·UX(전담)·Frontend/Backend(전담)·Automation(전담)·Dashboard(전담)·Customer Success·Finance(AI회계는 ERP 원가 한정).

## P1 — Live Data / Automation
- [ ] ERP 실시간화: `/api/hq/erp`가 저장소에서 최신 POS/재고 조회(현재 정적 스냅샷).
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
