# AI 마케팅 비서실 — Phase M0 설계서

> **문서 상태**: 조사·설계 완료 (구현 승인 대기)
> **작성일**: 2026-10-13
> **적용 규칙**: CLAUDE.md §0(경영철학·의사결정 7원칙) · CEO-CHARTER.md · AI-DEV-RULES.md
> **경로**: `docs/ai-os/MARKETING_AUTOMATION_DESIGN.md`

---

## 0. 사전 확인 사항 (§0-3 적용)

### 0-A. 조사 범위

| 확인 항목 | 결과 |
|---|---|
| 기존 콘텐츠 자동화 코드 | `content-automation-agent/` — Python OSMU 파이프라인 |
| 기존 마케터 AI | `agents/marketerAgent.ts` — 프랜차이즈 카피 생성 (정규직) |
| 기존 스케줄러 | `gbrick-ai-os-build` 루틴 (매일 09:30, 세션 종속) · `discord_brief.py` |
| 기존 브리핑 시스템 | `lib/courier/morning.ts` (전달 브리핑) + `discord_brief.py` (생활 브리핑) |
| 기존 KPI 시스템 | `lib/hq/kpi.ts` (CEO Dashboard, ERP 연동) |
| 기존 성과 분석 | `content-automation-agent/src/analytics.py` (수습 — 자격증명 미발급) |
| 브랜드 스타일 가이드 | `guides/gbrick-style.md` · `guides/designpobee-style.md` |

### 0-B. SSOT 불일치 발견 (§0-2 원칙 1 — 사실이 먼저다)

`content-automation-agent/guides/gbrick-style.md` 11~14행에 다음 수치가 남아 있음:

```
7개 매장 · 3년 폐점 0건 · 평균 운영 10년+
```

이 수치들은 `agents/marketerAgent.ts`가 명시적으로 **사용 금지**로 지정한 항목과 동일하다.
스타일 가이드가 마케터 에이전트 금지 규칙과 충돌 중이다.

**처리 방향**: 설계 단계에서는 파일을 수정하지 않는다(§8 — 이번 단계 기존 운영 코드 수정 금지).
구현 단계에서 스타일 가이드 SSOT 수정을 첫 번째 작업으로 진행한다.
확인하지 못한 사항: 실제 운영 매장 수 (GBRICK HQ 정보공개서 기준 CEO 확인 필요).

---

## 1. 기존 기능 및 재사용 가능한 모듈

### 1-A. 재사용 확정 (기존 코드 그대로 활용)

| 모듈 | 경로 | 마케팅 비서실 역할 | 재사용 방법 |
|---|---|---|---|
| AI Trend Researcher | `content-automation-agent/src/trend_research.py` | Trend Researcher | 소스 URL 목록만 교체, `brand` 파라미터 분리 |
| OSMU Generator | `content-automation-agent/src/generate_osmu.py` | Video Producer 일부 + Blog Writer | 출력 스키마 확장 (대본·장면 추가) |
| AI 마케터 | `agents/marketerAgent.ts` | Brand QA SSOT 검증 기준 참조 | 직접 호출하지 않고 SSOT 규칙만 인용 |
| 브랜드 스타일 가이드 | `guides/gbrick-style.md` `guides/designpobee-style.md` | Content Planner·Brand QA | SSOT 수정 후 마케팅 비서실 공유 사용 |
| Morning Brief 구조 | `lib/courier/morning.ts` | 매일 브리핑 구조 참조 | 마케팅 섹션을 봉투로 추가 (구조 그대로) |
| Discord Brief 조립 | `content-automation-agent/src/discord_brief.py` | 매일 브리핑 전달 경로 | 마케팅 섹션 Agent 추가 방식 |
| 성과 분석 골격 | `content-automation-agent/src/analytics.py` | Performance Analyst | 자격증명 발급 후 Performance Analyst에 연결 |

### 1-B. 신규 필요 (기존에 없는 것)

