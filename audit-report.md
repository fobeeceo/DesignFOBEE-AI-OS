> **요약**: 총 1건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-31T01:39:20.948Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 47개 컴포넌트
- 미사용(어디서도 import 안 됨): 0건
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 88개 파일
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
- 코드에서 참조: 11개
- .env.example 선언: 11개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: main
- 최근 커밋: fa81bd3dbcffac92cff5b7d4b6e30af4fd010d55 feat(home): '기록으로 증명' 섹션 추가 — 후기 대체 전략(대표 결정 P2)
- 미커밋 변경: 17건

```
M  app/about/page.tsx
M  app/franchise/page.tsx
M  app/layout.tsx
M  app/page.tsx
M  components/franchise/FranchiseHero.tsx
M  components/franchise/TrustSection.tsx
M  components/home/AboutSection.tsx
M  components/home/CeoSection.tsx
M  components/home/ChurchSection.tsx
M  components/home/GBrickSection.tsx
M  components/home/Hero.tsx
M  components/home/PortfolioSection.tsx
M  components/home/ProofSection.tsx
M  components/home/ServicesSection.tsx
M  components/layout/Footer.tsx
M  lib/company/profile.ts
M  lib/franchise/content.ts
```
