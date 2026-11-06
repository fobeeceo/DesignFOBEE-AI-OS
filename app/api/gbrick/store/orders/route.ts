import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { orderRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const statusParam = searchParams.get("status") as GbOrderStatus | null;

    if (!storeId) return NextResponse.json({ error: "storeId 필요" }, { status: 400 });

    const orders = await orderRepo.findByStore(storeId, statusParam ?? undefined);
    return NextResponse.json({ orders, mock: IS_MOCK_MODE });
  } catch (err) {
    console.error("[GET /api/gbrick/store/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
