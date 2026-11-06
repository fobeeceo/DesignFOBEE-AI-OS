export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { orderRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId 필요" }, { status: 400 });

  if (IS_MOCK_MODE) {
    // Import MOCK_RECENT_ORDERS via dynamic import to avoid circular
    const { MOCK_RECENT_ORDERS } = await import("@/lib/gbrick/mockData");
    return NextResponse.json({ orders: MOCK_RECENT_ORDERS, mock: true });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const statusParam = searchParams.get("status") as GbOrderStatus | null;
    const orders = await orderRepo.findByStore(storeId, statusParam ?? undefined);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/gbrick/store/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