| 역할 | 이유 |
|---|---|
| Audience Analyst | 기존 코드에 타깃 고객 분석 모듈 없음 |
| Channel Strategist | 플랫폼별 전략 로직 없음 (OSMU는 형식 변환만) |
| Content Planner | 제목/후킹/구성/CTA 기획 카드 생성 없음 |
| Video Producer (확장) | 장면별 촬영 지시 + CapCut 편집 지시 없음 |
| Brand QA | 브랜드 규칙 검증 자동화 없음 (수동 확인 중) |
| Publishing Coordinator | 플랫폼별 게시 문구 + 일정표 생성 없음 |
| Marketing Lead | 직원 결과 통합 + 대표 추천안 보고 없음 |

---

## 2. 역할별 사양 (입력·실행·출력·QA·완료 기준)

> 각 역할은 독립 Python 모듈로 구현한다.
> 경로 규칙: `content-automation-agent/src/agents/marketing_<이름>.py`
> 기존 `agents/` 폴더 구조와 동일한 패턴을 따른다.

---

### Role 1 — Trend Researcher

**재사용**: `trend_research.py` 그대로 + 브랜드별 소스 URL 설정 파일 추가

| 항목 | 내용 |
|---|---|
| **입력** | `brand: "gbrick" \| "designfobee"` + `sources: List[{name, url}]` (브랜드별 설정 파일에서 로드) |
| **실행** | 공개 URL fetch → Gemini 분석 → 키워드·주제 요약·기회 도출 |
| **출력** | `{키워드[], 경쟁콘텐츠요약[], 기회[], 추천소스{topic, keywords}, 소스URL[], 게시날짜, available}` |
| **QA** | `available: false`면 `DATA_MISSING` 표시, 소스 URL·게시날짜 기록 확인 |
| **오류 처리** | 소스 접근 실패 → `접근실패[]`에 기록, 최소 1개 소스 성공 시 계속 진행 |
| **완료 기준** | 소스 URL + 게시날짜 기록된 트렌드 최소 3개, 브랜드별 분리 확인 |

---

### Role 2 — Audience Analyst

**신규**: `content-automation-agent/src/agents/marketing_audience.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `trend_output` (Trend Researcher 출력), `platform: "tiktok" \| "instagram" \| "youtube_shorts" \| "blog"` |
| **실행** | 트렌드 키워드 기반 → 타깃 고객 세그먼트 도출 → 관심사·문제·검색 의도 분석 |
| **출력** | `{타깃세그먼트[], 핵심관심사[], 고객문제[], 검색의도[], 플랫폼별타깃특성, available}` |
| **QA** | 실제 데이터 없는 추론은 `[추론]` 표시, 실제 계정 분석 데이터와 구분 |
| **오류 처리** | Gemini 실패 → dry-run 스텁 반환 (파이프라인 계속) |
| **완료 기준** | 브랜드별 타깃 세그먼트 2개 이상, `[추론]` 표시 여부 확인 |

---

### Role 3 — Channel Strategist

**신규**: `content-automation-agent/src/agents/marketing_channel.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `audience_output`, `trend_output` |
| **실행** | 플랫폼별 콘텐츠 형식·최적 길이·게시 시간대·CTA 유형 분석 → 브랜드별 채널 전략 |
| **출력** | `{TikTok: {...}, InstagramReels: {...}, YouTubeShorts: {...}, NaverBlog: {...}, GoogleBlog: {...}}` 각각 `{형식, 길이초, 게시시간대, CTA유형, 특이사항}` |
| **QA** | 게시 자동화 없음 — 전략 산출만 (API 연결 전까지 게시 지시 없음) |
| **오류 처리** | Gemini 실패 → 기본 전략 템플릿 반환 |
| **완료 기준** | 5개 채널 전략 모두 생성, 브랜드별 분리 확인 |

---

### Role 4 — Content Planner

