# DECISION-LOG — 주요 기술 결정 기록

> CEO MASTER INITIALIZATION MISSION §12 산출물. 이후 모든 중요 기술 결정은 여기 append한다. 형식: 날짜·결정·근거·대안 비교(§문제해결규칙: 대안 3개 이상 검토).

## 2026-07-23 — 이미지 SSOT 파이프라인: 자동화 범위를 "처리"로 한정, "다운로드"는 반자동 인정
- **배경**: CEO MASTER 업무지시서 §5 "Drive를 이미지 SSOT로, public/images를 캐시로, 동기화 시 WebP변환·최적화·썸네일·ALT생성까지 자동 수행".
- **검토한 대안 3개**: ①Drive API 서비스계정으로 완전 무인 동기화 ②Claude Code 세션이 Drive MCP로 다운로드 후 로컬 처리 스크립트 실행(반자동) ③이미지 파이프라인 자체를 보류.
- **결정**: ②. Drive API 서비스계정 발급은 외부서비스가입에 해당해 CEO 승인 대상(INSTALL.md §6과 동일 성격) — 지금 당장은 CTO가 임의로 만들 수 없음. 반면 "다운로드된 이미지를 WebP/최적화/썸네일/ALT까지 자동 처리"하는 절반은 Drive 자격증명 없이도 완전 자동화 가능해 즉시 구축.
- **구현**: `scripts/sync-images.js`(sharp 기반 WebP변환+리사이즈+썸네일, Gemini Vision 기반 한국어 ALT 자동생성). 실제 GBRICK 은평본점 사진으로 종단 검증: 1.7MB JPG→158KB WebP, 16KB 썸네일, ALT "원목 가구와 카운터가 보이는 은평본점 카페 내부 모습." 정확 생성 확인(테스트 산출물은 커밋 전 정리).
- **정직한 기록**: "완전 자동 동기화"라는 CEO 지시를 100% 충족하지는 못했다 — Drive→로컬 절반은 여전히 사람(세션) 개입이 필요. 이 갭을 숨기지 않고 INSTALL.md §8에 명시.

## 2026-07-23 — 홈페이지 완성 우선순위: AI 웹디자인전략가 실행 → P1+P3 즉시 착수
- **배경**: CEO가 AI 직원 승격 작업보다 홈페이지 완성이 더 중요하다고 우선순위 재조정. AI 웹디자인전략가가 스스로 리서치·판단해 최종안을 보고하고, CEO가 그 위에 코멘트하는 방식을 요청.
- **실행**: `designTrendAgent.ts`를 오늘의집·한샘 대상으로 실행(한샘은 fetch 실패, 정직 보고) → 현재 홈페이지 직접 스크린샷/스냅샷 점검과 결합해 P1(AI스튜디오 연결 강화)/P2(실시간 채팅)/P3(직접시공 차별화 카피) 3개 제안 도출.
- **CEO 결정**: P1+P3 즉시 착수, P2는 채널(카카오톡/전화/이메일) 결정 후 별도 진행.
- **근거**: P2는 새 인프라(채팅 연동)가 필요해 범위가 크고 결정할 게 남아있는 반면, P1·P3는 기존 컴포넌트에 카피/CTA만 추가하는 낮은 리스크 변경.
- **결과**: `Hero.tsx`·`ProcessSection.tsx`·`TrustSection.tsx` 3개 파일 수정, QA/Audit 통과.

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

