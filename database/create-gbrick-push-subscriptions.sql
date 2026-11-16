-- GBRICK Coffee 주문 알림(웹 푸시) 구독 테이블
-- gbrick-app-dev (rzgrkrffksqdeztzxyrt) 전용 — Supabase SQL Editor에서 실행하세요
-- 고객 폰이 "픽업 알림 받기"를 누르면 그 폰의 알림 주소를 주문과 함께 저장한다.

CREATE TABLE IF NOT EXISTS public.gb_push_subscriptions (
  id          TEXT PRIMARY KEY,
  "orderId"   TEXT NOT NULL REFERENCES public.gb_orders(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("orderId", endpoint)
);

-- 다른 gb_ 테이블과 같은 원칙: 서버 API(service role)만 접근, anon 직접 접근 차단
ALTER TABLE public.gb_push_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.gb_push_subscriptions TO service_role;
