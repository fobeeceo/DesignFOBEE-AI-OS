export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { menuRepo, storeRepo } from "@/lib/gbrick/repositories";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const body = await req.json() as {
      name?: string; nameEn?: string; description?: string;
      basePrice?: number; imageUrl?: string; isSignature?: boolean; isNew?: boolean;
      isSoldOut?: boolean; storeId?: string;
    };

    const { isSoldOut, storeId, ...menuData } = body;

    // 품절 처리 (매장별)
    if (typeof isSoldOut === "boolean" && storeId) {
      await storeRepo.updateSoldOut(storeId, menuId, isSoldOut);
    }

    // 메뉴 정보 수정
    if (Object.keys(menuData).length > 0) {
      await menuRepo.updateMenu(menuId, menuData);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/menus]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
