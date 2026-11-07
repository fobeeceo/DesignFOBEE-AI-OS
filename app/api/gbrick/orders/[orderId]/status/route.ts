import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";
import { orderRepo } from "@/lib/gbrick/repositories";

export const dynamic = "force-dynamic";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["ACCEPTED", "CANCELLED"],
  ACCEPTED:  ["READY", "CANCELLED"],
  READY:     ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status } = await req.json();

    if (IS_MOCK_MODE) {
      return NextResponse.json({ ok: true, status, mock: true });
    }

    const order = await orderRepo.findById(params.orderId);
    if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `${order.status} → ${status} 전환 불가` },
        { status: 400 }
      );
    }

    const updated = await orderRepo.updateStatus(params.orderId, status, "store_staff");
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error(`[PATCH /api/gbrick/orders/${params.orderId}/status]`, err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
