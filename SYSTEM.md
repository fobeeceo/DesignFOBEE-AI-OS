# SYSTEM — 아키텍처 개요

## SSOT 데이터 흐름 (헌장 §3)
```
Google Drive(원본) → Notion Master DB(정본) → ERP(운영) → Dashboard(조회)
                                                   → Github → Vercel → Production
```
모든 AI/화면은 Master DB만 참조. 변경은 Living Document → Change Report → CEO 승인 → 반영.

## 기술 스택
- 웹: Next.js 14 (App Router) · Tailwind v3 + shadcn 토큰 · TypeScript.
- 데이터: Supabase(Postgres, Prisma) · Notion(운영 Master DB) · Google Drive(원본).
- 자동화/데이터: Python (`content-automation-agent/src`), openpyxl.
- 배포: GitHub `fobeeceo/DesignFOBEE-AI-OS` (main) → Vercel `design-fobee-ai-os`.

## 모듈 맵
| 모듈 | 위치 | 상태 |
|---|---|---|
| 브랜드 홈 + AI 스튜디오 | `app/page.tsx`, `app/design`, `components/home` | ✅ |
| AI HQ 웹 | `app/hq/**`, `lib/hq/erpSnapshot.ts`, `app/api/hq/erp` | ✅ |
| AI ERP | `content-automation-agent/src/{pos_import,dessert_import,erp_engine}.py` | ✅ 실데이터 |
| Media OS | `content-automation-agent/src/{generate_osmu,publishers,publish_all,analytics}.py` | ✅ (업로드 자격증명 대기) |
| 인증/CRM 퍼널 | `app/(dashboard)`, `app/(admin)`, `services/`, `middleware.ts` | ✅ |

## 가드레일
- API 키는 `.env`만 (`content-automation-agent/.env.example` 참조). 코드에 키 금지.
- 미들웨어: env 없으면 인증 스킵 → 홈/`/design`/`/hq` 공개 렌더(빌드/배포 안전).
- `.gitignore`: `.env*`, `docs/`(민감), `output/`, `logs/`, `__pycache__`, `settings.local.json`.
- 배포 안전: 모든 페이지 env 없이 빌드 OK (auth 페이지 force-dynamic).

## 자동화
- `git push origin main` → Vercel 자동 배포.
- 예약 루틴 `gbrick-ai-os-build` (매일 09:30) — 앱 열려 있을 때 이어서 빌드.
- Living Document 루프: "Living Document 실행" 트리거로 Drive→제안 반복.
