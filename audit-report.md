> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-27T11:02:03.168Z
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
- 최근 커밋: 8d623c1ce9890356c4c3b8e4d4f0156190b09693 feat(home): 포트폴리오 사진 교체 + 우리 작업 갤러리 + 회사소개 페이지
- 미커밋 변경: 15건

```
M app/page.tsx
 M components/home/PortfolioSection.tsx
 D components/home/WorkGallerySection.tsx
 M lib/portfolio/workGallery.ts
 M public/images/manifest.json
 M public/images/portfolio/gbrick-dandae.jpg
 M public/images/portfolio/gbrick-eunpyeong.jpg
?? public/images/portfolio/website/designfobee-cafe-lounge-02-thumb.webp
?? public/images/portfolio/website/designfobee-cafe-lounge-02.webp
?? public/images/portfolio/website/designfobee-cafe-lounge-03-thumb.webp
?? public/images/portfolio/website/designfobee-cafe-lounge-03.webp
?? public/images/portfolio/website/designfobee-office-02-thumb.webp
?? public/images/portfolio/website/designfobee-office-02.webp
?? public/images/portfolio/website/designfobee-retail-clothing-01-thumb.webp
?? public/images/portfolio/website/designfobee-retail-clothing-01.webp
```
