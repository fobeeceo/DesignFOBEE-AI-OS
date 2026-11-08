export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { MOCK_MENU_CATEGORIES, MOCK_MENUS, MOCK_MENU_OPTIONS } from "@/lib/gbrick/mockData";
import { sbMenuRepo } from "@/lib/gbrick/repositories/supabase";

function buildMockCategories() {
  const menusWithOptions = MOCK_MENUS.map((m) => ({
    ...m,
    options: MOCK_MENU_OPTIONS.filter((o) => o.menuId === m.id),
  }));
  return MOCK_MENU_CATEGORIES.map((c) => ({
    ...c,
    menus: menusWithOptions.filter((m) => m.categoryId === c.id),
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") ?? undefined;

  // Supabase 항상 먼저 시도 (IS_MOCK_MODE 무관) — 실패 시 mock 폴백
  try {
    const categories = await sbMenuRepo.findCategories(storeId);
    if (categories && categories.length > 0) {
      return NextResponse.json({ categories }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }
    // Supabase에 카테고리가 없으면 mock 반환
    return NextResponse.json({ categories: buildMockCategories(), mock: true, reason: "empty" }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[GET /api/gbrick/menus] Supabase 실패, mock 폴백:", err);
    return NextResponse.json({ categories: buildMockCategories(), mock: true, reason: String(err) }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}
