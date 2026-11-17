export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createMenu } from "@/lib/gbrick/repositories/supabase";
import { cleanName, cleanPrice } from "@/lib/gbrick/menuInput";

// POST /api/gbrick/admin/menus — 카테고리 맨 뒤에 메뉴 추가
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { categoryId?: unknown; name?: unknown; basePrice?: unknown };
    const name = cleanName(body.name);
    const basePrice = cleanPrice(body.basePrice);
    if (typeof body.categoryId !== "string" || !body.categoryId || name === null || basePrice === null) {
      return NextResponse.json({ error: "메뉴명·가격을 확인해 주세요" }, { status: 400 });
    }
    return NextResponse.json({ menu: await createMenu(body.categoryId, name, basePrice) });
  } catch (err) {
    console.error("[POST /api/gbrick/admin/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
