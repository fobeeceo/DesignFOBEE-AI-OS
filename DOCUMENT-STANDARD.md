# DOCUMENT-STANDARD v1.0 — DesignFOBEE AI Headquarters

> CEO 지시(2026-07-22) §3 산출물. [PROJECT-INDEX.md](PROJECT-INDEX.md)·[DOCUMENT-INDEX.md](DOCUMENT-INDEX.md)·[DOCUMENT-POLICY.md](DOCUMENT-POLICY.md)를 기준으로 향후 모든 문서 작업이 따라야 할 표준. **MASTER INITIALIZATION을 포함한 모든 신규 문서 생성은 이 표준을 따른다.**

## 1. 배치 규칙 (신규 문서는 어디에 만드는가)

```
신규 문서 작성 시 판단 순서:
① 민감정보(재무/원가/전략/개인정보) 포함? → docs/**에만 배치, Git 미추적 유지, DOCUMENT-INDEX에 "frozen 참고용" 아님 "신규 민감" 라벨로 등록
② Google Drive 원본을 그대로 복제하는가? → 만들지 않는다. 대신 Drive 링크 + 추출값만 문서화
③ 그 외(운영·기술·거버넌스·계획 문서) → 프로젝트 루트에 생성 (Git 추적)
```
**결정**: MASTER INITIALIZATION이 요구하는 신규 문서(AI-HQ-MASTER.md·SYSTEM-ARCHITECTURE.md·CEO-REPORT.md·DECISION-LOG.md 등)는 전부 ③에 해당 → **루트에 생성**. 기존 `docs/`(frozen)는 건드리지 않는다.

## 2. 명명 규칙
- 루트 활성 문서: `SCREAMING-KEBAB-CASE.md` (기존 관례 — CEO-CHARTER.md·PROJECT-INDEX.md 등과 통일).
- `docs/` 하위(frozen): 기존 각 폴더의 관례를 그대로 유지(임의 변경 금지, §AI CTO 원칙).
- 생성물(리포트): `{도구}-REPORT.md` 또는 `{도구}-report.md`(기존 QA-REPORT.md/audit-report.md 대소문자 혼재는 이미 굳어진 관례로 유지, 신규 생성물부터는 대문자 통일 권장).

## 3. 중복 처리 원칙 — "삭제보다 표준 지정(Standard Source)"
1. 동일/유사 문서가 여러 곳에 존재하면 **삭제하지 않는다**.
2. **DOCUMENT-INDEX.md에 "정본(Standard Source)"과 "참고용(구버전)"을 명시**한다(이미 적용: `AI_ORGANIZATION_MASTER.md`·`BACKLOG.md` 사례).
3. 정본 지정 기준: (a) 최신 작성일 (b) 더 상위/포괄적 위치(`master/` > `organization/` 등 관례) (c) 실제 참조·연결 빈도.
4. Git 미추적 문서(`docs/`)는 **어떤 경우에도 삭제하지 않는다**(복구 불가 리스크, §AI CTO 원칙 "모든 변경은 Git으로 복구 가능해야 한다"와 정면 충돌하므로).
5. Git 추적 문서(루트)는 진짜 중복·데드 콘텐츠일 때만 삭제 가능(Git 복구 가능) — 단, 이 경우도 먼저 DOCUMENT-INDEX에 정본 지정을 시도하고, 그래도 완전 중복(내용 100% 동일)일 때만 삭제.

## 4. 버전 관리
- 문서 상단에 `Version X.Y` 또는 갱신일을 명시하는 문서(CEO-CHARTER.md 등 헌장류)는 개정 시 버전을 올리고 변경 사유를 CHANGELOG.md에 기록.
- 그 외 문서는 CHANGELOG.md의 이력 자체가 버전 기록을 대신한다(별도 버전 번호 불필요, 중복 관리 방지).

## 5. 상호 참조 규칙
- 모든 신규 문서는 관련 문서를 마크다운 링크로 최소 1개 이상 연결한다(고립 문서 금지).
- PROJECT-INDEX.md·DOCUMENT-INDEX.md는 신규 문서 추가 시 **반드시 함께 갱신**한다(단일 진입점 유지).

## 6. 목차/색인 유지
- [PROJECT-INDEX.md](PROJECT-INDEX.md) — "이 프로젝트의 어느 영역에 속하는가" 기준 색인(10개 영역).
- [DOCUMENT-INDEX.md](DOCUMENT-INDEX.md) — "어떤 문서가 있는가" 기준 색인(카테고리별).
- 신규 문서 = 반드시 두 색인 모두에 등록.

## 7. 이 표준이 커버하지 않는 것 (다음 검토 대상)
- `docs/` 세부 재분류(민감/비민감 재구분)는 저장소 Private 전환 후 별도 사이클.
- Google Drive 문서 명명 규칙은 이 표준 범위 밖(Drive는 GBRICK_AI_SYSTEM 자체 관례를 따름, 이미 MASTER_INDEX 버전 체계 존재).

---
**확정**: 본 표준 v1.0에 따라 이제 MASTER INITIALIZATION(§4)을 진행한다.
