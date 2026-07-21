# AI-HQ Architecture

> CEO-CHARTER.md §Docker 규칙 준수 문서. 구조 결정과 근거(§문제해결규칙: 대안 3개 이상 검토·선택이유 문서화)를 기록한다.

## 폴더 구조 결정

```
AI-HQ/
  docker-compose.yml   # 단일 오케스트레이션 진입점
Dockerfile              # web 서비스 (repo 루트, Next.js 앱과 동일 위치)
content-automation-agent/
  Dockerfile             # erp 서비스
  requirements.txt        # Python 의존성
```

### 검토한 대안 (3개, §문제해결규칙)
1. **전체 monorepo를 `AI-HQ/` 아래로 물리 이동** — 헌장 문구("모든 서비스는 AI-HQ 폴더 아래에서 관리")를 가장 문자 그대로 만족. **기각**: 기존 Vercel 배포는 repo 루트의 Next.js 앱을 자동 감지한다. 통째로 이동하면 배포 파이프라인이 깨지고(§구현규칙 "핵심 구조 무변경" 위반, 서비스 중단 리스크), 승인 대상인 "비용 발생"·"정책 변경"에 준하는 위험을 초래할 수 있다.
2. **AI-HQ 자체에 각 서비스 코드를 심볼릭/복제** — 관리 지점은 명확해지나 이중 관리·동기화 부채 발생(§구현규칙 "기술 부채 최소화" 정면 위배). **기각**.
3. **오케스트레이션(compose)만 `AI-HQ/`에 두고, Dockerfile은 각 서비스 폴더에 유지, 기존 앱 위치 무변경** — 채택. "관리"를 "이 폴더에서 기동·제어한다"로 해석. Vercel 배포 무영향, 기존 구조 무변경, Docker 표준 관례(서비스 곁에 Dockerfile)와 일치.

**선택**: 3번. 이유는 위 기각 사유의 반대 — 무파괴·무중단·표준 관례 부합.

## 서비스

| 서비스 | 위치 | 역할 | 실행 방식 |
|---|---|---|---|
| `web` | 루트 `Dockerfile` | DesignFOBEE Next.js 앱(홈·`/design`·`/hq`) | 상시 (`up`) |
| `erp` | `content-automation-agent/Dockerfile` | POS Import·ERP 계산·OSMU 생성 | 온디맨드 (`run`, `profiles: tools`) |

## 검증 기록 (2026-07-21, 실행 증거)
- `docker compose -f AI-HQ/docker-compose.yml build web` → exit 0, 이미지 `ai-hq-web` 생성.
- `docker compose -f AI-HQ/docker-compose.yml build erp` → exit 0, 이미지 `ai-hq-erp` 생성.
- `docker compose ... run --rm erp` → **실제 실행**, ERP 대시보드 JSON 정상 출력(로컬 실행과 동일 결과: 매출 16,627,700원 등).
- `docker compose ... run -p 3011:3000 web` → 컨테이너 기동 → `curl localhost:3011` **HTTP 200**, 본문에 "DesignFOBEE"·"공간을 넘어" 마커 확인.
- 검증 후 컨테이너 정리(`docker stop/rm`, `compose down`) 완료.

## 알려진 제약 / 다음 단계
- `env_file`은 `required: false`로 설정 — `.env.local`/`.env` 미존재 시에도 기동(무파괴 가드레일, 기존 미들웨어 env-optional 설계와 정합).
- **시크릿 취급 주의**: 검증 중 `docker compose config`가 해석된 env 값(실제 키)을 표준출력에 노출한 사고가 있었음 → 즉시 로그 파일 삭제로 대응(git/원격 노출 없음, 로컬 임시파일 한정). 이후 `config --services`로 구조만 확인하도록 절차 변경. **교훈**: `docker compose config` 전체 출력은 사람이 볼 화면에서만 사용, 로그/파일로 리다이렉트 금지.
- `output: standalone` 미사용으로 이미지가 비대함(node_modules 포함) — 추후 최적화 대상(§자율진행, 승인 불요).
