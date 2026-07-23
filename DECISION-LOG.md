# DECISION-LOG — 주요 기술 결정 기록

> CEO MASTER INITIALIZATION MISSION §12 산출물. 이후 모든 중요 기술 결정은 여기 append한다. 형식: 날짜·결정·근거·대안 비교(§문제해결규칙: 대안 3개 이상 검토).

## 2026-07-20 — `docs/`를 Git에서 제외
- **결정**: `.gitignore`에 `docs/` 추가.
- **근거**: 저장소가 PUBLIC으로 확인됐고 `docs/`에 정보공개서 재무·창업비용 등 민감정보 포함 → 최초 대규모 push 전 보호 필요.
- **영향**: `docs/`가 이후 완전히 Git 미추적 상태로 굳어짐(2026-07-22 재검토, [DOCUMENT-POLICY.md](DOCUMENT-POLICY.md) 참조).

## 2026-07-21 — AI HQ 웹 셸 Docker 폴더 구조
- **검토 대안 3개**: ①monorepo 전체를 `AI-HQ/`로 물리 이동 ②`AI-HQ/`에 서비스 코드 복제 ③오케스트레이션(compose)만 `AI-HQ/`, Dockerfile은 각 서비스 폴더 유지.
- **선택**: ③. **이유**: ①은 Vercel 배포 파이프라인 파괴 위험, ②는 이중관리 기술부채. ③이 무파괴·무중복.
- **문서**: [AI-HQ-ARCHITECTURE.md](AI-HQ-ARCHITECTURE.md).

## 2026-07-21 — CEO Operating Charter 승인범위 해석("데이터 삭제" vs "Dead Code 삭제")
- **결정**: 신 헌장 문언("실제 데이터 삭제"만 승인대상)과 구 지시("Dead Code 삭제"도 승인대상)가 상충 → 즉시 자율삭제 대신 **CEO 확인 후 삭제**로 보류.
- **근거**: 삭제는 되돌릴 수 있어도(git) 신뢰비용이 크고, 코드 자체는 이미 무영향이라 지연비용은 0에 가까움.
- **결과**: 2026-07-21 CEO가 명시 승인 → 2026-07-22 실행(참조 재확인→삭제→build exit 0 확인 후 커밋).

## 2026-07-22 — Docker Compose 포트 정책
- **결정**: `docker-compose.yml`의 web 포트를 `${WEB_PORT:-3000}:3000`로 변수화.
- **근거**: 로컬 dev 서버(PID 고정 프로세스)가 3000번을 이미 점유 — 무관한 프로세스를 죽이지 않고 검증하기 위해 오버라이드 가능하게 설계.

