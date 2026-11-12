export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbStoreRepo, sbMenuRepo } from "@/lib/gbrick/repositories/supabase";
import type { StoreOperatingHours } from "@/lib/gbrick/repositories/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;

    const categoriesPromise = sbMenuRepo.findCategories(storeId);

    // 매장 조회 — 없으면 null 반환 (POS가 매장 선택 화면으로 이동)
    const store = await sbStoreRepo.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "STORE_NOT_FOUND", storeId }, { status: 404 });
    }

    const categories = await categoriesPromise;

    return NextResponse.json({ store, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/gbrick/admin/stores]", err);
    return NextResponse.json({ error: "서버 오류", detail: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;
    const body = await req.json() as { operatingHours?: StoreOperatingHours; phone?: string; imageUrl?: string };
    const updated = await sbStoreRepo.update(storeId, body);
    return NextResponse.json({ store: updated });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
