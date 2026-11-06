-- GBRICK Coffee MVP: 38 tables migration
-- Auto-generated from Prisma schema

-- CreateEnum
CREATE TYPE "GbStoreStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GbStoreUserRole" AS ENUM ('HQ_SUPER_ADMIN', 'HQ_ADMIN', 'HQ_MANAGER', 'STORE_OWNER', 'STORE_MANAGER', 'STORE_STAFF');

-- CreateEnum
CREATE TYPE "GbOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "GbPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUNDED');

-- CreateEnum
CREATE TYPE "GbPaymentMethod" AS ENUM ('MOCK', 'CARD', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS');

-- CreateEnum
CREATE TYPE "GbPointLedgerType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'REFUND', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "GbCouponType" AS ENUM ('DISCOUNT_AMOUNT', 'DISCOUNT_RATE', 'FREE_ITEM', 'FREE_UPGRADE');

-- CreateEnum
CREATE TYPE "GbCouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GbStampLedgerType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "GbNotificationChannel" AS ENUM ('PUSH', 'SMS', 'EMAIL', 'KAKAO_ALIM');

-- CreateEnum
CREATE TYPE "GbCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GbChecklistCategory" AS ENUM ('OPENING', 'CLOSING', 'CLEANING', 'SAFETY', 'INVENTORY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GbInquiryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "gb_stores" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'GBRICK Coffee',
    "status" "GbStoreStatus" NOT NULL DEFAULT 'PENDING',
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "addressDetail" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "businessNumber" TEXT,
    "ownerName" TEXT,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "pointRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "stampPerOrder" INTEGER NOT NULL DEFAULT 1,
    "stampGoal" INTEGER NOT NULL DEFAULT 10,
    "operatingHours" JSONB,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_store_users" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "GbStoreUserRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_customers" (
    "id" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "birthdate" TEXT,
    "favoriteStoreId" TEXT,
    "marketingAgree" BOOLEAN NOT NULL DEFAULT false,
    "pushAgree" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_customer_consents" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "agreed" BOOLEAN NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_menu_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_menus" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "basePrice" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isSignature" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "calories" INTEGER,
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_menu_options" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "groupName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_store_menu_availability" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_menu_price_history" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_recipe_versions" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "GbOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "finalAmount" INTEGER NOT NULL,
    "pointEarned" INTEGER NOT NULL DEFAULT 0,
    "pointUsed" INTEGER NOT NULL DEFAULT 0,
    "couponId" TEXT,
    "couponDiscount" INTEGER NOT NULL DEFAULT 0,
    "pickupName" TEXT,
    "note" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "menuName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_order_item_options" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "menuOptionId" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "GbOrderStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "GbPaymentMethod" NOT NULL DEFAULT 'MOCK',
    "status" "GbPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "pgProvider" TEXT,
    "pgTransactionId" TEXT,
    "pgPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pgResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "pgRefundId" TEXT,
    "pgPayload" JSONB,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_payment_webhook_events" (
    "id" TEXT NOT NULL,
    "pgProvider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_point_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_point_ledger" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "GbPointLedgerType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GbCouponType" NOT NULL,
    "status" "GbCouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountAmount" INTEGER,
    "discountRate" DOUBLE PRECISION,
    "minOrderAmount" INTEGER,
    "maxDiscount" INTEGER,
    "freeItemMenuId" TEXT,
    "totalLimit" INTEGER,
    "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_coupon_issues" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

-- CreateTable
CREATE TABLE "gb_coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponIssueId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discountApplied" INTEGER NOT NULL,

-- CreateTable
CREATE TABLE "gb_stamp_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_stamp_ledger" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "GbStampLedgerType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_checklists" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "GbChecklistCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_checklist_completions" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "completedBy" TEXT NOT NULL,
    "completedByName" TEXT NOT NULL,
    "itemsChecked" JSONB NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_store_notices" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_store_inquiries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "GbInquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_maintenance_requests" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "GbInquiryStatus" NOT NULL DEFAULT 'OPEN',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "GbCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channels" "GbNotificationChannel"[],
    "targetType" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

-- CreateTable
CREATE TABLE "gb_campaign_targets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "storeId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_push_notifications" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "deepLink" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_notification_logs" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "notificationId" TEXT,
    "channel" "GbNotificationChannel" NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_data_sync_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "storeId" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "errorMsg" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_audit_logs" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- CreateTable
CREATE TABLE "gb_idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

-- CreateIndex
CREATE UNIQUE INDEX "gb_stores_code_key" ON "gb_stores"("code");

-- CreateIndex
CREATE INDEX "gb_stores_status_idx" ON "gb_stores"("status");

-- CreateIndex
CREATE INDEX "gb_store_users_storeId_role_idx" ON "gb_store_users"("storeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "gb_store_users_storeId_id_key" ON "gb_store_users"("storeId", "id");

-- CreateIndex
CREATE INDEX "gb_customers_phone_idx" ON "gb_customers"("phone");

-- CreateIndex
CREATE INDEX "gb_customers_email_idx" ON "gb_customers"("email");

-- CreateIndex
CREATE INDEX "gb_customer_consents_customerId_idx" ON "gb_customer_consents"("customerId");

-- CreateIndex
CREATE INDEX "gb_menu_categories_sortOrder_idx" ON "gb_menu_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "gb_menus_categoryId_isActive_idx" ON "gb_menus"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "gb_menus_isActive_sortOrder_idx" ON "gb_menus"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "gb_menu_options_menuId_idx" ON "gb_menu_options"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_store_menu_availability_storeId_menuId_key" ON "gb_store_menu_availability"("storeId", "menuId");

-- CreateIndex
CREATE INDEX "gb_menu_price_history_menuId_effectiveAt_idx" ON "gb_menu_price_history"("menuId", "effectiveAt");

-- CreateIndex
CREATE INDEX "gb_recipe_versions_menuId_isActive_idx" ON "gb_recipe_versions"("menuId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "gb_orders_orderNumber_key" ON "gb_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "gb_orders_storeId_status_idx" ON "gb_orders"("storeId", "status");

-- CreateIndex
CREATE INDEX "gb_orders_customerId_idx" ON "gb_orders"("customerId");

-- CreateIndex
CREATE INDEX "gb_orders_orderNumber_idx" ON "gb_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "gb_orders_createdAt_idx" ON "gb_orders"("createdAt");

-- CreateIndex
CREATE INDEX "gb_order_items_orderId_idx" ON "gb_order_items"("orderId");

-- CreateIndex
CREATE INDEX "gb_order_item_options_orderItemId_idx" ON "gb_order_item_options"("orderItemId");

-- CreateIndex
CREATE INDEX "gb_order_status_history_orderId_createdAt_idx" ON "gb_order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "gb_payments_orderId_key" ON "gb_payments"("orderId");

-- CreateIndex
CREATE INDEX "gb_payments_status_idx" ON "gb_payments"("status");

-- CreateIndex
CREATE INDEX "gb_payments_pgTransactionId_idx" ON "gb_payments"("pgTransactionId");

-- CreateIndex
CREATE INDEX "gb_payment_transactions_paymentId_idx" ON "gb_payment_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "gb_refunds_paymentId_idx" ON "gb_refunds"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_payment_webhook_events_externalEventId_key" ON "gb_payment_webhook_events"("externalEventId");

-- CreateIndex
CREATE INDEX "gb_payment_webhook_events_pgProvider_eventType_idx" ON "gb_payment_webhook_events"("pgProvider", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "gb_point_accounts_customerId_key" ON "gb_point_accounts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_point_ledger_idempotencyKey_key" ON "gb_point_ledger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "gb_point_ledger_accountId_createdAt_idx" ON "gb_point_ledger"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "gb_point_ledger_orderId_idx" ON "gb_point_ledger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_coupons_code_key" ON "gb_coupons"("code");

-- CreateIndex
CREATE INDEX "gb_coupons_code_idx" ON "gb_coupons"("code");

-- CreateIndex
CREATE INDEX "gb_coupons_status_validUntil_idx" ON "gb_coupons"("status", "validUntil");

-- CreateIndex
CREATE INDEX "gb_coupon_issues_customerId_idx" ON "gb_coupon_issues"("customerId");

-- CreateIndex
CREATE INDEX "gb_coupon_issues_couponId_idx" ON "gb_coupon_issues"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_coupon_redemptions_couponIssueId_key" ON "gb_coupon_redemptions"("couponIssueId");

-- CreateIndex
CREATE INDEX "gb_coupon_redemptions_orderId_idx" ON "gb_coupon_redemptions"("orderId");

-- CreateIndex
CREATE INDEX "gb_stamp_accounts_customerId_idx" ON "gb_stamp_accounts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_stamp_accounts_customerId_storeId_key" ON "gb_stamp_accounts"("customerId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_stamp_ledger_idempotencyKey_key" ON "gb_stamp_ledger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "gb_stamp_ledger_accountId_createdAt_idx" ON "gb_stamp_ledger"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "gb_checklists_storeId_category_idx" ON "gb_checklists"("storeId", "category");

-- CreateIndex
CREATE INDEX "gb_checklist_items_checklistId_idx" ON "gb_checklist_items"("checklistId");

-- CreateIndex
CREATE INDEX "gb_checklist_completions_checklistId_completedAt_idx" ON "gb_checklist_completions"("checklistId", "completedAt");

-- CreateIndex
CREATE INDEX "gb_store_notices_storeId_publishedAt_idx" ON "gb_store_notices"("storeId", "publishedAt");

-- CreateIndex
CREATE INDEX "gb_store_notices_isGlobal_publishedAt_idx" ON "gb_store_notices"("isGlobal", "publishedAt");

-- CreateIndex
CREATE INDEX "gb_store_inquiries_storeId_status_idx" ON "gb_store_inquiries"("storeId", "status");

-- CreateIndex
CREATE INDEX "gb_maintenance_requests_storeId_status_idx" ON "gb_maintenance_requests"("storeId", "status");

-- CreateIndex
CREATE INDEX "gb_campaigns_status_idx" ON "gb_campaigns"("status");

-- CreateIndex
CREATE INDEX "gb_campaign_targets_campaignId_idx" ON "gb_campaign_targets"("campaignId");

-- CreateIndex
CREATE INDEX "gb_push_notifications_campaignId_idx" ON "gb_push_notifications"("campaignId");

-- CreateIndex
CREATE INDEX "gb_notification_logs_customerId_idx" ON "gb_notification_logs"("customerId");

-- CreateIndex
CREATE INDEX "gb_notification_logs_notificationId_idx" ON "gb_notification_logs"("notificationId");

-- CreateIndex
CREATE INDEX "gb_data_sync_jobs_jobType_status_idx" ON "gb_data_sync_jobs"("jobType", "status");

-- CreateIndex
CREATE INDEX "gb_audit_logs_storeId_createdAt_idx" ON "gb_audit_logs"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "gb_audit_logs_actorId_idx" ON "gb_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "gb_audit_logs_resource_resourceId_idx" ON "gb_audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "gb_idempotency_keys_key_key" ON "gb_idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "gb_idempotency_keys_expiresAt_idx" ON "gb_idempotency_keys"("expiresAt");

-- AddForeignKey
ALTER TABLE "gb_store_users" ADD CONSTRAINT "gb_store_users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_customers" ADD CONSTRAINT "gb_customers_favoriteStoreId_fkey" FOREIGN KEY ("favoriteStoreId") REFERENCES "gb_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_customer_consents" ADD CONSTRAINT "gb_customer_consents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_menus" ADD CONSTRAINT "gb_menus_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "gb_menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_menu_options" ADD CONSTRAINT "gb_menu_options_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "gb_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_store_menu_availability" ADD CONSTRAINT "gb_store_menu_availability_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_store_menu_availability" ADD CONSTRAINT "gb_store_menu_availability_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "gb_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_menu_price_history" ADD CONSTRAINT "gb_menu_price_history_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "gb_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_recipe_versions" ADD CONSTRAINT "gb_recipe_versions_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "gb_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_orders" ADD CONSTRAINT "gb_orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_orders" ADD CONSTRAINT "gb_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_order_items" ADD CONSTRAINT "gb_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "gb_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_order_items" ADD CONSTRAINT "gb_order_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "gb_menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_order_item_options" ADD CONSTRAINT "gb_order_item_options_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "gb_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_order_item_options" ADD CONSTRAINT "gb_order_item_options_menuOptionId_fkey" FOREIGN KEY ("menuOptionId") REFERENCES "gb_menu_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_order_status_history" ADD CONSTRAINT "gb_order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "gb_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_payments" ADD CONSTRAINT "gb_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "gb_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_payment_transactions" ADD CONSTRAINT "gb_payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "gb_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_refunds" ADD CONSTRAINT "gb_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "gb_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_point_accounts" ADD CONSTRAINT "gb_point_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_point_ledger" ADD CONSTRAINT "gb_point_ledger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "gb_point_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_point_ledger" ADD CONSTRAINT "gb_point_ledger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "gb_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_coupon_issues" ADD CONSTRAINT "gb_coupon_issues_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "gb_coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_coupon_issues" ADD CONSTRAINT "gb_coupon_issues_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_coupon_redemptions" ADD CONSTRAINT "gb_coupon_redemptions_couponIssueId_fkey" FOREIGN KEY ("couponIssueId") REFERENCES "gb_coupon_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_stamp_accounts" ADD CONSTRAINT "gb_stamp_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_stamp_ledger" ADD CONSTRAINT "gb_stamp_ledger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "gb_stamp_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_stamp_ledger" ADD CONSTRAINT "gb_stamp_ledger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "gb_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_checklists" ADD CONSTRAINT "gb_checklists_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_checklist_items" ADD CONSTRAINT "gb_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "gb_checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_checklist_completions" ADD CONSTRAINT "gb_checklist_completions_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "gb_checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_store_notices" ADD CONSTRAINT "gb_store_notices_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_store_inquiries" ADD CONSTRAINT "gb_store_inquiries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_maintenance_requests" ADD CONSTRAINT "gb_maintenance_requests_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_campaign_targets" ADD CONSTRAINT "gb_campaign_targets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "gb_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_campaign_targets" ADD CONSTRAINT "gb_campaign_targets_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_push_notifications" ADD CONSTRAINT "gb_push_notifications_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "gb_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_notification_logs" ADD CONSTRAINT "gb_notification_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "gb_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_notification_logs" ADD CONSTRAINT "gb_notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "gb_push_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gb_audit_logs" ADD CONSTRAINT "gb_audit_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "gb_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
