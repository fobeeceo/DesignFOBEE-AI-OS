-- ============================================================
-- GBRICK Coffee 매장 데이터 교체
-- gbrick-app-dev (rzgrkrffksqdeztzxyrt) 전용
-- Supabase SQL Editor에서 실행
-- ============================================================

-- Step 1. 기존 체크리스트 삭제 (FK 의존)
DELETE FROM "gb_checklists" WHERE "storeId" IN (
  'store-001','store-002','store-003','store-004'
);

-- Step 2. 기존 공지사항 삭제 (store-001 참조분)
DELETE FROM "gb_store_notices" WHERE "storeId" IN (
  'store-001','store-002','store-003','store-004'
);

-- Step 3. 기존 4개 매장 삭제
DELETE FROM "gb_stores" WHERE "id" IN (
  'store-001','store-002','store-003','store-004'
);

-- Step 4. 실제 5개 매장 삽입
INSERT INTO "gb_stores" (
  "id", "code", "name", "brandName", "status",
  "phone", "address", "lat", "lng",
  "pointRate", "stampPerOrder", "stampGoal",
  "operatingHours", "updatedAt"
)
VALUES
  ('store-001', 'GBR-001', 'GBRICK Coffee 은평뉴타운 본점', 'GBRICK Coffee', 'ACTIVE',
   '02-388-0001', '서울특별시 은평구 은평뉴타운로', 37.6245, 126.9195,
   0.03, 1, 10,
   '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}',
   NOW()),

  ('store-002', 'GBR-002', 'GBRICK Coffee 일산 가좌점', 'GBRICK Coffee', 'ACTIVE',
   '031-900-0002', '경기도 고양시 일산서구 가좌동', 37.6587, 126.7398,
   0.03, 1, 10,
   '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}',
   NOW()),

  ('store-003', 'GBR-003', 'GBRICK Coffee 김포 월곶점', 'GBRICK Coffee', 'ACTIVE',
   '031-980-0003', '경기도 김포시 월곶면', 37.6065, 126.6218,
   0.03, 1, 10,
   '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}',
   NOW()),

  ('store-004', 'GBR-004', 'GBRICK Coffee 고양 덕은점', 'GBRICK Coffee', 'ACTIVE',
   '031-900-0004', '경기도 고양시 덕양구 덕은동', 37.6490, 126.8340,
   0.03, 1, 10,
   '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}',
   NOW()),

  ('store-005', 'GBR-005', 'GBRICK Coffee 경기도 인덕원점', 'GBRICK Coffee', 'ACTIVE',
   '031-420-0005', '경기도 안양시 동안구 인덕원동', 37.3895, 126.9607,
   0.03, 1, 10,
   '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}',
   NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "code" = EXCLUDED."code",
  "address" = EXCLUDED."address",
  "lat" = EXCLUDED."lat",
  "lng" = EXCLUDED."lng",
  "phone" = EXCLUDED."phone",
  "operatingHours" = EXCLUDED."operatingHours",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- Step 5. 각 매장 체크리스트 (본점 + 가좌 + 월곶)
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

-- Step 6. 공지사항 복구
INSERT INTO "gb_store_notices" (
  "id", "storeId", "title", "content", "isGlobal",
  "isPinned", "publishedAt", "createdBy", "updatedAt"
)
VALUES
  ('notice-001', NULL, '[전체] GBRICK APP 오픈 안내',
   'GBRICK Coffee 앱이 오픈되었습니다. 앱으로 주문하시면 포인트 3% 적립!',
   true, false, NOW(), 'system', NOW()),
  ('notice-002', 'store-001', '[은평뉴타운 본점] 오늘의 추천 메뉴',
   '오늘의 추천 메뉴: 지브릭 라떼 + 버터 크루아상 세트 9,000원',
   false, false, NOW(), 'system', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 완료 확인
SELECT
  (SELECT COUNT(*) FROM "gb_stores") AS 매장,
  (SELECT name FROM "gb_stores" ORDER BY code LIMIT 1) AS 첫번째매장,
  (SELECT COUNT(*) FROM "gb_checklists") AS 체크리스트,
  (SELECT COUNT(*) FROM "gb_store_notices") AS 공지사항;
