export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbStoreRepo, sbMenuRepo } from "@/lib/gbrick/repositories/supabase";
import type { StoreOperatingHours } from "@/lib/gbrick/repositories/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;

    const categoriesPromise = sbMenuRepo.findCategories(storeId);

    // 매장 조회 — 없으면 가상 store 객체 사용 (카테고리/메뉴는 항상 로드)
    let store = await sbStoreRepo.findById(storeId);
    if (!store) {
      store = {
        id: storeId,
        name: "지브릭커피",
        status: "ACTIVE",
        address: "",
        phone: "",
        imageUrl: null,
        operatingHours: null,
      } as unknown as Awaited<ReturnType<typeof sbStoreRepo.findById>>;
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
