import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "@/lib/gbrick/services/orderService";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const body = await req.json();
  const { status, note } = body;

  if (!status || !Object.values(GbOrderStatus).includes(status as GbOrderStatus)) {
    return NextResponse.json({ error: "유효하지 않은 상태값" }, { status: 400 });
  }

  if (IS_MOCK_MODE) {
    return NextResponse.json({
      order: { id: params.orderId, status, note, updatedAt: new Date().toISOString() },
      mock: true,
    });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const order = await updateOrderStatus(params.orderId, status as GbOrderStatus, user.id, note);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    console.error("[PATCH /api/gbrick/orders/:id/status]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
