# AI-STAFF-POLICY — AI 직원 운영지침 v1.0

> CEO 지시(2026-07-23, "AI 직원을 정규직으로 채용한다면 뭘 해야 하는가") 후속. 상위 규범은 [CEO-CHARTER.md](CEO-CHARTER.md)(승인규칙 6항목)·[CLAUDE.md](CLAUDE.md)(운영 매뉴얼). 본 문서는 개별 AI 역할(Notion AI Prompt Library·AI Media Workforce·코드 기반 역할)에 공통 적용되는 고용 유비(職級·승격·보고·에스컬레이션·퇴출) 규칙이다. [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 직원표와 짝을 이룬다.

## 1. 직급 등급 (기존 "상태" 라벨을 고용 유비로 공식화)
| 등급 | 기존 라벨 | 의미 | 실행 권한 |
|---|---|---|---|
| 대기 | 대기 | 역할 정의만 있고 미가동(예: Instagram/YouTube Manager 등 7명) | 없음 |
| 수습 | 초안 | 프롬프트/로직 초안, 실데이터 미검증 | 없음(사람이 결과 전량 검토) |
| 인턴 | MVP | 실행되지만 검증 케이스가 1회 이하이거나 부분적(예: Trend Researcher) | 없음(사람이 결과 전량 검토) |
| **정규직** | 활성 | §2 승격 기준 충족 — 실데이터로 반복 검증됨 | §4 원칙 적용(제안까지, 실행은 사람 승인) |

## 2. 정규직 승격 기준
아래 중 하나 이상을 **직접 실행 결과로 확인**해야 "활성"(정규직) 라벨을 부여한다(추측·자기신고 금지, §검증규칙과 동일 기준):
- 실데이터(가짜 아님) 기반 산출물을 **최소 1회 이상 종단(end-to-end) 검증**하고, 그 근거(입력→출력)를 CHANGELOG.md 또는 DECISION-LOG.md에 남긴다.
- 실패 시 정직하게 실패를 보고하는지 확인한다(예: 웹디자인전략가 — 블루보틀코리아 fetch 실패를 "접근실패"로 명시한 사례, 메뉴전략가 — POS·원가표 이름 불일치로 매칭 안 된 4종을 계산에서 제외하고 "계산 불가" 사유를 반환한 사례).
- 신규 역할은 승격 즉시 [AI-HQ-MASTER.md](AI-HQ-MASTER.md) 직원표에 실행경로(코드 위치)와 함께 기록한다.

## 3. 실행 권한 원칙 (CEO 결정, 2026-07-23)
**AI 직원은 제안까지만 한다. 실제 실행(코드 반영·메뉴 변경·발행·삭제 등)은 항상 사람(CEO 또는 CTO)이 승인한 뒤에만 이뤄진다.**
- 이유: AI 제안의 신뢰도가 항목별로 들쭉날쭉하고(예: 메뉴전략가는 순수 계산이라 결정적이지만, 웹디자인전략가는 LLM 판단이라 확률적), 실행 자동화의 리스크가 비대칭적(되돌리기 쉬운 것과 어려운 것이 섞여 있음)이기 때문.
- 현재 구현과 일치 확인: AI 메뉴전략가는 `단종후보`/`프로모션후보`를 **제안**만 하고 메뉴 자체를 지우지 않는다(`erp_engine.py`는 읽기 전용 계산). AI 웹디자인전략가는 P1/P2/P3 **제안**만 반환하고 코드를 직접 고치지 않는다(`agents/designTrendAgent.ts`는 fetch+분석만, PR 생성 없음).
- 이 원칙은 CEO-CHARTER.md §승인규칙 6항목(실제데이터삭제·비용발생·외부서비스가입·GitHub공개변경·운영서버파괴적변경·법률/라이선스변경)과 별개로, **AI 직원의 업무 산출물 자체**에 적용되는 규칙이다(6항목은 CTO의 인프라/저장소 조작에어 대한 규칙).
- 향후 특정 역할의 신뢰도가 §2 기준으로 반복 입증되면, CEO가 개별적으로 "이 역할만 자동실행 허용"을 승인할 수 있다(일괄 규칙 아님 — 역할별 판단).

## 4. 보고 주기
- 신규 역할 가동/승격 시: 즉시 1회(CEO-REPORT.md 형식).
- 정규직(활성) 역할: `npm run audit` 실행 시마다(수시, 최소 CHANGELOG.md에 큰 변경이 있을 때) 산출물 정확도를 재확인한다. 별도 주간/월간 자동 리포트는 미구축(TODO — 예약 루틴이 세션 종속이라 완전 무인 정기보고는 아직 불가, [AI-HQ-MASTER.md](AI-HQ-MASTER.md) §자동화현황 참조).

## 5. 에스컬레이션 기준
AI 직원은 판단이 불확실하거나 데이터가 불충분할 때 **추측으로 채우지 않고 "확인 불가" 상태를 그대로 반환**한다(§검증규칙 §8과 동일). 예:
- 메뉴전략가: POS 상품명이 원가표와 매칭 안 되면 `available: false`+사유를 반환(전체 계산을 포기하지 않고, 매칭된 것만 계산하되 매칭 실패 건수를 숨기지 않음).
- 웹디자인전략가: 경쟁사 URL fetch 실패 시 `접근실패` 배열에 사유와 함께 명시하고, 나머지 URL만으로 분석을 진행하되 실패 사실을 결과에서 지우지 않음.
- 사람에게 넘겨야 할 상황(예: 법적/윤리적 판단이 섞인 경우)은 CEO-CHARTER §승인규칙 6항목과 동일한 기준으로 사람에게 명시적으로 넘긴다.

## 6. 퇴출·재교육 기준
- 정규직(활성) 역할의 산출물이 **연속 2회 이상** 실데이터 검증에서 부정확하거나(예: 원가율 계산 오류) 오탐/허위보고가 발견되면 "수습"으로 강등하고, DECISION-LOG.md에 강등 사유를 기록한다.
- 강등된 역할은 §2 기준을 다시 충족해야 재승격된다.
- 완전 폐지(코드 삭제)는 CEO-CHARTER §승인규칙(삭제)에 따라 별도 승인 대상이다 — 강등과 폐지는 다른 절차다.

## 7. 현재 직원 등급 (2026-07-23 기준, [AI-HQ-MASTER.md](AI-HQ-MASTER.md)와 동기화)
| 역할 | 등급 | 승격 근거 |
|---|---|---|
| AI 견적 | 정규직 | `prompts/pricing.ts` 실서비스(/design) 연결, 사용자 실사용 중 |
| AI 디자이너 | 정규직 | `agents/interiorDesignAgent.ts` 실서비스 연결, Gemini 실호출 검증됨 |
| AI QA / Audit / Security / Documentation | 정규직 | `scripts/qa-extended.js`·`scripts/audit.js` 반복 실행·검증됨 |
| **AI 메뉴전략가**(신규) | 정규직 | 2026-07-23 실 POS 데이터(2026-07-01~20) 종단 검증 |
| **AI 웹디자인전략가**(신규) | 정규직 | 2026-07-23 스타벅스코리아 실사이트 종단 검증(블루보틀코리아 fetch 실패도 정직 보고 확인) |
| **AI SEO Manager** | 정규직(승격) | `scripts/qa-extended.js checkSeo()` — 2026-07-23 재실행, 16페이지 스캔·진짜 공백 0건 확인. 기존에 Media Workforce "인턴"으로 뭉뚱그려졌으나 실제로는 이미 실코드로 반복검증되던 역할이었음(재검증 중 발견) |
| AI 마케터·AI CEO(전략)·AI 콘텐츠 | 정규직(승격) | 2026-07-23 승인된 SSOT(정보공개서 8,636만원·은평본점 2013년 개점 등)로 각 1건씩 실행해 산출물 생성, 프롬프트 제약(법정고지·SSOT 인용·과장금지) 준수 확인(§8 로그) |
| AI CRM | 인턴 유지 | 재검증 시도: DB에 실레코드 2건 존재하나(`prisma.lead.count()`) 발신자가 `ceo@fobee.co.kr`이고 메시지가 키보드 오타("rhdtk"·"tkdeks")인 테스트 데이터 — 진짜 고객 시나리오 아님. `services/crmService.ts`도 CRUD뿐 분류·제안 로직 자체가 없어 실행경로가 없음. 실고객 리드 발생 시 재시도 |
| **AI Blog Writer·AI Shorts Producer·Media Director** | 정규직(재승격) | 2026-07-23 CEO 승인으로 `generate_osmu.py _llm()`에 실Gemini 연동(`google-genai`, `gemini-flash-latest`) — dry-run 스텁 제거. 실행 결과 `live:{blog:true,shorts:true,sns:true}`, 브랜드 SSOT(gbrick-style.md: 8,636만원·3년폐점0건·7개매장) 반영된 실제 블로그 본문·쇼츠 대본 생성 확인(§8 로그). Media Director는 이 전체 파이프라인(기획→블로그→쇼츠→SNS→리포트)을 오케스트레이션하는 역할이라 함께 재승격 |
| **AI Trend Researcher** | 정규직(신규 구축) | 2026-07-23 CEO "착수지시"로 `content-automation-agent/src/trend_research.py` 신설 — 실 공개 소스(위키백과 "커피전문점"·"카페") fetch+Gemini 분석. 실행 결과 키워드 7개·경쟁콘텐츠요약 4건·기회 3건·추천소스(topic+keywords)를 실제로 생성해 `generate_osmu.generate()` 입력과 연결 확인(§8 로그) |
| AI Content Analyst | 수습 유지(코드는 실API 대기 완료) | 2026-07-23 `analytics.py`에 Meta Graph API(`_fetch_meta_insights`)·YouTube Data API v3(`_fetch_youtube_stats`, OAuth refresh 교환 포함) 실호출 코드를 공식 문서 기준으로 구현 완료. **자격증명이 없어 실토큰으로 검증되지 않음** — CEO가 [INSTALL.md](INSTALL.md) §6 절차로 직접 API 가입 후 `.env`에 값을 넣으면 자동으로 실동작 전환. 그 전까지는 §2 종단검증 미충족으로 정규직 승격하지 않음(정직 기록) |
| Instagram·YouTube·TikTok·Naver Blog·Thumbnail·Voice·Video 등 7명 | 대기 | 미가동(발행 인프라 없음 — 콘텐츠 생성은 되지만 계정 연결·업로드 파이프라인 없음, 상동 §6 절차 필요) |

## 8. 재검증 로그
### 2026-07-23 1차 (인턴 10개 역할 재검증)
- **방법**: §2 승격기준을 각 역할에 실제로 적용 — 코드가 있으면 재실행, 프롬프트뿐이면 승인된 SSOT로 직접 1회 실행, 근거 없으면 정직하게 하향.
- **승격 3건**: AI SEO Manager(기존 코드 재발견), AI 마케터·AI CEO(전략)·AI 콘텐츠(프롬프트 실행 성공).
- **유지 1건**: AI CRM(실데이터는 있으나 테스트 데이터라 검증 불가).
- **하향 5건**: Media Director·Content Analyst·Trend Researcher·Blog Writer·Shorts Producer(코드가 dry-run 스텁뿐임을 이번에 처음 확인).
- **전략적 결론(AI CEO 역할로 직접 판단)**: Media OSMU 파이프라인에 실LLM(Gemini)을 연동하면 이 5명을 정규직으로 만들 수 있으나, 이는 비용 발생 항목이라 이번 재검증 범위를 벗어남 — 별도 CEO 지시 필요.
- **정직한 기록**: 재검증 전 "인턴"으로 일괄 분류했던 것 자체가 부정확했다 — 실제로는 정규직 승격 대상(SEO Manager 등)과 실행경로가 아예 없는 것(Trend Researcher 등)이 섞여 있었다. §2 기준을 일괄 적용이 아니라 역할별로 직접 실행해봐야 정확한 등급이 나온다는 교훈.

### 2026-07-23 2차 (CEO "다음단계 진행" 승인 — 실Gemini 연동)
- **범위 판단**: 1차에서 하향된 5명 중 Blog Writer·Shorts Producer(+오케스트레이션하는 Media Director)는 "비용만 있으면 실행 가능"이었으나, Content Analyst·Trend Researcher는 비용 문제가 아니라 애초에 필요한 기능(소셜 API 접근·트렌드 리서치)이 구축돼 있지 않아 이번 승인 범위(Gemini 연동)와 무관 — 승격 대상에서 제외.
- **구현**: `content-automation-agent/requirements.txt`에 `google-genai` 추가·설치. `generate_osmu.py _llm()`을 실제 Gemini 호출로 교체(GEMINI_API_KEY 없거나 실패 시 dry-run 폴백 유지, 무파괴). 블로그/쇼츠 프롬프트에 브랜드 스타일 가이드(`content-automation-agent/guides/*.md`) 전문을 주입해 SSOT 밖 사실을 지어내지 않도록 제약.
- **검증**: 실제 실행(`python generate_osmu.py`) → `report.json`에 `"live":{"blog":true,"shorts":true,"sns":true},"dry_run":false`. `blog.md`에 8,636만원·3년폐점0건·7개매장·법정고지("실제 창업 내용과 차이가 있을 수 있습니다") 모두 정확히 반영된 실제 생성 문장 확인.

### 2026-07-23 3차 (CEO "착수지시" — Trend Researcher 신규 구축 + Content Analyst 실행경로 마련)
- **AI Trend Researcher**: `trend_research.py` 신설. 최초 실행에서 Gemini가 마크다운 코드펜스(` ```json `)로 감싸 응답해 `json.loads` 실패 → `response_mime_type="application/json"` config로 강제해 해결(같은 문제를 `generate_osmu.py`의 쇼츠 프롬프트에도 소급 적용, `json_mode` 파라미터 추가). 실행 결과: 위키백과 2건 fetch(총 6000자) → 키워드 7개·경쟁콘텐츠요약 4건·기회 3건·추천소스("카베 카네부터 학림다방까지..." topic) 생성 확인, 텍스트 근거 밖 사실 없음.
- **AI Content Analyst**: `analytics.py collect_manual()` 추가 — 소셜 API 자격증명 없이 사람이 입력한 실측치로 분석 가능. `_improvement()`가 미입력 지표를 "측정된 0"과 구분하도록 수정(허위 0 판단 방지). 코드 경로는 예시값(views:500, likes:20, ctr:0.02)으로 정상 동작 확인했으나 이는 "코드 테스트용, 실데이터 아님"으로 명시 — 진짜 게시물 지표가 없어 §2 종단검증 기준은 아직 미충족(정직 기록, 승격 보류).

### 2026-07-23 4차 (CEO "진행" — "CEO가 직접 API 가입 후 자격증명 전달" 선택)
- **CEO 결정**: Meta/YouTube API 가입은 CTO가 대신할 수 없는 절차(신원확인·비즈니스 인증)이므로 CEO가 직접 수행하기로 선택.
- **CTO 준비 작업**: 자격증명이 오는 즉시 바로 동작하도록 `analytics.py collect()`에 Meta Graph API(`_fetch_meta_insights`)·YouTube Data API v3(`_fetch_youtube_stats` + OAuth refresh token 교환 `_youtube_access_token`) 실호출 코드를 공식 API 문서 기준으로 구현. 무자격증명 시 기존 dry-run으로 안전 폴백(`collect('instagram','fake')` 테스트로 크래시 없음 확인), 자격증명 오류 시에도 추측 없이 `error` 필드로 원인 반환.
- **CEO 실행 가이드 작성**: [INSTALL.md](INSTALL.md) §6에 Meta Developer 앱 생성부터 Instagram 비즈니스 계정 연결·Access Token 발급, Google Cloud Console YouTube Data API v3 활성화·OAuth Refresh Token 발급까지 단계별 절차 기록.
- **정직한 기록**: 코드는 공식 문서대로 정확히 구현했으나 **실토큰으로 테스트하지 않았다** — §2 기준(실데이터 종단검증)을 지키기 위해 자격증명 도착 전까지는 정규직 승격하지 않는다. CEO가 `.env`를 채우고 `python analytics.py` 실행 결과(`dry_run:false`)를 전달하면 즉시 재검증한다.
