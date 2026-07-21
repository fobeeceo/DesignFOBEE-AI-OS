# ROADMAP — DesignFOBEE · GBRICK AI HQ

> 헌장 §19 2차 실사 (2026-07-21). 근거: GitHub API(가시성)·grep(사용처 추적)·`npm run qa`(exit 0) 직접 실행.

## Phase A — Foundation ✅ 완료 (검증됨)
- SSOT: Google Drive + Notion **Master DB 레지스트리**.
- **AI ERP**: POS Import → 레시피 → 재고 발주추천 → 원가(음료 22.6%/디저트 49.9%) → Dashboard. 실데이터.
- **AI HQ 웹** `/hq`: 8섹션 + 라이브 API + 인증 게이트.
- **Media OS**: OSMU 생성기 + 7 퍼블리셔 + 13 Worker(업로드는 자격증명 대기).
- **홈 리디자인**: 공간사진 풀블리드 히어로·포트폴리오 승격+필터·스크롤 인터랙션·에디토리얼 팔레트 통일(Creative Director 승인 4/4).
- **배포**: git push → Vercel 자동. env 없이 빌드 OK.
- **Living Document**: Drive 감지→제안→CEO 승인→반영(수동 트리거).

## Phase B — Hardening 🚧 재실사 결과 (§8~§14)
| 항목 | 상태 | 근거 |
|---|---|---|
| 문서 6종 | ✅ | README/CHANGELOG/ROADMAP/TODO/API/SYSTEM 존재 |
| QA 스크립트 | ✅ | `npm run qa` exit 0 실행 확인 |
| `/hq` 인증 게이트 | ✅ | middleware.ts 코드 확인 |
| **저장소 Private** | ❌ | GitHub API 재조회: `"private": false` (여전히 PUBLIC) |
| **견적 단가 실값 교체** | ❌ | `prompts/pricing.ts` 플레이스홀더 확인, 신뢰 리스크 |
| **Dead code 정리** | ⏸ 승인대기 | 7개 orphan 컴포넌트 grep 검증(무사용), §18에 따라 CEO 승인 필요 |
| A11y/SEO/Image/Link/Perf 자동 QA | ❌ | §9 요구 항목 중 미커버, lint+tsc+build만 자동화됨 |

## Phase C — Live Data
- ERP 실시간화(스냅샷→저장소 조회) · 전국 집계(타 매장 POS) · Living Document 상시 러너.

## Phase D — Real Automation
- Media 실업로드(YouTube→Meta→TikTok→Naver 순 OAuth) · 성과 환류 자동.

## Phase E — Scale
- Franchise 포털(가맹점 로그인) · MASTER AI 오케스트레이션(부서 AI 실동작) · 다국어·글로벌.

---
## 우선순위 요약 (다음 액션)
1. **P0 보안/신뢰**: 저장소 Private(CEO) · 견적단가 실값(CEO 데이터) · isAdmin SOP.
2. **P1 기술부채**: Dead code 삭제 승인(CEO) → 즉시 실행.
3. **P2 QA 확장**: A11y/SEO/Image/Link 자동 검사 추가(코드로 가능, 승인 불요).
4. **P3~P4**: 자격증명 확보 순.
