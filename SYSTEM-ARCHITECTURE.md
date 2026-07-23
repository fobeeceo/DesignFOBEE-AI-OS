# SYSTEM-ARCHITECTURE — Mermaid Diagram

> CEO MASTER INITIALIZATION MISSION §7 산출물. 산문 설명은 [SYSTEM.md](SYSTEM.md) 참조(중복 회피, 본 문서는 다이어그램 전용).

```mermaid
flowchart TD
    CEO["👤 CEO<br/>비전·전략·최종승인"]
    CTO["🤖 AI CTO (Claude Code)<br/>CEO-CHARTER.md 위임"]
    HQ["🏢 AI Headquarters<br/>CLAUDE.md · CEO-CHARTER.md"]
    HOME["🏠 Homepage<br/>app/, components/home,design"]
    ERP["🏭 ERP<br/>content-automation-agent/src"]
    DASH["📊 Dashboard (/hq)<br/>app/hq/**, lib/hq"]
    INFRA["🐳 Infrastructure<br/>AI-HQ/docker-compose.yml"]
    DOCKER["Docker<br/>web + erp 서비스"]
    VERCEL["▲ Vercel<br/>자동배포(운영)"]
    GITHUB["🐙 GitHub<br/>fobeeceo/DesignFOBEE-AI-OS"]
    DRIVE["📁 Google Drive<br/>GBRICK_AI_SYSTEM (원본 SSOT)"]
    NOTION["📋 Notion Master DB<br/>정본 레지스트리"]
    EMP["👥 AI Employees<br/>QA·Audit·Security·Documentation·Media 등"]

    CEO -->|위임| CTO
    CTO -->|운영| HQ
    HQ --> HOME
    HQ --> ERP
    HQ --> DASH
    HQ --> INFRA
    HQ --> EMP

    DRIVE -->|원본| NOTION
    NOTION -->|정본 참조| ERP
    NOTION -->|정본 참조| DASH

    ERP -->|erpSnapshot.ts| DASH
    DASH -->|/api/hq/erp| HOME

    INFRA --> DOCKER
    DOCKER -->|로컬/자체호스팅| HOME

    HOME -->|git push| GITHUB
    GITHUB -->|자동빌드| VERCEL
    VERCEL -->|운영 배포| CEO

    EMP -->|QA/Audit 리포트| CTO
    CTO -->|■ 완료한 작업 등| CEO
```

## 범례
- **실선**: 데이터/제어 흐름(SSOT → 정본 → 참조 순).
- CEO↔CTO: 위임(CEO-CHARTER.md) / 보고(CEO-REPORT.md 형식).
- Drive→Notion→ERP/Dashboard: 3계층 SSOT 체인(§CEO-CHARTER §3).
- GitHub→Vercel: 운영 배포 파이프라인(현재 유일한 실제 프로덕션 경로).
- AI-HQ Docker: 로컬/자체호스팅 대안 경로(Vercel과 별개, 병행 가능 — [AI-HQ-ARCHITECTURE.md](AI-HQ-ARCHITECTURE.md) 참조).
