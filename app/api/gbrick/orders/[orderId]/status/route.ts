export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { GbOrderStatus } from "@prisma/client";
import { sbOrderRepo, earnOrderPoints } from "@/lib/gbrick/repositories/supabase";
import { MEMBER_POINT_RATE } from "@/lib/gbrick/launch";
import { calcPointEarn } from "@/lib/gbrick/pointPolicy";
import { sendOrderStatusPush } from "@/lib/gbrick/push";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "READY", "CANCELLED"], // POS는 접수 다음에 바로 "조리완료"를 누른다
  PREPARING: ["READY", "CANCELLED"],
  READY:     ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status, note } = await req.json() as { status: string; note?: string };

    const order = await sbOrderRepo.findById(orderId);
    if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `${order.status} → ${status} 전환 불가` }, { status: 400 });
    }

    const updated = await sbOrderRepo.updateStatus(orderId, status as GbOrderStatus, "store_staff", note);
    // 픽업(결제 완료)이 확인된 주문만 적립한다 — 주문만 하고 오지 않은 경우엔 적립하지 않는다
    if (status === "PICKED_UP" && order.customerId) {
      try {
        await earnOrderPoints({ id: order.id, customerId: order.customerId, finalAmount: order.finalAmount }, calcPointEarn(order.finalAmount, MEMBER_POINT_RATE));
      } catch (err) {
        console.error("[order status] 포인트 적립 실패 — 주문 상태는 정상 변경됨:", order.id, err instanceof Error ? err.message : err);
      }
    }
    await sendOrderStatusPush({ id: order.id, orderNumber: order.orderNumber, storeId: order.storeId }, status);
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error("[PATCH /api/gbrick/orders/status]", err);
    return NextResponse.json({ error: "서버 오류", detail: String(err) }, { status: 500 });
  }
}
