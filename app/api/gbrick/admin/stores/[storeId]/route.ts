export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { storeRepo, menuRepo } from "@/lib/gbrick/repositories";
import type { StoreOperatingHours } from "@/lib/gbrick/repositories/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;

    // 카테고리는 항상 조회 (storeId 필터 없음 — 전 매장 공통 메뉴)
    const categoriesPromise = menuRepo.findCategories(storeId);

    // 매장 조회 — Supabase에 없으면 mock 폴백
    let store = await storeRepo.findById(storeId);
    if (!store) {
      try {
        const { mockStoreRepo } = await import("@/lib/gbrick/repositories/mock");
        store = await mockStoreRepo.findById(storeId);
      } catch { /* mock 도 없으면 null */ }
    }

    const categories = await categoriesPromise;

    // 매장도 없으면 404 (mock까지 없는 완전히 모르는 ID)
    if (!store) {
      return NextResponse.json({ error: "매장 없음", storeId }, { status: 404 });
    }

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
