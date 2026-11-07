import { NextRequest, NextResponse } from "next/server";
import { storeRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "ACTIVE";

  // Supabase 시도
  try {
    const stores = await storeRepo.findMany(status);
    return NextResponse.json({ stores, mock: IS_MOCK_MODE });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/gbrick/stores] Supabase 오류:", msg);

    // Supabase 실패 시 Mock 폴백 (앱이 항상 매장을 표시하도록)
    try {
      const { mockStoreRepo } = await import("@/lib/gbrick/repositories/mock");
      const stores = await mockStoreRepo.findMany(status);
      return NextResponse.json({ stores, mock: true, fallback: true, reason: msg });
    } catch {
      return NextResponse.json({ stores: [], mock: true, error: msg }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    if (IS_MOCK_MODE) {
      return NextResponse.json({ error: "DB 연결 필요" }, { status: 503 });
    }

    const body = await req.json();
    const { code, name, address, ownerName, phone, pointRate, stampGoal } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: "code, name, address는 필수입니다" }, { status: 400 });
    }

    // POST는 HQ 전용 — Supabase repo에 create 없으면 직접 호출
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
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
