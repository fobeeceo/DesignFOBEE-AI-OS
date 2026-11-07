-- G.BRICK Coffee 스탬프 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.gb_stamps (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId"  TEXT NOT NULL REFERENCES public.gb_customers(id) ON DELETE CASCADE,
  "storeId"     TEXT NOT NULL REFERENCES public.gb_stores(id) ON DELETE CASCADE,
  "orderId"     TEXT,
  count         INTEGER NOT NULL DEFAULT 1,
  "earnedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 고객별 스탬프 합계 조회 뷰
CREATE OR REPLACE VIEW public.gb_stamp_totals AS
SELECT
  "customerId",
  SUM(count) AS total,
  SUM(count) % 10 AS current_progress,
  FLOOR(SUM(count) / 10) AS completed_cards
FROM public.gb_stamps
GROUP BY "customerId";

-- RLS
ALTER TABLE public.gb_stamps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stamps_service_all" ON public.gb_stamps
  USING (true) WITH CHECK (true);

GRANT ALL ON public.gb_stamps TO service_role;
GRANT SELECT ON public.gb_stamp_totals TO service_role;
