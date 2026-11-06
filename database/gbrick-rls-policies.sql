-- ============================================================
-- GBRICK Coffee MVP — RLS (Row Level Security) 정책
-- gbrick-app-dev 프로젝트 전용 (rzgrkrffksqdeztzxyrt)
-- 2026-11-07
--
-- 보안 원칙:
--   • Service Role Key(서버 API) → RLS 자동 우회 (기존 그대로)
--   • anon / authenticated 직접 접근 차단
--   • 모든 데이터는 서버 API(service role)를 통해서만 접근
-- ============================================================

-- gb_stores
ALTER TABLE "gb_stores" ENABLE ROW LEVEL SECURITY;

-- gb_store_users
ALTER TABLE "gb_store_users" ENABLE ROW LEVEL SECURITY;

-- gb_customers
ALTER TABLE "gb_customers" ENABLE ROW LEVEL SECURITY;

-- gb_customer_consents
ALTER TABLE "gb_customer_consents" ENABLE ROW LEVEL SECURITY;

-- gb_menu_categories
ALTER TABLE "gb_menu_categories" ENABLE ROW LEVEL SECURITY;

-- gb_menus
ALTER TABLE "gb_menus" ENABLE ROW LEVEL SECURITY;

-- gb_menu_options
ALTER TABLE "gb_menu_options" ENABLE ROW LEVEL SECURITY;

-- gb_store_menu_availability
ALTER TABLE "gb_store_menu_availability" ENABLE ROW LEVEL SECURITY;

-- gb_menu_price_history
ALTER TABLE "gb_menu_price_history" ENABLE ROW LEVEL SECURITY;

-- gb_recipe_versions
ALTER TABLE "gb_recipe_versions" ENABLE ROW LEVEL SECURITY;

-- gb_orders
ALTER TABLE "gb_orders" ENABLE ROW LEVEL SECURITY;

-- gb_order_items
ALTER TABLE "gb_order_items" ENABLE ROW LEVEL SECURITY;

-- gb_order_item_options
ALTER TABLE "gb_order_item_options" ENABLE ROW LEVEL SECURITY;

-- gb_order_status_history
ALTER TABLE "gb_order_status_history" ENABLE ROW LEVEL SECURITY;

-- gb_payments
ALTER TABLE "gb_payments" ENABLE ROW LEVEL SECURITY;

-- gb_payment_transactions
ALTER TABLE "gb_payment_transactions" ENABLE ROW LEVEL SECURITY;

-- gb_refunds
ALTER TABLE "gb_refunds" ENABLE ROW LEVEL SECURITY;

-- gb_payment_webhook_events
ALTER TABLE "gb_payment_webhook_events" ENABLE ROW LEVEL SECURITY;

-- gb_point_accounts
ALTER TABLE "gb_point_accounts" ENABLE ROW LEVEL SECURITY;

-- gb_point_ledger
ALTER TABLE "gb_point_ledger" ENABLE ROW LEVEL SECURITY;

-- gb_coupons
ALTER TABLE "gb_coupons" ENABLE ROW LEVEL SECURITY;

-- gb_coupon_issues
ALTER TABLE "gb_coupon_issues" ENABLE ROW LEVEL SECURITY;

-- gb_coupon_redemptions
ALTER TABLE "gb_coupon_redemptions" ENABLE ROW LEVEL SECURITY;

-- gb_stamp_accounts
ALTER TABLE "gb_stamp_accounts" ENABLE ROW LEVEL SECURITY;

-- gb_stamp_ledger
ALTER TABLE "gb_stamp_ledger" ENABLE ROW LEVEL SECURITY;

-- gb_checklists
ALTER TABLE "gb_checklists" ENABLE ROW LEVEL SECURITY;

-- gb_checklist_items
ALTER TABLE "gb_checklist_items" ENABLE ROW LEVEL SECURITY;

-- gb_checklist_completions
ALTER TABLE "gb_checklist_completions" ENABLE ROW LEVEL SECURITY;

-- gb_store_notices
ALTER TABLE "gb_store_notices" ENABLE ROW LEVEL SECURITY;

-- gb_store_inquiries
ALTER TABLE "gb_store_inquiries" ENABLE ROW LEVEL SECURITY;

-- gb_maintenance_requests
ALTER TABLE "gb_maintenance_requests" ENABLE ROW LEVEL SECURITY;

-- gb_campaigns
ALTER TABLE "gb_campaigns" ENABLE ROW LEVEL SECURITY;

-- gb_campaign_targets
ALTER TABLE "gb_campaign_targets" ENABLE ROW LEVEL SECURITY;

-- gb_push_notifications
ALTER TABLE "gb_push_notifications" ENABLE ROW LEVEL SECURITY;

-- gb_notification_logs
ALTER TABLE "gb_notification_logs" ENABLE ROW LEVEL SECURITY;

-- gb_data_sync_jobs
ALTER TABLE "gb_data_sync_jobs" ENABLE ROW LEVEL SECURITY;

-- gb_audit_logs
ALTER TABLE "gb_audit_logs" ENABLE ROW LEVEL SECURITY;

-- gb_idempotency_keys
ALTER TABLE "gb_idempotency_keys" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 참고: 위 설정으로 anon/authenticated 직접 접근이 차단됩니다.
-- 서버 API는 SUPABASE_SERVICE_ROLE_KEY를 사용하므로 RLS를 우회합니다.
-- ============================================================
