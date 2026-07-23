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

## 2026-07-22 — AI-HQ-SYSTEM-RULES.md 별도 생성 안 함
- **결정**: MASTER INITIALIZATION이 요청한 `AI-HQ-SYSTEM-RULES.md`를 별도 파일로 만들지 않음.
- **근거**: [CLAUDE.md](CLAUDE.md)가 이미 QA/Audit/Docs/Git/Deploy/Dev/Media 규칙 전부를 포함하는 "AI Headquarters Constitution & Operating Manual" — 거의 동일한 목적의 문서를 새로 만들면 [DOCUMENT-STANDARD.md](DOCUMENT-STANDARD.md) §3(중복보다 정본 지정)를 스스로 위반. CLAUDE.md를 정본으로 지정.