**신규**: `content-automation-agent/src/agents/marketing_planner.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `topic`, `trend_output`, `audience_output`, `channel_strategy` |
| **실행** | 콘텐츠 기획 카드 3개 생성 → 최우선 1개 선정 + 이유 |
| **출력** | `{콘텐츠카드: [{제목, 후킹1줄, 구성[], CTA, 타깃, 플랫폼, 근거, 검증가설}×3], 최우선카드인덱스, 최우선이유}` |
| **QA** | 근거 없는 추천 금지 — `근거`·`검증가설` 필드 반드시 기록 |
| **오류 처리** | 생성 실패 → `available: false`, `DATA_MISSING` 표시 |
| **완료 기준** | 카드 3개 생성, 최우선 1개에 근거+검증가설 기록 |

---

### Role 5 — Video Producer

**확장**: `generate_osmu.py`의 shorts/youtube 생성 기능 + 신규 장면·CapCut 모듈

신규 파일: `content-automation-agent/src/agents/marketing_video.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `content_card` (Content Planner 최우선 카드), `channel_strategy` |
| **실행** | 대본 생성 → 장면별 분리 → 자막 텍스트 → CapCut 편집 지시 → 필요 자료 목록 |
| **출력** | `{대본전체, 장면[{번호, 길이초, 화면내용, 나레이션, 자막텍스트, 촬영지시}], capcut_instructions[], 필요자료[], 후킹}` |
| **QA** | 브랜드 SSOT 외 수치 포함 여부 검사 (Brand QA 호출) |
| **오류 처리** | Gemini 실패 → dry-run 스텁, 파이프라인 계속 |
| **완료 기준** | 장면 3개 이상, CapCut 지시 포함, 브랜드 QA 통과 |

---

### Role 6 — Brand QA

**신규**: `content-automation-agent/src/agents/marketing_brand_qa.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `content: str` (검사할 텍스트), `check_type: "copy" \| "script" \| "caption"` |
| **실행** | 브랜드 규칙 체크리스트 자동 검사 (아래 목록) |
| **출력** | `{통과: bool, 위반항목[], 수정제안[], 검사기준: [...]}` |
| **QA 체크리스트** | ①SSOT 외 수치 없음 ②가짜 후기·가짜 수치 없음 ③법정고지 포함 여부 ④브랜드명 정확 ⑤과장 표현 없음 ⑥중복 콘텐츠 여부 |
| **오류 처리** | 검사 실패 → 해당 항목 `DATA_MISSING` 표시, 배포 중단 신호 |
| **완료 기준** | 위반항목 0건 또는 수정제안 포함 보고서 생성 |

---

### Role 7 — Publishing Coordinator

**신규**: `content-automation-agent/src/agents/marketing_publisher_prep.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `video_output`, `channel_strategy`, `content_card` |
| **실행** | 플랫폼별 게시 문구·해시태그·CTA 생성 → 게시 일정표 작성 |
| **출력** | `{플랫폼별: {게시문구, 해시태그[], CTA, 권장게시시간}, 일정표: [{날짜, 플랫폼, 콘텐츠제목}], brand_qa_status}` |
| **중요** | 실제 게시 API 호출 없음 — 준비 문서만 생성 (§8 게시 자동화 금지) |
| **QA** | Brand QA 결과가 `통과: false`이면 게시 준비 문서 생성하지 않고 중단 |
| **완료 기준** | 5개 채널 게시 문구 생성, 일정표 포함, 브랜드 QA 통과 후에만 출력 |

---

### Role 8 — Performance Analyst

**재사용**: `analytics.py` (자격증명 발급 후 연결)

현재 상태: 수습 (코드 완성, 자격증명 미발급)

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `content_id: str`, `platform: str`, 자격증명 (`.env`) |
| **실행** | Meta Graph API + YouTube Data API v3 → 게시 후 지표 수집 |
| **출력** | `{조회수, 좋아요, 댓글, CTR, 시청완료율, DATA_MISSING 항목[]}` |
| **현재 제한** | 자격증명 없음 → dry-run. CEO가 INSTALL.md §6으로 발급 후 재검증 필요 |
| **완료 기준** | 실토큰으로 지표 1개 이상 수집 확인 후 정규직 승격 |

