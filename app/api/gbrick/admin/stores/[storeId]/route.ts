export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { storeRepo, menuRepo } from "@/lib/gbrick/repositories";
import type { StoreOperatingHours } from "@/lib/gbrick/repositories/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;

    // 카테고리는 항상 조회 (storeId 필터 없음 — 전 매장 공통 메뉴)
    const categoriesPromise = menuRepo.findCategories(storeId);

    // 매장 조회 — 없으면 가상 store 객체 사용 (카테고리/메뉴는 항상 로드)
    let store = await storeRepo.findById(storeId);
    if (!store) {
      store = {
        id: storeId,
        name: "지브릭커피",
        status: "ACTIVE",
        address: "",
        phone: "",
        imageUrl: null,
        operatingHours: null,
      } as unknown as Awaited<ReturnType<typeof storeRepo.findById>>;
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
    const updated = await storeRepo.update(storeId, body);
    return NextResponse.json({ store: updated });
  } catch (err) {
    console.error("[PATCH /api/gbrick/admin/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
