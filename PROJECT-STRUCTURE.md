# PROJECT-STRUCTURE — 폴더 트리

> CEO MASTER INITIALIZATION MISSION §4 산출물. **가벼운 참조 문서** — 상세 설명은 [SYSTEM.md](SYSTEM.md)(스택·모듈맵), 영역별 연결은 [PROJECT-INDEX.md](PROJECT-INDEX.md)(10개 영역) 참조([DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3: 중복 대신 상호참조).

```
D:\Project\ReRoomAI\  (Git 저장소 루트)
├── AI-HQ/                    # Docker Compose 오케스트레이션 (Infrastructure)
├── agents/                   # Gemini AI 에이전트(이미지·설명 생성)
├── app/                      # Next.js App Router
│   ├── hq/                     # AI HQ 대시보드 (Dashboard)
│   ├── design/                 # 무로그인 AI 스튜디오 (Homepage)
│   ├── api/                    # API 라우트
│   ├── (auth)/, (dashboard)/, (admin)/  # 인증 퍼널
├── components/                # React 컴포넌트 (home/design/hq/layout/ui/admin/auth/upload)
├── content-automation-agent/  # ERP + Media OS (Python)
│   ├── src/                     # pos_import·dessert_import·erp_engine·generate_osmu·publishers
│   └── guides/                   # 브랜드 스타일 가이드
├── database/                  # Prisma 스키마
├── docs/                      # ⚠️ frozen·Git 미추적 — 초기 설계 문서 (Archive)
├── lib/                       # 유틸(hq/erpSnapshot.ts·supabase/·auth/·validations/)
├── prompts/                   # 인테리어 스타일·견적 단가 정의
├── public/                    # 정적 자산(images/portfolio 등)
├── scripts/                   # QA/Audit 자동화 스크립트
├── services/                  # 비즈니스 로직 서비스 레이어
├── types/                     # TypeScript 타입 정의
├── Dockerfile                 # web 서비스
├── middleware.ts              # 인증 게이트(/hq)
└── (루트 *.md)                # 운영 문서 — DOCUMENT-INDEX.md 참조
```

## 기술 스택 요약 (상세: [SYSTEM.md](SYSTEM.md))
Next.js 14 · Tailwind v3 · TypeScript · Supabase/Prisma · Python(ERP/Media) · Docker Compose · Vercel.
