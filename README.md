# DesignFOBEE · GBRICK AI HQ

AI가 운영하는 본사 운영체제 — DesignFOBEE(공간디자인)·GBRICK Coffee(프랜차이즈)·AI ERP·AI HQ·Media OS 통합.

**거버넌스**: [CLAUDE.md](CLAUDE.md) (헌장 v1.0) · **아키텍처** [SYSTEM.md](SYSTEM.md) · **API** [API.md](API.md) · **계획** [ROADMAP.md](ROADMAP.md) / [TODO.md](TODO.md) / [CHANGELOG.md](CHANGELOG.md)

**주요 화면**: `/` 홈 · `/design` 무로그인 AI 스튜디오 · `/hq` AI 본사 대시보드(8메뉴). **배포 전**: `npm run qa` (lint+type-check+build).

---

# DesignFOBEE-AI — STEP 1~10 완료: 홈페이지 · 회원가입 · 업로드 · AI분석 · AI생성 · AI설명 · AI견적 · 상담신청 · CRM저장 · 관리자페이지

DesignFOBEE AI Sales OS. STEP 1 홈페이지 · STEP 2 회원가입 · STEP 3 사진 업로드 ·
STEP 4+5 AI 공간유형 선택 및 인테리어 리디자인 이미지 생성 · STEP 6 AI 설명 생성 ·
STEP 7 AI 예상 견적 · STEP 8 AI 디자인 결과를 첨부한 상담 신청 · STEP 9 CRM 저장(관리자 API) ·
STEP 10 관리자 페이지 (Gemini `gemini-3.1-flash-image-preview` + `gemini-flash-latest`).

로드맵 10단계가 모두 구현되었습니다. 아래 "운영 배포 전 필수 확인" 항목만 실제 값으로
채우면 실사용이 가능합니다.

## 실행 방법

