> **요약**: 총 10건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-23T07:25:05.055Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 32개 컴포넌트
- 미사용(어디서도 import 안 됨): 0건
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 67개 파일
- 이슈: 8건
  - app/(admin)/admin/leads/[leadId]/page.tsx:83 — Definition for rule '@next/next/no-img-element' was not found.
  - app/api/auth/naver/route.ts:1 — 'NextRequest' is defined but never used. Allowed unused vars must match /^_/u.
  - app/consult/[projectId]/[designImageId]/page.tsx:51 — Definition for rule '@next/next/no-img-element' was not found.
  - components/design/CompareSlider.tsx:56 — Definition for rule '@next/next/no-img-element' was not found.
  - components/design/CompareSlider.tsx:63 — Definition for rule '@next/next/no-img-element' was not found.
  - components/design/DesignStudio.tsx:207 — Definition for rule '@next/next/no-img-element' was not found.
  - components/upload/PhotoUploader.tsx:65 — Definition for rule 'react-hooks/exhaustive-deps' was not found.
  - components/upload/PhotoUploader.tsx:128 — Definition for rule '@next/next/no-img-element' was not found.

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
- 코드에서 참조: 8개
- .env.example 선언: 11개
- .env.example 누락(코드는 참조하나 예제엔 없음): 1건
  - NODE_ENV
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 4건
  - DATABASE_URL
  - DIRECT_URL
  - NEXT_PUBLIC_CLARITY_ID
  - NEXT_PUBLIC_GA_ID

## 8. Git Status
- 브랜치: main
- 최근 커밋: 3ff60c66583a81fe3b47758507ae6e43c5db57cf feat(media): Media OSMU 파이프라인 실Gemini 연동 - CEO "다음단계 진행" 승인
- 미커밋 변경: 7건

```
M AI-HQ-MASTER.md
 M AI-STAFF-POLICY.md
 M CHANGELOG.md
 M DECISION-LOG.md
 M content-automation-agent/src/analytics.py
 M content-automation-agent/src/generate_osmu.py
?? content-automation-agent/src/trend_research.py
```
