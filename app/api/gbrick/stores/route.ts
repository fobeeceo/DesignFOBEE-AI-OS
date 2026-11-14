export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sbStoreRepo } from "@/lib/gbrick/repositories/supabase";

// lat/lng 없는 매장 자동 시딩 (백그라운드, 블로킹 없음)
async function autoSeedCoords(stores: Array<{ id: string; name?: string | null; address?: string | null; lat?: number | null; lng?: number | null }>) {
  const missing = stores.filter(s => !s.lat || !s.lng);
  if (missing.length === 0) return;
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/gbrick/admin/geocode`, { method: "POST" });
  } catch { /* 조용히 실패 */ }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "ACTIVE";

  try {
    const stores = await sbStoreRepo.findMany(status);
    // gb_stores가 비어있으면 기본 매장 하나를 반환 (고객 앱이 항상 작동하도록)
    if (!stores || stores.length === 0) {
      const { mockStoreRepo } = await import("@/lib/gbrick/repositories/mock");
      const mockStores = await mockStoreRepo.findMany(status);
      return NextResponse.json({ stores: mockStores, mock: true, reason: "empty_gb_stores" });
    }
    // 좌표 없는 매장이 있으면 백그라운드에서 자동 시딩
    autoSeedCoords(stores).catch(() => {});
    return NextResponse.json({ stores });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/gbrick/stores] Supabase 오류:", msg);
    // 폴백: mock 매장 반환
    try {
      const { mockStoreRepo } = await import("@/lib/gbrick/repositories/mock");
      const stores = await mockStoreRepo.findMany(status);
      return NextResponse.json({ stores, mock: true, reason: msg });
    } catch {
      return NextResponse.json({ stores: [], error: msg }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, address, ownerName, phone, pointRate, stampGoal } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: "code, name, address는 필수입니다" }, { status: 400 });
    }

    // POST는 HQ 전용 — Supabase repo에 create 없으면 직접 호출
    const { createClient } = await import("@supabase/supabase-js");
    const gbrickUrl = "https://rzgrkrffksqdeztzxyrt.supabase.co";
    const gbrickKey =
      process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(gbrickUrl, gbrickKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: store, error } = await sb
      .from("gb_stores")
      .insert({ code, name, address, ownerName, phone, pointRate: pointRate ?? 0.03, stampGoal: stampGoal ?? 10, brandName: "GBRICK Coffee", operatingHours: {} })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gbrick/stores]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