## 2026-07-23 — Meta/YouTube 실API 코드 구현 + CEO 발급 가이드 (CEO "진행" — 직접 가입 선택)
- **CEO 결정**: AI Content Analyst·발행 인력(Instagram/YouTube Manager 등) 승격을 위해 "CEO가 직접 API 가입 후 자격증명 전달" 경로 선택(대안: CEO가 실게시물을 올리고 실측치 제공 / 보류하고 다른 우선순위 — 둘 다 미선택).
- **근거**: Meta Developer 앱·YouTube OAuth는 신원확인·비즈니스 인증이 필요한 절차라 CTO(Claude Code)가 대신 실행할 수 없음. CEO-CHARTER §승인규칙 "외부서비스가입"과도 일치.
- **CTO 준비**: `analytics.py collect()`에 Meta Graph API·YouTube Data API v3(OAuth refresh 교환 포함) 실호출 코드를 공식 문서 기준으로 미리 구현 — 자격증명 도착 즉시 동작하도록. 무자격증명·오류 시 dry-run으로 안전 폴백 확인.
- **문서**: [INSTALL.md](INSTALL.md) §6 신설(Meta/YouTube 발급 단계별 가이드). [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §8 4차 로그.
- **정직한 기록**: 코드는 완성됐으나 실토큰 미검증 상태 — §2 기준상 정규직 승격은 보류.

## 2026-07-23 — AI Trend Researcher 신규 구축 + AI Content Analyst 실행경로 마련 (CEO "착수지시")
- **범위 판단**: Content Analyst의 진짜 블로커(Meta/YouTube API 자격증명)는 CEO의 실제 가입·OAuth 행위가 필요해 자율착수 불가(외부서비스가입, 승인 대상) — 대신 API 없이도 쓸 수 있는 수동입력 경로를 먼저 구축해 "착수".
- **AI Trend Researcher**: `trend_research.py` 신설(designTrendAgent.ts와 동일 패턴 — fetch+Gemini). 최초 실행에서 Gemini가 ` ```json ` 코드펜스로 응답을 감싸 파싱 실패 → `response_mime_type="application/json"` config로 해결, 동일 이슈를 `generate_osmu.py` 쇼츠 프롬프트에도 소급 적용.
- **AI Content Analyst**: `analytics.py collect_manual()` 추가 — 실측치를 사람이 입력하면 분석 가능. `_improvement()`가 "미입력"과 "측정된 0"을 구분하도록 수정(허위 0 판단 방지).
- **검증**: Trend Researcher는 위키백과 2건 실fetch로 종단검증 완료(정규직 승격). Content Analyst는 예시값으로 코드 경로만 확인(실데이터 아님 명시) — 진짜 게시물 지표가 없어 정규직 승격은 보류(정직 기록).

## 2026-07-23 — Media OSMU 파이프라인 실Gemini 연동 (CEO "다음단계 진행" 승인)
- **배경**: 직전 재검증에서 CEO 승인 필요 사항으로 보고한 항목("비용 발생 항목이라 범위 밖") — CEO가 "다음단계 진행"으로 명시 승인.
- **범위 판단**: 하향됐던 5명 중 Blog Writer·Shorts Producer(+오케스트레이션 Media Director)는 "비용만 있으면 실행 가능"했으나, Content Analyst·Trend Researcher는 비용이 아니라 애초에 다른 기능(소셜 API·트렌드 리서치)이 없는 별개 갭이라 이번 승인 범위에서 제외.
- **구현**: `google-genai` 설치(`requirements.txt`), `generate_osmu.py _llm()`을 dry-run 스텁에서 실Gemini 호출로 교체(GEMINI_API_KEY 없거나 실패 시 폴백 유지). 블로그·쇼츠 프롬프트에 브랜드 스타일가이드(`guides/*.md`) 전문을 주입해 SSOT 밖 사실 생성을 제약.
- **검증**: 실행 결과 `report.json` `"live":{"blog":true,"shorts":true,"sns":true},"dry_run":false`. `blog.md`가 8,636만원·3년폐점0건·7개매장·법정고지를 정확히 반영한 실제 문장을 생성함을 확인.
- **문서**: [AI-STAFF-POLICY.md](AI-STAFF-POLICY.md) §7·§8, [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 갱신 — Blog Writer·Shorts Producer·Media Director 정규직 재승격.

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

## 2026-07-25 — n8n 아침 브리핑 워크플로: 자동화 범위를 "워크플로 구축"까지로 한정, "구글 계정 인증"은 CEO 액션으로 분리
- **배경**: CEO가 "아침에 이메일 확인·오늘 일정 확인·중요한 거 체크"를 자동화해달라고 요청. 세션 내 Gmail·Calendar MCP를 먼저 시도했으나 두 커넥터 모두 미인증(OAuth) 상태로 즉시 조회 불가.
- **검토한 대안**: ①n8n 워크플로를 credential 없이 미리 만들어두고 CEO 인증만 남긴다 ②CEO 인증 전까지 아무것도 만들지 않고 대기한다 ③이 세션(Claude Code)의 Gmail/Calendar MCP만 연결해 n8n 없이 요청 시점에만 조회한다.
- **결정**: ①. 이유: Gmail/Calendar OAuth는 CEO 본인 구글 계정 인증이 필요해 Claude Code가 대신할 수 없는 영역(외부서비스가입과 유사한 성격)이지만, 워크플로 뼈대(스케줄 트리거·노드 배치·요약 로직)는 credential 없이도 100% 구축 가능 — 인증 즉시 활성화만 하면 되도록 선작업.
- **구현**: n8n workflow `AI HQ - 아침 브리핑`(id `toB3sf8BJpWaJNIl`) — 매일 08:30(Asia/Seoul) Schedule Trigger → Gmail(`is:important newer_than:1d`) + Google Calendar(오늘 범위) 병렬 조회 → Code 노드로 텍스트 요약 조합 → 발송 채널은 NoOp placeholder(Telegram 봇 생성 후 교체 예정). n8n API 키를 재발급해 `.env.local`에 저장(이전 키는 원문이 세션 로그에만 노출되고 안전하게 저장되지 않아 폐기, 새 키는 즉시 파일로만 기록하고 채팅에 출력하지 않음).
- **정직한 기록**: 완전 자동화가 아니다 — CEO가 n8n UI에서 Gmail·Calendar OAuth2 credential을 직접 연결하고 Active 토글을 켜야 실제로 동작한다. 절차는 [INSTALL.md](INSTALL.md) §9.

## 2026-07-25 — 메뉴전략 승인 워크플로: Notion "AI 제안함"을 승인 상태의 SSOT로, Telegram은 알림/입력 채널로 분리
- **배경**: CEO 지시 "매일 아침 → n8n 트리거 → AI 메뉴전략가 API 호출 → Telegram 승인/반려 버튼 → 콜백을 n8n이 받아 Notion에 기록"을 실제로 구현.
- **검토한 대안**: ①승인 상태를 Telegram 메시지 자체(수정된 텍스트)로만 관리 ②승인 상태를 Notion DB에 페이지로 기록하고 Telegram은 알림+버튼 UI 역할만 담당 ③둘 다 구현하지 않고 Notion에만 수동 기록.
- **결정**: ②. Telegram 메시지는 상태를 "조회"할 수 있는 이력이 아니라 "알리는" 매체로 한정하고, 조직 전체가 참조하는 승인 큐(SSOT)는 항상 Notion에 두는 것이 CLAUDE.md §3(SSOT 원칙)과 일치. Notion 페이지 ID를 Telegram 인라인 버튼의 `callback_data`에 실어(`approve:<pageId>`) 콜백 처리 시 정확한 레코드를 갱신하도록 연결.
- **구현**: Notion DB "AI 제안함"(제안/제안자/상태/요약/제안일시/처리일시/처리채널/원본데이터 스키마) 신설 → n8n 워크플로 `AI HQ - 메뉴전략 승인(Telegram+Notion)`(id `lgLgyt0lw5Q78Kgc`) 2-트리거 구조: (A) 매일 08:00 스케줄 → ERP API(`/api/hq/erp`, 이미 만든 서비스 토큰 Header Auth 재사용) → 요약 생성 → Notion 대기 등록 → Telegram 발송. (B) Telegram 콜백 수신 트리거 → 콜백 파싱 → Notion 상태 갱신.
- **재사용**: n8n Header Auth credential을 이미 있는 `N8N_SERVICE_TOKEN`으로 API를 통해 미리 생성해둬서(`1mbnZGqyNCGxIFtC`) CEO가 이 부분은 추가로 할 일이 없다 — Gmail/Calendar/Telegram/Notion처럼 "CEO 본인 계정이 필요한 외부서비스"가 아니라 우리 자체 API 인증이기 때문에 Claude Code가 대신 처리 가능했던 경우.
- **정직한 기록**: Telegram Bot·Notion Integration Token 두 credential은 CEO 본인 계정이 있어야 발급 가능해 여전히 미연결(inactive) — 절차는 [INSTALL.md](INSTALL.md) §10(Telegram) 및 아래 Notion 안내 참조.
- **Notion 연동 안내(추가 필요)**: n8n의 Notion 노드가 동작하려면 notion.so/my-integrations에서 내부 통합(Internal Integration) 생성 → 토큰 발급 → "AI 제안함" 데이터베이스에 그 통합 공유(Share) → n8n Credentials에 Notion API로 등록. 이 과정도 CEO 본인 Notion 계정 작업이라 Claude Code가 대신할 수 없음.

## 2026-07-22 — AI-HQ-SYSTEM-RULES.md 별도 생성 안 함
- **결정**: MASTER INITIALIZATION이 요청한 `AI-HQ-SYSTEM-RULES.md`를 별도 파일로 만들지 않음.
- **근거**: [CLAUDE.md](CLAUDE.md)가 이미 QA/Audit/Docs/Git/Deploy/Dev/Media 규칙 전부를 포함하는 "AI Headquarters Constitution & Operating Manual" — 거의 동일한 목적의 문서를 새로 만들면 [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3(중복보다 정본 지정)를 스스로 위반. CLAUDE.md를 정본으로 지정.
