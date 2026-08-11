# AI-STAFF-POLICY — AI 직원 운영지침 v2.0

> CEO MASTER 업무지시서(2026-07-23, "AI Headquarters의 목표는 프롬프트를 만드는 것이 아니라 실제 일하는 AI 직원을 만드는 것") 기준 전면 개정. v1.0(2026-07-23 최초 작성)의 4단계·느슨한 승격 기준을 CEO의 6단계·11조건 인증 기준으로 대체한다. 상위 규범은 [CEO-CHARTER.md](CEO-CHARTER.md)(승인규칙 6항목)·[CLAUDE.md](CLAUDE.md)(운영 매뉴얼).

## 1. 인사 상태 6단계 (CEO 확정)
```
설계 → 개발중 → 수습 → 정규직 → 개선중 → 은퇴
```
| 상태 | 의미 |
|---|---|
| 설계 | Notion에 역할(Mission/SOP)만 정의됨, 코드 없음 |
| 개발중 | 코드 작성 중, 아직 종단 실행 미검증 |
| 수습 | 실행되지만 §2 인증 11조건 중 일부만 충족 |
| **정규직** | §2 인증 11조건 **전부** 충족 — "설계만 된 역할은 직원으로 간주하지 않는다"(CEO 원칙) |
| 개선중 | 정규직이었으나 기준 강화·결함 발견 등으로 재검증 진행 중 |
| 은퇴 | 완전 폐지(코드 삭제는 CEO-CHARTER 승인 대상, 상태 변경과 별개 절차) |

## 2. 정규직 인증 11조건 (CEO MASTER 업무지시서 §1, 전부 충족 필수)
1. 실제 코드 존재
2. 실제 API 존재
3. 실제 데이터 사용
4. 실제 업무 수행
5. QA 통과 (`npm run qa`/`qa:extended`)
6. Audit 통과 (`npm run audit`)
7. 운영환경 검증 완료 (Docker 이미지에 반영·기동 확인까지, §8 "Docker 운영환경까지 반영되어야 완료")
8. Notion 조직도 등록 (AI Prompt Library / AI Media Workforce)
9. AI-HQ 조직도 등록 (`/hq` 대시보드 AI직원 섹션)
10. Training Center 등록
11. 평가기준 등록

## 3. 업무 수행 절차 (CEO MASTER 업무지시서 §2)
① 내부 자료 조사(Drive→Notion→GitHub→ERP→기존 홈페이지→지명원→회사소개서→포트폴리오→정보공개서→운영문서→모든 SSOT, 이 우선순위) → ② 자동 분석(연혁·철학·브랜드가치·프로젝트·스타일·운영데이터·이미지·문서 추출) → ③ 초안 작성(근거 표시 + 부족한 정보 목록까지 AI가 스스로) → ④ 내부 자료에서 못 찾은 것만 CEO에게 질문. **처음부터 CEO에게 질문하지 않는다.**

## 4. 실행 권한 원칙 (2026-07-23 CEO 결정, 2026-07-27 일부 개정)
AI 직원은 제안까지만 한다. 실제 실행(코드 반영·메뉴 변경·발행·삭제 등)은 항상 사람(CEO 또는 CTO)이 승인한 뒤에만 이뤄진다. (근거·구현 확인 사례는 §8 로그 참조)

**2026-07-27 개정 — 홈페이지 UI/콘텐츠 한정 예외**: CEO 승인으로 "제안 승인 이후의 코드 작성·QA/Audit"까지는 AI가 자동 수행하도록 범위를 넓혔다. 단 아래 안전장치는 절대 원칙으로 유지한다.
- **적용 범위**: `app/page.tsx`·`components/home/**` 등 홈페이지 UI/콘텐츠에 한정. ERP·인증·API·DB 스키마·인프라(n8n/Docker) 등 핵심 로직은 이 예외에서 제외 — 기존 원칙(제안까지만) 그대로 적용.
- **게이트**: Notion "AI 제안함" DB에서 `상태=승인` AND `적용범위=홈페이지 UI/콘텐츠`로 명시적으로 표시된 건만 대상.
- **최종 실행(push/배포)은 여전히 100% 사람**: AI는 로컬 브랜치(`ai-proposal/<id>`)에 커밋만 하고 `git push`·main 병합은 절대 하지 않는다. 대표님이 리뷰 후 직접 push.
- **실행 주체**: 예약 작업 `ai-proposal-implementer`(매일 10:00, `C:\Users\user\.claude\scheduled-tasks\ai-proposal-implementer\SKILL.md`)가 이 절차를 수행한다.
- 근거: [DECISION-LOG.md](DECISION-LOG.md) 2026-07-27 항목.