---

### Role 9 — Marketing Lead (오케스트레이터)

**신규**: `content-automation-agent/src/marketing_lead.py`

| 항목 | 내용 |
|---|---|
| **입력** | `brand`, `topic` (선택 시작점) 또는 `auto_trend: True` |
| **실행** | Role 1→2→3→4→5→6→7 순서로 호출 → 결과 통합 → 대표 보고서 생성 |
| **출력** | 완전한 콘텐츠 패키지 (아래 §4 매일 브리핑 형식) |
| **오류 처리** | 각 단계 실패 시 `available: false` 표시, 가능한 단계까지 계속 진행 |
| **완료 기준** | 9개 산출물 모두 또는 누락 이유 명시, Brand QA 통과 |

---

## 3. 브랜드별 콘텐츠 운영 구조

### 3-A. GBRICK Coffee

| 항목 | 내용 |
|---|---|
| **마케팅 목표** | 매장 방문 · 메뉴 판매 · 재방문 · 가맹 문의 |
| **주요 타깃** | 20~40대 카페 방문 고객 / 40~60대 예비 창업자 |
| **콘텐츠 주제** | 공간 경험 · 계절 메뉴 · 창업 스토리 · 바리스타 스킬 |
| **SSOT 파일** | `guides/gbrick-style.md` (SSOT 수정 선행 필요) |
| **금지 수치** | 매장 수 · 폐점 수 · 평균 매출 · 평균 운영 기간 (marketerAgent.ts 기준) |
| **법정고지** | 창업 관련 모든 카피에 자동 첨부 |
| **KPI** | 매장 방문 증가율 · 가맹 문의 건수 · 콘텐츠 저장·공유 수 |
| **채널 우선순위** | TikTok > Instagram Reels > YouTube Shorts > 네이버 블로그 |

### 3-B. DesignFOBEE 인테리어

| 항목 | 내용 |
|---|---|
| **마케팅 목표** | 인테리어 프로젝트 문의 · 상담 · 수주 |
| **주요 타깃** | 상업공간 오픈 예정 사업자 · 교회 · 교육시설 · 오피스 담당자 |
| **콘텐츠 주제** | 시공 전후 비교 · 공간 철학 · 프로젝트 스토리 · 설계 노하우 |
| **SSOT 파일** | `guides/designpobee-style.md` |
| **금지 사항** | 실제 사진 없는 프로젝트 소개 · 가짜 고객 후기 · 예상 비용 확정 표현 |
| **KPI** | 상담 문의 건수 · 포트폴리오 페이지 체류 시간 · 견적 요청 수 |
| **채널 우선순위** | Instagram (이미지 중심) > YouTube (시공 과정) > 블로그 (SEO) |

### 3-C. 공통 원칙

- 데이터와 성과는 브랜드별 분리 저장 — 혼재 금지
- 공통 기능 (Trend Researcher, Brand QA, OSMU Generator) 은 `brand` 파라미터로 분기
- 출력 경로: `content-automation-agent/output/<brand>/` 로 분리

---

## 4. 매일 브리핑 설계

### 4-A. 브리핑 트리거

기존 `discord_brief.py`에 마케팅 섹션 Agent 추가 방식으로 연동.
`lib/courier/morning.ts` 봉투 구조에 마케팅 브리핑 봉투를 추가.

**실행 시각**: 기존 브리핑 실행 시각과 동일 (중복 실행 방지)

### 4-B. 매일 브리핑 구조 (Marketing Lead 출력)

