> **요약**: 실제 조치 필요 9건 (상속 OK/의도적 처리 항목은 참고용으로 별도 표시, 문제 건수에서 제외).

# QA Extended Report

생성: 2026-07-23T04:34:01.480Z
기준: CLAUDE.md §9

## 1. Accessibility (jsx-a11y)
- 스캔 파일: 48
- 이슈: 9건
| 파일 | 라인 | 규칙 | 메시지 |
|---|---|---|---|
| components/design/DesignStudio.tsx | 197 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/design/DesignStudio.tsx | 216 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/design/DesignStudio.tsx | 235 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/Studio.tsx | 264 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/Studio.tsx | 346 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/Studio.tsx | 371 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/ui/label.tsx | 8 | jsx-a11y/label-has-associated-control | A form label must be associated with a control. |
| components/upload/PhotoUploader.tsx | 89 | jsx-a11y/click-events-have-key-events | Visible, non-interactive elements with click handlers must have at least one keyboard listener. |
| components/upload/PhotoUploader.tsx | 89 | jsx-a11y/no-static-element-interactions | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tabbing, mouse, keyboard, and touch inputs to an interactive content element. |

## 2. SEO
- 스캔 페이지: 16
- robots.ts: ✅ 있음
- sitemap.ts: ✅ 있음
- metadata **진짜 공백**(본인+조상 layout 모두 없음): 0건
- metadata 상위 layout 상속(문제 아님, 참고용): 10건
  - app/(admin)/admin/leads/page.tsx
  - app/(admin)/admin/leads/[leadId]/page.tsx
  - app/(admin)/layout.tsx
  - app/(dashboard)/layout.tsx
  - app/analyze/[projectId]/page.tsx
  - app/consult/[projectId]/[designImageId]/page.tsx
  - app/hq/erp/page.tsx
  - app/hq/page.tsx
  - app/hq/[section]/page.tsx
  - app/page.tsx

## 3. Broken Link (내부 링크)
- 검사한 링크: 17
- 깨진 링크: 0건

## 4. Image
- 순수 <img> 태그(next/image 미사용, **미검토**): 0건
- 순수 <img> 태그(disable 주석으로 **이미 의도적 처리됨**, 참고용): 6건
  - app/(admin)/admin/leads/[leadId]/page.tsx:84
  - app/consult/[projectId]/[designImageId]/page.tsx:52
  - components/design/CompareSlider.tsx:57
  - components/design/CompareSlider.tsx:64
  - components/design/DesignStudio.tsx:208
  - components/upload/PhotoUploader.tsx:129
- alt 누락 <Image>: 0건

## 5. Performance (빌드 번들 예산 200kB)
- 파싱된 라우트: 32
- 예산 초과 라우트: 0건

> 참고: 이 지표는 First Load JS 번들 크기 기준(빌드 정적 분석)이다. LCP/TBT/CLS 등 런타임 지표는 Lighthouse가 필요하며(서버 구동 필요), 수동 실행: `npx lighthouse http://localhost:3000 --view`.