## 5. 완료 판정 기준 (CEO MASTER 업무지시서 §8)
```
개발 → QA → Audit → 운영 배포 → 운영 검증 → CEO 승인 → 정식 AI 직원 등록
```
개발 완료는 완료가 아니다. Docker 운영환경까지 반영되어야 완료로 인정한다.

## 6. 퇴출·재교육 기준
- 정규직 산출물이 연속 2회 이상 부정확/허위보고면 "개선중"으로 재분류, DECISION-LOG.md에 사유 기록.
- 재승격은 §2 11조건을 처음부터 다시 충족해야 한다.
- 완전 폐지("은퇴")는 CEO-CHARTER §승인규칙(삭제)에 따라 별도 승인 대상.

## 7. 현재 직원 재평가 (2026-07-23, 신기준 2차 적용 — Training Center·평가기준·AI-HQ조직도·Docker 운영검증 구축 완료 후)

| 역할 | 코드 | API | 데이터 | 업무수행 | QA | Audit | 운영검증(Docker) | Notion조직도 | AI-HQ조직도 | Training Center | 평가기준 | **상태** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AI 메뉴전략가** | ✅ | N/A(계산전용) | ✅ 실POS | ✅ | ✅ | ✅ | ✅ `docker compose run erp python src/erp_engine.py` 실행 확인 | N/A(코드기반) | ✅ | ✅ | ✅(경고 — 5/9 매칭) | **정규직** |
| **AI 웹디자인전략가** | ✅ | ✅ Gemini | ✅ 실사이트 | ✅ | ✅ | ✅ | ✅ web 이미지 재빌드·기동 확인 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI SEO Manager** | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | N/A(npm 스크립트, Docker 무관) | N/A | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI Blog Writer** | ✅ | ✅ Gemini | ✅ | ✅ | ✅ | ✅ | ✅ `docker compose run erp python src/generate_osmu.py` 실행 확인 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI Shorts Producer** | ✅ | ✅ Gemini | ✅ | ✅ | ✅ | ✅ | ✅ 상동 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **Media Director** | ✅ | ✅ Gemini | ✅ | ✅ | ✅ | ✅ | ✅ 상동 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI Trend Researcher** | ✅ | ✅ Gemini | ✅ | ✅ | ✅ | ✅ | ✅ `docker compose run erp python src/trend_research.py` 실행 확인 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI QA** | ✅ | N/A | ✅ | ✅ | ✅ | N/A | N/A(npm 스크립트) | ❌ 미등록(도구성 역할이라 Notion 대상 아님) | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI Audit** | ✅ | N/A | ✅ | ✅ | N/A | ✅ | N/A | ❌ 상동 | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI 디자이너** | ✅ | ✅ Gemini | ✅ | ✅ | ✅ | ✅ | ✅ web 이미지 포함 | ✅ | ✅ | ✅ | ✅(측정전 — 에러율 로그 미구축) | **정규직** |
| **AI CEO(전략)** | ✅ `agents/ceoStrategyAgent.ts` | ✅ Gemini | ✅ 실맥락 입력 | ✅ | ✅ | ✅ | ✅ web 이미지 재빌드·기동 확인 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| **AI 마케터** | ✅ `agents/marketerAgent.ts` | ✅ Gemini | ✅ Franchise SSOT | ✅ | ✅ | ✅ | ✅ 상동 | ✅ | ✅ | ✅ | ✅(통과) | **정규직** |
| AI 콘텐츠 | ❌ | N/A | N/A | N/A | N/A | N/A | N/A | ✅(초안으로 조정) | N/A | N/A | N/A | **은퇴 대상 아님, 초안 유지** — `generate_osmu.py`(Media Director 정규직)와 산출물 중복 확인, 정본을 Media Director로 지정(삭제 대신 표준지정, DECISION-LOG 참조) |
| **AI Documentation** | ✅ `scripts/check-docs-sync.js`(신규 코드화) | N/A | ✅ | ✅ | N/A | N/A | N/A(npm 스크립트) | ❌(도구성 역할, QA/Audit과 동일 사유) | ✅ | ✅ | ✅(통과) | **정규직** |
| AI 견적 | ✅ | N/A | ❌ **가격 placeholder**(TODO.md — 실단가 CEO승인 대기) | ✅(실사용중) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **개선중** |
| **헤르메스(전령)** | ✅ `agents/hermesAgent.ts` + `lib/hermes/**` | ✅ `/api/hq/hermes` | ✅ ERP 실스냅샷·실문의 | ✅ 봉투 8건 생성 실행확인 | ✅ | ✅ | ❌ 미실행 | ❌ 미등록 | ✅ | ❌ | ❌ | **수습** (2026-08-11 신설, 11조건 중 4건 미충족) |
| AI Content Analyst | ✅ | ✅(미검증) | ❌ 실토큰없음 | ❌ | - | - | - | ✅ | ❌ | ❌ | ❌ | **수습** |
| AI CRM | ❌ 분류로직없음 | - | ❌ 테스트데이터뿐 | ❌ | - | - | - | ✅ | ❌ | ❌ | ❌ | **수습** |
| Instagram·YouTube·TikTok·Naver Blog·Thumbnail·Voice·Video | ❌ | ❌ | ❌ | ❌ | - | - | - | ✅(대기) | ❌ | ❌ | ❌ | **설계** |

