> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-08-11T15:33:40.548Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 51개 컴포넌트
- 미사용(어디서도 import 안 됨): 1건
  - components/franchise/SuccessCases.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 97개 파일
- 이슈: 0건

## 4. Broken Route (nav 컴포넌트)
- nav 파일 스캔: 5
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 0, high 3, moderate 0, low 0

## 7. Environment Variable
- 코드에서 참조: 17개
- .env.example 선언: 17개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: claude/hermes-agent-build-bga5ts
- 최근 커밋: 96a579371b14fd6bb4a3e24d268df87a9eba4dd7 feat(hermes): AI HQ 전령 에이전트 신설 — 4가지 전달 업무를 한 파이프라인으로
- 미커밋 변경: 18건

```
M .env.example
 M AI-STAFF-POLICY.md
 M API.md
 M CHANGELOG.md
RM agents/hermesAgent.ts -> agents/courierAgent.ts
 M agents/marketerAgent.ts
RM app/api/hq/hermes/route.ts -> app/api/hq/courier/route.ts
RM lib/hermes/briefing.ts -> lib/courier/briefing.ts
RM lib/hermes/channels.ts -> lib/courier/channels.ts
RM lib/hermes/hermes.test.ts -> lib/courier/courier.test.ts
RM lib/hermes/directory.ts -> lib/courier/directory.ts
RM lib/hermes/reply.ts -> lib/courier/reply.ts
RM lib/hermes/signals.ts -> lib/courier/signals.ts
RM lib/hermes/types.ts -> lib/courier/types.ts
 M lib/hq/erpSnapshot.ts
?? HERMES-AGENT-PLAN.md
?? app/api/hq/courier/morning/
?? lib/courier/morning.ts
```
