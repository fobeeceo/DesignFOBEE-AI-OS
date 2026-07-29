> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-29T10:05:47.008Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 34개 컴포넌트
- 미사용(어디서도 import 안 됨): 1건
  - components/home/MenuSection.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 72개 파일
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
- 최근 커밋: fa11f6a1bbb0d10c816bba8a161c4898eabe887f fix(home): Hero 배경 이미지 404 긴급 복구 (Sprint 1 P0)
- 미커밋 변경: 16건

```
M  components/home/Hero.tsx
M  components/home/PortfolioSection.tsx
M  lib/portfolio/workGallery.ts
M  public/images/manifest.json
A  public/images/portfolio/website/designfobee-cafe-bakery-counter-01-thumb.webp
A  public/images/portfolio/website/designfobee-cafe-bakery-counter-01.webp
A  public/images/portfolio/website/designfobee-cafe-counter-shelving-01-thumb.webp
A  public/images/portfolio/website/designfobee-cafe-counter-shelving-01.webp
A  public/images/portfolio/website/designfobee-gbrick-storefront-night-01-thumb.webp
A  public/images/portfolio/website/designfobee-gbrick-storefront-night-01.webp
A  public/images/portfolio/website/designfobee-kids-lounge-01-thumb.webp
A  public/images/portfolio/website/designfobee-kids-lounge-01.webp
A  public/images/portfolio/website/designfobee-kids-lounge-02-thumb.webp
A  public/images/portfolio/website/designfobee-kids-lounge-02.webp
A  public/images/portfolio/website/designfobee-retail-corridor-01-thumb.webp
A  public/images/portfolio/website/designfobee-retail-corridor-01.webp
```
