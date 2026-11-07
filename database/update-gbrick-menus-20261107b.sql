-- G.BRICK COFFEE 메뉴판 → DB 동기화 (2026-11-07 메뉴판 사진 기준)
-- 실행 완료 (Python 스크립트 via REST API)

-- 1. 가격 수정 (메뉴판 실물 기준으로 정정)
-- dutch-12: 요거트 플레인 라씨 6500 → 6000
-- dutch-13: 딸기 라씨            7500 → 6500
-- dutch-14: 망고 라씨            7500 → 6500
-- dutch-15: 블루베리 라씨        7500 → 6500
-- non-13:   뱅쇼 (동절기)        7800 → 6800
-- non-18:   운남성 보이차         8000 → 7000

UPDATE public.gb_menus SET "basePrice"=6000, "updatedAt"=NOW() WHERE id='dutch-12';
UPDATE public.gb_menus SET "basePrice"=6500, "updatedAt"=NOW() WHERE id='dutch-13';
UPDATE public.gb_menus SET "basePrice"=6500, "updatedAt"=NOW() WHERE id='dutch-14';
UPDATE public.gb_menus SET "basePrice"=6500, "updatedAt"=NOW() WHERE id='dutch-15';
UPDATE public.gb_menus SET "basePrice"=6800, "updatedAt"=NOW() WHERE id='non-13';
UPDATE public.gb_menus SET "basePrice"=7000, "updatedAt"=NOW() WHERE id='non-18';

-- 2. 이름 수정
UPDATE public.gb_menus SET name='골드슈가 에스프레소', "nameEn"='Gold Sugar Espresso', "updatedAt"=NOW() WHERE id='esp-05';

-- 3. 신규 메뉴 추가
INSERT INTO public.gb_menus (id,"categoryId",name,"nameEn","basePrice","sortOrder",tags,"isActive","isSoldOut","isNew","isSignature",allergens,"updatedAt")
VALUES
  ('non-24','cat-non-003','딸기 주스','Strawberry Juice',6000,24,'{"주스"}',true,false,false,false,'{}',NOW()),
  ('dutch-18','cat-dutch-006','민트초코 프라페','Mint Choco Frappe',6500,18,'{"프라페"}',true,false,false,false,'{}',NOW())
ON CONFLICT (id) DO NOTHING;