## 2026-07-22 — `docs/` 재검토: 삭제 대신 표준 지정
- **결정**: `docs/organization/{AI_ORGANIZATION_MASTER,BACKLOG}.md`가 `docs/master/`의 동명 파일과 중복(구버전) 확인됐으나 **삭제하지 않음**.
- **근거**: `docs/`는 Git 미추적이라 삭제 시 복구 불가 — "모든 변경은 Git 복구 가능해야 한다"는 CEO 원칙과 정면 충돌. [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3 "삭제보다 표준 지정" 원칙으로 대체.

## 2026-07-22 — MASTER INITIALIZATION 신규 문서 배치 위치
- **결정**: AI-HQ-MASTER.md·SYSTEM-ARCHITECTURE.md·DECISION-LOG.md·CEO-REPORT.md 등을 새 `docs/` 폴더가 아니라 **프로젝트 루트**에 생성.
- **근거**: 기존 `docs/`는 frozen·미추적 상태로 이미 결정됨 — 그 안에 활성 신규 문서를 섞으면 정책 혼동. 루트는 이미 Git 추적 중인 활성 운영 문서 영역이라 일관성 유지.
- **문서**: [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §1.

## 2026-07-23 — 인턴 10개 역할 재검증 (CEO "승인" 지시 실행)
- **방법**: AI-STAFF-POLICY §2 기준을 역할별로 실제 적용 — 코드 있으면 재실행, 프롬프트뿐이면 승인SSOT로 직접 1회 실행, 근거 없으면 정직 하향.
- **승격 3건**: AI SEO Manager(`scripts/qa-extended.js checkSeo()`가 이미 실코드였음을 재검증 중 발견), AI 마케터·AI CEO(전략)·AI 콘텐츠(정보공개서 8,636만원·은평본점 2013년 개점 등 승인SSOT로 직접 실행 성공).
- **유지 1건**: AI CRM — DB 실레코드 2건 확인했으나 발신자가 `ceo@fobee.co.kr`+키보드오타 메시지로 테스트데이터임을 확인, 검증 보류.
- **하향 5건**: Media Director·Content Analyst·Trend Researcher·Blog Writer·Shorts Producer — `generate_osmu.py`/`analytics.py`의 `_llm()`이 dry-run 스텁만 반환함을 코드로 확인(`"dry_run": true`), Trend Researcher는 코드 파일 자체가 없음. 기존 "인턴(MVP)" 라벨 자체가 근거 없었음.
- **Notion 데이터 오류 수정**: "AI Documentation — 문서 동기화" 프롬프트가 AI역할="AI CEO"로 잘못 태그돼 있던 것을 "AI Documentation"(신규 select 옵션 추가) 로 수정.
- **전략 판단**: Media OSMU 파이프라인에 실LLM(Gemini) 연동을 지금 추가할지 AI CEO 역할로 직접 검토 → 비용 발생 항목이라 이번 재검증 범위 밖, 별도 CEO 지시 필요로 결론(보류).

## 2026-07-23 — AI 직원 실행권한 원칙: "제안만, 실행은 항상 사람 승인"
- **배경**: CEO 질문 "AI 직원을 정규직으로 채용한다면 뭘 해야 하는가" → 직급/승격/실행권한/보고/에스컬레이션/퇴출 5개 항목이 미정임을 발견해 보고, 실행권한 항목만 CEO 결정 필요로 판단.
- **CEO 결정**: 제안만, 실행은 항상 사람(CEO/CTO) 승인 — AI 직원이 코드/메뉴/발행 등을 스스로 실행하는 자동화는 채택하지 않음.
- **근거**: AI 제안의 신뢰도가 역할마다 다름(메뉴전략가=결정적 계산 vs 웹디자인전략가=확률적 LLM 판단) + 실행 자동화의 되돌리기 난이도가 비대칭적.
- **문서**: [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) 신설(직급 4단계·승격기준·보고주기·에스컬레이션·퇴출기준 포함). 재분류 결과 AI 마케터 등 4개 역할 + Media Workforce 6명이 "정규직(활성)" 라벨에도 불구하고 실데이터 종단 검증 기록이 없어 "인턴"으로 재분류됨(정직 기록, 다음 Audit에서 재검증 예정).

## 2026-07-23 — AI 웹디자인전략가·AI 메뉴전략가 신설(조직도 갭 분석 후 CEO 승인)
- **배경**: CEO 요청으로 AI 조직도 완성도를 직접 조사(Notion AI Prompt Library 6역할 + Media Workforce 13명 SQL 조회) → 실체 작동 6/23(26%), 프롬프트만 10/23(43%), 미착수 7/23(30%) 확인. "경쟁사 분석+트렌드 기반 홈페이지 디자인"·"판매량+마진 기반 메뉴/이벤트 전략"은 기존 23개 역할 중 어디에도 해당하지 않음을 근거로 보고.
- **CEO 결정**: 종합 판단에 찬성, 신설 진행 지시.
- **구현**: ①`agents/designTrendAgent.ts`(Gemini 텍스트 모델, 경쟁사 fetch+분석) — 비용 발생 요소이므로 `requireAdmin()`으로 인증 게이트, `/api/hq/erp` 등 기존 무인증 `/api/hq/*` 패턴을 그대로 따르지 않고 신규 보호 결정. ②`erp_engine.py menu_engineering()`(LLM 미사용, Menu Engineering Matrix 표준 공식) — POS 전체 판매 데이터가 top10만 있어 저판매 메뉴(단종후보)를 못 찾는 기존 한계를 발견해 `pos_import.py`에 `전체_판매` 필드 추가.
- **검증**: 둘 다 실제 데이터로 종단 테스트(더미 아님) — 웹디자인전략가는 스타벅스코리아 실사이트, 메뉴전략가는 실 POS(2026-07-01~20).
- **문서**: Notion AI Prompt Library에 역할 카드 2건 등록(select 옵션 신규 추가), [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 직원표 갱신.

## 2026-07-22 — AI-HQ-SYSTEM-RULES.md 별도 생성 안 함
- **결정**: MASTER INITIALIZATION이 요청한 `AI-HQ-SYSTEM-RULES.md`를 별도 파일로 만들지 않음.
- **근거**: [CLAUDE.md](CLAUDE.md)가 이미 QA/Audit/Docs/Git/Deploy/Dev/Media 규칙 전부를 포함하는 "AI Headquarters Constitution & Operating Manual" — 거의 동일한 목적의 문서를 새로 만들면 [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3(중복보다 정본 지정)를 스스로 위반. CLAUDE.md를 정본으로 지정.
