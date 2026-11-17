export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbMenuRepo, sbStoreRepo } from "@/lib/gbrick/repositories/supabase";
import { cleanName, cleanPrice, cleanSortOrder } from "@/lib/gbrick/menuInput";

const optionalText = (v: unknown, max: number) => (v === null || (typeof v === "string" && v.length <= max));

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const body = await req.json() as Record<string, unknown>;

    // 받는 칸을 정해 둔다 — 요청에 다른 칸이 섞여 와도 DB에 쓰지 않는다
    const menuData: Parameters<typeof sbMenuRepo.updateMenu>[1] = {};
    const bad = (field: string) => NextResponse.json({ error: `${field} 값이 올바르지 않습니다` }, { status: 400 });

    if ("name" in body) { const v = cleanName(body.name); if (v === null) return bad("메뉴명"); menuData.name = v; }
    if ("basePrice" in body) { const v = cleanPrice(body.basePrice); if (v === null) return bad("가격"); menuData.basePrice = v; }
    if ("sortOrder" in body) { const v = cleanSortOrder(body.sortOrder); if (v === null) return bad("순서"); menuData.sortOrder = v; }
    if ("nameEn" in body) { if (!optionalText(body.nameEn, 100)) return bad("영문명"); menuData.nameEn = body.nameEn as string | null; }
    if ("description" in body) { if (!optionalText(body.description, 500)) return bad("설명"); menuData.description = body.description as string | null; }
    if ("imageUrl" in body) { if (!optionalText(body.imageUrl, 1000)) return bad("사진 주소"); menuData.imageUrl = body.imageUrl as string | null; }
    for (const key of ["isSignature", "isNew", "isActive"] as const) {
      if (key in body) { if (typeof body[key] !== "boolean") return bad(key); menuData[key] = body[key] as boolean; }
    }

    // 품절 처리 (매장별)
    if (typeof body.isSoldOut === "boolean" && typeof body.storeId === "string" && body.storeId) {
      await sbStoreRepo.updateSoldOut(body.storeId, menuId, body.isSoldOut);
    }

    // 메뉴 정보 수정 (이름·가격·사진·순서·노출)
    if (Object.keys(menuData).length > 0) {
      await sbMenuRepo.updateMenu(menuId, menuData);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/menus]", err);
    return NextResponse.json({ error: "서버 오류", detail: String(err) }, { status: 500 });
  }
}
