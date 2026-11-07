export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { storeRepo, menuRepo } from "@/lib/gbrick/repositories";
import type { StoreOperatingHours } from "@/lib/gbrick/repositories/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;
    const [store, categories] = await Promise.all([
      storeRepo.findById(storeId),
      menuRepo.findCategories(storeId),
    ]);
    if (!store) return NextResponse.json({ error: "매장 없음" }, { status: 404 });
    return NextResponse.json({ store, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/gbrick/admin/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
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
