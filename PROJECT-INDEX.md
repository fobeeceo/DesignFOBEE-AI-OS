# PROJECT-INDEX — DesignFOBEE AI Headquarters

> 프로젝트 루트: `D:\Project\ReRoomAI` (Git 저장소). 모든 경로는 이 폴더 기준.
> 전체 프로젝트를 10개 영역으로 분류하고, 각 영역의 목적·담당·관련 폴더·관련 문서를 연결한다.

## 1. AI Headquarters
- **목적**: CEO 위임 운영체계 — 승인규칙·헌장·AI 조직·보고형식.
- **담당**: MASTER AI(CTO 겸임, 미분리 — 갭 기록됨) / AI CEO(Notion) / AI CTO(Claude Code).
- **관련 폴더**: 없음(문서 중심).
- **관련 문서**: [CEO-CHARTER.md](CEO-CHARTER.md)(최상위 명령) · [CLAUDE.md](CLAUDE.md)(운영 매뉴얼) · [AGENTS.md](AGENTS.md)(레거시 STEP 규칙).

## 2. Homepage
- **목적**: DesignFOBEE 브랜드 홈페이지 + 무로그인 AI 스튜디오(`/design`) + 인증 퍼널.
- **담당**: AI 개발(Frontend), AI 디자이너(Notion), Creative Director(세션 내 임시 역할).
- **관련 폴더**: `app/`(page.tsx·design/·(auth)/·(dashboard)/) · `components/home/` · `components/design/` · `components/layout/` · `components/ui/`.
- **관련 문서**: [README.md](README.md) §STEP 가이드 · [API.md](API.md).

## 3. ERP
- **목적**: GBRICK Coffee 실데이터 ERP — POS 매출·재고 발주추천·음료/디저트 원가.
- **담당**: AI 회계(Notion) · AI 개발.
- **관련 폴더**: `content-automation-agent/src/{pos_import,dessert_import,erp_engine}.py`.
- **관련 문서**: [API.md](API.md) §Python CLI · [SYSTEM.md](SYSTEM.md).

## 4. Automation (Media OS)
- **목적**: OSMU 콘텐츠 생성 → 7채널 배포(승인게이트) → 성과분석.
- **담당**: AI 콘텐츠 + 13 Media Worker(Notion).
- **관련 폴더**: `content-automation-agent/src/{generate_osmu,publishers,publish_all,analytics}.py` · `content-automation-agent/guides/`.
- **관련 문서**: `content-automation-agent/README.md`.

## 5. Dashboard (AI HQ 웹)
- **목적**: 로그인 후 `/hq` — CEO Dashboard·ERP·가맹점·물류·교육·콘텐츠·AI직원·설정 8메뉴.
- **담당**: AI Dashboard(갭, 전담 역할 없음 — CTO가 겸임).
- **관련 폴더**: `app/hq/**` · `lib/hq/erpSnapshot.ts` · `app/api/hq/erp/route.ts`.
- **관련 문서**: [API.md](API.md) §/api/hq/erp.

## 6. Infrastructure
- **목적**: Docker Compose 배포(로컬/자체호스팅) + Vercel 자동배포(운영).
- **담당**: AI CTO.
- **관련 폴더**: `AI-HQ/`(오케스트레이션) · 루트 `Dockerfile`(web) · `content-automation-agent/Dockerfile`(erp).
- **관련 문서**: [AI-HQ-ARCHITECTURE.md](AI-HQ-ARCHITECTURE.md) · [INSTALL.md](INSTALL.md).

## 7. Documentation
- **목적**: 프로젝트 전체 문서 체계 유지·동기화.
- **담당**: AI Documentation(Notion, 실체 있음).
- **관련 폴더**: 루트(운영 문서, Git 추적) · `docs/`(과거 설계 단계 문서, **Git 미추적·frozen**).
- **관련 문서**: 본 파일 + [DOCUMENT-INDEX.md](DOCUMENT-INDEX.md).

## 8. Knowledge (SSOT)
- **목적**: Google Drive(원본) + Notion Master DB(정본) — Franchise/Portfolio/메뉴/원가 등.
- **담당**: AI 프랜차이즈·AI 회계(Notion).
- **관련 폴더**: 코드 SSOT `prompts/` · `lib/hq/erpSnapshot.ts`.
- **관련 문서**: `docs/franchise/FRANCHISE_MASTER_PLAN.md`(frozen, 참고용) · `docs/knowledge-base/COMPANY_KNOWLEDGE_BASE_MASTER.md`(frozen).

## 9. Media
- **목적**: 콘텐츠 산출물(블로그/SNS 등) 저장.
- **담당**: AI 콘텐츠.
- **관련 폴더**: `content-automation-agent/output/`(git 무시) · `public/images/portfolio/`.
- **관련 문서**: 없음(산출물 중심).

## 10. Archive (과거 설계 단계, Git 미추적·수정 금지)
- **목적**: 프로젝트 초기 설계 문서 — **frozen**, 참고용으로만 유지, 새 설계 문서 추가 금지(과거 결정: "Design Phase Complete").
- **담당**: 없음(비활성).
- **관련 폴더**: `docs/master/`·`docs/organization/`·`docs/development/`·`docs/architecture/`·`docs/database/`·`docs/api/`·`docs/ai-agents/`·`docs/deployment/`·`docs/development-rules/`·`docs/portfolio/`·`docs/franchise/`·`docs/knowledge-base/`·`docs/roadmap/`.
- **⚠️ 중복 발견**(DOCUMENT-INDEX.md 상세): `docs/organization/AI_ORGANIZATION_MASTER.md`·`BACKLOG.md`는 `docs/master/`의 동명 파일에 의해 **대체됨**(같은 날 40분 뒤 작성, master가 최신·정본). **삭제하지 않음** — `docs/`가 Git 미추적이라 삭제 시 복구 불가(CEO 원칙 위배 소지). 대신 이 색인으로 "master가 정본"임을 명시.

---
## 활성 vs 동결 구분 (혼동 방지)
| 구분 | 위치 | Git | 상태 |
|---|---|---|---|
| **활성 운영 문서** | 루트 `*.md` | 추적됨 | CEO-CHARTER.md가 최상위, 계속 갱신 |
| **frozen 설계 문서** | `docs/**` | **미추적** | 참고용, 새 프로젝트 지시는 루트 문서 기준으로 수행 |
