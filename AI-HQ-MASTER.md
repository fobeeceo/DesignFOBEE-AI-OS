# AI-HQ-MASTER — AI Headquarters 운영 원칙

> CEO MASTER INITIALIZATION MISSION §8 산출물. 상위 규범은 [CEO-CHARTER.md](CEO-CHARTER.md)(최상위 명령)·[CLAUDE.md](CLAUDE.md)(운영 매뉴얼, = **AI-HQ-SYSTEM-RULES 역할 겸함**, DOCUMENT-STANDARD §3 "정본 지정" 원칙에 따라 별도 문서로 중복 생성하지 않음). 본 문서는 그 요약·실행 관점 정리다. **직급(등급)·승격·퇴출·실행권한 규칙은 [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) 참조.**

## AI 직원 (현재 실체 있는 것만, [PROJECT-INDEX.md](PROJECT-INDEX.md) §1 연동, 등급은 [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7 참조)
| AI | 역할 | 실체 |
|---|---|---|
| AI CEO | 비전·전략(사람, ChatGPT 겸용 가능) | 사람 |
| AI CTO | Architecture·Security·Automation·Github·Vercel·Docker | Claude Code(본 세션) |
| **AI QA**(정규직) | Accessibility·SEO·Link·Image·Performance 검사 | `scripts/qa-extended.js` — Training Center·평가기준 등록 완료(§2 11조건 충족) |
| **AI Audit**(정규직) | Dead Code·중복·Security·Env·Git 감사 | `scripts/audit.js` — 상동 |
| AI Security | 시크릿·npm audit·저장소 가시성 | `scripts/audit.js`(checkSecurity), AI Audit에 통합된 하위기능 |
| **AI Documentation**(정규직) | 문서 색인·CHANGELOG 정합성 검사 | `scripts/check-docs-sync.js`(신규 코드화) — 루트 .md 23개 검사, 불일치 0건, 11조건 전부 충족 |
| **AI 디자이너**(정규직) | 공간 사진 → AI 리디자인 | `agents/interiorDesignAgent.ts`(실서비스 연결), Docker 이미지 반영 확인 |
| **AI 마케터**(정규직) | 창업/브랜드 마케팅 카피 | `agents/marketerAgent.ts` + `POST /api/hq/marketing-copy`(신규 코드화) — Franchise SSOT+법정고지 강제, 11조건 전부 충족 |
| **AI CEO(전략)**(정규직) | 의사결정 파트너(복수대안+반대의견) | `agents/ceoStrategyAgent.ts` + `POST /api/hq/strategy-analysis`(신규 코드화) — 제안까지만(실행 없음), 11조건 전부 충족 |
| AI 콘텐츠 | SNS/블로그/쇼츠 기획(초안, 정본지정 완료) | `generate_osmu.py`(Media Director, 정규직)와 산출물 중복 확인 — 코드 중복 생성 대신 Media Director를 정본으로 지정(DECISION-LOG 참조) |
| **AI SEO Manager**(정규직) | 구글/네이버 SEO 검증 | `scripts/qa-extended.js checkSeo()` — 11조건 전부 충족(2026-07-23) |
| **AI 웹디자인전략가**(정규직) | 경쟁사 홈페이지 fetch+분석 → 트렌드 종합 → 우리 홈페이지 대비 P1/P2/P3 제안 | `agents/designTrendAgent.ts` + `POST /api/hq/design-trends`(관리자 인증) — Docker web 이미지 반영·11조건 전부 충족 |
| **AI 메뉴전략가**(정규직) | 판매량×마진 매트릭스(Kasavana & Smith)로 메뉴 단종·프로모션 후보 자동 산출 | `content-automation-agent/src/erp_engine.py menu_engineering()` + `/hq/erp` UI — Docker erp 컨테이너 내 실행 검증, 11조건 전부 충족 |
| AI CRM | 리드 응대·분류(수습, 검증 미완) | Notion 프롬프트뿐 — 코드는 CRUD만, 실고객 리드 없어 검증 대기 |
| **AI Blog Writer / AI Shorts Producer / Media Director**(정규직) | SEO 블로그·쇼츠 대본 생성, OSMU 오케스트레이션 | `content-automation-agent/src/generate_osmu.py`(실Gemini 연동) — Docker erp 컨테이너 내 실행 검증(`live:true`), 11조건 전부 충족 |
| **AI Trend Researcher**(정규직) | 키워드 수집·경쟁콘텐츠 분석·기회 도출 | `content-automation-agent/src/trend_research.py` — Docker erp 컨테이너 내 실행 검증, 11조건 전부 충족 |
| AI Content Analyst | 성과분석(수습, 코드는 실API 대기 완료) | `analytics.py` — Meta Graph/YouTube Data API v3 실호출 코드 구현 완료(자격증명 없어 미검증). CEO가 [INSTALL.md](INSTALL.md) §6으로 직접 가입·자격증명 전달 시 즉시 재검증 |
| AI 견적 | 예상 견적 산정(개선중) | `prompts/pricing.ts` 실서비스 연결이나 **가격이 placeholder**(실제 디자인포비 단가 CEO 승인 대기, TODO.md) — 신기준 3번(실제 데이터) 미충족 |
| **미충족**(실체 없음, 정직 기록) | MASTER(CTO와 미분리)·COO·PM·Research(범용)·Interior(전담)·UX·Frontend/Backend(전담)·Automation(전담)·Dashboard(전담)·Customer Success·Finance(전담) | — |

> 상세 11조건 충족표는 [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7. AI-HQ 조직도(실시간)는 `/hq/staff`.

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
- Docker: `AI-HQ/docker-compose.yml`(web 상시·erp 온디맨드), 2026-07-23 최신 코드로 재빌드·기동 확인(web HTTP 200, erp 컨테이너 내 menu_engineering·generate_osmu·trend_research 실행 검증).

## 우선순위 (Priority)
[TODO.md](TODO.md)가 정본. 요약: P1=MASTER INITIALIZATION 완료·접근성실수정 / P2=ERP 실시간화·전국POS집계 / P3=Franchise포털·상시러너.

## 자동 실행 규칙
[CEO-CHARTER.md](CEO-CHARTER.md) §승인규칙 6항목(실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경) 외에는 승인 요청 없이 즉시 진행. 작업 종료 시 다음 우선순위를 스스로 선택해 계속(§연속실행규칙).

## AI 회의 (현재 상태 — 정직 기록)
헌장은 Research→Design→Development→Marketing→SEO→QA→Audit→MASTER 순 다자 AI 회의를 규정하나, **현재 이 회의는 단일 AI(Claude Code, CTO 역할)가 각 관점을 순차 검토하는 방식으로 대체 수행 중**이며 별도 AI 에이전트 간 실제 회의 시스템은 아직 구축되지 않았다(§미충족 역할과 동일한 갭). 향후 구축 후보로 TODO.md에 기록.