```
# 마케팅 AI 브리핑 — {날짜} / {brand}

## 📊 트렌드 요약
- 트렌드 1: {키워드} — {소스명} ({소스URL}) [{게시날짜}]
- 트렌드 2: ...
- 트렌드 3: ...
- 타깃 관련성: {이유}

## 🎯 추천 콘텐츠 3개
1. {제목} — {후킹 1줄} | 근거: {근거} | 가설: {검증가설}
2. ...
3. ...

## ⭐ 최우선 콘텐츠
**{제목}**
추천 이유: {이유}

### 영상 대본
- 후킹 (첫 3초): {후킹}
- 장면 1 ({길이}초): {내용} / 자막: {자막}
- 장면 2 ({길이}초): {내용} / 자막: {자막}
- 장면 3 ({길이}초): {내용} / 자막: {자막}
- CapCut 지시: {지시사항}

### 플랫폼별 게시 준비
| 채널 | 게시 문구 | 해시태그 | CTA |
|---|---|---|---|
| TikTok | ... | ... | ... |
| Instagram | ... | ... | ... |
| YouTube Shorts | ... | ... | ... |
| 네이버 블로그 | ... | ... | ... |

### 필요 자료
- {사진/영상 자료 목록}

### Brand QA 결과
- 통과: {통과 여부}
- 위반항목: {없음 또는 목록}

### 게시 후 측정 KPI
- {KPI 목록}

---
⚠️ 게시는 대표 확인 후 진행합니다. AI는 준비만 합니다.
```

### 4-C. 주간 보고 구조

```
# 주간 마케팅 보고 — {주간 범위} / {brand}

## 📈 플랫폼별 성과
| 플랫폼 | 조회수 | 좋아요 | 댓글 | 저장 | 상태 |
|---|---|---|---|---|---|
| TikTok | DATA_MISSING | - | - | - | 자격증명 대기 |
| Instagram | DATA_MISSING | - | - | - | 자격증명 대기 |

## ✅ 성과 좋은 콘텐츠 공통점
{분석 내용 또는 DATA_MISSING}

## ❌ 부진 콘텐츠 원인 가설
{가설 또는 DATA_MISSING}

## 🔄 다음 주 실험 계획
- 반복: {형식}
- 중단: {형식}
- 실험: {형식}

## 📅 다음 주 콘텐츠 계획
{콘텐츠 계획 3개}
```

---

## 5. 기존 스케줄러와 중복 위험 분석

| 기존 스케줄러 | 실행 시각 | 중복 위험 | 처리 방안 |
|---|---|---|---|
| `gbrick-ai-os-build` | 매일 09:30 (세션 종속) | ERP 지표 집계와 마케팅 브리핑이 같은 시각에 실행될 경우 Gemini API 동시 호출 | 마케팅 브리핑은 09:35 이후 실행 (5분 간격) |
| `discord_brief.py` (아침 브리핑) | 실행 시각 DATA_MISSING | 마케팅 섹션을 별도 Agent로 추가 시 동일 Discord 채널로 중복 메시지 발송 가능 | 마케팅 섹션을 기존 `discord_brief.py` 내 Agent로 추가, 독립 실행 금지 |
| `analytics.py` | 수동 실행 (자격증명 없어 비활성) | 충돌 없음 | 자격증명 발급 후 Performance Analyst에 연결 |

**결론**: 새 스케줄러 생성 금지. 기존 `discord_brief.py` + `gbrick-ai-os-build` 흐름에 마케팅 섹션을 추가하는 방식으로 통합.

---

## 6. 외부 서비스 및 API 의존성

| 서비스 | 용도 | 현재 상태 | 비용 |
|---|---|---|---|
| Google Gemini API (`GEMINI_API_KEY`) | Trend Research · OSMU · 모든 AI 생성 | `.env.example`에 정의됨, 실키 CEO 보유 | 유료 (토큰당 과금, 이미 사용 중) |
| Meta Graph API (`META_GRAPH_ACCESS_TOKEN`) | Instagram/Facebook 성과 분석 | 코드 완성, 자격증명 미발급 | 무료 (계정 소유자 발급 필요) |
| YouTube Data API v3 (`YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN`) | YouTube 성과 분석 | 코드 완성, 자격증명 미발급 | 무료 (쿼터 제한 있음) |
| TikTok API | TikTok 게시 자동화 | 코드 없음, 앱 심사 필요 | 무료 (플랫폼 앱 심사 후) |
| Naver Blog API | 네이버 게시 자동화 | 코드 없음 | 무료 |
| Discord Webhook | 브리핑 전달 | 기존 사용 중 | 무료 |

