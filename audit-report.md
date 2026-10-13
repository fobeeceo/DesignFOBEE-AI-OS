> **요약**: 총 4건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-10-13T11:43:20.749Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 60개 컴포넌트
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
- nav 파일 스캔: 5
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 1, high 4, moderate 0, low 0

## 7. Environment Variable
- 코드에서 참조: 18개
- .env.example 선언: 17개
- .env.example 누락(코드는 참조하나 예제엔 없음): 1건
  - GEMINI_IMAGE_COST_USD_PER_IMAGE
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: claude/ai-marketing-secretary-design-2s7i9c
- 최근 커밋: 954c54b1ad54912ae13615cf7778b1acf342fc43 chore: .claude/settings.local.json gitignore 추가
- 미커밋 변경: 2건

```
M  content-automation-agent/tests/test_marketing_pipeline.py
 M package-lock.json
```
