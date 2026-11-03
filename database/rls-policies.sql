-- ============================================================
-- RLS (Row Level Security) 활성화 및 정책 설정
-- DesignFOBEE AI OS — 2026-11-03
--
-- 적용 원칙 (§0-2 원칙 6):
--   • 서비스 롤 키(Prisma 백엔드)는 RLS를 자동 우회 → 기존 API 영향 없음
--   • anon / authenticated 역할만 아래 정책 적용
--   • 되돌릴 수 없는 삭제 없음 — 정책 추가만
-- ============================================================

-- ----------------------------------------------------------------
-- 헬퍼 함수: 현재 인증 사용자가 admin인지 확인
-- SECURITY DEFINER → postgres 권한으로 실행, profiles RLS 우회 가능
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT "isAdmin" FROM "profiles" WHERE id = auth.uid()::text LIMIT 1),
    false
  );
$$;

-- ================================================================
-- 1. profiles
--    • 본인 읽기/수정, 관리자 전체 읽기
-- ================================================================
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON "profiles" FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "profiles_select_admin"
  ON "profiles" FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles_update_own"
  ON "profiles" FOR UPDATE
  USING (id = auth.uid()::text);

-- ================================================================
-- 2. projects
--    • 본인 CRUD, 관리자 전체 읽기
-- ================================================================
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own"
  ON "projects" FOR SELECT
  USING ("profileId" = auth.uid()::text);

CREATE POLICY "projects_select_admin"
  ON "projects" FOR SELECT
  USING (public.is_admin());

CREATE POLICY "projects_insert_own"
  ON "projects" FOR INSERT
  WITH CHECK ("profileId" = auth.uid()::text);

CREATE POLICY "projects_update_own"
  ON "projects" FOR UPDATE
  USING ("profileId" = auth.uid()::text);

CREATE POLICY "projects_delete_own"
  ON "projects" FOR DELETE
  USING ("profileId" = auth.uid()::text);

-- ================================================================
-- 3. space_photos
--    • 본인 프로젝트 소속 사진만 접근
-- ================================================================
ALTER TABLE "space_photos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_photos_select_own"
  ON "space_photos" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects"."id" = "space_photos"."projectId"
        AND "projects"."profileId" = auth.uid()::text
    )
  );

CREATE POLICY "space_photos_select_admin"
  ON "space_photos" FOR SELECT
  USING (public.is_admin());

CREATE POLICY "space_photos_insert_own"
  ON "space_photos" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects"."id" = "space_photos"."projectId"
        AND "projects"."profileId" = auth.uid()::text
    )
  );

CREATE POLICY "space_photos_delete_own"
  ON "space_photos" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects"."id" = "space_photos"."projectId"
        AND "projects"."profileId" = auth.uid()::text
    )
  );

-- ================================================================
-- 4. design_generations
--    • 본인 읽기/생성, 관리자 전체 읽기
-- ================================================================
ALTER TABLE "design_generations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_generations_select_own"
  ON "design_generations" FOR SELECT
  USING ("profileId" = auth.uid()::text);

CREATE POLICY "design_generations_select_admin"
  ON "design_generations" FOR SELECT
  USING (public.is_admin());

CREATE POLICY "design_generations_insert_own"
  ON "design_generations" FOR INSERT
  WITH CHECK ("profileId" = auth.uid()::text);

-- ================================================================
-- 5. design_images
--    • 본인 프로젝트 소속 이미지만 접근
-- ================================================================
ALTER TABLE "design_images" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_images_select_own"
  ON "design_images" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects"."id" = "design_images"."projectId"
        AND "projects"."profileId" = auth.uid()::text
    )
  );

CREATE POLICY "design_images_select_admin"
  ON "design_images" FOR SELECT
  USING (public.is_admin());

-- ================================================================
-- 6. estimates
--    • 본인 디자인 이미지에 연결된 견적만 접근
-- ================================================================
ALTER TABLE "estimates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estimates_select_own"
  ON "estimates" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "design_images"
      JOIN "projects" ON "projects"."id" = "design_images"."projectId"
      WHERE "design_images"."id" = "estimates"."designImageId"
        AND "projects"."profileId" = auth.uid()::text
    )
  );

CREATE POLICY "estimates_select_admin"
  ON "estimates" FOR SELECT
  USING (public.is_admin());

-- ================================================================
-- 7. leads
--    • 비인증 INSERT 허용 (문의 폼, §0-5 공개 접수)
--    • 읽기: 관리자 또는 본인(회원가입 후 내 문의 조회)
--    • 수정·삭제: 관리자만
-- ================================================================
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_insert_public"
  ON "leads" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "leads_select_admin"
  ON "leads" FOR SELECT
  USING (public.is_admin());

CREATE POLICY "leads_select_own"
  ON "leads" FOR SELECT
  USING ("profileId" = auth.uid()::text);

CREATE POLICY "leads_update_admin"
  ON "leads" FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "leads_delete_admin"
  ON "leads" FOR DELETE
  USING (public.is_admin());

-- ================================================================
-- 8. lead_notes — 관리자 전용
-- ================================================================
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_notes_all_admin"
  ON "lead_notes" FOR ALL
  USING (public.is_admin());

-- ================================================================
-- 9. public_generations
--    • 비인증 INSERT 허용 (공개 AI 스튜디오 사용 로그)
--    • 읽기: 관리자만
-- ================================================================
ALTER TABLE "public_generations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_generations_insert_public"
  ON "public_generations" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_generations_select_admin"
  ON "public_generations" FOR SELECT
  USING (public.is_admin());

-- ================================================================
-- 10–16. AI Search 테이블 — 관리자 전용
-- ================================================================
ALTER TABLE "ai_search_businesses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_search_businesses_admin"
  ON "ai_search_businesses" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_search_question_snapshots" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_search_question_snapshots_admin"
  ON "ai_search_question_snapshots" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_search_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_search_runs_admin"
  ON "ai_search_runs" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_search_results" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_search_results_admin"
  ON "ai_search_results" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_improvement_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_improvement_tasks_admin"
  ON "ai_improvement_tasks" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_content_drafts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_content_drafts_admin"
  ON "ai_content_drafts" FOR ALL
  USING (public.is_admin());

ALTER TABLE "ai_monthly_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_monthly_reports_admin"
  ON "ai_monthly_reports" FOR ALL
  USING (public.is_admin());
