> **요약**: 총 3건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-10-15T00:40:42.966Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 64개 컴포넌트
- 미사용(어디서도 import 안 됨): 1건
  - components/franchise/SuccessCases.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 2건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx
  - **DiagnosisClient.tsx**
    - components/franchise/DiagnosisClient.tsx
    - components/hr/DiagnosisClient.tsx

## 3. Unused Import
- 스캔: 120개 파일
- 이슈: 0건

## 4. Broken Route (nav 컴포넌트)
- nav 파일 스캔: 6
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 1, high 4, moderate 0, low 0

## 7. Environment Variable
- 코드에서 참조: 17개
- .env.example 선언: 17개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: feat/franchise-menu-landing
- 최근 커밋: 3e65e0badd7f4a7d67325d3543001a471ab9ce2d feat(franchise): 메뉴 섹션에 매장에서 들은 손님 이야기 추가
- 미커밋 변경: 3건

```
M  components/franchise/FranchiseHero.tsx
M  components/franchise/MenuSection.tsx
M  lib/franchise/content.ts
```
