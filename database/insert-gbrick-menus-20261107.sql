-- G.BRICK COFFEE 메뉴 일괄 등록 (2026-11-07)
-- 엑셀 가격표 기준: HOT/ICE 가격 포함
-- 실행 완료: 2026-11-07 Supabase REST API로 등록됨
-- 카테고리: 에스프레소(15개), 더치/콜드브루(17개 신규), 논커피(23개), 계절한정(2개)
-- 옵션: HOT/ICE 온도 선택 추가

-- 신규 카테고리
INSERT INTO gb_menu_categories (id, name, "sortOrder", "isActive", "updatedAt")
VALUES ('cat-dutch-006', '더치/콜드브루', 6, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- [에스프레소] esp-01 ~ esp-15
-- [더치/콜드브루] dutch-01 ~ dutch-17
-- [논커피] non-01 ~ non-23
-- [계절한정] sea-01 ~ sea-02
-- (전체 INSERT 문은 scripts/insert_gbrick_menus.py 참고)
