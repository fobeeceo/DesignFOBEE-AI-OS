# CHANGELOG — DesignFOBEE AI OS

모든 주요 변경을 기록한다. AI OS 업그레이드는 Priority 단위로 추적한다.

## [Unreleased]

### AI OS 업그레이드 (2026-07-20)

#### Priority 1 — SSOT (Master DB) ✅ 완료 (MVP)
- **Master DB (SSOT) 레지스트리** 생성 (Notion, Company Knowledge Base 하위) — `fb9143dc7e9946af8da0926e143d4561`.
- **정본 10개 데이터셋 등록**: Franchise Facts/창업비용/재무/가맹점/FAQ, AI Prompt Library, Change Report, Portfolio(대기), 메뉴원가(제안), CompanyProfile(대기). 각 행 = 도메인·담당 AI 역할·레코드수·버전·도메인 DB 링크·접근정책·최종갱신.
- **SSOT 접근 정책 명문화**: 모든 AI는 Master DB만 참조, Drive/Sheet 직접 읽기 금지, 변경은 Change Report 경유.
- **2-Plane 정의**: 운영 SSOT=Notion Master DB / 실행 앱 SSOT=코드(`prompts/*`,Prisma), Living Document로 정합.
- **테스트**: notion-fetch로 Master DB 단일 질의 → 스키마+10개 데이터셋 조회 확인. ✅

#### AI Media Automation OS (v3.0 모듈) ✅ MVP
- **`content-automation-agent/` 워크스페이스** 신설: guides/src/output/assets/templates/prompts/logs/config + README + .env.example + config.
- **OSMU 생성기**(`src/generate_osmu.py`): 1 소스 → blog/blogger/naver.md·shorts/youtube.json·instagram/facebook/threads/x.txt·report.json 생성. **테스트 통과(exit 0, 산출물 10종)**.
- **가드레일 내장**(`src/base_publisher.py`): API키는 .env만, 기본 dry-run/Private, 자격증명 없으면 강제 dry-run, 실패 시 logs/ 저장.
- **성과 환류**(`src/analytics.py`): 지표→분석→Living Document Change Report 제안(상태=제안, CEO 승인 게이트 준수).
- **AI Media Workforce DB**(Notion) + 13 Worker 등록(Director/Trend/Blog/Shorts/Voice/Video/Thumbnail/SEO/Instagram/YouTube/TikTok/Naver/Analyst), 각 Mission/SOP/KPI.
- **가이드**: gbrick-style·designpobee-style(브랜드 SSOT).
- **Master DB 등록** + `.gitignore`(.env/output/logs 제외).
- 🔌 업로드 API(YouTube/Meta/TikTok/Naver/Blogger)·Voice/Video 생성 = OAuth 자격증명+플랫폼 심사 후 활성(그 전 dry-run).

### 이전 완료 (이번 세션)
- **Living Document 자동 루프**: Change Report DB(상태머신) + SOP + CEO 승인 게이트. 메뉴원가 PDF로 1사이클 실증(제안 3건).
- **AI 역할팀**: AI Prompt Library + 6개 역할 시스템프롬프트(디자이너/견적/마케터/CRM/콘텐츠/CEO).
- **ReRoom→DesignFOBEE UI 통합**: 무로그인 AI 스튜디오(`/design`), 공통 테마·브랜드 치환.
- **Portfolio 실제 교체**: GBRICK 매장 실제 사진 5장 + 에디토리얼.
- **반응형**: Desktop/Tablet/Mobile 점검, 태블릿 내비 수정.
- **배포 자동화**: `git push → Vercel 자동배포`, env 없이 빌드되도록 미들웨어 가드 + auth 페이지 동적화.
- **Franchise KB**: 정보공개서 SSOT 63레코드(출처·공개범위·법정고지).