**이번 단계(M0)에서 새로 발생하는 API 비용**: 없음 (기존 Gemini API 사용 범위 내, 조사·설계 단계)

---

## 7. 비용 발생 가능 항목

> §0-2 원칙 6 — 비용 발생은 CEO 승인 필요

| 항목 | 조건 | 예상 비용 |
|---|---|---|
| Gemini API (구현 단계) | 매일 브리핑 자동 실행 시 | 일 약 $0.01~0.10 (주제 1개 기준, 정확한 수치 DATA_MISSING) |
| Meta 광고 API | 유료 광고 집행 시 | CEO 별도 승인 필수 |
| CapCut Pro / Canva Pro | 영상 편집 자동화 확장 시 | 별도 검토 필요 |
| SNS 게시 자동화 앱 심사 | TikTok/Meta 앱 등록 시 | 없음 (심사 비용 없음, 개발 시간 소요) |

---

## 8. 단계별 구현 계획

### M0 — 조사·설계 (현재, 구현 없음) ✅

| 완료 기준 | 상태 |
|---|---|
| 기존 기능 전수 조사 | 완료 |
| 역할별 입력·출력·QA 사양 정의 | 완료 |
| 브랜드별 운영 구조 정의 | 완료 |
| 스케줄러 중복 분석 | 완료 |
| SSOT 불일치 발견 및 기록 | 완료 |
| 설계서 작성 (`docs/ai-os/MARKETING_AUTOMATION_DESIGN.md`) | 완료 |

---

### M1 — 기초 수정 및 스텁 (CEO 승인 후 진행)

> 기존 코드 최소 수정, 기반 정비

| 작업 | 경로 | 우선순위 |
|---|---|---|
| `gbrick-style.md` SSOT 수정 (매장 수·폐점 수 제거) | `guides/gbrick-style.md` | **P0** (§0-2 원칙 1 — 사실이 먼저) |
| 브랜드별 출력 디렉토리 분리 | `output/gbrick/` `output/designfobee/` | P1 |
| `trend_research.py` 브랜드별 소스 설정 파일 추가 | `config/trend_sources_gbrick.json` `config/trend_sources_designfobee.json` | P1 |
| Audience Analyst 스텁 생성 | `agents/marketing_audience.py` | P2 |
| Content Planner 스텁 생성 | `agents/marketing_planner.py` | P2 |

**완료 기준**: `gbrick-style.md` SSOT 수정 완료, dry-run으로 기존 파이프라인 영향 없음 확인

---

### M2 — 핵심 역할 구현 (M1 완료 후)

| 작업 | 경로 |
|---|---|
| Audience Analyst 실구현 | `agents/marketing_audience.py` |
| Channel Strategist 구현 | `agents/marketing_channel.py` |
| Content Planner 구현 | `agents/marketing_planner.py` |
| Brand QA 구현 | `agents/marketing_brand_qa.py` |
| `generate_osmu.py` Video Producer 확장 (장면·CapCut) | `agents/marketing_video.py` |

**완료 기준**: 브랜드 1개(GBRICK)로 topic 입력 → 콘텐츠 기획 카드 3개 + 최우선 대본 생성 확인

---

### M3 — Marketing Lead + 브리핑 통합 (M2 완료 후)

| 작업 | 경로 |
|---|---|
| Publishing Coordinator 구현 | `agents/marketing_publisher_prep.py` |
| Marketing Lead 오케스트레이터 구현 | `marketing_lead.py` |
| `discord_brief.py`에 마케팅 섹션 Agent 추가 | 기존 파일 확장 |
| 주간 보고 구조 구현 | `marketing_weekly_report.py` |
| DesignFOBEE 브랜드 파이프라인 검증 | — |

