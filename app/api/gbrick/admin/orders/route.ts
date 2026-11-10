export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { sbOrderRepo } from "@/lib/gbrick/repositories/supabase";

// GET /api/gbrick/admin/orders?storeId=xxx&status=PENDING
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const rawStatus = searchParams.get("status") ?? undefined;
  const status = rawStatus as GbOrderStatus | undefined;

  if (!storeId) {
    return NextResponse.json({ error: "storeId 필수" }, { status: 400 });
  }

  try {
    const orders = await sbOrderRepo.findByStore(storeId, status);
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/gbrick/admin/orders]", err);
    // 테이블 없으면 빈 배열 반환 (앱이 깨지지 않도록)
    if (message.includes("does not exist") || message.includes("relation")) {
      return NextResponse.json({ orders: [], _warn: "gb_orders 테이블 미생성" }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
