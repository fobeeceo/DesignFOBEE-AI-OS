-- GBRICK Coffee 주문 옵션 저장 수정
-- gbrick-app-dev (rzgrkrffksqdeztzxyrt) 전용 — Supabase SQL Editor에서 실행하세요
--
-- gb_order_item_options."menuOptionId" 가 필수(NOT NULL)라서, 메뉴에 등록되지 않은
-- 기본 옵션(따뜻하게·아이스·시럽 등)을 고른 주문은 옵션이 한 건도 저장되지 않았다.
-- 옵션명·가격은 같은 행에 글자로 보존하므로 이 칸은 비어 있어도 된다.

ALTER TABLE public.gb_order_item_options ALTER COLUMN "menuOptionId" DROP NOT NULL;
