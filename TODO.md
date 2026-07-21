# TODO — DesignFOBEE · GBRICK AI HQ

> 헌장 §19 재실사 (2026-07-21, 2차). `[x]`=완료·검증, `[ ]`=대기. 우선순위: P0(즉시)→P1→P2.

## P0 — 즉시 (보안·신뢰 리스크)
- [ ] **저장소 Private 전환** (§14 보안 우선) — CEO GitHub 계정 작업. **현재도 PUBLIC 확인됨(재검증)**.
- [ ] **`prompts/pricing.ts` 실제 단가 교체** — 현재 전부 플레이스홀더. 실고객에게 AI 예상견적 노출 시 신뢰 리스크(§8 증거원칙 위반 소지). 배포 전 필수.
- [ ] **관리자 `isAdmin` 수동 DB 플래그** — 자동화 안 됨(§2 자동화 원칙 갭). 최소 SQL 스니펫→운영 SOP 문서화 필요.

## P1 — 기술부채 (구조/중복, §14)
- [ ] **Dead code 정리 승인 요청**: `components/{Header,Footer,Hero,Faq,HowItWorks,StyleGallery,StyleCards}.tsx` 7개 파일 — grep 검증 결과 **어디서도 import 안 됨**(ReRoom 레거시 잔재). §18 "CEO 승인 없이 기존 기능 삭제 금지" → **CEO 승인 필요**, 승인 시 즉시 삭제(코드 자체는 이미 무영향).
- [ ] **CompareSlider 중복 제거**: `components/CompareSlider.tsx`(dead) vs `components/design/CompareSlider.tsx`(live, `/design`·`/analyze` 사용) — 위 승인과 함께 정리.
- [x] QA 스크립트 `npm run qa` (lint && tsc --noEmit && build) — 추가·검증 완료, 중복 라인 정리.
- [x] 문서 6종 완비(README·CHANGELOG·ROADMAP·TODO·API·SYSTEM).
- [x] `/hq` 인증 게이트 (env 있을 때 로그인 필수).

## P2 — QA 커버리지 확장 (§9 미검사 항목)
- [ ] **Accessibility** 자동 검사 (현재 lint만, a11y 규칙 없음).
- [ ] **SEO** 자동 검사 (메타/OG 존재하나 자동화된 체크 없음).
- [ ] **Image** 최적화 검사 (next/image 사용 중이나 alt·용량 감사 없음).
- [ ] **Link** 유효성 검사(dead link) 자동화 없음.
- [ ] **Performance**(Lighthouse) 자동화 없음.

## P3 — Live Data / Automation
- [ ] ERP 실시간화: `/api/hq/erp`가 저장소에서 최신 POS/재고 조회 (현재 정적 스냅샷).
- [ ] 타 매장 POS 엑셀 → 전국 집계 (본사 대시보드, 현재 본점만).
- [ ] Media 실업로드: YouTube OAuth 연결·테스트 (자격증명 필요).
- [ ] 디저트 판매가 → 홈 메뉴 화면 연결.

## P4 — 확장 (Scale)
- [ ] Franchise 포털: 가맹점 로그인 뷰(멀티테넌트).
- [ ] Living Document 상시 러너(무인 자동 — 현재 세션 종속, 진짜 24/7 아님).
- [ ] MASTER AI 오케스트레이션(§4~5 부서 AI 실동작화 — 현재는 CTO 1인이 전 역할 수행).
- [ ] 다국어 i18n · 글로벌 배포.

## 자격증명/입력 대기 (Blocked — 코드로 해결 불가)
- OAuth 키: YouTube/Meta/TikTok/Naver (실업로드)
- 타 매장 POS 데이터 (전국 집계)
- 저장소 Private 권한 (CEO GitHub 계정)
- 디자인포비 실제 인테리어 시공 단가 (pricing.ts 교체용)
