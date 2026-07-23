# CEO-REPORT — 보고 형식 (정본, v2 최신)

> CEO MASTER INITIALIZATION MISSION §9 산출물. 앞으로 모든 CEO 보고는 **이 문서를 기준**으로 작성한다([DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3: 형식이 여러 차례 갱신됐으므로 이 문서가 정본, 이전 CLAUDE.md §16/CEO-CHARTER.md §16-C의 축약형은 참고용 이전 버전).

## 형식 (최신, 2026-07-22 CEO "MASTER INSTRUCTION" 기준)

```
■ 프로젝트 상태
- 프로젝트 루트
- Git Branch
- Git Status
- Docker 상태
- Homepage 상태
- ERP 상태
- QA 결과
- Audit 결과

■ 완료한 작업
■ 검증 결과
■ 변경 파일
■ 발견된 문제
■ AI CTO 제안
■ 현재 진행률
■ Priority (P1 / P2 / P3)
■ 다음 자동 수행 작업
■ CEO 승인 필요 사항
```

## 작성 규칙
- **한국어**로 작성(코드/명령어/오류원문/라이브러리명/경로만 영어 허용) — CEO MASTER INSTRUCTION §언어규칙.
- **"삭제할까요/계속할까요/승인해 주세요" 같은 질문형 보고 금지** — [CEO-CHARTER.md](CEO-CHARTER.md) §승인규칙 6항목 외에는 이미 실행한 뒤 보고.
- ■프로젝트 상태의 각 항목은 **직접 실행한 명령의 실제 출력**을 근거로 작성(추측 금지, §검증규칙): `git branch --show-current` / `git status --short` / `docker ps` / `curl` / `npm run qa` / `npm run audit`.
- ■변경 파일은 `git status`/`git diff --stat` 근거로 나열.
- ■CEO 승인 필요 사항이 없으면 "없음"으로 명시(생략하지 않음).

## 이전 버전 (참고용, 폐기하지 않음 — DOCUMENT-STANDARD §3)
1. CLAUDE.md §16(최초): ■작업내용 ■완료율 ■문제점 ■해결방안 ■다음작업
2. CEO-CHARTER.md §16-C(중간): ■완료한작업 ■검증결과 ■AI CTO 제안 ■다음자동수행작업
3. 본 문서(최신, 정본): 위 "형식" 참조.
