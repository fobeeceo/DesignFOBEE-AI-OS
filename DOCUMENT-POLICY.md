# DOCUMENT-POLICY — 문서 관리 정책

> CEO 지시(2026-07-22) §1·§2 수행 결과. 근거 기반(직접 확인), 추측 없음.

## 1. `docs/` Git 미추적 원인 분석

**결론: 의도된 설계(보안 결정)다. 실수가 아니다.**

**근거** (직접 확인):
- `.gitignore` 라인 15 `docs/` 는 커밋 `5f0fbd61`(2026-07-20 11:22:48, 작성자 fobeeceo)에서 추가됨(`git blame` 확인).
- 바로 위 라인 14에 명시적 사유 주석: `# 내부 문서(정보공개서 재무·창업비용·설계 등 민감) — 공개 저장소 노출 방지`.
- 같은 커밋의 커밋 메시지에도 동일 사유 명시: `"exclude internal docs/ from public repo"`.
- **당시 상황**: 이 커밋 직전, 저장소가 PUBLIC임이 확인되었고(GitHub API), `docs/`에 정보공개서 재무·창업비용·전략 문서가 포함되어 있어 그대로 push하면 전부 공개되는 상황이었음. 이를 막기 위해 최초 대규모 push 직전에 `docs/`를 통째로 gitignore 처리함.
- **현재도 유효한가**: **예**. 방금 GitHub API로 재확인 — 저장소는 **여전히 `private: false`(PUBLIC)**. CEO가 "Private 유지"를 승인했으나(2026-07-21) 실행에는 GitHub 관리자 권한이 필요하며 CTO(Claude Code)는 해당 자격증명(GITHUB_TOKEN/gh CLI)이 없어 직접 변경 불가 — 즉 저장소는 실제로는 아직 공개 상태이고, 이 gitignore 보호가 **지금도 유일한 안전장치**다.

**과거 프로젝트 정책과의 관계**: 이 결정은 별도로, 그보다 이전에 있었던 "Design Phase Complete — docs/master/는 canonical frozen set, 새 설계 문서 추가 금지"라는 정책(메모리 기록)과도 부합한다 — `docs/`는 이미 그 시점에 "더 이상 편집하지 않는 동결 자료"로 취급되고 있었고, 이후 보안 사유로 Git 추적에서도 제외됐다. 두 결정이 서로 강화하는 관계다.

## 2. 문서 관리 3단계 정책

### ① Git으로 관리해야 하는 문서 (루트, 추적됨)
**이유**: 비민감·활성 운영 문서. 팀/CEO가 GitHub에서 상시 열람·이력 추적 필요.

| 문서 | 사유 |
|---|---|
| CLAUDE.md, CEO-CHARTER.md, AGENTS.md | 운영 헌장·거버넌스 — 비민감, 상시 참조 |
| README.md, INSTALL.md | 설치/실행 가이드 — 공개돼도 무방(코드 자체가 이미 공개) |
| CHANGELOG.md, ROADMAP.md, TODO.md | 변경이력/계획 — 비민감, 협업 필수 |
| API.md, SYSTEM.md, AI-HQ-ARCHITECTURE.md | 기술 문서 — 비민감(가격·재무 정보 없음) |
| PROJECT-INDEX.md, DOCUMENT-INDEX.md, DOCUMENT-POLICY.md, DOCUMENT-STANDARD.md | 문서 체계 자체 — 비민감 |
| QA-REPORT.md, audit-report.md | 품질/감사 증거 — 비민감, 투명성 목적상 오히려 공개 유지가 유리 |
| `content-automation-agent/README.md`, `guides/*.md` | 브랜드 스타일 가이드 — 비민감 |

### ② Git에서 제외해야 하는 문서 (`docs/`, 미추적 유지)
**이유**: 정보공개서 재무·창업비용·회사 전략·조직 설계 등 **민감 정보 포함** + 저장소가 여전히 PUBLIC.

| 하위 폴더 | 민감 사유 |
|---|---|
| `docs/franchise/` | 정보공개서 기반 재무·창업비용 원본 분석 |
| `docs/knowledge-base/` | 회사 지식베이스 마스터플랜(전략) |
| `docs/portfolio/` | 실제 프로젝트/고객사 상세 |
| `docs/master/`, `docs/organization/` | AI 조직·의사결정·백로그 등 내부 경영 전략 |
| `docs/development/`, `docs/architecture/`, `docs/database/`, `docs/api/`, `docs/ai-agents/`, `docs/deployment/`, `docs/development-rules/`, `docs/roadmap/` | 초기 설계 단계 전체가 일괄 보호 대상으로 결정됐음(폴더 단위 차단) — 개별 재검토는 하지 않음(§AI CTO 원칙: 임의 이동/삭제 금지) |

**정책**: 저장소가 Private로 전환되기 전까지 이 폴더 전체는 미추적을 유지한다. Private 전환 후에도 `docs/master/`는 "frozen" 방침(신규 설계 문서 추가 금지)은 유지하되, 재무/민감 하위 폴더(franchise/knowledge-base)만 재검토 후 개별 추적 여부를 결정할 수 있다(다음 사이클, CEO 확인 권장).

### ③ Google Drive에서 관리하는 문서 (원본 SSOT, 로컬 미보관)
**이유**: SSOT 원칙(§3, CEO-CHARTER) — Drive가 원본, 로컬/Git은 참조·스냅샷만.

| 원본 | 위치 | 로컬 참조 방식 |
|---|---|---|
| MENU/RECIPE/INGREDIENT/OPTION_MASTER | Google Drive `GBRICK_AI_SYSTEM/02_MASTER_DB` | `content-automation-agent/src/erp_engine.py` 내 SSOT 스냅샷(값 하드코딩 + 출처 주석) |
| POS 마감 원본(Excel) | 사용자 업로드(Drive/로컬 다운로드) | `pos_import.py`가 파싱 → `output/*.json`(gitignore) |
| 디저트단가표·정보공개서(HWP/PDF) | Google Drive | 분석 결과만 Notion Master DB·`erp_engine.py`에 반영, 원본 파일 자체는 저장 안 함 |
| 지명원·시공사진 | Google Drive | `public/images/portfolio/`에 **선별된 웹용 사본만** 저장(원본 해상도/전체 세트는 Drive 유지) |

**정책**: 원본 문서 파일(HWP/PDF/XLSX 등)은 프로젝트에 절대 복제하지 않는다. 코드/문서는 Drive 링크 또는 추출된 값만 참조한다(이미 여러 차례 이 세션에서 지켜진 원칙).
