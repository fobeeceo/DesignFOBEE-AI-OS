> **요약**: 총 2건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.

# Audit Report

생성: 2026-08-10T13:28:38.973Z
기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)

## 1. Dead Code
- 스캔: 53개 컴포넌트
- 미사용(어디서도 import 안 됨): 1건
  - components/franchise/SuccessCases.tsx
- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.

## 2. Duplicate Component
- 중복 파일명: 1건
  - **CompareSlider.tsx**
    - components/CompareSlider.tsx
    - components/design/CompareSlider.tsx

## 3. Unused Import
- 스캔: 99개 파일
- 이슈: 0건

## 4. Broken Route (nav 컴포넌트)
- nav 파일 스캔: 5
- 깨진 링크: 0건

## 5. Build Error (독립 실행)
- Type Check: PASS
- Build: PASS

## 6. Security
- 하드코딩 시크릿 패턴: 0건
- npm audit(production): critical 0, high 3, moderate 0, low 0

## 7. Environment Variable
- 코드에서 참조: 14개
- .env.example 선언: 14개
- .env.example 누락(코드는 참조하나 예제엔 없음): 0건
- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): 1건
  - N8N_API_KEY

## 8. Git Status
- 브랜치: main
- 최근 커밋: 7bf718977b3a91c8f6fd2a4244b818d482731f4b revert: 창업 비용 총액을 8,636만원으로 되돌리고 보증금 반환 문구를 앞으로 올린다
- 미커밋 변경: 20건

```
M  .gitignore
A  AI-DEV-RULES.md
M  CLAUDE.md
A  app/api/space-consult/route.ts
A  app/consult/page.tsx
M  app/sitemap.ts
A  components/consult/ConsultIntro.tsx
A  components/consult/SpaceConsultForm.tsx
A  database/prisma/migrations/20260810000000_add_lead_attachments/migration.sql
M  database/prisma/schema.prisma
M  lib/company/profile.ts
A  lib/consult/content.ts
A  lib/consult/validateDrawings.test.ts
A  lib/consult/validateDrawings.ts
M  lib/notifications/leadEmail.ts
M  lib/supabase/admin.ts
M  lib/supabase/storage.ts
M  lib/validations/lead.schema.ts
M  services/leadService.ts
M  types/lead.ts
```
