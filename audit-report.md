> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-28T00:02:14.321Z
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
- 브랜치: ai-proposal/3aa3abcb
- 최근 커밋: 2101173792816b51d875bb1c97788012644dff73 fix(home): 원래 디자인 유지하며 GBRICK 매장+작업공간 이미지 통합, 디저트 섹션 삭제
- 미커밋 변경: 13건

```
M components/home/PortfolioSection.tsx
 M lib/portfolio/workGallery.ts
 M public/images/manifest.json
 M public/images/portfolio/gbrick-dandae.jpg
 D public/images/portfolio/gbrick-eunpyeong.jpg
 M public/images/portfolio/gbrick-samsong.jpg
 M public/images/portfolio/gbrick-singil.jpg
?? public/images/portfolio/website/designfobee-cafe-lounge-04-thumb.webp
?? public/images/portfolio/website/designfobee-cafe-lounge-04.webp
?? public/images/portfolio/website/designfobee-cafe-reading-01-thumb.webp
?? public/images/portfolio/website/designfobee-cafe-reading-01.webp
?? public/images/portfolio/website/designfobee-office-lounge-01-thumb.webp
?? public/images/portfolio/website/designfobee-office-lounge-01.webp
```
