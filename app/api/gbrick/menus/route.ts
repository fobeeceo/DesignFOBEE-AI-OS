export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { menuRepo } from "@/lib/gbrick/repositories";
import { MOCK_MENU_CATEGORIES, MOCK_MENUS, MOCK_MENU_OPTIONS, IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") ?? undefined;

    if (IS_MOCK_MODE) {
      const menusWithOptions = MOCK_MENUS.map((m) => ({
        ...m,
        options: MOCK_MENU_OPTIONS.filter((o) => o.menuId === m.id),
      }));
      const categoriesWithMenus = MOCK_MENU_CATEGORIES.map((c) => ({
        ...c,
        menus: menusWithOptions.filter((m) => m.categoryId === c.id),
      }));
      return NextResponse.json({ categories: categoriesWithMenus, mock: true });
    }

    const categories = await menuRepo.findCategories(storeId);
    const isDebug = searchParams.get("debug") === "1";
    return NextResponse.json({
      categories,
      ...(isDebug ? {
        _debug: (categories as unknown as Record<string, unknown>[]).map((c) => ({
          catId: c.id,
          catName: c.name,
          menuCount: Array.isArray(c.menus) ? (c.menus as unknown[]).length : 0,
        }))
      } : {}),
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[GET /api/gbrick/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
