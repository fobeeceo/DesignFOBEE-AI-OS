# INSTALL — DesignFOBEE · GBRICK AI HQ

## 1. 로컬 개발 (Docker 없이)
```bash
npm install
cp .env.example .env.local   # 값 채우기 (Supabase/Gemini/Naver)
npm run dev                   # http://localhost:3000
```
env 없이도 홈·`/design`·`/hq`(공개 데모 모드)는 렌더된다.

## 2. Docker Compose (권장 — CEO-CHARTER.md §Docker 규칙)
루트에서 실행(`AI-HQ/docker-compose.yml`이 단일 오케스트레이션 진입점, `docker run` 미사용):

```bash
# 이미지 빌드
docker compose -f AI-HQ/docker-compose.yml build

# 웹 앱 기동 (http://localhost:3000)
docker compose -f AI-HQ/docker-compose.yml up web

# ERP CLI 온디맨드 실행 (예: POS 분석)
docker compose -f AI-HQ/docker-compose.yml run --rm erp python src/pos_import.py /app/output/<파일>.xlsx
docker compose -f AI-HQ/docker-compose.yml run --rm erp python src/erp_engine.py
```
`.env.local`(web) / `content-automation-agent/.env`(erp)이 없어도 기동된다(dry-run/데모 모드, `required: false`).
⚠️ `docker compose config`는 실제 키 값을 출력한다 — 로그 파일로 리다이렉트 금지, 화면 확인만.

## 3. QA / Audit (배포 전 필수, CLAUDE.md §9·§10)
```bash
npm run qa            # lint + type-check + build
npm run qa:extended   # a11y·SEO·broken-link·image·performance → QA-REPORT.md
npm run audit          # dead-code·중복·unused-import·broken-route·build·security·env·git → audit-report.md
```

## 4. ERP 실데이터 파이프라인
```bash
cd content-automation-agent/src
python pos_import.py <POS.xlsx>
python dessert_import.py <디저트단가표.xlsx>
python erp_engine.py
```

## 5. 배포
`git push origin main` → Vercel 자동 배포(`design-fobee-ai-os.vercel.app`). main은 항상 배포 가능 상태 유지(§12).
