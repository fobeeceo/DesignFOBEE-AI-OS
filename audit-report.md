> **요약**: 총 3건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-10-14T14:22:09.980Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 62개 컴포넌트
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
- 스캔: 118개 파일
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
- 코드에서 참조: 17개
- .env.example 선언: 17개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: fix/franchise-deposit-facts
- 최근 커밋: 51a1dbddcdff6b09e84c6fb8a5b27aef5bda1bcd fix(franchise): 정보공개서 기준으로 로열티·보증금·계약 절차 문구 정정
- 미커밋 변경: 15건

```
M  app/franchise/diagnosis/page.tsx
M  app/franchise/page.tsx
A  components/franchise/AttributionCapture.tsx
M  components/franchise/ConsultForm.tsx
A  components/franchise/CostSection.tsx
A  lib/franchise/attribution.test.ts
A  lib/franchise/attribution.ts
A  lib/franchise/brandDomain.test.ts
A  lib/franchise/brandDomain.ts
M  lib/franchise/content.ts
M  lib/notifications/leadEmail.ts
M  lib/validations/lead.schema.ts
M  middleware.ts
M  services/leadService.ts
M  types/lead.ts
```
