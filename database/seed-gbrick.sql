-- ============================================================
-- GBRICK Coffee MVP 시드 데이터
-- gbrick-app-dev (rzgrkrffksqdeztzxyrt) 전용
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1. 메뉴 카테고리
INSERT INTO "gb_menu_categories" ("id", "name", "nameEn", "sortOrder", "isActive", "updatedAt")
VALUES
  ('cat-sig-001', '시그니처', 'Signature', 1, true, NOW()),
  ('cat-esp-002', '에스프레소', 'Espresso', 2, true, NOW()),
  ('cat-non-003', '논커피', 'Non Coffee', 3, true, NOW()),
  ('cat-sea-004', '계절 한정', 'Seasonal', 4, true, NOW()),
  ('cat-fod-005', '푸드', 'Food', 5, true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 2. 매장
INSERT INTO "gb_stores" (
  "id", "code", "name", "brandName", "status",
  "phone", "address", "lat", "lng",
  "pointRate", "stampPerOrder", "stampGoal",
  "operatingHours", "updatedAt"
)
VALUES
  ('store-001', 'GBR-001', '지브릭커피 신촌점', 'GBRICK Coffee', 'ACTIVE',
   '02-517-1474', '서울 서대문구 신촌로 123', 37.5596, 126.9377,
   0.03, 1, 10, '{}', NOW()),
  ('store-002', 'GBR-002', '지브릭커피 홍대점', 'GBRICK Coffee', 'ACTIVE',
   '02-333-5678', '서울 마포구 와우산로 94', 37.5519, 126.9237,
   0.03, 1, 10, '{}', NOW()),
  ('store-003', 'GBR-003', '지브릭커피 이태원점', 'GBRICK Coffee', 'ACTIVE',
   '02-794-9012', '서울 용산구 이태원로 180', 37.5345, 126.9941,
   0.03, 1, 10, '{}', NOW()),
  ('store-004', 'GBR-004', '지브릭커피 강남점', 'GBRICK Coffee', 'PENDING',
   '02-555-3456', '서울 강남구 테헤란로 152', 37.4979, 127.0276,
   0.03, 1, 10, '{}', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3. 메뉴
INSERT INTO "gb_menus" (
  "id", "categoryId", "name", "nameEn", "description",
  "basePrice", "isSignature", "isNew", "isSoldOut", "isActive",
  "allergens", "tags", "sortOrder", "updatedAt"
)
VALUES
  ('menu-001', 'cat-sig-001', '지브릭 라떼', 'GBRICK Latte',
   '스페셜티 원두로 만든 지브릭만의 시그니처 라떼',
   6500, true, false, false, true, ARRAY[]::TEXT[], ARRAY['시그니처','라떼']::TEXT[], 1, NOW()),
  ('menu-002', 'cat-esp-002', '아메리카노', 'Americano',
   '스페셜티 원두의 깔끔한 아메리카노',
   4500, false, false, false, true, ARRAY[]::TEXT[], ARRAY['커피']::TEXT[], 2, NOW()),
  ('menu-003', 'cat-non-003', '수제 자몽티', 'Homemade Grapefruit Tea',
   '직접 담근 수제 자몽청으로 만든 자몽티',
   6000, true, false, false, true, ARRAY[]::TEXT[], ARRAY['논커피','수제']::TEXT[], 3, NOW()),
  ('menu-004', 'cat-sea-004', '수제 팥빙수', 'Homemade Red Bean Shaved Ice',
   '직접 만든 수제 팥앙금을 올린 팥빙수',
   9000, true, false, false, true, ARRAY[]::TEXT[], ARRAY['계절','디저트']::TEXT[], 4, NOW()),
  ('menu-005', 'cat-sig-001', '바닐라 라떼', 'Vanilla Latte',
   '부드러운 바닐라향과 에스프레소의 조화',
   6000, false, true, false, true, ARRAY[]::TEXT[], ARRAY['라떼','신메뉴']::TEXT[], 5, NOW()),
  ('menu-006', 'cat-fod-005', '버터 크루아상', 'Butter Croissant',
   '매일 아침 직접 굽는 버터 크루아상',
   3500, false, false, false, true, ARRAY['글루텐','유제품']::TEXT[], ARRAY['베이커리']::TEXT[], 6, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 4. 메뉴 옵션 (아메리카노 사이즈)
INSERT INTO "gb_menu_options" (
  "id", "menuId", "name", "extraPrice", "isDefault",
  "isRequired", "groupName", "sortOrder", "isActive", "updatedAt"
)
VALUES
  ('opt-001', 'menu-002', '레귤러', 0, true, true, '사이즈', 1, true, NOW()),
  ('opt-002', 'menu-002', '라지', 500, false, true, '사이즈', 2, true, NOW()),
  ('opt-003', 'menu-001', '뜨겁게', 0, true, true, '온도', 1, true, NOW()),
  ('opt-004', 'menu-001', '아이스', 0, false, true, '온도', 2, true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 5. 웰컴 쿠폰
INSERT INTO "gb_coupons" (
  "id", "code", "name", "type", "status",
  "discountRate", "minOrderAmount", "maxDiscount",
  "perCustomerLimit", "usedCount",
  "validFrom", "validUntil",
  "description", "updatedAt"
)
VALUES (
  'coupon-001', 'WELCOME10', '웰컴 쿠폰 10%', 'DISCOUNT_RATE', 'ACTIVE',
  0.1, 5000, 2000,
  1, 0,
  NOW(), NOW() + INTERVAL '1 year',
  '첫 주문 10% 할인 (최대 2,000원)', NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- 6. 체크리스트 (신촌점, 홍대점, 이태원점)
INSERT INTO "gb_checklists" (
  "id", "storeId", "title", "category", "isActive", "updatedAt"
)
VALUES
  ('cl-001', 'store-001', '매장 청소 및 위생 점검', 'OPENING', true, NOW()),
  ('cl-002', 'store-001', '재료 재고 확인', 'INVENTORY', true, NOW()),
  ('cl-003', 'store-001', '에스프레소 머신·그라인더 점검', 'OPENING', true, NOW()),
  ('cl-004', 'store-001', '냉장·냉동 온도 확인', 'SAFETY', true, NOW()),
  ('cl-005', 'store-001', '마감 청소', 'CLOSING', true, NOW()),
  ('cl-006', 'store-001', '문 잠금 확인', 'CLOSING', true, NOW()),
  ('cl-007', 'store-002', '매장 청소 및 위생 점검', 'OPENING', true, NOW()),
  ('cl-008', 'store-002', '재료 재고 확인', 'INVENTORY', true, NOW()),
  ('cl-009', 'store-002', '에스프레소 머신·그라인더 점검', 'OPENING', true, NOW()),
  ('cl-010', 'store-002', '냉장·냉동 온도 확인', 'SAFETY', true, NOW()),
  ('cl-011', 'store-002', '마감 청소', 'CLOSING', true, NOW()),
  ('cl-012', 'store-002', '문 잠금 확인', 'CLOSING', true, NOW()),
  ('cl-013', 'store-003', '매장 청소 및 위생 점검', 'OPENING', true, NOW()),
  ('cl-014', 'store-003', '재료 재고 확인', 'INVENTORY', true, NOW()),
  ('cl-015', 'store-003', '에스프레소 머신·그라인더 점검', 'OPENING', true, NOW()),
  ('cl-016', 'store-003', '냉장·냉동 온도 확인', 'SAFETY', true, NOW()),
  ('cl-017', 'store-003', '마감 청소', 'CLOSING', true, NOW()),
  ('cl-018', 'store-003', '문 잠금 확인', 'CLOSING', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 7. 공지사항
INSERT INTO "gb_store_notices" (
  "id", "storeId", "title", "content", "isGlobal",
  "isActive", "publishedAt", "updatedAt"
)
VALUES
  ('notice-001', NULL, '[전체] GBRICK APP 오픈 안내',
   'GBRICK Coffee 앱이 오픈되었습니다. 앱으로 주문하시면 포인트 3% 적립!',
   true, true, NOW(), NOW()),
  ('notice-002', 'store-001', '[신촌점] 오늘의 추천 메뉴',
   '오늘의 추천 메뉴: 지브릭 라떼 + 버터 크루아상 세트 9,000원',
   false, true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 완료 확인
SELECT
  (SELECT COUNT(*) FROM "gb_menu_categories") AS 카테고리,
  (SELECT COUNT(*) FROM "gb_stores") AS 매장,
  (SELECT COUNT(*) FROM "gb_menus") AS 메뉴,
  (SELECT COUNT(*) FROM "gb_menu_options") AS 옵션,
  (SELECT COUNT(*) FROM "gb_coupons") AS 쿠폰,
  (SELECT COUNT(*) FROM "gb_checklists") AS 체크리스트,
  (SELECT COUNT(*) FROM "gb_store_notices") AS 공지사항;
