# DOCUMENT-INDEX — 전체 문서 카테고리 분류

> 프로젝트 내 모든 `.md` 문서(67개, `find -name "*.md"` 재카운트 검증, MASTER INITIALIZATION 신규 5건 포함)를 자동 분류. `docs/`는 Git 미추적(frozen, 삭제 불가/비권장).

## README
- [README.md](README.md) — 프로젝트 개요 + STEP 1-10 설치가이드
- `content-automation-agent/README.md` — Media OS 모듈 개요
- `docs/README.md` *(frozen)*

## INSTALL
- [INSTALL.md](INSTALL.md) — 로컬/Docker/QA/ERP 실행법

## CEO / Governance
- [CEO-CHARTER.md](CEO-CHARTER.md) — 최상위 명령(승인규칙·보고형식)
- [CLAUDE.md](CLAUDE.md) — AI HQ 운영 매뉴얼
- [AGENTS.md](AGENTS.md) — 레거시 STEP 규칙
- `docs/master/AI_CONSTITUTION.md` *(frozen, 참고용)*
- `docs/master/AI_ORGANIZATION_MASTER.md` *(frozen, **정본**)*
- `docs/organization/AI_ORGANIZATION_MASTER.md` *(frozen, ⚠️ 구버전 — master/ 쪽이 정본)*
- `docs/master/AI_COMMUNICATION_SYSTEM.md` *(frozen)*
- `docs/master/AI_DECISION_SYSTEM.md` *(frozen)*
- `docs/master/AI_ROLE_LIBRARY.md` *(frozen)*
- `docs/master/AI_TOOL_MAPPING.md` *(frozen)*
- `docs/organization/AI_ORGANIZATION.md` *(frozen)*

## Architecture / System
- [SYSTEM.md](SYSTEM.md) — 스택·모듈맵·가드레일
- [AI-HQ-ARCHITECTURE.md](AI-HQ-ARCHITECTURE.md) — Docker/AI-HQ 구조결정
- [API.md](API.md) — 엔드포인트·CLI 레퍼런스
- `docs/architecture/overview.md` *(frozen)*
- `docs/architecture/mcp-architecture.md` *(frozen)*
- `docs/architecture/multitenancy.md` *(frozen)*
- `docs/architecture/decisions/ADR-000.md` *(frozen)*
- `docs/api/overview.md` *(frozen)*
- `docs/api/versioning.md` *(frozen)*
- `docs/database/master-database.md` *(frozen)*
- `docs/database/rls-policies.md` *(frozen)*
- `docs/database/schema.md` *(frozen)*
- `docs/ai-agents/agent-contract.md` *(frozen)*
- `docs/ai-agents/interior-agent.md` *(frozen)*

## Roadmap / Planning
- [ROADMAP.md](ROADMAP.md) — 현재 AI HQ 단계별 로드맵(활성)
- [TODO.md](TODO.md) — 우선순위별 작업목록(활성)
- `docs/master/DEVELOPMENT_MASTER_ROADMAP.md` *(frozen, OS 전체 로드맵)*
- `docs/master/BACKLOG.md` *(frozen, **정본**)*
- `docs/organization/BACKLOG.md` *(frozen, ⚠️ 구버전)*
- `docs/roadmap/roadmap.md` *(frozen)*
- `docs/development/SPRINT_MASTER_PLAN.md` *(frozen)*
- `docs/development/SPRINT_01_PROJECT_FOUNDATION.md` *(frozen)*
- `docs/development/SPRINT_01_HEALTH_REPORT.md` *(frozen)*
- `docs/development/SPRINT_02_AUTH.md` *(frozen)*
- `docs/development/SPRINT_03_DATABASE.md` *(frozen)*
- `docs/development-rules/workflow.md` *(frozen)*
- `docs/development-rules/module-rules.md` *(frozen)*

## CHANGELOG
- [CHANGELOG.md](CHANGELOG.md) — 전체 변경이력(활성, Priority 단위 추적)

## QA / Audit (생성 산출물)
- [QA-REPORT.md](QA-REPORT.md) — `npm run qa:extended` 산출물(재실행 시 갱신)
- [audit-report.md](audit-report.md) — `npm run audit` 산출물(재실행 시 갱신)
- `docs-sync-report.json` — `npm run check-docs`(AI Documentation) 산출물(재실행 시 갱신, JSON이라 목록에 링크는 생략)

## Knowledge Base (도메인)
- `docs/master/MASTER_INDEX.md` *(frozen)*
- `docs/master/MASTER_DIRECTORY.md` *(frozen)*
- `docs/00-overview.md` *(frozen)*
- `docs/01-master-blueprint.md` *(frozen)*
- `docs/franchise/FRANCHISE_MASTER_PLAN.md` *(frozen — Notion Franchise KB로 실데이터 이관 완료)*
- `docs/portfolio/PORTFOLIO_MASTER_PLAN.md` *(frozen)*
- `docs/knowledge-base/COMPANY_KNOWLEDGE_BASE_MASTER.md` *(frozen)*
- `docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md` *(frozen — 현재 실제 배포는 Vercel 자동배포로 대체)*
- `content-automation-agent/guides/gbrick-style.md`
- `content-automation-agent/guides/designpobee-style.md`

## Content 산출물 (Git 무시 대상)
- `content-automation-agent/output/{blog,blogger,naver}.md` — OSMU 생성 산출물(실행마다 갱신)

## Index (본 문서군)
- [PROJECT-INDEX.md](PROJECT-INDEX.md) — 10개 영역별 프로젝트 색인
- DOCUMENT-INDEX.md — 본 문서
- [DOCUMENT-POLICY.md](DOCUMENT-POLICY.md) — 문서 관리 3단계 정책(Git/Git제외/Drive)
- [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) — 문서 표준 구조 v1.0(배치·명명·중복처리 규칙)
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) — 폴더 트리(경량 참조)

## AI Headquarters (MASTER INITIALIZATION 신규, 2026-07-22)
- [AI-HQ-MASTER.md](AI-HQ-MASTER.md) — AI 직원 현황·보고규칙·QA/Audit·자동화현황·Priority
- [SYSTEM-ARCHITECTURE.md](SYSTEM-ARCHITECTURE.md) — Mermaid 아키텍처 다이어그램
- [DECISION-LOG.md](DECISION-LOG.md) — 주요 기술 결정 소급기록
- [CEO-REPORT.md](CEO-REPORT.md) — CEO 보고 형식(정본, v2 최신)
- [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) — AI 직원 운영지침 v1.0(직급·승격기준·실행권한·보고주기·에스컬레이션·퇴출기준, 2026-07-23 신설)

---
## 문서 중복 분석 결과 (CEO 지시 §3-5)
| 중복 파일 | 정본 | 구버전(비권장) | 조치 |
|---|---|---|---|
| `AI_ORGANIZATION_MASTER.md` | `docs/master/` (18408→7549바이트로 압축, 40분 뒤 작성) | `docs/organization/` | **삭제하지 않음**(Git 미추적, 복구 불가) — 본 색인으로 정본 표시만 |
| `BACKLOG.md` | `docs/master/` | `docs/organization/` | 상동 |

**통합 제안**: 없음 — 루트 활성 문서(CLAUDE.md/CEO-CHARTER.md/ROADMAP.md/TODO.md 등)는 각각 목적이 달라 통합 불필요. `docs/**`는 frozen 상태 유지, 새 설계 문서 추가 안 함(과거 결정 준수).
**삭제 후보**: 없음 — `docs/`는 Git 미추적이라 "Git 복구 가능 시에만 삭제" 원칙상 삭제 대상에서 제외.
