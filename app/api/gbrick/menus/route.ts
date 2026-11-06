import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_MENU_CATEGORIES, MOCK_MENUS, MOCK_MENU_OPTIONS, IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

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

    const categories = await prisma.gbMenuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        menus: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
            ...(storeId
              ? {
                  storeAvailability: {
                    where: { storeId },
                  },
                }
              : {}),
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[GET /api/gbrick/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