```bash
npm install
cp .env.example .env.local   # 값 채워넣기 (Supabase, 네이버, Gemini 등)
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

http://localhost:3000 에서 확인. 관리자 페이지는 http://localhost:3000/admin/leads.

## ⚠️ 운영 배포 전 필수 확인 — 견적 단가

`prompts/pricing.ts`의 스타일별/공간유형별 ㎡당 단가는 전부 **임시 플레이스홀더**입니다.
디자인포비 실제 시공 단가로 교체하지 않은 채 실제 고객에게 노출하면 안 됩니다.
값만 교체하면 계산 로직(`services/estimateService.ts`)은 그대로 재사용됩니다.

## ⚠️ 운영 배포 전 필수 확인 — 관리자 계정 지정

관리자 페이지(`/admin/leads`)와 관리자 API(`/api/admin/**`)는 `Profile.isAdmin = true`인
계정만 접근할 수 있다. 배포 후 DB에서 직접 담당자 계정의 `isAdmin`을 `true`로 지정해야 한다.

```sql
update profiles set "isAdmin" = true where id = '<담당자 Supabase auth uid>';
```

## 폴더 구조

- `app/` — 라우팅, 페이지, API 라우트
- `app/(auth)/login`, `app/(auth)/signup` — 로그인/회원가입
- `app/(dashboard)/upload` — 사진 업로드 (로그인 필요)
- `app/analyze/[projectId]` — STEP 4~7 AI 리디자인 스튜디오
- `app/consult/[projectId]/[designImageId]` — STEP 8 AI 디자인 결과 첨부 상담 신청 화면
- `app/(admin)/admin/leads`, `app/(admin)/admin/leads/[leadId]` — STEP 10 관리자 페이지 (리드 목록/상세)
- `app/api/projects/[projectId]/design` — AI 이미지 생성 (STEP 4+5)
- `app/api/projects/[projectId]/design/[designImageId]/description` — AI 설명 생성 (STEP 6)
- `app/api/projects/[projectId]/design/[designImageId]/estimate` — AI 예상 견적 (STEP 7)
- `app/api/leads` — 상담 신청 저장 (STEP 1 + STEP 8 공용)
- `app/api/admin/leads`, `app/api/admin/leads/[leadId]`, `app/api/admin/leads/[leadId]/notes` — STEP 9 CRM 관리자 API
- `components/design` — DesignStudio, CompareSlider, EstimateForm, ConsultRequestForm
- `components/admin` — LeadStatusBadge, LeadStatusControl, LeadNoteForm
- `components/layout/AdminHeader.tsx` — 관리자 페이지 헤더
- `agents/interiorDesignAgent.ts` — Gemini 이미지 생성 (STEP 4+5)
- `agents/interiorDescriptionAgent.ts` — Gemini 설명 생성 (STEP 6)
- `prompts/interiorStyles.ts` — 공간유형·스타일·프롬프트 정의
- `prompts/pricing.ts` — 견적 단가 설정 (⚠️ 임시값, 교체 필요)
- `services/` — leadService, profileService, projectService, photoService, designService, estimateService, crmService
- `lib/auth/requireAdmin.ts` — 관리자 API/페이지 공통 권한 체크
- `database/prisma` — Prisma 스키마
- `lib/supabase/` — client.ts / server.ts / admin.ts / storage.ts
- `middleware.ts` — Supabase 세션 쿠키 갱신

## 로그인/회원가입 (STEP 2) 설정

- **이메일/비밀번호**: Supabase 기본 기능.
- **Google, Kakao**: Supabase 대시보드 → Authentication → Providers에서 활성화.
- **Naver**: Supabase 미지원 → 자체 구현. [네이버 개발자센터](https://developers.naver.com)에서
  앱 등록 후 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 설정.

## 사진 업로드 (STEP 3) 설정

Supabase Storage 버킷 2개 필요: `space-photos`(원본), `design-images`(AI 결과), 둘 다 Public.

```sql
create policy "Users can upload to own folder"
on storage.objects for insert
with check (
  bucket_id in ('space-photos', 'design-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

## AI 공간분석·생성·설명 (STEP 4~6) 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 Gemini API 키 발급 → `.env.local`의 `GEMINI_API_KEY`
2. 이미지 생성: `gemini-3.1-flash-image-preview` / 설명 생성: `gemini-flash-latest`
3. 로그인 사용자별 무료 생성 횟수: `prompts/interiorStyles.ts`의 `FREE_GENERATIONS_PER_USER`(기본 3회)

## AI 예상 견적 (STEP 7) 설정

1. `prompts/pricing.ts`의 `STYLE_BASE_PRICE_PER_SQM`, `ROOM_TYPE_MULTIPLIER`를 실제 단가로 교체
2. 사용자가 면적(㎡)을 입력하면 `areaSqm × 스타일단가 × 공간유형배율`로 ±15% 범위 계산
3. 화면에 "실제 견적은 현장 실측 후 확정"이라는 안내 문구가 항상 함께 표시됨 (법적/신뢰 리스크 방지)

## 상담 신청 (STEP 8) 설정

- AI 스튜디오 결과 화면(`/analyze/{projectId}`)의 "이 디자인으로 상담 신청하기 →" 버튼이
  `/consult/{projectId}/{designImageId}`로 연결된다. (로그인 필요 — 미로그인 시 `/login`으로 리다이렉트)
- 이 화면은 해당 AI 디자인 결과(이미지 + STEP 6 설명 + STEP 7 견적)를 요약해서 보여주고,
  `ConsultRequestForm`으로 제출하면 `POST /api/leads`에 `designImageId`가 함께 저장된다.
- Lead가 `designImageId`와 함께 생성되면, 연결된 `Project.status`가 자동으로 `CONSULTED`로 갱신된다.
- 홈페이지 하단 일반 문의 폼(`ContactForm`, STEP 1)은 `designImageId` 없이 그대로 동작 — 기존 동작 변경 없음.
- Lead는 로그인 사용자가 신청한 경우 `profileId`도 함께 저장되어 STEP 9(CRM)에서 사용자별 이력 조회가 가능하다.

흐름: `/upload` 사진 업로드 → `/analyze/{projectId}`에서 사진·공간유형·스타일 선택 →
AI 이미지 생성 → AI 설명 자동 생성 → 면적 입력 후 AI 예상 견적 확인 →
"이 디자인으로 상담 신청하기" → `/consult/{projectId}/{designImageId}`에서 AI 결과 요약 확인 후
상담 신청 제출 → Lead 저장(designImageId 첨부) + Project.status = CONSULTED.

## CRM 저장 (STEP 9) 설정

- `Profile.isAdmin` — 관리자 여부. 기본값 `false`, 배포 후 DB에서 직접 지정 (위 경고 참고).
- `LeadNote` 모델 — 상담원이 리드에 남기는 메모/통화 이력. 쌓일수록 상담 히스토리가 데이터 자산이 된다.
- `GET /api/admin/leads?status=&q=&page=` — 리드 목록 (상태 필터/이름·전화·이메일 검색/페이지네이션)
- `GET /api/admin/leads/[leadId]` — 리드 상세 (첨부된 AI 디자인 결과 + 견적 + 메모 이력 포함)
- `PATCH /api/admin/leads/[leadId]` — 상태 변경 (`NEW` → `CONTACTED` → `CONVERTED`/`CLOSED`)
- `POST /api/admin/leads/[leadId]/notes` — 상담 메모 추가
- 모든 관리자 API는 `lib/auth/requireAdmin.ts`로 보호되며, 비로그인은 401, 비관리자는 403을 반환한다.

## 관리자 페이지 (STEP 10) 설정

- `/admin/leads` — 리드 목록. 이름/전화/이메일 검색, 상태 필터, 페이지네이션. 행 클릭 시 상세로 이동.
- `/admin/leads/[leadId]` — 리드 상세. 기본 정보, 첨부된 AI 디자인 결과(이미지+설명+견적, 있는 경우),
  상태 변경 드롭다운(변경 즉시 저장), 상담 메모 이력 및 메모 추가.
- `app/(admin)/layout.tsx`가 모든 `/admin/**` 페이지 접근을 가드한다: 미로그인 → `/login`,
  로그인했지만 관리자가 아님 → `/`.
- 화면은 STEP 9의 API(`services/crmService.ts`)를 그대로 사용한다 — 목록/상세는 서버 컴포넌트에서
  서비스 함수를 직접 호출하고, 상태 변경·메모 추가만 클라이언트 컴포넌트에서 API를 호출한다.

## 다음 단계 — 실사용 전 최종 체크리스트

- [ ] **`prompts/pricing.ts` 실제 단가로 교체 (배포 전 필수)**
- [ ] **배포 후 담당자 계정의 `Profile.isAdmin`을 `true`로 지정 (배포 전 필수)**
- [ ] 실제 Supabase 프로젝트 연결 및 마이그레이션 적용 (`npx prisma migrate dev`)
- [ ] Supabase Storage `space-photos`, `design-images` 버킷 생성 + RLS 정책 적용
- [ ] Gemini API 키 발급 및 등록
- [ ] Google/Kakao OAuth 앱 등록, 네이버 개발자센터 앱 등록
- [ ] 도메인/GA/Clarity/Search Console 연결
- [ ] `node_modules` 재설치 (`npm install`) 및 `npx prisma generate` — 실제 배포 환경에서 실행
