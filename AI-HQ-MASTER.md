# AI-HQ-MASTER — AI Headquarters 운영 원칙

> CEO MASTER INITIALIZATION MISSION §8 산출물. 상위 규범은 [CEO-CHARTER.md](CEO-CHARTER.md)(최상위 명령)·[CLAUDE.md](CLAUDE.md)(운영 매뉴얼, = **AI-HQ-SYSTEM-RULES 역할 겸함**, DOCUMENT-STANDARD §3 "정본 지정" 원칙에 따라 별도 문서로 중복 생성하지 않음). 본 문서는 그 요약·실행 관점 정리다.

## AI 직원 (현재 실체 있는 것만, [PROJECT-INDEX.md](PROJECT-INDEX.md) §1 연동)
| AI | 역할 | 실체 |
|---|---|---|
| AI CEO | 비전·전략(사람, ChatGPT 겸용 가능) | 사람 |
| AI CTO | Architecture·Security·Automation·Github·Vercel·Docker | Claude Code(본 세션) |
| AI QA | Accessibility·SEO·Link·Image·Performance 검사 | `scripts/qa-extended.js` |
| AI Audit | Dead Code·중복·Security·Env·Git 감사 | `scripts/audit.js` |
| AI Security | 시크릿·npm audit·저장소 가시성 | `scripts/audit.js`(checkSecurity) |
| AI Documentation | 문서 동기화(CHANGELOG/ROADMAP/TODO) | 본 세션 절차 |
| AI 디자이너/마케터/견적/CRM/콘텐츠 | 각 도메인 | Notion AI Prompt Library(6종) |
| Media Director + 13 Worker | OSMU 콘텐츠 파이프라인 | Notion AI Media Workforce |
| **미충족**(실체 없음, 정직 기록) | MASTER(CTO와 미분리)·COO·PM·Research(범용)·Interior(전담)·UX·Frontend/Backend(전담)·Automation(전담)·Dashboard(전담)·Customer Success·Finance(전담) | — |

## CEO 보고 규칙
[CEO-CHARTER.md](CEO-CHARTER.md) §16-C가 정본. 실제 운용 중 확장된 최신 형식은 [CEO-REPORT.md](CEO-REPORT.md) 참조(항목 최다 버전, 이후 모든 보고는 이 형식을 기준으로 함).

## QA / Audit
- `npm run qa` — lint+type-check+build (배포 게이트, 필수).
- `npm run qa:extended` — a11y/SEO/링크/이미지/성능 (`QA-REPORT.md`).
- `npm run audit` — 8항목 감사 (`audit-report.md`).
- 원칙: 검증되지 않은 작업은 완료로 보고하지 않는다(§검증규칙).

## 자동화 현황
- 배포: `git push` → Vercel 자동배포.
- 예약 루틴 `gbrick-ai-os-build`(매일 09:30, 세션 종속 — 완전 무인 아님, 앱 실행 중일 때만 발화). 실제로 2026-07-22 새벽 병행 실행되어 Dead Code 삭제·`/hq/erp` 라이브 연결을 자율 완료한 사례 있음([CHANGELOG.md](CHANGELOG.md) 참조).
- Docker: `AI-HQ/docker-compose.yml`(web 상시·erp 온디맨드), `docker compose up -d` 실행 중.

## 우선순위 (Priority)
[TODO.md](TODO.md)가 정본. 요약: P1=MASTER INITIALIZATION 완료·접근성실수정 / P2=ERP 실시간화·전국POS집계 / P3=Franchise포털·상시러너.

## 자동 실행 규칙
[CEO-CHARTER.md](CEO-CHARTER.md) §승인규칙 6항목(실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경) 외에는 승인 요청 없이 즉시 진행. 작업 종료 시 다음 우선순위를 스스로 선택해 계속(§연속실행규칙).

## AI 회의 (현재 상태 — 정직 기록)
헌장은 Research→Design→Development→Marketing→SEO→QA→Audit→MASTER 순 다자 AI 회의를 규정하나, **현재 이 회의는 단일 AI(Claude Code, CTO 역할)가 각 관점을 순차 검토하는 방식으로 대체 수행 중**이며 별도 AI 에이전트 간 실제 회의 시스템은 아직 구축되지 않았다(§미충족 역할과 동일한 갭). 향후 구축 후보로 TODO.md에 기록.
