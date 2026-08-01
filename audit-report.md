> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-08-01T11:43:24.798Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 50개 컴포넌트
- 미사용(어디서도 import 안 됨): 1건
  - components/franchise/SuccessCases.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 94개 파일
- 이슈: 0건

## 4. Broken Route (nav 컴포넌트)
- nav 파일 스캔: 5
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 0, high 2, moderate 0, low 0

## 7. Environment Variable
- 코드에서 참조: 14개
- .env.example 선언: 14개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: main
- 최근 커밋: 40d36c8f5f6a706ada8d87802313029ec28c338a fix(content): STEP 2 — 폐점 매장 정리 및 매장 현황 정정
- 미커밋 변경: 9건

```
M  agents/marketerAgent.ts
M  app/franchise/page.tsx
M  app/hq/[section]/page.tsx
 M audit-report.md
A  components/franchise/OperatingStores.tsx
 M docs-sync-report.json
M  lib/company/profile.ts
M  lib/franchise/content.ts
M  lib/hq/erpSnapshot.ts
```
