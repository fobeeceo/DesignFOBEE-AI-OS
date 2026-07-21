> **요약**: 총 20건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-21T11:22:50.467Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 39개 컴포넌트
- 미사용(어디서도 import 안 됨): 7건
  - components/Faq.tsx
  - components/Footer.tsx
  - components/Header.tsx
  - components/Hero.tsx
  - components/HowItWorks.tsx
  - components/StyleCards.tsx
  - components/StyleGallery.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 4건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx
  - **Footer.tsx**
    - components/Footer.tsx
    - components/layout/Footer.tsx
  - **Header.tsx**
    - components/Header.tsx
    - components/layout/Header.tsx
  - **Hero.tsx**
    - components/Hero.tsx
    - components/home/Hero.tsx

## 3. Unused Import
- 스캔: 73개 파일
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
- nav 파일 스캔: 7
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
- 최근 커밋: d8373057daf7bccb0093f2294fd74292d50fcc35 docs: re-audit vs CLAUDE.md constitution - update ROADMAP/TODO with verified findings (repo public, dead code, pricing placeholder, QA gaps)
- 미커밋 변경: 7건

```
M CLAUDE.md
 M package.json
?? CEO-CHARTER.md
?? audit-report.md
?? eslint.a11y.config.mjs
?? eslint.unused.config.mjs
?? scripts/
```
