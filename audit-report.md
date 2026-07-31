> **요약**: 총 1건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-07-31T00:17:48.639Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 44개 컴포넌트
- 미사용(어디서도 import 안 됨): 0건
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 85개 파일
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
- 최근 커밋: fd280ff0a8a008f979d8f3b8b0fe4ccb506c6a03 feat(franchise): GBRICK Coffee 가맹상담 전용 랜딩 페이지 구축(CEO 업무지시)
- 미커밋 변경: 16건

```
M  app/(admin)/admin/leads/[leadId]/page.tsx
M  app/api/admin/leads/[leadId]/route.ts
M  app/api/leads/route.ts
A  components/admin/LeadAiPanel.tsx
M  components/franchise/ConsultForm.tsx
M  components/franchise/ThankYouModal.tsx
A  database/prisma/migrations/20260731090000_add_franchise_ai_fields/migration.sql
M  database/prisma/schema.prisma
A  lib/franchise/constants.ts
A  lib/franchise/leadIntelligence.test.ts
A  lib/franchise/leadIntelligence.ts
M  lib/franchise/successCases.ts
M  lib/validations/crm.schema.ts
M  services/crmService.ts
M  services/leadService.ts
M  types/lead.ts
```
