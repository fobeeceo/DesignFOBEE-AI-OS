# ROADMAP — DesignFOBEE · GBRICK AI HQ

> 현재 시스템 vs CLAUDE.md 헌장 갭 분석 기반 (2026-07-21). QA 증거: tsc/lint/build 모두 PASS.

## Phase A — Foundation ✅ 완료 (검증됨)
- SSOT: Google Drive + Notion **Master DB 레지스트리** (정본 등록).
- **AI ERP**: POS Import → 레시피 → 재고 발주추천 → 원가(음료 22.6%/디저트 49.9%) → Dashboard. 실데이터.
- **AI HQ 웹** `/hq`: 8섹션(CEO Dashboard·ERP·가맹점·물류·교육·콘텐츠·AI직원·설정) + 라이브 API.
- **Media OS**: OSMU 생성기 + 7 퍼블리셔 + 13 Worker (업로드는 자격증명 대기).
- **홈/AI 스튜디오**: 무로그인 `/design` + 실제 GBRICK 포트폴리오. 반응형.
- **배포**: git push → Vercel 자동. env 없이 빌드 OK.
- **Living Document**: Drive 감지→제안→CEO 승인→반영 (수동 트리거).

## Phase B — Hardening 🚧 진행 (헌장 §8~§14 준수)
- 문서 6종 완비: README·CHANGELOG·ROADMAP·TODO·**API·SYSTEM** (§11).
- **QA 자동화**: `npm run qa` = lint + type-check + build (§9,§12).
- **보안**: 저장소 **Private 전환** (현재 PUBLIC) (§14).
- **/hq 인증 게이트**: 로그인 후만 접근 (현재 공개).
- 접근성·SEO·이미지 최적화 점검 (§9).

## Phase C — Live Data
- ERP **실시간화**: 스냅샷 → API가 저장소(DB/Blob) 조회.
- **전국 집계**: 타 매장 POS 업로드 → 본사 합산 (현재 본점만).
- Living Document **상시 러너**(무인 자동 감지).

## Phase D — Real Automation
- Media **실업로드**: OAuth 연결 (YouTube → Meta → TikTok → Naver 순).
- OSMU 자동 스케줄 + 성과 환류 자동.

## Phase E — Scale
- **Franchise OS**: 가맹점 로그인 포털(매출·재고·발주·교육·공지).
- **Interior OS** 고도화 · 다국어 · 100개국 확장.
