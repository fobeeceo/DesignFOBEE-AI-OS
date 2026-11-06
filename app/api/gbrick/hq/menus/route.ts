import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE, MOCK_MENUS, MOCK_MENU_CATEGORIES, MOCK_MENU_OPTIONS } from "@/lib/gbrick/mockData";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({ categories: MOCK_MENU_CATEGORIES, menus: MOCK_MENUS, options: MOCK_MENU_OPTIONS, mock: true });
    }

    const [categories, menus] = await Promise.all([
      prisma.gbMenuCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.gbMenu.findMany({ include: { options: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ categories, menus });
  } catch (err) {
    console.error("[GET /api/gbrick/hq/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, name, nameEn, description, basePrice, isSignature = false, isNew = false } = body;

    if (!categoryId || !name || !basePrice) {
      return NextResponse.json({ error: "categoryId, name, basePrice 필수" }, { status: 400 });
    }

    if (IS_MOCK_MODE) {
      const mockMenu = { id: `menu_${Date.now()}`, categoryId, name, nameEn, description, basePrice, isSignature, isNew, isSoldOut: false, tags: [] };
      return NextResponse.json({ menu: mockMenu, mock: true }, { status: 201 });
    }

    const menu = await prisma.gbMenu.create({
      data: { categoryId, name, nameEn, description, basePrice, isSignature, isNew },
    });
    return NextResponse.json({ menu }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/hq/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
