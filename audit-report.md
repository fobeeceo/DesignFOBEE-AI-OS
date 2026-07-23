> **요약**: 총 1건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-23T11:41:00.081Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 33개 컴포넌트
- 미사용(어디서도 import 안 됨): 0건
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 68개 파일
- 이슈: 0건

## 4. Broken Route (nav 컴포넌트)
- nav 파일 스캔: 5
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 0, high 1, moderate 1, low 0

## 7. Environment Variable
- 코드에서 참조: 10개
- .env.example 선언: 9개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 0건

## 8. Git Status
- 브랜치: main
- 최근 커밋: 6f41df3ffb2a78a786b0e784ae0ca0fe629a2f40 fix: audit 백로그 정리 - 접근성 9건/unused import 8건/env 정합/npm audit 확인
- 미커밋 변경: 5건

```
M AI-HQ-MASTER.md
 M AI-STAFF-POLICY.md
 M CEO-REPORT.md
 M app/hq/[section]/page.tsx
 M lib/hq/erpSnapshot.ts
```
