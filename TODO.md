# TODO — DesignFOBEE · GBRICK AI HQ

> 우선순위별. 헌장 §19 갭 분석 결과. `[x]`=완료·검증, `[ ]`=대기.

## P0 — 즉시 (Hardening)
- [x] CLAUDE.md 헌장 v1.0 확정
- [x] QA 증거 확보 (tsc exit0 · lint no-error · build exit0)
- [x] 문서 6종: README·CHANGELOG·ROADMAP·TODO·API·SYSTEM
- [ ] **QA 스크립트** `npm run qa` (lint && tsc --noEmit && build)
- [ ] **저장소 Private 전환** (보안 §14) — CEO 계정 작업
- [x] **/hq 인증 게이트** (미들웨어: env 있을 때 로그인 필수 → /login, env 없으면 데모 렌더). QA 통과.
- [ ] **QA 스크립트** `npm run qa` (lint && tsc --noEmit && build) ✅ 추가·검증됨

## P1 — 다음 (Live Data / Automation)
- [ ] ERP 실시간화: `/api/hq/erp`가 저장소에서 최신 POS/재고 조회
- [ ] 타 매장 POS 엑셀 → 전국 집계 (본사 대시보드)
- [ ] Media 실업로드: YouTube OAuth 연결·테스트 (자격증명 필요)
- [ ] 접근성/SEO/이미지 최적화 QA (§9)
- [ ] 디저트 판매가 → 홈 메뉴 연결

## P2 — 확장 (Scale)
- [ ] Franchise 포털: 가맹점 로그인 뷰(멀티테넌트)
- [ ] Living Document 상시 러너(무인 자동)
- [ ] MASTER AI 오케스트레이션(부서 AI 실동작)
- [ ] 다국어 i18n · 글로벌 배포

## 자격증명/입력 대기 (Blocked)
- OAuth 키: YouTube/Meta/TikTok/Naver (실업로드)
- 타 매장 POS 데이터 (전국 집계)
- 저장소 Private 권한 (CEO GitHub 계정)
