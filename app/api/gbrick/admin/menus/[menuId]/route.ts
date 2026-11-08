export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbMenuRepo, sbStoreRepo } from "@/lib/gbrick/repositories/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params;
    const body = await req.json() as {
      name?: string; nameEn?: string; description?: string;
      basePrice?: number; imageUrl?: string; isSignature?: boolean; isNew?: boolean;
      isSoldOut?: boolean; storeId?: string; sortOrder?: number;
    };

    const { isSoldOut, storeId, ...menuData } = body;

    // 품절 처리 (매장별)
    if (typeof isSoldOut === "boolean" && storeId) {
      await sbStoreRepo.updateSoldOut(storeId, menuId, isSoldOut);
    }

    // 메뉴 정보 수정 (가격·사진·이름·순서 등)
    if (Object.keys(menuData).length > 0) {
      await sbMenuRepo.updateMenu(menuId, menuData);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/menus]", err);
    return NextResponse.json({ error: "서버 오류", detail: String(err) }, { status: 500 });
  }
}
