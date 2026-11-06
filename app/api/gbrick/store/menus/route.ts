export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { IS_MOCK_MODE, MOCK_MENUS } from "@/lib/gbrick/mockData";

// GET: 매장 메뉴 품절 현황
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId 필요" }, { status: 400 });

    if (IS_MOCK_MODE) {
      const menus = MOCK_MENUS.map((m) => ({
        menuId: m.id,
        name: m.name,
        basePrice: m.basePrice,
        isSoldOut: m.isSoldOut ?? false,
        category: m.categoryId,
      }));
      return NextResponse.json({ menus, mock: true });
    }

    const availabilities = await prisma.gbStoreMenuAvailability.findMany({
      where: { storeId },
      select: { menuId: true, isSoldOut: true },
    });
    const availMap = new Map(availabilities.map((a) => [a.menuId, a.isSoldOut]));

    const allMenus = await prisma.gbMenu.findMany({
      where: { isActive: true },
      select: { id: true, name: true, basePrice: true, categoryId: true, isSoldOut: true, category: { select: { name: true } } },
      orderBy: { sortOrder: "asc" },
    });

    const menus = allMenus.map((m) => ({
      menuId: m.id,
      name: m.name,
      basePrice: m.basePrice,
      isSoldOut: availMap.has(m.id) ? availMap.get(m.id) : m.isSoldOut,
      category: m.category?.name ?? "",
    }));

    return NextResponse.json({ menus });
  } catch (err) {
    console.error("[GET /api/gbrick/store/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH: 품절 토글
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const { storeId, menuId, isSoldOut } = body;
    if (!storeId || !menuId || isSoldOut === undefined) {
      return NextResponse.json({ error: "storeId, menuId, isSoldOut 필요" }, { status: 400 });
    }

    if (IS_MOCK_MODE) {
      return NextResponse.json({ updated: true, mock: true });
    }

    await prisma.gbStoreMenuAvailability.upsert({
      where: { storeId_menuId: { storeId, menuId } },
      create: { storeId, menuId, isSoldOut },
      update: { isSoldOut },
    });

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/store/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
