# AI Media Automation OS — content-automation-agent

DesignFOBEE AI OS v3.0의 **Media Division** 모듈. 기존 OS(Master DB/Living Document/AI Workforce/Prompt Library)와 완전 통합된 하나의 모듈.

## 원칙
- **SSOT**: 모든 데이터는 Master DB(Notion) 참조. 이 모듈은 Drive/Sheet를 직접 읽지 않는다.
- **OSMU** (One Source Multi Use): 하나의 소스 → 블로그/쇼츠/인스타/유튜브/틱톡 등 다중 산출.
- **가드레일**: API Key는 `.env`에서만. 업로드 기본값 = **Private/예약**. 실패 시 `logs/`에 저장.
- **기존 OS 무파괴**: 이 폴더 밖의 코드/DB를 변경하지 않는다.

## 파이프라인 (OSMU)
```
Source 입력 → AI Trend Researcher → AI Media Director(기획)
  → Blog Writer → SEO 검증 → Shorts/Voice/Video/Thumbnail
  → 각 플랫폼 Publisher(Private/예약) → 성과분석(analytics)
  → Living Document(Change Report) → Master DB → Prompt/SOP/Memory 개선
```

## 폴더
| 폴더 | 용도 |
|---|---|
| `guides/` | 브랜드·플랫폼 스타일 가이드(생성 규칙) |
| `prompts/` | 12개 Media Worker 시스템 프롬프트(=Notion AI Prompt Library 미러) |
| `src/` | 생성기·퍼블리셔·analytics·scheduler |
| `templates/` | 산출물 템플릿 |
| `output/` | 생성 결과(blog.md, shorts.json, thumbnail.png …) — gitignore |
| `assets/` | 이미지/폰트 등 자산 |
| `logs/` | 실행·업로드·에러 로그 — gitignore |
| `config/` | config.json(플랫폼·스케줄·기본 공개범위) |

## 상태 (MVP)
- ✅ 스캐폴드·가드레일·OSMU 생성기 골격·analytics 환류 골격·가이드·12 Worker 등록(Master DB).
- 🔌 **연결 대기(자격증명 필요)**: 실제 업로드 API(YouTube/Meta/TikTok/Naver/Blogger)는 OAuth 키 + 플랫폼 앱 심사 후 `.env`에 넣으면 활성화. 그 전까지 퍼블리셔는 **dry-run**으로 동작.

## AI 조직 (Media Division)
CEO → AI CTO → **AI Media Director** → Blog Writer / Shorts Producer / Instagram / YouTube / TikTok / Naver Blog / SEO / Thumbnail / Voice / Video Editor / Content Analyst / Trend Researcher.
각 Worker: Mission·Prompt·Memory·SOP·KPI·Dashboard·History·Feedback (AI Workforce OS 규칙).