**완료 기준**: topic 1개 입력 → 9개 산출물 자동 생성 + Brand QA 통과 + 대표 보고서 출력

---

### M4 — 성과 분석 연결 (자격증명 발급 후, CEO 승인 필요)

| 작업 | 조건 |
|---|---|
| Meta Graph API 자격증명 연결 | CEO가 INSTALL.md §6으로 직접 발급 |
| YouTube Data API 자격증명 연결 | CEO가 INSTALL.md §6으로 직접 발급 |
| `analytics.py` → Performance Analyst 연결 | 자격증명 확인 후 |
| 주간 보고에 실데이터 연결 | M4 완료 후 |

---

## 9. CEO 승인 필요 항목

> §0-2 원칙 6 + AI-DEV-RULES.md §2

| 승인 항목 | 이유 | 단계 |
|---|---|---|
| **M1 시작 승인** | 기존 운영 코드 수정 시작 | M0 완료 후 |
| `gbrick-style.md` SSOT 수정 내용 최종 확인 | 대외 문구 변경 | M1 |
| 실제 GBRICK 운영 매장 수 (현재 DATA_MISSING) | 대표만 아는 사실 | M1 |
| Meta Graph API 앱 등록 및 자격증명 발급 | CEO 계정 권한 필요 | M4 |
| YouTube OAuth 자격증명 발급 | CEO 계정 권한 필요 | M4 |
| Gemini API 사용량 한도 설정 | 비용 발생 | M2 시작 전 |
| SNS 게시 자동화 시작 | 외부에 게시되는 첫 행동 | M3 이후 별도 단계 |
| 유료 광고 집행 | 비용 발생 | 별도 단계 |

---

## 10. 보호 범위 확인

이번 M0 단계에서 수정하지 않은 것:

- `app/` (홈페이지 프로젝트)
- `voice-order/` (watchdog 작업 트리)
- `content-automation-agent/` 기존 파일 (조사만)
- `lib/`, `services/`, `agents/` 기존 파일
- 기존 스케줄러 설정
- `.env` 또는 시크릿값

---

## 11. 산출물 경로 요약

| 단계 | 파일 | 설명 |
|---|---|---|
| M0 | `docs/ai-os/MARKETING_AUTOMATION_DESIGN.md` | 이 설계서 |
| M1 | `content-automation-agent/guides/gbrick-style.md` | SSOT 수정 |
| M1 | `content-automation-agent/config/trend_sources_gbrick.json` | 트렌드 소스 설정 |
| M1 | `content-automation-agent/config/trend_sources_designfobee.json` | 트렌드 소스 설정 |
| M2~M3 | `content-automation-agent/src/agents/marketing_*.py` | 역할별 모듈 |
| M3 | `content-automation-agent/src/marketing_lead.py` | 오케스트레이터 |

---

## 12. 완료 보고

| 항목 | 상태 |
|---|---|
| 기존 마케팅 기능 전수 조사 | ✅ 완료 |
| SSOT 불일치 발견 | ✅ 완료 (gbrick-style.md 수정 필요, M1에서 처리) |
| 스케줄러 중복 위험 분석 | ✅ 완료 (중복 없음, 통합 전략 수립) |
| 역할 9개 입력·출력·QA 사양 정의 | ✅ 완료 |
| 브랜드별 운영 구조 설계 | ✅ 완료 |
| 단계별 구현 계획 (M0~M4) | ✅ 완료 |
| CEO 승인 항목 목록화 | ✅ 완료 |
| 설계서 파일 생성 | ✅ 완료 |

**구현 미착수 확인**: 이 설계서 외에 어떤 기존 파일도 수정하지 않았다.

---

*작성: Claude Code (AI CTO 역할) · 2026-10-13*
*승인 전까지 구현 없음 — 다음 단계는 CEO 승인 후 M1부터 시작*