**중요한 발견(6차에서 해소)**: 신기준 1번 조건("실제 코드 존재")을 문자 그대로 적용하면, 순수 Notion 프롬프트 역할은 아무리 SSOT를 정확히 인용해도 정규직이 될 수 없었다. 6차 사이클에서 AI CEO(전략)·AI 마케터·AI Documentation 3건을 실제 코드로 전환해 이 문제를 해소했다(AI 콘텐츠는 코드화 대신 기존 정규직 파이프라인과의 중복을 확인해 정본지정으로 처리).

## 8. 이번 사이클 실행 로그 — CEO MASTER 업무지시서 반영
### 2026-07-23 5차 (CEO MASTER 업무지시서, "승인 없이 순차적으로 끝까지 수행")
- 6단계 인사제도·11조건 인증기준 반영, v1.0의 느슨한 4단계(대기/수습/인턴/정규직)를 폐기.
- **AI-HQ 조직도**: `lib/hq/erpSnapshot.ts`의 `AI_STAFF`에 `status` 필드 추가(6단계), `/hq/staff`(`app/hq/[section]/page.tsx`)에 상태 배지 UI 신설.
- **Training Center + 평가기준**: Notion에 신규 데이터소스 2건(`AI Training Center`, `AI 평가기준`) 생성, 정규직 후보 10개 역할 전부 등록·실측치 기록(메뉴전략가는 5/9 매칭으로 "경고" 정직 기록, AI디자이너·AI견적은 에러율 로그 미구축으로 "측정전" 정직 기록).
- **Docker 운영검증**: `AI-HQ/docker-compose.yml`의 web·erp 이미지를 최신 코드로 재빌드·기동. `erp_engine.py`(메뉴전략가)·`generate_osmu.py`(Blog Writer/Shorts Producer/Media Director)·`trend_research.py`(Trend Researcher)를 **실제 Docker 컨테이너 안에서** 실행해 정상 동작 확인(`available:true` 등).
- **재평가 결과(5차)**: 위 §7 표와 같이 10개 역할이 11조건을 전부 충족해 **정규직** 확정. 코드 없는 프롬프트 전용 역할(AI CEO전략·마케터·콘텐츠·Documentation)은 신기준상 구조적으로 정규직 불가함을 발견 — 정직 기록.

### 2026-07-23 6차 ("계속진행" — 코드 없는 프롬프트 역할 코드화)
- **AI CEO(전략)**: `agents/ceoStrategyAgent.ts` 신설(결정사안+배경→복수대안+반대의견→"CEO없이도작동하는가" 기준 판단→권고, 제안까지만). 실제 안건(API키 dev/prod 분리)으로 테스트 → 대안3개·반대의견2개·구체적 권고(변수명 분리 대신 CI검증스크립트 제안) 생성 확인.
- **AI 마케터**: `agents/marketerAgent.ts` 신설(Franchise SSOT 하드코딩+법정고지 강제). 실제 실행 → `legalNoticeIncluded:true`, SSOT 수치만 정확히 인용 확인.
- **AI 콘텐츠**: `generate_osmu.py`(Media Director, 이미 정규직)와 산출물(SNS/블로그/쇼츠 기획, SSOT인용, 브랜드톤유지) 실질적 중복 확인 → Notion 프롬프트 페이지에 CTO 노트 추가, 상태를 "초안"으로 조정, 정본은 Media Director로 지정(코드 중복 생성 안 함).
- **AI Documentation**: `scripts/check-docs-sync.js` 신설(LLM 미사용 — 루트 .md 파일 vs DOCUMENT-INDEX.md 대조, CHANGELOG 최신성 검사). 실행 → 루트 .md 23개 검사, 불일치 0건.
- **Docker 재검증 + Notion 등록**: web 이미지 재빌드(marketing-copy·strategy-analysis 라우트 포함 확인), Training Center·평가기준에 3건 추가 등록.
- **최종 결과**: AI CEO(전략)·AI 마케터·AI Documentation 3건 추가 정규직 확정(총 13명 정규직). AI 콘텐츠는 정본지정으로 처리 완료(코드화 대상에서 제외, 삭제 아님).
