import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/gbrick/services/orderService";
import { orderRepo } from "@/lib/gbrick/repositories";
import { IS_MOCK_MODE, MOCK_RECENT_ORDERS } from "@/lib/gbrick/mockData";

export async function GET(_req: NextRequest) {
  if (IS_MOCK_MODE) {
    return NextResponse.json({ orders: MOCK_RECENT_ORDERS, mock: true });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const orders = await orderRepo.findByCustomer(user.id, 20);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/gbrick/orders]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, items, pickupName, note, pointUsed = 0, couponIssueId } = body;

  if (!storeId || !items?.length) {
    return NextResponse.json({ error: "storeId와 items는 필수입니다" }, { status: 400 });
  }

  if (IS_MOCK_MODE) {
    const mockOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: `GB${Date.now().toString().slice(-10)}`,
      storeId,
      status: "PENDING",
      finalAmount: items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0) - pointUsed,
      pickupName: pickupName ?? "손님",
      items,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ order: mockOrder, mock: true }, { status: 201 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    console.error("[POST /api/gbrick/orders]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
