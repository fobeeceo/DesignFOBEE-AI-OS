import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/gbrick/services/orderService";
import { orderRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const orders = await orderRepo.findByCustomer(user.id, 20);
    return NextResponse.json({ orders, mock: IS_MOCK_MODE });
  } catch (err) {
    console.error("[GET /api/gbrick/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { storeId, items, pickupName, note, pointUsed = 0, couponIssueId } = body;

    if (!storeId || !items?.length) {
      return NextResponse.json({ error: "storeId와 items는 필수입니다" }, { status: 400 });
    }

    const order = await createOrder({
      storeId,
      customerId: user?.id,
      isGuest: !user,
      items,
      pickupName,
      note,
      pointUsed,
      couponIssueId,
    });

    return NextResponse.json({ order, mock: IS_MOCK_MODE }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    console.error("[POST /api/gbrick/orders]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
