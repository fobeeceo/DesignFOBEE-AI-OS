# API — 엔드포인트 · CLI

## 웹 API (Next.js `app/api`)
| 경로 | 메서드 | 용도 |
|---|---|---|
| `/api/hq/erp` | GET | AI HQ ERP 데이터(스냅샷 JSON). 대시보드 라이브 소스. |
| `/api/generate` | POST | AI 인테리어 리디자인(Gemini). `{image, roomTypeId, styleId, byokKey?}` |
| `/api/projects` | POST/GET | 프로젝트 생성/조회 (인증) |
| `/api/projects/[id]/photos` | POST | 사진 업로드 |
| `/api/projects/[id]/design` | POST/GET | AI 디자인 생성/잔여횟수 |
| `/api/projects/[id]/design/[imgId]/description` | POST | AI 설명 |
| `/api/projects/[id]/design/[imgId]/estimate` | POST | AI 예상 견적 |
| `/api/leads` | POST | 상담 신청(홈 CTA) |
| `/api/profile` | GET/PATCH | 프로필 |
| `/api/admin/leads`, `/api/admin/leads/[id]`, `.../notes` | GET/PATCH/POST | 관리자 CRM |
| `/api/auth/naver`, `/api/auth/naver/callback` | GET | Naver 로그인 |
| `/api/health` | GET | 헬스체크 |

## Python CLI (`content-automation-agent/src`)
| 명령 | 용도 | 산출 |
|---|---|---|
| `python pos_import.py <clsProd.xlsx>` | POS 마감 파싱 | `output/pos_analysis.json` |
| `python dessert_import.py <디저트단가표.xlsx>` | 디저트 원가 | `output/dessert_menu.json` |
| `python erp_engine.py` | 재고·발주·원가·대시보드 | `output/erp_daily_report.json`, `erp_dashboard.json` |
| `python generate_osmu.py` | OSMU 콘텐츠 생성 | `output/{blog,shorts,...}` |
| `python publish_all.py [--approve]` | 7채널 배포(승인 게이트) | `output/publish_report.json` |

## 환경변수
`content-automation-agent/.env.example` · 웹은 Supabase/GEMINI/Naver 키(Vercel Env). SSOT: 값은 절대 코드에 두지 않는다.
